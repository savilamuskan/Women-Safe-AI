/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldAlert, KeyRound, CheckCircle2, AlertCircle, X, Lock, ArrowRight } from 'lucide-react';
import { User } from '../types.ts';
import { apiFetch } from '../utils/api.ts';

interface AdminPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string | null;
  user: User | null;
  onSuccess: (updatedUser: User, newToken: string) => void;
}

export const AdminPinModal: React.FC<AdminPinModalProps> = ({
  isOpen,
  onClose,
  token,
  user,
  onSuccess,
}) => {
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!pin.trim()) {
      setError('Please enter the Admin Security PIN.');
      return;
    }

    setIsLoading(true);

    try {
      const data = await apiFetch<{ valid: boolean; user?: User; token?: string; error?: string }>(
        '/api/auth/verify-admin-pin',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ pin: pin.trim() }),
        }
      );

      if (!data.valid) {
        throw new Error(data.error || 'Invalid admin credentials.');
      }

      setSuccessMsg('Admin credentials verified. Access granted.');

      setTimeout(() => {
        if (data.user && data.token) {
          onSuccess(data.user, data.token);
        } else if (user && data.token) {
          onSuccess({ ...user, role: 'admin', adminVerified: true }, data.token);
        } else if (user) {
          onSuccess({ ...user, role: 'admin', adminVerified: true }, token || '');
        }
        onClose();
      }, 500);
    } catch (err: any) {
      setError(err.message || 'Invalid admin credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      id="admin-pin-modal"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 w-full max-w-md rounded-2xl shadow-2xl border-2 border-amber-500/80 overflow-hidden animate-in fade-in zoom-in-95 duration-200 transition-colors">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-600 via-amber-700 to-amber-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white shadow-inner">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm leading-tight flex items-center gap-1.5">
                <span>Admin Dashboard Verification</span>
              </h2>
              <p className="text-[11px] text-amber-100 font-medium">
                Server-Side Security Verification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          <div className="p-3.5 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl flex items-start gap-3">
            <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-bold text-amber-950 dark:text-amber-200">
                Authorized Personnel Only
              </p>
              <p className="text-amber-800 dark:text-amber-300 leading-relaxed">
                To access system telemetry, model retraining, and account administration, enter your authorized administrative security PIN. This verification is securely evaluated server-side.
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5 text-xs">
                <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Admin Security PIN</span>
                </label>
              </div>

              <div className="relative">
                <input
                  id="admin-pin-input"
                  type="password"
                  maxLength={12}
                  autoFocus
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Enter Admin Security PIN"
                  required
                  className="w-full px-4 py-3 text-center text-lg font-mono tracking-widest bg-slate-50 dark:bg-slate-800 border-2 border-amber-300 dark:border-amber-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden transition-all"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>

              <button
                id="submit-admin-pin-btn"
                type="submit"
                disabled={isLoading}
                className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/20 active:scale-98 transition-all disabled:opacity-60 flex items-center justify-center gap-1.5"
              >
                {isLoading ? (
                  <span>Verifying Server...</span>
                ) : (
                  <>
                    <span>Verify PIN & Access</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>

          <p className="text-[10px] text-center text-slate-400 dark:text-slate-500">
            Cryptographic server validation is enforced for all dashboard API routes.
          </p>
        </div>
      </div>
    </div>
  );
};
