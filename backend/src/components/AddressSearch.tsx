
'use client';

import { useState } from 'react';
import type { GeocodingResult } from '../types'; // We will define this type

interface AddressSearchProps {
    onLocationSelect: (coords: { lat: number; lng: number; name: string }) => void;
    setLoading: (loading: boolean) => void;
}

export default function AddressSearch({ onLocationSelect, setLoading }: AddressSearchProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<GeocodingResult[]>([]);

    const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (query.trim() === '') return;

        setLoading(true);
        setResults([]);

        const endpoint = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&countrycodes=in`;

        try {
            const response = await fetch(endpoint, {
                headers: { 'Accept-Language': 'en' }
            });
            const data: GeocodingResult[] = await response.json();
            setResults(data);
        } catch (error) {
            console.error('Error fetching geocoding data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectResult = (result: GeocodingResult) => {
        onLocationSelect({
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon),
            name: result.display_name,
        });
        setResults([]); // Clear results after selection
        setQuery(''); // Clear input after selection
    };

    return (
        <div className="relative">
            <form onSubmit={handleSearch}>
                <label htmlFor="address-search" className="block text-sm font-medium text-gray-700 mb-1">
                    Search by Address
                </label>
                <div className="flex">
                    <input
                        id="address-search"
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="e.g., Connaught Place, New Delhi"
                        className="w-full px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500"
                    // disabled={loading}
                    />
                    <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-r-lg hover:bg-blue-700"
                    >
                        Search
                    </button>
                </div>


            </form>

            {results.length > 0 && (
                <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {results.map((result) => (
                        <li
                            key={result.place_id}
                            onClick={() => handleSelectResult(result)}
                            className="px-4 py-3 cursor-pointer hover:bg-gray-100 border-b last:border-b-0"
                        >
                            <p className="font-medium text-gray-800 text-sm">{result.display_name}</p>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
