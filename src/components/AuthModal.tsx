/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Shield, Lock, Mail, User as UserIcon, X, AlertCircle, Sparkles } from 'lucide-react';
import { User } from '../types.ts';

interface AuthModalProps {
  initialTab?: 'login' | 'register';
  onClose: () => void;
  onAuthSuccess: (user: User, token: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  initialTab = 'login',
  onClose,
  onAuthSuccess,
}) => {
  const [tab, setTab] = useState<'login' | 'register'>(initialTab);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const endpoint = tab === 'login' ? '/api/auth/login' : '/api/auth/register';
    const payload = tab === 'login'
      ? { email: email.trim().toLowerCase(), password }
      : { name: name.trim(), email: email.trim().toLowerCase(), password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      onAuthSuccess(data.user, data.token);
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillDemoUser = () => {
    setError('');
    setTab('login');
    setEmail('user@womensafe.ai');
    setPassword('password123');
  };

  const handleFillDemoAdmin = () => {
    setError('');
    setTab('login');
    setEmail('admin@womensafe.ai');
    setPassword('password123');
  };

  return (
    <div id="auth-modal" className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200 transition-colors">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-xs bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <span>WomenSafe AI</span>
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {tab === 'login' ? 'Sign In to access your safety dashboard' : 'Create a secure new account'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher (Sign In vs Register) */}
        <div className="grid grid-cols-2 mx-6 mt-4 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setError('');
            }}
            className={`py-2 rounded-lg transition-all ${
              tab === 'login'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('register');
              setError('');
            }}
            className={`py-2 rounded-lg transition-all ${
              tab === 'register'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {tab === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ayesha Khan"
                    required
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:bg-white dark:focus:bg-slate-900"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:bg-white dark:focus:bg-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:bg-white dark:focus:bg-slate-900"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl font-bold text-xs shadow-md active:scale-98 transition-all disabled:opacity-60 mt-2 text-white bg-rose-600 hover:bg-rose-700 shadow-rose-600/20"
            >
              {isLoading
                ? 'Authenticating...'
                : tab === 'login'
                ? 'Sign In'
                : 'Create Account'}
            </button>
          </form>

          {/* Quick Fill Testing Credentials for Standard User & Admin */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span className="font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-rose-500" />
                <span>Quick Demo Accounts:</span>
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleFillDemoUser}
                className="p-2.5 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-left transition-colors flex flex-col justify-between"
              >
                <div className="flex items-center justify-between w-full mb-0.5">
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">Standard User</span>
                  <span className="text-[9px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Fill</span>
                </div>
                <span className="text-slate-500 dark:text-slate-400 text-[10px] truncate">user@womensafe.ai</span>
              </button>
              <button
                type="button"
                onClick={handleFillDemoAdmin}
                className="p-2.5 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-left transition-colors flex flex-col justify-between"
              >
                <div className="flex items-center justify-between w-full mb-0.5">
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">Admin User</span>
                  <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Fill</span>
                </div>
                <span className="text-slate-500 dark:text-slate-400 text-[10px] truncate">admin@womensafe.ai</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
