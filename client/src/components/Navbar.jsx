import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { Bus, Bell, Shield, User, LogOut, Menu, X, LayoutDashboard, Map, Database, Check } from 'lucide-react';

export function Navbar({ activeTab, onNavigate }) {
  const { user, logout } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showAlertsDropdown, setShowAlertsDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const alertsDropdownRef = useRef(null);

  const fetchAlerts = () => {
    api.getAlerts()
      .then(res => {
        setAlerts(res.alerts || []);
        setUnreadCount(res.unreadCount || 0);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000); // refresh alerts every 30s
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (alertsDropdownRef.current && !alertsDropdownRef.current.contains(e.target)) {
        setShowAlertsDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.markAllAlertsRead();
      setUnreadCount(0);
      setAlerts(prev => prev.map(a => ({ ...a, is_read: 1 })));
    } catch (e) {}
  };

  const navLinks = [
    { id: 'home', label: 'Home', icon: null },
    { id: 'tracker', label: 'Live Map & Updates', icon: Map },
    { id: 'coverage', label: 'India Coverage', icon: Database },
  ];

  return (
    <header className="sticky top-0 z-[1500] bg-[#0B172E] border-b border-slate-800 w-full shadow-md">
      <div className="w-full px-4 sm:px-8 lg:px-12 h-16 flex items-center justify-between">
        
        {/* Brand / Logo */}
        <div 
          onClick={() => onNavigate('home')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-md shadow-teal-500/20 group-hover:scale-105 transition-transform">
            <Bus className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-black tracking-tight text-white font-mono">
                Transit<span className="text-teal-400">Notice</span>
              </span>
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-700/50">
                India
              </span>
            </div>
            <div className="text-[11px] text-slate-300 tracking-wide hidden sm:block">
              Public Transport Service Update Tracker
            </div>
          </div>
        </div>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-1.5">
          {navLinks.map(link => (
            <button
              key={link.id}
              onClick={() => onNavigate(link.id)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                activeTab === link.id
                  ? 'bg-slate-800/90 text-teal-300 border border-teal-500/40'
                  : 'text-slate-200 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {link.icon && <link.icon className="w-3.5 h-3.5" />}
              {link.label}
            </button>
          ))}

          {/* Prominent Dashboard Link */}
          <button
            onClick={() => onNavigate('dashboard')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/30'
                : 'bg-teal-900/40 text-teal-300 hover:bg-teal-900/70 border border-teal-600/50'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            Dashboard
          </button>
        </nav>

        {/* Right Section: Alerts + User Auth */}
        <div className="flex items-center gap-3">
          {/* Alerts Notification Bell */}
          <div className="relative" ref={alertsDropdownRef}>
            <button
              onClick={() => setShowAlertsDropdown(!showAlertsDropdown)}
              className="relative p-2 text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-lg transition"
              aria-label="View transport notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-teal-500 text-slate-950 text-[10px] font-black flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Alerts Dropdown Modal */}
            {showAlertsDropdown && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden z-[2000] text-xs">
                <div className="p-3.5 border-b border-slate-200 bg-[#0B172E] text-white flex items-center justify-between">
                  <div className="font-bold flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-teal-400" />
                    Realtime Transport Alerts
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-teal-300 hover:text-teal-200 font-semibold flex items-center gap-1 text-[11px]"
                    >
                      <Check className="w-3 h-3" /> Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                  {alerts.length === 0 ? (
                    <div className="p-6 text-center text-slate-500">
                      No active transport notifications
                    </div>
                  ) : (
                    alerts.slice(0, 10).map(alert => (
                      <div
                        key={alert.id}
                        onClick={() => {
                          setShowAlertsDropdown(false);
                          onNavigate('tracker', { noticeId: alert.notice_id });
                        }}
                        className={`p-3 transition cursor-pointer hover:bg-slate-50 ${alert.is_read ? 'bg-white text-slate-600' : 'bg-teal-50/50 text-slate-900 font-medium'}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-teal-700">
                            {alert.title}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-slate-600 text-[11px] leading-snug">
                          {alert.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-2.5 border-t border-slate-100 bg-slate-50 text-center">
                  <button
                    onClick={() => {
                      setShowAlertsDropdown(false);
                      onNavigate('tracker');
                    }}
                    className="text-teal-600 hover:underline font-bold"
                  >
                    View All Live Advisories on Map
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Auth Buttons / Profile */}
          {user ? (
            <div className="flex items-center gap-2">
              <div 
                onClick={() => onNavigate('dashboard')}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-lg cursor-pointer hover:border-teal-400 transition"
              >
                <div className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold text-xs">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-white">{user.username}</div>
                  <div className="text-[10px] text-slate-300 capitalize">{user.role}</div>
                </div>
              </div>

              <button
                onClick={logout}
                className="p-2 text-slate-300 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('login')}
                className="px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-800/70 rounded-lg transition"
              >
                Sign In
              </button>
              <button
                onClick={() => onNavigate('register')}
                className="px-3.5 py-1.5 text-xs font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-lg transition shadow-md shadow-teal-500/20"
              >
                Register
              </button>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-300 hover:text-white rounded-lg"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0B172E] border-b border-slate-800 px-4 py-3 space-y-2 text-sm">
          {navLinks.map(link => (
            <button
              key={link.id}
              onClick={() => {
                onNavigate(link.id);
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg font-semibold flex items-center gap-2 ${
                activeTab === link.id ? 'bg-slate-800 text-teal-300' : 'text-slate-200'
              }`}
            >
              {link.icon && <link.icon className="w-4 h-4" />}
              {link.label}
            </button>
          ))}

          <button
            onClick={() => {
              onNavigate('dashboard');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-lg font-bold bg-teal-500 text-slate-950 flex items-center gap-2 cursor-pointer"
          >
            <LayoutDashboard className="w-4 h-4" />
            My Commuter Dashboard
          </button>
        </div>
      )}
    </header>
  );
}
