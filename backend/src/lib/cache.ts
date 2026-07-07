
import NodeCache from 'node-cache'
import type { CacheStats } from '../types'

// Create cache instance with default TTL of 10 minutes
const cache = new NodeCache({
    stdTTL: 0,
    checkperiod: 120, // Check for expired keys every 2 minutes
    useClones: false // Don't clone objects for better performance
})

/**
 * Get value from cache
 */
export function getFromCache(key: string): unknown {
    try {
        const value = cache.get(key)
        if (value !== undefined) {
            console.log(`Cache hit for key: ${key}`)
            return value
        }
        console.log(`Cache miss for key: ${key}`)
        return undefined
    } catch (error) {
        console.error('Error getting from cache:', error)
        return undefined
    }
}

/**
 * Set value in cache
 */
export function setCache(key: string, value: unknown, ttl?: number): boolean {
    try {
        const success = cache.set(key, value, ttl || 0)
        if (success) {
            console.log(`Cache set for key: ${key}${ttl ? ` (TTL: ${ttl}s)` : ''}`)
        } else {
            console.warn(`Failed to cache key: ${key}`)
        }
        return success
    } catch (error) {
        console.error('Error setting cache:', error)
        return false
    }
}

/**
 * Delete value from cache
 */
export function deleteFromCache(key: string): number {
    try {
        const deletedCount = cache.del(key)
        if (deletedCount > 0) {
            console.log(`Cache deleted for key: ${key}`)
        }
        return deletedCount
    } catch (error) {
        console.error('Error deleting from cache:', error)
        return 0
    }
}

/**
 * Check if key exists in cache
 */
export function hasInCache(key: string): boolean {
    try {
        return cache.has(key)
    } catch (error) {
        console.error('Error checking cache:', error)
        return false
    }
}

/**
 * Get cache statistics
 */
export function getCacheStats(): CacheStats {
    try {
        const stats = cache.getStats()
        return {
            ...stats,
            keys: cache.keys().length,
            timestamp: new Date().toISOString()
        }
    } catch (error) {
        console.error('Error getting cache stats:', error)
        return {
            keys: 0,
            hits: 0,
            misses: 0,
            ksize: 0,
            vsize: 0
        }
    }
}

/**
 * Clear all cache entries
 */
export function clearCache(): void {
    try {
        cache.flushAll()
        console.log('Cache cleared successfully')
    } catch (error) {
        console.error('Error clearing cache:', error)
    }
}

/**
 * Get all cache keys
 */
export function getCacheKeys(): string[] {
    try {
        return cache.keys()
    } catch (error) {
        console.error('Error getting cache keys:', error)
        return []
    }
}

interface KeyValuePair {
    key: string
    value: unknown
    ttl?: number
}

/**
 * Set multiple values in cache
 */
export function setMultipleCache(keyValuePairs: KeyValuePair[]): boolean {
    try {
        let allSuccess = true

        keyValuePairs.forEach(({ key, value, ttl }) => {
            const success = cache.set(key, value, ttl || 0)
            if (!success) {
                allSuccess = false
                console.warn(`Failed to cache key: ${key}`)
            }
        })

        if (allSuccess) {
            console.log(`Successfully cached ${keyValuePairs.length} items`)
        }

        return allSuccess
    } catch (error) {
        console.error('Error setting multiple cache entries:', error)
        return false
    }
}

/**
 * Get multiple values from cache
 */
export function getMultipleCache(keys: string[]): Record<string, unknown> {
    try {
        const result = cache.mget(keys)
        console.log(`Retrieved ${Object.keys(result).length}/${keys.length} items from cache`)
        return result
    } catch (error) {
        console.error('Error getting multiple cache entries:', error)
        return {}
    }
}

// Export the cache instance for advanced usage if needed
export { cache }