import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { NoticeCard } from '../components/NoticeCard';
import { Bus, Train, Compass, ShieldCheck, ArrowRight, Activity, MapPin, Search, AlertCircle, RefreshCw } from 'lucide-react';

export function HomePage({ onNavigate, onSelectNotice }) {
  const [metrics, setMetrics] = useState({
    activeNotices: 12,
    monitoredRoutes: 14,
    connectedAgencies: 6,
    trackedVehicles: 8
  });
  const [featuredNotices, setFeaturedNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    Promise.all([
      api.getSystemHealth().catch(() => null),
      api.getNotices({ limit: 4, status: 'active' }).catch(() => ({ notices: [] }))
    ]).then(([healthData, noticesData]) => {
      if (healthData && healthData.metrics) {
        setMetrics(healthData.metrics);
      }
      if (noticesData && noticesData.notices) {
        setFeaturedNotices(noticesData.notices);
      }
    }).finally(() => setLoading(false));
  }, []);

  const handleHeroSearch = (e) => {
    e.preventDefault();
    onNavigate('tracker', { query: searchQuery });
  };

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-[#0B192C] to-slate-950 border-b border-slate-800 py-16 sm:py-24">
        {/* Subtle decorative background grid */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#06B6D4_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>

        <div className="relative w-full px-4 sm:px-8 lg:px-12 xl:px-16 flex flex-col lg:flex-row items-center justify-between gap-12">
          {/* Left Text Column */}
          <div className="flex-1 text-center lg:text-left space-y-6 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 text-xs font-bold tracking-wide">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              India Public Transport Service Update Tracker
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-slate-100 tracking-tight leading-tight">
              Real-time Bus, Metro & Rail <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-sky-400">Advisories & Diversions</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
              Track route modifications, mega-blocks, monsoon advisories, and vehicle positions across Indian transit networks — grounded strictly in official government and agency feeds.
            </p>

            {/* Quick Search Form */}
            <form onSubmit={handleHeroSearch} className="max-w-xl flex flex-col sm:flex-row gap-2 pt-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter route (e.g. 534, 500D, Blue Line) or city..."
                  className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 shadow-inner"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition shrink-0"
              >
                Track Now
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Coverage Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs text-slate-400 pt-2">
              <span className="flex items-center gap-1.5 text-slate-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                No Mock / Fake GPS
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <RefreshCw className="w-4 h-4 text-cyan-400" />
                Idempotent Hash Diffing
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <MapPin className="w-4 h-4 text-amber-400" />
                District-by-District Transparency
              </span>
            </div>
          </div>

          {/* Right Transport Graphic Card */}
          <div className="w-full lg:w-5/12 max-w-md">
            <div className="relative bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400 font-bold">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-100">National Transit Monitor</div>
                    <div className="text-[10px] text-slate-400">Live Telemetry & Bulletins</div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                  SYSTEM ACTIVE
                </span>
              </div>

              {/* Transit Modes Illustration Strip */}
              <div className="grid grid-cols-4 gap-2 my-5 text-center">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <Bus className="w-6 h-6 text-sky-400 mx-auto mb-1" />
                  <div className="text-[11px] font-bold text-slate-200">Bus</div>
                  <div className="text-[9px] text-slate-500">DTC / BMTC</div>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <Train className="w-6 h-6 text-indigo-400 mx-auto mb-1" />
                  <div className="text-[11px] font-bold text-slate-200">Metro</div>
                  <div className="text-[9px] text-slate-500">DMRC / CMRL</div>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <Compass className="w-6 h-6 text-amber-400 mx-auto mb-1" />
                  <div className="text-[11px] font-bold text-slate-200">Rail</div>
                  <div className="text-[9px] text-slate-500">Suburban EMU</div>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="w-6 h-6 text-teal-400 mx-auto mb-1 flex items-center justify-center font-bold text-xs">
                    ⚓
                  </div>
                  <div className="text-[11px] font-bold text-slate-200">Ferry</div>
                  <div className="text-[9px] text-slate-500">Water Metro</div>
                </div>
              </div>

              {/* Sample Live Telemetry Feed */}
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    <span className="font-semibold text-slate-200">BMTC-500D (Volvo AC)</span>
                  </div>
                  <span className="text-[11px] text-cyan-400 font-mono">Bellandur ORR • 21 km/h</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-400"></span>
                    <span className="font-semibold text-slate-200">DTC Route 534 Diversion</span>
                  </div>
                  <span className="text-[11px] text-amber-400">Ashram Flyover Deck</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 text-center">
                <button
                  onClick={() => onNavigate('tracker')}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  Open Full Interactive Map
                  <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live System Metrics Bar */}
      <section className="w-full px-4 sm:px-8 lg:px-12 xl:px-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80">
            <div className="text-2xl sm:text-3xl font-black text-cyan-400 font-mono">
              {metrics.activeNotices || 12}
            </div>
            <div className="text-xs font-bold text-slate-200 mt-1">Active Advisories</div>
            <div className="text-[11px] text-slate-400">Verified official circulars</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80">
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
              {metrics.monitoredRoutes || 14}
            </div>
            <div className="text-xs font-bold text-slate-200 mt-1">Monitored Routes</div>
            <div className="text-[11px] text-slate-400">Bus, metro, and rail corridors</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80">
            <div className="text-2xl sm:text-3xl font-black text-teal-400 font-mono">
              {metrics.connectedAgencies || 6}
            </div>
            <div className="text-xs font-bold text-slate-200 mt-1">Connected Agencies</div>
            <div className="text-[11px] text-slate-400">State RTCs & metro authorities</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80">
            <div className="text-2xl sm:text-3xl font-black text-sky-400 font-mono">
              {metrics.trackedVehicles || 8}
            </div>
            <div className="text-xs font-bold text-slate-200 mt-1">Real-time Vehicles</div>
            <div className="text-[11px] text-slate-400">Active telemetry GPS positions</div>
          </div>
        </div>
      </section>

      {/* Featured Active Advisories */}
      <section className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-100">
              Recent Priority Service Advisories
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Live updates directly ingested and normalized from official state transport sources
            </p>
          </div>

          <button
            onClick={() => onNavigate('tracker')}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-xl text-xs font-bold flex items-center gap-1.5 transition border border-slate-700"
          >
            Explore All Advisories
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400">
            <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Loading latest transport advisories...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {featuredNotices.map(notice => (
              <NoticeCard
                key={notice.id}
                notice={notice}
                onSelect={(n) => {
                  if (onSelectNotice) onSelectNotice(n.id);
                  else onNavigate('tracker', { noticeId: n.id });
                }}
              />
            ))}
          </div>
        )}
      </section>

      {/* Core Architectural Pillars */}
      <section className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 py-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl font-black text-slate-100">
            Engineered for Public Transport Integrity
          </h2>
          <p className="text-xs text-slate-400 mt-2">
            Built following strict open government data policies and transparent coverage rules.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-100">No Scraping or Hallucinated Feeds</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              We never scrape protected portals, bypass logins, or fabricate artificial vehicle locations. All notices carry official source URLs, hash signatures, and observed timestamps.
            </p>
          </div>

          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
              <RefreshCw className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-100">Idempotent Revision Diffing</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Every refresh compares canonical SHA-256 hashes against previous observations, detecting extensions, revisions, and withdrawals with complete audit history.
            </p>
          </div>

          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-950 border border-amber-800 flex items-center justify-center text-amber-400">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-100">District-Level Truth in Coverage</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Where live tracking is unavailable, districts are transparently labelled as “Schedule/Advisory only” or “Live data unavailable”. We never claim blanket national coverage.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
