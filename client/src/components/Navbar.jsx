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
    const interval = setInterval(fetchAlerts, 30000);
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
    <header className="sticky top-0 z-[1500] bg-white/90 backdrop-blur-md border-b border-white/60 w-full shadow-sm">
      <div className="w-full px-4 sm:px-8 lg:px-12 h-16 flex items-center justify-between">
        
        {/* Brand / Logo */}
        <div 
          onClick={() => onNavigate('home')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-600 to-cyan-600 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
            <Bus className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight text-slate-900 font-mono">
                Transit<span className="text-teal-600">Notice</span>
              </span>
              <span className="text-xs uppercase font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                India
              </span>
            </div>
            <div className="text-xs text-slate-500 hidden sm:block font-medium">
              Public Transport Service Update Tracker
            </div>
          </div>
        </div>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-2">
          {navLinks.map(link => (
            <button
              key={link.id}
              onClick={() => onNavigate(link.id)}
              className={`px-3.5 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition ${
                activeTab === link.id
                  ? 'bg-teal-50 text-teal-800 border border-teal-200 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {link.icon && <link.icon className="w-4 h-4 text-teal-600" />}
              {link.label}
            </button>
          ))}

          {/* Prominent Dashboard Link */}
          <button
            onClick={() => onNavigate('dashboard')}
            className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </button>
        </nav>

        {/* Right Section: Alerts + User Auth */}
        <div className="flex items-center gap-3">
          {/* Alerts Notification Bell */}
          <div className="relative" ref={alertsDropdownRef}>
            <button
              onClick={() => setShowAlertsDropdown(!showAlertsDropdown)}
              className="relative p-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
              aria-label="View transport notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-teal-600 text-white text-xs font-black flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Alerts Dropdown Modal */}
            {showAlertsDropdown && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-[2000] text-sm">
                <div className="p-3.5 border-b border-slate-200 bg-slate-50 text-slate-900 flex items-center justify-between">
                  <div className="font-bold flex items-center gap-2 text-slate-900 text-sm">
                    <Bell className="w-4 h-4 text-teal-600" />
                    Realtime Transport Alerts
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-teal-600 hover:text-teal-700 font-bold flex items-center gap-1 text-xs"
                    >
                      <Check className="w-3.5 h-3.5" /> Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                  {alerts.length === 0 ? (
                    <div className="p-6 text-center text-slate-500 font-medium text-sm">
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
                        className={`p-3.5 transition cursor-pointer hover:bg-slate-50 ${alert.is_read ? 'bg-white text-slate-600' : 'bg-teal-50/50 text-slate-900 font-medium'}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-teal-700 text-sm">
                            {alert.title}
                          </span>
                          <span className="text-xs text-slate-400">
                            {new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-slate-600 text-xs leading-relaxed">
                          {alert.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-3 border-t border-slate-100 bg-slate-50 text-center">
                  <button
                    onClick={() => {
                      setShowAlertsDropdown(false);
                      onNavigate('tracker');
                    }}
                    className="text-teal-600 hover:underline font-bold text-xs"
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
                className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:border-teal-500 transition shadow-xs"
              >
                <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-slate-800">{user.username}</div>
                  <div className="text-xs text-slate-500 capitalize">{user.role}</div>
                </div>
              </div>

              <button
                onClick={logout}
                className="p-2 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-xl transition"
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
                className="px-3.5 py-2 text-sm font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
              >
                Sign In
              </button>
              <button
                onClick={() => onNavigate('register')}
                className="px-4 py-2 text-sm font-bold bg-teal-600 hover:bg-teal-500 text-white rounded-xl transition shadow-xs"
              >
                Register
              </button>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-xl"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 space-y-2 text-sm shadow-md">
          {navLinks.map(link => (
            <button
              key={link.id}
              onClick={() => {
                onNavigate(link.id);
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl font-bold flex items-center gap-2.5 ${
                activeTab === link.id ? 'bg-teal-50 text-teal-700 border border-teal-200' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              {link.icon && <link.icon className="w-4 h-4 text-teal-600" />}
              {link.label}
            </button>
          ))}

          <button
            onClick={() => {
              onNavigate('dashboard');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3.5 py-2.5 rounded-xl font-bold bg-teal-600 text-white flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <LayoutDashboard className="w-4 h-4" />
            My Commuter Dashboard
          </button>
        </div>
      )}
    </header>
  );
}
