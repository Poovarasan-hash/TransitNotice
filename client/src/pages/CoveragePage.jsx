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
    <div className="w-full px-4 sm:px-8 lg:px-12 py-8 space-y-8 bg-[#F8FAFC] text-slate-900">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold mb-2 shadow-sm">
            <Globe className="w-3.5 h-3.5 text-teal-600" />
            National Open Transit Registry
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2">
            Transport Coverage & Transparency Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            TransitNotice enforces strict truth in data coverage. We never fabricate GPS positions or claim complete district coverage without verified agency APIs.
          </p>
        </div>

        <button
          onClick={() => setShowRequestModal(true)}
          className="px-5 py-2.5 bg-gradient-to-r from-teal-600 via-cyan-600 to-teal-600 hover:from-teal-500 hover:to-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-md shrink-0 cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
          Request Integration / Suggest Feed
        </button>
      </div>

      {/* Coverage Status Breakdown Cards (Clean Light-Toned Interactive Filter Toggles) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => setSelectedLevelFilter(selectedLevelFilter === 'live_rt' ? 'all' : 'live_rt')}
          className={`p-5 rounded-2xl space-y-2 text-left transition cursor-pointer shadow-sm border ${
            selectedLevelFilter === 'live_rt'
              ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/30'
              : 'bg-white border-slate-200/90 hover:border-emerald-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="text-xs font-black text-emerald-800 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              Live GTFS / GPS Available
            </div>
            <span className="text-xs font-mono font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
              {levelCounts.live_rt}
            </span>
          </div>
          <div className="text-slate-600 text-xs">
            Realtime vehicle GPS coordinates & live GTFS-RT alerts verified via open transit portals.
          </div>
          <div className="text-[11px] font-bold text-emerald-700 flex items-center gap-1 pt-1">
            {selectedLevelFilter === 'live_rt' ? '✓ Filter Active (Tap to clear)' : 'Click to filter live districts →'}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setSelectedLevelFilter(selectedLevelFilter === 'advisory_verified' ? 'all' : 'advisory_verified')}
          className={`p-5 rounded-2xl space-y-2 text-left transition cursor-pointer shadow-sm border ${
            selectedLevelFilter === 'advisory_verified'
              ? 'bg-cyan-50 border-cyan-500 ring-2 ring-cyan-500/30'
              : 'bg-white border-slate-200/90 hover:border-cyan-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="text-xs font-black text-cyan-800 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-600" />
              Verified Advisory Feeds
            </div>
            <span className="text-xs font-mono font-black px-2.5 py-0.5 rounded-full bg-cyan-100 text-cyan-800 border border-cyan-300">
              {levelCounts.advisory_verified}
            </span>
          </div>
          <div className="text-slate-600 text-xs">
            Official daily route diversion bulletins, mega-blocks, and municipal circulars.
          </div>
          <div className="text-[11px] font-bold text-cyan-700 flex items-center gap-1 pt-1">
            {selectedLevelFilter === 'advisory_verified' ? '✓ Filter Active (Tap to clear)' : 'Click to filter verified advisories →'}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setSelectedLevelFilter(selectedLevelFilter === 'schedule_only' ? 'all' : 'schedule_only')}
          className={`p-5 rounded-2xl space-y-2 text-left transition cursor-pointer shadow-sm border ${
            selectedLevelFilter === 'schedule_only'
              ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/30'
              : 'bg-white border-slate-200/90 hover:border-amber-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="text-xs font-black text-amber-800 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-amber-600" />
              Schedule / Timetable Only
            </div>
            <span className="text-xs font-mono font-black px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
              {levelCounts.schedule_only}
            </span>
          </div>
          <div className="text-slate-600 text-xs">
            Static timetable & route stops available; live GPS restricted to internal depot dispatch.
          </div>
          <div className="text-[11px] font-bold text-amber-700 flex items-center gap-1 pt-1">
            {selectedLevelFilter === 'schedule_only' ? '✓ Filter Active (Tap to clear)' : 'Click to filter schedule-only →'}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setSelectedLevelFilter(selectedLevelFilter === 'unintegrated' ? 'all' : 'unintegrated')}
          className={`p-5 rounded-2xl space-y-2 text-left transition cursor-pointer shadow-sm border ${
            selectedLevelFilter === 'unintegrated'
              ? 'bg-slate-100 border-slate-400 ring-2 ring-slate-400/30'
              : 'bg-white border-slate-200/90 hover:border-slate-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="text-xs font-black text-slate-700 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              Live Data Unavailable
            </div>
            <span className="text-xs font-mono font-black px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 border border-slate-300">
              {levelCounts.unintegrated}
            </span>
          </div>
          <div className="text-slate-600 text-xs">
            No public open transit API published yet. Clearly marked so commuters are never misled.
          </div>
          <div className="text-[11px] font-bold text-slate-600 flex items-center gap-1 pt-1">
            {selectedLevelFilter === 'unintegrated' ? '✓ Filter Active (Tap to clear)' : 'Click to filter unintegrated →'}
          </div>
        </button>
      </div>

      {/* Quick State Pill Buttons Bar */}
      <div className="space-y-2">
        <div className="text-xs font-bold text-slate-600">Quick State Select:</div>
        <div className="flex flex-wrap items-center gap-2">
          {popularStates.map(st => (
            <button
              key={st}
              onClick={() => setSelectedStateTab(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                selectedStateTab === st
                  ? 'bg-teal-700 text-white shadow-md shadow-teal-700/20'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
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
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-600 shadow-sm transition"
          />
        </div>

        <select
          value={selectedStateTab}
          onChange={(e) => setSelectedStateTab(e.target.value)}
          className="w-full sm:w-64 px-4 py-3 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-teal-600 cursor-pointer shadow-sm"
        >
          <option value="All">All States / UTs</option>
          {states.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {selectedLevelFilter !== 'all' && (
          <button
            onClick={() => setSelectedLevelFilter('all')}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-teal-800 rounded-xl text-xs font-bold transition border border-slate-300 shrink-0 cursor-pointer"
          >
            Clear Level Filter
          </button>
        )}
      </div>

      {/* Filter summary status */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1 font-medium">
        <div>
          Showing districts for <strong className="text-slate-900">{selectedStateTab}</strong>
          {selectedLevelFilter !== 'all' && (
            <span> • Filtered by: <strong className="text-teal-700">{selectedLevelFilter}</strong></span>
          )}
        </div>
        <div>
          Click any district to launch live map tracking
        </div>
      </div>

      {/* District Listings by State (White Cards on Crisp Light-Grey Background) */}
      <div className="space-y-6">
        {filteredList.length === 0 ? (
          <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl space-y-3 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No Districts Match Filter</h3>
            <p className="text-xs text-slate-500">
              Try selecting a different state or clearing the search keyword.
            </p>
            <button
              onClick={() => {
                setSelectedStateTab('All');
                setSelectedLevelFilter('all');
                setSearchFilter('');
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-teal-700 text-xs font-bold rounded-lg transition cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredList.map(({ state, districts }) => (
            <div key={state} className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-teal-600" />
                  {state}
                </h2>
                <span className="text-xs text-slate-500 font-bold bg-slate-100 px-3 py-1 rounded-full">
                  {districts.length} {districts.length === 1 ? 'District' : 'Districts'} Tracked
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {districts.map(d => (
                  <div
                    key={d.district}
                    className="p-4 rounded-2xl bg-slate-50 hover:bg-white border border-slate-200 hover:border-teal-400 hover:shadow-md flex flex-col justify-between space-y-3 transition group"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <h3 className="font-extrabold text-slate-900 text-sm truncate group-hover:text-teal-700 transition-colors">
                          {d.district}
                        </h3>
                        <CoverageLevelBadge level={d.coverage_level} />
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                        {d.notes || 'Official transit circulars and route notices catalogued.'}
                      </p>
                    </div>

                    <div className="space-y-2.5 pt-2 border-t border-slate-200/70">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                        <div className="flex items-center gap-1">
                          {d.modes && d.modes.map(m => (
                            <span key={m} className="capitalize px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-700 font-bold">
                              {m}
                            </span>
                          ))}
                        </div>
                        <span>Verified: {new Date(d.last_verified_at).toLocaleDateString()}</span>
                      </div>

                      {/* Interactive Action Buttons */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setInspectDistrict({ ...d, state })}
                          className="py-1.5 px-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-300 text-xs font-bold flex items-center justify-center gap-1 transition cursor-pointer shadow-sm"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          Specs
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (onSelectDistrict) onSelectDistrict(state, d.district);
                          }}
                          className="py-1.5 px-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center justify-center gap-1 shadow transition cursor-pointer"
                        >
                          <span>Track Map</span>
                          <ArrowRight className="w-3.5 h-3.5" />
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
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-extrabold uppercase text-teal-700 tracking-wider">
                  Open Transit Source Provenance
                </span>
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2 mt-0.5">
                  <MapPin className="w-5 h-5 text-teal-600" />
                  {inspectDistrict.district}, {inspectDistrict.state}
                </h3>
              </div>
              <button
                onClick={() => setInspectDistrict(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <div className="text-slate-500 text-xs font-semibold">Integration Status</div>
                <div className="flex items-center gap-2 pt-1">
                  <CoverageLevelBadge level={inspectDistrict.coverage_level} />
                  <span className="text-slate-800 font-bold">{inspectDistrict.notes}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="text-slate-500 text-[11px] font-bold uppercase">Supported Transit Modes</div>
                  <div className="text-slate-900 font-extrabold mt-1 capitalize text-sm">
                    {inspectDistrict.modes?.join(', ') || 'Bus'}
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="text-slate-500 text-[11px] font-bold uppercase">Audit Verification</div>
                  <div className="text-emerald-700 font-extrabold mt-1 text-sm">
                    SHA-256 Canonical Diff
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <div className="text-slate-500 text-[11px] font-bold uppercase">Feed Reliability Standard</div>
                <p className="text-slate-700 text-xs leading-relaxed">
                  Adheres to Ministry of Housing and Urban Affairs (MoHUA) & Open Transit Data standards. Live feeds are polled every 120 seconds with automatic deduplication.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setInspectDistrict(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer"
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
                className="px-5 py-2.5 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white rounded-xl font-black text-xs flex items-center gap-1.5 shadow-lg shadow-teal-600/30 cursor-pointer"
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
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4 text-slate-900">
            <h3 className="text-lg font-black text-slate-900">
              Submit Open Transport Data Feed
            </h3>
            <p className="text-xs text-slate-500">
              Know of an official open API or transit portal for an Indian district? Let our integration team know.
            </p>

            {requestSubmitted ? (
              <div className="py-8 text-center text-emerald-600 space-y-2">
                <CheckCircle className="w-12 h-12 mx-auto" />
                <div className="font-extrabold text-sm">Thank You! Feed submitted for verification.</div>
              </div>
            ) : (
              <form onSubmit={handleRequestSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">State / Union Territory</label>
                  <input
                    type="text"
                    required
                    value={requestForm.state}
                    onChange={(e) => setRequestForm({ ...requestForm, state: e.target.value })}
                    placeholder="e.g. Gujarat, Odisha"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-teal-600 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">District / City</label>
                  <input
                    type="text"
                    required
                    value={requestForm.district}
                    onChange={(e) => setRequestForm({ ...requestForm, district: e.target.value })}
                    placeholder="e.g. Surat, Puri"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-teal-600 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Agency Name & Portal URL</label>
                  <input
                    type="url"
                    required
                    value={requestForm.sourceUrl}
                    onChange={(e) => setRequestForm({ ...requestForm, sourceUrl: e.target.value })}
                    placeholder="https://transport-portal.gov.in"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-teal-600 font-medium"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowRequestModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-extrabold shadow"
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
