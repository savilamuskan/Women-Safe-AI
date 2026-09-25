/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Shield,
  Lock,
  Mail,
  User as UserIcon,
  X,
  AlertCircle,
  Sparkles,
  Eye,
  EyeOff,
  CheckCircle2,
  RefreshCw,
  ArrowLeft,
  MailCheck,
} from 'lucide-react';
import { User } from '../types.ts';
import { apiFetch } from '../utils/api.ts';

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
  const [tab, setTab] = useState<'login' | 'register' | 'verify'>(initialTab);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  // Email Verification States
  const [verificationEmail, setVerificationEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [devCode, setDevCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    let timer: any;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    setIsLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();
    const cleanName = name.trim();

    if (tab === 'register') {
      if (!cleanName) {
        setError('Please enter your full name.');
        setIsLoading(false);
        return;
      }
      if (cleanPassword.length < 6) {
        setError('Password must be at least 6 characters long.');
        setIsLoading(false);
        return;
      }
    }

    const endpoint = tab === 'login' ? '/api/auth/login' : '/api/auth/register';
    const payload = tab === 'login'
      ? { email: cleanEmail, password: cleanPassword }
      : { name: cleanName, email: cleanEmail, password: cleanPassword };

    try {
      const data = await apiFetch<{
        user: User;
        token?: string;
        message?: string;
        requiresVerification?: boolean;
        email?: string;
        devVerificationCode?: string;
      }>(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      // If registration requires email verification
      if (data.requiresVerification) {
        setVerificationEmail(cleanEmail);
        setDevCode(data.devVerificationCode || '');
        setTab('verify');
        setOtpCode('');
        setResendCooldown(30);
        setInfoMessage('Verification code generated. Please verify your email to activate your account.');
        return;
      }

      if (data.token) {
        onAuthSuccess(data.user, data.token);
      }
    } catch (err: any) {
      if (err?.requiresVerification) {
        setVerificationEmail(err.email || cleanEmail);
        setDevCode(err.devVerificationCode || '');
        setTab('verify');
        setOtpCode('');
        setResendCooldown(30);
        setError('Please verify your email address before signing in.');
        return;
      }
      setError(err.message || 'An error occurred during authentication');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    setIsLoading(true);

    const cleanCode = otpCode.trim();
    if (!cleanCode || cleanCode.length < 6) {
      setError('Please enter the full 6-digit verification code.');
      setIsLoading(false);
      return;
    }

    try {
      const data = await apiFetch<{ user: User; token: string; message: string }>('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: verificationEmail, code: cleanCode }),
      });

      onAuthSuccess(data.user, data.token);
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please check the code and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0 || !verificationEmail) return;
    setError('');
    setInfoMessage('');
    setIsLoading(true);

    try {
      const data = await apiFetch<{ message: string; devVerificationCode?: string }>(
        '/api/auth/resend-verification',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: verificationEmail }),
        }
      );

      if (data.devVerificationCode) {
        setDevCode(data.devVerificationCode);
      }
      setResendCooldown(30);
      setInfoMessage('A fresh verification code has been dispatched.');
    } catch (err: any) {
      setError(err.message || 'Failed to resend code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillDemoUser = () => {
    setError('');
    setInfoMessage('');
    setTab('login');
    setEmail('user@womensafe.ai');
    setPassword('password123');
  };

  const handleFillDemoAdmin = () => {
    setError('');
    setInfoMessage('');
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
              {tab === 'verify' ? <MailCheck className="w-5 h-5 text-rose-600" /> : <Shield className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <span>WomenSafe AI</span>
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {tab === 'verify'
                  ? 'Email Verification Required'
                  : tab === 'login'
                  ? 'Sign In to access your safety dashboard'
                  : 'Create a secure new account'}
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

        {/* Tab Switcher (Visible only when not in verify state) */}
        {tab !== 'verify' ? (
          <div className="grid grid-cols-2 mx-6 mt-4 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setTab('login');
                setError('');
                setInfoMessage('');
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
                setInfoMessage('');
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
        ) : (
          <div className="px-6 pt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setTab('register');
                setError('');
                setInfoMessage('');
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Register</span>
            </button>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60">
              Step 2 of 2
            </span>
          </div>
        )}

        {/* Form Body */}
        <div className="p-6 space-y-4">
          {infoMessage && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>{infoMessage}</span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 rounded-xl text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                <span>{error}</span>
              </div>
              {error.toLowerCase().includes('already exists') && tab === 'register' && (
                <button
                  type="button"
                  onClick={() => {
                    setTab('login');
                    setError('');
                    setInfoMessage('');
                  }}
                  className="text-xs font-bold text-rose-700 dark:text-rose-400 hover:underline shrink-0"
                >
                  Sign In &rarr;
                </button>
              )}
            </div>
          )}

          {tab === 'verify' ? (
            /* Email Verification Form Step */
            <form onSubmit={handleVerifyEmail} className="space-y-4">
              <div className="text-center space-y-1.5 pb-1">
                <div className="w-12 h-12 mx-auto rounded-full bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40">
                  <MailCheck className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Verify Your Email Address</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  A 6-digit confirmation code was sent to:
                </p>
                <div className="inline-block px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-md font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                  {verificationEmail}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 text-center">
                  Enter 6-Digit Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="• • • • • •"
                  autoFocus
                  required
                  className="w-full text-center text-2xl font-mono tracking-[0.35em] font-bold py-2.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 focus:bg-white dark:focus:bg-slate-900"
                />
              </div>

              {/* Dev / Sandbox Auto-Fill Helper */}
              {devCode && (
                <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl flex items-center justify-between text-xs">
                  <span className="text-[11px] text-amber-800 dark:text-amber-300">
                    Preview Code: <strong className="font-mono text-xs">{devCode}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => setOtpCode(devCode)}
                    className="text-[11px] font-bold text-amber-900 dark:text-amber-200 bg-amber-200/60 dark:bg-amber-800/60 px-2 py-0.5 rounded-md hover:bg-amber-300/60 transition-colors"
                  >
                    Auto-Fill
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || otpCode.length < 6}
                className="w-full py-2.5 rounded-xl font-bold text-xs shadow-md active:scale-98 transition-all disabled:opacity-60 text-white bg-rose-600 hover:bg-rose-700 shadow-rose-600/20"
              >
                {isLoading ? 'Verifying Code...' : 'Verify & Activate Account'}
              </button>

              <div className="pt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={isLoading || resendCooldown > 0}
                  className="inline-flex items-center gap-1 font-semibold text-rose-600 dark:text-rose-400 hover:underline disabled:opacity-50 disabled:no-underline"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>
                    {resendCooldown > 0 ? `Resend Code in ${resendCooldown}s` : 'Resend Code'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTab('login');
                    setError('');
                    setInfoMessage('');
                  }}
                  className="font-semibold hover:text-slate-700 dark:hover:text-slate-200 hover:underline"
                >
                  Switch to Sign In
                </button>
              </div>
            </form>
          ) : (
            /* Sign In and Register Forms */
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
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    required
                    minLength={6}
                    className="w-full pl-9 pr-10 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:bg-white dark:focus:bg-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
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
                  : 'Continue to Email Verification'}
              </button>
            </form>
          )}

          {/* Quick Fill Testing Credentials for Standard User & Admin (Only on login tab) */}
          {tab === 'login' && (
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
          )}
        </div>
      </div>
    </div>
  );
};
