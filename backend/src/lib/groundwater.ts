// ─── Delhi Groundwater Hydrogeology Lookup ────────────────────────────────────
// Lightweight lookup table — no external APIs.
// Zone detection uses bounding-box / nearest-centroid approach.

export interface GroundwaterInfo {
  zone: string;
  groundwaterDepth: number;     // metres below ground level (avg)
  soilType: string;
  infiltrationRate: number;     // m/day (design value for percolation pit)
  rechargeFeasible: boolean;
  maxPitDepth: number;          // m — hard cap to avoid hitting water table
  warnings: string[];
}

// ─── Zone Definitions ────────────────────────────────────────────────────────
// Each zone has a bounding box [minLat, maxLat, minLon, maxLon] and centroid.
// Source: CGWB Ground Water Year Book Delhi 2021-22 and CGWA notifications.

interface ZoneRecord extends GroundwaterInfo {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
  centroidLat: number;
  centroidLon: number;
}

const DELHI_ZONES: ZoneRecord[] = [
  {
    zone: 'North Delhi',
    minLat: 28.72, maxLat: 28.88, minLon: 77.13, maxLon: 77.28,
    centroidLat: 28.80, centroidLon: 77.20,
    groundwaterDepth: 9.5,
    soilType: 'Sandy loam with alluvial deposits',
    infiltrationRate: 0.55,
    rechargeFeasible: true,
    maxPitDepth: 3.5,
    warnings: [],
  },
  {
    zone: 'North-West Delhi',
    minLat: 28.70, maxLat: 28.86, minLon: 76.98, maxLon: 77.15,
    centroidLat: 28.78, centroidLon: 77.07,
    groundwaterDepth: 7.2,
    soilType: 'Sandy loam / coarse sand',
    infiltrationRate: 0.65,
    rechargeFeasible: true,
    maxPitDepth: 3.0,
    warnings: [],
  },
  {
    zone: 'West Delhi',
    minLat: 28.60, maxLat: 28.72, minLon: 76.97, maxLon: 77.10,
    centroidLat: 28.66, centroidLon: 77.04,
    groundwaterDepth: 5.8,
    soilType: 'Fine sand with clay lenses',
    infiltrationRate: 0.40,
    rechargeFeasible: true,
    maxPitDepth: 2.5,
    warnings: ['Moderate clay lenses may reduce effective infiltration.'],
  },
  {
    zone: 'Central Delhi',
    minLat: 28.62, maxLat: 28.70, minLon: 77.16, maxLon: 77.26,
    centroidLat: 28.66, centroidLon: 77.21,
    groundwaterDepth: 6.0,
    soilType: 'Silty clay loam (urban fill)',
    infiltrationRate: 0.25,
    rechargeFeasible: true,
    maxPitDepth: 2.0,
    warnings: [
      'Dense urban fill reduces natural infiltration.',
      'First-flush diverter is mandatory in this zone.',
    ],
  },
  {
    zone: 'South Delhi',
    minLat: 28.47, maxLat: 28.62, minLon: 77.14, maxLon: 77.28,
    centroidLat: 28.55, centroidLon: 77.21,
    groundwaterDepth: 14.0,
    soilType: 'Quartzite / rocky terrain with sandy pockets',
    infiltrationRate: 0.30,
    rechargeFeasible: true,
    maxPitDepth: 4.0,
    warnings: [
      'Rocky sub-surface in parts — conduct site test before pit excavation.',
    ],
  },
  {
    zone: 'South-West Delhi',
    minLat: 28.47, maxLat: 28.62, minLon: 76.97, maxLon: 77.14,
    centroidLat: 28.55, centroidLon: 77.06,
    groundwaterDepth: 4.5,
    soilType: 'Silty loam with hard pan layers',
    infiltrationRate: 0.30,
    rechargeFeasible: true,
    maxPitDepth: 2.0,
    warnings: [
      'Shallow hard-pan layers can impede drainage — site investigation advised.',
    ],
  },
  {
    zone: 'East Delhi',
    minLat: 28.60, maxLat: 28.72, minLon: 77.27, maxLon: 77.36,
    centroidLat: 28.66, centroidLon: 77.32,
    groundwaterDepth: 3.2,
    soilType: 'Alluvial sandy loam (flood plain)',
    infiltrationRate: 0.70,
    rechargeFeasible: true,
    maxPitDepth: 1.5,
    warnings: [
      'Shallow water table — pit depth strictly limited to 1.5 m.',
      'Risk of flood-plain waterlogging during heavy monsoon.',
    ],
  },
  {
    zone: 'South-East Delhi',
    minLat: 28.51, maxLat: 28.62, minLon: 77.27, maxLon: 77.36,
    centroidLat: 28.56, centroidLon: 77.31,
    groundwaterDepth: 4.8,
    soilType: 'Medium sand with silt layers',
    infiltrationRate: 0.50,
    rechargeFeasible: true,
    maxPitDepth: 2.5,
    warnings: [],
  },
  {
    zone: 'Shahdara / Trans-Yamuna',
    minLat: 28.64, maxLat: 28.80, minLon: 77.27, maxLon: 77.38,
    centroidLat: 28.72, centroidLon: 77.33,
    groundwaterDepth: 2.8,
    soilType: 'Loose alluvial sand (Yamuna flood plain)',
    infiltrationRate: 0.80,
    rechargeFeasible: false,
    maxPitDepth: 1.0,
    warnings: [
      'Very shallow groundwater — percolation pit recharge NOT recommended.',
      'Prefer surface storage tanks over infiltration-based systems.',
      'Consult CGWB before any below-ground recharge structure.',
    ],
  },
  {
    zone: 'Najafgarh / Dwarka Extension',
    minLat: 28.54, maxLat: 28.66, minLon: 76.88, maxLon: 77.00,
    centroidLat: 28.60, centroidLon: 76.94,
    groundwaterDepth: 3.8,
    soilType: 'Clay / silty clay (Najafgarh lake bed)',
    infiltrationRate: 0.15,
    rechargeFeasible: false,
    maxPitDepth: 1.0,
    warnings: [
      'Very low infiltration due to lake-bed clay — percolation pits are not suitable.',
      'Surface water collection and storage tanks strongly recommended.',
      'Area lies within CGWB notified groundwater-stressed zone.',
    ],
  },
];

// ─── Delhi rough bounding box (fallback centroid) ────────────────────────────
const DELHI_CENTER: GroundwaterInfo = {
  zone: 'Delhi (Generic — coordinates outside known zones)',
  groundwaterDepth: 8.0,
  soilType: 'Alluvial silty loam (Delhi NCT average)',
  infiltrationRate: 0.45,
  rechargeFeasible: true,
  maxPitDepth: 2.5,
  warnings: [
    'Location not matched to a specific Delhi zone — using NCT-average parameters.',
    'Conduct a local percolation test for accurate design.',
  ],
};

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Returns groundwater hydrogeology data for the given coordinates.
 * Uses a bounding-box lookup first; falls back to nearest centroid.
 */
export function getGroundwaterInfo(lat: number, lon: number): GroundwaterInfo {
  // 1. Exact bounding-box match
  const exactMatch = DELHI_ZONES.find(
    (z) => lat >= z.minLat && lat <= z.maxLat && lon >= z.minLon && lon <= z.maxLon,
  );
  if (exactMatch) return toInfo(exactMatch);

  // 2. Nearest-centroid fallback (still within Delhi area roughly)
  const isNearDelhi = lat >= 28.4 && lat <= 28.95 && lon >= 76.8 && lon <= 77.45;
  if (isNearDelhi) {
    let bestZone = DELHI_ZONES[0];
    let bestDist = Infinity;
    for (const zone of DELHI_ZONES) {
      const d = Math.hypot(lat - zone.centroidLat, lon - zone.centroidLon);
      if (d < bestDist) { bestDist = d; bestZone = zone; }
    }
    return toInfo(bestZone);
  }

  // 3. Outside Delhi entirely — return generic fallback
  return DELHI_CENTER;
}

function toInfo(z: ZoneRecord): GroundwaterInfo {
  return {
    zone: z.zone,
    groundwaterDepth: z.groundwaterDepth,
    soilType: z.soilType,
    infiltrationRate: z.infiltrationRate,
    rechargeFeasible: z.rechargeFeasible,
    maxPitDepth: z.maxPitDepth,
    warnings: [...z.warnings],
  };
}
