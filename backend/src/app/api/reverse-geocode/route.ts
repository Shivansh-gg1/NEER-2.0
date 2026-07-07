import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { latitude, longitude } = await request.json();

    if (!latitude || !longitude) {
      return NextResponse.json({ error: 'Latitude and longitude are required.' }, { status: 400 });
    }

    // Call the Nominatim API for reverse geocoding
    const endpoint = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;

    const response = await fetch(endpoint, {
      headers: {
        // Nominatim requires a descriptive User-Agent header.
        'User-Agent': 'AquaMind SIH Project shivanshsharma.ait@gmail.com' 
      }
    });
    console.log(response)
    if (!response.ok) {
      throw new Error('Failed to fetch from Nominatim API.');
    }

    const data = await response.json();
    const address = data.display_name || 'Address not found';
    
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    return NextResponse.json({ address }, { status: 200, headers });

  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// This function handles CORS preflight requests
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