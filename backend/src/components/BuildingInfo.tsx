
'use client'
import type { BuildingInfoProps } from '../types'

export default function BuildingInfo({ data, liveArea }: BuildingInfoProps) {
    if (!data || !data.features || data.features.length === 0) {
        return null
    }

    const feature = data.features[0]
    const properties = feature?.properties || {}

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const geometry = (feature?.geometry || {}) as { type?: string; coordinates?: any[][] }

    const formatNumber = (num: unknown): string => {
        if (typeof num !== 'number') return String(num || 'Unknown')
        return num.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        })
    }

    const formatDate = (dateString?: string): string => {
        if (!dateString) return 'Unknown'
        try {
            return new Date(dateString).toLocaleString()
        } catch {
            return dateString
        }
    }

    const area = liveArea ? liveArea : properties.area;

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🏢 Building Details</h3>

            <div className="grid grid-cols-1 gap-3">
                {/* Area */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Area</span>
                        <span className="text-lg font-bold text-blue-600">
                            {area ? `${formatNumber(area)} m²` : 'Unknown'}
                        </span>
                    </div>
                </div>

                {/* Building Type */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Type</span>
                        <span className="text-sm font-semibold text-green-600">
                            {properties.buildingType || 'Unknown'}
                        </span>
                    </div>
                </div>

                {/* Data Source */}
                <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-3 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Source</span>
                        <span className="text-sm font-semibold text-purple-600">
                            {properties.dataSource || 'Microsoft Building Footprints'}
                        </span>
                    </div>
                </div>

                {/* Building ID */}
                {feature?.id && (
                    <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-3 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">ID</span>
                            <span className="text-sm font-mono text-gray-600 truncate ml-2" title={String(feature.id)}>
                                {feature?.id}
                            </span>
                        </div>
                    </div>
                )}

                {/* Query Time */}
                {properties.queryTime && (
                    <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-3 rounded-lg border border-yellow-200">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Query Time</span>
                            <span className="text-sm text-yellow-600">
                                {formatDate(properties.queryTime)}
                            </span>
                        </div>
                    </div>
                )}

                {/* Cached indicator */}
                {properties.cached && (
                    <div className="bg-gradient-to-r from-orange-50 to-red-50 p-3 rounded-lg border border-orange-200">
                        <div className="flex items-center justify-center space-x-2">
                            <span className="text-sm font-medium text-orange-600">📋 Cached Result</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Geometry Info */}
            <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Geometry Details</h4>
                <div className="space-y-2 text-xs text-gray-600">
                    <div className="flex justify-between">
                        <span>Type:</span>
                        <span className="font-mono">{geometry.type || 'Unknown'}</span>
                    </div>
                    {geometry.coordinates && Array.isArray(geometry.coordinates[0]) && (
                        <div className="flex justify-between">
                            <span>Vertices:</span>
                            <span className="font-mono">{geometry.coordinates[0].length}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}