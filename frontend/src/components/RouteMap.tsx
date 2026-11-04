import React, { useEffect, useRef, useState } from 'react';
import { RouteOption, Checkpoint, CorridorHeatmap } from '../types';
import { Layers, Compass, Moon, Sun, Globe, Map } from 'lucide-react';

declare const L: any;

export type MapViewStyle = 'dark' | 'light' | 'satellite' | 'navigation';

interface RouteMapProps {
  routes: RouteOption[];
  selectedRouteId: string;
  onSelectRoute: (id: string) => void;
  selectedHour: number;
  showHeatmap: boolean;
  onToggleHeatmap: () => void;
  corridorHeatmap?: CorridorHeatmap;
  onSelectCheckpoint: (cp: Checkpoint) => void;
  theme?: 'dark' | 'light';
}

interface TileProviderConfig {
  url: string;
  maxZoom: number;
  isDarkFilter?: boolean;
}

// Ultra-reliable Esri ArcGIS Global Tile Endpoints (Never blocked, 0 rate limit, 0 watermarks)
const TILE_PROVIDERS: Record<MapViewStyle, TileProviderConfig> = {
  dark: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 18,
    isDarkFilter: true,
  },
  light: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 18,
    isDarkFilter: false,
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 18,
    isDarkFilter: false,
  },
  navigation: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 18,
    isDarkFilter: false,
  },
};

const STYLE_BUTTONS = [
  { key: 'dark', label: 'Dark', icon: Moon },
  { key: 'light', label: 'Light', icon: Sun },
  { key: 'satellite', label: 'Satellite', icon: Globe },
  { key: 'navigation', label: 'Routes', icon: Map },
] as const;

export const RouteMap: React.FC<RouteMapProps> = ({
  routes,
  selectedRouteId,
  onSelectRoute,
  selectedHour,
  showHeatmap,
  onToggleHeatmap,
  corridorHeatmap,
  onSelectCheckpoint,
  theme = 'dark',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const layersGroupRef = useRef<any>(null);
  const heatmapGroupRef = useRef<any>(null);
  const lastFittedRouteKeyRef = useRef<string>('');

  // Map view style selector
  const [mapStyle, setMapStyle] = useState<MapViewStyle>(theme === 'dark' ? 'dark' : 'light');

  // Synchronize style when global theme changes
  useEffect(() => {
    if (mapStyle === 'dark' || mapStyle === 'light') {
      setMapStyle(theme === 'dark' ? 'dark' : 'light');
    }
  }, [theme]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    if (typeof L === 'undefined') {
      console.warn('Leaflet not loaded');
      return;
    }

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([39.5, -98.35], 5);

    // Zoom control on top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    const provider = TILE_PROVIDERS[mapStyle];
    tileLayerRef.current = L.tileLayer(provider.url, {
      maxZoom: provider.maxZoom,
    }).addTo(map);

    if (mapContainerRef.current) {
      mapContainerRef.current.classList.toggle('map-dark-tiles', !!provider.isDarkFilter);
    }

    layersGroupRef.current = L.layerGroup().addTo(map);
    heatmapGroupRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile Layer and dark filter when user switches Map Style
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const provider = TILE_PROVIDERS[mapStyle];

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
      tileLayerRef.current = null;
    }

    const newLayer = L.tileLayer(provider.url, {
      maxZoom: provider.maxZoom,
    }).addTo(map);

    newLayer.bringToBack();
    tileLayerRef.current = newLayer;

    if (mapContainerRef.current) {
      mapContainerRef.current.classList.toggle('map-dark-tiles', !!provider.isDarkFilter);
    }
  }, [mapStyle]);

  // Recenter helper explicitly triggered by user
  const handleRecenter = () => {
    const map = mapInstanceRef.current;
    if (!map || !routes || routes.length === 0) return;

    const allLatLngs: [number, number][] = [];
    routes.forEach((r) => {
      r.geometry.coordinates.forEach((c) => allLatLngs.push([c[1], c[0]]));
    });

    if (allLatLngs.length > 0) {
      map.fitBounds(allLatLngs, { padding: [50, 50], animate: true, duration: 0.6 });
    }
  };

  // Render Routes and Checkpoints
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layers = layersGroupRef.current;
    if (!map || !layers) return;

    layers.clearLayers();
    if (!routes || routes.length === 0) return;

    const allLatLngs: [number, number][] = [];

    routes.forEach((route) => {
      const isSelected = route.id === selectedRouteId;
      const coords = route.geometry.coordinates.map((c) => [c[1], c[0]]);
      coords.forEach((c) => allLatLngs.push(c as [number, number]));

      if (!isSelected) {
        // Alternative routes: subtle dashed line
        const altPolyline = L.polyline(coords, {
          color: mapStyle === 'dark' || mapStyle === 'satellite' ? '#64748B' : '#94A3B8',
          weight: 2.5,
          dashArray: '5, 8',
          opacity: 0.6,
          lineCap: 'round',
          lineJoin: 'round',
        });
        altPolyline.on('click', () => onSelectRoute(route.id));
        layers.addLayer(altPolyline);
      } else {
        // Selected route: clean glow base
        const baseGlow = L.polyline(coords, {
          color: '#2563EB',
          weight: 5,
          opacity: 0.25,
          lineCap: 'round',
          lineJoin: 'round',
        });
        layers.addLayer(baseGlow);

        // Highway segments colored strictly by risk level
        if (route.checkpoints && route.checkpoints.length > 1) {
          for (let i = 0; i < route.checkpoints.length - 1; i++) {
            const cpA = route.checkpoints[i];
            const cpB = route.checkpoints[i + 1];
            const segColor = cpB.risk_evaluation.overall_color || '#3B82F6';

            const segLine = L.polyline(
              [
                [cpA.lat, cpA.lng],
                [cpB.lat, cpB.lng],
              ],
              {
                color: segColor,
                weight: 4,
                opacity: 0.95,
                lineCap: 'round',
              }
            );
            layers.addLayer(segLine);
          }

          // Checkpoint nodes
          route.checkpoints.forEach((cp) => {
            const evalRes = cp.risk_evaluation;
            const color = evalRes.overall_color || '#3B82F6';
            const isDanger = evalRes.overall_score >= 4;

            const marker = L.circleMarker([cp.lat, cp.lng], {
              radius: isDanger ? 5.5 : 4,
              fillColor: color,
              color: '#FFFFFF',
              weight: 1.5,
              opacity: 1,
              fillOpacity: 1,
            });

            // Modern Precision Tooltip
            const isDarkMap = mapStyle === 'dark' || mapStyle === 'satellite';
            const popupHtml = `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: ${isDarkMap ? '#090D16' : '#FFFFFF'}; color: ${isDarkMap ? '#F8FAFC' : '#0F172A'}; padding: 10px 12px; border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,0.25); min-width: 210px;">
                <div style="font-size: 11px; font-weight: 700; margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center;">
                  <span style="color: ${isDarkMap ? '#93C5FD' : '#2563EB'}; font-family: monospace;">POINT #${cp.index} • ${cp.distance_from_origin_miles} mi</span>
                  <span style="background: ${color}18; color: ${color}; border: 1px solid ${color}40; padding: 1px 6px; border-radius: 4px; font-size: 10px; font-weight: 700; font-family: monospace;">
                    ${evalRes.overall_level.toUpperCase()}
                  </span>
                </div>
                <div style="font-size: 11px; color: ${isDarkMap ? '#94A3B8' : '#64748B'}; margin-bottom: 8px; font-family: monospace;">
                  ETA: <b style="color: ${isDarkMap ? '#FFFFFF' : '#0F172A'};">${new Date(cp.eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</b>
                </div>
                <div style="font-size: 11px; border-top: 1px solid ${isDarkMap ? '#1E293B' : '#F1F5F9'}; padding-top: 6px; line-height: 1.6;">
                  <div style="display: flex; justify-content: space-between;">
                    <span style="color: ${isDarkMap ? '#94A3B8' : '#64748B'};">Wind:</span>
                    <b style="color: ${isDarkMap ? '#60A5FA' : '#2563EB'}; font-family: monospace;">${cp.weather.wind_mph} mph</b>
                  </div>
                  <div style="display: flex; justify-content: space-between;">
                    <span style="color: ${isDarkMap ? '#94A3B8' : '#64748B'};">Rain:</span>
                    <b style="color: ${isDarkMap ? '#93C5FD' : '#0284C7'}; font-family: monospace;">${cp.weather.rain_in_hr} in/h</b>
                  </div>
                  <div style="display: flex; justify-content: space-between;">
                    <span style="color: ${isDarkMap ? '#94A3B8' : '#64748B'};">Snow:</span>
                    <b style="color: ${isDarkMap ? '#E2E8F0' : '#475569'}; font-family: monospace;">${cp.weather.snow_in_hr} in/h</b>
                  </div>
                </div>
                <div style="font-size: 10.5px; color: ${isDarkMap ? '#F1F5F9' : '#0F172A'}; margin-top: 7px; background: ${isDarkMap ? '#0F172A' : '#F8FAFC'}; padding: 6px 8px; border-radius: 6px; border-left: 3px solid ${color};">
                  ${evalRes.primary_hazard}
                </div>
              </div>
            `;

            marker.bindPopup(popupHtml);
            marker.on('click', () => onSelectCheckpoint(cp));
            layers.addLayer(marker);
          });

          // Minimalist High-End Pins A & B
          const originCp = route.checkpoints[0];
          const destCp = route.checkpoints[route.checkpoints.length - 1];

          const originIcon = L.divIcon({
            className: 'custom-pin-a',
            html: `<div style="background: #2563EB; color: #FFFFFF; font-weight: 700; font-size: 11px; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,0.3); border: 2px solid #FFFFFF;">A</div>`,
            iconSize: [22, 22],
            iconAnchor: [11, 11],
          });

          const destIcon = L.divIcon({
            className: 'custom-pin-b',
            html: `<div style="background: #EF4444; color: #FFFFFF; font-weight: 700; font-size: 11px; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,0.3); border: 2px solid #FFFFFF;">B</div>`,
            iconSize: [22, 22],
            iconAnchor: [11, 11],
          });

          layers.addLayer(L.marker([originCp.lat, originCp.lng], { icon: originIcon, zIndexOffset: 1000 }));
          layers.addLayer(L.marker([destCp.lat, destCp.lng], { icon: destIcon, zIndexOffset: 1000 }));
        }
      }
    });

    // Auto-fit bounds ONLY when new routes are loaded
    const currentRouteKey = routes.map((r) => r.id).join(';') + `_${routes.length}`;
    if (allLatLngs.length > 0 && currentRouteKey !== lastFittedRouteKeyRef.current) {
      lastFittedRouteKeyRef.current = currentRouteKey;
      map.fitBounds(allLatLngs, { padding: [45, 45], maxZoom: 12 });
    }
  }, [routes, selectedRouteId, onSelectRoute, onSelectCheckpoint, mapStyle]);

  // Update Corridor Heatmap Circles
  useEffect(() => {
    const map = mapInstanceRef.current;
    const heatmapGroup = heatmapGroupRef.current;
    if (!map || !heatmapGroup) return;

    heatmapGroup.clearLayers();

    if (!showHeatmap || !corridorHeatmap || !corridorHeatmap.grid_points) return;

    const hourStr = String(selectedHour);

    corridorHeatmap.grid_points.forEach((pt) => {
      const forecast = pt.forecasts[hourStr];
      if (!forecast) return;

      if (forecast.intensity > 0.08) {
        let color = '#3B82F6';
        if (forecast.risk_score === 2) color = '#F59E0B';
        else if (forecast.risk_score === 3) color = '#F97316';
        else if (forecast.risk_score >= 4) color = '#EF4444';

        const circle = L.circle([pt.lat, pt.lng], {
          radius: 30000 + forecast.intensity * 20000,
          fillColor: color,
          fillOpacity: 0.16 + forecast.intensity * 0.24,
          stroke: false,
          interactive: false,
        });

        heatmapGroup.addLayer(circle);
      }
    });
  }, [showHeatmap, corridorHeatmap, selectedHour]);

  const isDark = theme === 'dark';

  return (
    <div
      className={`relative w-full h-[580px] lg:h-[620px] rounded-xl overflow-hidden shadow-sm transition-colors ${
        isDark ? 'bg-[#0B0F19]' : 'bg-white'
      }`}
    >
      <div
        ref={mapContainerRef}
        className={`w-full h-full transition-opacity duration-200 ${
          isDark ? 'bg-[#070A12]' : 'bg-[#F8FAFC]'
        }`}
      />

      {/* Floating Modern OSRM Navigation Toolbar (Top Left) */}
      <div className="absolute top-3 left-3 z-[1000] flex flex-wrap items-center gap-2">
        {/* Map Views Switcher */}
        <div
          className={`flex items-center gap-1 p-1 rounded-lg backdrop-blur-md shadow-sm ${
            isDark ? 'bg-[#090D16]/90' : 'bg-white/95'
          }`}
        >
          {STYLE_BUTTONS.map((v) => {
            const Icon = v.icon;
            return (
              <button
                key={v.key}
                type="button"
                onClick={() => setMapStyle(v.key)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                  mapStyle === v.key
                    ? 'bg-blue-600 text-white shadow-xs'
                    : isDark
                    ? 'text-slate-400 hover:text-white hover:bg-white/5'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{v.label}</span>
              </button>
            );
          })}
        </div>

        {/* Recenter button */}
        <button
          type="button"
          onClick={handleRecenter}
          className={`px-2.5 py-1.5 rounded-lg backdrop-blur-md shadow-sm text-xs transition flex items-center gap-1.5 font-medium cursor-pointer ${
            isDark
              ? 'bg-[#090D16]/90 text-slate-300 hover:text-white hover:bg-white/5'
              : 'bg-white/95 text-slate-700 hover:text-blue-600 hover:bg-slate-50'
          }`}
          title="Recenter view on full corridor"
        >
          <Compass className="w-3.5 h-3.5 text-blue-500" />
          <span className="hidden md:inline">Recenter</span>
        </button>

        {/* Toggle Heatmap pill */}
        <button
          type="button"
          onClick={onToggleHeatmap}
          className={`px-2.5 py-1.5 rounded-lg backdrop-blur-md shadow-sm text-xs transition flex items-center gap-1.5 font-medium cursor-pointer ${
            showHeatmap
              ? isDark
                ? 'bg-blue-600/20 text-blue-400 font-semibold'
                : 'bg-blue-50 text-blue-700 font-semibold'
              : isDark
              ? 'bg-[#090D16]/90 text-slate-400 hover:text-white hover:bg-white/5'
              : 'bg-white/95 text-slate-600 hover:bg-slate-50'
          }`}
          title="Toggle dynamic weather radar overlay"
        >
          <Layers className="w-3.5 h-3.5 text-blue-500" />
          <span className="hidden md:inline">{showHeatmap ? 'Radar Active' : 'Radar Hidden'}</span>
        </button>
      </div>

      {/* Floating Status / Telemetry Indicator (Bottom Right) */}
      <div
        className={`absolute bottom-3 right-3 z-[1000] backdrop-blur-md px-2.5 py-1.5 rounded-lg shadow-sm text-[11px] font-mono flex items-center gap-2 ${
          isDark
            ? 'bg-[#090D16]/90 text-slate-300'
            : 'bg-white/95 text-slate-700'
        }`}
      >
        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
        <span>Live Corridor Tracking • OSRM + Open-Meteo</span>
      </div>
    </div>
  );
};
