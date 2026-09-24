/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  Share2,
  RotateCcw,
  History,
  PhoneCall,
  X,
  ExternalLink,
  Info,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { RiskResult } from '../types.ts';

interface RiskResultModalProps {
  result: RiskResult;
  onClose: () => void;
  onNewAssessment: () => void;
  onGoToDashboard: () => void;
  onOpenEmergency: () => void;
}

export const RiskResultModal: React.FC<RiskResultModalProps> = ({
  result,
  onClose,
  onNewAssessment,
  onGoToDashboard,
  onOpenEmergency,
}) => {
  const [copied, setCopied] = React.useState(false);

  // Color mappings
  const isHigh = result.riskLevel === 'High';
  const isMedium = result.riskLevel === 'Medium';
  const isLow = result.riskLevel === 'Low';

  const badgeColor = isHigh
    ? 'bg-rose-100 text-rose-800 border-rose-200'
    : isMedium
    ? 'bg-amber-100 text-amber-800 border-amber-200'
    : 'bg-emerald-100 text-emerald-800 border-emerald-200';

  const progressBg = isHigh ? 'bg-rose-600' : isMedium ? 'bg-amber-500' : 'bg-emerald-600';
  const scoreTextColor = isHigh ? 'text-rose-700' : isMedium ? 'text-amber-700' : 'text-emerald-700';

  // Separate amplifiers and buffers
  const amplifiers = result.contributingFactors.filter((f) => f.impact === 'amplifier');
  const buffers = result.contributingFactors.filter((f) => f.impact === 'buffer');

  const handleShare = () => {
    const text = `WomenSafe AI Risk Assessment:\nRisk Index: ${result.riskScore}/100 (${result.riskLevel} Risk)\nSummary: ${result.summary}\nSafety Advice: ${result.recommendations.slice(0, 2).join(' ')}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div id="risk-result-modal" className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200 transition-colors">
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-900 dark:text-white">AI Safety Assessment Result</h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Evaluated at {new Date(result.evaluatedAt).toLocaleTimeString()}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Immediate Danger Warning Banner */}
        <div className="px-6 py-3 bg-rose-600 text-white flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-200 animate-pulse" />
            <span className="font-semibold">{result.immediateDangerNotice}</span>
          </div>
          <button
            onClick={onOpenEmergency}
            className="px-2.5 py-1 bg-white text-rose-700 rounded-md font-bold text-[11px] hover:bg-rose-50 shrink-0 whitespace-nowrap shadow-xs"
          >
            SOS Directory
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Main Risk Score Card */}
          <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${badgeColor}`}>
                  {result.riskLevel} Risk
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {(result.confidenceScore * 100).toFixed(0)}% Model Confidence
                </span>
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">{result.summary}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md leading-relaxed">{result.explanation}</p>
            </div>

            {/* Circular / Large Score Badge */}
            <div className="flex flex-col items-center justify-center shrink-0">
              <div className="relative w-28 h-28 rounded-full bg-white dark:bg-slate-800 shadow-md border-4 border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center">
                <span className={`text-4xl font-black ${scoreTextColor}`}>{result.riskScore}</span>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Out of 100</span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-medium">CPTED Vulnerability Index</span>
            </div>
          </div>

          {/* Contributing Factors: Amplifiers vs Buffers */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-slate-400" />
              <span>Explainable Factor Attribution</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Amplifiers */}
              <div className="p-3.5 bg-rose-50/50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 rounded-xl space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800 dark:text-rose-300">
                  <TrendingUp className="w-3.5 h-3.5 text-rose-600" />
                  <span>Risk Amplifiers</span>
                </div>
                {amplifiers.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400">No major negative risk amplifiers detected.</p>
                ) : (
                  <div className="space-y-1.5">
                    {amplifiers.map((f, i) => (
                      <div key={i} className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-rose-200/60 dark:border-rose-900/50 text-xs">
                        <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
                          <span>{f.factor}</span>
                          <span className="text-rose-600 dark:text-rose-400">+{f.scoreImpact} pts</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{f.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Buffers */}
              <div className="p-3.5 bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 rounded-xl space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  <TrendingDown className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Safety Buffers</span>
                </div>
                {buffers.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400">No major positive environmental buffers present.</p>
                ) : (
                  <div className="space-y-1.5">
                    {buffers.map((f, i) => (
                      <div key={i} className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-emerald-200/60 dark:border-emerald-900/50 text-xs">
                        <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
                          <span>{f.factor}</span>
                          <span className="text-emerald-700 dark:text-emerald-400">{f.scoreImpact} pts</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{f.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actionable Recommendations */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 rounded-xl space-y-2.5">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Personalized Safety Guidance & Precautions</span>
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
              {result.recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-600 mt-1.5 shrink-0" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copied ? 'Copied to Clipboard!' : 'Share Summary'}</span>
            </button>
            <button
              onClick={onGoToDashboard}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <History className="w-3.5 h-3.5" />
              <span>View in History</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onNewAssessment();
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>New Assessment</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
