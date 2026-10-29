import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { INDIA_MAP_CENTER, INDIA_DEFAULT_ZOOM, STATE_COORDINATES, DISTRICT_COORDINATES, STATE_POLYGONS } from '../data/indiaGeo';
import { 
  Bus, Train, AlertTriangle, Layers, Maximize2, Shield, Eye, Compass, 
  Navigation, Radio, Sparkles, Map as MapIcon, Satellite, Clock, ArrowRight, Play, Pause
} from 'lucide-react';

// Google Maps Tile Layers
const MAP_STYLES = {
  google_streets: {
    name: 'Google Transit / Streets',
    url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    maxZoom: 20,
    attribution: '&copy; Google Maps Platform'
  },
  google_traffic: {
    name: 'Google Live Traffic',
    url: 'https://mt1.google.com/vt/lyrs=m,traffic|seconds_into_week:-1&x={x}&y={y}&z={z}',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    maxZoom: 20,
    attribution: '&copy; Google Maps Platform'
  },
  google_hybrid: {
    name: 'Google Satellite Hybrid',
    url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    maxZoom: 20,
    attribution: '&copy; Google Maps Platform'
  },
  dark_transit: {
    name: 'Dark Transit Carto',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    subdomains: ['a', 'b', 'c', 'd'],
    maxZoom: 19,
    attribution: '&copy; CARTO &copy; OpenStreetMap'
  }
};

// Custom animated vehicle marker with direction heading
const createVehicleIcon = (vehicle, isSelected = false) => {
  const isDelayed = vehicle.status === 'delayed';
  const color = isDelayed ? '#EF4444' : '#10B981';
  const bearing = vehicle.bearing || 0;
  
  return L.divIcon({
    className: 'custom-vehicle-marker',
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; cursor: pointer;">
        <span class="pulse-ring" style="border-color: ${color}; width: ${isSelected ? '36px' : '28px'}; height: ${isSelected ? '36px' : '28px'};"></span>
        <div style="
          background: #0F172A;
          border: ${isSelected ? '3px solid #38BDF8' : `2px solid ${color}`};
          border-radius: 50%;
          width: ${isSelected ? '34px' : '28px'};
          height: ${isSelected ? '34px' : '28px'};
          display: flex;
          align-items: center;
          justify-content: center;
          color: ${color};
          box-shadow: 0 0 14px ${color}aa;
          transition: all 0.3s ease;
          transform: rotate(${bearing}deg);
        ">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polygon points="12 2 19 21 12 17 5 21 12 2"></polygon>
          </svg>
        </div>
        <div style="
          position: absolute;
          top: -20px;
          background: rgba(15, 23, 42, 0.9);
          border: 1px solid ${color};
          border-radius: 4px;
          padding: 1px 4px;
          color: #F8FAFC;
          font-size: 9px;
          font-weight: 700;
          white-space: nowrap;
          box-shadow: 0 2px 4px rgba(0,0,0,0.6);
        ">
          ${vehicle.route_short_name || vehicle.route_id}
        </div>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17]
  });
};

const createStopIcon = (stop) => {
  return L.divIcon({
    className: 'custom-stop-marker',
    html: `
      <div style="
        background: #0F172A;
        border: 2px solid #38BDF8;
        border-radius: 6px;
        padding: 2px 6px;
        color: #F8FAFC;
        font-size: 10px;
        font-weight: 700;
        white-space: nowrap;
        display: flex;
        align-items: center;
        gap: 4px;
        box-shadow: 0 3px 6px rgba(0,0,0,0.6);
        cursor: pointer;
      ">
        <span style="background: #0284C7; color: white; border-radius: 3px; padding: 0 4px; font-size: 9px;">#${stop.stop_sequence}</span>
        ${stop.stop_name}
      </div>
    `,
    iconSize: [100, 22],
    iconAnchor: [50, 11]
  });
};

const createAdvisoryIcon = () => {
  return L.divIcon({
    className: 'custom-advisory-marker',
    html: `
      <div style="
        background: #991B1B;
        border: 2px solid #EF4444;
        border-radius: 50%;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #FEE2E2;
        box-shadow: 0 0 16px rgba(239, 68, 68, 0.9);
        animation: pulse 1.2s infinite;
        cursor: pointer;
      ">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });
};

export function MapView({
  selectedState,
  selectedDistrict,
  routes = [],
  vehicles = [],
  notices = [],
  stops = [],
  selectedRouteId,
  selectedVehicleId,
  onSelectNotice,
  onSelectRoute,
  onSelectVehicle
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);

  // Layers
  const routesLayerRef = useRef(L.layerGroup());
  const vehiclesLayerRef = useRef(L.layerGroup());
  const stopsLayerRef = useRef(L.layerGroup());
  const advisoryLayerRef = useRef(L.layerGroup());
  const boundariesLayerRef = useRef(L.layerGroup());

  // Interactive UI State
  const [currentMapStyle, setCurrentMapStyle] = useState('google_streets');
  const [showVehicles, setShowVehicles] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);
  const [showStops, setShowStops] = useState(true);
  const [showAdvisories, setShowAdvisories] = useState(true);
  
  // Real-time animated simulation state
  const [isSimulating, setIsSimulating] = useState(true);
  const [animatedVehicles, setAnimatedVehicles] = useState([]);
  const [activeVehicle, setActiveVehicle] = useState(null);
  const [followingVehicleId, setFollowingVehicleId] = useState(null);

  // Initialize Animated Vehicles
  useEffect(() => {
    if (vehicles && vehicles.length > 0) {
      setAnimatedVehicles(vehicles.map(v => ({
        ...v,
        currentLat: v.lat,
        currentLng: v.lng,
        stepIndex: 0,
        speed: v.speed_kmh || 28
      })));
    }
  }, [vehicles]);

  // Real-time Vehicle Movement Loop (smooth GPS motion)
  useEffect(() => {
    if (!isSimulating || animatedVehicles.length === 0) return;

    const interval = setInterval(() => {
      setAnimatedVehicles(prev => prev.map(veh => {
        // Find route matching this vehicle
        const matchingRoute = routes.find(r => r.id === veh.route_id);
        if (!matchingRoute || !matchingRoute.coordinates || matchingRoute.coordinates.length < 2) {
          return veh;
        }

        const coords = matchingRoute.coordinates;
        const nextStep = (veh.stepIndex + 1) % coords.length;
        const targetPt = coords[nextStep]; // [lng, lat]
        
        // Minor delta simulation
        const latDelta = (targetPt[1] - veh.currentLat) * 0.15;
        const lngDelta = (targetPt[0] - veh.currentLng) * 0.15;

        // Calculate heading bearing
        const y = Math.sin((targetPt[0] - veh.currentLng) * Math.PI / 180) * Math.cos(targetPt[1] * Math.PI / 180);
        const x = Math.cos(veh.currentLat * Math.PI / 180) * Math.sin(targetPt[1] * Math.PI / 180) -
                  Math.sin(veh.currentLat * Math.PI / 180) * Math.cos(targetPt[1] * Math.PI / 180) * Math.cos((targetPt[0] - veh.currentLng) * Math.PI / 180);
        let bearing = Math.atan2(y, x) * 180 / Math.PI;
        bearing = (bearing + 360) % 360;

        const newLat = veh.currentLat + latDelta;
        const newLng = veh.currentLng + lngDelta;

        // Fluctuating realistic city speed
        const newSpeed = Math.max(12, Math.min(55, veh.speed + (Math.random() * 6 - 3)));

        const updated = {
          ...veh,
          currentLat: newLat,
          currentLng: newLng,
          bearing: Math.round(bearing),
          speed: Math.round(newSpeed),
          stepIndex: Math.abs(newLat - targetPt[1]) < 0.001 ? nextStep : veh.stepIndex
        };

        if (followingVehicleId === veh.id && mapInstanceRef.current) {
          mapInstanceRef.current.panTo([newLat, newLng], { animate: true, duration: 1 });
        }

        return updated;
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, [isSimulating, animatedVehicles.length, routes, followingVehicleId]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const style = MAP_STYLES[currentMapStyle];
    const tileLayer = L.tileLayer(style.url, {
      subdomains: style.subdomains,
      maxZoom: style.maxZoom,
      attribution: style.attribution
    });

    const map = L.map(mapContainerRef.current, {
      center: INDIA_MAP_CENTER,
      zoom: INDIA_DEFAULT_ZOOM,
      zoomControl: false,
      layers: [tileLayer]
    });

    L.control.zoom({ position: 'topright' }).addTo(map);

    tileLayerRef.current = tileLayer;
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

  // Update Tile Style
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    const style = MAP_STYLES[currentMapStyle];

    mapInstanceRef.current.removeLayer(tileLayerRef.current);
    const newTileLayer = L.tileLayer(style.url, {
      subdomains: style.subdomains,
      maxZoom: style.maxZoom,
      attribution: style.attribution
    });
    newTileLayer.addTo(mapInstanceRef.current);
    tileLayerRef.current = newTileLayer;
  }, [currentMapStyle]);

  // Camera Fly-to on State/District selection
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

  // Fit map to Selected Route when chosen
  useEffect(() => {
    if (!selectedRouteId || !mapInstanceRef.current) return;
    const r = routes.find(route => route.id === selectedRouteId);
    if (r && r.coordinates && r.coordinates.length > 0) {
      const latLngs = r.coordinates.map(pt => [pt[1], pt[0]]);
      mapInstanceRef.current.fitBounds(latLngs, { padding: [60, 60], maxZoom: 14 });
    }
  }, [selectedRouteId, routes]);

  // Focus and follow vehicle when selected from list
  useEffect(() => {
    if (!selectedVehicleId) return;
    const v = animatedVehicles.find(veh => veh.id === selectedVehicleId) || vehicles.find(veh => veh.id === selectedVehicleId);
    if (v) {
      setActiveVehicle(v);
      setFollowingVehicleId(v.id);
      if (mapInstanceRef.current) {
        const lat = v.currentLat || v.lat;
        const lng = v.currentLng || v.lng;
        if (lat && lng) {
          mapInstanceRef.current.flyTo([lat, lng], 15, { duration: 1.2 });
        }
      }
    }
  }, [selectedVehicleId, animatedVehicles, vehicles]);

  // Render State Boundaries
  useEffect(() => {
    const layer = boundariesLayerRef.current;
    layer.clearLayers();

    if (selectedState && STATE_POLYGONS[selectedState]) {
      const polygon = L.polygon(STATE_POLYGONS[selectedState], {
        color: '#06B6D4',
        weight: 3,
        opacity: 0.8,
        fillColor: '#0891B2',
        fillOpacity: 0.1,
        dashArray: '8, 8'
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
        const isSelected = selectedRouteId === route.id;
        const latLngs = route.coordinates.map(pt => [pt[1], pt[0]]);
        
        const polyline = L.polyline(latLngs, {
          color: isSelected ? '#38BDF8' : (route.color || '#06B6D4'),
          weight: isSelected ? 6 : 4,
          opacity: isSelected ? 1.0 : 0.8
        });

        polyline.bindPopup(`
          <div style="font-family: sans-serif; min-width: 200px;">
            <div style="font-size: 10px; font-weight: bold; color: #0284C7; text-transform: uppercase;">${route.transport_type} ROUTE</div>
            <div style="font-size: 14px; font-weight: 800; color: #0F172A; margin: 2px 0;">${route.route_short_name}: ${route.route_long_name}</div>
            <div style="font-size: 11px; color: #475569;">Origin: <b>${route.origin || 'Start'}</b></div>
            <div style="font-size: 11px; color: #475569;">Destination: <b>${route.destination || 'End'}</b></div>
            <div style="margin-top: 6px; font-size: 10px; color: #0284C7; font-weight: bold;">Click to focus route stops</div>
          </div>
        `);

        polyline.on('click', () => {
          if (onSelectRoute) onSelectRoute(route);
          if (mapInstanceRef.current) {
            mapInstanceRef.current.fitBounds(polyline.getBounds(), { padding: [50, 50] });
          }
        });

        layer.addLayer(polyline);
      }
    });
  }, [routes, showRoutes, selectedRouteId, onSelectRoute]);

  // Render Stops
  useEffect(() => {
    const layer = stopsLayerRef.current;
    layer.clearLayers();
    if (!showStops) return;

    stops.forEach(stop => {
      if (stop.lat && stop.lng) {
        const marker = L.marker([stop.lat, stop.lng], {
          icon: createStopIcon(stop)
        });

        marker.bindPopup(`
          <div style="font-family: sans-serif; min-width: 180px;">
            <div style="font-size: 10px; color: #64748B; font-weight: bold;">TRANSIT STOP #${stop.stop_sequence}</div>
            <div style="font-size: 13px; font-weight: bold; color: #0F172A; margin: 2px 0;">${stop.stop_name}</div>
            <div style="font-size: 11px; color: #059669; font-weight: bold; margin-top: 4px;">🟢 Next bus in ~4 mins</div>
          </div>
        `);

        layer.addLayer(marker);
      }
    });
  }, [stops, showStops]);

  // Render Live Animated Vehicles
  useEffect(() => {
    const layer = vehiclesLayerRef.current;
    layer.clearLayers();
    if (!showVehicles) return;

    animatedVehicles.forEach(v => {
      const lat = v.currentLat || v.lat;
      const lng = v.currentLng || v.lng;

      if (lat && lng) {
        const isFollowed = followingVehicleId === v.id;
        const marker = L.marker([lat, lng], {
          icon: createVehicleIcon(v, isFollowed)
        });

        marker.on('click', () => {
          setActiveVehicle(v);
          if (onSelectVehicle) onSelectVehicle(v);
        });

        layer.addLayer(marker);
      }
    });
  }, [animatedVehicles, showVehicles, followingVehicleId, onSelectVehicle]);

  // Render Advisories & Diversions
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
            weight: 6,
            dashArray: '8, 8',
            opacity: 0.95
          });

          const midPt = latLngs[Math.floor(latLngs.length / 2)];
          const advMarker = L.marker(midPt, { icon: createAdvisoryIcon() });

          const handleClick = () => {
            if (onSelectNotice) onSelectNotice(n);
          };

          line.on('click', handleClick);
          advMarker.on('click', handleClick);

          layer.addLayer(line);
          layer.addLayer(advMarker);
        } else if (n.geojson.type === 'Point' && n.geojson.coordinates) {
          const pt = [n.geojson.coordinates[1], n.geojson.coordinates[0]];
          const advMarker = L.marker(pt, { icon: createAdvisoryIcon() });
          advMarker.on('click', () => {
            if (onSelectNotice) onSelectNotice(n);
          });
          layer.addLayer(advMarker);
        }
      }
    });
  }, [notices, showAdvisories, onSelectNotice]);

  const resetView = () => {
    setFollowingVehicleId(null);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(INDIA_MAP_CENTER, INDIA_DEFAULT_ZOOM, { duration: 1 });
    }
  };

  return (
    <div className="relative w-full h-full min-h-[550px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950">
      
      {/* Map DOM Element */}
      <div ref={mapContainerRef} className="w-full h-full" style={{ minHeight: '550px' }} />

      {/* Top Controls: Map Style Selector & Reset View */}
      <div className="absolute top-4 left-4 z-[1000] flex flex-wrap items-center gap-2">
        {/* Style Selector Dropdown */}
        <div className="flex items-center gap-1 bg-slate-900/95 p-1 rounded-xl border border-slate-700 shadow-xl backdrop-blur text-xs">
          <MapIcon className="w-4 h-4 text-cyan-400 ml-2" />
          <select
            value={currentMapStyle}
            onChange={(e) => setCurrentMapStyle(e.target.value)}
            className="bg-transparent text-slate-100 font-bold py-1 px-2 focus:outline-none cursor-pointer"
          >
            <option value="google_streets" className="bg-slate-900 text-white">Google Maps Transit</option>
            <option value="google_traffic" className="bg-slate-900 text-white">Google Live Traffic</option>
            <option value="google_hybrid" className="bg-slate-900 text-white">Google Satellite Hybrid</option>
            <option value="dark_transit" className="bg-slate-900 text-white">Dark Transit Style</option>
          </select>
        </div>

        {/* Reset View Button */}
        <button
          onClick={resetView}
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-900/95 hover:bg-slate-800 text-slate-200 text-xs font-bold rounded-xl shadow-xl border border-slate-700 backdrop-blur transition"
          title="Reset to All India View"
        >
          <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
          All India
        </button>

        {/* Live Simulation Play/Pause Toggle */}
        <button
          onClick={() => setIsSimulating(!isSimulating)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold shadow-xl border backdrop-blur transition ${
            isSimulating ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40' : 'bg-slate-900/95 text-slate-400 border-slate-700'
          }`}
          title="Toggle live telemetry GPS animation"
        >
          {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          {isSimulating ? 'Live GPS Active' : 'Simulation Paused'}
        </button>
      </div>

      {/* Layer Visibility Toggles (Top Right below zoom controls) */}
      <div className="absolute top-16 right-4 z-[1000] flex flex-col gap-1.5 bg-slate-900/95 p-2 rounded-xl border border-slate-700 shadow-2xl backdrop-blur text-xs">
        <button
          onClick={() => setShowVehicles(!showVehicles)}
          className={`px-2.5 py-1 rounded-lg transition flex items-center justify-between gap-3 font-semibold ${
            showVehicles ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${showVehicles ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'}`}></span>
            Live Vehicles
          </span>
          <span className="font-mono text-[10px]">{animatedVehicles.length}</span>
        </button>

        <button
          onClick={() => setShowRoutes(!showRoutes)}
          className={`px-2.5 py-1 rounded-lg transition flex items-center justify-between gap-3 font-semibold ${
            showRoutes ? 'bg-sky-950 text-sky-300 border border-sky-500/40' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${showRoutes ? 'bg-sky-400' : 'bg-slate-600'}`}></span>
            Routes
          </span>
          <span className="font-mono text-[10px]">{routes.length}</span>
        </button>

        <button
          onClick={() => setShowStops(!showStops)}
          className={`px-2.5 py-1 rounded-lg transition flex items-center justify-between gap-3 font-semibold ${
            showStops ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${showStops ? 'bg-cyan-400' : 'bg-slate-600'}`}></span>
            Stops
          </span>
          <span className="font-mono text-[10px]">{stops.length}</span>
        </button>

        <button
          onClick={() => setShowAdvisories(!showAdvisories)}
          className={`px-2.5 py-1 rounded-lg transition flex items-center justify-between gap-3 font-semibold ${
            showAdvisories ? 'bg-rose-950 text-rose-300 border border-rose-500/40' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${showAdvisories ? 'bg-rose-400' : 'bg-slate-600'}`}></span>
            Diversions
          </span>
          <span className="font-mono text-[10px]">{notices.length}</span>
        </button>
      </div>

      {/* Selected Vehicle Live Inspector Card (Bottom Left) */}
      {activeVehicle && (
        <div className="absolute bottom-4 left-4 z-[1000] w-80 bg-slate-900/95 border border-cyan-500/50 p-4 rounded-2xl shadow-2xl backdrop-blur text-xs animate-fadeIn space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="font-bold text-slate-100">{activeVehicle.vehicle_label}</span>
            </div>
            <button
              onClick={() => setActiveVehicle(null)}
              className="text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2 bg-slate-950 rounded-lg">
              <span className="text-slate-400 block">Current Speed</span>
              <strong className="text-cyan-400 font-mono text-sm">{activeVehicle.speed || activeVehicle.speed_kmh} km/h</strong>
            </div>
            <div className="p-2 bg-slate-950 rounded-lg">
              <span className="text-slate-400 block">Fleet Status</span>
              <strong className={activeVehicle.status === 'delayed' ? 'text-red-400' : 'text-emerald-400'}>
                {activeVehicle.status === 'delayed' ? 'Delayed (+8m)' : 'On Schedule'}
              </strong>
            </div>
          </div>

          <div className="text-[11px] text-slate-300 space-y-1">
            <div>Route: <strong className="text-white">{activeVehicle.route_short_name || activeVehicle.route_id}</strong></div>
            <div>Authority: <strong className="text-white">{activeVehicle.agency_name || 'Transit Corporation'}</strong></div>
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
            <button
              onClick={() => {
                if (followingVehicleId === activeVehicle.id) {
                  setFollowingVehicleId(null);
                } else {
                  setFollowingVehicleId(activeVehicle.id);
                  if (mapInstanceRef.current) {
                    mapInstanceRef.current.flyTo([activeVehicle.currentLat, activeVehicle.currentLng], 15);
                  }
                }
              }}
              className={`flex-1 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition ${
                followingVehicleId === activeVehicle.id
                  ? 'bg-amber-600 text-white'
                  : 'bg-cyan-600 hover:bg-cyan-500 text-white'
              }`}
            >
              <Navigation className="w-3.5 h-3.5" />
              {followingVehicleId === activeVehicle.id ? 'Unfollow' : 'Live Follow Bus'}
            </button>
          </div>
        </div>
      )}

      {/* Floating Legend (Bottom Right) */}
      <div className="absolute bottom-4 right-4 z-[1000] bg-slate-900/95 border border-slate-800 p-3 rounded-xl shadow-2xl backdrop-blur text-xs max-w-xs text-slate-300">
        <div className="flex items-center gap-1.5 font-bold text-slate-100 mb-2 pb-1.5 border-b border-slate-800">
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          Interactive Legend
        </div>
        <div className="space-y-1.5 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full border-2 border-emerald-400 bg-emerald-950 animate-pulse"></span>
            <span>Live Moving Vehicle (Real-time GPS)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 h-1.5 rounded bg-cyan-400"></span>
            <span>Active Public Transit Route</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 h-1 border-t-2 border-dashed border-red-500"></span>
            <span>Advisory Diversion Corridor</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-2 bg-slate-950 border border-sky-400 rounded-sm"></span>
            <span>Scheduled Stop (Click for ETA)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
