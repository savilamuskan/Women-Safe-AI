/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Shield,
  Search,
  Filter,
  Trash2,
  ExternalLink,
  Plus,
  Calendar,
  Clock,
  MapPin,
  TrendingDown,
  AlertTriangle,
  RefreshCw,
  UserCog,
  ShieldAlert,
} from 'lucide-react';
import { AssessmentRecord, User } from '../types.ts';

interface UserDashboardProps {
  user: User;
  token: string | null;
  onNewAssessment: () => void;
  onSelectRecord: (record: AssessmentRecord) => void;
  onOpenEditProfile?: () => void;
  onOpenAdminPin?: () => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
  user,
  token,
  onNewAssessment,
  onSelectRecord,
  onOpenEditProfile,
  onOpenAdminPin,
}) => {
  const [records, setRecords] = useState<AssessmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/risk/history', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error('Failed to load assessment history');
      const data = await res.json();
      setRecords(data.records || []);
    } catch (err: any) {
      setError(err.message || 'Could not connect to database service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [token]);

  const handleDelete = async (e: React.MouseEvent, recordId: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this assessment record?')) return;

    setDeletingId(recordId);
    try {
      const res = await fetch(`/api/risk/${recordId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error('Failed to delete record');
      setRecords(records.filter((r) => r.id !== recordId));
    } catch (err: any) {
      alert(err.message || 'Could not delete assessment');
    } finally {
      setDeletingId(null);
    }
  };

  // Filter and search
  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      r.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.area_type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = filterLevel === 'all' || r.risk_level.toLowerCase() === filterLevel.toLowerCase();
    return matchesSearch && matchesLevel;
  });

  // Calculate user stats
  const totalCount = records.length;
  const avgRisk = totalCount > 0 ? Math.round(records.reduce((acc, r) => acc + r.risk_score, 0) / totalCount) : 0;
  const highRiskCount = records.filter((r) => r.risk_level === 'High').length;
  const safestRecord = records.length > 0 ? [...records].sort((a, b) => a.risk_score - b.risk_score)[0] : null;

  return (
    <div id="user-dashboard-view" className="max-w-6xl mx-auto px-4 py-8 sm:py-12 space-y-8">
      {/* Top Header & Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">User Dashboard</span>
            <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-medium">
              Role: {user.role}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Welcome back, {user.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Review your historical environmental risk assessments and safety evaluations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenAdminPin && (
            <button
              onClick={onOpenAdminPin}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 rounded-xl text-xs sm:text-sm font-semibold transition-colors shadow-xs"
              title="Access Admin Portal"
            >
              <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Admin Portal</span>
            </button>
          )}
          {onOpenEditProfile && (
            <button
              onClick={onOpenEditProfile}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs sm:text-sm font-semibold transition-colors shadow-xs"
              title="Edit Profile & Account Name"
            >
              <UserCog className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">Edit Profile</span>
            </button>
          )}
          <button
            onClick={fetchHistory}
            className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors shadow-xs"
            title="Refresh records"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onNewAssessment}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-rose-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Assessment</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-xs text-slate-500 font-medium">Total Evaluations</span>
          <p className="text-2xl font-black text-slate-900">{totalCount}</p>
          <span className="text-[11px] text-slate-400">Personal logged checks</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-xs text-slate-500 font-medium">Average Risk Index</span>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black text-slate-900">{avgRisk}</p>
            <span className="text-xs text-slate-400">/ 100</span>
          </div>
          <span className="text-[11px] text-slate-400">Overall corridor vulnerability</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-xs text-slate-500 font-medium">High Risk Alerts</span>
          <p className="text-2xl font-black text-rose-600">{highRiskCount}</p>
          <span className="text-[11px] text-rose-700 font-medium">Corridors needing caution</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-xs text-slate-500 font-medium">Safest Route Found</span>
          <p className="text-base font-bold text-emerald-700 truncate">
            {safestRecord ? `${safestRecord.location} (${safestRecord.risk_score} pts)` : 'None recorded yet'}
          </p>
          <span className="text-[11px] text-emerald-600 font-medium">Optimal environmental safety</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by location or zoning..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-xs text-slate-500 font-medium shrink-0">Level:</span>
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500"
          >
            <option value="all">All Levels</option>
            <option value="low">Low Risk Only</option>
            <option value="medium">Medium Risk Only</option>
            <option value="high">High Risk Only</option>
          </select>
        </div>
      </div>

      {/* History Records Table / Cards */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-sm text-slate-900">Assessment History ({filteredRecords.length})</h2>
          <span className="text-xs text-slate-500">Click any row to view full explainable report</span>
        </div>

        {loading ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-6 h-6 border-2 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500">Loading saved assessments from database...</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Shield className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-800">No assessment records found</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Run your first environmental risk check to see it recorded here with full SHAP attribution and recommendations.
            </p>
            <button
              onClick={onNewAssessment}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 text-white rounded-lg text-xs font-bold shadow-xs hover:bg-rose-700"
            >
              Start New Assessment
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredRecords.map((item) => {
              const isHigh = item.risk_level === 'High';
              const isMed = item.risk_level === 'Medium';
              const badgeClass = isHigh
                ? 'bg-rose-100 text-rose-800 border-rose-200'
                : isMed
                ? 'bg-amber-100 text-amber-800 border-amber-200'
                : 'bg-emerald-100 text-emerald-800 border-emerald-200';

              return (
                <div
                  key={item.id}
                  onClick={() => onSelectRecord(item)}
                  className="p-4 sm:p-5 hover:bg-slate-50/80 cursor-pointer transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${badgeClass}`}>
                        {item.risk_level} Risk ({item.risk_score}/100)
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{item.date}</span>
                        <span>•</span>
                        <Clock className="w-3 h-3" />
                        <span>{item.time}</span>
                      </span>
                    </div>

                    <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{item.location}</span>
                    </p>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                      <span className="px-1.5 py-0.5 bg-slate-100 rounded capitalize">{item.area_type.replace('_', ' ')}</span>
                      <span>•</span>
                      <span className="capitalize">{item.lighting_condition.replace('_', ' ')} Lighting</span>
                      <span>•</span>
                      <span className="capitalize">{item.crowd_level} Crowd</span>
                      <span>•</span>
                      <span className="capitalize">{(item.travel_mode || 'walking').replace('_', ' ')}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, item.id)}
                      disabled={deletingId === item.id}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete assessment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-semibold text-rose-600 flex items-center gap-1 hover:underline">
                      <span>View Details</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
