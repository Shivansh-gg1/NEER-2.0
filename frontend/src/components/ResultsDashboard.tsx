import { useState } from 'react';
import {
  CheckCircle, AlertCircle, Droplets, IndianRupee, MapPin,
  Download, Share, HelpCircle, Container, Settings, TrendingUp,
  Calendar, Home, Check, X, Lightbulb, Layers, AlertTriangle,
  Cpu, Droplet, Filter,
} from 'lucide-react';
import { downloadPDF } from '../services/pdfGenerator';
import { Button }                       from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress }                     from './ui/progress';
import { Badge }                        from './ui/badge';
import { Separator }                    from './ui/separator';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ResultsDashboardProps }        from '../types';

export function ResultsDashboard({ resultsData, onPrevious, onStartOver }: ResultsDashboardProps) {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // ── All values come from the API — no recalculation here ──────────────────
  const {
    potentialCollection,      // litres/year
    monthlyCollection,        // litres/month avg
    isEligible,
    subsidyAmount,
    subsidyInfo,
    paybackPeriod,
    costSavingsYearly,
    waterSavingsPercentage,
    tankCapacity,             // m³
    complianceItems,
    monthlyData,
    percolationPit,
    storageTank,
    groundwaterInfo,
    firstFlushDiverter,
    systemRecommendation,
    propertyWarnings = [],
    propertyRecommendations = [],
    formData = {},
  } = resultsData as any;

  const rainfall     = parseInt(formData.rainfall     ?? '1200');
  const roofArea     = parseInt(formData.roofArea     ?? '0');
  const residents    = parseInt(formData.residents    ?? '1');
  const propertyType = formData.propertyType          ?? 'Individual Residential House';

  // Derived display values (unit conversion only, no recalculation)
  const potentialCollectionM3   = Math.round(potentialCollection / 1000 * 10) / 10;
  const monthlyCollectionM3     = Math.round(monthlyCollection   / 1000 * 10) / 10;
  const dailyConsumptionL       = residents * 150;
  const daysOfIndependence      = Math.round(potentialCollection / dailyConsumptionL);

  const roiData = [
    { name: 'System Cost', value: 120_000,                      fill: '#ef4444' },
    { name: 'Savings',     value: costSavingsYearly * paybackPeriod, fill: '#22c55e' },
  ];

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const dashboardElement = document.getElementById('results-dashboard');
      await downloadPDF(formData, dashboardElement || document.body, resultsData);
    } catch (err) {
      console.error('Error downloading PDF:', err);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // ── Recharge structure section helper ─────────────────────────────────────
  const renderStructureCard = (title: string, structure: any, icon: React.ReactNode) => {
    if (!structure) return null;
    const { dimensions = {}, volumes = {}, layers = [], notes = [] } = structure;
    return (
      <Card className="border-2 border-blue-200">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2">
            {icon}
            <span>{title}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            {dimensions.diameter  && <div className="p-2 bg-blue-50 rounded"><span className="text-gray-500">Diameter</span><div className="font-bold text-blue-700">{dimensions.diameter} m</div></div>}
            {dimensions.height    && <div className="p-2 bg-blue-50 rounded"><span className="text-gray-500">Height</span><div className="font-bold text-blue-700">{dimensions.height} m</div></div>}
            {dimensions.depth     && <div className="p-2 bg-blue-50 rounded"><span className="text-gray-500">Depth</span><div className="font-bold text-blue-700">{dimensions.depth} m</div></div>}
            {volumes.storage      && <div className="p-2 bg-green-50 rounded"><span className="text-gray-500">Storage</span><div className="font-bold text-green-700">{volumes.storage} m³</div></div>}
            {volumes.excavation   && <div className="p-2 bg-yellow-50 rounded"><span className="text-gray-500">Excavation</span><div className="font-bold text-yellow-700">{volumes.excavation} m³</div></div>}
          </div>

          {layers.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Layer Configuration</div>
              <div className="space-y-1">
                {layers.map((l: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm px-2 py-1 bg-gray-50 rounded">
                    <span>{l.name}</span>
                    <span className="font-medium">{(l.thickness * 100).toFixed(0)} cm</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {notes.length > 0 && (
            <div className="space-y-1">
              {notes.map((n: string, i: number) => (
                <p key={i} className="text-xs text-gray-600 m-0">{n}</p>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div id="results-dashboard" className="space-y-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-blue-900 mb-2">Assessment Results</h2>
        <p className="text-gray-600 m-0">Your personalised rainwater harvesting feasibility report</p>
      </div>

      {/* Feasibility Score — Hero Card */}
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-green-50">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" stroke="#e5e7eb" strokeWidth="8" fill="none" />
                <circle
                  cx="60" cy="60" r="50"
                  stroke={isEligible ? '#22c55e' : waterSavingsPercentage >= 15 ? '#f59e0b' : '#ef4444'}
                  strokeWidth="8" fill="none"
                  strokeDasharray={`${(waterSavingsPercentage / 100) * 314} 314`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{waterSavingsPercentage}%</div>
                  <div className="text-xs text-gray-600">Coverage</div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-center mb-2">
            <Badge className={`text-lg px-4 py-2 ${isEligible ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-500 hover:bg-yellow-600'}`}>
              {isEligible ? <><CheckCircle className="w-4 h-4 mr-1" /> Potentially Eligible</> : <><AlertCircle className="w-4 h-4 mr-1" /> Not Currently Eligible</>}
            </Badge>
          </div>
          <p className="text-gray-600 m-0 text-sm">
            Your rooftop can harvest <strong>{potentialCollectionM3} m³</strong> ({(potentialCollection / 1000).toLocaleString()} kL) of water annually
          </p>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Water Harvest Estimate */}
        <Card className="border-2 border-gray-200">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2">
              <Droplets className="w-5 h-5 text-blue-600" />
              <span>Water Harvest Estimate</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{potentialCollectionM3}</div>
                <div className="text-sm text-gray-600">m³/year</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{monthlyCollectionM3}</div>
                <div className="text-sm text-gray-600">m³/month avg</div>
              </div>
            </div>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Bar dataKey="collection" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-gray-600 m-0">Seasonal collection pattern based on local 30-year rainfall data</p>
          </CardContent>
        </Card>

        {/* Subsidy Status */}
        <Card className={`border-2 ${isEligible ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}`}>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2">
              <IndianRupee className="w-5 h-5 text-green-600" />
              <span>Government Subsidy</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEligible ? (
              <>
                <div className="text-center">
                  <Badge className="bg-green-600 hover:bg-green-700 text-lg px-4 py-2 mb-3">
                    <Check className="w-4 h-4 mr-1" /> Potentially Eligible
                  </Badge>
                  <div className="text-3xl font-bold text-green-600 mb-1">₹{subsidyAmount.toLocaleString()}</div>
                  <p className="text-sm text-gray-600 m-0 mb-2">{propertyType}</p>
                  {subsidyInfo && (
                    <p className="text-xs text-gray-500 m-0 mb-4">
                      Up to ₹{subsidyInfo.maxSubsidy?.toLocaleString()} or 50% of cost, whichever is less
                    </p>
                  )}
                </div>
                {subsidyInfo && (
                  <div className="bg-white p-3 rounded-lg border">
                    <h4 className="font-semibold text-sm mb-2">Key Conditions:</h4>
                    <p className="text-xs text-gray-600 mb-2">{subsidyInfo.conditions}</p>
                    <h4 className="font-semibold text-sm mb-1">Special Notes:</h4>
                    <p className="text-xs text-gray-600">{subsidyInfo.specialNotes}</p>
                  </div>
                )}
                <Button className="w-full h-12 bg-green-600 hover:bg-green-700 text-white">Apply for Subsidy</Button>
              </>
            ) : (
              <>
                <div className="text-center">
                  <Badge variant="secondary" className="bg-yellow-600 hover:bg-yellow-700 text-white text-lg px-4 py-2 mb-3">
                    <X className="w-4 h-4 mr-1" /> Not Eligible
                  </Badge>
                  <div className="text-lg font-semibold text-yellow-600 mb-2">Requirements Not Met</div>
                  {subsidyInfo && (
                    <div className="text-sm text-gray-600 space-y-1">
                      <p className="m-0">• Minimum roof area: {subsidyInfo.minArea} m² ({Math.round(subsidyInfo.minArea * 10.764)} sq ft)</p>
                      <p className="m-0">• Current potential: {potentialCollectionM3} m³/year (need ≥10 m³)</p>
                    </div>
                  )}
                </div>
                {subsidyInfo && (
                  <div className="bg-white p-3 rounded-lg border">
                    <h4 className="font-semibold text-sm mb-2">Key Conditions:</h4>
                    <p className="text-xs text-gray-600 mb-2">{subsidyInfo.conditions}</p>
                    <h4 className="font-semibold text-sm mb-1">Special Notes:</h4>
                    <p className="text-xs text-gray-600">{subsidyInfo.specialNotes}</p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Recommended System */}
        <Card className="border-2 border-gray-200">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2">
              <Container className="w-5 h-5 text-blue-600" />
              <span>Recommended System</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <div className="text-lg font-bold text-blue-900">Tank Capacity</div>
                <div className="text-2xl font-bold text-blue-600">{tankCapacity} m³</div>
                <div className="text-sm text-gray-600">({(tankCapacity * 1000).toLocaleString()} litres)</div>
              </div>
              <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center">
                <Container className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="space-y-3">
              {[
                ['Gutters & Downpipes',  'Required'],
                ['First Flush Diverter', 'Essential'],
                ['Filter System',        'Multi-stage'],
                ['Distribution Pump',    '0.5 HP'],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{label}</span>
                  <span className="text-sm font-medium">{val}</span>
                </div>
              ))}
            </div>
            <Separator />
            <p className="text-sm text-gray-600 m-0">Estimated installation cost: ₹1,20,000 – ₹1,50,000</p>
          </CardContent>
        </Card>

        {/* ROI Analysis */}
        <Card className="border-2 border-gray-200">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span>Return on Investment</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-1">{paybackPeriod} years</div>
              <p className="text-sm text-gray-600 m-0">Payback period</p>
            </div>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={roiData} cx="50%" cy="50%" innerRadius={30} outerRadius={50} dataKey="value">
                    {roiData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {[
                ['Annual Savings',  `₹${costSavingsYearly.toLocaleString()}`],
                ['20-Year Savings', `₹${(costSavingsYearly * 20).toLocaleString()}`],
                ['Net Benefit',     `₹${(costSavingsYearly * 20 - 120_000).toLocaleString()}`],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{label}</span>
                  <span className="font-medium text-green-600">{val}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Compliance Checklist */}
        <Card className="border-2 border-gray-200">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2">
              <Settings className="w-5 h-5 text-blue-600" />
              <span>Compliance Checklist</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {complianceItems.map((item: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    {item.status ? <Check className="w-4 h-4 text-green-600" /> : <X className="w-4 h-4 text-red-600" />}
                    <span className="text-sm font-medium">{item.item}</span>
                  </div>
                  <div className="text-xs text-gray-500 ml-6">{item.authority}</div>
                </div>
                <Badge variant={item.status ? 'default' : 'secondary'}
                       className={item.status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                  {item.status ? 'Pass' : 'Fail'}
                </Badge>
              </div>
            ))}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800 m-0">All regulatory requirements must be met before installation begins.</p>
            </div>
          </CardContent>
        </Card>

        {/* Location & Context */}
        <Card className="border-2 border-gray-200">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              <span>Location & Context</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg border text-center">
              <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-700 font-medium m-0">{formData.address || 'Current Location'}</p>
              {formData.coordinates && (
                <p className="text-xs text-gray-400 m-0 mt-1">
                  {formData.coordinates.lat.toFixed(5)}, {formData.coordinates.lng.toFixed(5)}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-blue-50 rounded-lg text-center">
                <div className="font-bold text-blue-600">{rainfall} mm</div>
                <div className="text-xs text-gray-600">Annual Rainfall</div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg text-center">
                <div className="font-bold text-green-600">
                  {potentialCollectionM3 >= 20 ? 'High' : potentialCollectionM3 >= 10 ? 'Medium' : 'Low'}
                </div>
                <div className="text-xs text-gray-600">Recharge Potential</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg text-center">
                <div className="font-bold text-gray-700 text-sm truncate" title={resultsData.roofMaterial || 'RCC / concrete flat roof'}>{resultsData.roofMaterial || 'RCC / concrete flat roof'}</div>
                <div className="text-xs text-gray-500">Roof Material</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg text-center">
                <div className="font-bold text-gray-700">{resultsData.runoffCoefficient || 0.8}</div>
                <div className="text-xs text-gray-500">Runoff Coefficient</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Groundwater Assessment */}
        {groundwaterInfo && (
          <Card className={`border-2 lg:col-span-2 ${
            !groundwaterInfo.rechargeFeasible
              ? 'border-red-300 bg-red-50'
              : groundwaterInfo.warnings.length > 0
              ? 'border-yellow-300 bg-yellow-50'
              : 'border-teal-200 bg-teal-50'
          }`}>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-2">
                <Layers className="w-5 h-5 text-teal-700" />
                <span>Groundwater Assessment</span>
                {!groundwaterInfo.rechargeFeasible && (
                  <span className="ml-2 text-xs font-normal px-2 py-0.5 rounded-full bg-red-200 text-red-800">Pit Not Recommended</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div className="p-3 bg-white rounded-lg border text-center">
                  <div className="text-xs text-gray-500 mb-1">Zone</div>
                  <div className="font-semibold text-teal-800 text-sm leading-tight">{groundwaterInfo.zone}</div>
                </div>
                <div className="p-3 bg-white rounded-lg border text-center">
                  <div className="text-xs text-gray-500 mb-1">Groundwater Depth</div>
                  <div className="font-bold text-teal-700 text-lg">{groundwaterInfo.groundwaterDepth} m</div>
                  <div className="text-xs text-gray-400">below ground</div>
                </div>
                <div className="p-3 bg-white rounded-lg border text-center">
                  <div className="text-xs text-gray-500 mb-1">Infiltration Rate</div>
                  <div className="font-bold text-teal-700 text-lg">{groundwaterInfo.infiltrationRate} m/day</div>
                  <div className="text-xs text-gray-400">design value</div>
                </div>
                <div className="p-3 bg-white rounded-lg border text-center">
                  <div className="text-xs text-gray-500 mb-1">Max Pit Depth</div>
                  <div className="font-bold text-teal-700 text-lg">{groundwaterInfo.maxPitDepth} m</div>
                  <div className="text-xs text-gray-400">zone limit</div>
                </div>
              </div>
              <div className="p-3 bg-white rounded-lg border mb-3">
                <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Soil Type</div>
                <div className="text-sm text-gray-800">{groundwaterInfo.soilType}</div>
              </div>
              {groundwaterInfo.warnings.length > 0 && (
                <div className="space-y-2">
                  {groundwaterInfo.warnings.map((w: string, i: number) => (
                    <div key={i} className="flex items-start space-x-2 p-2 bg-white border border-yellow-200 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-yellow-900">{w}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* System Recommendation */}
        {systemRecommendation && (() => {
          const rec = systemRecommendation;
          const isHybrid = rec.type === 'hybrid';
          const borderColor = rec.type === 'storage_tank_only' ? 'border-blue-300 bg-blue-50'
            : rec.type === 'recharge_pit_only' ? 'border-green-300 bg-green-50'
            : 'border-indigo-300 bg-indigo-50';
          const confidenceBadge = rec.confidence === 'high'
            ? 'bg-green-100 text-green-800'
            : rec.confidence === 'medium'
            ? 'bg-yellow-100 text-yellow-800'
            : 'bg-red-100 text-red-800';
          return (
            <Card className={`border-2 lg:col-span-2 ${borderColor}`}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 flex-wrap">
                  <Cpu className="w-5 h-5 text-indigo-700" />
                  <span>System Recommendation</span>
                  <span className="text-base font-semibold text-indigo-800 bg-indigo-100 px-3 py-0.5 rounded-full">{rec.label}</span>
                  <span className={`text-xs font-normal px-2 py-0.5 rounded-full ${confidenceBadge}`}>{rec.confidence} confidence</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Volume split bars */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>🗄️ Storage  {Math.round(rec.storageFraction * 100)}% · {rec.storageVolumeCubicM} m³/yr</span>
                    {isHybrid && <span>🌊 Recharge  {Math.round(rec.rechargeFraction * 100)}% · {rec.rechargeVolumeCubicM} m³/yr</span>}
                  </div>
                  <div className="flex h-4 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-500 transition-all"
                      style={{ width: `${rec.storageFraction * 100}%` }}
                    />
                    {isHybrid && (
                      <div
                        className="bg-teal-500 transition-all"
                        style={{ width: `${rec.rechargeFraction * 100}%` }}
                      />
                    )}
                  </div>
                  {isHybrid && (
                    <div className="flex gap-4 mt-1 text-xs">
                      <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm bg-blue-500" />Storage Tank</span>
                      <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm bg-teal-500" />Groundwater Recharge</span>
                    </div>
                  )}
                </div>

                {/* Reasons */}
                <div className="space-y-2">
                  {rec.reasons.map((r: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-gray-800">
                      <CheckCircle className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })()}

        {/* Engineering Warnings & Property Rules */}
        {propertyWarnings.length > 0 && (
          <Card className="border-2 border-red-300 bg-red-50 lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span>Critical Engineering Notes</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {propertyWarnings.map((w: string, i: number) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-white border border-red-200 rounded-lg shadow-sm">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm font-medium text-red-900 leading-relaxed">{w}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* First-Flush Diverter */}
        {firstFlushDiverter && (
          <Card className="border-2 border-orange-200 bg-orange-50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-orange-600" />
                <span>First-Flush Diverter</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="p-3 bg-white rounded-lg border text-center">
                  <div className="text-xs text-gray-500 mb-1">First-Flush Volume</div>
                  <div className="font-bold text-orange-700 text-lg">{firstFlushDiverter.firstFlushVolumeLitres} L</div>
                  <div className="text-xs text-gray-400">{firstFlushDiverter.firstFlushDepthMm} mm over roof</div>
                </div>
                <div className="p-3 bg-white rounded-lg border text-center">
                  <div className="text-xs text-gray-500 mb-1">Vessel Size</div>
                  <div className="font-bold text-orange-700 text-lg">{firstFlushDiverter.vesselVolumeLitres} L</div>
                  <div className="text-xs text-gray-400">+10% safety margin</div>
                </div>
                <div className="p-3 bg-white rounded-lg border text-center">
                  <div className="text-xs text-gray-500 mb-1">PVC Pipe</div>
                  <div className="font-bold text-orange-700 text-lg">Ø {firstFlushDiverter.pvcPipeDiameterMm} mm</div>
                  <div className="text-xs text-gray-400">standard size</div>
                </div>
                <div className="p-3 bg-white rounded-lg border text-center">
                  <div className="text-xs text-gray-500 mb-1">Pipe Length</div>
                  <div className="font-bold text-orange-700 text-lg">{firstFlushDiverter.pvcPipeLengthM} m</div>
                  <div className="text-xs text-gray-400">standing pipe</div>
                </div>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs text-amber-900 leading-relaxed m-0">
                  <strong>Engineering note:</strong> First-flush diverters remove the initial runoff (carrying dust, bird droppings, and pollutants) before water enters storage or recharge. Install upstream of tank/pit inlet with a self-draining orifice (3–5 mm) so the device resets between rain events.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recharge Structures */}
        {renderStructureCard(
          'Percolation Pit Design',
          percolationPit,
          <Container className="w-5 h-5 text-blue-600" />,
        )}
        {renderStructureCard(
          'Storage Tank Design',
          storageTank,
          <Container className="w-5 h-5 text-green-600" />,
        )}

        {/* Smart Tips & Impact — full width */}
        <Card className="border-2 border-green-200 bg-green-50 lg:col-span-2">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2">
              <Lightbulb className="w-5 h-5 text-green-600" />
              <span>Smart Tips & Impact</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Home className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-green-600 mb-1">{waterSavingsPercentage}%</div>
                <div className="text-sm text-gray-700">of household water needs covered</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Droplets className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-blue-600 mb-1">{potentialCollection.toLocaleString()}</div>
                <div className="text-sm text-gray-700">litres saved annually</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-purple-600 mb-1">{daysOfIndependence}</div>
                <div className="text-sm text-gray-700">days of water independence</div>
              </div>
            </div>
            <Separator className="my-6" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-white rounded-lg border border-green-200">
                <h4 className="text-green-900 mb-2">💡 Pro Tip</h4>
                <p className="text-sm text-green-800 m-0">Install during pre-monsoon (April–May) to maximise first-year benefits.</p>
              </div>
              <div className="p-4 bg-white rounded-lg border border-green-200">
                <h4 className="text-green-900 mb-2">🌍 Environmental Impact</h4>
                <p className="text-sm text-green-800 m-0">Reduces groundwater depletion and helps recharge local aquifers.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="sticky bottom-0 bg-white p-4 border-t border-gray-200 -mx-6 -mb-6">
        <div className="space-y-3">
          <div className="flex space-x-3">
            <Button onClick={onPrevious} variant="outline" className="flex-1 h-12 border-gray-300">Back to Details</Button>
            <Button onClick={onStartOver} variant="outline" className="flex-1 h-12 border-blue-300 text-blue-600 hover:bg-blue-50">New Assessment</Button>
          </div>
          <div className="flex space-x-3">
            <Button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="flex-1 h-12 bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-400"
            >
              <Download className="w-4 h-4 mr-2" />
              {isGeneratingPDF ? 'Generating PDF…' : 'Download PDF Report'}
            </Button>
            <Button className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white">
              <Share className="w-4 h-4 mr-2" /> Share Results
            </Button>
          </div>
          <div className="flex justify-center">
            <Button variant="ghost" className="text-blue-600 hover:text-blue-800">
              <HelpCircle className="w-4 h-4 mr-2" /> Need Help? Contact Support
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
