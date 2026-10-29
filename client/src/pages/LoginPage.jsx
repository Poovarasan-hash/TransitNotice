import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bus, Lock, Mail, Eye, EyeOff, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

export function LoginPage({ onNavigate }) {
  const { login } = useAuth();
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!emailOrUsername.trim() || !password) {
      setError('Please fill in both email/username and password');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await login(emailOrUsername.trim(), password);
      onNavigate('dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCommuter = () => {
    setEmailOrUsername('commuter@transitnotice.gov.in');
    setPassword('TransitPass123!');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 shadow-xl relative overflow-hidden">
        {/* Subtle top teal bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-600"></div>

        {/* Branding header */}
        <div className="text-center mb-8 space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 border border-teal-200 flex items-center justify-center mx-auto mb-3 shadow-sm">
            <Bus className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-[slate-900]">
            Sign In to TransitNotice
          </h1>
          <p className="text-xs text-slate-500">
            Access your personalized commute dashboard & route alerts
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-bold mb-1.5">
              Email or Username
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                placeholder="rajesh_transit or commuter@transitnotice.gov.in"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-slate-700 font-bold">
                Password
              </label>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-md shadow-teal-600/20 transition mt-2 disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Login Preset Button */}
        <div className="mt-6 pt-5 border-t border-slate-200 text-center">
          <button
            type="button"
            onClick={fillDemoCommuter}
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition border border-slate-300 shadow-sm"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            Quick Demo: Autofill Commuter Credentials
          </button>
        </div>

        {/* Toggle to Register */}
        <div className="mt-6 text-center text-xs text-slate-600">
          Don't have a commuter account yet?{' '}
          <button
            onClick={() => onNavigate('register')}
            className="text-teal-600 hover:underline font-bold"
          >
            Register Here
          </button>
        </div>
      </div>
    </div>
  );
}
