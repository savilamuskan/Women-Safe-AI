/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Shield, Heart, AlertTriangle, ExternalLink } from 'lucide-react';

interface FooterProps {
  onNavigate: (view: string) => void;
  onOpenEmergency: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenEmergency }) => {
  return (
    <footer id="site-footer" className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Mission */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2 text-white font-bold text-base">
              <div className="w-7 h-7 rounded-lg bg-rose-600 flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span>WomenSafe AI</span>
            </div>
            <p className="text-slate-400 max-w-md leading-relaxed">
              Empowering women and vulnerable pedestrians through explainable machine learning risk modeling, Crime
              Prevention Through Environmental Design (CPTED) frameworks, and actionable spatial safety recommendations.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1">
              <span>Open Environmental Standard</span>
              <span>•</span>
              <span>Scikit-Learn Random Forest Pipeline</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-2.5">
            <p className="font-bold text-white uppercase tracking-wider text-[11px]">Platform Sections</p>
            <ul className="space-y-1.5">
              <li>
                <button onClick={() => onNavigate('landing')} className="hover:text-white transition-colors">
                  Home
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('assess')} className="hover:text-white transition-colors">
                  Risk Assessment Form
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('how-it-works')} className="hover:text-white transition-colors">
                  Methodology & How It Works
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('guidelines')} className="hover:text-white transition-colors">
                  Safety Guidelines & Protocols
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('privacy')} className="hover:text-white transition-colors">
                  Privacy Charter & AI Ethics
                </button>
              </li>
            </ul>
          </div>

          {/* Rapid Safety Contacts */}
          <div className="space-y-2.5">
            <p className="font-bold text-white uppercase tracking-wider text-[11px]">Emergency Assistance</p>
            <p className="text-[11px] text-slate-400">
              Pakistan dispatch: <strong>15</strong> (Police), <strong>1043</strong> (Women Safety),{' '}
              <strong>1122</strong> (Rescue), <strong>1099</strong> (MoHR), <strong>130</strong> (Motorway).
            </p>
            <button
              onClick={onOpenEmergency}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs transition-colors"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>SOS Sound & Hotlines</span>
            </button>
          </div>
        </div>

        {/* Legal Disclaimer */}
        <div className="pt-6 border-t border-slate-800 text-[11px] text-slate-500 leading-relaxed space-y-2">
          <p>
            <strong className="text-slate-400">Disclaimer:</strong> WomenSafe AI provides an evidence-informed statistical
            estimate of physical environmental vulnerability (lighting, natural surveillance, emergency proximity) for
            informational and personal awareness purposes only. The platform does not claim to predict criminal incidents
            with absolute certainty and should never supersede situational awareness, personal judgment, or official
            emergency protocols.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2">
            <p>&copy; 2026 WomenSafe AI. All rights reserved. Built with privacy-first standards.</p>
            <p className="flex items-center gap-1 text-slate-400">
              <span>Safety for every step</span>
              <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
