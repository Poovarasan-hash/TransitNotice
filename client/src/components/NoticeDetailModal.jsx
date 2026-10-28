import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { StatusBadge, TransportBadge, NoticeTypeBadge } from './StatusBadge';
import { X, ExternalLink, Calendar, MapPin, Building2, ShieldCheck, Clock, Hash, History, AlertTriangle } from 'lucide-react';

export function NoticeDetailModal({ noticeId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!noticeId) return;
    setLoading(true);
    api.getNoticeDetail(noticeId)
      .then(res => setData(res))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [noticeId]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!noticeId) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-slate-100">
              Official Service Advisory Details
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {loading && (
            <div className="py-16 text-center text-slate-400">
              <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              Loading official bulletin details...
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-950/50 border border-red-800 rounded-xl text-red-300 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {data && data.notice && (
            <>
              {/* Badges & ID */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge status={data.notice.status} />
                    <TransportBadge type={data.notice.transport_type} />
                    <NoticeTypeBadge type={data.notice.notice_type} />
                  </div>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                    ID: {data.notice.id}
                  </span>
                </div>

                <h1 className="text-xl font-bold text-slate-100 leading-snug">
                  {data.notice.title}
                </h1>
              </div>

              {/* Full Description / Summary */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Official Advisory Text
                </h3>
                <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-line">
                  {data.notice.summary}
                </p>
              </div>

              {/* Key Metadata Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 bg-slate-800/40 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                    <Building2 className="w-4 h-4 text-cyan-400" />
                    Issuing Transport Authority
                  </div>
                  <div className="text-slate-100 font-medium">
                    {data.notice.agency_full_name || data.notice.agency_name}
                  </div>
                  <div className="text-xs text-slate-400">
                    District: {data.notice.district}, {data.notice.state}
                  </div>
                </div>

                <div className="p-3.5 bg-slate-800/40 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                    <Calendar className="w-4 h-4 text-amber-400" />
                    Validity Window
                  </div>
                  <div className="text-xs text-slate-300">
                    <div><strong>Effective From:</strong> {new Date(data.notice.valid_from).toLocaleString('en-IN')}</div>
                    <div className="mt-1">
                      <strong>Effective To:</strong> {data.notice.valid_to ? new Date(data.notice.valid_to).toLocaleString('en-IN') : 'Ongoing until further notice'}
                    </div>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-800/40 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                    <MapPin className="w-4 h-4 text-rose-400" />
                    Affected Corridors & Stoppages
                  </div>
                  <div className="text-slate-200 font-medium text-xs">
                    {data.notice.affected_area || 'Entire Route Network'}
                  </div>
                  {data.notice.route_short_name && (
                    <div className="text-xs text-cyan-300">
                      Route: {data.notice.route_short_name} ({data.notice.route_long_name})
                    </div>
                  )}
                </div>

                <div className="p-3.5 bg-slate-800/40 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                    <Clock className="w-4 h-4 text-emerald-400" />
                    Data Provenance & Freshness
                  </div>
                  <div className="text-xs text-slate-300 space-y-1">
                    <div>Observed: {new Date(data.notice.observed_time).toLocaleString('en-IN')}</div>
                    <div>Last Confirmed: {new Date(data.notice.last_confirmed_time).toLocaleString('en-IN')}</div>
                  </div>
                </div>
              </div>

              {/* Source Link & Verification */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-cyan-950/30 border border-cyan-800/40 rounded-xl">
                <div>
                  <div className="text-xs font-semibold text-cyan-300">Official Government / Agency Source</div>
                  <div className="text-xs text-slate-400 truncate max-w-md">
                    {data.notice.source_url}
                  </div>
                </div>
                <a
                  href={data.notice.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition shadow-lg shrink-0"
                >
                  Visit Official Bulletin
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Revision History Timeline */}
              {data.revisions && data.revisions.length > 0 && (
                <div className="border-t border-slate-800 pt-4">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <History className="w-4 h-4 text-cyan-400" />
                    Notice Revision & Audit History ({data.revisions.length})
                  </h3>

                  <div className="space-y-3">
                    {data.revisions.map((rev) => (
                      <div key={rev.id} className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-slate-200">
                            Revision {rev.revision_id} ({rev.change_type.toUpperCase()})
                          </span>
                          <span className="text-slate-500">
                            {new Date(rev.recorded_at).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="text-slate-400 mb-1">{rev.change_summary}</div>
                        <div className="font-mono text-[10px] text-slate-400 truncate flex items-center gap-1">
                          <Hash className="w-3 h-3 text-slate-400" />
                          SHA-256: {rev.content_hash}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-900/90 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}
