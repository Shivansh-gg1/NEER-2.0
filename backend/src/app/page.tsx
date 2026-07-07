
'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import CoordinateForm from '../components/CoordinateForm'
import BuildingInfo from '../components/BuildingInfo'
import LoadingSpinner from '../components/LoadingSpinner'
import Alert from '../components/Alert'
import AddressSearch from '@/components/AddressSearch'

// Types
import type {
  CoordinateString,
  BuildingData,
  ApiHealthStatus,
  AlertState,
  SampleCoordinate,
  BuildingFootprintRequest,
  ApiErrorResponse,
  Coordinates
} from '../types'

// Dynamically import MapView to avoid SSR issues with Leaflet
const MapView = dynamic(() => import('../components/MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  )
})

const SAMPLE_COORDINATES: SampleCoordinate[] = [
  { name: "Ghaziabad, India", lat: 28.6282, lon: 77.4390 },
  { name: "New Delhi, India", lat: 28.6139, lon: 77.2090 },
  { name: "Delhi NCR", lat: 28.7041, lon: 77.1025 }
]

export default function Home() {
  const [coordinates, setCoordinates] = useState<CoordinateString>({ latitude: '', longitude: '' })
  const [buildingData, setBuildingData] = useState<BuildingData | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [alert, setAlert] = useState<AlertState | null>(null)
  const [liveArea, setLiveArea] = useState<number | null>(null);

  const [apiHealth, setApiHealth] = useState<ApiHealthStatus>({
    status: 'checking',
    message: 'Checking API status...'
  })
  const [mapCenter, setMapCenter] = useState<[number, number]>([28.6282, 77.4390])
  const [mapZoom, setMapZoom] = useState<number>(15)

  // Check API health on component mount
  useEffect(() => {
    checkApiHealth()
  }, [])

  const checkApiHealth = async (): Promise<void> => {
    try {
      const response = await fetch('/api/health')
      const data = await response.json()

      if (response.ok && data.status === 'OK') {
        setApiHealth({
          status: 'connected',
          message: `API Connected (${data.earthEngine || 'Unknown'})`
        })
      } else {
        throw new Error('API health check failed')
      }
    } catch (error) {
      console.error('API health check failed:', error)
      setApiHealth({
        status: 'error',
        message: 'API Unavailable'
      })
    }
  }

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      showAlert('error', 'Geolocation Not Supported', 'Your browser does not support this feature.');
      return;
    }

    setLoading(true);
    showAlert('info', 'Locating...', 'Fetching your current location. Please allow permission.', 0);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log(latitude, longitude);
        setCoordinates({
          latitude: latitude.toString(),
          longitude: longitude.toString(),
        });

        setMapCenter([latitude, longitude]);
        setMapZoom(19); // Zoom in closer for current location
        setLoading(false);
        closeAlert();
        showAlert('success', 'Location Found!', 'Your current location has been filled in.', 4000);
      },
      (error) => {
        setLoading(false);
        let message = 'An unknown error occurred while fetching your location.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'You have denied the request for geolocation.';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Location information is currently unavailable.';
            break;
          case error.TIMEOUT:
            message = 'The request to get your location timed out.';
            break;
        }
        showAlert('error', 'Location Error', message, 6000);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleLocationSelect = (coords: Coordinates) => {
    setCoordinates({
      latitude: coords.latitude.toString(),
      longitude: coords.longitude.toString()
    });
    showAlert('info', 'Coordinates Updated', `Using coordinates`, 3000);
    setMapCenter([coords.latitude, coords.longitude]);
    setMapZoom(19);
  }

  const handleMapClick = (coords: { latitude: number; longitude: number }): void => {
    setCoordinates({
      latitude: coords.latitude.toString(),
      longitude: coords.longitude.toString()
    });
    showAlert('info', 'Coordinates Updated', 'Coordinates have been set from your map click.', 3000);
    setMapCenter([coords.latitude, coords.longitude]);
    setMapZoom(19);
  }

  const handleCoordinateChange = (field: keyof CoordinateString, value: string): void => {
    setCoordinates(prev => ({ ...prev, [field]: value }))
  }

  const handleUseSample = (sample: SampleCoordinate): void => {
    setCoordinates({ latitude: sample.lat.toString(), longitude: sample.lon.toString() })
    showAlert('info', 'Sample Coordinates', `Using coordinates for ${sample.name}`, 3000)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()

    const lat = parseFloat(coordinates.latitude)
    const lon = parseFloat(coordinates.longitude)

    if (!validateCoordinates(lat, lon)) {
      return
    }

    setLoading(true)
    setBuildingData(null)
    showAlert('info', 'Searching...', `Looking for building at ${lat}, ${lon}`, 0)

    try {
      const requestBody: BuildingFootprintRequest = { latitude: lat, longitude: lon }

      const response = await fetch('/api/buildings/footprint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      const data: BuildingData | ApiErrorResponse = await response.json()

      if (!response.ok) {
        const errorData = data as ApiErrorResponse
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const buildingResult = data as BuildingData
      setBuildingData(buildingResult)
      setMapCenter([lat, lon])
      setMapZoom(19)

      const building = buildingResult.features[0]
      const area = building?.properties?.area || 'Unknown'
      showAlert('success', 'Building Found!', `Found building with area: ${area} sq meters`, 5000)

    } catch (error) {
      console.error('Error fetching building footprint:', error)
      handleApiError(error as Error)
    } finally {
      setLoading(false)
    }
  }

  const validateCoordinates = (lat: number, lon: number): boolean => {
    if (isNaN(lat) || isNaN(lon)) {
      showAlert('error', 'Invalid Input', 'Please enter valid numeric coordinates', 5000)
      return false
    }

    if (lat < -90 || lat > 90) {
      showAlert('error', 'Invalid Latitude', 'Latitude must be between -90 and 90 degrees', 5000)
      return false
    }

    if (lon < -180 || lon > 180) {
      showAlert('error', 'Invalid Longitude', 'Longitude must be between -180 and 180 degrees', 5000)
      return false
    }

    return true
  }

  const handleApiError = (error: Error): void => {
    let title = 'Error'
    let message = error.message || 'An unexpected error occurred'

    if (error.message.includes('No building footprint found')) {
      title = 'No Building Found'
      message = 'No building footprint was found at the specified coordinates. Try a different location.'
    } else if (error.message.includes('Invalid coordinates')) {
      title = 'Invalid Coordinates'
      message = 'Please check your coordinate values and try again.'
    } else if (error.message.includes('service unavailable')) {
      title = 'Service Unavailable'
      message = 'Google Earth Engine service is currently unavailable. Please try again later.'
    }

    showAlert('error', title, message, 8000)
  }

  const showAlert = (type: AlertState['type'], title: string, message: string, duration = 5000): void => {
    setAlert({ type, title, message })

    if (duration > 0) {
      setTimeout(() => setAlert(null), duration)
    }
  }

  const closeAlert = (): void => {
    setAlert(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-bold gradient-text mb-2">
              Aqua Mind
            </h1>
            <p className="text-gray-600 text-sm sm:text-base mb-3">
              Find and visualize building footprints using Microsoft Building Footprints dataset
            </p>

            {/* API Status */}
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm glass">
              <div className={`w-2 h-2 rounded-full ${apiHealth.status === 'connected' ? 'bg-green-500' :
                apiHealth.status === 'error' ? 'bg-red-500' : 'bg-yellow-500 status-pulse'
                }`} />
              <span className={`font-medium ${apiHealth.status === 'connected' ? 'text-green-700' :
                apiHealth.status === 'error' ? 'text-red-700' : 'text-yellow-700'
                }`}>
                {apiHealth.message}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Alert */}
        {alert && (
          <div className="mb-6">
            <Alert
              type={alert.type}
              title={alert.title}
              message={alert.message}
              onClose={closeAlert}
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Panel - Form */}
          <div className="lg:col-span-1 space-y-6">
            {/* Coordinate Form */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">📍 Enter Coordinates</h2>
                <p className="text-gray-600 text-sm">Find building footprints in India</p>
              </div>

              {/* <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
                <AddressSearch onLocationSelect={handleLocationSelect} setLoading={setLoading} />
              </div> */}

              <CoordinateForm
                coordinates={coordinates}
                onCoordinateChange={handleCoordinateChange}
                onSubmit={handleSubmit}
                loading={loading}
                onUseMyLocation={handleUseMyLocation}
                onLocationSelect={handleLocationSelect}
                setLoading={setLoading}
              />
            </div>

            {/* Sample Coordinates */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📌 Sample Locations</h3>
              <div className="space-y-2">
                {SAMPLE_COORDINATES.map((sample, index) => (
                  <button
                    key={index}
                    onClick={() => handleUseSample(sample)}
                    className="w-full text-left p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-200 hover:border-gray-300"
                  >
                    <div className="font-medium text-gray-900">{sample.name}</div>
                    <div className="text-sm text-gray-500">{sample.lat}, {sample.lon}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Building Info */}
            {buildingData && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
                <BuildingInfo data={buildingData} liveArea={liveArea} />
              </div>
            )}
          </div>

          {/* Right Panel - Map */}
          <div className="lg:col-span-2">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
              <div className="mb-4">
                <div className="flex">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">🗺️ Building Footprint Map</h2>
                  <p>{liveArea}</p>
                </div>
                <p className="text-gray-600 text-sm">Interactive map showing building footprints</p>
              </div>

              <div className="h-[500px] sm:h-[600px] rounded-lg overflow-hidden border border-gray-200">
                <MapView
                  center={mapCenter}
                  zoom={mapZoom}
                  buildingData={buildingData}
                  userCoordinates={coordinates.latitude && coordinates.longitude ? {
                    latitude: parseFloat(coordinates.latitude),
                    longitude: parseFloat(coordinates.longitude)
                  } : null}
                  onAreaUpdate={setLiveArea}
                  onMapClick={handleMapClick}
                />
              </div>

              {/* Map Legend */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-red-500 rounded border border-red-600"></div>
                  <span>Building Footprint</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-blue-500 rounded-full border border-blue-600"></div>
                  <span>User Location</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/50 backdrop-blur-sm border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-gray-600 text-sm">
          </div>
        </div>
      </footer>
    </div>
  )
}