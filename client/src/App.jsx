import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { TrackerPage } from './pages/TrackerPage';
import { CoveragePage } from './pages/CoveragePage';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { NoticeDetailModal } from './components/NoticeDetailModal';

export function AppContent() {
  const [activeTab, setActiveTab] = useState('home');
  const [trackerParams, setTrackerParams] = useState({});
  const [globalNoticeId, setGlobalNoticeId] = useState(null);

  const handleNavigate = (tab, params = {}) => {
    setActiveTab(tab);
    if (tab === 'tracker' && Object.keys(params).length > 0) {
      setTrackerParams(params);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950/20 text-slate-900 selection:bg-teal-600 selection:text-white relative">
      <Navbar activeTab={activeTab} onNavigate={handleNavigate} />

      <main className="flex-1">
        {activeTab === 'home' && (
          <HomePage
            onNavigate={handleNavigate}
            onSelectNotice={(id) => setGlobalNoticeId(id)}
          />
        )}

        {activeTab === 'tracker' && (
          <TrackerPage initialParams={trackerParams} />
        )}

        {activeTab === 'coverage' && (
          <CoveragePage
            onSelectDistrict={(state, district) => {
              handleNavigate('tracker', { state, district });
            }}
          />
        )}

        {activeTab === 'dashboard' && (
          <DashboardPage onNavigate={handleNavigate} />
        )}

        {activeTab === 'login' && (
          <LoginPage onNavigate={handleNavigate} />
        )}

        {activeTab === 'register' && (
          <RegisterPage onNavigate={handleNavigate} />
        )}
      </main>

      <Footer onNavigate={handleNavigate} />

      {/* Global Notice Detail Modal for previewing notices clicked from Home */}
      {globalNoticeId && (
        <NoticeDetailModal
          noticeId={globalNoticeId}
          onClose={() => setGlobalNoticeId(null)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
