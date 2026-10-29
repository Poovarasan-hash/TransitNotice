import React from 'react';
import { Search, Filter, RotateCcw, MapPin, Bus, Tag, ShieldCheck, AlertCircle } from 'lucide-react';
import { CoverageLevelBadge } from './StatusBadge';

export function FilterBar({
  states = [],
  districts = [],
  selectedState,
  selectedDistrict,
  selectedType,
  selectedNoticeType,
  selectedStatus,
  searchQuery,
  coverageInfo,
  onStateChange,
  onDistrictChange,
  onTypeChange,
  onNoticeTypeChange,
  onStatusChange,
  onSearchChange,
  onReset
}) {
  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-4 text-slate-800">
      {/* Search Input & Reset Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search advisories by route (e.g. 534, Red Line), location, or keyword..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-600 focus:bg-white transition"
          />
        </div>

        <button
          onClick={onReset}
          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition border border-slate-300 shrink-0 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Filters
        </button>
      </div>

      {/* Dropdown Filters Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
        {/* State Selector */}
        <div>
          <label className="block text-slate-600 font-bold mb-1 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-teal-600" /> State / UT
          </label>
          <select
            value={selectedState}
            onChange={(e) => onStateChange(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-teal-600 transition font-medium cursor-pointer"
          >
            <option value="All">All Indian States</option>
            {states.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* District Selector */}
        <div>
          <label className="block text-slate-600 font-bold mb-1 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-emerald-600" /> District
          </label>
          <select
            value={selectedDistrict}
            onChange={(e) => onDistrictChange(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-teal-600 transition font-medium cursor-pointer"
          >
            <option value="All">All Districts</option>
            {districts.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* Transport Type */}
        <div>
          <label className="block text-slate-600 font-bold mb-1 flex items-center gap-1">
            <Bus className="w-3.5 h-3.5 text-blue-600" /> Transport Mode
          </label>
          <select
            value={selectedType}
            onChange={(e) => onTypeChange(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-teal-600 transition font-medium cursor-pointer"
          >
            <option value="All">All Modes</option>
            <option value="bus">Bus</option>
            <option value="metro">Metro Rail</option>
            <option value="rail">Suburban Rail</option>
            <option value="ferry">Ferry / Water Metro</option>
          </select>
        </div>

        {/* Notice Type */}
        <div>
          <label className="block text-slate-600 font-bold mb-1 flex items-center gap-1">
            <Tag className="w-3.5 h-3.5 text-amber-600" /> Notice Type
          </label>
          <select
            value={selectedNoticeType}
            onChange={(e) => onNoticeTypeChange(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-teal-600 transition font-medium cursor-pointer"
          >
            <option value="All">All Notice Types</option>
            <option value="diversion">Diversion</option>
            <option value="delay">Delay</option>
            <option value="cancellation">Cancellation</option>
            <option value="interruption">Interruption</option>
            <option value="advisory">Advisory</option>
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="block text-slate-600 font-bold mb-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-cyan-600" /> Status
          </label>
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-teal-600 transition font-medium cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="active">Active</option>
            <option value="upcoming">Upcoming</option>
            <option value="revised">Revised</option>
            <option value="cancelled">Cancelled</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Dynamic District Coverage Indicator Banner */}
      {selectedDistrict && selectedDistrict !== 'All' && coverageInfo && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs shadow-inner">
          <div className="flex items-center gap-2">
            <CoverageLevelBadge level={coverageInfo.coverage_level} isLive={coverageInfo.is_live_available} />
            <span className="text-slate-800 font-bold">
              {coverageInfo.district}, {coverageInfo.state}
            </span>
          </div>

          <div className="text-slate-600 flex items-center gap-3">
            <span>Agency: <strong className="text-slate-900">{coverageInfo.agency}</strong></span>
            <span>Last Verified: <strong className="text-slate-800">{new Date(coverageInfo.last_checked).toLocaleTimeString()}</strong></span>
          </div>
        </div>
      )}
    </div>
  );
}
