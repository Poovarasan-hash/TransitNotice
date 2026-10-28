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
    <header className="sticky top-0 z-[1500] bg-slate-950/95 backdrop-blur border-b border-slate-800 w-full">
      <div className="w-full px-4 sm:px-8 lg:px-12 h-16 flex items-center justify-between">
        
        {/* Brand / Logo */}
        <div 
          onClick={() => onNavigate('home')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <Bus className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-black tracking-tight text-white font-mono">
                Transit<span className="text-cyan-400">Notice</span>
              </span>
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/50">
                India
              </span>
            </div>
            <div className="text-[11px] text-slate-400 tracking-wide hidden sm:block">
              Public Transport Service Update Tracker
            </div>
          </div>
        </div>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(link => (
            <button
              key={link.id}
              onClick={() => onNavigate(link.id)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                activeTab === link.id
                  ? 'bg-slate-800 text-cyan-400 border border-slate-700'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              {link.icon && <link.icon className="w-3.5 h-3.5" />}
              {link.label}
            </button>
          ))}

          {/* Prominent Dashboard Link When Logged In */}
          {user && (
            <button
              onClick={() => onNavigate('dashboard')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                activeTab === 'dashboard'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                  : 'bg-cyan-950/70 text-cyan-300 hover:bg-cyan-900 border border-cyan-700/50'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Dashboard
            </button>
          )}
        </nav>

        {/* Right Section: Alerts + User Auth */}
        <div className="flex items-center gap-3">
          {/* Alerts Notification Bell */}
          <div className="relative" ref={alertsDropdownRef}>
            <button
              onClick={() => setShowAlertsDropdown(!showAlertsDropdown)}
              className="relative p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-900 rounded-lg transition"
              aria-label="View transport notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-cyan-500 text-slate-950 text-[10px] font-black flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Alerts Dropdown Modal */}
            {showAlertsDropdown && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-[2000] text-xs">
                <div className="p-3.5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
                  <div className="font-bold text-slate-200 flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-cyan-400" />
                    Realtime Transport Alerts
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 text-[11px]"
                    >
                      <Check className="w-3 h-3" /> Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/80">
                  {alerts.length === 0 ? (
                    <div className="p-6 text-center text-slate-500">
                      No active transport notifications
                    </div>
                  ) : (
                    alerts.slice(0, 10).map(alert => (
                      <div
                        key={alert.id}
                        className={`p-3 transition ${alert.is_read ? 'bg-slate-900/50 text-slate-400' : 'bg-slate-800/40 text-slate-200'}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-cyan-300">
                            {alert.title}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-slate-300 text-[11px] leading-snug">
                          {alert.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-2 border-t border-slate-800 bg-slate-950 text-center">
                  <button
                    onClick={() => {
                      setShowAlertsDropdown(false);
                      onNavigate('tracker');
                    }}
                    className="text-cyan-400 hover:underline font-semibold"
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
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg cursor-pointer hover:border-cyan-500/50 transition"
              >
                <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-slate-200">{user.username}</div>
                  <div className="text-[10px] text-slate-400 capitalize">{user.role}</div>
                </div>
              </div>

              <button
                onClick={logout}
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition"
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
                className="px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-900 rounded-lg transition"
              >
                Sign In
              </button>
              <button
                onClick={() => onNavigate('register')}
                className="px-3.5 py-1.5 text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg transition shadow-md shadow-cyan-500/20"
              >
                Register
              </button>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 py-3 space-y-2 text-sm">
          {navLinks.map(link => (
            <button
              key={link.id}
              onClick={() => {
                onNavigate(link.id);
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg font-semibold flex items-center gap-2 ${
                activeTab === link.id ? 'bg-slate-800 text-cyan-400' : 'text-slate-300'
              }`}
            >
              {link.icon && <link.icon className="w-4 h-4" />}
              {link.label}
            </button>
          ))}

          {user && (
            <button
              onClick={() => {
                onNavigate('dashboard');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg font-bold bg-cyan-950 text-cyan-400 border border-cyan-800 flex items-center gap-2"
            >
              <LayoutDashboard className="w-4 h-4" />
              My Commuter Dashboard
            </button>
          )}
        </div>
      )}
    </header>
  );
}
