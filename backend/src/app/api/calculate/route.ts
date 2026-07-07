import { NextResponse } from 'next/server';
import { getGroundwaterInfo } from '../../../lib/groundwater';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CalculateRequest {
  /** Roof area in square feet */
  area: number;
  propertyType: string;
  roofMaterial?: string;
  residents: number;
  /** Annual rainfall in mm */
  rainfall: number;
  /** Coordinates for groundwater zone lookup */
  latitude?: number;
  longitude?: number;
  /** Monthly rainfall distribution as fractions summing to 1 (optional).
   *  If not provided, Delhi long-term IMD distribution is used. */
  monthlyFractions?: number[];
}

interface RechargeStructure {
  type: 'percolation_pit' | 'storage_tank';
  dimensions: Record<string, number>;
  volumes: Record<string, number>;
  layers?: { name: string; thickness: number }[];
  notes: string[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SYSTEM_COST_INR = 120_000;
const WATER_RATE_INR_PER_KL = 18; // ₹18 per cubic metre (kilo-litre)
const DAILY_CONSUMPTION_LITRES_PER_PERSON = 150;

function getRunoffCoefficient(material: string): number {
  switch (material) {
    case 'RCC / concrete flat roof': return 0.87;
    case 'Clay / Mangalore tiles': return 0.75;
    case 'Cement / ACC tiles': return 0.80;
    case 'GI / corrugated metal sheet': return 0.90;
    case 'Asbestos / AC sheet': return 0.85;
    case 'Gravel / pebble ballast': return 0.60;
    case 'Green / planted roof': return 0.30;
    default: return 0.80;
  }
}

// Delhi long-term monthly rainfall fractions (IMD 1901-2020 normals)
const DELHI_MONTHLY_FRACTIONS = [
  0.010, 0.013, 0.013, 0.018, 0.034, 0.063,
  0.262, 0.229, 0.118, 0.053, 0.014, 0.009,
];
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ─── Subsidy logic ───────────────────────────────────────────────────────────

// ─── Delhi RTRWH Property Logic ──────────────────────────────────────────────
function getPropertyRules(propertyType: string, areaInSqm: number, annualLitres: number) {
  const isEligibleArea = (min: number) => areaInSqm >= min;
  const isEligibleVol = annualLitres >= 10_000;
  
  let minArea = 100;
  let maxSubsidy = 0;
  let conditions = '';
  let specialNotes = '';
  let warnings: string[] = [];
  let recommendations: string[] = [];
  let isEligible = false;
  let subsidyAmount = 0;

  switch (propertyType) {
    case 'Independent House':
      minArea = 100;
      maxSubsidy = areaInSqm >= 500 ? 50000 : areaInSqm >= 400 ? 40000 : areaInSqm >= 300 ? 30000 : areaInSqm >= 200 ? 20000 : 10000;
      isEligible = isEligibleArea(minArea) && isEligibleVol;
      conditions = 'Mandatory if plot ≥ 100 sq. m. Functional recharge/storage system required. Adequacy certificate may be required.';
      specialNotes = 'Single application per address. Potentially eligible subject to DJB inspection.';
      recommendations.push('Recharge pit recommended for moderate-to-large rooftops.');
      recommendations.push('First-flush system mandatory.');
      break;

    case 'Apartment / CGHS / Group Housing':
      minArea = 200;
      maxSubsidy = 50000;
      isEligible = isEligibleArea(minArea) && isEligibleVol;
      conditions = 'Society-wide system serving all flats. Multiple recharge pits may be needed.';
      specialNotes = 'Application by RWA/CGHS. Potentially eligible subject to DJB inspection. 10% water bill rebate if functional.';
      recommendations.push('Hybrid recharge + storage system recommended.');
      recommendations.push('High-capacity filtration and overflow routing is important.');
      break;

    case 'Government Building':
      minArea = 0;
      maxSubsidy = 0;
      isEligible = false;
      conditions = 'Mandatory compliance. Inspection and adequacy certification important.';
      specialNotes = 'Installation is typically executed directly by the agency.';
      recommendations.push('Recharge-heavy hybrid system recommended.');
      break;

    case 'Academic Institution / School / College':
      minArea = 200;
      maxSubsidy = 50000;
      isEligible = isEligibleArea(minArea) && isEligibleVol;
      conditions = 'Mandatory for large campuses. Public safety around pits required.';
      specialNotes = 'Potentially eligible subject to DJB approval and board recognition status.';
      recommendations.push('Hybrid recharge-storage system.');
      recommendations.push('Multiple pits/trenches for large campuses. Handle large runoff safely.');
      warnings.push('Ensure overflow routing is secure and pits are fenced for public safety.');
      break;

    case 'Commercial Building':
      minArea = 100;
      maxSubsidy = 50000;
      isEligible = isEligibleArea(minArea) && isEligibleVol;
      conditions = 'Must be compliant and operational. Maintenance scheduling important.';
      specialNotes = 'Potentially eligible subject to inspection. Possible 10% water bill rebate if functional.';
      recommendations.push('Hybrid system recommended. High runoff handling required.');
      recommendations.push('Overflow management is strictly required.');
      break;

    case 'Industrial Property':
      minArea = 0;
      maxSubsidy = 2_000_000;
      isEligible = isEligibleArea(minArea) && isEligibleVol;
      conditions = 'Only non-contaminated rooftop runoff allowed. Industrial discharge must remain isolated.';
      specialNotes = 'Potentially eligible subject to strict environmental compliance and NOC.';
      recommendations.push('Recharge trench + storage recommended.');
      warnings.push('⚠️ DANGER: Prevent contaminated recharge. Industrial discharge must remain completely isolated from RWH systems.');
      break;

    case 'Hospital / Healthcare Building':
      minArea = 100;
      maxSubsidy = 50000;
      isEligible = isEligibleArea(minArea) && isEligibleVol;
      conditions = 'Medical wastewater separation required. Mosquito prevention mandatory.';
      specialNotes = 'Potentially eligible subject to DJB inspection. Strict overflow hygiene important.';
      recommendations.push('Controlled recharge + storage system.');
      warnings.push('⚠️ CRITICAL: Strict separation from medical wastewater and rigorous mosquito prevention (sealed mesh) is mandatory.');
      break;

    default: // Fallback
      minArea = 100;
      maxSubsidy = 50000;
      isEligible = isEligibleArea(minArea) && isEligibleVol;
      conditions = 'Must follow DJB/CGWB specs; system must be functional and inspected.';
      specialNotes = 'Potentially eligible subject to inspection.';
      break;
  }

  subsidyAmount = isEligible ? Math.min(maxSubsidy, SYSTEM_COST_INR * 0.5) : 0;

  return { isEligible, subsidyAmount, maxSubsidy, conditions, specialNotes, minArea, warnings, recommendations };
}

// ─── Recharge structure sizing ────────────────────────────────────────────────

/**
 * Size a percolation pit using IS:10500 / CGWB guidelines.
 *
 * Design logic:
 *  - Storage volume = capture volume / infiltration rate factor
 *  - Pit is cylindrical; diameter sized so depth stays 1.5 – 3 m
 *  - Side slope 1:1.5 (stable in Delhi sandy-loam)
 *  - Filter layers: silt trap → coarse sand → gravel
 */
function sizePercolationPit(
  captureVolumeCubicM: number,
  infiltrationRate: number = 0.5,
  maxPitDepth: number = 2.0,
  extraNotes: string[] = [],
): RechargeStructure {
  const sideSlopeFactor = 1.5;  // H:V = 1.5:1
  const freeboard = 0.20;       // m
  // Cap depth at zone's max to avoid hitting the water table
  const targetDepth = Math.min(2.0, maxPitDepth);

  // Storage volume needed = capture volume (with 10% safety)
  const storageVolume = captureVolumeCubicM * 1.1;

  // Cylindrical pit: V = π/4 × d² × depth  →  d = sqrt(4V / (π × depth))
  const diameter = Math.sqrt((4 * storageVolume) / (Math.PI * targetDepth));
  const planArea = Math.PI * (diameter / 2) ** 2;
  const excavationVolume = planArea * (targetDepth + freeboard);

  const gravelThickness = Math.max(targetDepth - 0.60, 0.30);
  const layers = [
    { name: 'Silt trap (fine mesh)', thickness: 0.30 },
    { name: 'Filter sand', thickness: 0.30 },
    { name: 'Gravel (20–40 mm)', thickness: gravelThickness },
  ];

  const notes: string[] = [...extraNotes];
  if (captureVolumeCubicM < 5)  notes.push('Small catchment — consider a recharge shaft instead');
  if (captureVolumeCubicM > 100) notes.push('Large volume — consider multiple pits or a recharge trench');
  notes.push(`Infiltration rate for this zone: ${infiltrationRate} m/day`);
  notes.push(`Max design depth (zone limit): ${maxPitDepth} m — pit depth set to ${targetDepth} m`);
  notes.push('Clean silt trap every monsoon season');
  notes.push('Increase freeboard to 0.30 m in flood-prone areas');

  return {
    type: 'percolation_pit',
    dimensions: {
      diameter: Math.round(diameter * 100) / 100,
      depth: targetDepth,
      freeboard,
      sideSlopeFactor,
    },
    volumes: {
      storage: Math.round(storageVolume * 100) / 100,
      capture: Math.round(captureVolumeCubicM * 100) / 100,
      excavation: Math.round(excavationVolume * 100) / 100,
    },
    layers,
    notes,
  };
}

/**
 * Size a storage tank using IS:2470 / BIS guidelines.
 *
 * Design logic:
 *  - Tank stores peak-month demand (first-flush months excluded)
 *  - Cylindrical ferrocement/brick tank; H:D ratio ≈ 1.5 for stability
 *  - Wall thickness 100 mm (ferrocement) or 230 mm (brick)
 *  - Foundation height 300 mm
 */
function sizeStorageTank(annualLitres: number, residents: number): RechargeStructure {
  const dailyConsumption = residents * DAILY_CONSUMPTION_LITRES_PER_PERSON;
  const targetStorageLitres = Math.min(dailyConsumption * 90, annualLitres * 0.25);
  const volumeCubicM = targetStorageLitres / 1000;

  const diameter = Math.cbrt((volumeCubicM * 4) / (Math.PI * 1.5));
  const height = 1.5 * diameter;
  const wallThickness = 0.10;
  const foundationHeight = 0.30;

  const notes: string[] = [];
  notes.push('Ferrocement or brick masonry construction recommended');
  notes.push('Install first-flush diverter (2 mm runoff depth per catchment m²)');
  notes.push('Provide mosquito-proof mesh on all inlets/outlets');
  notes.push('Manhole with lockable cover for maintenance access');
  if (volumeCubicM > 50) notes.push('For tanks > 50 m³ consider RCC construction with structural engineer sign-off');
  notes.push('Paint exterior with weather-resistant paint to reduce algal growth');

  return {
    type: 'storage_tank',
    dimensions: {
      diameter: Math.round(diameter * 100) / 100,
      height: Math.round(height * 100) / 100,
      wallThickness,
      foundationHeight,
    },
    volumes: {
      storage: Math.round(volumeCubicM * 100) / 100,
      capture: Math.round((annualLitres / 1000) * 0.25 * 100) / 100,
    },
    layers: [
      { name: 'Foundation / plinth', thickness: foundationHeight },
      { name: 'Tank wall (ferrocement)', thickness: wallThickness },
      { name: 'Waterproof inner plaster', thickness: 0.015 },
    ],
    notes,
  };
}

// ─── First-flush diverter sizing ──────────────────────────────────────────────────────────────

export interface FirstFlushDiverter {
  /** Roof area in m² */
  catchmentAreaSqm: number;
  /** Design runoff depth for first-flush (mm) — typically 2–5 mm */
  firstFlushDepthMm: number;
  /** Volume of first-flush to be diverted (litres) */
  firstFlushVolumeLitres: number;
  /** Recommended vessel / sump volume (litres) */
  vesselVolumeLitres: number;
  /** Equivalent standard PVC pipe sizing (internal diameter in mm) */
  pvcPipeDiameterMm: number;
  /** Recommended PVC pipe length in metres (for a standing-pipe diverter) */
  pvcPipeLengthM: number;
  /** Engineering notes */
  notes: string[];
}

/**
 * Size a first-flush diverter per IS:15797 / CGWB practice note.
 *
 * Rule of thumb:
 *   First-flush depth = 2.5 mm over the entire catchment area.
 *   Diverter vessel = first-flush volume + 10% safety margin.
 *   A standing-pipe diverter uses a vertical PVC pipe whose internal volume
 *   equals the first-flush volume (L = V / A_pipe).
 */
function sizeFirstFlushDiverter(areaInSqm: number): FirstFlushDiverter {
  const firstFlushDepthMm = 2.5;                                // mm
  const firstFlushDepthM  = firstFlushDepthMm / 1000;
  const firstFlushVolumeLitres = areaInSqm * firstFlushDepthM * 1000; // litres
  const vesselVolumeLitres     = Math.round(firstFlushVolumeLitres * 1.10); // +10% safety

  // Standard PVC pipe diameters (internal diameter in mm)
  // Pick smallest pipe that delivers a pipe length of 1–3 m (practical install).
  const standardPipes = [75, 100, 110, 150, 160, 200, 250];
  let pvcPipeDiameterMm = 150; // default: 150 mm — widely available, suits most rooftops
  let pvcPipeLengthM    = 1.0;
  for (const d of standardPipes) {
    const radiusM  = (d / 1000) / 2;
    const areaPipe = Math.PI * radiusM ** 2;        // m²
    const length   = (firstFlushVolumeLitres / 1000) / areaPipe; // m
    if (length >= 0.5 && length <= 3.0) {
      pvcPipeDiameterMm = d;
      pvcPipeLengthM    = Math.round(length * 100) / 100;
      break;
    }
    if (length < 0.5 && d === standardPipes[standardPipes.length - 1]) {
      pvcPipeDiameterMm = d;
      pvcPipeLengthM    = Math.max(0.5, Math.round(length * 100) / 100);
    }
  }

  const notes = [
    'First-flush systems divert the initial runoff (which carries dust, bird droppings, and pollutants) away from the storage/recharge system.',
    `Design standard: ${firstFlushDepthMm} mm runoff depth over the entire catchment (per IS:15797 / CGWB practice note).`,
    `Install a ball-float ‘tipping-bucket’ or standing-pipe diverter upstream of the storage inlet.`,
    `Allow the diverter vessel to drain slowly (via 3–5 mm orifice) between rain events so it resets automatically.`,
    'Clean diverter sump before every monsoon season.',
  ];

  return {
    catchmentAreaSqm: Math.round(areaInSqm * 100) / 100,
    firstFlushDepthMm,
    firstFlushVolumeLitres: Math.round(firstFlushVolumeLitres * 10) / 10,
    vesselVolumeLitres,
    pvcPipeDiameterMm,
    pvcPipeLengthM,
    notes,
  };
}

// ─── Recommendation Engine ────────────────────────────────────────────────────────────────

export type SystemRecommendationType = 'storage_tank_only' | 'recharge_pit_only' | 'hybrid';

export interface SystemRecommendation {
  type: SystemRecommendationType;
  label: string;
  /** Storage fraction 0–1 (only meaningful for hybrid) */
  storageFraction: number;
  /** Recharge fraction 0–1 (only meaningful for hybrid) */
  rechargeFraction: number;
  reasons: string[];
  /** Confidence level: high | medium | low */
  confidence: 'high' | 'medium' | 'low';
  /** Estimated storage volume (m³) */
  storageVolumeCubicM: number;
  /** Estimated recharge volume (m³/year) */
  rechargeVolumeCubicM: number;
}

/**
 * Recommend the optimal harvesting system architecture based on:
 * - Groundwater depth & recharge feasibility
 * - Roof area (proxy for collection potential)
 * - Annual harvestable volume
 * - Occupancy (demand)
 * - Infiltration rate
 */
function recommendSystem(params: {
  areaInSqm: number;
  annualLitresTotal: number;
  residents: number;
  groundwaterDepth: number;
  rechargeFeasible: boolean;
  infiltrationRate: number;
  groundwaterWarnings: string[];
}): SystemRecommendation {
  const {
    areaInSqm, annualLitresTotal, residents,
    groundwaterDepth, rechargeFeasible, infiltrationRate, groundwaterWarnings,
  } = params;

  const annualM3 = annualLitresTotal / 1000;
  const dailyDemandL = residents * DAILY_CONSUMPTION_LITRES_PER_PERSON;

  const reasons: string[] = [];
  let type: SystemRecommendationType;
  let storageFraction: number;
  let rechargeFraction: number;
  let confidence: 'high' | 'medium' | 'low' = 'high';

  // ── Decision tree ──

  // Rule 1: Recharge NOT feasible (shallow water table / clay soil)
  if (!rechargeFeasible || groundwaterDepth < 3.0) {
    type             = 'storage_tank_only';
    storageFraction  = 1.0;
    rechargeFraction = 0.0;
    reasons.push(`Groundwater depth is ${groundwaterDepth} m — too shallow for safe percolation pit installation.`);
    if (groundwaterWarnings.length) reasons.push(...groundwaterWarnings.slice(0, 2));
    reasons.push('Storage tank is the only recommended system for this location.');
    if (groundwaterDepth < 2.0) confidence = 'high';
    else confidence = 'medium';

  // Rule 2: Very small roof (<= 50 m²) — storage-focused
  } else if (areaInSqm <= 50) {
    type             = 'storage_tank_only';
    storageFraction  = 1.0;
    rechargeFraction = 0.0;
    reasons.push(`Small catchment area (${Math.round(areaInSqm)} m²) — harvest volume insufficient for meaningful recharge.`);
    reasons.push('Concentrate on storage to meet domestic demand.');
    confidence = 'high';

  // Rule 3: Low infiltration rate (<= 0.2 m/day) — storage-only
  } else if (infiltrationRate <= 0.20) {
    type             = 'storage_tank_only';
    storageFraction  = 1.0;
    rechargeFraction = 0.0;
    reasons.push(`Low soil infiltration rate (${infiltrationRate} m/day) makes recharge pits ineffective.`);
    reasons.push('A storage tank will maximise beneficial use of harvested water.');
    confidence = 'high';

  // Rule 4: Large roof (> 150 m²) with feasible recharge — lean hybrid towards recharge
  } else if (areaInSqm > 150 && rechargeFeasible && groundwaterDepth >= 6) {
    type             = 'hybrid';
    storageFraction  = 0.35;
    rechargeFraction = 0.65;
    reasons.push(`Large catchment (${Math.round(areaInSqm)} m²) produces more water than typical domestic demand can absorb.`);
    reasons.push(`Groundwater depth of ${groundwaterDepth} m is well-suited for recharge pit installation.`);
    reasons.push(`Recommended split: 35% storage (${Math.round(annualM3 * 0.35)} m³/yr) + 65% groundwater recharge (${Math.round(annualM3 * 0.65)} m³/yr).`);
    confidence = 'high';

  // Rule 5: Medium roof (50–150 m²) with feasible recharge — balanced hybrid
  } else if (areaInSqm > 50 && rechargeFeasible && groundwaterDepth >= 5) {
    // Tilt towards storage if demand is high relative to collection
    const supplyDemandRatio = annualLitresTotal / (dailyDemandL * 365);
    if (supplyDemandRatio < 0.5) {
      // Supply can barely meet half of demand — prioritise storage
      storageFraction  = 0.70;
      rechargeFraction = 0.30;
      reasons.push(`Annual supply covers ~${Math.round(supplyDemandRatio * 100)}% of demand — prioritise storage over recharge.`);
    } else {
      storageFraction  = 0.50;
      rechargeFraction = 0.50;
      reasons.push('Balanced catchment and groundwater conditions support a 50/50 hybrid system.');
    }
    type = 'hybrid';
    reasons.push(`Recommended split: ${Math.round(storageFraction * 100)}% storage + ${Math.round(rechargeFraction * 100)}% recharge.`);
    reasons.push(`Infiltration rate (${infiltrationRate} m/day) is adequate for a percolation pit.`);
    confidence = groundwaterDepth >= 7 ? 'high' : 'medium';

  // Rule 6: Feasible recharge but moderate depth (3–5 m) — lean towards storage
  } else {
    type             = 'hybrid';
    storageFraction  = 0.65;
    rechargeFraction = 0.35;
    reasons.push(`Moderate groundwater depth (${groundwaterDepth} m) allows limited recharge with a shallow pit.`);
    reasons.push('Recommended split: 65% storage + 35% recharge to balance safety and groundwater benefit.');
    confidence = 'medium';
  }

  const storageVolumeCubicM  = Math.round(annualM3 * storageFraction  * 100) / 100;
  const rechargeVolumeCubicM = Math.round(annualM3 * rechargeFraction * 100) / 100;

  const labels: Record<SystemRecommendationType, string> = {
    storage_tank_only: 'Storage Tank Only',
    recharge_pit_only:  'Recharge Pit Only',
    hybrid:             'Hybrid System',
  };

  return {
    type,
    label: labels[type],
    storageFraction,
    rechargeFraction,
    reasons,
    confidence,
    storageVolumeCubicM,
    rechargeVolumeCubicM,
  };
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body: CalculateRequest = await request.json();

    const areaInSqFt  = body.area || 0;
    const propertyType = body.propertyType || 'Individual Residential House';
    const roofMaterial = body.roofMaterial || 'RCC / concrete flat roof';
    const residents    = body.residents || 1;
    const rainfall     = body.rainfall  || 1200;
    const fractions    = body.monthlyFractions ?? DELHI_MONTHLY_FRACTIONS;
    const latitude     = body.latitude  ?? 28.65;   // Delhi centroid fallback
    const longitude    = body.longitude ?? 77.23;

    const runoffCoefficient = getRunoffCoefficient(roofMaterial);
    const groundwaterInfo   = getGroundwaterInfo(latitude, longitude);

    // ── Unit conversions ──
    const areaInSqm = areaInSqFt / 10.764;

    // ── Core hydrology ──
    const annualLitres          = Math.round(areaInSqm * rainfall * runoffCoefficient);
    const dailyConsumptionL     = residents * DAILY_CONSUMPTION_LITRES_PER_PERSON;
    const yearlyConsumptionL    = dailyConsumptionL * 365;
    const waterSavingsPct       = yearlyConsumptionL > 0
      ? Math.min(Math.round((annualLitres / yearlyConsumptionL) * 100), 100)
      : 100;
    const costSavingsYearly     = Math.round((annualLitres / 1000) * WATER_RATE_INR_PER_KL);
    const monthlyCollectionL    = Math.round(annualLitres / 12);

    // ── Subsidy / eligibility ──
    const { isEligible, subsidyAmount, maxSubsidy, conditions, specialNotes, minArea, warnings, recommendations } =
      getPropertyRules(propertyType, areaInSqm, annualLitres);

    const paybackPeriod = costSavingsYearly > 0
      ? Math.round((SYSTEM_COST_INR - subsidyAmount) / costSavingsYearly)
      : 0;

    // ── Compliance checklist ──
    const complianceItems = [
      { item: `Property size ≥ ${minArea} sq m (${Math.round(minArea * 10.764)} sq ft)`, status: areaInSqFt >= minArea * 10.764, authority: 'DJB' },
      { item: 'First-flush diverter installed', status: true, authority: 'IS:15797' },
      { item: 'Filtration unit incorporated', status: true, authority: 'CGWB' },
      { item: 'Overflow mechanism active', status: true, authority: 'DJB' },
      { item: 'Groundwater contamination prevention', status: true, authority: 'DPCC' },
      { item: 'Maintenance access provided', status: true, authority: 'CGWB' },
      { item: 'Collection potential ≥ 10 m³/year', status: (annualLitres / 1000) >= 10, authority: 'DJB' },
    ];

    // ── Monthly distribution (uses caller-supplied fractions or Delhi normals) ──
    const normalised = fractions.length === 12 ? fractions : DELHI_MONTHLY_FRACTIONS;
    const monthlyData = MONTH_NAMES.map((month, i) => ({
      month,
      collection: Math.round(annualLitres * normalised[i]),
    }));

    // ── Recharge structure sizing (location-aware) ──
    const captureVolumeCubicM = annualLitres / 1000;
    const pitFeasibilityWarnings = groundwaterInfo.rechargeFeasible
      ? groundwaterInfo.warnings
      : [
          '⚠️ Percolation pit NOT recommended for this location.',
          ...groundwaterInfo.warnings,
        ];
    const percolationPit = sizePercolationPit(
      captureVolumeCubicM,
      groundwaterInfo.infiltrationRate,
      groundwaterInfo.maxPitDepth,
      pitFeasibilityWarnings,
    );
    const storageTank    = sizeStorageTank(annualLitres, residents);

    // ── First-flush diverter ──
    const firstFlushDiverter = sizeFirstFlushDiverter(areaInSqm);

    // ── Recommendation engine ──
    const systemRecommendation = recommendSystem({
      areaInSqm,
      annualLitresTotal: annualLitres,
      residents,
      groundwaterDepth: groundwaterInfo.groundwaterDepth,
      rechargeFeasible: groundwaterInfo.rechargeFeasible,
      infiltrationRate: groundwaterInfo.infiltrationRate,
      groundwaterWarnings: groundwaterInfo.warnings,
    });

    const response = {
      potentialCollection: annualLitres,
      monthlyCollection:   monthlyCollectionL,
      isEligible,
      roofMaterial,
      runoffCoefficient,
      subsidyAmount,
      subsidyInfo: { maxSubsidy, conditions, specialNotes, minArea },
      paybackPeriod,
      costSavingsYearly,
      waterSavingsPercentage: waterSavingsPct,
      tankCapacity: Math.round(captureVolumeCubicM * 0.25 * 100) / 100, // m³
      complianceItems,
      monthlyData,
      percolationPit,
      storageTank,
      groundwaterInfo,
      firstFlushDiverter,
      systemRecommendation,
      propertyWarnings: warnings,
      propertyRecommendations: recommendations,
    };

    return NextResponse.json(response, {
      status: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  } catch (error) {
    console.error('Calculate API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
