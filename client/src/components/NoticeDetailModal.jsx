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
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Clean White Modal Header */}
        <div className="flex items-center justify-between px-6 py-4.5 bg-white border-b border-slate-200 text-slate-900 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200 shadow-sm">
              <ShieldCheck className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                Official Transit Advisory Bulletin
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                Verified Government Transit Feed & Provenance
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm bg-white">
          {loading && (
            <div className="py-16 text-center text-slate-500">
              <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              Loading official bulletin details...
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
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
                  <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    ID: #{data.notice.id}
                  </span>
                </div>

                <h1 className="text-xl font-black text-[slate-900] leading-snug">
                  {data.notice.title}
                </h1>
              </div>

              {/* Full Description / Summary */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Official Advisory Text
                </h3>
                <p className="text-slate-800 text-sm leading-relaxed whitespace-pre-line font-medium">
                  {data.notice.summary}
                </p>
              </div>

              {/* Key Metadata Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-teal-700">
                    <Building2 className="w-4 h-4" />
                    Issuing Transport Authority
                  </div>
                  <div className="text-slate-900 font-bold text-sm">
                    {data.notice.agency_full_name || data.notice.agency_name}
                  </div>
                  <div className="text-xs text-slate-600">
                    District: <span className="font-semibold text-slate-800">{data.notice.district}, {data.notice.state}</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-700">
                    <Calendar className="w-4 h-4" />
                    Validity Schedule Window
                  </div>
                  <div className="text-xs text-slate-700 space-y-1">
                    <div><span className="font-semibold text-slate-900">Effective:</span> {new Date(data.notice.valid_from).toLocaleString('en-IN')}</div>
                    <div>
                      <span className="font-semibold text-slate-900">Valid Until:</span> {data.notice.valid_to ? new Date(data.notice.valid_to).toLocaleString('en-IN') : 'Ongoing until further notice'}
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-rose-700">
                    <MapPin className="w-4 h-4" />
                    Affected Corridors & Stoppages
                  </div>
                  <div className="text-slate-900 font-bold text-xs">
                    {data.notice.affected_area || 'Entire Route Network'}
                  </div>
                  {data.notice.route_short_name && (
                    <div className="text-xs text-teal-800 font-semibold">
                      Route: {data.notice.route_short_name} ({data.notice.route_long_name})
                    </div>
                  )}
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
                    <Clock className="w-4 h-4" />
                    Data Provenance & Freshness
                  </div>
                  <div className="text-xs text-slate-700 space-y-1">
                    <div>Observed: <span className="font-semibold text-slate-900">{new Date(data.notice.observed_time).toLocaleString('en-IN')}</span></div>
                    <div>Last Confirmed: <span className="font-semibold text-slate-900">{new Date(data.notice.last_confirmed_time).toLocaleString('en-IN')}</span></div>
                  </div>
                </div>
              </div>

              {/* Source Link & Verification Banner */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-teal-50 border border-teal-200 rounded-2xl">
                <div>
                  <div className="text-xs font-bold text-teal-900">Official Government / Agency Source</div>
                  <div className="text-xs text-teal-700 truncate max-w-md font-mono mt-0.5">
                    {data.notice.source_url}
                  </div>
                </div>
                <a
                  href={data.notice.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-sm hover:shadow shrink-0"
                >
                  Visit Official Bulletin
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Revision History Timeline */}
              {data.revisions && data.revisions.length > 0 && (
                <div className="border-t border-slate-200 pt-4">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <History className="w-4 h-4 text-teal-600" />
                    Notice Revision & Audit Trail ({data.revisions.length})
                  </h3>

                  <div className="space-y-3">
                    {data.revisions.map((rev) => (
                      <div key={rev.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-slate-900">
                            Revision {rev.revision_id} ({rev.change_type.toUpperCase()})
                          </span>
                          <span className="text-slate-500 font-medium">
                            {new Date(rev.recorded_at).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="text-slate-700 mb-1.5 font-medium">{rev.change_summary}</div>
                        <div className="font-mono text-[10px] text-slate-500 truncate flex items-center gap-1">
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
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition shadow-sm"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}
