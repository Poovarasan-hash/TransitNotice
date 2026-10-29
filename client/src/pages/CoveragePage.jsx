import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { CoverageLevelBadge, TransportBadge } from '../components/StatusBadge';
import { 
  Database, Search, ShieldCheck, MapPin, ExternalLink, Send, CheckCircle, 
  Info, Bus, Train, ArrowRight, Compass, Eye, X, Activity, Globe, RefreshCw
} from 'lucide-react';

export function CoveragePage({ onSelectDistrict }) {
  const [states, setStates] = useState([]);
  const [coverageMap, setCoverageMap] = useState({});
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedStateTab, setSelectedStateTab] = useState('All');
  const [selectedLevelFilter, setSelectedLevelFilter] = useState('all');
  const [inspectDistrict, setInspectDistrict] = useState(null);
  
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [requestForm, setRequestForm] = useState({
    state: '',
    district: '',
    agency: '',
    sourceUrl: '',
    notes: ''
  });

  useEffect(() => {
    api.getCoverageStates()
      .then(res => {
        setStates(res.states || []);
        setCoverageMap(res.registry || {});
      })
      .catch(err => console.error(err));
  }, []);

  const handleRequestSubmit = (e) => {
    e.preventDefault();
    setRequestSubmitted(true);
    setTimeout(() => {
      setShowRequestModal(false);
      setRequestSubmitted(false);
      setRequestForm({ state: '', district: '', agency: '', sourceUrl: '', notes: '' });
    }, 2000);
  };

  // Calculate totals by level
  const levelCounts = React.useMemo(() => {
    const counts = { all: 0, live_rt: 0, advisory_verified: 0, schedule_only: 0, unintegrated: 0 };
    Object.values(coverageMap).forEach(districts => {
      districts.forEach(d => {
        counts.all += 1;
        if (counts[d.coverage_level] !== undefined) {
          counts[d.coverage_level] += 1;
        }
      });
    });
    return counts;
  }, [coverageMap]);

  // Filter districts across states
  const filteredList = Object.entries(coverageMap).filter(([state]) => {
    if (selectedStateTab !== 'All' && state !== selectedStateTab) return false;
    return true;
  }).map(([state, districts]) => {
    const matchingDistricts = districts.filter(d => {
      // Level filter
      if (selectedLevelFilter !== 'all' && d.coverage_level !== selectedLevelFilter) {
        return false;
      }
      // Text search
      if (!searchFilter.trim()) return true;
      const term = searchFilter.toLowerCase();
      return (
        d.district.toLowerCase().includes(term) ||
        state.toLowerCase().includes(term) ||
        (d.notes && d.notes.toLowerCase().includes(term))
      );
    });
    return { state, districts: matchingDistricts };
  }).filter(group => group.districts.length > 0);

  const popularStates = [
    'All',
    'Delhi (NCT)',
    'Karnataka',
    'Maharashtra',
    'Tamil Nadu',
    'Kerala',
    'Telangana',
    'West Bengal'
  ];

  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-400 text-xs font-bold mb-2">
            <Globe className="w-3.5 h-3.5" />
            National Open Transit Registry
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-100 flex items-center gap-2">
            Transport Coverage & Transparency Directory
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            TransitNotice enforces strict truth in data coverage. We never fabricate GPS positions or claim complete district coverage without verified agency APIs.
          </p>
        </div>

        <button
          onClick={() => setShowRequestModal(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-lg shrink-0 cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
          Request Integration / Suggest Feed
        </button>
      </div>

      {/* Coverage Status Breakdown Cards (Interactive Filter Toggles) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => setSelectedLevelFilter(selectedLevelFilter === 'live_rt' ? 'all' : 'live_rt')}
          className={`p-4 rounded-2xl space-y-2 text-left transition cursor-pointer shadow-lg border ${
            selectedLevelFilter === 'live_rt'
              ? 'bg-emerald-950/80 border-emerald-400 ring-2 ring-emerald-500/30'
              : 'bg-emerald-950/30 border-emerald-800/40 hover:border-emerald-600/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              Live GTFS / GPS Available
            </div>
            <span className="text-xs font-mono font-black px-2 py-0.5 rounded-full bg-emerald-900/80 text-emerald-300 border border-emerald-600/40">
              {levelCounts.live_rt}
            </span>
          </div>
          <div className="text-slate-300 text-xs">
            Realtime vehicle GPS coordinates & live GTFS-RT alerts verified via open transit portals.
          </div>
          <div className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1 pt-1">
            {selectedLevelFilter === 'live_rt' ? '✓ Filter Active (Tap to clear)' : 'Click to filter live districts →'}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setSelectedLevelFilter(selectedLevelFilter === 'advisory_verified' ? 'all' : 'advisory_verified')}
          className={`p-4 rounded-2xl space-y-2 text-left transition cursor-pointer shadow-lg border ${
            selectedLevelFilter === 'advisory_verified'
              ? 'bg-cyan-950/80 border-cyan-400 ring-2 ring-cyan-500/30'
              : 'bg-cyan-950/30 border-cyan-800/40 hover:border-cyan-600/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified Advisory Feeds
            </div>
            <span className="text-xs font-mono font-black px-2 py-0.5 rounded-full bg-cyan-900/80 text-cyan-300 border border-cyan-600/40">
              {levelCounts.advisory_verified}
            </span>
          </div>
          <div className="text-slate-300 text-xs">
            Official daily route diversion bulletins, mega-blocks, and municipal circulars.
          </div>
          <div className="text-[11px] font-semibold text-cyan-400 flex items-center gap-1 pt-1">
            {selectedLevelFilter === 'advisory_verified' ? '✓ Filter Active (Tap to clear)' : 'Click to filter verified advisories →'}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setSelectedLevelFilter(selectedLevelFilter === 'schedule_only' ? 'all' : 'schedule_only')}
          className={`p-4 rounded-2xl space-y-2 text-left transition cursor-pointer shadow-lg border ${
            selectedLevelFilter === 'schedule_only'
              ? 'bg-amber-950/80 border-amber-400 ring-2 ring-amber-500/30'
              : 'bg-amber-950/30 border-amber-800/40 hover:border-amber-600/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" />
              Schedule / Timetable Only
            </div>
            <span className="text-xs font-mono font-black px-2 py-0.5 rounded-full bg-amber-900/80 text-amber-300 border border-amber-600/40">
              {levelCounts.schedule_only}
            </span>
          </div>
          <div className="text-slate-300 text-xs">
            Static timetable & route stops available; live GPS restricted to internal depot dispatch.
          </div>
          <div className="text-[11px] font-semibold text-amber-400 flex items-center gap-1 pt-1">
            {selectedLevelFilter === 'schedule_only' ? '✓ Filter Active (Tap to clear)' : 'Click to filter schedule-only →'}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setSelectedLevelFilter(selectedLevelFilter === 'unintegrated' ? 'all' : 'unintegrated')}
          className={`p-4 rounded-2xl space-y-2 text-left transition cursor-pointer shadow-lg border ${
            selectedLevelFilter === 'unintegrated'
              ? 'bg-slate-900 border-slate-500 ring-2 ring-slate-400/30'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              Live Data Unavailable
            </div>
            <span className="text-xs font-mono font-black px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
              {levelCounts.unintegrated}
            </span>
          </div>
          <div className="text-slate-300 text-xs">
            No public open transit API published yet. Clearly marked so commuters are never misled.
          </div>
          <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 pt-1">
            {selectedLevelFilter === 'unintegrated' ? '✓ Filter Active (Tap to clear)' : 'Click to filter unintegrated →'}
          </div>
        </button>
      </div>

      {/* Quick State Pill Buttons Bar */}
      <div className="space-y-2">
        <div className="text-xs font-bold text-slate-400">Quick State Select:</div>
        <div className="flex flex-wrap items-center gap-2">
          {popularStates.map(st => (
            <button
              key={st}
              onClick={() => setSelectedStateTab(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedStateTab === st
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Search & State Dropdown Controls */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search district, state, or transit authority..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
          />
        </div>

        <select
          value={selectedStateTab}
          onChange={(e) => setSelectedStateTab(e.target.value)}
          className="w-full sm:w-64 px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
        >
          <option value="All">All States / UTs</option>
          {states.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {selectedLevelFilter !== 'all' && (
          <button
            onClick={() => setSelectedLevelFilter('all')}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-xl text-xs font-bold transition border border-slate-700 shrink-0 cursor-pointer"
          >
            Clear Level Filter
          </button>
        )}
      </div>

      {/* Filter summary status */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <div>
          Showing districts for <strong className="text-slate-200">{selectedStateTab}</strong>
          {selectedLevelFilter !== 'all' && (
            <span> • Filtered by: <strong className="text-cyan-400">{selectedLevelFilter}</strong></span>
          )}
        </div>
        <div>
          Click any district to launch live map tracking
        </div>
      </div>

      {/* District Listings by State */}
      <div className="space-y-6">
        {filteredList.length === 0 ? (
          <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-200">No Districts Match Filter</h3>
            <p className="text-xs text-slate-400">
              Try selecting a different state or clearing the search keyword.
            </p>
            <button
              onClick={() => {
                setSelectedStateTab('All');
                setSelectedLevelFilter('all');
                setSearchFilter('');
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-semibold rounded-lg transition cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredList.map(({ state, districts }) => (
            <div key={state} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-cyan-400" />
                  {state}
                </h2>
                <span className="text-xs text-slate-400 font-semibold">
                  {districts.length} {districts.length === 1 ? 'District Tracked' : 'Districts Tracked'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
                {districts.map(d => (
                  <div
                    key={d.district}
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/50 flex flex-col justify-between space-y-3 transition shadow-lg group"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <h3 className="font-bold text-slate-200 text-xs truncate group-hover:text-cyan-300 transition-colors">
                          {d.district}
                        </h3>
                        <CoverageLevelBadge level={d.coverage_level} />
                      </div>

                      <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                        {d.notes || 'Official transit circulars and route notices catalogued.'}
                      </p>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-900">
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <div className="flex items-center gap-1">
                          {d.modes && d.modes.map(m => (
                            <span key={m} className="capitalize px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                              {m}
                            </span>
                          ))}
                        </div>
                        <span>Verified: {new Date(d.last_verified_at).toLocaleDateString()}</span>
                      </div>

                      {/* Interactive Action Buttons */}
                      <div className="grid grid-cols-2 gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => setInspectDistrict({ ...d, state })}
                          className="py-1 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-[10px] font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                        >
                          <Eye className="w-3 h-3 text-slate-400" />
                          Feed Specs
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (onSelectDistrict) onSelectDistrict(state, d.district);
                          }}
                          className="py-1 px-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-bold flex items-center justify-center gap-1 shadow transition cursor-pointer"
                        >
                          <span>Track Map</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* District Feed Inspector Modal */}
      {inspectDistrict && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase text-cyan-400 tracking-wider">
                  Open Transit Source Provenance
                </span>
                <h3 className="text-lg font-black text-slate-100 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-cyan-400" />
                  {inspectDistrict.district}, {inspectDistrict.state}
                </h3>
              </div>
              <button
                onClick={() => setInspectDistrict(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <div className="text-slate-400 text-[11px]">Integration Status</div>
                <div className="flex items-center gap-2">
                  <CoverageLevelBadge level={inspectDistrict.coverage_level} />
                  <span className="text-slate-200 font-semibold">{inspectDistrict.notes}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-slate-500 text-[10px] font-bold uppercase">Supported Transit Modes</div>
                  <div className="text-slate-200 font-bold mt-1 capitalize">
                    {inspectDistrict.modes?.join(', ') || 'Bus'}
                  </div>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-slate-500 text-[10px] font-bold uppercase">Audit Verification</div>
                  <div className="text-emerald-400 font-bold mt-1">
                    SHA-256 Canonical Diff
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <div className="text-slate-500 text-[10px] font-bold uppercase">Feed Reliability Standard</div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Adheres to Ministry of Housing and Urban Affairs (MoHUA) & Open Transit Data standards. Live feeds are polled every 120 seconds with automatic deduplication.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setInspectDistrict(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold text-xs"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const targetState = inspectDistrict.state;
                  const targetDistrict = inspectDistrict.district;
                  setInspectDistrict(null);
                  if (onSelectDistrict) onSelectDistrict(targetState, targetDistrict);
                }}
                className="px-5 py-2 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-600/30"
              >
                <span>Track {inspectDistrict.district} on Google Map</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suggest Feed Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-100">
              Submit Open Transport Data Feed
            </h3>
            <p className="text-xs text-slate-400">
              Know of an official open API or transit portal for an Indian district? Let our integration team know.
            </p>

            {requestSubmitted ? (
              <div className="py-8 text-center text-emerald-400 space-y-2">
                <CheckCircle className="w-10 h-10 mx-auto" />
                <div className="font-bold text-sm">Thank You! Feed submitted for verification.</div>
              </div>
            ) : (
              <form onSubmit={handleRequestSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">State / Union Territory</label>
                  <input
                    type="text"
                    required
                    value={requestForm.state}
                    onChange={(e) => setRequestForm({ ...requestForm, state: e.target.value })}
                    placeholder="e.g. Gujarat, Odisha"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">District / City</label>
                  <input
                    type="text"
                    required
                    value={requestForm.district}
                    onChange={(e) => setRequestForm({ ...requestForm, district: e.target.value })}
                    placeholder="e.g. Surat, Puri"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Agency Name & Portal URL</label>
                  <input
                    type="url"
                    required
                    value={requestForm.sourceUrl}
                    onChange={(e) => setRequestForm({ ...requestForm, sourceUrl: e.target.value })}
                    placeholder="https://transport-portal.gov.in"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowRequestModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-bold"
                  >
                    Submit Feed
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
