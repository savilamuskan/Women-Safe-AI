/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Cpu,
  BarChart3,
  Users,
  Activity,
  RefreshCw,
  Zap,
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  ChevronRight,
  Database,
} from 'lucide-react';
import { SystemStats, AssessmentRecord, User } from '../types.ts';

interface AdminDashboardProps {
  user: User;
  token: string | null;
  onSelectRecord: (record: AssessmentRecord) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, token, onSelectRecord }) => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [allAssessments, setAllAssessments] = useState<AssessmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRetraining, setIsRetraining] = useState(false);
  const [retrainMessage, setRetrainMessage] = useState('');

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, assessRes] = await Promise.all([
        fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/assessments', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (statsRes.ok) {
        const s = await statsRes.json();
        setStats(s);
      }
      if (assessRes.ok) {
        const a = await assessRes.json();
        setAllAssessments(a.assessments || []);
      }
    } catch (err) {
      console.error('Admin data fetch error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [token]);

  const handleRetrain = async () => {
    setIsRetraining(true);
    setRetrainMessage('');
    try {
      const res = await fetch('/api/admin/retrain', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setRetrainMessage('Model retrained and re-calibrated successfully!');
        if (stats && data.metrics) {
          setStats({ ...stats, modelMetrics: data.metrics });
        }
      }
    } catch {
      setRetrainMessage('Failed to trigger retraining pipeline.');
    } finally {
      setIsRetraining(false);
    }
  };

  return (
    <div id="admin-dashboard-view" className="max-w-7xl mx-auto px-4 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">System Administration</span>
            <span className="text-xs px-2 py-0.5 bg-rose-100 text-rose-800 rounded-md font-bold">
              Admin Access
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Risk Model Operations & Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            System health, environmental risk telemetry, Scikit-learn model parameters, and global audit logs.
          </p>
        </div>

        <button
          onClick={fetchAdminData}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 text-xs font-semibold shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Analytics</span>
        </button>
      </div>

      {stats && (
        <>
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs text-slate-500 font-medium">Global Assessments</span>
              <p className="text-3xl font-black text-slate-900">{stats.totalAssessments}</p>
              <span className="text-[11px] text-slate-400">Total logged across all users</span>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs text-slate-500 font-medium">Mean Risk Score</span>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-black text-slate-900">{stats.averageRiskScore}</p>
                <span className="text-xs text-slate-400">/ 100</span>
              </div>
              <span className="text-[11px] text-slate-400">Normalized environmental index</span>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs text-slate-500 font-medium">High Risk Corridors</span>
              <p className="text-3xl font-black text-rose-600">{stats.riskDistribution.high}</p>
              <span className="text-[11px] text-rose-700 font-medium">
                {((stats.riskDistribution.high / (stats.totalAssessments || 1)) * 100).toFixed(1)}% of total queries
              </span>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs text-slate-500 font-medium">Model Validation Accuracy</span>
              <p className="text-3xl font-black text-emerald-600">
                {(stats.modelMetrics.accuracy * 100).toFixed(1)}%
              </p>
              <span className="text-[11px] text-emerald-700 font-medium">
                ROC-AUC: {(stats.modelMetrics.rocAuc * 100).toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Machine Learning Pipeline Management Panel */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-base text-slate-900">{stats.modelMetrics.name}</h2>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-100 text-purple-800 rounded-md">
                      v{stats.modelMetrics.version}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    RandomForest multi-class classifier with CPTED feature extraction
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleRetrain}
                  disabled={isRetraining}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-60 shadow-xs"
                >
                  <Zap className={`w-3.5 h-3.5 ${isRetraining ? 'animate-spin' : ''}`} />
                  <span>{isRetraining ? 'Retraining Model...' : 'Retrain & Calibrate Model'}</span>
                </button>
              </div>
            </div>

            {retrainMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{retrainMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-500">Training Samples</span>
                <p className="font-bold text-slate-800 text-sm mt-0.5">{stats.modelMetrics.trainingSamples}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-500">F1 Weighted Score</span>
                <p className="font-bold text-slate-800 text-sm mt-0.5">{stats.modelMetrics.f1Score}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-500">Feature Dimensions</span>
                <p className="font-bold text-slate-800 text-sm mt-0.5">8 Categorical + Numerical</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-500">Inference Latency</span>
                <p className="font-bold text-slate-800 text-sm mt-0.5">&lt; 35ms (p99)</p>
              </div>
            </div>
          </div>

          {/* Visual Breakdown of Risk Categories */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Risk Distribution Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-rose-600" />
                <span>Risk Level Classification Split</span>
              </h3>

              <div className="space-y-3 pt-2">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-emerald-700">Low Risk (0–34)</span>
                    <span className="text-slate-600">{stats.riskDistribution.low} assessments</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{
                        width: `${((stats.riskDistribution.low / (stats.totalAssessments || 1)) * 100).toFixed(0)}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-amber-700">Medium Risk (35–64)</span>
                    <span className="text-slate-600">{stats.riskDistribution.medium} assessments</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{
                        width: `${((stats.riskDistribution.medium / (stats.totalAssessments || 1)) * 100).toFixed(0)}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-rose-700">High Risk (65–100)</span>
                    <span className="text-slate-600">{stats.riskDistribution.high} assessments</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-rose-500 rounded-full"
                      style={{
                        width: `${((stats.riskDistribution.high / (stats.totalAssessments || 1)) * 100).toFixed(0)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Area Vulnerability Matrix */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-600" />
                <span>Area Zoning Vulnerability Matrix</span>
              </h3>
              <div className="space-y-2 pt-1 text-xs">
                {stats.areaRiskBreakdown.map((item) => (
                  <div key={item.area} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
                    <span className="font-semibold text-slate-700 capitalize">{item.area.replace('_', ' ')}</span>
                    <div className="text-right">
                      <span className="font-bold text-slate-900">{item.count} assessments</span>
                      <span className="text-[10px] text-slate-500 ml-2 font-medium">(Avg {item.averageScore} pts)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* System Audit Log of Assessments */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">System-Wide Assessment Telemetry</h3>
                <p className="text-xs text-slate-500">Live operational audit stream across all system users</p>
              </div>
              <span className="text-xs text-slate-400">{allAssessments.length} total entries</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3">Location & Coordinates</th>
                    <th className="px-6 py-3">Area Zoning</th>
                    <th className="px-6 py-3">Lighting / Crowd</th>
                    <th className="px-6 py-3">Risk Index</th>
                    <th className="px-6 py-3">Timestamp</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allAssessments.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/80">
                      <td className="px-6 py-3.5 font-medium text-slate-900 max-w-xs truncate">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{a.location}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 capitalize">{a.area_type.replace('_', ' ')}</td>
                      <td className="px-6 py-3.5 capitalize">
                        {a.lighting_condition.replace('_', ' ')} / {a.crowd_level}
                      </td>
                      <td className="px-6 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${
                            a.risk_level === 'High'
                              ? 'bg-rose-100 text-rose-800 border-rose-200'
                              : a.risk_level === 'Medium'
                              ? 'bg-amber-100 text-amber-800 border-amber-200'
                              : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          }`}
                        >
                          {a.risk_score} pts ({a.risk_level})
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-slate-400">
                        {a.date} {a.time}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <button
                          onClick={() => onSelectRecord(a)}
                          className="text-rose-600 hover:text-rose-700 font-bold hover:underline inline-flex items-center gap-1"
                        >
                          Inspect
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
