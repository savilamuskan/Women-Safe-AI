/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  MapPin,
  Calendar,
  Clock,
  Sun,
  Moon,
  Users,
  Building,
  Shield,
  Send,
  AlertCircle,
  Car,
  Footprints,
  Sparkles,
  Store,
  Compass,
} from 'lucide-react';
import { LocationPickerMap } from './LocationPickerMap.tsx';
import { AssessmentInput, RiskResult } from '../types.ts';
import { apiFetch } from '../utils/api.ts';

interface AssessmentFormProps {
  token: string | null;
  onResultGenerated: (result: RiskResult, recordId?: string) => void;
}

export const AssessmentForm: React.FC<AssessmentFormProps> = ({ token, onResultGenerated }) => {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const currentTimeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });

  // Form State
  const [locationName, setLocationName] = useState('');
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [date, setDate] = useState(todayStr);
  const [time, setTime] = useState(currentTimeStr);
  const [day, setDay] = useState(dayName);

  const [areaType, setAreaType] = useState<AssessmentInput['areaType']>('commercial');
  const [lightingCondition, setLightingCondition] = useState<AssessmentInput['lightingCondition']>('moderate');
  const [crowdLevel, setCrowdLevel] = useState<AssessmentInput['crowdLevel']>('moderate');
  const [emergencyDistance, setEmergencyDistance] = useState<AssessmentInput['emergencyDistance']>('500m_1km');
  const [historicalRisk, setHistoricalRisk] = useState<AssessmentInput['historicalRisk']>('moderate');
  const [travelMode, setTravelMode] = useState<AssessmentInput['travelMode']>('walking');
  const [companionStatus, setCompanionStatus] = useState<AssessmentInput['companionStatus']>('alone');
  const [nearbyAmenities, setNearbyAmenities] = useState<string[]>(['open_cafe', 'transit_booth']);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loadingStep, setLoadingStep] = useState('');

  // Handle Date change and sync day of week
  const handleDateChange = (val: string) => {
    setDate(val);
    try {
      const d = new Date(val + 'T00:00:00');
      if (!isNaN(d.getTime())) {
        setDay(d.toLocaleDateString('en-US', { weekday: 'long' }));
      }
    } catch {
      // Ignore fallback
    }
  };

  const toggleAmenity = (amenityId: string) => {
    if (nearbyAmenities.includes(amenityId)) {
      setNearbyAmenities(nearbyAmenities.filter((a) => a !== amenityId));
    } else {
      setNearbyAmenities([...nearbyAmenities, amenityId]);
    }
  };

  const handleLocationChange = (name: string, lat: number, lng: number) => {
    setLocationName(name);
    setLatitude(lat);
    setLongitude(lng);
    setErrorMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationName.trim() || latitude === undefined || longitude === undefined) {
      setErrorMessage('Please click "Detect My Real Location", enter a location manually, or select a point on the map.');
      return;
    }

    setErrorMessage('');
    setIsLoading(true);

    const steps = [
      'Normalizing environmental coordinates...',
      'Evaluating spatial lux & lighting thresholds...',
      'Calculating natural surveillance density...',
      'Computing emergency dispatch radius...',
      'Applying Scikit-Learn ensemble inference...',
      'Synthesizing explainable contributing factors...',
    ];

    let stepIdx = 0;
    setLoadingStep(steps[0]);
    const stepInterval = setInterval(() => {
      stepIdx++;
      if (stepIdx < steps.length) {
        setLoadingStep(steps[stepIdx]);
      }
    }, 320);

    const payload: AssessmentInput = {
      location: locationName,
      latitude,
      longitude,
      date,
      time,
      day,
      areaType,
      lightingCondition,
      crowdLevel,
      emergencyDistance,
      historicalRisk,
      nearbyAmenities,
      travelMode,
      companionStatus,
    };

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const data = await apiFetch<{ result: RiskResult; assessmentId?: string }>('/api/risk/predict', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      clearInterval(stepInterval);
      onResultGenerated(data.result, data.assessmentId);
    } catch (err: any) {
      clearInterval(stepInterval);
      setErrorMessage(err.message || 'An unexpected error occurred during evaluation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const areaTypeOptions = [
    { id: 'commercial', label: 'Commercial / Retail District', desc: 'Open shops & street signs' },
    { id: 'transit_hub', label: 'Transit Hub / Metro Station', desc: 'High commuter interchange' },
    { id: 'residential', label: 'Residential Neighborhood', desc: 'Overlooking homes & apartments' },
    { id: 'campus', label: 'Secured Campus / University', desc: 'Dedicated security presence' },
    { id: 'industrial', label: 'Industrial / Warehousing Zone', desc: 'Few pedestrians, blind spots' },
    { id: 'park', label: 'Public Park / Recreational Space', desc: 'Vegetation, unlit trails' },
    { id: 'deserted_alley', label: 'Confined Alleyway / Bypass', desc: 'Restricted egress, low sightlines' },
  ];

  const amenityOptions = [
    { id: '24_7_store', label: '24/7 Convenience Store' },
    { id: 'police_booth', label: 'Active Police Booth / Dispatch' },
    { id: 'metro_station', label: 'Operating Transit Station' },
    { id: 'open_cafe', label: 'Open Cafe / Restaurant' },
    { id: 'pharmacy', label: 'All-Night Pharmacy / Clinic' },
    { id: 'security_kiosk', label: 'Private Security Gate / Kiosk' },
  ];

  return (
    <div id="safety-assessment-form-container" className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      {/* Form Header */}
      <div className="mb-8 space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 border border-rose-200 text-rose-700 rounded-full text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Risk Assessment Engine</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Evaluate Route & Environmental Safety Risk
        </h1>
        <p className="text-sm text-slate-600">
          Provide observable spatial and environmental details below. All inputs are evaluated with zero collection of
          sensitive personal information or exact residential addresses.
        </p>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Unable to complete assessment</p>
            <p className="text-xs text-rose-700">{errorMessage}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* SECTION 1: Location & Interactive Map */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
            <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs">
              1
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900">Location & Route Node</h2>
              <p className="text-xs text-slate-500">Pick a location on the map or search an intersection</p>
            </div>
          </div>

          <LocationPickerMap
            locationName={locationName}
            latitude={latitude}
            longitude={longitude}
            onChange={handleLocationChange}
          />
        </div>

        {/* SECTION 2: Date & Time Context */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
            <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs">
              2
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900">Temporal Parameters</h2>
              <p className="text-xs text-slate-500">Time-of-day influences lighting and commercial closure schedules</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Date</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:bg-white"
                style={{ color: '#05090d' }}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Time of Day</span>
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:bg-white"
                style={{ color: '#030b14' }}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-slate-400" />
                <span>Day of Week</span>
              </label>
              <input
                type="text"
                value={day}
                readOnly
                className="w-full px-3 py-2 text-sm bg-slate-100 border border-slate-200 rounded-lg text-slate-600 font-medium cursor-not-allowed"
                style={{ color: '#030912' }}
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: Environmental Factors */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-xs space-y-6">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
            <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs">
              3
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900">Environmental & CPTED Observations</h2>
              <p className="text-xs text-slate-500">Key architectural and crowd indicators</p>
            </div>
          </div>

          {/* Area Type Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-slate-400" />
              <span>Area Classification & Zoning</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {areaTypeOptions.map((opt) => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setAreaType(opt.id as any)}
                  className={`text-left p-3 rounded-xl border text-xs transition-all ${
                    areaType === opt.id
                      ? 'border-rose-500 bg-rose-50/70 text-rose-900 font-semibold ring-2 ring-rose-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  <p className="font-bold">{opt.label}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Lighting Conditions */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5 text-slate-400" />
              <span>Lighting & Illumination Level</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: 'well_lit', label: 'Well-Lit', sub: 'Active LED/Sodium streetlamps', impact: 'Strong Buffer' },
                { id: 'moderate', label: 'Moderate', sub: 'Acceptable ambient lighting', impact: 'Neutral' },
                { id: 'dim', label: 'Dimly Lit', sub: 'Intermittent dark patches', impact: 'Elevated Risk' },
                { id: 'pitch_dark', label: 'Pitch Dark', sub: 'Zero artificial illumination', impact: 'Severe Risk' },
              ].map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setLightingCondition(item.id as any)}
                  className={`p-3 rounded-xl border text-left text-xs transition-all ${
                    lightingCondition === item.id
                      ? 'border-rose-500 bg-rose-50/70 text-rose-900 font-semibold ring-2 ring-rose-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  <p className="font-bold">{item.label}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{item.sub}</p>
                  <span
                    className={`inline-block mt-2 text-[10px] px-1.5 py-0.5 rounded font-bold ${
                      item.impact.includes('Buffer')
                        ? 'bg-emerald-100 text-emerald-800'
                        : item.impact.includes('Risk')
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {item.impact}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Crowd Density */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span>Pedestrian Traffic & Crowd Density</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: 'high', label: 'High Density', desc: 'Frequent passersby & shoppers' },
                { id: 'moderate', label: 'Moderate Density', desc: 'Steady occasional pedestrians' },
                { id: 'low', label: 'Low / Sparse', desc: 'Prolonged gaps between people' },
                { id: 'deserted', label: 'Deserted', desc: 'Completely isolated / empty' },
              ].map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setCrowdLevel(item.id as any)}
                  className={`p-3 rounded-xl border text-left text-xs transition-all ${
                    crowdLevel === item.id
                      ? 'border-rose-500 bg-rose-50/70 text-rose-900 font-semibold ring-2 ring-rose-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  <p className="font-bold">{item.label}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{item.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Emergency Dispatch Distance & Historical Risk */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Distance to Emergency Services (Police / Hospital)
              </label>
              <select
                value={emergencyDistance}
                onChange={(e) => setEmergencyDistance(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500"
              >
                <option value="under_500m">&lt; 500 meters (Immediate ~2 min response)</option>
                <option value="500m_1km">500m – 1 km (~5 min response)</option>
                <option value="1km_3km">1 km – 3 km (Standard urban distance)</option>
                <option value="over_3km">&gt; 3 km (Delayed emergency transit)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Historical Safety Indicators (Area Familiarity)
              </label>
              <select
                value={historicalRisk}
                onChange={(e) => setHistoricalRisk(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500"
              >
                <option value="low">Low (Active community policing & safe record)</option>
                <option value="moderate">Moderate (Average municipal record)</option>
                <option value="elevated">Elevated (Occasional reported harassment)</option>
                <option value="high">High (Known poorly monitored corridor)</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 4: Travel Modality & Safe Havens */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-xs space-y-6">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
            <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs">
              4
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900">Personal Travel Modality & Safe Havens</h2>
              <p className="text-xs text-slate-500">Companionship and nearby points of refuge</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Footprints className="w-3.5 h-3.5 text-slate-400" />
                <span>Companion Status</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'alone', label: 'Solo' },
                  { id: 'with_companion', label: '1 Companion' },
                  { id: 'with_group', label: 'Group (3+)' },
                ].map((c) => (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => setCompanionStatus(c.id as any)}
                    className={`py-2 text-center rounded-lg border text-xs transition-all ${
                      companionStatus === c.id
                        ? 'border-rose-500 bg-rose-50 text-rose-900 font-bold'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5 text-slate-400" />
                <span>Mode of Travel</span>
              </label>
              <select
                value={travelMode}
                onChange={(e) => setTravelMode(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500"
              >
                <option value="walking">Walking / On Foot</option>
                <option value="public_transit">Public Bus / Metro Transit</option>
                <option value="rideshare">Rideshare / Licensed Cab</option>
                <option value="personal_vehicle">Personal Car / Scooter</option>
                <option value="waiting">Stationary / Waiting at Stop</option>
              </select>
            </div>
          </div>

          {/* Nearby Safe Havens Multi-select */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-slate-400" />
              <span>Visible Safe Havens within 200m (Select all that apply)</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {amenityOptions.map((item) => {
                const isChecked = nearbyAmenities.includes(item.id);
                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => toggleAmenity(item.id)}
                    className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-left text-xs transition-all ${
                      isChecked
                        ? 'border-emerald-500 bg-emerald-50/80 text-emerald-900 font-medium'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center text-[10px] border ${
                        isChecked ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isChecked && '✓'}
                    </div>
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Submit & Calculate Button */}
        <div className="pt-2">
          <button
            id="submit-risk-assessment-button"
            type="submit"
            disabled={isLoading}
            className="w-full py-4 px-6 bg-rose-600 hover:bg-rose-700 active:scale-[0.99] text-white font-bold text-base rounded-xl shadow-lg shadow-rose-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-wait"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>{loadingStep || 'Evaluating Environmental Risk...'}</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Generate AI Safety Risk Assessment</span>
              </>
            )}
          </button>
          <p className="text-center text-[11px] text-slate-500 mt-2">
            Assessment results are generated via Scikit-learn environmental ML models and saved to your dashboard history.
          </p>
        </div>
      </form>
    </div>
  );
};
