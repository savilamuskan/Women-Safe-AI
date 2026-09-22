/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PhoneCall, Navigation, BellRing, Compass, ShieldAlert, CheckCircle, Radio } from 'lucide-react';

export const SafetyGuidelines: React.FC<{ onOpenEmergency: () => void }> = ({ onOpenEmergency }) => {
  const hotlines = [
    { country: 'Pakistan (National Police)', emergency: '15 (Pucar 15)', womensCrisis: '1043 (PCSW Women Safety)' },
    { country: 'Pakistan (Rescue & Medical)', emergency: '1122 (Rescue 1122)', womensCrisis: '1099 (MoHR Human Rights)' },
    { country: 'Pakistan (Cyber & Highways)', emergency: '130 (Motorway Police)', womensCrisis: '1991 (FIA Cyber Crime Wing)' },
    { country: 'United States & Canada', emergency: '911', womensCrisis: '1-800-799-SAFE (7233)' },
    { country: 'United Kingdom', emergency: '999 or 112', womensCrisis: '0808 2000 247' },
    { country: 'United Arab Emirates & Gulf', emergency: '999 (Police) / 998', womensCrisis: '800 111 (Women & Child Protection)' },
  ];

  return (
    <div id="safety-guidelines-page" className="max-w-5xl mx-auto px-4 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <span className="text-xs font-bold text-rose-600 uppercase tracking-widest">Practical Protocols</span>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Women Safety Best Practices & Emergency Directory</h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          While technological risk tools offer valuable foresight, environmental awareness and pre-planned emergency
          action protocols remain vital for personal safety.
        </p>
      </div>

      {/* Emergency Alert Trigger Banner */}
      <div className="p-6 bg-gradient-to-r from-rose-600 to-rose-700 rounded-2xl text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <h2 className="text-lg font-bold flex items-center justify-center sm:justify-start gap-2">
            <BellRing className="w-5 h-5 animate-bounce" />
            <span>Need Immediate Assistance or Alarm Beacon?</span>
          </h2>
          <p className="text-xs sm:text-sm text-rose-100">
            Trigger our high-decibel safety alarm siren or access one-touch emergency numbers instantly.
          </p>
        </div>
        <button
          onClick={onOpenEmergency}
          className="px-5 py-2.5 bg-white text-rose-700 font-bold rounded-xl text-sm shadow-md hover:bg-rose-50 active:scale-95 transition-all whitespace-nowrap"
        >
          Launch Emergency SOS
        </button>
      </div>

      {/* Emergency Directory Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <PhoneCall className="w-4 h-4 text-rose-600" />
          <span>International Emergency Numbers & Crisis Lines</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {hotlines.map((h, i) => (
            <div key={i} className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
              <p className="font-semibold text-xs text-slate-900">{h.country}</p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Police / Dispatch:</span>
                <span className="font-bold text-rose-600">{h.emergency}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Women Helpline:</span>
                <span className="font-semibold text-slate-800 text-[11px]">{h.womensCrisis}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommended Protocols */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Navigation className="w-4 h-4 text-blue-600" />
            <span>Active Travel & Walking Recommendations</span>
          </h3>
          <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>Prioritize illuminated arterial roads with open storefronts over deserted alleyway shortcuts.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>Walk assertively with head upright, avoiding burying gaze inside your mobile screen.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>Avoid wearing dual noise-cancelling headphones at night to preserve environmental auditory awareness.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>Identify potential 24/7 safe havens along your corridor (petrol pumps, illuminated convenience stores, hotel lobbies).</span>
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Radio className="w-4 h-4 text-purple-600" />
            <span>Digital Safety & Transit Protocols</span>
          </h3>
          <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>Configure your smartphone's Emergency SOS trigger (e.g. 5 quick clicks on the power button).</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>Share live tracking journeys via WhatsApp, Google Maps, or Apple Find My with a trusted contact.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>When using rideshares, verify vehicle license plate and driver identity prior to stepping inside.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>Keep your battery charged above 30% before embarking on evening journeys.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
