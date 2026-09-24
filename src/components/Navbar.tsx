/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Shield, AlertTriangle, User as UserIcon, LogOut, LayoutDashboard, ShieldCheck, Menu, X, UserCog, Sun, Moon, Lock } from 'lucide-react';
import { User } from '../types.ts';
import { useTheme } from '../context/ThemeContext.tsx';

interface NavbarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  user: User | null;
  onOpenAuth: (initialTab?: 'login' | 'register') => void;
  onLogout: () => void;
  onOpenEmergency: () => void;
  onOpenEditProfile?: () => void;
  onOpenAdminPin?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  user,
  onOpenAuth,
  onLogout,
  onOpenEmergency,
  onOpenEditProfile,
  onOpenAdminPin,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const { theme, toggleTheme } = useTheme();

  const navLinks: Array<{ id: string; label: string; isLocked?: boolean }> = [
    { id: 'landing', label: 'Home' },
    { id: 'assess', label: 'Check Safety Risk' },
    { id: 'how-it-works', label: 'How It Works' },
    { id: 'guidelines', label: 'Safety Guidelines' },
    { id: 'privacy', label: 'Privacy & Ethics' },
  ];

  if (user) {
    navLinks.push({ id: 'dashboard', label: 'My Dashboard' });
    if (user.role === 'admin') {
      navLinks.push({
        id: 'admin',
        label: user.adminVerified ? 'Admin Portal' : 'Admin Portal (PIN)',
        isLocked: !user.adminVerified,
      });
    } else {
      navLinks.push({ id: 'admin-gate', label: 'Admin Portal', isLocked: true });
    }
  } else {
    navLinks.push({ id: 'admin-gate', label: 'Admin Portal', isLocked: true });
  }

  const handleNavClick = (viewId: string) => {
    if (viewId === 'admin-gate') {
      if (!user) {
        onOpenAuth('login');
      } else {
        onOpenAdminPin?.();
      }
      setMobileMenuOpen(false);
      return;
    }
    if (viewId === 'admin') {
      if (!user) {
        onOpenAuth('login');
        return;
      }
      if (!user.adminVerified) {
        onOpenAdminPin?.();
        return;
      }
    }
    setCurrentView(viewId);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header id="site-header" className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors duration-200">
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
                <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">WomenSafe</span>
                <span className="text-xs font-semibold px-1.5 py-0.5 bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 rounded-md">AI</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 tracking-wider uppercase font-medium">Risk Predictor</p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => (
              <button
                key={link.id}
                id={`nav-${link.id}`}
                onClick={() => handleNavClick(link.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all inline-flex items-center gap-1.5 ${
                  currentView === link.id
                    ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800'
                }`}
              >
                <span>{link.label}</span>
                {(link as any).isLocked && (
                  <Lock className="w-3 h-3 text-amber-500 shrink-0" />
                )}
              </button>
            ))}
          </nav>

          {/* Right Action Items */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle Button */}
            <button
              id="nav-theme-toggle-btn"
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors"
              title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
              aria-label="Toggle theme mode"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>

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
                  onClick={() => handleNavClick(user.role === 'admin' ? 'admin' : 'dashboard')}
                  className="hidden sm:flex items-center gap-2 pl-2 pr-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50 dark:bg-slate-800/80 transition-colors text-left"
                >
                  <div className="w-6 h-6 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 flex items-center justify-center text-xs font-bold">
                    {user.name.charAt(0)}
                  </div>
                  <div className="text-xs">
                    <p className="font-semibold text-slate-800 dark:text-slate-100 leading-tight truncate max-w-[120px]">{user.name}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">{user.role}</p>
                  </div>
                </button>

                {onOpenEditProfile && (
                  <button
                    id="nav-edit-profile-btn"
                    onClick={onOpenEditProfile}
                    className="p-2 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                    title="Edit Account Name & Profile"
                  >
                    <UserCog className="w-4 h-4" />
                  </button>
                )}

                <button
                  id="user-logout-button"
                  onClick={onLogout}
                  className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
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
                  className="px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Sign In
                </button>
                <button
                  id="nav-register-button"
                  onClick={() => onOpenAuth('register')}
                  className="px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-white bg-slate-900 dark:bg-rose-600 hover:bg-slate-800 dark:hover:bg-rose-700 rounded-lg shadow-xs transition-all"
                >
                  Sign Up
                </button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              id="mobile-menu-toggle"
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 space-y-1 shadow-xl">
          {/* Mobile Theme Switcher */}
          <div className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-800/60 rounded-lg mb-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Theme Mode</span>
            <button
              onClick={toggleTheme}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-100 shadow-2xs"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Dark</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-slate-600" />
                  <span>Light</span>
                </>
              )}
            </button>
          </div>

          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => handleNavClick(link.id)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium flex items-center justify-between ${
                currentView === link.id
                  ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 font-semibold'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <span>{link.label}</span>
              {(link as any).isLocked && (
                <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              )}
            </button>
          ))}

          {!user ? (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth('login');
                }}
                className="flex-1 py-2 text-center text-sm font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg"
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
          ) : (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 flex items-center justify-center text-xs font-bold">
                  {user.name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-100 text-xs">{user.name}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">{user.role} • {user.email}</p>
                </div>
              </div>
              {onOpenEditProfile && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenEditProfile();
                  }}
                  className="px-2.5 py-1 bg-rose-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs"
                >
                  <UserCog className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </header>
  );
};
