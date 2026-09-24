/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { Hero } from './components/Hero.tsx';
import { FeaturesSection } from './components/FeaturesSection.tsx';
import { HowItWorks } from './components/HowItWorks.tsx';
import { SafetyGuidelines } from './components/SafetyGuidelines.tsx';
import { PrivacyInfo } from './components/PrivacyInfo.tsx';
import { AssessmentForm } from './components/AssessmentForm.tsx';
import { RiskResultModal } from './components/RiskResultModal.tsx';
import { UserDashboard } from './components/UserDashboard.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { EmergencyModal } from './components/EmergencyModal.tsx';
import { EditProfileModal } from './components/EditProfileModal.tsx';
import { Footer } from './components/Footer.tsx';
import { AdminPinModal } from './components/AdminPinModal.tsx';
import { User, RiskResult, AssessmentRecord } from './types.ts';
import { ThemeProvider } from './context/ThemeContext.tsx';

export default function App() {
  const [currentView, setCurrentView] = useState<string>('landing');
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Modals state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authInitialTab, setAuthInitialTab] = useState<'login' | 'register'>('login');
  const [adminPinModalOpen, setAdminPinModalOpen] = useState(false);
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);
  const [editProfileModalOpen, setEditProfileModalOpen] = useState(false);
  const [activeRiskResult, setActiveRiskResult] = useState<RiskResult | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Show Toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Restore session from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('womensafe_jwt');
    const savedUser = localStorage.getItem('womensafe_user');
    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        try {
          const payload = JSON.parse(atob(savedToken.split('.')[1]));
          if (payload.adminVerified) {
            parsedUser.adminVerified = true;
          }
        } catch {}
        setToken(savedToken);
        setUser(parsedUser);
      } catch {
        localStorage.removeItem('womensafe_jwt');
        localStorage.removeItem('womensafe_user');
      }
    }
  }, []);

  const handleOpenAuth = (tab: 'login' | 'register' = 'login') => {
    setAuthInitialTab(tab);
    setAuthModalOpen(true);
  };

  const handleOpenAdminPin = () => {
    if (!user) {
      handleOpenAuth('login');
      return;
    }
    setAdminPinModalOpen(true);
  };

  const handleAdminPinSuccess = (updatedUser: User, newToken: string) => {
    setUser(updatedUser);
    if (newToken) {
      setToken(newToken);
      localStorage.setItem('womensafe_jwt', newToken);
    }
    localStorage.setItem('womensafe_user', JSON.stringify(updatedUser));
    setAdminPinModalOpen(false);
    setCurrentView('admin');
    showToast('Admin Security PIN verified by server. Access granted!');
  };

  const handleAuthSuccess = (authenticatedUser: User, jwtToken: string) => {
    setUser(authenticatedUser);
    setToken(jwtToken);
    localStorage.setItem('womensafe_jwt', jwtToken);
    localStorage.setItem('womensafe_user', JSON.stringify(authenticatedUser));
    setAuthModalOpen(false);
    showToast(`Welcome, ${authenticatedUser.name}!`);

    if (authenticatedUser.role === 'admin' && authenticatedUser.adminVerified) {
      setCurrentView('admin');
    } else {
      setCurrentView('dashboard');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    setUser(null);
    setToken(null);
    localStorage.removeItem('womensafe_jwt');
    localStorage.removeItem('womensafe_user');
    showToast('You have been logged out.');
    setCurrentView('landing');
  };

  const handleAssessmentResult = (result: RiskResult, recordId?: string) => {
    setActiveRiskResult(result);
    showToast('AI Risk Assessment completed successfully!');
  };

  const handleSelectRecord = (record: AssessmentRecord) => {
    const reconstructedResult: RiskResult = {
      riskScore: record.risk_score,
      riskLevel: record.risk_level,
      confidenceScore: 0.94,
      summary: `Historical Environmental Risk: ${record.risk_score}/100 (${record.risk_level} Risk)`,
      explanation: `Assessment logged for ${record.location} on ${record.date} at ${record.time}. Evaluated environmental conditions include ${record.lighting_condition.replace('_', ' ')} lighting and ${record.crowd_level} crowd density.`,
      contributingFactors: record.contributing_factors || [],
      recommendations: record.recommendations || [
        'Prefer well-illuminated primary corridors over alleys.',
        'Keep emergency hotlines saved on speed dial.',
      ],
      immediateDangerNotice: 'If you are in immediate danger, contact your local emergency services or a trusted person immediately.',
      evaluatedAt: record.created_at,
    };
    setActiveRiskResult(reconstructedResult);
  };

  return (
    <ThemeProvider>
      <div id="womensafe-root" className="min-h-screen flex flex-col bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased selection:bg-rose-100 selection:text-rose-900 transition-colors duration-200">
        {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top-4">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Global Top Navbar */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        user={user}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
        onOpenEmergency={() => setEmergencyModalOpen(true)}
        onOpenEditProfile={() => setEditProfileModalOpen(true)}
        onOpenAdminPin={handleOpenAdminPin}
      />

      {/* Main Content Router */}
      <main className="flex-1">
        {currentView === 'landing' && (
          <>
            <Hero
              onStartAssessment={() => {
                setCurrentView('assess');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onExploreHowItWorks={() => {
                setCurrentView('how-it-works');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
            <FeaturesSection />
            <HowItWorks />
          </>
        )}

        {currentView === 'assess' && (
          <AssessmentForm
            token={token}
            onResultGenerated={handleAssessmentResult}
          />
        )}

        {currentView === 'how-it-works' && (
          <div className="pt-4">
            <HowItWorks />
            <FeaturesSection />
          </div>
        )}

        {currentView === 'guidelines' && (
          <SafetyGuidelines onOpenEmergency={() => setEmergencyModalOpen(true)} />
        )}

        {currentView === 'privacy' && <PrivacyInfo />}

        {currentView === 'dashboard' && user && (
          <UserDashboard
            user={user}
            token={token}
            onNewAssessment={() => setCurrentView('assess')}
            onSelectRecord={handleSelectRecord}
            onOpenEditProfile={() => setEditProfileModalOpen(true)}
            onOpenAdminPin={handleOpenAdminPin}
          />
        )}

        {currentView === 'admin' && user?.role === 'admin' && (
          <AdminDashboard
            user={user}
            token={token}
            onSelectRecord={handleSelectRecord}
            onUpdateUser={(updatedUser, newToken) => {
              setUser(updatedUser);
              if (newToken) {
                setToken(newToken);
                localStorage.setItem('womensafe_jwt', newToken);
              }
              localStorage.setItem('womensafe_user', JSON.stringify(updatedUser));
              showToast(`Account updated: ${updatedUser.name}`);
            }}
          />
        )}
      </main>

      {/* Global Footer */}
      <Footer
        onNavigate={(view) => {
          setCurrentView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenEmergency={() => setEmergencyModalOpen(true)}
      />

      {/* Modals */}
      {authModalOpen && (
        <AuthModal
          initialTab={authInitialTab}
          onClose={() => setAuthModalOpen(false)}
          onAuthSuccess={handleAuthSuccess}
        />
      )}

      <AdminPinModal
        isOpen={adminPinModalOpen}
        onClose={() => setAdminPinModalOpen(false)}
        token={token}
        user={user}
        onSuccess={handleAdminPinSuccess}
      />

      {user && (
        <EditProfileModal
          user={user}
          token={token}
          isOpen={editProfileModalOpen}
          onClose={() => setEditProfileModalOpen(false)}
          onUserUpdated={(updatedUser, newToken) => {
            setUser(updatedUser);
            if (newToken) {
              setToken(newToken);
              localStorage.setItem('womensafe_jwt', newToken);
            }
            localStorage.setItem('womensafe_user', JSON.stringify(updatedUser));
            showToast(`Profile updated: ${updatedUser.name}`);
          }}
        />
      )}

      {emergencyModalOpen && (
        <EmergencyModal onClose={() => setEmergencyModalOpen(false)} />
      )}

      {activeRiskResult && (
        <RiskResultModal
          result={activeRiskResult}
          onClose={() => setActiveRiskResult(null)}
          onNewAssessment={() => {
            setActiveRiskResult(null);
            setCurrentView('assess');
          }}
          onGoToDashboard={() => {
            setActiveRiskResult(null);
            if (user) {
              setCurrentView('dashboard');
            } else {
              handleOpenAuth('login');
            }
          }}
          onOpenEmergency={() => {
            setActiveRiskResult(null);
            setEmergencyModalOpen(true);
          }}
        />
      )}
      </div>
    </ThemeProvider>
  );
}
