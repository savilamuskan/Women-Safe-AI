/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Shield, AlertTriangle, User as UserIcon, LogOut, LayoutDashboard, ShieldCheck, Menu, X } from 'lucide-react';
import { User } from '../types.ts';

interface NavbarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  user: User | null;
  onOpenAuth: (initialTab?: 'login' | 'register') => void;
  onLogout: () => void;
  onOpenEmergency: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  user,
  onOpenAuth,
  onLogout,
  onOpenEmergency,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navLinks = [
    { id: 'landing', label: 'Home' },
    { id: 'assess', label: 'Check Safety Risk' },
    { id: 'how-it-works', label: 'How It Works' },
    { id: 'guidelines', label: 'Safety Guidelines' },
    { id: 'privacy', label: 'Privacy & Ethics' },
  ];

  if (user) {
    navLinks.push({ id: 'dashboard', label: 'My Dashboard' });
    if (user.role === 'admin') {
      navLinks.push({ id: 'admin', label: 'Admin Portal' });
    }
  }

  const handleNavClick = (viewId: string) => {
    setCurrentView(viewId);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header id="site-header" className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div
            id="brand-logo-button"
            onClick={() => handleNavClick('landing')}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-rose-500 flex items-center justify-center text-white shadow-md shadow-rose-500/20 group-hover:scale-105 transition-transform">
              <Shield className="w-5 h-5 fill-white/20" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg tracking-tight text-slate-900">WomenSafe</span>
                <span className="text-xs font-semibold px-1.5 py-0.5 bg-rose-100 text-rose-700 rounded-md">AI</span>
              </div>
              <p className="text-[10px] text-slate-500 tracking-wider uppercase font-medium">Risk Predictor</p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => (
              <button
                key={link.id}
                id={`nav-${link.id}`}
                onClick={() => handleNavClick(link.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  currentView === link.id
                    ? 'text-rose-600 bg-rose-50 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Right Action Items */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Emergency SOS button */}
            <button
              id="emergency-sos-button"
              type="button"
              onClick={onOpenEmergency}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-600 text-white hover:bg-rose-700 active:scale-95 text-xs sm:text-sm font-bold shadow-md shadow-rose-600/30 transition-all animate-pulse"
              title="Immediate Emergency Assistance & Alarm"
            >
              <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span>SOS Alert</span>
            </button>

            {/* Auth section */}
            {user ? (
              <div className="flex items-center gap-2">
                <button
                  id="user-profile-button"
                  onClick={() => handleNavClick('dashboard')}
                  className="hidden sm:flex items-center gap-2 pl-2 pr-3 py-1 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50 transition-colors text-left"
                >
                  <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-xs font-bold">
                    {user.name.charAt(0)}
                  </div>
                  <div className="text-xs">
                    <p className="font-semibold text-slate-800 leading-tight truncate max-w-[100px]">{user.name}</p>
                    <p className="text-[10px] text-slate-500 capitalize">{user.role}</p>
                  </div>
                </button>

                <button
                  id="user-logout-button"
                  onClick={onLogout}
                  className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Log out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  id="nav-login-button"
                  onClick={() => onOpenAuth('login')}
                  className="px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Sign In
                </button>
                <button
                  id="nav-register-button"
                  onClick={() => onOpenAuth('register')}
                  className="hidden sm:inline-flex px-3.5 py-1.5 text-xs sm:text-sm font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 shadow-sm transition-all"
                >
                  Get Started
                </button>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              id="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 space-y-1 shadow-lg">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => handleNavClick(link.id)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                currentView === link.id
                  ? 'text-rose-600 bg-rose-50 font-semibold'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              {link.label}
            </button>
          ))}
          {!user && (
            <div className="pt-2 border-t border-slate-100 flex gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth('login');
                }}
                className="flex-1 py-2 text-center text-sm font-medium text-slate-700 border border-slate-200 rounded-lg"
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth('register');
                }}
                className="flex-1 py-2 text-center text-sm font-medium bg-rose-600 text-white rounded-lg"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
