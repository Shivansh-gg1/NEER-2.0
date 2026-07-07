import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { runPercolationScript, runTankScript } from './pythonRunner';

// ═══════════════════════════════════════════════════════════════════════════
// OVERLAY LABEL SYSTEM & PDF GENERATOR
// ═══════════════════════════════════════════════════════════════════════════

const DEBUG_OVERLAY = false;

const PIT_LABEL_COORDS = {
  pitDiameter:      { x: 75,  y: 38 },
  pitDepth:         { x: 155, y: 65 },
  storageVolume:    { x: 75,  y: 115 },
  infiltrationRate: { x: 20,  y: 108 },
  siltTrapLayer:    { x: 20,  y: 46 },
  sandLayer:        { x: 20,  y: 62 },
  gravelLayer:      { x: 20,  y: 85 },
};

const TANK_LABEL_COORDS = {
  tankDiameter:    { x: 75,  y: 28 },
  tankHeight:      { x: 155, y: 58 },
  storageVolume:   { x: 75,  y: 72 },
  wallThickness:   { x: 18,  y: 55 },
  foundationDepth: { x: 75,  y: 108 },
};

interface OverlayLabelOptions {
  fontSize?:    number;
  align?:       'left' | 'center' | 'right';
  color?:       string;
  background?:  boolean;
  rounded?:     boolean;
  paddingX?:    number;
  paddingY?:    number;
  bold?:        boolean;
}

function drawOverlayLabel(pdf: jsPDF, text: string, absX: number, absY: number, options: OverlayLabelOptions = {}): void {
  const { fontSize = 8, align = 'left', color = '#0f172a', background = true, rounded = true, paddingX = 2.0, paddingY = 1.5, bold = false } = options;
  pdf.setFontSize(fontSize);
  pdf.setFont('helvetica', bold ? 'bold' : 'normal');
  const textW = pdf.getTextWidth(text);
  const lineH = fontSize * 0.3528;
  const boxX = align === 'center' ? absX - textW / 2 - paddingX : align === 'right' ? absX - textW - paddingX : absX - paddingX;
  const boxY = absY - lineH - paddingY + 0.5;
  const boxW = textW + paddingX * 2;
  const boxH = lineH + paddingY * 2;

  if (background) {
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(226, 232, 240); // slate-200
    pdf.setLineWidth(0.3);
    if (rounded) {
      pdf.roundedRect(boxX, boxY, boxW, boxH, 1, 1, 'FD');
    } else {
      pdf.rect(boxX, boxY, boxW, boxH, 'FD');
    }
  }
  const hexMatch = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
  if (hexMatch) {
    pdf.setTextColor(parseInt(hexMatch[1], 16), parseInt(hexMatch[2], 16), parseInt(hexMatch[3], 16));
  }
  pdf.text(text, absX, absY, { align });
  pdf.setTextColor(15, 23, 42); // slate-900
  pdf.setLineWidth(0.2);
}

function drawDebugGrid(pdf: jsPDF, originX: number, originY: number, width: number, height: number): void {
  if (!DEBUG_OVERLAY) return;
  pdf.setDrawColor(220, 100, 100);
  pdf.setLineWidth(0.1);
  pdf.setFontSize(5);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(200, 60, 60);
  const step = 10;
  for (let dx = 0; dx <= width; dx += step) {
    const lx = originX + dx;
    pdf.line(lx, originY, lx, originY + height);
    pdf.text(`${dx}`, lx + 0.5, originY + 4);
  }
  for (let dy = 0; dy <= height; dy += step) {
    const ly = originY + dy;
    pdf.line(originX, ly, originX + width, ly);
    pdf.text(`${dy}`, originX + 0.5, ly + 1);
  }
}

const getRunoffCoefficient = (material: string): number => {
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
};

const imageToBase64 = async (imagePath: string): Promise<string | null> => {
  const publicUrl = imagePath.includes('percolation_pit') ? '/diagrams/percolation_pit.png' : imagePath.includes('rainwater_tank') || imagePath.includes('storage_tank') ? '/diagrams/rainwater_tank.png' : imagePath;
  try {
    const response = await fetch(publicUrl);
    if (!response.ok) return null;
    const blob = await response.blob();
    return new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onload  = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    return null;
  }
};

export const generatePDF = async (formData: any, dashboardElement: HTMLElement, resultsData?: any) => {
  const [percolationResult, tankResult] = await Promise.all([
    runPercolationScript(formData),
    runTankScript(formData)
  ]);

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  const MARGIN_X = 20;
  const MARGIN_Y = 25;
  const BOTTOM_MARGIN = 25;
  const CONTENT_WIDTH = pageWidth - (MARGIN_X * 2);
  let yPosition = MARGIN_Y;
  let pageNumber = 1;

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null;
  };

  const addHeader = () => {
    if (pageNumber === 1) return;
    pdf.setFillColor(6, 14, 30); // NEER Navy
    pdf.rect(0, 0, pageWidth, 12, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(255, 255, 255);
    pdf.text('NEER ENVIRONMENTAL INTELLIGENCE', MARGIN_X, 8);
    pdf.setFont('helvetica', 'normal');
    pdf.text(new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), pageWidth - MARGIN_X, 8, { align: 'right' });
    pdf.setTextColor(15, 23, 42); // Reset to slate-900
  };

  const addFooter = () => {
    pdf.setFillColor(248, 250, 252);
    pdf.rect(0, pageHeight - 16, pageWidth, 16, 'F');
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.5);
    pdf.line(MARGIN_X, pageHeight - 16, pageWidth - MARGIN_X, pageHeight - 16);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 139);
    pdf.text('NEER | Rainwater Feasibility Assessment', MARGIN_X, pageHeight - 7);
    pdf.text(`Page ${pageNumber}`, pageWidth - MARGIN_X, pageHeight - 7, { align: 'right' });
    pdf.setTextColor(15, 23, 42); // Reset
  };

  const checkPageBreak = (requiredHeight: number) => {
    if (yPosition + requiredHeight > pageHeight - BOTTOM_MARGIN) {
      addFooter();
      pdf.addPage();
      pageNumber++;
      addHeader();
      yPosition = MARGIN_Y;
      return true;
    }
    return false;
  };

  const addText = (text: string, fontSize: number = 10, isBold: boolean = false, color: string = '#0f172a', align: 'left'|'center'|'right' = 'left', overrideX?: number) => {
    pdf.setFontSize(fontSize);
    pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
    const rgb = hexToRgb(color);
    if (rgb) pdf.setTextColor(rgb.r, rgb.g, rgb.b);
    
    // Fix: Remove the regex that breaks characters. Just trim.
    const cleanText = text.trim();
    
    const lines = pdf.splitTextToSize(cleanText, CONTENT_WIDTH);
    const requiredHeight = lines.length * (fontSize * 0.45);
    checkPageBreak(requiredHeight);

    lines.forEach((line: string) => {
      const xPos = overrideX !== undefined ? overrideX : (align === 'center' ? pageWidth / 2 : (align === 'right' ? pageWidth - MARGIN_X : MARGIN_X));
      pdf.text(line, xPos, yPosition, { align });
      yPosition += fontSize * 0.45;
    });
    yPosition += 2; // paragraph spacing
  };

  const addSectionHeader = (title: string, newPage: boolean = false) => {
    if (newPage) {
      addFooter();
      pdf.addPage();
      pageNumber++;
      addHeader();
      yPosition = MARGIN_Y + 5;
    } else {
      checkPageBreak(25);
      yPosition += 8;
    }
    pdf.setDrawColor(14, 165, 233); // Cyan 500
    pdf.setLineWidth(1);
    pdf.line(MARGIN_X, yPosition - 5, MARGIN_X, yPosition + 2);
    addText(title, 14, true, '#0f172a', 'left', MARGIN_X + 3);
    yPosition += 4;
  };

  const addCard = (title: string, items: {label: string, value: string, color?: string}[], bgColor: string = '#f8fafc', accentColor: string = '#0ea5e9') => {
    const cardPadding = 6;
    const lineSpacing = 6;
    const requiredHeight = 12 + (items.length * lineSpacing) + cardPadding * 2;
    checkPageBreak(requiredHeight);

    // Draw modern panel
    pdf.setFillColor(...(hexToRgb(bgColor) ? Object.values(hexToRgb(bgColor)!) : [248, 250, 252]) as [number, number, number]);
    pdf.roundedRect(MARGIN_X, yPosition, CONTENT_WIDTH, requiredHeight, 2, 2, 'F');
    
    // Left Accent line
    pdf.setDrawColor(...(hexToRgb(accentColor) ? Object.values(hexToRgb(accentColor)!) : [14, 165, 233]) as [number, number, number]);
    pdf.setLineWidth(1.5);
    pdf.line(MARGIN_X, yPosition + 2, MARGIN_X, yPosition + requiredHeight - 2);

    let cardY = yPosition + cardPadding + 4;
    
    // Card Title
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(15, 23, 42); // slate-900
    pdf.text(title, MARGIN_X + 5, cardY);
    cardY += 8;

    // Card Items
    pdf.setFontSize(10);
    items.forEach(item => {
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(71, 85, 105); // slate-500
      pdf.text(item.label + ':', MARGIN_X + 5, cardY);
      
      const labelWidth = pdf.getTextWidth(item.label + ': ');
      pdf.setFont('helvetica', item.color ? 'bold' : 'normal');
      const valRgb = item.color ? hexToRgb(item.color) : {r: 15, g: 23, b: 42};
      pdf.setTextColor(valRgb!.r, valRgb!.g, valRgb!.b);
      pdf.text(item.value, MARGIN_X + 5 + labelWidth, cardY);
      
      cardY += lineSpacing;
    });

    yPosition += requiredHeight + 8;
  };

  const addImage = async (imageData: string | null, title: string, width: number = 150, height: number = 100) => {
    checkPageBreak(height + 15);
    const xPos = (pageWidth - width) / 2; // Center image
    
    if (imageData) {
      try {
        const base64 = (imageData.startsWith('data:') || imageData.startsWith('/9j/')) ? imageData : await imageToBase64(imageData);
        if (base64) {
          pdf.addImage(base64, 'PNG', xPos, yPosition, width, height);
        } else {
          pdf.setFillColor(241, 245, 249);
          pdf.rect(xPos, yPosition, width, height, 'F');
          pdf.setFontSize(10);
          pdf.setTextColor(148, 163, 184);
          pdf.text(`[ Image Unavailable: ${title} ]`, pageWidth / 2, yPosition + height / 2, { align: 'center' });
        }
      } catch (error) {
        pdf.setFillColor(241, 245, 249);
        pdf.rect(xPos, yPosition, width, height, 'F');
      }
    }
    
    // Draw caption
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'italic');
    pdf.setTextColor(100, 116, 139);
    pdf.text(`Fig: ${title}`, pageWidth / 2, yPosition + height + 5, { align: 'center' });
    
    yPosition += height + 12;
    return { x: xPos, y: yPosition - height - 12, w: width, h: height };
  };

  // --- DATA EXTRACTION ---
  const {
    potentialCollection = 0, // litres
    monthlyCollection = 0, // litres
    costSavingsYearly = 0,
    waterSavingsPercentage = 0,
    paybackPeriod = 0,
    subsidyAmount = 0,
    subsidyInfo: subInfo = {},
    propertyWarnings = [],
    isEligible = false
  } = resultsData || {};

  const potentialCollectionM3 = Math.round(potentialCollection / 1000);
  const monthlyCollectionM3 = Math.round(monthlyCollection / 1000);

  const propertyType = formData.propertyType || 'Independent House';
  const roofArea = parseInt(formData.roofArea) || 0;
  const roofAreaSqm = Math.round(roofArea * 0.092903);
  const residents = parseInt(formData.residents) || 1;
  const dailyConsumption = residents * 150;
  const yearlyConsumptionM3 = Math.round(dailyConsumption * 365 / 1000);

  // ═══════════════════════════════════════════════════════════════════════════
  // COVER PAGE (PAGE 1)
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Dark Background
  pdf.setFillColor(6, 14, 30);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  
  // Decorative Grid Overlay
  pdf.setDrawColor(30, 41, 59);
  pdf.setLineWidth(0.2);
  for(let i=0; i<pageWidth; i+=20) pdf.line(i, 0, i, pageHeight);
  for(let i=0; i<pageHeight; i+=20) pdf.line(0, i, pageWidth, i);

  // Large NEER Branding
  pdf.setFontSize(48);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(14, 165, 233); // Cyan
  pdf.text('NEER', MARGIN_X, 80);

  // Title
  pdf.setFontSize(28);
  pdf.setTextColor(255, 255, 255);
  pdf.text('Environmental Intelligence', MARGIN_X, 100);
  pdf.setFontSize(24);
  pdf.setTextColor(148, 163, 184); // Slate 400
  pdf.text('Rainwater Feasibility Assessment', MARGIN_X, 112);

  // Cover Details Panel
  pdf.setFillColor(15, 23, 42); // Slate 900
  pdf.rect(MARGIN_X, 150, CONTENT_WIDTH, 70, 'F');
  pdf.setDrawColor(14, 165, 233);
  pdf.setLineWidth(2);
  pdf.line(MARGIN_X, 150, MARGIN_X, 220); // Left accent
  
  pdf.setFontSize(11);
  pdf.setTextColor(100, 116, 139);
  pdf.text('PREPARED FOR', MARGIN_X + 10, 165);
  pdf.setFontSize(14);
  pdf.setTextColor(248, 250, 252);
  const addr = formData.address || 'Address Not Provided';
  const splitAddr = pdf.splitTextToSize(addr, CONTENT_WIDTH - 20);
  pdf.text(splitAddr, MARGIN_X + 10, 175);
  
  pdf.setFontSize(11);
  pdf.setTextColor(100, 116, 139);
  pdf.text('DATE GENERATED', MARGIN_X + 10, 195);
  pdf.setFontSize(14);
  pdf.setTextColor(248, 250, 252);
  pdf.text(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), MARGIN_X + 10, 205);

  // End Cover
  addFooter();
  pdf.addPage();
  pageNumber++;
  addHeader();
  yPosition = MARGIN_Y;

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGE 2: Property & Executive Summary
  // ═══════════════════════════════════════════════════════════════════════════

  addSectionHeader('Property Specifications');
  addCard('Asset Details', [
    { label: 'Property Type', value: formData.propertyType || 'Not specified' },
    { label: 'Roof Material', value: formData.roofMaterial || 'RCC / concrete flat roof' },
    { label: 'Roof Footprint', value: `${formData.roofArea || '0'} sq.ft (${roofAreaSqm} m²)` },
    { label: 'Occupancy', value: `${formData.residents || '1'} Residents` },
    { label: 'Annual Rainfall', value: `${formData.rainfall || '1200'} mm` }
  ], '#f8fafc', '#0ea5e9');

  addSectionHeader('Intelligence Summary');
  
  // Custom Bar Chart for Water Harvest
  checkPageBreak(80);
  pdf.setFillColor(248, 250, 252);
  pdf.roundedRect(MARGIN_X, yPosition, CONTENT_WIDTH, 60, 2, 2, 'F');
  pdf.setDrawColor(16, 185, 129); // Emerald
  pdf.setLineWidth(1.5);
  pdf.line(MARGIN_X, yPosition + 2, MARGIN_X, yPosition + 58);
  
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(15, 23, 42);
  pdf.text('Annual Water Balance', MARGIN_X + 5, yPosition + 10);
  
  const maxVol = Math.max(potentialCollectionM3, yearlyConsumptionM3) * 1.2;
  const barMaxWidth = CONTENT_WIDTH - 80;
  
  const drawBar = (y: number, label: string, val: number, color: [number,number,number]) => {
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(71, 85, 105);
    pdf.text(label, MARGIN_X + 5, y + 4);
    
    const w = (val / maxVol) * barMaxWidth;
    pdf.setFillColor(color[0], color[1], color[2]);
    pdf.rect(MARGIN_X + 35, y, w, 6, 'F');
    
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(15, 23, 42);
    pdf.text(`${val.toLocaleString()} m³`, MARGIN_X + 40 + w, y + 5);
  };
  
  drawBar(yPosition + 25, 'Harvest', potentialCollectionM3, [14, 165, 233]);
  drawBar(yPosition + 40, 'Demand', yearlyConsumptionM3, [244, 63, 94]);
  
  yPosition += 70;

  addCard('Harvest Potential', [
    { label: 'Annual Capture', value: `${potentialCollectionM3.toLocaleString()} m³ / year` },
    { label: 'Monthly Average', value: `${monthlyCollectionM3.toLocaleString()} m³ / month` },
    { label: 'Demand Offset', value: `${waterSavingsPercentage}% of total household needs`, color: waterSavingsPercentage > 50 ? '#059669' : '#d97706' },
  ], '#f8fafc', '#10b981'); // Emerald accent

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGE 3: Financials & Subsidies
  // ═══════════════════════════════════════════════════════════════════════════
  addSectionHeader('Financial & Policy Analysis', true);

  const netBenefit = costSavingsYearly * 20 - 120000;
  addCard('ROI Projections', [
    { label: 'Annual Cost Savings', value: `INR ${costSavingsYearly.toLocaleString()}`, color: '#059669' },
    { label: '20-Year Gross Savings', value: `INR ${(costSavingsYearly * 20).toLocaleString()}`, color: '#059669' },
    { label: 'Estimated Setup Cost', value: `INR 120,000` },
    { label: 'Net 20-Year Benefit', value: `INR ${netBenefit.toLocaleString()}`, color: netBenefit > 0 ? '#059669' : '#dc2626' },
    { label: 'Est. Payback Period', value: `${paybackPeriod} years`, color: paybackPeriod <= 10 ? '#059669' : '#d97706' },
  ], '#f8fafc', '#f59e0b'); // Amber accent

  addCard('Government Subsidy Status', [
    { label: 'Eligibility Status', value: isEligible ? 'Potentially Eligible' : 'Not Eligible', color: isEligible ? '#059669' : '#dc2626' },
    { label: 'Estimated Subsidy', value: `INR ${subsidyAmount.toLocaleString()}` },
    { label: 'Max Possible Cap', value: `INR ${subInfo.maxSubsidy?.toLocaleString() || 0}` },
    { label: 'Requirements', value: subInfo.conditions || 'Must follow DJB specs' },
  ], isEligible ? '#ecfdf5' : '#fef2f2', isEligible ? '#10b981' : '#f43f5e');

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGE 4: Engineering Analysis & First Flush
  // ═══════════════════════════════════════════════════════════════════════════
  addSectionHeader('Engineering Recommendations', true);
  
  const rec = resultsData?.systemRecommendation as any;
  if (rec) {
    addCard('Optimal System Architecture', [
      { label: 'Recommended Action', value: rec.label.toUpperCase(), color: '#4f46e5' },
      { label: 'AI Confidence', value: `${rec.confidence.toUpperCase()}` },
      ...(rec.type === 'hybrid' ? [
        { label: 'Storage Volume', value: `${rec.storageVolumeCubicM} m³ (${Math.round(rec.storageFraction*100)}%)` },
        { label: 'Recharge Volume', value: `${rec.rechargeVolumeCubicM} m³ (${Math.round(rec.rechargeFraction*100)}%)` },
      ] : [])
    ], '#e0e7ff', '#4f46e5'); // Indigo theme
  }

  const ffd = resultsData?.firstFlushDiverter as any;
  if (ffd) {
    addCard('First-Flush Diverter Sizing (IS:15797)', [
      { label: 'Catchment Area', value: `${ffd.catchmentAreaSqm} m²` },
      { label: 'Contamination Flush', value: `${ffd.firstFlushVolumeLitres} Litres` },
      { label: 'Recommended Vessel', value: `${ffd.vesselVolumeLitres} Litres (includes safety factor)` },
      { label: 'Pipe Specification', value: `Ø${ffd.pvcPipeDiameterMm} mm PVC × ${ffd.pvcPipeLengthM} m length` },
    ], '#f8fafc', '#64748b');
  }

  // Engineering Warnings
  if (propertyWarnings && propertyWarnings.length > 0) {
    addSectionHeader('Critical Engineering Notes');
    propertyWarnings.forEach((warning: string, i: number) => {
      addCard(`Regulatory Advisory ${i + 1}`, [
        { label: 'Directive', value: warning, color: '#dc2626' }
      ], '#fef2f2', '#ef4444');
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGE 5: Tank & Pit Schematics
  // ═══════════════════════════════════════════════════════════════════════════
  
  if (tankResult.success) {
    addSectionHeader('Storage Tank Schematic', true);
    const bounds = await addImage('rainwater_tank', 'IS Standard Rainwater Storage Tank', 150, 120);
    const t = resultsData?.storageTank;
    if (t) {
      drawDebugGrid(pdf, bounds.x, bounds.y, bounds.w, bounds.h);
      const o = (opts: any) => ({ fontSize: 7.5, color: '#0f172a', ...opts });
      drawOverlayLabel(pdf, t.dimensions?.diameter ? `Ø ${t.dimensions.diameter} m` : 'Ø — m', bounds.x + TANK_LABEL_COORDS.tankDiameter.x, bounds.y + TANK_LABEL_COORDS.tankDiameter.y, o({ align: 'center', bold: true }));
      drawOverlayLabel(pdf, t.dimensions?.height ? `H = ${t.dimensions.height} m` : 'H = — m', bounds.x + TANK_LABEL_COORDS.tankHeight.x, bounds.y + TANK_LABEL_COORDS.tankHeight.y, o({ align: 'left' }));
      drawOverlayLabel(pdf, t.volumes?.storage ? `${t.volumes.storage} m³` : '— m³', bounds.x + TANK_LABEL_COORDS.storageVolume.x, bounds.y + TANK_LABEL_COORDS.storageVolume.y, o({ align: 'center', bold: true, color: '#0f5132' }));
      drawOverlayLabel(pdf, t.dimensions?.wallThickness ? `Wall: ${(t.dimensions.wallThickness*1000).toFixed(0)} mm` : 'Wall: —', bounds.x + TANK_LABEL_COORDS.wallThickness.x, bounds.y + TANK_LABEL_COORDS.wallThickness.y, o({ align: 'left' }));
      drawOverlayLabel(pdf, t.dimensions?.foundationHeight ? `Base: ${t.dimensions.foundationHeight} m` : 'Base: —', bounds.x + TANK_LABEL_COORDS.foundationDepth.x, bounds.y + TANK_LABEL_COORDS.foundationDepth.y, o({ align: 'center', color: '#6b4c11' }));
      
      addCard('Storage Specifications', [
        { label: 'Effective Height', value: `${t.dimensions?.height || '—'} m` },
        { label: 'Inner Diameter', value: `${t.dimensions?.diameter || '—'} m` },
        { label: 'Storage Capacity', value: `${t.volumes?.storage || '—'} m³` },
      ]);
    }
  }

  if (percolationResult.success) {
    addSectionHeader('Percolation Pit Schematic', true);
    const bounds = await addImage('percolation_pit', 'IS Standard Ground Recharge Pit', 150, 120);
    const p = resultsData?.percolationPit;
    if (p) {
      drawDebugGrid(pdf, bounds.x, bounds.y, bounds.w, bounds.h);
      const o = (opts: any) => ({ fontSize: 7.5, color: '#0f172a', ...opts });
      drawOverlayLabel(pdf, p.dimensions?.diameter ? `Ø ${p.dimensions.diameter} m` : 'Ø — m', bounds.x + PIT_LABEL_COORDS.pitDiameter.x, bounds.y + PIT_LABEL_COORDS.pitDiameter.y, o({ align: 'center', bold: true }));
      drawOverlayLabel(pdf, p.dimensions?.depth ? `Depth: ${p.dimensions.depth} m` : 'Depth: — m', bounds.x + PIT_LABEL_COORDS.pitDepth.x, bounds.y + PIT_LABEL_COORDS.pitDepth.y, o({ align: 'left' }));
      drawOverlayLabel(pdf, p.volumes?.storage ? `${p.volumes.storage} m³` : '— m³', bounds.x + PIT_LABEL_COORDS.storageVolume.x, bounds.y + PIT_LABEL_COORDS.storageVolume.y, o({ align: 'center', bold: true, color: '#0f5132' }));
      drawOverlayLabel(pdf, resultsData?.groundwaterInfo?.infiltrationRate ? `k = ${resultsData.groundwaterInfo.infiltrationRate} m/d` : 'k = —', bounds.x + PIT_LABEL_COORDS.infiltrationRate.x, bounds.y + PIT_LABEL_COORDS.infiltrationRate.y, o({ align: 'left', color: '#6b4c11' }));
      
      drawOverlayLabel(pdf, `Silt Trap: ${p.layers?.[0]?.thickness || 0.3} m`, bounds.x + PIT_LABEL_COORDS.siltTrapLayer.x, bounds.y + PIT_LABEL_COORDS.siltTrapLayer.y, o({ align: 'left', fontSize: 6.5 }));
      drawOverlayLabel(pdf, `Sand: ${p.layers?.[1]?.thickness || 0.3} m`, bounds.x + PIT_LABEL_COORDS.sandLayer.x, bounds.y + PIT_LABEL_COORDS.sandLayer.y, o({ align: 'left', fontSize: 6.5 }));
      drawOverlayLabel(pdf, `Gravel: ${p.layers?.[2]?.thickness || 1.4} m`, bounds.x + PIT_LABEL_COORDS.gravelLayer.x, bounds.y + PIT_LABEL_COORDS.gravelLayer.y, o({ align: 'left', fontSize: 6.5 }));
      
      addCard('Recharge Specifications', [
        { label: 'Excavation Depth', value: `${p.dimensions?.depth || '—'} m` },
        { label: 'Pit Diameter', value: `${p.dimensions?.diameter || '—'} m` },
        { label: 'Void Storage Cap.', value: `${p.volumes?.storage || '—'} m³` },
      ]);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LEGAL DISCLAIMER
  // ═══════════════════════════════════════════════════════════════════════════
  checkPageBreak(50);
  yPosition += 10;
  pdf.setDrawColor(203, 213, 225); // slate-300
  pdf.setLineWidth(0.5);
  pdf.line(MARGIN_X, yPosition, pageWidth - MARGIN_X, yPosition);
  yPosition += 5;
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(15, 23, 42);
  pdf.text('IMPORTANT DISCLAIMER', MARGIN_X, yPosition);
  yPosition += 4;
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(71, 85, 105); // slate-500
  
  const disclaimerText = "This assessment provides a technical feasibility estimate based on available site inputs, rainfall data, and engineering assumptions. Final subsidy approval, adequacy certification, and regulatory compliance remain subject to inspection and approval by Delhi Jal Board (DJB), CGWB guidelines, applicable building bye-laws, and site-specific conditions.";
  const disclaimerLines = pdf.splitTextToSize(disclaimerText, CONTENT_WIDTH);
  pdf.text(disclaimerLines, MARGIN_X, yPosition);

  // Wrap up footer for the final page
  addFooter();
  return pdf;
};

export const downloadPDF = async (formData: any, dashboardElement: HTMLElement, resultsData?: any) => {
  try {
    const pdf = await generatePDF(formData, dashboardElement, resultsData);
    const fileName = `NEER-Intelligence-Report-${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};
