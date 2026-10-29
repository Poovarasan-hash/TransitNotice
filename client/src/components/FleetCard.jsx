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
    <div className="w-full bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-200 overflow-hidden group">
      
      {/* Top Banner Tag for Agency & Rating */}
      <div className="bg-slate-950 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
          <span className="font-bold text-slate-200 uppercase tracking-wide">
            {fleet.operator}
          </span>
          <span className="text-slate-500">•</span>
          <span className="text-cyan-400 font-semibold">{fleet.district}, {fleet.state}</span>
        </div>

        <div className="flex items-center gap-1.5 bg-emerald-950/80 border border-emerald-600/40 px-2 py-0.5 rounded-lg text-emerald-300 font-bold text-[11px]">
          <Star className="w-3 h-3 fill-emerald-400 text-emerald-400" />
          <span>{fleet.rating}</span>
          <span className="text-emerald-500/80 font-normal">({fleet.reviewsCount})</span>
        </div>
      </div>

      {/* Main Content Row */}
      <div className="p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        
        {/* Left: Real Vehicle Thumbnail */}
        <div className="relative w-full lg:w-56 h-36 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shrink-0">
          {!imgError ? (
            <img 
              src={fleet.image} 
              alt={fleet.serviceName}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-slate-950 to-slate-800 text-slate-400">
              {fleet.type === 'metro' ? <Train className="w-10 h-10 text-cyan-400 mb-1" /> : <Bus className="w-10 h-10 text-sky-400 mb-1" />}
              <span className="text-xs font-bold text-slate-300">{fleet.operator}</span>
            </div>
          )}

          {/* Badge over image */}
          <div className="absolute top-2 left-2 bg-slate-950/90 backdrop-blur px-2.5 py-1 rounded-md border border-slate-700 text-[10px] font-black text-cyan-300 uppercase tracking-wider">
            {fleet.type === 'metro' ? 'Rapid Metro' : 'AC City Bus'}
          </div>

          <div className="absolute bottom-2 right-2 bg-slate-900/90 backdrop-blur px-2 py-0.5 rounded text-[10px] font-bold text-slate-300 border border-slate-800">
            {fleet.frequency}
          </div>
        </div>

        {/* Middle: Service Info & Timings (Big, Clear RedBus Style) */}
        <div className="flex-1 space-y-3 w-full">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xl font-black text-white group-hover:text-cyan-400 transition-colors">
                {fleet.serviceName}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-cyan-950 text-cyan-300 border border-cyan-800">
                Route {fleet.routeNumber}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              {fleet.routeName}
            </p>
          </div>

          {/* Departure & Arrival Schedule Bar */}
          <div className="flex items-center gap-4 py-2 border-y border-slate-800/80">
            <div>
              <div className="text-lg font-black text-slate-100 font-mono">
                {fleet.departureTime}
              </div>
              <div className="text-[11px] text-slate-400 truncate max-w-[120px]">
                {fleet.origin}
              </div>
            </div>

            <div className="flex-1 flex flex-col items-center px-2">
              <span className="text-[10px] text-slate-500 font-semibold">{fleet.duration}</span>
              <div className="w-full flex items-center gap-1 my-1">
                <span className="w-2 h-2 rounded-full border border-cyan-400 bg-slate-950"></span>
                <span className="flex-1 h-0.5 bg-gradient-to-r from-cyan-500 to-teal-500"></span>
                <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              </div>
              <span className="text-[10px] text-cyan-400 font-bold">{fleet.totalStops} Stops</span>
            </div>

            <div className="text-right">
              <div className="text-lg font-black text-slate-100 font-mono">
                {fleet.arrivalTime}
              </div>
              <div className="text-[11px] text-slate-400 truncate max-w-[120px]">
                {fleet.destination}
              </div>
            </div>
          </div>

          {/* Live Speed & Instant GPS Location Tag */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="font-semibold text-slate-200">{fleet.currentLocation}</span>
            </div>

            <div className="flex items-center gap-2 font-mono text-[11px]">
              <span className="text-slate-400">Speed:</span>
              <span className="font-bold text-cyan-400">{fleet.currentSpeed} km/h</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400">ETA:</span>
              <span className="font-bold text-emerald-400">~{fleet.nextArrivalMinutes} mins</span>
            </div>
          </div>
        </div>

        {/* Right: Status, Fare & Action Buttons */}
        <div className="w-full lg:w-64 border-t lg:border-t-0 lg:border-l border-slate-800 lg:pl-6 pt-4 lg:pt-0 flex flex-col justify-between space-y-3 shrink-0">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase">Live Fleet Status</div>
            <div className={`text-xs font-bold mt-0.5 flex items-center gap-1.5 ${
              isDelayed ? 'text-red-400' : 'text-emerald-400'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isDelayed ? 'bg-red-400' : 'bg-emerald-400 animate-pulse'}`}></span>
              <span>{fleet.statusText}</span>
            </div>
          </div>

          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase">Ticket / Pass</div>
            <div className="text-sm font-extrabold text-slate-100">
              {fleet.fare}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={() => onTrackMap(fleet)}
              className="w-full py-2.5 px-3 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/30 transition cursor-pointer"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Live Track on Map</span>
            </button>

            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="w-full py-2 px-3 bg-slate-950 hover:bg-slate-850 text-slate-300 hover:text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1 border border-slate-800 transition cursor-pointer"
            >
              <span>{expanded ? 'Hide Amenities & Specs' : 'View Amenities & Stops'}</span>
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Amenities & Stop Specs Drawer */}
      {expanded && (
        <div className="bg-slate-950/80 px-6 py-4 border-t border-slate-800 space-y-3 animate-fadeIn text-xs">
          <div className="font-bold text-slate-300 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            Verified Onboard Features & Regulatory Standards
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {fleet.amenities.map(item => (
              <span
                key={item}
                className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-medium flex items-center gap-1.5"
              >
                <Check className="w-3 h-3 text-emerald-400" />
                {item}
              </span>
            ))}
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-slate-400 text-[11px]">
            <div>
              Route Origin: <strong className="text-white">{fleet.origin}</strong> • Destination: <strong className="text-white">{fleet.destination}</strong>
            </div>

            <button
              onClick={() => onExploreRoute(fleet)}
              className="text-cyan-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>Open in Full National Tracker Drawer</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
