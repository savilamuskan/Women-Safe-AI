/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Lock, EyeOff, FileText, CheckCircle2, ShieldCheck, Scale } from 'lucide-react';

export const PrivacyInfo: React.FC = () => {
  return (
    <div id="privacy-ethics-page" className="max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <span className="text-xs font-bold text-rose-600 uppercase tracking-widest">Privacy & Ethical AI Charter</span>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Privacy Architecture & Responsible AI Standards</h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          WomenSafe AI was built from the ground up with strict data minimization principles. We believe personal safety
          tools should empower women without subjecting them to pervasive surveillance or personal data harvesting.
        </p>
      </div>

      {/* Core Privacy Guarantees */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
            <EyeOff className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm sm:text-base">No Private Home Addresses</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Our platform evaluates environmental zones (e.g. "Main Commercial Boulevard" or generalized intersections).
            We never request, require, or record exact apartment or residential addresses.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-100">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm sm:text-base">No Continuous GPS Tracking</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            We do not run background location daemons or telemetry tracking your daily physical movements. Location inputs
            are evaluated only on-demand when you explicitly submit an assessment.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-100">
            <Scale className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm sm:text-base">No Fabricated Crime Stats</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            We strictly refuse to present fabricated crime numbers or stigmatize neighborhoods. The model focuses
            transparently on physical environmental cues (illumination, egress routes, safe havens).
          </p>
        </div>
      </div>

      {/* Transparency & AI Model Limits */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-rose-600" />
          <span>Transparency & Machine Learning Limitations</span>
        </h2>

        <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
          <p>
            <strong>What the Model Predicts:</strong> An environmental vulnerability score (0–100) reflecting how physical
            surroundings (lux lighting levels, natural surveillance, proximity to first responders, zoning) align with
            established Crime Prevention Through Environmental Design (CPTED) frameworks.
          </p>
          <p>
            <strong>What the Model DOES NOT Predict:</strong> The model does not and cannot predict specific human criminal
            conduct or guarantee that an incident will or will not occur at a given place or time. Crime is a complex
            phenomenon influenced by myriad socioeconomic variables outside of spatial physics.
          </p>
          <p>
            <strong>User Sovereignty & Data Rights:</strong> Registered users maintain full sovereign control over their
            assessment records. You can inspect your historical evaluations or permanently delete individual records or
            your entire history from the dashboard at any time.
          </p>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Version 2.4.0 — WomenSafe AI Ethics Review</span>
          <span>Last Updated: September 2026</span>
        </div>
      </div>
    </div>
  );
};
