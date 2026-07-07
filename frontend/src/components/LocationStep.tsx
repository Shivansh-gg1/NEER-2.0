import { useState } from 'react';
import { MapView } from './MapView';
import { MapPin, Target } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { FormData, LocationStepProps } from '../types';

export function LocationStep({
  formData,
  updateFormData,
  onNext,
  onDetectLocation,
  onCoordinatesSubmit,
  isLoading,
  error,
}: LocationStepProps) {
  
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');

  const handleMapLocationChange = (coords: { lat: number; lng: number }) => {
    updateFormData({ coordinates: coords });
  };
  
  const canProceed = !!formData.coordinates && !isLoading;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Step 1: Location Information</h2>
        <p className="text-lg text-slate-500 m-0">Find your property to begin the assessment.</p>
      </div>
      
      <Card>
          <CardHeader><CardTitle>Find Your Location</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={onDetectLocation} disabled={isLoading} className="w-full h-14 text-lg">
              <MapPin className="w-5 h-5 mr-2" />
              {isLoading ? 'Detecting...' : 'Use My Current Location'}
            </Button>
            
            <div className="text-center text-gray-500 text-sm font-semibold">OR</div>

            <div className="space-y-2">
                <Label>Enter Coordinates Manually</Label>
                <div className="flex space-x-2">
                    <Input type="number" placeholder="Latitude (e.g., 28.6139)" value={manualLat} onChange={(e) => setManualLat(e.target.value)} />
                    <Input type="number" placeholder="Longitude (e.g., 77.2090)" value={manualLng} onChange={(e) => setManualLng(e.target.value)} />
                    <Button onClick={() => onCoordinatesSubmit(manualLat, manualLng)} disabled={isLoading || !manualLat || !manualLng} className="h-10">
                        <Target className="w-5 h-5" />
                    </Button>
                </div>
            </div>
          </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Location Preview</CardTitle></CardHeader>
        <CardContent>
            <div className="h-80 w-full rounded-lg overflow-hidden border">
                <MapView
                    center={
                      formData.coordinates ?? {
                        // Default center: Delhi (prevents blank UI before user picks coordinates)
                        lat: 28.6139,
                        lng: 77.2090,
                      }
                    }
                    onLocationChange={handleMapLocationChange}
                />
            </div>
        </CardContent>
      </Card>

      {formData?.address && !isLoading && (
          <div className="p-4 bg-green-50 text-green-800 rounded-lg">
              <strong>Location Found:</strong> {formData.address}
          </div>
      )}

      {error && !isLoading && (
        <div className="p-4 bg-red-50 text-red-800 rounded-lg">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="sticky bottom-0 bg-white/80 backdrop-blur-xl py-4 -mx-6 -mb-6 px-6 border-t border-slate-100 shadow-[0_-4px_24px_rgba(0,0,0,0.02)] z-10">
        <Button onClick={onNext} disabled={!canProceed} className="w-full h-14 text-lg">
            {isLoading ? 'Analyzing...' : 'Continue to Property Details'}
        </Button>
      </div>
    </div>
  );
}

