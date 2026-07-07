
'use client'

import { useState } from 'react'
import LoadingSpinner from './LoadingSpinner'
import type { CoordinateFormProps, FormErrors, GeocodingResult } from '../types'

export default function CoordinateForm({
    coordinates,
    onCoordinateChange,
    onSubmit,
    loading,
    onUseMyLocation,
    onLocationSelect,
    setLoading
}: CoordinateFormProps) {
    const [errors, setErrors] = useState<FormErrors>({})
    const [addressQuery, setAddressQuery] = useState('');
    const [addressResults, setAddressResults] = useState<GeocodingResult[]>([]);
    const [addressError, setAddressError] = useState<string | null>(null);

    const validateField = (field: keyof FormErrors, value: string): void => {
        const numValue = parseFloat(value)
        const newErrors = { ...errors }

        if (field === 'latitude') {
            if (value && (isNaN(numValue) || numValue < -90 || numValue > 90)) {
                newErrors.latitude = 'Latitude must be between -90 and 90'
            } else {
                delete newErrors.latitude
            }
        } else if (field === 'longitude') {
            if (value && (isNaN(numValue) || numValue < -180 || numValue > 180)) {
                newErrors.longitude = 'Longitude must be between -180 and 180'
            } else {
                delete newErrors.longitude
            }
        }

        setErrors(newErrors)
    }

    const handleInputChange = (field: 'latitude' | 'longitude', value: string): void => {
        onCoordinateChange(field, value)
        validateField(field, value)
    }


    const handleAddressSearch = async () => {
        setAddressError(null);
        if (addressQuery.trim() === '') {
            setAddressError('Please enter an address to search.');
            return;
        }

        if (setLoading) setLoading(true);
        setAddressResults([]);


        const endpoint = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addressQuery)}&format=json&addressdetails=1&countrycodes=in&limit=5`;

        try {
            const response = await fetch(endpoint);
            if (!response.ok) throw new Error('Geocoding service failed.');
            const data: GeocodingResult[] = await response.json();
            if (data.length === 0) {
                setAddressError('No results found for this address.');
            }
            setAddressResults(data);
        } catch (err) {
            setAddressError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            if (setLoading) setLoading(false);
        }
    };

    const handleAddressSelect = (result: GeocodingResult) => {
        onCoordinateChange('latitude', parseFloat(result.lat).toString());
        onCoordinateChange('longitude', parseFloat(result.lon).toString());
        setAddressResults([]);
        setAddressQuery('');
    };

    const isFormValid = (): boolean => {
        return Boolean(
            coordinates.latitude &&
            coordinates.longitude &&
            Object.keys(errors).length === 0 &&
            !loading
        )
    }

    return (
        <>

            <div className="relative space-y-2">
                <label htmlFor="address-search" className="block text-sm font-medium text-gray-700">
                    Search by Address
                </label>
                <div className="flex">
                    <input
                        id="address-search"
                        type="text"
                        placeholder="e.g., Connaught Place, New Delhi"
                        value={addressQuery}
                        onChange={(e) => setAddressQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddressSearch())}
                        className={`w-full px-3 py-2 border rounded-l-lg focus:ring-2 focus:ring-blue-500 transition-colors ${addressError ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                        disabled={loading}
                    />
                    <button
                        type="button"
                        onClick={handleAddressSearch}
                        disabled={loading}
                        className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-r-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                        Go
                    </button>
                </div>
                {addressError && <p className="text-sm text-red-600">⚠️ {addressError}</p>}
                {addressResults.length > 0 && (
                    <ul className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                        {addressResults.map((result) => (
                            <li
                                key={result.place_id}
                                onClick={() => handleAddressSelect(result)}
                                className="px-4 py-3 cursor-pointer hover:bg-gray-100 border-b last:border-b-0"
                            >
                                <p className="text-sm text-gray-800">{result.display_name}</p>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="flex items-center">
                <hr className="flex-grow border-t border-gray-300" />
                <span className="mx-4 text-xs font-semibold text-gray-500 uppercase">Or</span>
                <hr className="flex-grow border-t border-gray-300" />
            </div>

            <form onSubmit={onSubmit} className="space-y-4">

                <button
                    type="button"
                    onClick={onUseMyLocation}
                    disabled={loading}
                    className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                    <svg className="w-5 h-5 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    Use My Current Location
                </button>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-2 px-4 ..." // Your existing submit button
                >
                    {loading ? 'Searching...' : 'Find Building'}
                </button>


                {/* Latitude Input */}
                <div className="space-y-2">



                    <label htmlFor="latitude" className="block text-sm font-medium text-gray-700">
                        Latitude
                    </label>
                    <input
                        type="number"
                        id="latitude"
                        step="any"
                        placeholder="28.6282"
                        min="-90"
                        max="90"
                        value={coordinates.latitude}
                        onChange={(e) => handleInputChange('latitude', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.latitude ? 'border-red-500 bg-red-50' : 'border-gray-300'
                            }`}
                        disabled={loading}
                    />
                    {errors.latitude && (
                        <p className="text-sm text-red-600 flex items-center space-x-1">
                            <span>⚠️</span>
                            <span>{errors.latitude}</span>
                        </p>
                    )}
                    <p className="text-xs text-gray-500">Range: -90 to 90 degrees</p>
                </div>

                {/* Longitude Input */}
                <div className="space-y-2">
                    <label htmlFor="longitude" className="block text-sm font-medium text-gray-700">
                        Longitude
                    </label>
                    <input
                        type="number"
                        id="longitude"
                        step="any"
                        placeholder="77.4390"
                        min="-180"
                        max="180"
                        value={coordinates.longitude}
                        onChange={(e) => handleInputChange('longitude', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.longitude ? 'border-red-500 bg-red-50' : 'border-gray-300'
                            }`}
                        disabled={loading}
                    />
                    {errors.longitude && (
                        <p className="text-sm text-red-600 flex items-center space-x-1">
                            <span>⚠️</span>
                            <span>{errors.longitude}</span>
                        </p>
                    )}
                    <p className="text-xs text-gray-500">Range: -180 to 180 degrees</p>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={!isFormValid()}
                    className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${isFormValid()
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                >
                    {loading ? (
                        <>
                            <LoadingSpinner size="sm" />
                            <span>Searching...</span>
                        </>
                    ) : (
                        <>
                            <span>🔍</span>
                            <span>Find Building</span>
                        </>
                    )}
                </button>

                {/* Help Text */}
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800">
                        <span className="font-medium">💡 Tip:</span> This tool works best for locations in India where Microsoft Building Footprints data is available.
                    </p>
                </div>
            </form>
        </>
    )
}