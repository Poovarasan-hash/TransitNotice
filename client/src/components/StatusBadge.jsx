import React from 'react';
import { Bus, Train, Compass, Anchor, AlertTriangle, Clock, RefreshCw, XCircle, CheckCircle, ShieldCheck } from 'lucide-react';

export function StatusBadge({ status }) {
  const norm = (status || 'active').toLowerCase();

  switch (norm) {
    case 'active':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          Active
        </span>
      );
    case 'upcoming':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950/80 text-amber-300 border border-amber-500/30">
          <Clock className="w-3 h-3 text-amber-300" />
          Upcoming
        </span>
      );
    case 'revised':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
          <RefreshCw className="w-3 h-3 text-cyan-300" />
          Revised
        </span>
      );
    case 'cancelled':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-950/80 text-rose-300 border border-rose-500/30">
          <XCircle className="w-3 h-3 text-rose-300" />
          Cancelled
        </span>
      );
    case 'withdrawn':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-900 text-gray-400 border border-gray-700">
          Withdrawn
        </span>
      );
    case 'expired':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
          Expired
        </span>
      );
  }
}

export function TransportBadge({ type }) {
  const norm = (type || 'bus').toLowerCase();

  switch (norm) {
    case 'metro':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-indigo-950 text-indigo-300 border border-indigo-700/50">
          <Train className="w-3 h-3" />
          Metro
        </span>
      );
    case 'rail':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-950 text-amber-300 border border-amber-700/50">
          <Compass className="w-3 h-3" />
          Rail
        </span>
      );
    case 'ferry':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-teal-950 text-teal-300 border border-teal-700/50">
          <Anchor className="w-3 h-3" />
          Ferry
        </span>
      );
    case 'bus':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-sky-950 text-sky-300 border border-sky-700/50">
          <Bus className="w-3 h-3" />
          Bus
        </span>
      );
  }
}

export function NoticeTypeBadge({ type }) {
  const norm = (type || 'advisory').toLowerCase();

  switch (norm) {
    case 'diversion':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-900/60 text-blue-200 border border-blue-600/40">
          Diversion
        </span>
      );
    case 'delay':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-orange-950/60 text-orange-300 border border-orange-600/40">
          Delay
        </span>
      );
    case 'cancellation':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-950/60 text-red-300 border border-red-600/40">
          Cancellation
        </span>
      );
    case 'interruption':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-purple-950/60 text-purple-300 border border-purple-600/40">
          Interruption
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
          Advisory
        </span>
      );
  }
}

export function CoverageLevelBadge({ level, isLive }) {
  if (isLive || level === 'live_rt') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
        Live GTFS / GPS Available
      </span>
    );
  }

  if (level === 'advisory_verified') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-950 text-cyan-300 border border-cyan-500/40">
        <ShieldCheck className="w-3.5 h-3.5" />
        Verified Advisory Feed
      </span>
    );
  }

  if (level === 'schedule_only') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-950/80 text-amber-300 border border-amber-600/40">
        <Clock className="w-3.5 h-3.5" />
        Schedule/Advisory Data Only
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
      <AlertTriangle className="w-3.5 h-3.5 text-slate-400" />
      Live Data Unavailable
    </span>
  );
}
