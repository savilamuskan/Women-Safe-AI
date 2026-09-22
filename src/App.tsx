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
import { Footer } from './components/Footer.tsx';
import { User, RiskResult, AssessmentRecord } from './types.ts';

export default function App() {
  const [currentView, setCurrentView] = useState<string>('landing');
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Modals state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authInitialTab, setAuthInitialTab] = useState<'login' | 'register'>('login');
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);
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
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
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

  const handleAuthSuccess = (authenticatedUser: User, jwtToken: string) => {
    setUser(authenticatedUser);
    setToken(jwtToken);
    localStorage.setItem('womensafe_jwt', jwtToken);
    localStorage.setItem('womensafe_user', JSON.stringify(authenticatedUser));
    setAuthModalOpen(false);
    showToast(`Welcome, ${authenticatedUser.name}!`);

    if (authenticatedUser.role === 'admin') {
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
    <div id="womensafe-root" className="min-h-screen flex flex-col bg-white text-slate-900 font-sans antialiased selection:bg-rose-100 selection:text-rose-900">
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
          />
        )}

        {currentView === 'admin' && user?.role === 'admin' && (
          <AdminDashboard
            user={user}
            token={token}
            onSelectRecord={handleSelectRecord}
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
  );
}
