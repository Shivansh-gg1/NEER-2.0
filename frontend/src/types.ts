// ─── Core form & result data ──────────────────────────────────────────────────

export interface FormData {
  coordinates?: { lat: number; lng: number };
  address?: string;
  propertyType?: string;
  roofMaterial?: string;
  /** Roof area in square feet */
  roofArea?: string;
  residents?: string;
  /** Annual rainfall in mm (30-year average from Open-Meteo) */
  rainfall?: string;
}

export interface BuildingData {
  type: 'FeatureCollection';
  features: {
    type: 'Feature';
    geometry: any;
    id?: string | number;
    properties: {
      /** Area in square metres (returned by Google Earth Engine) */
      area: number;
      dataSource?: string;
      queryTime?: string;
      coordinates?: string;
      cached?: boolean;
      cacheTime?: string;
      [key: string]: unknown;
    };
  }[];
  cached?: boolean;
  cacheTime?: string;
}

export interface GroundwaterInfo {
  zone: string;
  groundwaterDepth: number;
  soilType: string;
  infiltrationRate: number;
  rechargeFeasible: boolean;
  maxPitDepth: number;
  warnings: string[];
}

export interface FirstFlushDiverter {
  catchmentAreaSqm: number;
  firstFlushDepthMm: number;
  firstFlushVolumeLitres: number;
  vesselVolumeLitres: number;
  pvcPipeDiameterMm: number;
  pvcPipeLengthM: number;
  notes: string[];
}

export type SystemRecommendationType = 'storage_tank_only' | 'recharge_pit_only' | 'hybrid';

export interface SystemRecommendation {
  type: SystemRecommendationType;
  label: string;
  storageFraction: number;
  rechargeFraction: number;
  reasons: string[];
  confidence: 'high' | 'medium' | 'low';
  storageVolumeCubicM: number;
  rechargeVolumeCubicM: number;
}

export interface ResultsData {
  /** Annual harvestable volume in litres */
  potentialCollection: number;
  /** Monthly average harvestable volume in litres */
  monthlyCollection: number;
  isEligible: boolean;
  roofMaterial?: string;
  runoffCoefficient?: number;
  subsidyAmount: number;
  paybackPeriod: number;
  costSavingsYearly: number;
  waterSavingsPercentage: number;
  /** Recommended storage tank capacity in cubic metres */
  tankCapacity: number;
  complianceItems: { item: string; status: boolean; authority: string }[];
  monthlyData: { month: string; collection: number }[];
  percolationPit?: RechargeStructure;
  storageTank?: RechargeStructure;
  groundwaterInfo?: GroundwaterInfo;
  firstFlushDiverter?: FirstFlushDiverter;
  systemRecommendation?: SystemRecommendation;
  propertyWarnings?: string[];
  propertyRecommendations?: string[];
  formData?: FormData;
}

export interface RechargeStructure {
  type: 'percolation_pit' | 'storage_tank';
  dimensions: {
    diameter?: number;
    depth?: number;
    length?: number;
    width?: number;
    height?: number;
  };
  volumes: {
    storage?: number;
    capture?: number;
    excavation?: number;
  };
  layers?: { name: string; thickness: number }[];
  notes: string[];
}

// ─── Component prop types ──────────────────────────────────────────────────────

export interface GeocodeResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  admin1?: string;
  country?: string;
}

export interface LocationStepProps {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
  onNext: () => void;
  onDetectLocation: () => void;
  onCoordinatesSubmit: (lat: string, lng: string) => void;
  onAddressSearch: (query: string) => void;
  onAddressSelect: (result: GeocodeResult) => void;
  isLoading: boolean;
  error: string | null;
  addressSearchResults: GeocodeResult[] | null;
}

export interface PropertyDetailsStepProps {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
  buildingData: BuildingData | null;
  onNext: () => void;
  onPrevious: () => void;
}

export interface ResultsDashboardProps {
  resultsData: ResultsData;
  onPrevious: () => void;
  onStartOver: () => void;
}
