import { NextResponse } from 'next/server';

// This is a free geocoding API, but for production, consider a service with an API key.
const GEOCODE_API_ENDPOINT = 'https://geocoding-api.open-meteo.com/v1/search';

// Define the shape of the expected response from the external API
interface GeocodeApiResponse {
    results?: {
        id: number;
        name: string;
        latitude: number;
        longitude: number;
        country: string;
        admin1?: string; // State or major region
    }[];
}

export async function POST(request: Request) {
    try {
        const { address } = await request.json();

        if (!address) {
            return NextResponse.json({ error: 'Address is required.' }, { status: 400 });
        }

        // Construct the URL for the external API call
        const url = `${GEOCODE_API_ENDPOINT}?name=${encodeURIComponent(address)}&count=5&language=en&format=json`;

        const apiResponse = await fetch(url);
        if (!apiResponse.ok) {
            throw new Error('Geocoding service failed.');
        }

        const data: GeocodeApiResponse = await apiResponse.json();

        // Transform the data into the format your frontend expects
        const formattedResults = data.results?.map(item => ({
            id: item.id,
            name: item.name,
            latitude: item.latitude,
            longitude: item.longitude,
            country: item.country,
            admin1: item.admin1 || '',
        })) || [];

        return NextResponse.json(formattedResults, {
            status: 200,
            headers: { // CORS Headers to allow requests from your frontend
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
        });

    } catch (error) {
        console.error('Geocoding API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// Handle preflight OPTIONS requests for CORS
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