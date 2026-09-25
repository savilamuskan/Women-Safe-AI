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
  UserCog,
  Mail,
  ShieldCheck,
  Edit2,
  KeyRound,
  Trash2,
} from 'lucide-react';
import { SystemStats, AssessmentRecord, User } from '../types.ts';
import { EditProfileModal } from './EditProfileModal.tsx';
import { apiFetch } from '../utils/api.ts';

interface AdminDashboardProps {
  user: User;
  token: string | null;
  onSelectRecord: (record: AssessmentRecord) => void;
  onUpdateUser: (updatedUser: User, newToken?: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  user,
  token,
  onSelectRecord,
  onUpdateUser,
}) => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [allAssessments, setAllAssessments] = useState<AssessmentRecord[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRetraining, setIsRetraining] = useState(false);
  const [retrainMessage, setRetrainMessage] = useState('');
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [editingTargetUser, setEditingTargetUser] = useState<User | null>(null);

  // Server-side PIN gate state
  const [needsPinUnlock, setNeedsPinUnlock] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);

  const fetchAdminData = async () => {
    setLoading(true);
    setPinError('');
    try {
      const [s, a, u] = await Promise.all([
        apiFetch<SystemStats>('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } }),
        apiFetch<{ assessments: AssessmentRecord[] }>('/api/admin/assessments', { headers: { Authorization: `Bearer ${token}` } }),
        apiFetch<{ users: User[] }>('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (s) {
        setStats(s);
        setNeedsPinUnlock(false);
      }
      if (a?.assessments) {
        setAllAssessments(a.assessments);
      }
      if (u?.users) {
        setUsersList(u.users);
      }
    } catch (err: any) {
      if (err.message && (err.message.includes('PIN') || err.message.includes('credentials') || err.message.includes('verification'))) {
        setNeedsPinUnlock(true);
      }
      console.error('Admin data fetch error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [token]);

  const handleVerifyPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');
    if (!pinInput.trim()) {
      setPinError('Please enter the 6-digit Master PIN.');
      return;
    }

    setIsVerifyingPin(true);
    try {
      const data = await apiFetch<{ valid: boolean; user?: User; token?: string; error?: string }>(
        '/api/auth/verify-admin-pin',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ pin: pinInput.trim() }),
        }
      );

      if (!data.valid) {
        throw new Error(data.error || 'PIN verification rejected by server');
      }

      if (data.user && data.token) {
        onUpdateUser(data.user, data.token);
      } else if (data.token) {
        onUpdateUser({ ...user, role: 'admin', adminVerified: true }, data.token);
      }
      setNeedsPinUnlock(false);
      setPinInput('');
    } catch (err: any) {
      setPinError(err.message || 'Security PIN rejected by server.');
    } finally {
      setIsVerifyingPin(false);
    }
  };

  const handleUserUpdatedSuccess = (updatedUser: User, newToken?: string) => {
    // If updating currently logged in admin
    if (updatedUser.id === user.id) {
      onUpdateUser(updatedUser, newToken);
    }
    // Update usersList in table
    setUsersList((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    setEditProfileOpen(false);
    setEditingTargetUser(null);
  };

  const handleDeleteUser = async (targetUser: User) => {
    if (targetUser.id === user.id) {
      alert('You cannot delete your own admin account while logged in.');
      return;
    }
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete the user account "${targetUser.name}" (${targetUser.email}) and all associated records?`
    );
    if (!confirmed) return;

    try {
      await apiFetch(`/api/admin/users/${targetUser.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsersList((prev) => prev.filter((u) => u.id !== targetUser.id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete user account');
    }
  };

  const handleRetrain = async () => {
    setIsRetraining(true);
    setRetrainMessage('');
    try {
      const data = await apiFetch<{ metrics?: any }>('/api/admin/retrain', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      setRetrainMessage('Model retrained and re-calibrated successfully!');
      if (stats && data?.metrics) {
        setStats({ ...stats, modelMetrics: data.metrics });
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
            <span className="text-xs px-2 py-0.5 bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 rounded-md font-bold">
              Admin Access
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
            Risk Model Operations & Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            System health, environmental risk telemetry, Scikit-learn model parameters, and global audit logs.
          </p>
        </div>

        <button
          onClick={fetchAdminData}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Analytics</span>
        </button>
      </div>

      {/* Server-Side PIN Verification Gate */}
      {needsPinUnlock && (
        <div id="admin-pin-required-gate" className="bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-400 dark:border-amber-700/80 rounded-2xl p-6 sm:p-8 space-y-5 shadow-lg animate-in fade-in duration-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <KeyRound className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                  Server Security Verification Required
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 text-xs font-black uppercase tracking-wider">
                  Admin Verification
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
                Administrative endpoints are protected by the server. To view system metrics, ML parameters, and registered users, enter your authorized security PIN. This check is validated server-side.
              </p>
            </div>
          </div>

          {pinError && (
            <div className="p-3.5 bg-rose-100 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-900 text-rose-800 dark:text-rose-200 rounded-xl text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{pinError}</span>
            </div>
          )}

          <form onSubmit={handleVerifyPinSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
            <div className="relative flex-1 max-w-sm">
              <input
                type="password"
                maxLength={12}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Enter Admin Security PIN"
                className="w-full px-4 py-2.5 text-sm font-mono tracking-wider bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>
            <button
              type="submit"
              disabled={isVerifyingPin}
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold rounded-xl text-xs shadow-md shadow-amber-600/20 transition-all disabled:opacity-60 flex items-center justify-center gap-1.5"
            >
              {isVerifyingPin ? 'Verifying on Server...' : 'Verify PIN & Unlock'}
            </button>
          </form>
        </div>
      )}

      {/* Admin Profile & Account Control Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-5 sm:p-6 text-white shadow-lg border border-slate-700/70 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-600 to-rose-400 text-white flex items-center justify-center font-black text-2xl shadow-md border-2 border-white/20 shrink-0">
            {user.name.charAt(0)}
          </div>
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-white truncate">{user.name}</h2>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-rose-400" />
                <span>Super Administrator</span>
              </span>
            </div>
            <p className="text-xs text-slate-300 flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{user.email}</span>
              </span>
              <span className="text-slate-500 hidden sm:inline">•</span>
              <span className="text-slate-400">
                Account ID: <code className="text-rose-300 font-mono text-[11px] bg-slate-950/40 px-1.5 py-0.5 rounded">{user.id}</code>
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            id="admin-edit-profile-btn"
            type="button"
            onClick={() => {
              setEditingTargetUser(user);
              setEditProfileOpen(true);
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold rounded-xl shadow-md text-xs transition-all ring-2 ring-rose-400/30"
          >
            <UserCog className="w-4 h-4" />
            <span>Edit Admin Profile / Change Name</span>
          </button>
        </div>
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

          {/* System Registered User Accounts Management */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-rose-600" />
                  <span>Registered System Users & Account Directory</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Manage accounts, edit account display names, update credentials, and verify security roles.
                </p>
              </div>
              <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg font-medium self-start sm:self-auto">
                {usersList.length} Accounts Registered
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3">Account Name</th>
                    <th className="px-6 py-3">Email Address</th>
                    <th className="px-6 py-3">Role / Authority</th>
                    <th className="px-6 py-3">Account ID</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {usersList.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80">
                      <td className="px-6 py-3.5 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                            {u.name.charAt(0)}
                          </div>
                          <span>{u.name}</span>
                          {u.id === user.id && (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                              (Current You)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-3.5 font-mono text-slate-700">{u.email}</td>
                      <td className="px-6 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            u.role === 'admin'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 font-mono text-slate-400 text-[11px]">{u.id}</td>
                      <td className="px-6 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setEditingTargetUser(u);
                              setEditProfileOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors text-xs"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                          {u.id !== user.id && (
                            <button
                              onClick={() => handleDeleteUser(u)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-lg transition-colors text-xs"
                              title="Delete User Account"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Delete</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Edit Profile Modal */}
      {editingTargetUser && (
        <EditProfileModal
          user={user}
          targetUser={editingTargetUser}
          token={token}
          isOpen={editProfileOpen}
          onClose={() => {
            setEditProfileOpen(false);
            setEditingTargetUser(null);
          }}
          onUserUpdated={handleUserUpdatedSuccess}
        />
      )}
    </div>
  );
};
