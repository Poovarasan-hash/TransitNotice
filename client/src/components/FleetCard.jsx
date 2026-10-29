import React, { useState } from 'react';
import { 
  Bus, Train, Clock, MapPin, Navigation, ShieldCheck, 
  Wifi, Zap, Wind, AlertTriangle, ArrowRight, ChevronDown, ChevronUp, Star, Check 
} from 'lucide-react';

export function FleetCard({ fleet, onTrackMap, onExploreRoute, onViewNotices }) {
  const [expanded, setExpanded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const isDelayed = fleet.status === 'delayed';

  return (
    <div className="w-full bg-white border border-slate-200/90 hover:border-teal-500/50 rounded-2xl shadow-md hover:shadow-xl transition-all duration-200 overflow-hidden group">
      
      {/* Top Banner Tag for Agency & Rating */}
      <div className="bg-slate-50/90 px-5 py-2.5 border-b border-slate-200 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
          <span className="font-extrabold text-[slate-900] uppercase tracking-wide">
            {fleet.operator}
          </span>
          <span className="text-slate-400">•</span>
          <span className="text-teal-700 font-bold">{fleet.district}, {fleet.state}</span>
        </div>

        <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-300 px-2.5 py-0.5 rounded-full text-emerald-800 font-bold text-xs shadow-sm">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
          <span>{fleet.rating}</span>
          <span className="text-emerald-700 font-normal">({fleet.reviewsCount})</span>
        </div>
      </div>

      {/* Main Content Row */}
      <div className="p-5 sm:p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        
        {/* Left: Real Vehicle Thumbnail */}
        <div className="relative w-full lg:w-56 h-36 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 shadow-inner">
          {!imgError ? (
            <img 
              src={fleet.image} 
              alt={fleet.serviceName}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-500">
              {fleet.type === 'metro' ? <Train className="w-10 h-10 text-teal-600 mb-1" /> : <Bus className="w-10 h-10 text-cyan-600 mb-1" />}
              <span className="text-xs font-bold text-slate-700">{fleet.operator}</span>
            </div>
          )}

          {/* Badge over image */}
          <div className="absolute top-2 left-2 bg-white/95 backdrop-blur px-2.5 py-1 rounded-md border border-slate-200 text-[10px] font-black text-slate-800 uppercase tracking-wider shadow-sm">
            {fleet.type === 'metro' ? 'Rapid Metro' : 'AC City Bus'}
          </div>

          <div className="absolute bottom-2 right-2 bg-white/95 backdrop-blur px-2.5 py-0.5 rounded text-[10px] font-bold text-slate-800 border border-slate-200 shadow-sm">
            {fleet.frequency}
          </div>
        </div>

        {/* Middle: Service Info & Timings (Big, Clear RedBus Style) */}
        <div className="flex-1 space-y-3 w-full">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xl sm:text-2xl font-black text-[slate-900] group-hover:text-teal-700 transition-colors">
                {fleet.serviceName}
              </span>
              <span className="px-3 py-0.5 rounded-full text-xs font-extrabold bg-teal-50 text-teal-800 border border-teal-300 shadow-sm">
                Route {fleet.routeNumber}
              </span>
            </div>
            <p className="text-sm text-slate-600 font-semibold mt-0.5">
              {fleet.routeName}
            </p>
          </div>

          {/* Departure & Arrival Schedule Bar */}
          <div className="flex items-center gap-4 py-2.5 border-y border-slate-100">
            <div>
              <div className="text-xl font-black text-[slate-900] font-mono tracking-tight">
                {fleet.departureTime}
              </div>
              <div className="text-xs text-slate-500 font-medium truncate max-w-[130px]">
                {fleet.origin}
              </div>
            </div>

            <div className="flex-1 flex flex-col items-center px-2">
              <span className="text-[11px] text-slate-500 font-bold">{fleet.duration}</span>
              <div className="w-full flex items-center gap-1 my-1">
                <span className="w-2.5 h-2.5 rounded-full border-2 border-teal-600 bg-white"></span>
                <span className="flex-1 h-1 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-600"></span>
              </div>
              <span className="text-xs text-teal-700 font-extrabold">{fleet.totalStops} Stops</span>
            </div>

            <div className="text-right">
              <div className="text-xl font-black text-[slate-900] font-mono tracking-tight">
                {fleet.arrivalTime}
              </div>
              <div className="text-xs text-slate-500 font-medium truncate max-w-[130px]">
                {fleet.destination}
              </div>
            </div>
          </div>

          {/* Live Speed & Instant GPS Location Tag */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-slate-700">
              <MapPin className="w-4 h-4 text-teal-600 shrink-0" />
              <span className="font-bold text-slate-800">{fleet.currentLocation}</span>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="text-slate-500">Speed:</span>
              <span className="font-black text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">{fleet.currentSpeed} km/h</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500">ETA:</span>
              <span className="font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">~{fleet.nextArrivalMinutes} mins</span>
            </div>
          </div>
        </div>

        {/* Right: Status, Fare & Action Buttons */}
        <div className="w-full lg:w-64 border-t lg:border-t-0 lg:border-l border-slate-100 lg:pl-6 pt-4 lg:pt-0 flex flex-col justify-between space-y-3 shrink-0">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Live Fleet Status</div>
            <div className={`text-xs font-bold mt-0.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border shadow-sm ${
              isDelayed ? 'bg-rose-50 text-rose-700 border-rose-300' : 'bg-emerald-50 text-emerald-800 border-emerald-300'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isDelayed ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'}`}></span>
              <span>{fleet.statusText}</span>
            </div>
          </div>

          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fare / Smart Ticket</div>
            <div className="text-base font-black text-[slate-900]">
              {fleet.fare}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={() => onTrackMap(fleet)}
              className="w-full py-2.5 px-3 bg-gradient-to-r from-teal-600 via-cyan-600 to-teal-600 hover:from-teal-500 hover:to-cyan-500 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition cursor-pointer"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Live Track on Map</span>
            </button>

            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="w-full py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 font-bold rounded-xl text-xs flex items-center justify-center gap-1 border border-slate-200 transition cursor-pointer"
            >
              <span>{expanded ? 'Hide Amenities & Specs' : 'View Amenities & Stops'}</span>
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Amenities & Stop Specs Drawer */}
      {expanded && (
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 space-y-3 animate-fadeIn text-xs">
          <div className="font-bold text-slate-800 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            Verified Onboard Features & Regulatory Standards
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {fleet.amenities.map(item => (
              <span
                key={item}
                className="px-3 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                {item}
              </span>
            ))}
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-slate-600 text-xs border-t border-slate-200/80">
            <div>
              Route Origin: <strong className="text-slate-900">{fleet.origin}</strong> • Destination: <strong className="text-slate-900">{fleet.destination}</strong>
            </div>

            <button
              onClick={() => onExploreRoute(fleet)}
              className="text-teal-700 hover:text-teal-900 font-extrabold flex items-center gap-1 cursor-pointer"
            >
              <span>Open in Full National Tracker Drawer</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
