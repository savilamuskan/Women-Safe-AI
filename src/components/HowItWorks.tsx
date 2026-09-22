/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MapPin, Sliders, Cpu, FileCheck } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      step: '01',
      title: 'Specify Spatial Context',
      desc: 'Pinpoint your intended route or transit stop on the interactive map and provide time of departure.',
      icon: MapPin,
    },
    {
      step: '02',
      title: 'Observe Environmental Factors',
      desc: 'Select current lighting conditions, crowd volume, nearby open businesses, and companion status.',
      icon: Sliders,
    },
    {
      step: '03',
      title: 'Scikit-Learn ML Inference',
      desc: 'The calibrated Random Forest ensemble computes the environmental vulnerability coefficient across 8 weighted axes.',
      icon: Cpu,
    },
    {
      step: '04',
      title: 'Actionable Safety Report',
      desc: 'Receive your explainable risk index (0–100), key positive & negative drivers, and personalized safety precautions.',
      icon: FileCheck,
    },
  ];

  return (
    <section id="how-it-works-section" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <span className="text-xs font-bold text-rose-600 uppercase tracking-widest">Step-by-Step Workflow</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">How WomenSafe AI Works</h2>
          <p className="text-slate-600 text-sm">
            From environmental observation to explainable risk synthesis in seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          {steps.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="relative bg-slate-50 rounded-2xl p-6 border border-slate-200/80 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black px-2.5 py-1 bg-white border border-slate-200 text-slate-700 rounded-lg">
                      {item.step}
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="font-bold text-base text-slate-900">{item.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Safety Disclaimer Banner */}
        <div className="mt-12 p-4 sm:p-5 bg-amber-50/80 border border-amber-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-200 text-amber-900 flex items-center justify-center shrink-0 font-bold text-xs">
            !
          </div>
          <div className="text-xs sm:text-sm text-amber-900 leading-relaxed">
            <span className="font-bold">Important Safety Notice:</span> This AI tool provides an environmental risk estimate
            based on observable physical factors. It does not claim to predict crimes with certainty or replace law enforcement.
            If you are in immediate danger, please contact local emergency services immediately.
          </div>
        </div>
      </div>
    </section>
  );
};
