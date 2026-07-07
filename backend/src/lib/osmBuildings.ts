/**
 * OSM Overpass API fallback for building footprints.
 *
 * Used when Google Earth Engine fails, times out, or finds nothing.
 * No API key needed. Works well for Delhi and most Indian cities.
 */

import type { BuildingData, ApiErrorResponse } from '../types';

// Overpass public endpoint — no auth required
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

// How long to wait for Overpass before giving up (ms)
const OVERPASS_TIMEOUT_MS = 8_000;

/**
 * Compute the area of a GeoJSON polygon (in sq metres) using the
 * Shoelace formula on spherical Earth coordinates.
 * Accurate to within ~0.5% for building-scale polygons.
 */
function polygonAreaSqm(coords: number[][]): number {
  const R = 6_371_000; // Earth radius in metres
  const toRad = (d: number) => (d * Math.PI) / 180;

  let area = 0;
  const n = coords.length;
  for (let i = 0; i < n - 1; i++) {
    const [lon1, lat1] = coords[i];
    const [lon2, lat2] = coords[i + 1];
    area +=
      toRad(lon2 - lon1) *
      (2 + Math.sin(toRad(lat1)) + Math.sin(toRad(lat2)));
  }
  return Math.abs((area * R * R) / 2);
}

/**
 * Fetch building footprint from OSM Overpass API.
 *
 * Strategy:
 *  1. Query all 'building' ways within a 30 m radius of the point
 *  2. Pick the one whose centroid is closest to the query point
 *  3. Return it as a GeoJSON FeatureCollection matching BuildingData shape
 */
export async function getOSMBuildingFootprint(
  latitude: number,
  longitude: number,
): Promise<BuildingData | ApiErrorResponse> {
  // Overpass QL — fetch building ways with geometry in a 30 m radius
  const query = `
    [out:json][timeout:10];
    way["building"](around:50,${latitude},${longitude});
    out body geom;
  `.trim();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), OVERPASS_TIMEOUT_MS);

  try {
    const response = await fetch(OVERPASS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      return { error: 'OSM Overpass API request failed', code: 'OSM_API_ERROR' };
    }

    const data = await response.json();
    const elements: Array<{ geometry?: Array<{ lat: number; lon: number }>; id?: string | number; tags?: Record<string, unknown> }> = data.elements ?? [];

    if (elements.length === 0) {
      return { error: 'No building found at this location in OpenStreetMap', code: 'NO_BUILDING_FOUND' };
    }

    // ── Pick building for the clicked point ──────────────────────────────
    // Heuristic:
    //  1) If the point lies inside any candidate polygon(s), prefer that.
    //  2) If multiple match, pick the one whose centroid is closest.
    //  3) If none match (edge cases), fall back to centroid-distance.

    const pointInPolygon = (pointLat: number, pointLon: number, polygonRing: Array<{ lat: number; lon: number }>): boolean => {
      // Ray casting in lon/lat space.
      // polygonRing is [{lat, lon}, ...]
      const x = pointLon;
      const y = pointLat;

      let inside = false;
      for (let i = 0, j = polygonRing.length - 1; i < polygonRing.length; j = i++) {
        const xi = polygonRing[i].lon;
        const yi = polygonRing[i].lat;
        const xj = polygonRing[j].lon;
        const yj = polygonRing[j].lat;

        const intersect = ((yi > y) !== (yj > y)) &&
          (x < ((xj - xi) * (y - yi)) / (yj - yi + 0.0) + xi);
        if (intersect) inside = !inside;
      }
      return inside;
    };

    const candidates = elements.filter(
      (el): el is { geometry: Array<{ lat: number; lon: number }>; id?: string | number; tags?: Record<string, unknown> } =>
        !!el.geometry && el.geometry.length >= 3,
    );

    type Scored = {
      el: {
        geometry: Array<{ lat: number; lon: number }>;
        id?: string | number;
        tags?: Record<string, unknown>;
      };
      centroidDist: number;
      contains: boolean;
    };
    const scored: Scored[] = candidates.map((el) => {
      const avgLat = el.geometry.reduce((s: number, n) => s + n.lat, 0) / el.geometry.length;
      const avgLon = el.geometry.reduce((s: number, n) => s + n.lon, 0) / el.geometry.length;
      const centroidDist = Math.sqrt((avgLat - latitude) ** 2 + (avgLon - longitude) ** 2);
      const contains = pointInPolygon(latitude, longitude, el.geometry);
      return { el, centroidDist, contains };
    });

    const containsMatches = scored.filter(s => s.contains);
    const bestElement = (() => {
      if (containsMatches.length > 0) {
        return containsMatches.sort((a, b) => a.centroidDist - b.centroidDist)[0].el;
      }
      return scored.sort((a, b) => a.centroidDist - b.centroidDist)[0]?.el ?? null;
    })();

    if (!bestElement) {
      return { error: 'Could not process building geometry from OSM', code: 'GEOMETRY_ERROR' };
    }

    // ── Convert OSM geometry → GeoJSON ────────────────────────────────────────
    // OSM uses [{lat, lon}], GeoJSON needs [[lon, lat]]
    const ring: number[][] = bestElement.geometry.map((n) => [n.lon, n.lat]);
    // Close the ring if not already closed
    const first = ring[0], last = ring[ring.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) ring.push([...first]);

    const area = polygonAreaSqm(ring);

    const result: BuildingData = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Polygon', coordinates: [ring] } as unknown as { type: 'Polygon'; coordinates: number[][][] },
          id: `osm_${bestElement.id}`,
          properties: {
            area: Math.round(area * 100) / 100,
            dataSource: 'OpenStreetMap (Overpass API)',
            queryTime: new Date().toISOString(),
            coordinates: `${latitude}, ${longitude}`,
            osmId: bestElement.id,
            osmTags: bestElement.tags ?? {},
          },
        },
      ],
    };

    console.log(`OSM fallback: found building ${bestElement.id}, area ${area.toFixed(1)} m²`);
    return result;

  } catch (error: unknown) {
    const err = (error as { name?: string } | null);
    // Treat AbortError specially; otherwise return generic failure.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const _debug = error;
    clearTimeout(timer);
    if (err?.name === 'AbortError') {
      return { error: 'OSM Overpass API timed out', code: 'OSM_TIMEOUT' };
    }
    console.error('OSM fallback error:', error);
    return { error: 'OSM fallback failed', code: 'OSM_ERROR' };
  }
}
