import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { INDIA_MAP_CENTER, INDIA_DEFAULT_ZOOM, STATE_COORDINATES, DISTRICT_COORDINATES, STATE_POLYGONS } from '../data/indiaGeo';
import { Bus, Train, AlertTriangle, Layers, Maximize2, Shield, Eye, Compass } from 'lucide-react';

// Custom icons using Leaflet DivIcon
const createVehicleIcon = (type, label, status) => {
  const isDelayed = status === 'delayed';
  const color = isDelayed ? '#EF4444' : '#10B981';
  
  return L.divIcon({
    className: 'custom-vehicle-marker',
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center;">
        <span class="pulse-ring" style="border-color: ${color};"></span>
        <div style="
          background: #0F172A;
          border: 2px solid ${color};
          border-radius: 50%;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: ${color};
          box-shadow: 0 0 10px ${color}88;
        ">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <rect x="3" y="6" width="18" height="12" rx="2"></rect>
            <circle cx="7" cy="18" r="2"></circle>
            <circle cx="17" cy="18" r="2"></circle>
          </svg>
        </div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });
};

const createStopIcon = (name, sequence) => {
  return L.divIcon({
    className: 'custom-stop-marker',
    html: `
      <div style="
        background: #1E293B;
        border: 2px solid #38BDF8;
        border-radius: 4px;
        padding: 1px 4px;
        color: #F8FAFC;
        font-size: 10px;
        font-weight: 600;
        white-space: nowrap;
        display: flex;
        align-items: center;
        gap: 3px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.5);
      ">
        <span style="background: #0284C7; border-radius: 2px; padding: 0 3px; font-size: 9px;">${sequence}</span>
        ${name.length > 18 ? name.slice(0, 16) + '..' : name}
      </div>
    `,
    iconSize: [80, 20],
    iconAnchor: [40, 10]
  });
};

const createAdvisoryIcon = () => {
  return L.divIcon({
    className: 'custom-advisory-marker',
    html: `
      <div style="
        background: #7F1D1D;
        border: 2px solid #EF4444;
        border-radius: 50%;
        width: 26px;
        height: 26px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #FEE2E2;
        box-shadow: 0 0 12px rgba(239, 68, 68, 0.7);
        animation: pulse 1.5s infinite;
      ">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13]
  });
};

export function MapView({
  selectedState,
  selectedDistrict,
  routes = [],
  vehicles = [],
  notices = [],
  stops = [],
  onSelectNotice,
  onSelectRoute
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  // Layer groups
  const routesLayerRef = useRef(L.layerGroup());
  const vehiclesLayerRef = useRef(L.layerGroup());
  const stopsLayerRef = useRef(L.layerGroup());
  const advisoryLayerRef = useRef(L.layerGroup());
  const boundariesLayerRef = useRef(L.layerGroup());

  // Visibility toggles
  const [showVehicles, setShowVehicles] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);
  const [showStops, setShowStops] = useState(true);
  const [showAdvisories, setShowAdvisories] = useState(true);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: INDIA_MAP_CENTER,
      zoom: INDIA_DEFAULT_ZOOM,
      zoomControl: false
    });

    // Dark CartoDB tile layer with high accessibility contrast
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19
    }).addTo(map);

    L.control.zoom({ position: 'topright' }).addTo(map);

    routesLayerRef.current.addTo(map);
    vehiclesLayerRef.current.addTo(map);
    stopsLayerRef.current.addTo(map);
    advisoryLayerRef.current.addTo(map);
    boundariesLayerRef.current.addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update center when state / district changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (selectedDistrict && DISTRICT_COORDINATES[selectedDistrict]) {
      const coord = DISTRICT_COORDINATES[selectedDistrict];
      map.flyTo(coord, 12, { duration: 1.2 });
    } else if (selectedState && STATE_COORDINATES[selectedState]) {
      const { center, zoom } = STATE_COORDINATES[selectedState];
      map.flyTo(center, zoom, { duration: 1.2 });
    } else {
      map.flyTo(INDIA_MAP_CENTER, INDIA_DEFAULT_ZOOM, { duration: 1 });
    }
  }, [selectedState, selectedDistrict]);

  // Render State Boundaries
  useEffect(() => {
    const layer = boundariesLayerRef.current;
    layer.clearLayers();

    if (selectedState && STATE_POLYGONS[selectedState]) {
      const polygon = L.polygon(STATE_POLYGONS[selectedState], {
        color: '#06B6D4',
        weight: 2,
        opacity: 0.6,
        fillColor: '#0891B2',
        fillOpacity: 0.08,
        dashArray: '6, 6'
      });
      polygon.bindTooltip(`<b>${selectedState}</b> Boundary`, { sticky: true });
      layer.addLayer(polygon);
    }
  }, [selectedState]);

  // Render Routes
  useEffect(() => {
    const layer = routesLayerRef.current;
    layer.clearLayers();
    if (!showRoutes) return;

    routes.forEach(route => {
      if (route.coordinates && Array.isArray(route.coordinates) && route.coordinates.length > 0) {
        // coordinates are [lng, lat]
        const latLngs = route.coordinates.map(pt => [pt[1], pt[0]]);
        const polyline = L.polyline(latLngs, {
          color: route.color || '#06B6D4',
          weight: 4,
          opacity: 0.85
        });

        polyline.bindPopup(`
          <div style="font-family: sans-serif; min-width: 180px;">
            <div style="font-size: 11px; text-transform: uppercase; color: #64748B; font-weight: 700;">${route.transport_type.toUpperCase()} ROUTE</div>
            <div style="font-size: 14px; font-weight: bold; color: #0F172A; margin: 2px 0;">${route.route_short_name}: ${route.route_long_name}</div>
            <div style="font-size: 12px; color: #334155;">From: ${route.origin || 'Start'}</div>
            <div style="font-size: 12px; color: #334155;">To: ${route.destination || 'End'}</div>
          </div>
        `);

        polyline.on('click', () => {
          if (onSelectRoute) onSelectRoute(route);
        });

        layer.addLayer(polyline);
      }
    });
  }, [routes, showRoutes, onSelectRoute]);

  // Render Stops
  useEffect(() => {
    const layer = stopsLayerRef.current;
    layer.clearLayers();
    if (!showStops) return;

    stops.forEach(stop => {
      if (stop.lat && stop.lng) {
        const marker = L.marker([stop.lat, stop.lng], {
          icon: createStopIcon(stop.stop_name, stop.stop_sequence)
        });

        marker.bindPopup(`
          <div style="font-family: sans-serif;">
            <div style="font-size: 10px; color: #64748B;">STOP #${stop.stop_sequence}</div>
            <div style="font-weight: bold; color: #0F172A;">${stop.stop_name}</div>
          </div>
        `);

        layer.addLayer(marker);
      }
    });
  }, [stops, showStops]);

  // Render Live Vehicles
  useEffect(() => {
    const layer = vehiclesLayerRef.current;
    layer.clearLayers();
    if (!showVehicles) return;

    vehicles.forEach(v => {
      if (v.lat && v.lng) {
        const marker = L.marker([v.lat, v.lng], {
          icon: createVehicleIcon(v.transport_type, v.vehicle_label, v.status)
        });

        marker.bindPopup(`
          <div style="font-family: sans-serif; min-width: 200px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
              <span style="font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 4px; background: ${v.status === 'delayed' ? '#FEE2E2' : '#DCFCE7'}; color: ${v.status === 'delayed' ? '#991B1B' : '#166534'};">
                ${v.status === 'delayed' ? 'DELAYED' : 'ON SCHEDULE'}
              </span>
              <span style="font-size: 11px; color: #64748B;">${v.speed_kmh} km/h</span>
            </div>
            <div style="font-weight: bold; font-size: 13px; color: #0F172A;">${v.vehicle_label}</div>
            <div style="font-size: 12px; color: #334155; margin-top: 2px;">Route: ${v.route_short_name || v.route_id}</div>
            <div style="font-size: 11px; color: #64748B; margin-top: 4px;">Live GPS Updated: ${new Date(v.last_updated_at).toLocaleTimeString()}</div>
          </div>
        `);

        layer.addLayer(marker);
      }
    });
  }, [vehicles, showVehicles]);

  // Render Affected Advisory Zones & Diversions
  useEffect(() => {
    const layer = advisoryLayerRef.current;
    layer.clearLayers();
    if (!showAdvisories) return;

    notices.forEach(n => {
      if (n.geojson) {
        if (n.geojson.type === 'LineString' && n.geojson.coordinates) {
          const latLngs = n.geojson.coordinates.map(pt => [pt[1], pt[0]]);
          const line = L.polyline(latLngs, {
            color: '#EF4444',
            weight: 5,
            dashArray: '8, 8',
            opacity: 0.9
          });

          // Marker at midpoint
          const midPt = latLngs[Math.floor(latLngs.length / 2)];
          const advMarker = L.marker(midPt, { icon: createAdvisoryIcon() });

          const popupContent = `
            <div style="font-family: sans-serif; min-width: 220px;">
              <div style="font-size: 10px; font-weight: bold; color: #DC2626; text-transform: uppercase;">AFFECTED ADVISORY ZONE</div>
              <div style="font-weight: bold; font-size: 13px; color: #0F172A; margin: 4px 0;">${n.title}</div>
              <div style="font-size: 11px; color: #475569; margin-bottom: 6px;">${n.summary.slice(0, 100)}...</div>
              <div style="font-size: 10px; color: #64748B;">Area: ${n.affected_area}</div>
            </div>
          `;

          line.bindPopup(popupContent);
          advMarker.bindPopup(popupContent);

          if (onSelectNotice) {
            line.on('click', () => onSelectNotice(n));
            advMarker.on('click', () => onSelectNotice(n));
          }

          layer.addLayer(line);
          layer.addLayer(advMarker);
        } else if (n.geojson.type === 'Point' && n.geojson.coordinates) {
          const pt = [n.geojson.coordinates[1], n.geojson.coordinates[0]];
          const advMarker = L.marker(pt, { icon: createAdvisoryIcon() });
          advMarker.bindPopup(`
            <div style="font-family: sans-serif; min-width: 200px;">
              <div style="font-size: 10px; font-weight: bold; color: #DC2626;">ACTIVE INCIDENT</div>
              <div style="font-weight: bold; font-size: 13px; color: #0F172A;">${n.title}</div>
            </div>
          `);
          layer.addLayer(advMarker);
        }
      }
    });
  }, [notices, showAdvisories, onSelectNotice]);

  const resetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(INDIA_MAP_CENTER, INDIA_DEFAULT_ZOOM, { duration: 1 });
    }
  };

  return (
    <div className="relative w-full h-full min-h-[500px] rounded-xl overflow-hidden border border-slate-800 shadow-xl bg-slate-950">
      {/* Map DOM node */}
      <div ref={mapContainerRef} className="w-full h-full" style={{ minHeight: '500px' }} />

      {/* Map Control Bar (Top Left) */}
      <div className="absolute top-4 left-4 z-[1000] flex flex-wrap gap-2">
        <button
          onClick={resetView}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 text-xs font-semibold rounded-lg shadow-lg border border-slate-700 backdrop-blur transition"
          title="Reset to All India View"
        >
          <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
          All India
        </button>

        <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-700 shadow-lg backdrop-blur text-xs">
          <button
            onClick={() => setShowVehicles(!showVehicles)}
            className={`px-2.5 py-1 rounded transition flex items-center gap-1 font-medium ${
              showVehicles ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${showVehicles ? 'bg-emerald-400' : 'bg-slate-600'}`}></span>
            Live Vehicles ({vehicles.length})
          </button>

          <button
            onClick={() => setShowRoutes(!showRoutes)}
            className={`px-2.5 py-1 rounded transition flex items-center gap-1 font-medium ${
              showRoutes ? 'bg-sky-950 text-sky-300 border border-sky-500/40' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${showRoutes ? 'bg-sky-400' : 'bg-slate-600'}`}></span>
            Routes ({routes.length})
          </button>

          <button
            onClick={() => setShowAdvisories(!showAdvisories)}
            className={`px-2.5 py-1 rounded transition flex items-center gap-1 font-medium ${
              showAdvisories ? 'bg-rose-950 text-rose-300 border border-rose-500/40' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${showAdvisories ? 'bg-rose-400' : 'bg-slate-600'}`}></span>
            Advisories
          </button>
        </div>
      </div>

      {/* Floating Legend (Bottom Right) */}
      <div className="absolute bottom-4 right-4 z-[1000] bg-slate-900/95 border border-slate-800 p-3 rounded-lg shadow-2xl backdrop-blur text-xs max-w-xs text-slate-300">
        <div className="flex items-center gap-1.5 font-bold text-slate-100 mb-2 pb-1.5 border-b border-slate-800">
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          Map Symbols & Legend
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full border-2 border-emerald-400 bg-emerald-950"></span>
            <span>Live Vehicle Position (Real-time GPS)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full border-2 border-red-500 bg-red-950"></span>
            <span>Delayed Vehicle Alert</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 h-1 rounded bg-cyan-400"></span>
            <span>Planned Transit Route Corridor</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 h-1 border-t-2 border-dashed border-red-500"></span>
            <span>Affected Advisory Area / Diversion Path</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-2 bg-sky-900 border border-sky-400 rounded-sm"></span>
            <span>Transit Stop / Interchange Station</span>
          </div>
        </div>
      </div>
    </div>
  );
}
