/**
 * Google Earth Engine service wrapper.
 *
 * Credentials are loaded exclusively from environment variables — never from a
 * committed file.  See the README for setup instructions.
 *
 * Environment variables required (one of):
 *   GEE_SERVICE_ACCOUNT_KEY   — full JSON of the service account key (for
 *                               deployed/CI environments)
 *
 * Or for local development only (never commit these):
 *   GEE_SERVICE_ACCOUNT_EMAIL — service account email
 *   GEE_PRIVATE_KEY           — private key (newlines as \n)
 */

/**
 * Google Earth Engine service wrapper.
 *
 * Credentials are loaded from the service account key JSON file:
 *   gen-lang-client-0618349617-225757a98489.json
 *
 * Place this file in the root of your project (next to package.json) and
 * ensure it is listed in .gitignore — never commit service account keys.
 */

import fs   from 'fs';
import path from 'path';
import type {
  BuildingData,
  ApiErrorResponse,
  GeoJSONGeometry,
} from '../types';

let ee: any = null;

const KEY_FILE_NAME = 'gen-lang-client-0618349617-225757a98489.json';

function loadCredentials(): object {
  // Resolve relative to the project root (process.cwd()), falling back to the
  // directory of this compiled file if the key isn't found at the CWD.
  const cwdPath      = path.resolve(process.cwd(), KEY_FILE_NAME);
  const fileDirPath  = path.resolve(__dirname, '..', '..', KEY_FILE_NAME);
  const keyFilePath  = fs.existsSync(cwdPath) ? cwdPath : fileDirPath;

  if (!fs.existsSync(keyFilePath)) {
    throw new Error(
      `Service account key file not found.\n` +
      `Expected at: ${cwdPath}\n` +
      `Make sure "${KEY_FILE_NAME}" is present in the project root and is listed in .gitignore.`,
    );
  }

  try {
    const raw = fs.readFileSync(keyFilePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(
      `Failed to read or parse service account key file at "${keyFilePath}": ${err}`,
    );
  }
}

class EarthEngineService {
  private initialized             = false;
  private initializationPromise: Promise<void> | null = null;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    if (this.initializationPromise) return this.initializationPromise;
    this.initializationPromise = this._performInitialization();
    return this.initializationPromise;
  }

  private async _performInitialization(): Promise<void> {
    try {
      if (!ee) {
        const mod = await import('@google/earthengine');
        ee = mod.default as unknown as { data: any; Geometry: any; initialize: any; };

      }

      const serviceAccountKey = loadCredentials();
      console.log('Authenticating with Google Earth Engine…');

      await new Promise<void>((resolve, reject) =>
        ee.data.authenticateViaPrivateKey(
          serviceAccountKey,
          () => { console.log('EE auth OK'); resolve(); },
          (err: any) => reject(new Error(`EE auth failed: ${err}`)),
        ),
      );

      await new Promise<void>((resolve, reject) =>
        ee.initialize(
          null, null,
          () => { console.log('EE init OK'); this.initialized = true; resolve(); },
          (err: any) => reject(new Error(`EE init failed: ${err}`)),
        ),
      );
    } catch (error) {
      console.error('Failed to initialise Earth Engine:', error);
      this.initialized = false;
      this.initializationPromise = null;
      throw error;
    }
  }

  isInitialized(): boolean { return this.initialized; }

  async getBuildingFootprint(
    latitude: number,
    longitude: number,
  ): Promise<BuildingData | ApiErrorResponse> {
    if (!this.initialized) throw new Error('Earth Engine not initialised');

      // Earth Engine module is untyped; keep it loose for runtime.
      const eeAny = ee as any;


    try {
      console.log(`Querying building footprint: ${latitude}, ${longitude}`);

    const userPoint  = eeAny.Geometry.Point([longitude, latitude]);
      const searchArea = userPoint.buffer(10); // 10 m buffer

      const footprints = eeAny.FeatureCollection('GOOGLE/Research/open-buildings/v3/polygons');
      const hits       = footprints.filterBounds(searchArea);

      const count: number = await new Promise((resolve, reject) =>
        hits.size().evaluate((n: number, err: any) =>
          err ? reject(new Error(`Count error: ${err}`)) : resolve(n),
        ),
      );

      if (count === 0) {
        return { error: 'No building footprint found at the specified coordinates', code: 'NO_BUILDING_FOUND' };
      }

      const buildingData: any = await new Promise((resolve, reject) =>
        hits.first().evaluate((data: any, err: any) =>
          err ? reject(new Error(`Evaluate error: ${err}`)) : resolve(data),
        ),
      );

      if (!buildingData) return { error: 'No building data available', code: 'NO_DATA' };

      const area: number = await new Promise((resolve, reject) =>
        eeAny.Geometry(buildingData.geometry).area().evaluate((v: number, err: any) =>
          err ? reject(new Error(`Area error: ${err}`)) : resolve(v),
        ),
      );

      // Normalize EE geometry into a GeoJSON Polygon that Leaflet can render.
      // Leaflet expects: { type: 'Polygon', coordinates: [ [ [lng,lat], ... ] ] }
      // Open Buildings polygons sometimes come back with slightly different nesting.
      const rawGeometry: unknown = buildingData.geometry;

      // Try to extract a polygon ring from common EE/GeoJSON shapes.
      // Accept:
      // 1) Polygon: { type: 'Polygon', coordinates: [ring] }
      // 2) MultiPolygon: { type: 'MultiPolygon', coordinates: [[ring1, ring2?], ...] }
      // 3) Geometry collections (best-effort)
      const extractPolygonRing = (geom: any): number[][] | null => {
        if (!geom) return null;
        if (geom.type === 'Polygon' && Array.isArray(geom.coordinates) && Array.isArray(geom.coordinates[0])) {
          // coordinates: [ring]
          return geom.coordinates[0];
        }
        if (geom.type === 'MultiPolygon' && Array.isArray(geom.coordinates) && Array.isArray(geom.coordinates[0]) && Array.isArray(geom.coordinates[0][0])) {
          // coordinates: [ [ring] , ... ]
          return geom.coordinates[0][0];
        }
        if (Array.isArray(geom.geometries)) {
          for (const g of geom.geometries) {
            const ring = extractPolygonRing(g as unknown);
            if (ring) return ring;
          }
        }
        return null;
      };

const ring: number[][] | null = extractPolygonRing(rawGeometry);

      // If ring is invalid, throw so the caller can fall back to OSM.
      if (!ring || !Array.isArray(ring) || ring.length < 3) {
        return {
          error: 'Invalid building polygon geometry from Earth Engine',
          code: 'EE_INVALID_GEOMETRY',
        };
      }

      // Ensure coordinates are [lng,lat] pairs.
      // (Open Buildings GeoJSON should already be [lon,lat], but we guard against [lat,lng]).
      const normalizedRing: number[][] = ring
        .map((pt: any) => {
          if (!Array.isArray(pt) || pt.length < 2) return null;
          const a = Number(pt[0]);
          const b = Number(pt[1]);
          if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
          // Heuristic: latitude is [-90,90], longitude is [-180,180].
          const looksLikeLngLat = Math.abs(a) <= 180 && Math.abs(b) <= 90;
          const looksLikeLatLng = Math.abs(a) <= 90 && Math.abs(b) <= 180;
          if (looksLikeLngLat) return [a, b];
          if (looksLikeLatLng) return [b, a];
          return [a, b];
        })
        .filter((x: any): x is number[] => Array.isArray(x));

      // Close the ring if needed.
      const first = normalizedRing[0];
      const last = normalizedRing[normalizedRing.length - 1];
      if (first && last && (first[0] !== last[0] || first[1] !== last[1])) {
        normalizedRing.push([...first]);
      }

      const result: BuildingData = {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [normalizedRing],
          },
          id: buildingData.id || `building_${Date.now()}`,
          properties: {
            ...buildingData.properties,
            area: Math.round(area * 100) / 100,
            dataSource: 'Google Open Buildings v3',
            queryTime: new Date().toISOString(),
            coordinates: `${latitude}, ${longitude}`,
          },
        }],
      };

      console.log(`Building found, area: ${area.toFixed(1)} m²`);
      return result;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('getBuildingFootprint error:', error);
      throw new Error(`Failed to get building footprint: ${msg}`);
    }
  }

  async calculateBuildingArea(geometry: GeoJSONGeometry): Promise<number> {
    if (!this.initialized) throw new Error('Earth Engine not initialised');
    const eeAny = ee as any;
    const area: number = await new Promise((resolve, reject) =>
      eeAny.Geometry(geometry).area().evaluate((v: number, err: any) =>
        err ? reject(new Error(`Area error: ${err}`)) : resolve(v),
      ),
    );
    return Math.round(area * 100) / 100;
  }
}

export const earthEngineService = new EarthEngineService();