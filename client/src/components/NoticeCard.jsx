import React from 'react';
import { StatusBadge, TransportBadge, NoticeTypeBadge } from './StatusBadge';
import { Calendar, MapPin, ExternalLink, Clock, History, AlertCircle, ArrowRight } from 'lucide-react';

export function NoticeCard({ notice, onSelect }) {
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Ongoing / Open-ended';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  };

  const getRelativeTime = (isoString) => {
    if (!isoString) return '';
    try {
      const diffMin = Math.round((Date.now() - new Date(isoString).getTime()) / 60000);
      if (diffMin < 1) return 'just now';
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHours = Math.round(diffMin / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.round(diffHours / 24);
      return `${diffDays}d ago`;
    } catch (e) {
      return '';
    }
  };

  return (
    <div
      onClick={() => onSelect && onSelect(notice)}
      className="group relative bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-teal-500/50 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between"
    >
      <div>
        {/* Top Badges Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <StatusBadge status={notice.status} />
            <TransportBadge type={notice.transport_type} />
            <NoticeTypeBadge type={notice.notice_type} />
            {notice.revision_id > 1 && (
              <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 flex items-center gap-1">
                <History className="w-3 h-3 text-teal-600" /> Rev {notice.revision_id}
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-400 font-mono font-medium">
            {notice.id}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-base font-extrabold text-[slate-900] group-hover:text-teal-700 transition-colors line-clamp-2 mb-2">
          {notice.title}
        </h3>

        {/* Summary Snippet */}
        <p className="text-sm text-slate-600 line-clamp-2 mb-4 leading-relaxed font-normal">
          {notice.summary}
        </p>

        {/* Context Information */}
        <div className="space-y-1.5 text-xs text-slate-500 border-t border-slate-100 pt-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <span className="truncate">
              <strong className="text-slate-800">{notice.district}, {notice.state}</strong>
              {notice.affected_area && ` — ${notice.affected_area}`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>
              Valid: <strong className="text-slate-800">{formatDate(notice.valid_from)}</strong> to <strong className="text-slate-800">{formatDate(notice.valid_to)}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Footer / Provenance info */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
        <div className="flex items-center gap-1.5 truncate max-w-[70%]">
          <span className="w-2 h-2 rounded-full bg-teal-500 shrink-0"></span>
          <span className="truncate font-semibold text-slate-700">{notice.agency_name || notice.agency_id}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span title={`Confirmed ${notice.last_confirmed_time}`}>
            Observed {getRelativeTime(notice.observed_time)}
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-teal-600 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </div>
  );
}
