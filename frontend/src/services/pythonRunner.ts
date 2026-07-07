/**
 * Recharge structure sizing calculations (client-side).
 *
 * These mirror the logic in the backend calculate route so the PDF generator
 * can build a detailed report without an extra API call.
 *
 * All formulas follow IS:10500, CGWB guidelines, and IS:2470.
 */

export interface StructureDimensions {
  diameter?: number;    // m
  depth?: number;       // m
  height?: number;      // m
  wallThickness?: number; // m
  foundationHeight?: number; // m
  sideSlopeFactor?: number;
  freeboard?: number;
}

export interface StructureVolumes {
  storage: number;      // m³
  capture: number;      // m³
  excavation?: number;  // m³
}

export interface Layer {
  name: string;
  thickness: number; // m
}

export interface PythonScriptResult {
  success: boolean;
  consoleOutput: string[];
  dimensions: StructureDimensions;
  volumes: StructureVolumes;
  layers: Layer[];
  error?: string;
}

// ─── Percolation Pit ─────────────────────────────────────────────────────────

export const runPercolationScript = async (formData: {
  roofArea?: string | number;
  rainfall?: string | number;
}): Promise<PythonScriptResult> => {
  const areaInSqFt   = parseFloat(String(formData.roofArea  ?? 1000));
  const rainfallMm   = parseFloat(String(formData.rainfall  ?? 1200));
  const areaInSqm    = areaInSqFt / 10.764;

  // Annual runoff in m³
  const annualRunoffM3 = (areaInSqm * rainfallMm * 0.8) / 1000;

  // IS / CGWB design parameters
  const infiltrationRate = 0.50; // m/day (moderate Delhi alluvial soil)
  const targetDepth      = 2.00; // m
  const sideSlopeFactor  = 1.50; // H:V
  const freeboard        = 0.20; // m
  const storageVol       = annualRunoffM3 * 1.10; // 10% safety factor

  // Cylindrical pit: d = sqrt(4V / (π × depth))
  const diameter   = Math.sqrt((4 * storageVol) / (Math.PI * targetDepth));
  const planArea   = Math.PI * Math.pow(diameter / 2, 2);
  const excavVol   = planArea * (targetDepth + freeboard);

  const layers: Layer[] = [
    { name: 'Silt trap (fine mesh)', thickness: 0.30 },
    { name: 'Filter sand',            thickness: 0.30 },
    { name: `Gravel (20–40 mm)`,      thickness: targetDepth - 0.60 },
  ];

  const notes: string[] = [];
  if (annualRunoffM3 < 5)   notes.push('⚠ Small catchment — consider a recharge shaft instead');
  if (annualRunoffM3 > 100) notes.push('⚠ Large volume — consider multiple pits or a recharge trench');
  notes.push('✓ Suitable for groundwater recharge');
  notes.push('✓ Adequate storage capacity');
  notes.push('✓ Proper filtration layers configured');
  notes.push('✓ Clean silt trap every monsoon season');

  const output = [
    '--- Percolation Pit Analysis (IS:10500 / CGWB) ---',
    `Catchment area:      ${areaInSqm.toFixed(1)} m²`,
    `Annual rainfall:     ${rainfallMm} mm`,
    `Annual runoff:       ${annualRunoffM3.toFixed(2)} m³  (Cv = 0.80)`,
    '',
    '--- Design Parameters ---',
    `Diameter:            ${diameter.toFixed(2)} m`,
    `Depth:               ${targetDepth.toFixed(2)} m`,
    `Freeboard:           ${freeboard.toFixed(2)} m`,
    `Side slope:          1:${sideSlopeFactor}`,
    `Plan area:           ${planArea.toFixed(2)} m²`,
    `Storage volume:      ${storageVol.toFixed(2)} m³  (incl. 10% safety)`,
    `Excavation volume:   ${excavVol.toFixed(2)} m³`,
    `Infiltration rate:   ${infiltrationRate} m/day`,
    '',
    '--- Layer Configuration ---',
    ...layers.map((l, i) => `Layer ${i + 1}: ${l.name} (${l.thickness.toFixed(2)} m)`),
    '',
    '--- Recommendations ---',
    ...notes,
  ];

  return {
    success: true,
    consoleOutput: output,
    dimensions: { diameter: +diameter.toFixed(2), depth: targetDepth, freeboard, sideSlopeFactor },
    volumes: { storage: +storageVol.toFixed(2), capture: +annualRunoffM3.toFixed(2), excavation: +excavVol.toFixed(2) },
    layers,
  };
};

// ─── Storage Tank ─────────────────────────────────────────────────────────────

export const runTankScript = async (formData: {
  roofArea?: string | number;
  rainfall?: string | number;
  residents?: string | number;
}): Promise<PythonScriptResult> => {
  const areaInSqFt   = parseFloat(String(formData.roofArea  ?? 1000));
  const rainfallMm   = parseFloat(String(formData.rainfall  ?? 1200));
  const residents    = parseFloat(String(formData.residents ?? 4));
  const areaInSqm    = areaInSqFt / 10.764;

  const annualRunoffL  = areaInSqm * rainfallMm * 0.8;          // litres
  const dailyDemandL   = residents * 150;                        // litres/day
  // Store enough for 90 dry-season days, capped at 25% of annual harvest
  const targetStoreL   = Math.min(dailyDemandL * 90, annualRunoffL * 0.25);
  const volM3          = targetStoreL / 1000;

  // H:D = 1.5  →  V = π/4 × D² × 1.5D  →  D = ∛(4V / (1.5π))
  const diameter       = Math.cbrt((4 * volM3) / (1.5 * Math.PI));
  const height         = 1.5 * diameter;
  const wallThickness  = 0.10;   // ferrocement
  const foundHeight    = 0.30;
  const fillRatio      = 0.65;

  const layers: Layer[] = [
    { name: 'Foundation / plinth',        thickness: foundHeight },
    { name: 'Tank wall (ferrocement)',    thickness: wallThickness },
    { name: 'Waterproof inner plaster',   thickness: 0.015 },
  ];

  const notes = [
    '✓ Ferrocement or brick masonry construction recommended',
    '✓ Install first-flush diverter (2 mm runoff depth per catchment m²)',
    '✓ Mosquito-proof mesh on all inlets/outlets',
    '✓ Manhole with lockable cover for maintenance access',
    `✓ Recharge coefficient ${(annualRunoffL / (areaInSqm * rainfallMm) * 100).toFixed(0)}% — consider percolation pit for overflow`,
    volM3 > 50 ? '⚠ Tank > 50 m³ — consult structural engineer for RCC design' : '✓ Compact design suitable for residential plot',
  ];

  const output = [
    '--- Rainwater Storage Tank Analysis (IS:2470 / BIS) ---',
    `Catchment area:      ${areaInSqm.toFixed(1)} m²`,
    `Annual rainfall:     ${rainfallMm} mm`,
    `Annual runoff:       ${(annualRunoffL / 1000).toFixed(2)} m³`,
    `Residents:           ${residents}`,
    `Daily demand:        ${dailyDemandL} L/day`,
    '',
    '--- Design Parameters ---',
    `Tank diameter:       ${diameter.toFixed(2)} m`,
    `Tank height:         ${height.toFixed(2)} m`,
    `Storage volume:      ${volM3.toFixed(2)} m³  (${(targetStoreL / 1000).toFixed(0)} kL)`,
    `Operating fill:      ${(fillRatio * 100).toFixed(0)}%`,
    `Wall thickness:      ${(wallThickness * 1000).toFixed(0)} mm (ferrocement)`,
    `Foundation height:   ${(foundHeight * 100).toFixed(0)} cm`,
    `Runoff coefficient:  0.80`,
    '',
    '--- Construction Details ---',
    ...layers.map((l, i) => `Layer ${i + 1}: ${l.name} (${(l.thickness * 1000).toFixed(0)} mm)`),
    '',
    '--- Recommendations ---',
    ...notes,
  ];

  return {
    success: true,
    consoleOutput: output,
    dimensions: { diameter: +diameter.toFixed(2), height: +height.toFixed(2), wallThickness, foundationHeight: foundHeight },
    volumes: { storage: +volM3.toFixed(2), capture: +(annualRunoffL / 1000 * 0.25).toFixed(2) },
    layers,
  };
};
