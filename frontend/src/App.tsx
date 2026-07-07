import { useState } from 'react';
import { LandingPage }        from './components/LandingPage';
import { Header }             from './components/Header';
import { ProgressSidebar }    from './components/ProgressSidebar';
import { LocationStep }       from './components/LocationStep';
import { PropertyDetailsStep } from './components/PropertyDetailsStep';
import { ResultsDashboard }   from './components/ResultsDashboard';
import { BuildingData, FormData, ResultsData, GeocodeResult } from './types';

type AppView = 'landing' | 'assessment';

const BACKEND = 'http://localhost:3001';

export default function App() {
  const [currentView,    setCurrentView]    = useState<AppView>('landing');
  const [currentStep,    setCurrentStep]    = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const [formData,    setFormData]    = useState<FormData>({});
  const [buildingData, setBuildingData] = useState<BuildingData | null>(null);
  const [resultsData,  setResultsData]  = useState<ResultsData | null>(null);
  const [isLoading,    setIsLoading]    = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [addressSearchResults, setAddressSearchResults] = useState<GeocodeResult[]>([]);
  const [monthlyFractions, setMonthlyFractions] = useState<number[] | null>(null);

  const updateFormData = (newData: Partial<FormData>) =>
    setFormData(prev => ({ ...prev, ...newData }));

  const fetchAddressAndRainfall = async (coords: { lat: number; lng: number }) => {
    setIsLoading(true);
    setError(null);
    try {
      const [geoRes, weatherRes] = await Promise.allSettled([
        fetch(`${BACKEND}/api/reverse-geocode`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ latitude: coords.lat, longitude: coords.lng }),
        }),
        fetch(`${BACKEND}/api/weather`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ latitude: coords.lat, longitude: coords.lng }),
        }),
      ]);

      const address = geoRes.status === 'fulfilled' && geoRes.value.ok
        ? (await geoRes.value.json()).address
        : 'Address not found';

      let rainfall = '1200';
      let fractions: number[] | null = null;
      if (weatherRes.status === 'fulfilled' && weatherRes.value.ok) {
        const wd = await weatherRes.value.json();
        rainfall  = wd.annualRainfall.toString();
        fractions = wd.monthlyFractions ?? null;
      }

      setMonthlyFractions(fractions);
      updateFormData({ coordinates: coords, address, rainfall });
      setAddressSearchResults([]);
    } catch {
      setError('A critical error occurred. Please check your connection.');
      updateFormData({ coordinates: coords });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDetectLocation = () =>
    navigator.geolocation.getCurrentPosition(
      pos => fetchAddressAndRainfall({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      ()  => setError('Could not access your location. Please enable location services.'),
    );

  const handleCoordinatesSubmit = (latStr: string, lngStr: string) => {
    const lat = parseFloat(latStr), lng = parseFloat(lngStr);
    if (isNaN(lat) || isNaN(lng)) { setError('Invalid coordinates. Please enter numbers only.'); return; }
    fetchAddressAndRainfall({ lat, lng });
  };

  const handleAddressSearch = async (query: string) => {
    if (query.length < 3) { setAddressSearchResults([]); return; }
    try {
      const res  = await fetch(`${BACKEND}/api/geocode`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: query }),
      });
      setAddressSearchResults(await res.json());
    } catch {
      setError('Failed to search for address.');
    }
  };

  const handleAddressSelect = (result: GeocodeResult) =>
    fetchAddressAndRainfall({ lat: result.latitude, lng: result.longitude });

  const handleLocationNext = async () => {
    if (!formData.coordinates) return;
    setIsLoading(true); setError(null);
    try {
      const res = await fetch(`${BACKEND}/api/building-footprint`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude: formData.coordinates.lat, longitude: formData.coordinates.lng }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Failed to find a building at this location.'); }
      const data = await res.json();

      if (data.requiresManualEntry) {
        setBuildingData(null);
        setCompletedSteps(prev => [...new Set([...prev, 1])]);
        setCurrentStep(2);
        return;
      }

      setBuildingData(data as BuildingData);
      setCompletedSteps(prev => [...new Set([...prev, 1])]);
      setCurrentStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDetailsCalculate = async () => {
    setIsLoading(true); setError(null);
    try {
      const payload = {
        area:          parseFloat(formData.roofArea   || '0'),
        propertyType:  formData.propertyType           || 'Individual Residential House',
        roofMaterial:  formData.roofMaterial           || 'RCC / concrete flat roof',
        residents:     parseInt(formData.residents    || '1'),
        rainfall:      parseInt(formData.rainfall     || '1200'),
        latitude:      formData.coordinates?.lat,
        longitude:     formData.coordinates?.lng,
        ...(monthlyFractions ? { monthlyFractions } : {}),
      };

      const res = await fetch(`${BACKEND}/api/calculate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to calculate results.');

      const data: ResultsData = await res.json();
      data.formData = formData;

      setResultsData(data);
      setCompletedSteps(prev => [...new Set([...prev, 2])]);
      setCurrentStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrevious  = () => { if (currentStep > 1) setCurrentStep(currentStep - 1); };
  const handleStepClick = (step: number) => {
    if (completedSteps.includes(step) || step === 1 || completedSteps.includes(step - 1))
      setCurrentStep(step);
  };
  const handleStartOver = () => {
    setFormData({}); setBuildingData(null); setResultsData(null);
    setError(null); setCurrentStep(1); setCompletedSteps([]); setMonthlyFractions(null);
  };
  const handleStartAssessment = () => { setCurrentView('assessment'); handleStartOver(); };
  const handleBackToLanding   = () => setCurrentView('landing');

  const renderCurrentStep = () => {
    if (isLoading && !buildingData && !resultsData) {
      return (
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Processing…</p>
        </div>
      );
    }

    switch (currentStep) {
      case 1:
        return (
          <LocationStep
            formData={formData}
            updateFormData={updateFormData}
            onNext={handleLocationNext}
            onDetectLocation={handleDetectLocation}
            onCoordinatesSubmit={handleCoordinatesSubmit}
            onAddressSearch={handleAddressSearch}
            onAddressSelect={handleAddressSelect}
            isLoading={isLoading}
            error={error}
            addressSearchResults={addressSearchResults}
          />
        );
      case 2:
        return (
          <PropertyDetailsStep
            formData={formData}
            updateFormData={updateFormData}
            buildingData={buildingData}
            onNext={handleDetailsCalculate}
            onPrevious={handlePrevious}
          />
        );
      case 3:
        if (!resultsData) return <div className="text-center p-8 text-red-600">Results data missing. Please return to Step 2.</div>;
        return (
          <ResultsDashboard
            resultsData={resultsData}
            onPrevious={handlePrevious}
            onStartOver={handleStartOver}
          />
        );
      default:
        return <div className="text-center p-8">Something went wrong.</div>;
    }
  };

  if (currentView === 'landing') return <LandingPage onStartAssessment={handleStartAssessment} />;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onBackToLanding={handleBackToLanding} />
      <div className="flex">
        <ProgressSidebar currentStep={currentStep} completedSteps={completedSteps} onStepClick={handleStepClick} />
        <main className="flex-1 lg:max-w-4xl mx-auto p-4 lg:p-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {error && !isLoading && (
              <div className="bg-red-100 text-red-800 p-4 rounded-lg mb-6">{error}</div>
            )}
            {renderCurrentStep()}
          </div>
        </main>
      </div>
    </div>
  );
}