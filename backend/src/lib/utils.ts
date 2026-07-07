
import type { ValidationResult } from '../types'

/**
 * Validate latitude and longitude coordinates
 */
export function validateCoordinates(latitude: number, longitude: number): ValidationResult {
    const errors: string[] = []

    // Check if values are numbers
    if (typeof latitude !== 'number' || isNaN(latitude)) {
        errors.push('Latitude must be a valid number')
    } else {
        // Check latitude range
        if (latitude < -90 || latitude > 90) {
            errors.push('Latitude must be between -90 and 90 degrees')
        }
    }

    if (typeof longitude !== 'number' || isNaN(longitude)) {
        errors.push('Longitude must be a valid number')
    } else {
        // Check longitude range
        if (longitude < -180 || longitude > 180) {
            errors.push('Longitude must be between -180 and 180 degrees')
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    }
}

/**
 * Format a number with appropriate decimal places and thousands separators
 */
export function formatNumber(num: unknown, decimals: number = 2): string {
    if (typeof num !== 'number' || isNaN(num)) {
        return 'N/A'
    }

    return num.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: decimals
    })
}

/**
 * Format a date string to a readable format
 */
export function formatDate(dateString?: string): string {
    if (!dateString) return 'Unknown'

    try {
        const date = new Date(dateString)
        return date.toLocaleString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    } catch (error) {
        console.error('Error formatting date:', error)
        return dateString
    }
}

/**
 * Create a cache key from coordinates
 */
export function createCacheKey(latitude: number, longitude: number): string {
    // Round coordinates to reduce cache size while maintaining reasonable precision
    const roundedLat = Math.round(latitude * 100000) / 100000
    const roundedLon = Math.round(longitude * 100000) / 100000
    return `building_${roundedLat}_${roundedLon}`
}

/**
 * Validate GeoJSON geometry
 */
export function validateGeometry(geometry: unknown): ValidationResult {
    const errors: string[] = []

    if (!geometry || typeof geometry !== 'object') {
        errors.push('Geometry must be an object')
        return { isValid: false, errors }
    }

    const geom = geometry as Record<string, unknown>

    if (!geom.type) {
        errors.push('Geometry must have a type property')
    } else if (!['Point', 'LineString', 'Polygon', 'MultiPoint', 'MultiLineString', 'MultiPolygon'].includes(geom.type as string)) {
        errors.push('Invalid geometry type')
    }

    if (!geom.coordinates) {
        errors.push('Geometry must have coordinates')
    } else if (!Array.isArray(geom.coordinates)) {
        errors.push('Coordinates must be an array')
    }

    return {
        isValid: errors.length === 0,
        errors
    }
}

/**
 * Calculate the center point of a polygon
 */
export function calculatePolygonCenter(coordinates: number[][]): [number, number] {
    if (!coordinates || !Array.isArray(coordinates) || coordinates.length === 0) {
        return [0, 0]
    }

    let totalLon = 0
    let totalLat = 0
    let count = 0

    coordinates.forEach(([lon, lat]) => {
        // if (Array.isArray(coord) && coord.length >= 2) {
        //     totalLon += coord[0]
        //     totalLat += coord[1]
        //     count++
        // }
        if (typeof lon === "number" && typeof lat === "number") {
            totalLon += lon
            totalLat += lat
            count++
        }
    })

    if (count === 0) {
        return [0, 0]
    }

    return [totalLon / count, totalLat / count]
}

/**
 * Debounce function to limit how often a function can be called
 */
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null

    return function executedFunction(...args: Parameters<T>) {
        const later = () => {
            timeout = null
            func(...args)
        }

        if (timeout) clearTimeout(timeout)
        timeout = setTimeout(later, wait)
    }
}

/**
 * Check if the application is running in development mode
 */
export function isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development'
}

/**
 * Log messages only in development mode
 */
export function devLog(...args: any[]): void {
    if (isDevelopment()) {
        console.log('[DEV]', ...args)
    }
}

/**
 * Create a timeout promise
 */
export function timeout(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Safely parse JSON string
 */
export function safeJsonParse<T = any>(jsonString: string, defaultValue: T | null = null): T | null {
    try {
        return JSON.parse(jsonString) as T
    } catch (error) {
        console.error('Error parsing JSON:', error)
        return defaultValue
    }
}

/**
 * Type guard to check if an error is an instance of Error
 */
export function isError(error: unknown): error is Error {
    return error instanceof Error
}

/**
 * Get error message from unknown error type
 */
export function getErrorMessage(error: unknown): string {
    if (isError(error)) {
        return error.message
    }
    if (typeof error === 'string') {
        return error
    }
    return 'Unknown error occurred'
}