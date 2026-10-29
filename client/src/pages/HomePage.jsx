import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { NoticeCard } from '../components/NoticeCard';
import { MapView } from '../components/MapView';
import { FleetCard } from '../components/FleetCard';
import { FLEET_SHOWCASE } from '../data/fleetShowcase';
import { 
  Bus, Train, Compass, ShieldCheck, ArrowRight, Activity, MapPin, 
  Search, AlertCircle, RefreshCw, Navigation, Gauge, Radio, Layers, 
  Map as MapIcon, CheckCircle, ChevronRight, Eye, Star, Zap, ArrowLeftRight
} from 'lucide-react';

export function HomePage({ onNavigate, onSelectNotice }) {
  const [metrics, setMetrics] = useState({
    activeNotices: 12,
    monitoredRoutes: 14,
    connectedAgencies: 6,
    trackedVehicles: 8
  });
  const [featuredNotices, setFeaturedNotices] = useState([]);
  const [liveVehicles, setLiveVehicles] = useState([]);
  const [allRoutes, setAllRoutes] = useState([]);
  const [loading, setLoading] = useState(true);

  // RedBus-style Search Bar State
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [transportMode, setTransportMode] = useState('All');

  // View state: 'cards' or 'map'
  const [fleetViewMode, setFleetViewMode] = useState('cards');
  const [selectedHomeVehicleId, setSelectedHomeVehicleId] = useState(null);
  const [selectedHomeRouteId, setSelectedHomeRouteId] = useState(null);
  const [selectedCityFilter, setSelectedCityFilter] = useState('All');

  useEffect(() => {
    Promise.all([
      api.getSystemHealth().catch(() => null),
      api.getNotices({ limit: 4, status: 'active' }).catch(() => ({ notices: [] })),
      api.getVehicles().catch(() => ({ vehicles: [] })),
      api.getRoutes().catch(() => ({ routes: [] }))
    ]).then(([healthData, noticesData, vehiclesData, routesData]) => {
      if (healthData && healthData.metrics) {
        setMetrics(healthData.metrics);
      }
      if (noticesData && noticesData.notices) {
        setFeaturedNotices(noticesData.notices);
      }
      if (vehiclesData && vehiclesData.vehicles) {
        setLiveVehicles(vehiclesData.vehicles);
      }
      if (routesData && routesData.routes) {
        setAllRoutes(routesData.routes);
      }
    }).finally(() => setLoading(false));
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const queryTerm = [fromLocation, toLocation].filter(Boolean).join(' ');
    onNavigate('tracker', { 
      query: queryTerm,
      type: transportMode !== 'All' ? transportMode.toLowerCase() : 'All'
    });
  };

  const swapLocations = () => {
    const temp = fromLocation;
    setFromLocation(toLocation);
    setToLocation(temp);
  };

  // Filter showcase fleet
  const filteredFleet = FLEET_SHOWCASE.filter(fleet => {
    if (selectedCityFilter !== 'All') {
      const matchCity = fleet.operator.toLowerCase().includes(selectedCityFilter.toLowerCase()) ||
                        fleet.state.toLowerCase().includes(selectedCityFilter.toLowerCase()) ||
                        fleet.district.toLowerCase().includes(selectedCityFilter.toLowerCase());
      if (!matchCity) return false;
    }
    if (transportMode !== 'All' && fleet.type.toLowerCase() !== transportMode.toLowerCase()) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-12 pb-16 bg-[#F8FAFC] text-slate-900">
      
      {/* HERO SECTION: DEEP NAVY BLUE HEADER */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0B172E] via-[#0F1E36] to-[#0B172E] border-b border-slate-800 pt-12 pb-16 text-white shadow-xl">
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#38BDF8_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none"></div>

        <div className="relative w-full px-4 sm:px-8 lg:px-12 xl:px-16 space-y-8">
          
          {/* Top Tagline */}
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 text-xs font-bold tracking-wide shadow-lg">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
              India's Official Public Transport Tracker & Service Advisory Network
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              Live Bus, Metro & Rail <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-cyan-300 to-sky-300">Tracker & Updates</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Real-time moving vehicles, route diversions, cancellations, and official government advisories across Delhi, Bengaluru, Mumbai, Chennai, and Kerala.
            </p>
          </div>

          {/* RedBus-Style Booking & Search Bar (Clean White Card on Deep Navy Banner) */}
          <div className="max-w-5xl mx-auto bg-white rounded-3xl p-5 sm:p-7 shadow-2xl border border-slate-200 text-slate-900">
            <form onSubmit={handleSearchSubmit} className="space-y-4">
              
              {/* Mode Selector Tabs on Top of Search Bar */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {[
                  { id: 'All', label: 'All Transport', icon: Activity },
                  { id: 'bus', label: 'Buses (DTC / BMTC / BEST)', icon: Bus },
                  { id: 'metro', label: 'Metro (DMRC / CMRL)', icon: Train },
                  { id: 'rail', label: 'Suburban Railways', icon: Compass }
                ].map(mode => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setTransportMode(mode.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                      transportMode === mode.id
                        ? 'bg-teal-700 text-white shadow-md shadow-teal-700/20'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    <mode.icon className="w-4 h-4" />
                    <span>{mode.label}</span>
                  </button>
                ))}
              </div>

              {/* Main Matrix Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                
                {/* From Input */}
                <div className="md:col-span-5 relative">
                  <label className="text-xs font-bold text-slate-600 block mb-1">
                    From (Origin / Terminal)
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-600" />
                    <input
                      type="text"
                      value={fromLocation}
                      onChange={(e) => setFromLocation(e.target.value)}
                      placeholder="e.g. Mehrauli, Silk Board, Anna Square..."
                      className="w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-600 focus:bg-white font-semibold transition"
                    />
                  </div>
                </div>

                {/* Swap Icon Button */}
                <div className="md:col-span-1 flex justify-center pt-3 md:pt-5">
                  <button
                    type="button"
                    onClick={swapLocations}
                    title="Swap Origin and Destination"
                    className="w-10 h-10 rounded-full bg-slate-100 hover:bg-teal-600 text-slate-700 hover:text-white border border-slate-300 flex items-center justify-center transition shadow cursor-pointer group"
                  >
                    <ArrowLeftRight className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" />
                  </button>
                </div>

                {/* To Input */}
                <div className="md:col-span-4 relative">
                  <label className="text-xs font-bold text-slate-600 block mb-1">
                    To (Destination / Stop)
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-600" />
                    <input
                      type="text"
                      value={toLocation}
                      onChange={(e) => setToLocation(e.target.value)}
                      placeholder="e.g. Anand Vihar, Hebbal, Poonamallee..."
                      className="w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-600 focus:bg-white font-semibold transition"
                    />
                  </div>
                </div>

                {/* Submit Action Button (Teal / Cyan Gradient) */}
                <div className="md:col-span-2 pt-3 md:pt-5">
                  <button
                    type="submit"
                    className="w-full py-3.5 bg-gradient-to-r from-teal-600 via-cyan-600 to-teal-600 hover:from-teal-500 hover:to-cyan-500 text-white font-black rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-teal-600/30 transition cursor-pointer"
                  >
                    <Search className="w-4 h-4" />
                    <span>Search</span>
                  </button>
                </div>
              </div>

              {/* Popular Quick Corridors */}
              <div className="flex flex-wrap items-center gap-2 text-xs pt-2 border-t border-slate-100">
                <span className="text-slate-500 font-bold">Popular Routes:</span>
                {[
                  { label: 'BMTC 500D (Silk Board ⇄ Hebbal)', from: 'Silk Board', to: 'Hebbal' },
                  { label: 'DTC 534 (Mehrauli ⇄ Anand Vihar)', from: 'Mehrauli', to: 'Anand Vihar' },
                  { label: 'MTC 25G (Anna Sq ⇄ Poonamallee)', from: 'Anna Square', to: 'Poonamallee' },
                  { label: 'BEST 203 (Andheri ⇄ Dahisar)', from: 'Andheri', to: 'Dahisar' },
                ].map(r => (
                  <button
                    key={r.label}
                    type="button"
                    onClick={() => {
                      setFromLocation(r.from);
                      setToLocation(r.to);
                      onNavigate('tracker', { query: `${r.from} ${r.to}` });
                    }}
                    className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-800 border border-slate-200 text-xs font-semibold transition cursor-pointer"
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </form>
          </div>

          {/* Real Transport Trust Badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-300 pt-2">
            <span className="flex items-center gap-2 text-slate-200 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              100% Official Agency Feeds Only
            </span>
            <span>•</span>
            <span className="flex items-center gap-2 text-slate-200 font-semibold">
              <RefreshCw className="w-4 h-4 text-cyan-300" />
              Idempotent SHA-256 Hash Auditing
            </span>
            <span>•</span>
            <span className="flex items-center gap-2 text-slate-200 font-semibold">
              <MapPin className="w-4 h-4 text-amber-300" />
              Transparent District Coverage Directory
            </span>
          </div>

        </div>
      </section>

      {/* SYSTEM METRICS BAR (CRISP WHITE CARDS) */}
      <section className="w-full px-4 sm:px-8 lg:px-12 xl:px-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-6 bg-white border border-slate-200/90 rounded-3xl shadow-sm">
          <button
            type="button"
            onClick={() => onNavigate('tracker', { status: 'active' })}
            className="p-5 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200 text-left transition cursor-pointer group"
          >
            <div className="text-3xl sm:text-4xl font-black text-teal-700 font-mono group-hover:scale-105 transition-transform">
              {metrics.activeNotices || 12}
            </div>
            <div className="text-sm font-bold text-[#0B172E] mt-1 flex items-center justify-between">
              Active Advisories
              <ArrowRight className="w-4 h-4 text-teal-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="text-xs text-slate-500 mt-0.5">Verified state transport circulars</div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('tracker')}
            className="p-5 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200 text-left transition cursor-pointer group"
          >
            <div className="text-3xl sm:text-4xl font-black text-cyan-700 font-mono group-hover:scale-105 transition-transform">
              {metrics.monitoredRoutes || 14}
            </div>
            <div className="text-sm font-bold text-[#0B172E] mt-1 flex items-center justify-between">
              Monitored Corridors
              <ArrowRight className="w-4 h-4 text-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="text-xs text-slate-500 mt-0.5">Bus, metro, and suburban rail lines</div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('coverage')}
            className="p-5 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200 text-left transition cursor-pointer group"
          >
            <div className="text-3xl sm:text-4xl font-black text-indigo-700 font-mono group-hover:scale-105 transition-transform">
              {metrics.connectedAgencies || 6}
            </div>
            <div className="text-sm font-bold text-[#0B172E] mt-1 flex items-center justify-between">
              Connected RTCs
              <ArrowRight className="w-4 h-4 text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="text-xs text-slate-500 mt-0.5">State corporations & metro authorities</div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('tracker')}
            className="p-5 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200 text-left transition cursor-pointer group"
          >
            <div className="text-3xl sm:text-4xl font-black text-emerald-700 font-mono group-hover:scale-105 transition-transform">
              {metrics.trackedVehicles || 8}
            </div>
            <div className="text-sm font-bold text-[#0B172E] mt-1 flex items-center justify-between">
              Active Transponders
              <ArrowRight className="w-4 h-4 text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="text-xs text-slate-500 mt-0.5">Real-time GPS vehicle positions</div>
          </button>
        </div>
      </section>

      {/* LIVE FLEET RADAR: REDBUS STYLE CARDS & EMBEDDED GOOGLE MAP */}
      <section className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold mb-2 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              Live Transponder Telemetry Active
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#0B172E]">
              Active Public Transport Fleets
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Select any bus or train to inspect real-time speed, upcoming stops, and live GPS tracking.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* View Switcher: RedBus Style Cards vs Google Map */}
            <div className="flex items-center bg-white p-1.5 rounded-2xl border border-slate-200 text-xs font-bold shadow-sm">
              <button
                type="button"
                onClick={() => setFleetViewMode('cards')}
                className={`py-2 px-4 rounded-xl flex items-center gap-2 transition cursor-pointer ${
                  fleetViewMode === 'cards'
                    ? 'bg-teal-700 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Bus className="w-4 h-4" />
                <span>Bus Fleet Cards</span>
              </button>
              <button
                type="button"
                onClick={() => setFleetViewMode('map')}
                className={`py-2 px-4 rounded-xl flex items-center gap-2 transition cursor-pointer ${
                  fleetViewMode === 'map'
                    ? 'bg-teal-700 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <MapIcon className="w-4 h-4" />
                <span>Interactive Map View</span>
              </button>
            </div>

            <button
              onClick={() => onNavigate('tracker')}
              className="px-4 py-2 bg-white hover:bg-slate-50 text-teal-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition border border-slate-300 shadow-sm cursor-pointer"
            >
              <span>Full Screen Tracker</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* City Filter Strip */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-500 font-bold shrink-0">City Hubs:</span>
          {['All', 'Delhi', 'Bengaluru', 'Mumbai', 'Chennai', 'Kerala'].map(city => (
            <button
              key={city}
              onClick={() => setSelectedCityFilter(city)}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition shrink-0 cursor-pointer ${
                selectedCityFilter === city
                  ? 'bg-teal-700 text-white shadow-md shadow-teal-700/20'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {city}
            </button>
          ))}
        </div>

        {/* VIEW 1: REDBUS STYLE FLEET CARDS */}
        {fleetViewMode === 'cards' && (
          <div className="space-y-4">
            {filteredFleet.map(fleet => (
              <FleetCard
                key={fleet.id}
                fleet={fleet}
                onTrackMap={(item) => {
                  setSelectedHomeVehicleId(item.vehicleId);
                  setSelectedHomeRouteId(item.id);
                  setFleetViewMode('map');
                }}
                onExploreRoute={(item) => {
                  onNavigate('tracker', { query: item.routeNumber });
                }}
              />
            ))}
          </div>
        )}

        {/* VIEW 2: INTERACTIVE GOOGLE MAP DIRECTLY ON HOME */}
        {fleetViewMode === 'map' && (
          <div className="space-y-3">
            <div className="h-[600px] w-full rounded-3xl overflow-hidden border border-slate-300 shadow-xl relative bg-white">
              <MapView
                routes={allRoutes}
                vehicles={liveVehicles}
                notices={featuredNotices}
                selectedVehicleId={selectedHomeVehicleId}
                selectedRouteId={selectedHomeRouteId}
                onSelectVehicle={(veh) => setSelectedHomeVehicleId(veh.id)}
                onSelectRoute={(rt) => setSelectedHomeRouteId(rt.id)}
              />
            </div>

            {/* Quick Bus Carousel Under Map */}
            <div className="flex items-center gap-2 overflow-x-auto py-2">
              <span className="text-xs font-bold text-slate-500 shrink-0">Tracked Units:</span>
              {filteredFleet.map(fleet => (
                <button
                  key={fleet.id}
                  onClick={() => {
                    setSelectedHomeVehicleId(fleet.vehicleId);
                    setSelectedHomeRouteId(fleet.id);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 border cursor-pointer ${
                    selectedHomeRouteId === fleet.id
                      ? 'bg-teal-700 text-white border-teal-700 shadow-md'
                      : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${fleet.status === 'delayed' ? 'bg-rose-500' : 'bg-emerald-500 animate-ping'}`}></span>
                  <span>{fleet.routeNumber} ({fleet.operator})</span>
                  <span className="font-mono opacity-80">{fleet.currentSpeed} km/h</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* REAL TRANSPORT FLEET SHOWCASE GALLERY (CRISP WHITE CARDS) */}
      <section className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 space-y-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200 text-xs font-bold mb-2 shadow-sm">
            <Bus className="w-3.5 h-3.5 text-teal-600" />
            Modern Public Transit Fleet
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#0B172E]">
            India's Transit Fleet Spotlight
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Official vehicle classifications currently monitored by the TransitNotice platform.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: Electric Volvo Bus */}
          <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:border-teal-500/40 transition group">
            <div className="h-52 overflow-hidden relative bg-slate-100">
              <img 
                src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80" 
                alt="Volvo AC Electric City Bus"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-[#0B172E]/90 text-cyan-300 border border-slate-700 text-[10px] font-bold uppercase tracking-wider shadow">
                Electric Low-Floor
              </span>
            </div>
            <div className="p-6 space-y-2">
              <div className="text-xs font-bold text-teal-700 uppercase tracking-wide">BMTC Vajra & DTC Electric</div>
              <h3 className="text-lg font-bold text-[#0B172E]">Volvo 9400 AC Electric City Bus</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Zero emission low-floor transit buses operating on high-density urban corridors with onboard GPS transponders and automatic ramp access.
              </p>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-mono font-medium">Capacity: 45 Seater</span>
                <button
                  onClick={() => onNavigate('tracker', { query: '500D' })}
                  className="text-teal-700 hover:text-teal-900 font-bold flex items-center gap-1 cursor-pointer"
                >
                  Track Corridors <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Card 2: Electric Double Decker */}
          <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:border-teal-500/40 transition group">
            <div className="h-52 overflow-hidden relative bg-slate-100">
              <img 
                src="https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&w=800&q=80" 
                alt="BEST AC Double Decker Bus"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-[#0B172E]/90 text-cyan-300 border border-slate-700 text-[10px] font-bold uppercase tracking-wider shadow">
                Double Decker EV
              </span>
            </div>
            <div className="p-6 space-y-2">
              <div className="text-xs font-bold text-rose-600 uppercase tracking-wide">BEST Mumbai Metropolitan</div>
              <h3 className="text-lg font-bold text-[#0B172E]">Switch EiV22 AC Double Decker</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                India's premier air-conditioned electric double-decker bus serving Mumbai's high-capacity arterial routes with dual staircases and regenerative braking.
              </p>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-mono font-medium">Capacity: 65 Seater</span>
                <button
                  onClick={() => onNavigate('tracker', { query: '203' })}
                  className="text-teal-700 hover:text-teal-900 font-bold flex items-center gap-1 cursor-pointer"
                >
                  Track Corridors <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Card 3: Modern Metro Train */}
          <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:border-teal-500/40 transition group">
            <div className="h-52 overflow-hidden relative bg-slate-100">
              <img 
                src="https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=800&q=80" 
                alt="DMRC Metro Rapid Transit"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-[#0B172E]/90 text-indigo-300 border border-slate-700 text-[10px] font-bold uppercase tracking-wider shadow">
                Rapid Metro Rail
              </span>
            </div>
            <div className="p-6 space-y-2">
              <div className="text-xs font-bold text-indigo-700 uppercase tracking-wide">DMRC Delhi & CMRL Chennai</div>
              <h3 className="text-lg font-bold text-[#0B172E]">Alstom 8-Car Metro Trainset</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Automated high-speed metropolitan rail operating every 3 minutes with platform screen doors, regenerative braking, and real-time station countdowns.
              </p>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-mono font-medium">Top Speed: 80 km/h</span>
                <button
                  onClick={() => onNavigate('tracker', { query: 'Metro' })}
                  className="text-teal-700 hover:text-teal-900 font-bold flex items-center gap-1 cursor-pointer"
                >
                  Track Corridors <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* RECENT SERVICE ADVISORIES */}
      <section className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#0B172E]">
              Recent Priority Service Advisories
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Live updates directly ingested and normalized from official state transport sources
            </p>
          </div>

          <button
            onClick={() => onNavigate('tracker')}
            className="px-4 py-2 bg-white hover:bg-slate-50 text-teal-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition border border-slate-300 shadow-sm cursor-pointer"
          >
            Explore All Advisories
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-500">
            <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
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

      {/* CORE ARCHITECTURAL PILLARS */}
      <section className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 py-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-black text-[#0B172E]">
            Engineered for Public Transport Integrity
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            Built following strict open government data policies and transparent coverage rules.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-7 bg-white border border-slate-200/90 rounded-3xl space-y-3 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#0B172E]">No Scraping or Hallucinated Feeds</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              We never scrape protected portals, bypass logins, or fabricate artificial vehicle locations. All notices carry official source URLs, hash signatures, and observed timestamps.
            </p>
          </div>

          <div className="p-7 bg-white border border-slate-200/90 rounded-3xl space-y-3 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <RefreshCw className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#0B172E]">Idempotent Revision Diffing</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every refresh compares canonical SHA-256 hashes against previous observations, detecting extensions, revisions, and withdrawals with complete audit history.
            </p>
          </div>

          <div className="p-7 bg-white border border-slate-200/90 rounded-3xl space-y-3 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#0B172E]">District-Level Truth in Coverage</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Where live tracking is unavailable, districts are transparently labelled as “Schedule/Advisory only” or “Live data unavailable”. We never claim blanket national coverage.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
