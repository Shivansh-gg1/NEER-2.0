import cv from "@techstark/opencv-js";

export type LeafletLatLng = { lat: number; lng: number };

export interface RoofRefinementDebug {
  edgesDataUrl?: string;
  corners?: { x: number; y: number }[];
  contoursCount?: number;
  houghLines?: number;
  rejectionReason?: string;
}

export interface RoofRefinementResult {
  refinedLatLngs: LeafletLatLng[];
  accepted: boolean;
  debug?: RoofRefinementDebug;
}

export interface RefinementOptions {
  debug?: boolean;
  /**
   * Maximum corners via Shi-Tomasi.
   * Reduced to 30 (was 80) to filter noise.
   */
  maxCorners?: number;
  /** Snap strength: 0..1 */
  snapStrength?: number;
  /** Crop geographic bounds the imageData represents. */
  cropBounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  /** Run HoughLinesP for edge straightening. Default true. */
  useHoughLines?: boolean;
  /**
   * Max allowable area change ratio before refinement is rejected.
   * E.g. 0.25 means ±25% area change triggers fallback.
   * Default 0.30.
   */
  maxAreaChangeFraction?: number;
}

const DEFAULTS: Required<
  Omit<RefinementOptions, "debug" | "cropBounds" | "useHoughLines" | "maxAreaChangeFraction">
> = {
  maxCorners: 30,    // ← reduced from 80 — filters corner noise
  snapStrength: 0.6, // ← reduced from 0.85 — softer snap prevents distortion
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

/** Shoelace area of a pixel-space polygon ring */
function pixelPolygonArea(pts: { x: number; y: number }[]): number {
  let area = 0;
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += pts[i].x * pts[j].y;
    area -= pts[j].x * pts[i].y;
  }
  return Math.abs(area) / 2;
}

function closestCorner(
  x: number,
  y: number,
  corners: { x: number; y: number }[],
): { x: number; y: number } | null {
  let best: { x: number; y: number } | null = null;
  let bestD = Infinity;
  for (const c of corners) {
    const d = (c.x - x) ** 2 + (c.y - y) ** 2;
    if (d < bestD) { bestD = d; best = c; }
  }
  return best;
}

// ─── Coordinate transforms ────────────────────────────────────────────────────

function pixelToLatLng(
  px: number,
  py: number,
  imageWidth: number,
  imageHeight: number,
  bounds: NonNullable<RefinementOptions["cropBounds"]>,
): LeafletLatLng {
  const { north, south, east, west } = bounds;
  return {
    lat: clamp(north - (py / imageHeight) * (north - south), south, north),
    lng: clamp(west  + (px / imageWidth)  * (east  - west),  west,  east),
  };
}

function latLngToPixel(
  ll: LeafletLatLng,
  imageWidth: number,
  imageHeight: number,
  bounds: NonNullable<RefinementOptions["cropBounds"]>,
): { x: number; y: number } {
  const { north, south, east, west } = bounds;
  return {
    x: clamp(((ll.lng - west)  / (east  - west))  * imageWidth,  0, imageWidth  - 1),
    y: clamp(((north - ll.lat) / (north - south)) * imageHeight, 0, imageHeight - 1),
  };
}

// ─── Contour filtering ─────────────────────────────────────────────────────────

interface FilteredContour {
  pts: { x: number; y: number }[];
  area: number;
  cx: number; // centroid x
  cy: number; // centroid y
}

/**
 * Extract external contours from the edges image, then filter by:
 *  1. Minimum area — reject tiny contours (noise, text, roads)
 *  2. Proximity to the input polygon centroid — reject far-away contours
 *  3. Compactness (4π·area/perimeter²) — reject very elongated shapes (roads)
 *
 * Returns filtered contours sorted by area descending.
 */
function getFilteredContours(
  edges: cv.Mat,
  polygonPixels: { x: number; y: number }[],
  imageW: number,
  imageH: number,
): FilteredContour[] {
  const contours   = new cv.MatVector();
  const hierarchy  = new cv.Mat();
  const results: FilteredContour[] = [];

  // Polygon centroid
  const polyCx = polygonPixels.reduce((s, p) => s + p.x, 0) / polygonPixels.length;
  const polyCy = polygonPixels.reduce((s, p) => s + p.y, 0) / polygonPixels.length;

  // Bounding box of the polygon for radius check
  const polyXs = polygonPixels.map((p) => p.x);
  const polyYs = polygonPixels.map((p) => p.y);
  const polyW  = Math.max(...polyXs) - Math.min(...polyXs);
  const polyH  = Math.max(...polyYs) - Math.min(...polyYs);
  // Proximity threshold: contour centroid must be within 1.5× the polygon's bbox
  const proximityThreshold = Math.max(polyW, polyH) * 1.5 + 40;

  // Minimum area: 0.5% of the image, or at least 100 px²
  const minArea = Math.max(100, imageW * imageH * 0.005);

  try {
    cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    for (let i = 0; i < contours.size(); i++) {
      const c    = contours.get(i);
      const area = cv.contourArea(c);

      if (area < minArea) continue; // reject tiny/noise contours

      const peri = cv.arcLength(c, true);
      if (peri <= 0) continue;

      // Compactness: 1.0 = perfect circle; low = elongated (roads, text)
      const compactness = (4 * Math.PI * area) / (peri * peri);
      if (compactness < 0.05) continue; // reject very elongated shapes

      // Centroid via moments
      const M  = cv.moments(c, false);
      const cx = M.m00 > 0 ? M.m10 / M.m00 : polyCx;
      const cy = M.m00 > 0 ? M.m01 / M.m00 : polyCy;

      // Proximity filter
      const dist = Math.sqrt((cx - polyCx) ** 2 + (cy - polyCy) ** 2);
      if (dist > proximityThreshold) continue;

      const pts: { x: number; y: number }[] = [];
      for (let j = 0; j < c.rows; j++) {
        pts.push({ x: c.data32S[j * 2], y: c.data32S[j * 2 + 1] });
      }
      results.push({ pts, area, cx, cy });
    }
  } finally {
    contours.delete();
    hierarchy.delete();
  }

  return results.sort((a, b) => b.area - a.area);
}

/**
 * From the filtered contours, pick the best one via approxPolyDP.
 * Requires at least as many vertices as the original polygon.
 */
function getBestContourPolygon(
  edges: cv.Mat,
  polygonPixels: { x: number; y: number }[],
  imageW: number,
  imageH: number,
): { x: number; y: number }[] | null {
  const filtered = getFilteredContours(edges, polygonPixels, imageW, imageH);
  if (filtered.length === 0) return null;

  // Try up to the top-3 contours by area
  for (const fc of filtered.slice(0, 3)) {
    const contourMat = new cv.Mat(fc.pts.length, 1, cv.CV_32SC2);
    for (let i = 0; i < fc.pts.length; i++) {
      contourMat.data32S[i * 2]     = fc.pts[i].x;
      contourMat.data32S[i * 2 + 1] = fc.pts[i].y;
    }
    const approx = new cv.Mat();
    try {
      const peri = cv.arcLength(contourMat, true);
      // epsilon = 2% of perimeter for tighter approximation
      cv.approxPolyDP(contourMat, approx, 0.02 * peri, true);

      if (approx.rows >= polygonPixels.length) {
        const pts: { x: number; y: number }[] = [];
        for (let i = 0; i < approx.rows; i++) {
          pts.push({
            x: approx.data32S[i * 2],
            y: approx.data32S[i * 2 + 1],
          });
        }
        return pts;
      }
    } finally {
      approx.delete();
      contourMat.delete();
    }
  }
  return null;
}

// ─── HoughLinesP ──────────────────────────────────────────────────────────────

interface Segment { x1: number; y1: number; x2: number; y2: number }

/** Only keep Hough segments that pass near the polygon centroid or vertices. */
function detectHoughLines(
  edges: cv.Mat,
  polygonPixels: { x: number; y: number }[],
): Segment[] {
  const linesMat = new cv.Mat();
  const lines: Segment[] = [];

  const polyCx = polygonPixels.reduce((s, p) => s + p.x, 0) / polygonPixels.length;
  const polyCy = polygonPixels.reduce((s, p) => s + p.y, 0) / polygonPixels.length;
  const polyXs = polygonPixels.map((p) => p.x);
  const polyYs = polygonPixels.map((p) => p.y);
  const polyDiag = Math.sqrt(
    (Math.max(...polyXs) - Math.min(...polyXs)) ** 2 +
    (Math.max(...polyYs) - Math.min(...polyYs)) ** 2,
  );
  // Only keep lines whose midpoint is within the polygon neighbourhood
  const proximityThreshold = polyDiag * 0.8 + 30;

  try {
    // Higher vote threshold (60) + longer minLineLength (40) = fewer, stronger lines
    cv.HoughLinesP(edges, linesMat, 1, Math.PI / 180, 60, 40, 8);
    for (let i = 0; i < linesMat.rows; i++) {
      const x1 = linesMat.data32S[i * 4 + 0];
      const y1 = linesMat.data32S[i * 4 + 1];
      const x2 = linesMat.data32S[i * 4 + 2];
      const y2 = linesMat.data32S[i * 4 + 3];

      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      const dist = Math.sqrt((midX - polyCx) ** 2 + (midY - polyCy) ** 2);
      if (dist <= proximityThreshold) {
        lines.push({ x1, y1, x2, y2 });
      }
    }
  } finally {
    linesMat.delete();
  }
  return lines;
}

function snapVertexToLines(
  x: number,
  y: number,
  lines: Segment[],
  threshold: number,
): { x: number; y: number } {
  let best = { x, y };
  let bestDist = threshold;
  for (const seg of lines) {
    const dx = seg.x2 - seg.x1;
    const dy = seg.y2 - seg.y1;
    const len2 = dx * dx + dy * dy;
    if (len2 === 0) continue;
    const t = clamp(((x - seg.x1) * dx + (y - seg.y1) * dy) / len2, 0, 1);
    const projX = seg.x1 + t * dx;
    const projY = seg.y1 + t * dy;
    const dist = Math.sqrt((projX - x) ** 2 + (projY - y) ** 2);
    if (dist < bestDist) { bestDist = dist; best = { x: projX, y: projY }; }
  }
  return best;
}

// ─── Main export ───────────────────────────────────────────────────────────────

export async function refineRoofPolygonFromCrop(options: {
  imageData: ImageData;
  polygonPixels: { x: number; y: number }[];
  polygonLatLngs: LeafletLatLng[];
  fallbackToOriginal?: boolean;
  opts?: RefinementOptions;
}): Promise<RoofRefinementResult> {
  const { imageData, polygonPixels, polygonLatLngs, fallbackToOriginal = true } = options;
  const opts: RefinementOptions = options.opts ?? {};
  const merged = { ...DEFAULTS, ...opts };
  const maxAreaChangeFraction = opts.maxAreaChangeFraction ?? 0.30;

  // ── OpenCV init guard ──
  const anyCv = cv as any;
  if (anyCv?.ready instanceof Promise) {
    await anyCv.ready;
  } else if (typeof anyCv?.onRuntimeInitialized === "function") {
    await new Promise<void>((resolve) => { anyCv.onRuntimeInitialized = resolve; });
  }

  if (!polygonPixels.length || polygonPixels.length !== polygonLatLngs.length) {
    return { refinedLatLngs: polygonLatLngs, accepted: false };
  }

  const W = imageData.width;
  const H = imageData.height;

  const bounds: NonNullable<RefinementOptions["cropBounds"]> = opts.cropBounds ?? (() => {
    const lats = polygonLatLngs.map((p) => p.lat);
    const lngs = polygonLatLngs.map((p) => p.lng);
    const padLat = (Math.max(...lats) - Math.min(...lats)) * 0.12 || 0.0001;
    const padLng = (Math.max(...lngs) - Math.min(...lngs)) * 0.12 || 0.0001;
    return {
      north: Math.max(...lats) + padLat,
      south: Math.min(...lats) - padLat,
      east:  Math.max(...lngs) + padLng,
      west:  Math.min(...lngs) - padLng,
    };
  })();

  const originalPixelArea = pixelPolygonArea(polygonPixels);

  const src        = cv.matFromImageData(imageData);
  const gray       = new cv.Mat();
  const blurred    = new cv.Mat();
  const edges      = new cv.Mat();
  const cornersMat = new cv.Mat();

  try {
    // ── Preprocessing: stronger blur to suppress road/label textures ──
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
    // Bilateral filter would be ideal but not available in opencv-js lite builds;
    // use a larger Gaussian kernel (9×9) + morphological closing to fill gaps
    cv.GaussianBlur(gray, blurred, new cv.Size(9, 9), 2.0, 0);

    // Canny with higher thresholds — only strong satellite edges survive
    cv.Canny(blurred, edges, 80, 180);

    // Morphological closing: connect broken roof edges
    const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(3, 3));
    const closed = new cv.Mat();
    cv.morphologyEx(edges, closed, cv.MORPH_CLOSE, kernel);
    kernel.delete();
    closed.copyTo(edges);
    closed.delete();

    // ── Shi-Tomasi with higher quality threshold — fewer, better corners ──
    cv.goodFeaturesToTrack(
      blurred,
      cornersMat,
      merged.maxCorners,  // 30 — reduced from 80
      0.05,               // qualityLevel — raised from 0.01 (stricter)
      15,                 // minDistance — raised from 8 (spread corners out)
      undefined,
      5,
      false,
      0.04,
    );

    // Filter corners to only those near the polygon (within 1.5× polygon bbox)
    const polyXs = polygonPixels.map((p) => p.x);
    const polyYs = polygonPixels.map((p) => p.y);
    const minX = Math.min(...polyXs), maxX = Math.max(...polyXs);
    const minY = Math.min(...polyYs), maxY = Math.max(...polyYs);
    const pad = Math.max(maxX - minX, maxY - minY) * 0.5 + 20;

    const corners: { x: number; y: number }[] = [];
    const cornerData = cornersMat.data32F;
    for (let i = 0; i < cornersMat.rows; i++) {
      const x = cornerData[i * 2];
      const y = cornerData[i * 2 + 1];
      if (
        Number.isFinite(x) && Number.isFinite(y) &&
        x >= minX - pad && x <= maxX + pad &&
        y >= minY - pad && y <= maxY + pad
      ) {
        corners.push({ x, y });
      }
    }

    // ── HoughLinesP with proximity filter ──
    let houghLines: Segment[] = [];
    if (merged.useHoughLines !== false) {
      try { houghLines = detectHoughLines(edges, polygonPixels); } catch { /* non-fatal */ }
    }

    // ── Snap vertices to nearby Shi-Tomasi corners ──
    const maxSnapDist = Math.max(10, Math.min(W, H) * 0.05);
    const snapped = polygonPixels.map((p) => {
      const nc = closestCorner(p.x, p.y, corners);
      if (!nc) return p;
      const dist = Math.sqrt((nc.x - p.x) ** 2 + (nc.y - p.y) ** 2);
      if (dist > maxSnapDist) return p;
      const t = merged.snapStrength; // 0.6 — softer pull
      return { x: p.x + (nc.x - p.x) * t, y: p.y + (nc.y - p.y) * t };
    });

    // ── HoughLines edge-straightening ──
    const houghSnapped =
      houghLines.length > 0
        ? snapped.map((p) => snapVertexToLines(p.x, p.y, houghLines, maxSnapDist * 0.5))
        : snapped;

    // ── Light smoothing ──
    const smoothed = houghSnapped.map((p, idx) => {
      const prev = houghSnapped[(idx - 1 + houghSnapped.length) % houghSnapped.length];
      const next = houghSnapped[(idx + 1) % houghSnapped.length];
      return {
        x: (prev.x + p.x * 2 + next.x) / 4,
        y: (prev.y + p.y * 2 + next.y) / 4,
      };
    });

    // ── Image-space → geographic transform ──
    const refinedLatLngs: LeafletLatLng[] = smoothed.map((p) =>
      pixelToLatLng(p.x, p.y, W, H, bounds),
    );

    // ── Validation 1: all coordinates must be finite and inside bounds ──
    const allFinite = refinedLatLngs.every(
      (ll) =>
        Number.isFinite(ll.lat) && Number.isFinite(ll.lng) &&
        ll.lat >= bounds.south && ll.lat <= bounds.north &&
        ll.lng >= bounds.west  && ll.lng <= bounds.east,
    );
    if (!allFinite) {
      return {
        refinedLatLngs: polygonLatLngs,
        accepted: false,
        debug: opts.debug ? { rejectionReason: "out-of-bounds coordinates", corners } : undefined,
      };
    }

    // ── Validation 2: area change must be within allowed fraction ──
    const refinedPixelArea = pixelPolygonArea(smoothed);
    if (originalPixelArea > 0) {
      const areaRatio = Math.abs(refinedPixelArea - originalPixelArea) / originalPixelArea;
      if (areaRatio > maxAreaChangeFraction) {
        return {
          refinedLatLngs: polygonLatLngs,
          accepted: false,
          debug: opts.debug
            ? { rejectionReason: `area changed ${(areaRatio * 100).toFixed(1)}% > ${(maxAreaChangeFraction * 100).toFixed(0)}%`, corners }
            : undefined,
        };
      }
    }

    if (opts.debug) {
      const edgesCanvas = document.createElement("canvas");
      edgesCanvas.width  = edges.cols;
      edgesCanvas.height = edges.rows;
      cv.imshow(edgesCanvas, edges);
      const filteredContours = getFilteredContours(edges, polygonPixels, W, H);
      return {
        refinedLatLngs,
        accepted: true,
        debug: {
          edgesDataUrl: edgesCanvas.toDataURL("image/png"),
          corners,
          contoursCount: filteredContours.length,
          houghLines: houghLines.length,
        },
      };
    }

    return { refinedLatLngs, accepted: true };
  } catch (e) {
    if (fallbackToOriginal) {
      return { refinedLatLngs: polygonLatLngs, accepted: false };
    }
    throw e;
  } finally {
    src.delete();
    gray.delete();
    blurred.delete();
    edges.delete();
    cornersMat.delete();
  }
}

// ─── Re-export coordinate helpers for MapView.tsx ─────────────────────────────
export { pixelToLatLng, latLngToPixel };
