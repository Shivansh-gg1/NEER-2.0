import { NextResponse } from 'next/server';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// 30-year period for a stable long-term average
const START_DATE = '1994-01-01';
const END_DATE   = '2023-12-31';
const NUM_YEARS  = 30;

export async function POST(request: Request) {
  try {
    const { latitude, longitude } = await request.json();

    if (latitude === undefined || longitude === undefined) {
      return NextResponse.json({ error: 'Latitude and longitude are required.' }, { status: 400 });
    }

    const url = `https://archive-api.open-meteo.com/v1/archive` +
      `?latitude=${latitude}&longitude=${longitude}` +
      `&start_date=${START_DATE}&end_date=${END_DATE}` +
      `&daily=precipitation_sum`;

    const weatherResponse = await fetch(url);
    if (!weatherResponse.ok) throw new Error('Failed to fetch historical weather data.');

    const weatherData = await weatherResponse.json();
    const daily: number[] = weatherData.daily?.precipitation_sum ?? [];
    const dates: string[] = weatherData.daily?.time ?? [];

    if (daily.length === 0) {
      return NextResponse.json({ annualRainfall: 1200, monthlyFractions: null }, { status: 200, headers: CORS_HEADERS });
    }

    // ── Annual total ──────────────────────────────────────────────────────────
    const totalPrecip  = daily.reduce((s, v) => s + (v || 0), 0);
    const annualRainfall = Math.round(totalPrecip / NUM_YEARS);

    // ── Monthly fractions (normalised long-term averages) ─────────────────────
    // Sum precipitation by calendar month across all years, then normalise
    const monthlyTotals = new Array(12).fill(0);
    for (let i = 0; i < daily.length; i++) {
      const month = new Date(dates[i]).getMonth(); // 0-indexed
      monthlyTotals[month] += daily[i] || 0;
    }
    const grandTotal = monthlyTotals.reduce((s, v) => s + v, 0);
    const monthlyFractions = grandTotal > 0
      ? monthlyTotals.map(v => Math.round((v / grandTotal) * 10000) / 10000)
      : null;

    return NextResponse.json({ annualRainfall, monthlyFractions }, { status: 200, headers: CORS_HEADERS });
  } catch (error) {
    console.error('Weather API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
