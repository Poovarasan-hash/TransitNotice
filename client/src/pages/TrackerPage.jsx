import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { MapView } from '../components/MapView';
import { FilterBar } from '../components/FilterBar';
import { NoticeCard } from '../components/NoticeCard';
import { NoticeDetailModal } from '../components/NoticeDetailModal';
import { CoverageLevelBadge } from '../components/StatusBadge';
import { RefreshCw, AlertCircle, AlertTriangle, Search, Info, Map, List, CheckCircle } from 'lucide-react';

export function TrackerPage({ initialParams = {} }) {
  // Filters State
  const [states, setStates] = useState([]);
  const [districtsMap, setDistrictsMap] = useState({});
  const [selectedState, setSelectedState] = useState(initialParams.state || 'All');
  const [selectedDistrict, setSelectedDistrict] = useState(initialParams.district || 'All');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedNoticeType, setSelectedNoticeType] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
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
  };

  const handleStateChange = (state) => {
    setSelectedState(state);
    setSelectedDistrict('All');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top Header & Refresh Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-100 flex items-center gap-2">
            Transit Service Update Tracker
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
              National Feed
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time route diversions, cancellations, delays, and scheduled interruptions across India.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* View Mode Toggle for Mobile / Tablets */}
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 lg:hidden">
            <button
              onClick={() => setActiveViewMode('split')}
              className={`p-1.5 rounded-lg text-xs font-semibold ${activeViewMode === 'split' ? 'bg-slate-800 text-cyan-400' : 'text-slate-400'}`}
              title="Split View"
            >
              Split
            </button>
            <button
              onClick={() => setActiveViewMode('map')}
              className={`p-1.5 rounded-lg text-xs font-semibold ${activeViewMode === 'map' ? 'bg-slate-800 text-cyan-400' : 'text-slate-400'}`}
              title="Map Only"
            >
              <Map className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveViewMode('list')}
              className={`p-1.5 rounded-lg text-xs font-semibold ${activeViewMode === 'list' ? 'bg-slate-800 text-cyan-400' : 'text-slate-400'}`}
              title="List Only"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-cyan-400 hover:text-cyan-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition border border-slate-700 shadow-lg shrink-0 ml-auto sm:ml-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Checking Feeds...' : 'Refresh Feeds'}
          </button>
        </div>
      </div>

      {/* Sync Feedback Toast */}
      {syncFeedback && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-600/50 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-fadeIn">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
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
        <div className="p-4 bg-red-950/50 border border-red-800 rounded-xl text-red-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={fetchData} className="underline hover:text-white font-semibold">
            Retry
          </button>
        </div>
      )}

      {/* Interactive Map & Advisory List Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Map Column (Hidden on mobile if user chose 'list' only) */}
        <div className={`lg:col-span-7 h-[550px] lg:h-[720px] sticky top-20 ${activeViewMode === 'list' ? 'hidden lg:block' : 'block'}`}>
          <MapView
            selectedState={selectedState !== 'All' ? selectedState : null}
            selectedDistrict={selectedDistrict !== 'All' ? selectedDistrict : null}
            routes={routes}
            vehicles={vehicles}
            notices={notices}
            stops={stops}
            onSelectNotice={(n) => setActiveNoticeId(n.id)}
            onSelectRoute={(r) => {
              if (r.stops) setStops(r.stops);
            }}
          />
        </div>

        {/* Notices List Column (Hidden on mobile if user chose 'map' only) */}
        <div className={`lg:col-span-5 space-y-4 ${activeViewMode === 'map' ? 'hidden lg:block' : 'block'}`}>
          
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span className="font-semibold text-slate-200">
              Found {notices.length} {notices.length === 1 ? 'Advisory' : 'Advisories'}
            </span>
            <span>Sorted by Status & Recency</span>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="py-24 text-center text-slate-400 bg-slate-900 border border-slate-800 rounded-2xl">
              <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              Querying verified transit advisories...
            </div>
          )}

          {/* Empty State */}
          {!loading && notices.length === 0 && (
            <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-200">No Advisories Match Your Filter</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No active interruptions or diversions found for the chosen criteria.
              </p>
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-semibold rounded-lg transition"
              >
                Reset All Filters
              </button>
            </div>
          )}

          {/* Notice Cards List */}
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
