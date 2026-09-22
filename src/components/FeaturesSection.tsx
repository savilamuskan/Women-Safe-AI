/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sun, Users, MapPin, ShieldCheck, Lock, Activity, Eye, Zap } from 'lucide-react';

export const FeaturesSection: React.FC = () => {
  const features = [
    {
      icon: Sun,
      title: 'Lighting & Visibility Analysis',
      description:
        'Calculates illumination thresholds across primary walkways, alleys, and transit stops based on ambient luminance and municipal infrastructure.',
      color: 'text-amber-600 bg-amber-50 border-amber-100',
    },
    {
      icon: Users,
      title: 'Natural Surveillance Modeling',
      description:
        'Integrates Jane Jacobs "eyes on the street" principle to evaluate foot traffic cadence, bystander density, and active open storefronts.',
      color: 'text-blue-600 bg-blue-50 border-blue-100',
    },
    {
      icon: MapPin,
      title: 'Emergency Proximity Index',
      description:
        'Measures transit distance and estimated response intervals to nearby police stations, medical hubs, and 24/7 commercial safe havens.',
      color: 'text-rose-600 bg-rose-50 border-rose-100',
    },
    {
      icon: Eye,
      title: 'Explainable AI Attributions',
      description:
        'Clear factor breakdown with SHAP-inspired score impacts. Understand exactly why a score was assigned without black-box opacity.',
      color: 'text-purple-600 bg-purple-50 border-purple-100',
    },
    {
      icon: Lock,
      title: 'Privacy-First Architecture',
      description:
        'We never ask for or store your exact private residential address or full daily GPS breadcrumbs. Only generalized spatial parameters are evaluated.',
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    },
    {
      icon: Zap,
      title: 'Real-Time Adaptive Guidance',
      description:
        'Translates environmental assessments into actionable precautions: alternative illuminated routes, trip-sharing triggers, and one-tap emergency access.',
      color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    },
  ];

  return (
    <section id="features-section" className="py-16 bg-slate-50 border-y border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <h2 className="text-xs font-bold text-rose-600 uppercase tracking-widest">Platform Capabilities</h2>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Engineered on CPTED Principles & Empirical Safety Science
          </p>
          <p className="text-slate-600 text-sm sm:text-base">
            Crime Prevention Through Environmental Design (CPTED) is a multi-disciplinary approach to deterring criminal
            behavior through environmental architectural cues.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow space-y-3"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${feature.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-slate-900">{feature.title}</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
