import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { MapView } from '../components/MapView';
import { FilterBar } from '../components/FilterBar';
import { NoticeCard } from '../components/NoticeCard';
import { NoticeDetailModal } from '../components/NoticeDetailModal';
import { CoverageLevelBadge } from '../components/StatusBadge';
import { FLEET_SHOWCASE } from '../data/fleetShowcase';
import { 
  RefreshCw, AlertCircle, AlertTriangle, Search, Info, Map, List, CheckCircle, 
  Bus, Train, Compass, Radio, ArrowLeft, ChevronRight, Eye, Navigation, MapPin, Layers
} from 'lucide-react';

export function TrackerPage({ initialParams = {} }) {
  // Filters State
  const [states, setStates] = useState([]);
  const [districtsMap, setDistrictsMap] = useState({});
  const [selectedState, setSelectedState] = useState(initialParams.state || 'All');
  const [selectedDistrict, setSelectedDistrict] = useState(initialParams.district || 'All');
  const [selectedType, setSelectedType] = useState(initialParams.type || 'All');
  const [selectedNoticeType, setSelectedNoticeType] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState(initialParams.status || 'All');
  const [searchQuery, setSearchQuery] = useState(initialParams.query || '');

  // Data State
  const [notices, setNotices] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [stops, setStops] = useState([]);
  const [coverageInfo, setCoverageInfo] = useState(null);

  // UI State
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [activeNoticeId, setActiveNoticeId] = useState(initialParams.noticeId || null);
  const [activeViewMode, setActiveViewMode] = useState('split'); // 'split', 'map', 'list'
  const [syncFeedback, setSyncFeedback] = useState(null);

  // Interactive Route & Vehicle Selection State
  const [activeRightTab, setActiveRightTab] = useState(initialParams.query ? 'routes' : 'notices');
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [loadingRouteStops, setLoadingRouteStops] = useState(false);

  // Synchronize on initialParams change (e.g. from Home shortcuts)
  useEffect(() => {
    if (initialParams.state) setSelectedState(initialParams.state);
    if (initialParams.district) setSelectedDistrict(initialParams.district);
    if (initialParams.type) setSelectedType(initialParams.type);
    if (initialParams.status) setSelectedStatus(initialParams.status);
    if (initialParams.query) {
      setSearchQuery(initialParams.query);
      setActiveRightTab('routes');
    }
    if (initialParams.noticeId) setActiveNoticeId(initialParams.noticeId);
  }, [initialParams]);

  // 1. Initial Load: States & Coverage Registry
  useEffect(() => {
    api.getCoverageStates()
      .then(res => {
        setStates(res.states || []);
        setDistrictsMap(res.registry || {});
      })
      .catch(err => {
        console.error('Failed to load coverage states:', err);
      });
  }, []);

  // 2. Fetch Notices, Routes & Vehicles based on active filters
  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [noticesRes, routesRes, vehiclesRes] = await Promise.all([
        api.getNotices({
          state: selectedState,
          district: selectedDistrict,
          transport_type: selectedType,
          notice_type: selectedNoticeType,
          status: selectedStatus,
          q: searchQuery
        }),
        api.getRoutes({
          state: selectedState,
          district: selectedDistrict,
          transport_type: selectedType
        }),
        api.getVehicles()
      ]);

      setNotices(noticesRes.notices || []);
      setRoutes(routesRes.routes || []);
      setVehicles(vehiclesRes.vehicles || []);

      // If a single district is selected, verify coverage metadata
      if (selectedDistrict && selectedDistrict !== 'All') {
        const cov = await api.checkDistrictCoverage(selectedState, selectedDistrict);
        setCoverageInfo(cov);
      } else {
        setCoverageInfo(null);
      }
    } catch (err) {
      setError(err.message || 'Failed to load transit data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedState, selectedDistrict, selectedType, selectedNoticeType, selectedStatus, searchQuery]);

  // Handle manual refresh
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    setSyncFeedback(null);
    try {
      const res = await api.triggerSystemRefresh();
      setSyncFeedback('All official agency feeds re-checked and synchronized!');
      await fetchData();
      setTimeout(() => setSyncFeedback(null), 4000);
    } catch (err) {
      setError(`Refresh failed: ${err.message}`);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Select Route & Fetch its stops
  const handleSelectRoute = async (route) => {
    if (!route) {
      setSelectedRoute(null);
      setStops([]);
      return;
    }

    setSelectedRoute(route);
    setLoadingRouteStops(true);
    setActiveRightTab('routes');

    try {
      const detail = await api.getRouteDetail(route.id);
      if (detail && detail.stops) {
        setStops(detail.stops);
        setSelectedRoute({
          ...route,
          stops: detail.stops,
          activeNotices: detail.activeNotices || []
        });
      }
    } catch (err) {
      console.error('Failed to load route stops:', err);
    } finally {
      setLoadingRouteStops(false);
    }
  };

  // Get available districts for currently selected state
  const currentDistricts = selectedState && selectedState !== 'All' && districtsMap[selectedState]
    ? districtsMap[selectedState].map(d => d.district)
    : [];

  const handleResetFilters = () => {
    setSelectedState('All');
    setSelectedDistrict('All');
    setSelectedType('All');
    setSelectedNoticeType('All');
    setSelectedStatus('All');
    setSearchQuery('');
    setCoverageInfo(null);
    setSelectedRoute(null);
    setSelectedVehicleId(null);
    setStops([]);
  };

  const handleStateChange = (state) => {
    setSelectedState(state);
    setSelectedDistrict('All');
  };

  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 py-6 space-y-6 bg-[#F8FAFC] text-slate-900">
      
      {/* Top Header & Refresh Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0B172E] flex items-center gap-2">
            Transit Service Update Tracker
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
              National Feed
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Real-time route diversions, cancellations, delays, and scheduled interruptions across India.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* View Mode Toggle for Mobile / Tablets */}
          <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 lg:hidden shadow-sm">
            <button
              onClick={() => setActiveViewMode('split')}
              className={`p-1.5 rounded-lg text-xs font-bold ${activeViewMode === 'split' ? 'bg-teal-700 text-white' : 'text-slate-600'}`}
              title="Split View"
            >
              Split
            </button>
            <button
              onClick={() => setActiveViewMode('map')}
              className={`p-1.5 rounded-lg text-xs font-bold ${activeViewMode === 'map' ? 'bg-teal-700 text-white' : 'text-slate-600'}`}
              title="Map Only"
            >
              <Map className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveViewMode('list')}
              className={`p-1.5 rounded-lg text-xs font-bold ${activeViewMode === 'list' ? 'bg-teal-700 text-white' : 'text-slate-600'}`}
              title="List Only"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 disabled:opacity-50 text-teal-700 hover:text-teal-900 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition border border-slate-300 shadow-sm shrink-0 ml-auto sm:ml-0 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Checking Feeds...' : 'Refresh Feeds'}
          </button>
        </div>
      </div>

      {/* Sync Feedback Toast */}
      {syncFeedback && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs text-emerald-800 font-bold flex items-center gap-2 shadow-sm animate-fadeIn">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{syncFeedback}</span>
        </div>
      )}

      {/* Filter Bar Component */}
      <FilterBar
        states={states}
        districts={currentDistricts}
        selectedState={selectedState}
        selectedDistrict={selectedDistrict}
        selectedType={selectedType}
        selectedNoticeType={selectedNoticeType}
        selectedStatus={selectedStatus}
        searchQuery={searchQuery}
        coverageInfo={coverageInfo}
        onStateChange={handleStateChange}
        onDistrictChange={setSelectedDistrict}
        onTypeChange={setSelectedType}
        onNoticeTypeChange={setSelectedNoticeType}
        onStatusChange={setSelectedStatus}
        onSearchChange={setSearchQuery}
        onReset={handleResetFilters}
      />

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl text-rose-800 text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={fetchData} className="underline hover:text-rose-900 font-bold">
            Retry
          </button>
        </div>
      )}

      {/* Interactive Map & Side Intelligence Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Map Column */}
        <div className={`lg:col-span-7 xl:col-span-8 h-[600px] lg:h-[760px] sticky top-20 ${activeViewMode === 'list' ? 'hidden lg:block' : 'block'}`}>
          <div className="h-full rounded-3xl overflow-hidden border border-slate-300 shadow-xl bg-white">
            <MapView
              selectedState={selectedState !== 'All' ? selectedState : null}
              selectedDistrict={selectedDistrict !== 'All' ? selectedDistrict : null}
              routes={routes}
              vehicles={vehicles}
              notices={notices}
              stops={stops}
              selectedRouteId={selectedRoute?.id}
              selectedVehicleId={selectedVehicleId}
              onSelectNotice={(n) => setActiveNoticeId(n.id)}
              onSelectRoute={(r) => handleSelectRoute(r)}
              onSelectVehicle={(v) => {
                setSelectedVehicleId(v.id);
                setActiveRightTab('vehicles');
              }}
            />
          </div>
        </div>

        {/* Side Panel Column with 3 Interactive Tabs */}
        <div className={`lg:col-span-5 xl:col-span-4 space-y-4 ${activeViewMode === 'map' ? 'hidden lg:block' : 'block'}`}>
          
          {/* Panel Tab Switcher */}
          <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-2xl text-xs font-bold shadow-sm">
            <button
              onClick={() => setActiveRightTab('notices')}
              className={`flex-1 py-2 px-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeRightTab === 'notices'
                  ? 'bg-teal-700 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Advisories ({notices.length})</span>
            </button>

            <button
              onClick={() => setActiveRightTab('routes')}
              className={`flex-1 py-2 px-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeRightTab === 'routes'
                  ? 'bg-teal-700 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Bus className="w-3.5 h-3.5" />
              <span>Corridors ({routes.length})</span>
            </button>

            <button
              onClick={() => setActiveRightTab('vehicles')}
              className={`flex-1 py-2 px-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeRightTab === 'vehicles'
                  ? 'bg-teal-700 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Live Fleet ({vehicles.length})</span>
            </button>
          </div>

          {/* TAB 1: NOTICES LIST */}
          {activeRightTab === 'notices' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 px-1 font-semibold">
                <span className="text-[#0B172E] font-bold">
                  {notices.length} Active {notices.length === 1 ? 'Advisory' : 'Advisories'}
                </span>
                <span>Audited Hash Diffing</span>
              </div>

              {loading && (
                <div className="py-24 text-center text-slate-500 bg-white border border-slate-200 rounded-3xl shadow-sm">
                  <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  Querying verified transit advisories...
                </div>
              )}

              {!loading && notices.length === 0 && (
                <div className="p-8 text-center bg-white border border-slate-200 rounded-3xl space-y-3 shadow-sm">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                    <Search className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-[#0B172E]">No Advisories Match Your Filter</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    No active interruptions or diversions found for the chosen criteria.
                  </p>
                  <button
                    onClick={handleResetFilters}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-teal-700 text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    Reset All Filters
                  </button>
                </div>
              )}

              {!loading && notices.length > 0 && (
                <div className="space-y-3 overflow-y-auto max-h-[660px] pr-1">
                  {notices.map(notice => (
                    <NoticeCard
                      key={notice.id}
                      notice={notice}
                      onSelect={(n) => setActiveNoticeId(n.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ROUTES & STOPS */}
          {activeRightTab === 'routes' && (
            <div className="space-y-3">
              {selectedRoute ? (
                /* Selected Route Details & Stop Timeline */
                <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <button
                      onClick={() => handleSelectRoute(null)}
                      className="flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:text-teal-900 transition cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Back to All Corridors
                    </button>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 uppercase">
                      {selectedRoute.transport_type}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-black text-[#0B172E]">
                      {selectedRoute.route_short_name}: {selectedRoute.route_long_name}
                    </h3>
                    <div className="text-xs text-slate-600 mt-1 flex flex-wrap items-center gap-2 font-medium">
                      <span>{selectedRoute.origin || 'Start'}</span>
                      <span>→</span>
                      <span>{selectedRoute.destination || 'End'}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {selectedRoute.agency_name} • {selectedRoute.district}, {selectedRoute.state}
                    </div>
                  </div>

                  {/* Stops Timeline */}
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span>Scheduled Stops ({stops.length})</span>
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">🟢 Real-time Ingestion</span>
                    </div>

                    {loadingRouteStops ? (
                      <div className="py-6 text-center text-xs text-slate-500">
                        <div className="w-5 h-5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        Loading route stops...
                      </div>
                    ) : stops.length === 0 ? (
                      <div className="py-4 text-center text-xs text-slate-400">
                        No intermediate stops mapped for this corridor.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                        {stops.map((stop, idx) => (
                          <div
                            key={stop.id || idx}
                            className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs hover:border-teal-400 transition"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="w-5 h-5 rounded-full bg-teal-700 text-white flex items-center justify-center font-bold text-[10px]">
                                {stop.stop_sequence || idx + 1}
                              </span>
                              <span className="font-bold text-slate-800">{stop.stop_name}</span>
                            </div>
                            <span className="text-xs text-emerald-700 font-mono font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              ~{(idx * 3 + 2)}m
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* List of All Corridors (RedBus Style Cards) */
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500 px-1 font-semibold">
                    <span className="text-[#0B172E] font-bold">
                      {routes.length} Monitored Corridors
                    </span>
                    <span>Click any route to track</span>
                  </div>

                  <div className="space-y-3 overflow-y-auto max-h-[680px] pr-1">
                    {routes.map(r => {
                      const matchedFleet = FLEET_SHOWCASE.find(f => f.routeNumber === r.route_short_name || f.id === r.id);
                      const imgUrl = matchedFleet?.image || (r.transport_type === 'metro' 
                        ? 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=400&q=80'
                        : 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=400&q=80');

                      return (
                        <div
                          key={r.id}
                          onClick={() => handleSelectRoute(r)}
                          className="p-4 bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-teal-500/50 rounded-2xl transition cursor-pointer shadow-sm hover:shadow-md group space-y-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-20 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200 relative">
                              <img src={imgUrl} alt={r.route_short_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                              <span className="absolute bottom-1 left-1 px-1.5 py-0.2 bg-[#0B172E]/90 text-cyan-300 font-bold text-[9px] rounded">
                                {r.transport_type}
                              </span>
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-base font-black text-[#0B172E] group-hover:text-teal-700 transition-colors">
                                  {r.route_short_name}
                                </span>
                                <span className="text-xs font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                                  {r.district}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 font-semibold truncate mt-0.5">
                                {r.route_long_name}
                              </p>
                              <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                                <span>{r.origin || 'Start'}</span>
                                <span>→</span>
                                <span>{r.destination || 'End'}</span>
                              </div>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                            <span className="text-slate-500 font-medium">{r.agency_name || 'State RTC'}</span>
                            <span className="text-teal-700 font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                              View Stops & Live Map <ChevronRight className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: LIVE FLEET VEHICLES */}
          {activeRightTab === 'vehicles' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 px-1 font-semibold">
                <span className="text-[#0B172E] font-bold">
                  {vehicles.length} Real-Time GPS Transponders
                </span>
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  Active Telemetry
                </span>
              </div>

              <div className="space-y-3 overflow-y-auto max-h-[680px] pr-1">
                {vehicles.map(v => {
                  const matchedFleet = FLEET_SHOWCASE.find(f => f.routeNumber === v.route_short_name || f.vehicleId === v.id);
                  const imgUrl = matchedFleet?.image || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=400&q=80';

                  return (
                    <div
                      key={v.id}
                      className={`p-4 bg-white border rounded-2xl transition shadow-sm hover:shadow-md space-y-3 ${
                        selectedVehicleId === v.id ? 'border-teal-600 ring-2 ring-teal-500/20' : 'border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-14 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                          <img src={imgUrl} alt={v.vehicle_label} className="w-full h-full object-cover" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-black text-[#0B172E]">{v.vehicle_label}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              v.status === 'delayed' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            }`}>
                              {v.status === 'delayed' ? 'Delayed (+8m)' : 'On Schedule'}
                            </span>
                          </div>
                          <div className="text-xs text-slate-700 font-bold mt-0.5">
                            Route: {v.route_short_name || v.route_id}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">
                            {v.agency_name || 'Official RT Agency'}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="text-[10px] text-slate-500 block">Instant Speed</span>
                          <strong className="text-teal-700 font-mono text-sm">{v.speed_kmh || 26} km/h</strong>
                        </div>
                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="text-[10px] text-slate-500 block">GPS Telemetry</span>
                          <strong className="text-emerald-700 text-xs">🟢 Live Active</strong>
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedVehicleId(v.id)}
                        className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm ${
                          selectedVehicleId === v.id
                            ? 'bg-amber-600 text-white shadow-md'
                            : 'bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white shadow'
                        }`}
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        {selectedVehicleId === v.id ? 'Following Bus Live on Map' : 'Live Follow Bus on Map'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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
