import type { Map, Layer, LatLngBoundsExpression } from 'leaflet';

// Core data types for the Google Earth Engine Building Footprint Application

// Coordinate types
export interface Coordinates {
    latitude: number;
    longitude: number;
}

export interface CoordinateString {
    latitude: string;
    longitude: string;
}

// GeoJSON types
export interface GeoJSONGeometry {
    type: 'Point' | 'LineString' | 'Polygon' | 'MultiPoint' | 'MultiLineString' | 'MultiPolygon';
    coordinates: number[][] | number[][][];
}

export interface BuildingProperties {
    area?: number;
    buildingType?: string;
    dataSource?: string;
    queryTime?: string;
    FID?: number;
    coordinates?: string;
    cached?: boolean;
    cacheTime?: string;
    [key: string]: unknown; // Allow additional properties
}

export interface BuildingFeature {
    type: 'Feature';
    geometry: GeoJSONGeometry;
    id?: string | number;
    properties: BuildingProperties;
}

export interface BuildingData {
    type: 'FeatureCollection';
    features: BuildingFeature[];
    cached?: boolean;
    cacheTime?: string;
}

// API Request/Response types
export interface BuildingFootprintRequest {
    latitude: number;
    longitude: number;
}

export interface BuildingAreaRequest {
    geometry: GeoJSONGeometry;
}

export interface BuildingAreaResponse {
    area: number;
    unit: string;
    timestamp: string;
    geometry_type?: string;
}

export interface ApiErrorResponse {
    error: string;
    code: string;
    details?: string | string[];
}

export interface HealthCheckResponse {
    status: 'OK' | 'ERROR';
    timestamp: string;
    version?: string;
    earthEngine: 'Connected' | 'Disconnected' | 'Failed to connect' | 'Unknown';
    uptime?: number;
    environment?: string;
    node_version?: string;
    error?: string;
}

// Component prop types
export interface CoordinateFormProps {
    coordinates: CoordinateString;
    onCoordinateChange: (field: keyof CoordinateString, value: string) => void;
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
    loading: boolean;
    onUseMyLocation: () => void;
    onLocationSelect: (coords: Coordinates) => void;
    setLoading: (loading: boolean) => void;
}

// editable and clickable map view props
export interface MapViewProps {
    center?: [number, number];
    zoom?: number;
    buildingData?: BuildingData | null;
    userCoordinates?: Coordinates | null;
    onAreaUpdate?: (area: number) => void;
    onMapClick: (coords: Coordinates) => void;
}

export interface BuildingInfoProps {
    data: BuildingData | null;
    liveArea?: number | null;
}

export interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}

export interface AlertProps {
    type?: 'success' | 'error' | 'warning' | 'info';
    title?: string;
    message?: string;
    onClose?: () => void;
    autoClose?: boolean;
    duration?: number;
}

// Form validation types
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}

export interface FormErrors {
    latitude?: string;
    longitude?: string;
}

// Sample coordinates type
export interface SampleCoordinate {
    name: string;
    lat: number;
    lon: number;
}

// API Health status
export interface ApiHealthStatus {
    status: 'checking' | 'connected' | 'error';
    message: string;
}

// Alert state
export interface AlertState {
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
}

export interface GeocodingResult {
    place_id: number;
    licence: string;
    osm_type: string;
    osm_id: number;
    lat: string;
    lon: string;
    display_name: string;
    address: {
        road?: string;
        suburb?: string;
        city?: string;
        state?: string;
        postcode?: string;
        country?: string;
    };
    boundingbox: [string, string, string, string];
}

// Earth Engine service types
export interface EarthEngineConfig {
    projectId?: string;
    serviceAccountEmail?: string;
    privateKeyPath?: string;
    serviceAccountKey?: string;
}

export interface EarthEngineError extends Error {
    code?: string;
}

// Cache types
export interface CacheStats {
    keys: number;
    hits: number;
    misses: number;
    ksize: number;
    vsize: number;
    timestamp?: string;
}

// Utility types
export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Environment variables type
export interface EnvironmentConfig {
    GOOGLE_CLOUD_PROJECT_ID?: string;
    GEE_SERVICE_ACCOUNT_EMAIL?: string;
    GEE_PRIVATE_KEY_PATH?: string;
    GEE_SERVICE_ACCOUNT_KEY?: string;
    NEXT_PUBLIC_APP_URL?: string;
    CACHE_TTL_SECONDS?: string;
    NODE_ENV?: 'development' | 'production' | 'test';
    API_RATE_LIMIT_WINDOW_MS?: string;
    API_RATE_LIMIT_MAX_REQUESTS?: string;
    LOG_LEVEL?: string;
}

// Leaflet types (extending the library types)
export interface LeafletMapInstance {
    setView: (center: [number, number], zoom: number) => void;
    addLayer: (layer: Layer) => void;
    removeLayer: (layer: Layer) => void;
    fitBounds: (bounds: LatLngBoundsExpression) => void;
    remove: () => void;
}

// Google Earth Engine types
/* eslint-disable @typescript-eslint/no-namespace */

export namespace EE {
    export interface Geometry {
        type: string;
        coordinates: number[][];
    }

    export interface Feature {
        type: 'Feature';
        id?: string;
        properties?: { [key: string]: unknown };
        geometry: Geometry;
    }

    export interface FeatureCollection {
        type: 'FeatureCollection';
        features: Feature[];
    }
}

// Export utility type helpers
export type Prettify<T> = {
    [K in keyof T]: T[K];
} & {};

export type NonNullable<T> = T extends null | undefined ? never : T;

export type ValueOf<T> = T[keyof T];

export type KeysOfType<T, U> = {
    [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];