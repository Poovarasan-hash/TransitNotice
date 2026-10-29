import React from 'react';
import { Bus, Train, Compass, Anchor, AlertTriangle, Clock, RefreshCw, XCircle, CheckCircle, ShieldCheck } from 'lucide-react';

export function StatusBadge({ status }) {
  const norm = (status || 'active').toLowerCase();

  switch (norm) {
    case 'active':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-300 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Active
        </span>
      );
    case 'upcoming':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300 shadow-sm">
          <Clock className="w-3 h-3 text-amber-600" />
          Upcoming
        </span>
      );
    case 'revised':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-50 text-cyan-800 border border-cyan-300 shadow-sm">
          <RefreshCw className="w-3 h-3 text-cyan-600" />
          Revised
        </span>
      );
    case 'cancelled':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-300 shadow-sm">
          <XCircle className="w-3 h-3 text-rose-600" />
          Cancelled
        </span>
      );
    case 'withdrawn':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-300 shadow-sm">
          Withdrawn
        </span>
      );
    case 'expired':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
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
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm">
          <Train className="w-3 h-3 text-indigo-600" />
          Metro
        </span>
      );
    case 'rail':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 shadow-sm">
          <Compass className="w-3 h-3 text-amber-600" />
          Rail
        </span>
      );
    case 'ferry':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200 shadow-sm">
          <Anchor className="w-3 h-3 text-teal-600" />
          Ferry
        </span>
      );
    case 'bus':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200 shadow-sm">
          <Bus className="w-3 h-3 text-sky-600" />
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
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
          Diversion
        </span>
      );
    case 'delay':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200">
          Delay
        </span>
      );
    case 'cancellation':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
          Cancellation
        </span>
      );
    case 'interruption':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
          Interruption
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
          Advisory
        </span>
      );
  }
}

export function CoverageLevelBadge({ level, isLive }) {
  if (isLive || level === 'live_rt') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-sm">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
        Live GTFS / GPS Available
      </span>
    );
  }

  if (level === 'advisory_verified') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-50 text-cyan-800 border border-cyan-300 shadow-sm">
        <ShieldCheck className="w-3.5 h-3.5 text-cyan-600" />
        Verified Advisory Feed
      </span>
    );
  }

  if (level === 'schedule_only') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300 shadow-sm">
        <Clock className="w-3.5 h-3.5 text-amber-600" />
        Schedule / Timetable Only
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-300">
      <AlertTriangle className="w-3.5 h-3.5 text-slate-500" />
      Live Data Unavailable
    </span>
  );
}
