/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Shield, Sparkles, ArrowRight, CheckCircle2, Eye, Sun, Users, MapPin, AlertCircle, Compass } from 'lucide-react';

interface HeroProps {
  onStartAssessment: () => void;
  onExploreHowItWorks: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onStartAssessment, onExploreHowItWorks }) => {
  const [activeDemo, setActiveDemo] = useState<'safe' | 'risky'>('safe');

  return (
    <section id="hero-section" className="relative overflow-hidden pt-8 pb-16 lg:pt-14 lg:pb-24">
      {/* Subtle background ambient gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-rose-50/70 dark:from-rose-950/20 to-transparent pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Mission & Headline */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {/* Mission Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-xs font-semibold shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              <span>Evidence-Based Environmental Criminology AI</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.1]">
              AI-Based Women Safety{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-amber-600">
                Risk Predictor
              </span>
            </h1>

            {/* Description */}
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Evaluate real-world environmental vulnerability factors before and during your travel. WomenSafe AI analyzes
              street illumination, pedestrian density, emergency response distance, and spatial land-use using explainable
              machine learning to deliver actionable safety recommendations.
            </p>

            {/* CTA Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <button
                id="hero-check-safety-button"
                onClick={onStartAssessment}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-base shadow-lg shadow-rose-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Check Safety Risk</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                id="hero-how-it-works-button"
                onClick={onExploreHowItWorks}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold text-base transition-all shadow-xs"
              >
                <Compass className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <span>How the AI Works</span>
              </button>
            </div>

            {/* Key Assurance Indicators */}
            <div className="pt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-left">
              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Explainable Scikit-Learn Model</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Zero Private Address Tracking</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Actionable Route Advice</span>
              </div>
            </div>
          </div>

          {/* Right Column: Live Interactive Scenario Visualizer */}
          <div className="lg:col-span-5">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Interactive Live Demo</span>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">Model v2.4</span>
              </div>

              {/* Toggle Switch */}
              <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveDemo('safe')}
                  className={`py-2 px-3 rounded-lg transition-all ${
                    activeDemo === 'safe'
                      ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Active Commercial Strip
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDemo('risky')}
                  className={`py-2 px-3 rounded-lg transition-all ${
                    activeDemo === 'risky'
                      ? 'bg-white dark:bg-slate-700 text-rose-700 dark:text-rose-400 shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Deserted Alleyway
                </button>
              </div>

              {/* Demo Card Output */}
              {activeDemo === 'safe' ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-emerald-50/80 dark:bg-emerald-950/40 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
                    <div>
                      <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide">Estimated Risk</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-emerald-700 dark:text-emerald-400">18</span>
                        <span className="text-sm font-medium text-emerald-600 dark:text-emerald-500">/ 100</span>
                        <span className="ml-2 px-2 py-0.5 bg-emerald-600 text-white rounded-full text-xs font-bold">
                          Low Risk
                        </span>
                      </div>
                    </div>
                    <div className="w-12 h-12 rounded-full border-4 border-emerald-500/20 border-t-emerald-600 flex items-center justify-center font-bold text-emerald-700 dark:text-emerald-400 text-xs">
                      94% Conf.
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <p className="font-semibold text-slate-700 dark:text-slate-300">Identified Safety Buffers:</p>
                    <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300">
                      <Sun className="w-3.5 h-3.5 text-amber-500" />
                      <span>Bright commercial street lighting (-14 pts)</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300">
                      <Users className="w-3.5 h-3.5 text-blue-500" />
                      <span>Steady pedestrian activity (-15 pts)</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300">
                      <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Police booth within 300m (-12 pts)</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-rose-50/80 dark:bg-rose-950/40 rounded-xl border border-rose-100 dark:border-rose-900/50">
                    <div>
                      <span className="text-xs font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wide">Estimated Risk</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-rose-700 dark:text-rose-400">82</span>
                        <span className="text-sm font-medium text-rose-600 dark:text-rose-400">/ 100</span>
                        <span className="ml-2 px-2 py-0.5 bg-rose-600 text-white rounded-full text-xs font-bold">
                          High Risk
                        </span>
                      </div>
                    </div>
                    <div className="w-12 h-12 rounded-full border-4 border-rose-500/20 border-t-rose-600 flex items-center justify-center font-bold text-rose-700 dark:text-rose-400 text-xs">
                      94% Conf.
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <p className="font-semibold text-slate-700 dark:text-slate-300">Contributing Risk Amplifiers:</p>
                    <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                      <span>Pitch dark / unlit corridor (+25 pts)</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                      <span>Zero natural surveillance / deserted (+23 pts)</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                      <span>Emergency dispatch distance &gt;3 km (+15 pts)</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onStartAssessment}
                  className="w-full py-2.5 text-center text-xs font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                >
                  Test Your Own Route or Location &rarr;
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
