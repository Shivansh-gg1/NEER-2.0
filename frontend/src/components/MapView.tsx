import React, { useEffect, useRef, useState, useCallback } from 'react';

import { MapContainer, TileLayer, Marker, GeoJSON, useMap, useMapEvents, LayersControl } from 'react-leaflet';

import type { Map as LeafletMap } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import L from 'leaflet';
import '@geoman-io/leaflet-geoman-free';

// --- Leaflet Icon Fix ---
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

import {
  refineRoofPolygonFromCrop,
  pixelToLatLng,
  latLngToPixel,
  type LeafletLatLng,
} from '../services/vision/roofRefinement';


// --- Type Definitions ---
interface MapViewProps {
  center?: { lat: number; lng: number };
  polygonData?: any;
  onLocationChange?: (coords: { lat: number; lng: number }) => void;
  onAreaUpdate?: (area: number) => void;
}


// --- Helper: compute geodesic area in sq-metres from a LatLng ring ---
function computeArea(polygon: L.Polygon): number {
  const latlngs = polygon.getLatLngs() as L.LatLng[][];
  const ring = latlngs[0];
  if (!ring || ring.length < 3) return 0;

  if ((L as any).PM?.Utils?.getGeodesicArea) {
    return (L as any).PM.Utils.getGeodesicArea(ring);
  }

  const R = 6378137;
  let area = 0;
  const n = ring.length;
  for (let i = 0; i < n; i++) {
    const p1 = ring[i];
    const p2 = ring[(i + 1) % n];
    area += (p2.lng - p1.lng) * (Math.PI / 180) *
      (2 + Math.sin(p1.lat * Math.PI / 180) + Math.sin(p2.lat * Math.PI / 180));
  }
  return Math.abs(area * R * R / 2);
}

// ─── Satellite tile fetcher for OpenCV ───────────────────────────────────────
/**
 * Build a canvas from Esri satellite tiles covering the current map bounds.
 * Uses fetch + crossOrigin so the canvas stays origin-clean for getImageData().
 * Falls back to the rendered DOM tiles if any tile fetch fails.
 */
async function buildSatelliteCanvas(map: L.Map): Promise<HTMLCanvasElement | null> {
  const container = map.getContainer();
  const W = container.clientWidth || 600;
  const H = container.clientHeight || 400;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Collect all currently-rendered tile elements from the satellite pane
  // (works whether satellite or street is active — we look for all loaded tiles)
  const domTiles = container.querySelectorAll(
    '.leaflet-tile:not(.leaflet-tile-loading)',
  ) as NodeListOf<HTMLImageElement>;

  const mapRect = container.getBoundingClientRect();
  let drawn = 0;

  // First try: re-fetch each tile as a same-origin image (CORS)
  const fetchPromises = Array.from(domTiles).map(async (img) => {
    const src = img.src;
    if (!src) return;

    // Replace OSM tiles with Esri satellite for the same tile coordinates
    // Esri tiles don't require authentication and serve CORS headers.
    const esriSrc = src.includes('arcgisonline.com')
      ? src  // already satellite
      : (() => {
        // Parse z/y/x from OSM URL pattern and rebuild Esri URL
        const m = src.match(/\/(\d+)\/(\d+)\/(\d+)\.png/);
        if (!m) return src;
        const [, z, x, y] = m;
        return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;
      })();

    try {
      const blob = await fetch(esriSrc, { mode: 'cors' }).then((r) => r.blob());
      const blobUrl = URL.createObjectURL(blob);
      const tileImg = new Image();
      await new Promise<void>((resolve, reject) => {
        tileImg.onload = () => resolve();
        tileImg.onerror = () => reject();
        tileImg.src = blobUrl;
      });
      const rect = img.getBoundingClientRect();
      ctx.drawImage(tileImg, rect.left - mapRect.left, rect.top - mapRect.top, rect.width, rect.height);
      URL.revokeObjectURL(blobUrl);
      drawn++;
    } catch {
      // CORS or network failure — try drawing the DOM tile directly (may taint canvas)
      try {
        const rect = img.getBoundingClientRect();
        ctx.drawImage(img, rect.left - mapRect.left, rect.top - mapRect.top, rect.width, rect.height);
        drawn++;
      } catch { /* fully skip this tile */ }
    }
  });

  await Promise.allSettled(fetchPromises);
  return drawn > 0 ? canvas : null;
}

// ─── OpenCV crop-and-refine helper ────────────────────────────────────────────
async function runOpencvRefinement(
  map: L.Map,
  polygon: L.Polygon,
): Promise<L.LatLng[] | null> {
  try {
    const satCanvas = await buildSatelliteCanvas(map);
    if (!satCanvas) return null;

    let imageData: ImageData;
    try {
      const ctx = satCanvas.getContext('2d')!;
      imageData = ctx.getImageData(0, 0, satCanvas.width, satCanvas.height);
    } catch {
      // Canvas tainted — cannot use for OpenCV
      return null;
    }

    const mapBounds = map.getBounds();
    const cropBounds = {
      north: mapBounds.getNorth(),
      south: mapBounds.getSouth(),
      east: mapBounds.getEast(),
      west: mapBounds.getWest(),
    };

    const ring = (polygon.getLatLngs() as L.LatLng[][])[0];
    if (!ring || ring.length < 3) return null;

    const polygonLatLngs: LeafletLatLng[] = ring.map((ll) => ({ lat: ll.lat, lng: ll.lng }));
    const polygonPixels = polygonLatLngs.map((ll) =>
      latLngToPixel(ll, satCanvas.width, satCanvas.height, cropBounds),
    );

    const result = await refineRoofPolygonFromCrop({
      imageData,
      polygonPixels,
      polygonLatLngs,
      fallbackToOriginal: true,
      opts: {
        cropBounds,
        snapStrength: 0.6,
        maxCorners: 30,
        useHoughLines: true,
        maxAreaChangeFraction: 0.30,
      },
    });

    // Only apply if refinement was accepted (not a fallback)
    if (!result.accepted) return null;

    return result.refinedLatLngs.map((ll) => L.latLng(ll.lat, ll.lng));
  } catch {
    return null;
  }
}

// --- Internal Component for Editable Polygon ---
const EditablePolygonLayer = ({
  data,
  onAreaUpdate,
}: {
  data: any;
  onAreaUpdate?: (area: number) => void;
}) => {
  const geoJsonLayerRef = useRef<L.GeoJSON>(null);
  const onAreaUpdateRef = useRef(onAreaUpdate);
  const map = useMap();
  const [isRefining, setIsRefining] = useState(false);

  useEffect(() => {
    onAreaUpdateRef.current = onAreaUpdate;
  }, [onAreaUpdate]);

  // ── OpenCV refinement trigger ──────────────────────────────────────────
  const runRefinement = useCallback(async () => {
    if (isRefining) return;
    if (!geoJsonLayerRef.current) return;
    const polygon = geoJsonLayerRef.current.getLayers()[0] as L.Polygon;
    if (!polygon) return;

    setIsRefining(true);
    try {
      const refined = await runOpencvRefinement(map, polygon);
      if (!refined || refined.length < 3) return;

      // Update the polygon in-place and recalculate area
      polygon.setLatLngs([refined]);
      polygon.redraw();

      const area = computeArea(polygon);
      if (area > 0) onAreaUpdateRef.current?.(parseFloat(area.toFixed(2)));
    } finally {
      setIsRefining(false);
    }
  }, [map, isRefining]);

  useEffect(() => {
    if (!geoJsonLayerRef.current) return;

    let timerId: ReturnType<typeof setTimeout>;

    timerId = setTimeout(async () => {
      if (!geoJsonLayerRef.current) return;
      const polygon = geoJsonLayerRef.current.getLayers()[0] as L.Polygon;
      if (!polygon) return;

      const pmLayer = (polygon as any).pm;
      if (!pmLayer) return;

      // --- Toolbar ---
      map.pm.addControls({
        position: 'topleft',
        drawMarker: false,
        drawCircleMarker: false,
        drawPolyline: false,
        drawRectangle: false,
        drawPolygon: false,
        drawCircle: false,
        drawText: false,
        editMode: true,
        dragMode: true,
        cutPolygon: true,
        removalMode: true,
        rotateMode: false,
      });

      pmLayer.enable({ allowSelfIntersection: false });

      // --- Area recalculation ---
      const recalcArea = () => {
        const area = computeArea(polygon);
        if (area > 0) {
          onAreaUpdateRef.current?.(parseFloat(area.toFixed(2)));
        }
      };

      polygon.on('pm:markerdragend', recalcArea);
      polygon.on('pm:markerdrag', recalcArea);
      polygon.on('pm:edit', recalcArea);
      polygon.on('pm:dragend', recalcArea);
      polygon.on('pm:vertexadded', recalcArea);
      polygon.on('pm:vertexremoved', recalcArea);
      map.on('pm:edit', recalcArea);
      map.on('pm:markerdragend', recalcArea);

      // ── Run OpenCV refinement once after the map settles ──
      // We wait for the map tiles to load before capturing the canvas.
      const refineOnReady = () => {
        // Small delay so tiles finish rendering
        setTimeout(() => runRefinement(), 600);
      };

      if (map.isLoading()) {
        map.once('load', refineOnReady);
      } else {
        refineOnReady();
      }

      (polygon as any)._neerCleanup = () => {
        polygon.off('pm:markerdragend', recalcArea);
        polygon.off('pm:markerdrag', recalcArea);
        polygon.off('pm:edit', recalcArea);
        polygon.off('pm:dragend', recalcArea);
        polygon.off('pm:vertexadded', recalcArea);
        polygon.off('pm:vertexremoved', recalcArea);
        map.off('pm:edit', recalcArea);
        map.off('pm:markerdragend', recalcArea);
        if (map.pm) map.pm.removeControls();
      };
    }, 0);

    return () => {
      clearTimeout(timerId);
      const polygon = geoJsonLayerRef.current?.getLayers()[0] as any;
      if (polygon?._neerCleanup) {
        polygon._neerCleanup();
        delete polygon._neerCleanup;
      }
    };
  }, [map, data]); // runRefinement is intentionally excluded — called once on mount

  return (
    <>
      <GeoJSON
        ref={geoJsonLayerRef}
        data={data}
        style={{ color: '#dc2626', weight: 2, fillColor: '#ef4444', fillOpacity: 0.4 }}
      />
      {isRefining && (
        <div
          style={{
            position: 'absolute', top: 8, right: 8, zIndex: 1000,
            background: 'rgba(255,255,255,0.85)', borderRadius: 6,
            padding: '4px 10px', fontSize: 12, color: '#1e40af',
            pointerEvents: 'none',
          }}
        >
          🔍 Refining rooftop…
        </div>
      )}
    </>
  );
};

// --- Internal Component for Map Click Events ---
function MapClickEvents({ onLocationChange }: { onLocationChange?: MapViewProps['onLocationChange'] }) {
  useMapEvents({
    click(e) {
      onLocationChange?.(e.latlng);
    },
  });
  return null;
}

function FlyToLocation({ center }: { center: { lat: number; lng: number } }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([center.lat, center.lng], map.getZoom(), { duration: 0.8 });
  }, [center.lat, center.lng, map]);
  return null;
}


// --- Main MapView Component ---
export function MapView({ center, polygonData, onLocationChange, onAreaUpdate }: MapViewProps) {

  if (!center || typeof center.lat !== 'number' || typeof center.lng !== 'number') {
    return (
      <div style={{ height: '100%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#e5e7eb' }}>
        <p className="text-gray-600">Waiting for valid coordinates...</p>
      </div>
    );
  }

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={19}
      minZoom={3}
      maxZoom={23}
      scrollWheelZoom={true}
      wheelPxPerZoomLevel={80}
      doubleClickZoom={true}
      dragging={true}
      zoomControl={true}
      style={{ height: '100%', width: '100%' }}
    >
      <FlyToLocation center={center} />

      <LayersControl position="topright">
        <LayersControl.BaseLayer name="Satellite" checked>
          <TileLayer
            attribution='Tiles &copy; Esri'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            maxNativeZoom={19}
            maxZoom={23}
          />
        </LayersControl.BaseLayer>

        <LayersControl.BaseLayer name="Street Map">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxNativeZoom={19}
            maxZoom={23}
          />
        </LayersControl.BaseLayer>
      </LayersControl>

      {polygonData ? (
        <EditablePolygonLayer
          data={polygonData}
          onAreaUpdate={onAreaUpdate}
        />
      ) : (
        <>
          <Marker position={[center.lat, center.lng]} />
          {onLocationChange && <MapClickEvents onLocationChange={onLocationChange} />}
        </>
      )}
    </MapContainer>
  );
}