/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, User as UserIcon, Mail, Lock, Shield, Check, AlertCircle, Save } from 'lucide-react';
import { User } from '../types.ts';

interface EditProfileModalProps {
  user: User;
  targetUser?: User | null;
  token: string | null;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated: (updatedUser: User, newToken?: string) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  user,
  targetUser,
  token,
  isOpen,
  onClose,
  onUserUpdated,
}) => {
  const activeUser = targetUser || user;
  const isSelf = activeUser.id === user.id;

  const [name, setName] = useState(activeUser.name);
  const [email, setEmail] = useState(activeUser.email);
  const [role, setRole] = useState<'user' | 'admin'>(activeUser.role);
  const [password, setPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setName(activeUser.name);
      setEmail(activeUser.email);
      setRole(activeUser.role);
      setPassword('');
      setError(null);
      setSuccess(null);
    }
  }, [activeUser, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name.trim()) {
      setError('Please provide a valid name');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid email address');
      return;
    }

    if (password && password.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    setIsSaving(true);
    try {
      const url = isSelf ? '/api/auth/profile' : `/api/admin/users/${activeUser.id}`;
      const res = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          role: !isSelf ? role : undefined,
          password: password ? password : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      setSuccess('Account profile updated successfully!');
      onUserUpdated(data.user, data.token);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Network error while updating profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      id="edit-profile-modal-overlay"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
    >
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-600/30 text-rose-400 flex items-center justify-center">
              <UserIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm">Edit {user.role === 'admin' ? 'Admin' : 'User'} Profile</h2>
              <p className="text-[11px] text-slate-400">Change account name, email address, or password</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{success}</span>
            </div>
          )}

          {/* Account Role Info Badge */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-rose-600" />
              <span className="text-slate-700 font-medium">Account Authority:</span>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                user.role === 'admin'
                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                  : 'bg-blue-100 text-blue-800 border border-blue-200'
              }`}
            >
              {user.role === 'admin' ? 'System Administrator' : 'Standard User'}
            </span>
          </div>

          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-800 flex items-center justify-between">
              <span>Account Name</span>
              <span className="text-[10px] text-slate-400 font-normal">Displayed on dashboards</span>
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter full name"
                required
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium text-xs focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-800 flex items-center justify-between">
              <span>Email Address</span>
              <span className="text-[10px] text-slate-400 font-normal">Used for authentication</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@womensafe.ai"
                required
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium text-xs focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
              />
            </div>
          </div>

          {/* Password (Optional update) */}
          <div className="space-y-1.5 pt-1">
            <label className="font-bold text-slate-800 flex items-center justify-between">
              <span>New Password (Optional)</span>
              <span className="text-[10px] text-slate-400 font-normal">Leave blank to keep unchanged</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium text-xs focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 font-semibold rounded-xl hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
