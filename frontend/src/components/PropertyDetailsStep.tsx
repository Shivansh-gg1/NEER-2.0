import { useState, useEffect, useCallback, useRef } from 'react';
import { Home } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { FormData, BuildingData, PropertyDetailsStepProps } from '../types';

// --- Map Imports ---
import { MapView } from './MapView';

// --- Main Property Details Step Component ---
export function PropertyDetailsStep({ formData, updateFormData, buildingData, onNext, onPrevious }: PropertyDetailsStepProps) {
  
  // --- DEFINITIVE FIX: Use local state for form fields to prevent freezing ---
  const [localFormData, setLocalFormData] = useState<Partial<FormData>>({
    propertyType: 'house',
    roofMaterial: 'RCC / concrete flat roof',
    residents: '4',
    rainfall: '1200',
    roofArea: '',
  });

  // This effect runs ONCE to pre-fill the local state with backend data
  useEffect(() => {
    if (buildingData?.features?.[0]?.properties?.area) {
      const areaInSqFt = Math.round(buildingData.features[0].properties.area * 10.764);
      const initialData = {
        roofArea: areaInSqFt.toString(),
        propertyType: formData.propertyType || 'house',
        roofMaterial: formData.roofMaterial || 'RCC / concrete flat roof',
        residents: formData.residents || '4',
        rainfall: formData.rainfall || '1200',
      };
      setLocalFormData(initialData);
      updateFormData(initialData); // Sync with parent once
    }
  }, [buildingData]); // This effect only runs when the buildingData prop changes

  // This function updates the local state and then syncs with the parent App.tsx
  const handleLocalChange = useCallback((field: keyof FormData, value: string) => {
    setLocalFormData(prev => {
        const updatedData = { ...prev, [field]: value };
        updateFormData(updatedData);
        return updatedData;
    });
  }, [updateFormData]);
  
  // This function is called by the map when the user edits the polygon
  const handleAreaUpdateFromMap = useCallback((areaInSqm: number) => {
    const areaInSqFt = Math.round(areaInSqm * 10.764);
    handleLocalChange('roofArea', areaInSqFt.toString());
  }, [handleLocalChange]);

  const optionalResidentTypes = ['Government Building', 'Academic Institution / School / College', 'Industrial Property', 'Hospital / Healthcare Building'];
  const isResidentsOptional = optionalResidentTypes.includes(localFormData.propertyType || '');
  const canProceed = localFormData.propertyType && localFormData.roofArea && localFormData.roofMaterial && (isResidentsOptional ? true : localFormData.residents);

  const isManualEntry = !buildingData;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Step 2: Property Details</h2>
        <p className="text-lg text-slate-500 m-0">
          {isManualEntry
            ? 'Enter your property details below to continue.'
            : "We've detected your roof's footprint. Please verify or edit the details below."}
        </p>
      </div>

      {/* Manual entry notice — shown when both EE and OSM found nothing */}
      {isManualEntry && (
        <div className="p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
          <div className="flex items-start space-x-3">
            <span className="text-yellow-600 text-xl">⚠️</span>
            <div>
              <p className="font-semibold text-yellow-800 m-0">Automatic roof detection unavailable</p>
              <p className="text-sm text-yellow-700 m-0 mt-1">
                We couldn't detect a building at your location automatically. This can happen in
                newly constructed areas or locations with limited satellite coverage.
                Please enter your roof area manually below — you can find it on your property
                documents or use Google Maps to estimate it.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Map card — only shown when we have building data */}
      {!isManualEntry && formData.coordinates && buildingData?.features?.[0] && (
        <Card>
          <CardHeader><CardTitle>Location & Roof Footprint</CardTitle></CardHeader>
          <CardContent>
            <div className="h-80 w-full rounded-lg overflow-hidden border">
              <MapView
                center={formData.coordinates}
                polygonData={buildingData.features[0]}
                onAreaUpdate={handleAreaUpdateFromMap}
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">Use the controls on the map to edit the rooftop area if needed.</p>
          </CardContent>
        </Card>
      )}
      
      
      <Card>
        <CardHeader><CardTitle className="flex items-center"><Home className="w-5 h-5 mr-2 text-blue-600"/> Property Information</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="roof-area">Roof Area (sq ft)</Label>
            <Input id="roof-area" type="number" value={localFormData.roofArea || ''} onChange={(e) => handleLocalChange('roofArea', e.target.value)} />
          </div>
          <div>
            <Label htmlFor="property-type">Property Type</Label>
            <Select value={localFormData.propertyType || 'house'} onValueChange={(value) => handleLocalChange('propertyType', value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="Independent House">Independent House</SelectItem>
                    <SelectItem value="Apartment / CGHS / Group Housing">Apartment / CGHS / Group Housing</SelectItem>
                    <SelectItem value="Government Building">Government Building</SelectItem>
                    <SelectItem value="Academic Institution / School / College">Academic Institution / School / College</SelectItem>
                    <SelectItem value="Commercial Building">Commercial Building</SelectItem>
                    <SelectItem value="Industrial Property">Industrial Property</SelectItem>
                    <SelectItem value="Hospital / Healthcare Building">Hospital / Healthcare Building</SelectItem>
                </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="roof-material">Roof Material / Surface Type</Label>
            <Select value={localFormData.roofMaterial || 'RCC / concrete flat roof'} onValueChange={(value) => handleLocalChange('roofMaterial', value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="RCC / concrete flat roof">RCC / concrete flat roof</SelectItem>
                    <SelectItem value="Clay / Mangalore tiles">Clay / Mangalore tiles</SelectItem>
                    <SelectItem value="Cement / ACC tiles">Cement / ACC tiles</SelectItem>
                    <SelectItem value="GI / corrugated metal sheet">GI / corrugated metal sheet</SelectItem>
                    <SelectItem value="Asbestos / AC sheet">Asbestos / AC sheet</SelectItem>
                    <SelectItem value="Gravel / pebble ballast">Gravel / pebble ballast</SelectItem>
                    <SelectItem value="Green / planted roof">Green / planted roof</SelectItem>
                </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="residents">Number of Residents / Users {isResidentsOptional ? '(Optional)' : ''}</Label>
            <Input id="residents" type="number" value={localFormData.residents || ''} onChange={(e) => handleLocalChange('residents', e.target.value)} />
          </div>
          <div>
            <Label htmlFor="rainfall">Average Annual Rainfall (mm)</Label>
            <Input id="rainfall" type="number" value={localFormData.rainfall || ''} onChange={(e) => handleLocalChange('rainfall', e.target.value)} />
          </div>
        </CardContent>
      </Card>
      
      <div className="sticky bottom-0 bg-white/80 backdrop-blur-xl py-4 -mx-6 -mb-6 px-6 border-t border-slate-100 shadow-[0_-4px_24px_rgba(0,0,0,0.02)] z-10">
        <div className="flex space-x-4">
            <Button onClick={onPrevious} variant="outline" className="w-1/3 h-14 text-lg bg-white/50">Back</Button>
            <Button onClick={onNext} disabled={!canProceed} className="flex-1 h-14 text-lg">
                View Assessment Results
            </Button>
        </div>
      </div>
    </div>
  );
}