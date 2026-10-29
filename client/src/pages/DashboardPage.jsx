import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { NoticeCard } from '../components/NoticeCard';
import { NoticeDetailModal } from '../components/NoticeDetailModal';
import { LayoutDashboard, Bell, Heart, MapPin, Bus, ShieldCheck, RefreshCw, CheckCircle, Save, LogOut, LogIn, ArrowRight, Sparkles } from 'lucide-react';

export function DashboardPage({ onNavigate }) {
  const { user, preferences, savePreferences, logout, login } = useAuth();

  const [systemHealth, setSystemHealth] = useState(null);
  const [userNotices, setUserNotices] = useState([]);
  const [recentChangedNotices, setRecentChangedNotices] = useState([]);
  const [activeNoticeId, setActiveNoticeId] = useState(null);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [demoLoggingIn, setDemoLoggingIn] = useState(false);

  // Editable preferences form state
  const [formState, setFormState] = useState({
    state: preferences?.state || 'Delhi (NCT)',
    district: preferences?.district || 'South Delhi',
    route_id: preferences?.route_id || 'DTC-534',
    agency_id: preferences?.agency_id || 'delhi_otd',
    alert_types: preferences?.alert_types || ['diversion', 'delay', 'cancellation']
  });

  useEffect(() => {
    if (preferences) {
      setFormState({
        state: preferences.state || 'Delhi (NCT)',
        district: preferences.district || 'South Delhi',
        route_id: preferences.route_id || 'DTC-534',
        agency_id: preferences.agency_id || 'delhi_otd',
        alert_types: preferences.alert_types || ['diversion', 'delay', 'cancellation']
      });
    }
  }, [preferences]);

  useEffect(() => {
    // 1. Fetch system health & agency freshness
    api.getSystemHealth()
      .then(res => setSystemHealth(res))
      .catch(() => {});

    // 2. Fetch notices matching user's preferred district
    const stateParam = preferences?.state || 'Delhi (NCT)';
    const districtParam = preferences?.district || 'South Delhi';
    api.getNotices({ state: stateParam, district: districtParam, limit: 6 })
      .then(res => setUserNotices(res.notices || []))
      .catch(() => {});

    // 3. Fetch recently revised notices
    api.getNotices({ status: 'revised', limit: 4 })
      .then(res => setRecentChangedNotices(res.notices || []))
      .catch(() => {});
  }, [preferences]);

  const handleDemoLogin = async () => {
    setDemoLoggingIn(true);
    try {
      await login('commuter@transitnotice.gov.in', 'TransitPass123!');
    } catch (err) {
      alert(`Demo login failed: ${err.message}`);
    } finally {
      setDemoLoggingIn(false);
    }
  };

  const handleSavePreferences = async (e) => {
    e.preventDefault();
    if (!user) {
      if (confirm('You are in guest mode. Would you like to sign into the demo commuter account now to save preferences?')) {
        await handleDemoLogin();
      } else {
        return;
      }
    }

    setSavingPrefs(true);
    setSaveSuccess(false);
    try {
      await savePreferences(formState);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert(`Failed to save preferences: ${err.message}`);
    } finally {
      setSavingPrefs(false);
    }
  };

  const toggleAlertType = (type) => {
    const current = formState.alert_types || [];
    if (current.includes(type)) {
      setFormState({ ...formState, alert_types: current.filter(t => t !== type) });
    } else {
      setFormState({ ...formState, alert_types: [...current, type] });
    }
  };

  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 py-8 space-y-8">
      
      {/* Top Greeting & User Overview */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-700 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-cyan-600/30">
            {user ? user?.username?.charAt(0).toUpperCase() : 'G'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-100">
                {user ? `Welcome back, ${user.username}` : 'Commuter Intelligence Dashboard'}
              </h1>
              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                user ? 'bg-cyan-950 text-cyan-400 border-cyan-800' : 'bg-amber-950 text-amber-400 border-amber-800'
              }`}>
                {user ? (user.role || 'commuter') : 'Guest Explorer'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Personalized transport intelligence • Monitored Corridor: <strong className="text-cyan-400">{formState.district}, {formState.state}</strong>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {!user ? (
            <button
              onClick={handleDemoLogin}
              disabled={demoLoggingIn}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition shadow-lg flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {demoLoggingIn ? 'Logging In...' : 'One-Click Demo Login'}
            </button>
          ) : (
            <button
              onClick={logout}
              className="px-4 py-2 bg-slate-800 hover:bg-rose-950/50 hover:text-rose-300 text-slate-300 rounded-xl text-xs font-bold transition border border-slate-700 flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          )}

          <button
            onClick={() => onNavigate('tracker', { state: formState.state, district: formState.district })}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition shadow-lg flex items-center gap-1.5 cursor-pointer"
          >
            <Bus className="w-3.5 h-3.5" />
            Track Corridor on Map
          </button>
        </div>
      </div>

      {/* Interactive Summary Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => onNavigate('tracker', { state: formState.state, district: formState.district })}
          className="p-4 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/50 rounded-2xl text-left transition cursor-pointer group shadow-lg"
        >
          <div className="text-xs font-bold text-slate-400 group-hover:text-cyan-300 flex items-center justify-between">
            <span>District Advisories</span>
            <ArrowRight className="w-3.5 h-3.5 text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="text-2xl font-black text-cyan-400 font-mono mt-1">
            {userNotices.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">In {formState.district} corridor</div>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('tracker', { status: 'active' })}
          className="p-4 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/50 rounded-2xl text-left transition cursor-pointer group shadow-lg"
        >
          <div className="text-xs font-bold text-slate-400 group-hover:text-emerald-300 flex items-center justify-between">
            <span>Total System Active</span>
            <ArrowRight className="w-3.5 h-3.5 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono mt-1">
            {systemHealth?.metrics?.activeNotices || 12}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Across all connected states</div>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('tracker', { status: 'revised' })}
          className="p-4 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/50 rounded-2xl text-left transition cursor-pointer group shadow-lg"
        >
          <div className="text-xs font-bold text-slate-400 group-hover:text-amber-300 flex items-center justify-between">
            <span>Recently Revised</span>
            <ArrowRight className="w-3.5 h-3.5 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono mt-1">
            {recentChangedNotices.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Audited hash modifications</div>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('coverage')}
          className="p-4 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-teal-500/50 rounded-2xl text-left transition cursor-pointer group shadow-lg"
        >
          <div className="text-xs font-bold text-slate-400 group-hover:text-teal-300 flex items-center justify-between">
            <span>Connected Live Feeds</span>
            <ArrowRight className="w-3.5 h-3.5 text-teal-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="text-2xl font-black text-teal-400 font-mono mt-1">
            {systemHealth?.agencies?.length || 6}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">100% verified status</div>
        </button>
      </div>

      {/* Two Columns: Preferences Manager & Advisories List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Preferences Manager */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-400" />
              My Commuter Preferences
            </h2>
            <span className="text-[11px] text-slate-400">Stored in database</span>
          </div>

          {saveSuccess && (
            <div className="p-3 bg-emerald-950 border border-emerald-600/50 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Preferences saved successfully!</span>
            </div>
          )}

          <form onSubmit={handleSavePreferences} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Preferred State / UT
              </label>
              <select
                value={formState.state}
                onChange={(e) => setFormState({ ...formState, state: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="Delhi (NCT)">Delhi (NCT)</option>
                <option value="Karnataka">Karnataka</option>
                <option value="Maharashtra">Maharashtra</option>
                <option value="Tamil Nadu">Tamil Nadu</option>
                <option value="Kerala">Kerala</option>
                <option value="Telangana">Telangana</option>
                <option value="West Bengal">West Bengal</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Preferred District / City
              </label>
              <input
                type="text"
                value={formState.district}
                onChange={(e) => setFormState({ ...formState, district: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
                placeholder="e.g. South Delhi, Bengaluru Urban, Chennai"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Primary Daily Route ID
              </label>
              <input
                type="text"
                value={formState.route_id}
                onChange={(e) => setFormState({ ...formState, route_id: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
                placeholder="e.g. DTC-534, BMTC-500D, MTC-25G"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-2">
                Alert Preferences (Deduplicated Push Bulletins)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['diversion', 'delay', 'cancellation', 'interruption'].map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleAlertType(type)}
                    className={`px-3 py-2 rounded-lg border text-left font-medium capitalize transition flex items-center justify-between ${
                      formState.alert_types?.includes(type)
                        ? 'bg-cyan-950 text-cyan-300 border-cyan-600'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    <span>{type}</span>
                    {formState.alert_types?.includes(type) && (
                      <CheckCircle className="w-3.5 h-3.5 text-cyan-400" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={savingPrefs}
              className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 disabled:opacity-50 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition"
            >
              <Save className="w-3.5 h-3.5" />
              {savingPrefs ? 'Saving Changes...' : 'Save Preferences'}
            </button>
          </form>
        </div>

        {/* Right Column: Relevant Advisories in Preferred District */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Bell className="w-4 h-4 text-cyan-400" />
                Advisories in Your Commute Zone ({userNotices.length})
              </h2>
              <span className="text-xs text-slate-400">
                {formState.district}, {formState.state}
              </span>
            </div>

            {userNotices.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                No active diversions or delays currently reported in {formState.district}. Smooth commuting!
              </div>
            ) : (
              <div className="space-y-3">
                {userNotices.map(notice => (
                  <NoticeCard
                    key={notice.id}
                    notice={notice}
                    onSelect={(n) => setActiveNoticeId(n.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Agency Freshness & System Health Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Connected Transport Agencies & Health
              </h2>
              <span className="text-xs text-slate-400">Polled every 2 min</span>
            </div>

            <div className="divide-y divide-slate-800/80">
              {systemHealth?.agencies?.map(agency => (
                <div 
                  key={agency.id} 
                  onClick={() => onNavigate('coverage')}
                  className="py-2.5 flex items-center justify-between hover:bg-slate-800/50 px-2 rounded-lg transition cursor-pointer group"
                >
                  <div>
                    <div className="font-bold text-slate-200 group-hover:text-cyan-300 transition-colors">{agency.name}</div>
                    <div className="text-[10px] text-slate-400">{agency.status_message}</div>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700/40">
                      {agency.feed_type}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Checked: {new Date(agency.last_checked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Notice Detail Modal */}
      {activeNoticeId && (
        <NoticeDetailModal
          noticeId={activeNoticeId}
          onClose={() => setActiveNoticeId(null)}
        />
      )}
    </div>
  );
}
