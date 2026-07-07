import { NextRequest, NextResponse } from 'next/server';
import { earthEngineService }        from '../../../lib/earthEngine';
import { getOSMBuildingFootprint }   from '../../../lib/osmBuildings';
import { getFromCache, setCache, clearCache }    from '../../../lib/cache';

import { createCacheKey }            from '../../../lib/utils';
import type { BuildingData, ApiErrorResponse } from '../../../types';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Building footprints are static — cache for 24 hours
const CACHE_TTL_SECONDS = 86_400;

// How long to wait for Earth Engine before giving up and trying OSM (ms)
const EE_TIMEOUT_MS = 12_000;

/** Wraps a promise with a hard timeout. */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms),
    ),
  ]);
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse<BuildingData | ApiErrorResponse | { requiresManualEntry: true; message: string }>> {
  try {
    const body = await request.json();
    const { latitude, longitude, clearCache: clearCacheRequest } = body || {};

    // Debug: allow explicit cache flush via request payload
    if (clearCacheRequest === true) {
      clearCache();
      // Note: no cache key is returned; caller will re-fetch fresh data.
    }

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return NextResponse.json(
        { error: 'Invalid coordinates', code: 'INVALID_INPUT' },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    // ── 1. Cache lookup ───────────────────────────────────────────────────────
    const cacheKey = createCacheKey(latitude, longitude);
    const cached   = getFromCache(cacheKey) as BuildingData | undefined;
    if (cached) {
      console.log('Building footprint served from cache');
      return NextResponse.json(
        { ...cached, cached: true, cacheTime: new Date().toISOString() },
        { status: 200, headers: CORS_HEADERS },
      );
    }

    // ── 2. Try Google Earth Engine (primary) ──────────────────────────────────
    let eeResult: unknown | BuildingData | ApiErrorResponse | null = null;
    try {
      if (!earthEngineService.isInitialized()) {
        await withTimeout(earthEngineService.initialize(), EE_TIMEOUT_MS, 'EE init');
      }

      eeResult = await earthEngineService.getBuildingFootprint(latitude, longitude);
      console.log(eeResult);
    }
    catch (eeError) {
      console.warn('Earth Engine unavailable, trying OSM fallback:', (eeError as Error).message);
    }

    // If EE succeeded and found a building, use it
    if (eeResult && typeof eeResult === 'object' && !('error' in (eeResult as ApiErrorResponse))) {
      setCache(cacheKey, eeResult, CACHE_TTL_SECONDS);
      return NextResponse.json(
        { ...(eeResult as BuildingData), dataSource: 'Google Earth Engine' },
        { status: 200, headers: CORS_HEADERS },
      );
    }

    // ── 3. Try OSM Overpass API (fallback) ────────────────────────────────────
    console.log('Trying OSM Overpass fallback…');
    const osmResult = await getOSMBuildingFootprint(latitude, longitude);

    if (!('error' in osmResult)) {
      setCache(cacheKey, osmResult, CACHE_TTL_SECONDS);
      return NextResponse.json(
        { ...osmResult, dataSource: 'OpenStreetMap' },
        { status: 200, headers: CORS_HEADERS },
      );
    }

    // ── 4. Both failed — ask user to enter roof area manually ─────────────────
    console.warn('Both EE and OSM failed. Returning manual entry prompt.');
    return NextResponse.json(
      {
        requiresManualEntry: true,
        message:
          'We could not automatically detect a building at this location. ' +
          'Please enter your roof area manually to continue.',
      },
      { status: 200, headers: CORS_HEADERS },
    );

  } catch (error) {
    console.error('Unexpected error in /api/building-footprint:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', code: 'INTERNAL_ERROR' },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
