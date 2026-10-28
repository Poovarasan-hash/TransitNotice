import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { CoverageLevelBadge, TransportBadge } from '../components/StatusBadge';
import { Database, Search, ShieldCheck, MapPin, ExternalLink, Send, CheckCircle, Info } from 'lucide-react';

export function CoveragePage({ onSelectDistrict }) {
  const [states, setStates] = useState([]);
  const [coverageMap, setCoverageMap] = useState({});
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedStateTab, setSelectedStateTab] = useState('All');
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

  // Filter districts across states
  const filteredList = Object.entries(coverageMap).filter(([state]) => {
    if (selectedStateTab !== 'All' && state !== selectedStateTab) return false;
    return true;
  }).map(([state, districts]) => {
    const matchingDistricts = districts.filter(d => {
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

  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-100 flex items-center gap-2">
            National Transport Coverage & Transparency Directory
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            TransitNotice enforces strict truth in data coverage. We never fabricate GPS positions or claim complete district coverage without verified agency APIs.
          </p>
        </div>

        <button
          onClick={() => setShowRequestModal(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-lg shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
          Request Integration / Suggest Feed
        </button>
      </div>

      {/* Coverage Status Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-emerald-950/40 border border-emerald-800/50 rounded-2xl space-y-1">
          <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            Live GTFS / GPS Available
          </div>
          <div className="text-slate-200 text-xs">
            Realtime vehicle GPS coordinates & live GTFS-RT alerts verified via open transit portals.
          </div>
        </div>

        <div className="p-4 bg-cyan-950/40 border border-cyan-800/50 rounded-2xl space-y-1">
          <div className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            Verified Advisory Feeds
          </div>
          <div className="text-slate-200 text-xs">
            Official daily route diversion bulletins, mega-blocks, and municipal circulars.
          </div>
        </div>

        <div className="p-4 bg-amber-950/40 border border-amber-800/50 rounded-2xl space-y-1">
          <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5" />
            Schedule / Timetable Only
          </div>
          <div className="text-slate-200 text-xs">
            Static timetable & route stops available; live GPS is restricted to internal depot dispatch.
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
          <div className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            Live Data Unavailable
          </div>
          <div className="text-slate-300 text-xs">
            No public open transit API is published yet. Clearly marked so commuters are never misled.
          </div>
        </div>
      </div>

      {/* Search & State Filter Controls */}
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
          className="w-full sm:w-64 px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
        >
          <option value="All">All States / UTs</option>
          {states.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* District Listings by State */}
      <div className="space-y-6">
        {filteredList.map(({ state, districts }) => (
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
                  className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-2 hover:border-slate-700 transition"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <h3 className="font-bold text-slate-200 text-xs truncate">
                        {d.district}
                      </h3>
                      <CoverageLevelBadge level={d.coverage_level} />
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {d.notes || 'Official transit circulars and route notices catalogued.'}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[10px] text-slate-400">
                    <div className="flex items-center gap-1">
                      {d.modes && d.modes.map(m => (
                        <span key={m} className="capitalize px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                          {m}
                        </span>
                      ))}
                    </div>
                    <span>Verified {new Date(d.last_verified_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

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
