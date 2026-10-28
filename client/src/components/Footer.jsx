import React from 'react';
import { Bus, ShieldCheck, Heart, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';

export function Footer({ onNavigate }) {
  return (
    <footer className="bg-slate-950 border-t border-slate-800 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: About */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-cyan-600 flex items-center justify-center text-white font-bold">
                <Bus className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold text-slate-100 font-mono">
                Transit<span className="text-cyan-400">Notice</span>
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              A public service intelligence platform tracking bus, metro, and suburban rail advisories, route diversions, and real-time updates across India.
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              100% Permitted Open Data & GTFS Feeds
            </div>
          </div>

          {/* Col 2: Navigation */}
          <div>
            <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] mb-3">
              Platform Features
            </h4>
            <ul className="space-y-2 text-[11px]">
              <li>
                <button onClick={() => onNavigate('tracker')} className="hover:text-cyan-400 transition">
                  Interactive India Transit Map
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('coverage')} className="hover:text-cyan-400 transition">
                  National Coverage Directory
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('dashboard')} className="hover:text-cyan-400 transition">
                  Commuter Advisory Dashboard
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('tracker')} className="hover:text-cyan-400 transition">
                  Active Diversions & Roadblocks
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Connected Feeds */}
          <div>
            <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] mb-3">
              Official Connected Feeds
            </h4>
            <ul className="space-y-2 text-[11px]">
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>Delhi Open Transit Data (DTC & DMRC)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>Bengaluru BMTC & BMRCL Namma Metro</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                <span>BEST Mumbai & Maha Mumbai Metro</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                <span>Chennai MTC & CMRL Metro Rail</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                <span>Kerala KSRTC SWIFT & Kochi Water Metro</span>
              </li>
            </ul>
          </div>

          {/* Col 4: Integrity Policy */}
          <div className="space-y-2 text-[11px]">
            <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] mb-3">
              Data Integrity Policy
            </h4>
            <p className="leading-relaxed text-slate-400">
              TransitNotice never scrapes restricted government portals, circumvents CAPTCHAs, or invents real-time positions. Where live API feeds are unavailable, services are explicitly labelled as <strong className="text-amber-400">Schedule/Advisory only</strong>.
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>
            &copy; {new Date().getFullYear()} TransitNotice India. Built for Public Good & Mini Project 2.
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <RefreshCw className="w-3 h-3 text-cyan-400" />
              Automated 2-Min Polling & Hash Diffing
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
