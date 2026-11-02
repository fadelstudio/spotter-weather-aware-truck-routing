import React, { useEffect, useRef, useState } from 'react';
import { RouteOption, Checkpoint, CorridorHeatmap } from '../types';
import { Maximize2, Layers, Eye, Compass } from 'lucide-react';

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

const TILE_PROVIDERS: Record<MapViewStyle, { url: string; maxZoom: number; subdomains?: string[] }> = {
  dark: {
    url: 'https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 16,
    subdomains: ['server', 'services'],
  },
  light: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 16,
    subdomains: ['server', 'services'],
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 18,
    subdomains: ['server', 'services'],
  },
  navigation: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    maxZoom: 19,
    subdomains: ['a', 'b', 'c'],
  },
};

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

  // Map view style selector (Dark, Light, Satellite, Navigation)
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
      console.warn('Leaflet non chargé');
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
      subdomains: provider.subdomains,
    }).addTo(map);

    layersGroupRef.current = L.layerGroup().addTo(map);
    heatmapGroupRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile Layer when user switches Map Style
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !tileLayerRef.current) return;

    const provider = TILE_PROVIDERS[mapStyle];
    tileLayerRef.current.setUrl(provider.url);
    tileLayerRef.current.options.maxZoom = provider.maxZoom;
  }, [mapStyle]);

  // Recenter / Fit bounds helper
  const handleRecenter = () => {
    const map = mapInstanceRef.current;
    if (!map || !routes || routes.length === 0) return;

    const allLatLngs: [number, number][] = [];
    routes.forEach((r) => {
      r.geometry.coordinates.forEach((c) => allLatLngs.push([c[1], c[0]]));
    });

    if (allLatLngs.length > 0) {
      map.fitBounds(allLatLngs, { padding: [50, 50], animate: true, duration: 0.8 });
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
        // Alternative routes: sleek subtle dashed line
        const altPolyline = L.polyline(coords, {
          color: mapStyle === 'dark' || mapStyle === 'satellite' ? '#64748B' : '#94A3B8',
          weight: 2.5,
          dashArray: '6, 8',
          opacity: 0.65,
          lineCap: 'round',
          lineJoin: 'round',
        });
        altPolyline.on('click', () => onSelectRoute(route.id));
        layers.addLayer(altPolyline);
      } else {
        // Selected route: ambient neon halo
        const baseGlow = L.polyline(coords, {
          color: '#2563EB',
          weight: 7,
          opacity: 0.22,
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
              radius: isDanger ? 6.5 : 4.5,
              fillColor: color,
              color: '#FFFFFF',
              weight: 1.5,
              opacity: 1,
              fillOpacity: 1,
            });

            // Modern High-Precision Tooltip
            const popupHtml = `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0B0F19; color: #F8FAFC; padding: 10px 12px; border-radius: 10px; border: 1px solid #1E293B; min-width: 200px; box-shadow: 0 14px 30px rgba(0,0,0,0.5);">
                <div style="font-size: 11px; font-weight: 800; margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center;">
                  <span style="color: #93C5FD; font-family: monospace;">POINT #${cp.index} • ${cp.distance_from_origin_miles} mi</span>
                  <span style="background: ${color}25; color: ${color}; border: 1px solid ${color}60; padding: 1px 6px; border-radius: 4px; font-size: 10px; font-weight: 800;">
                    ${evalRes.overall_level.toUpperCase()}
                  </span>
                </div>
                <div style="font-size: 11px; color: #94A3B8; margin-bottom: 8px;">
                  🕒 Arrivée Prévue (ETA) : <b style="color: #FFFFFF;">${new Date(cp.eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</b>
                </div>
                <div style="font-size: 11px; border-top: 1px solid #1E293B; padding-top: 6px; line-height: 1.6;">
                  <div style="display: flex; justify-content: space-between;">
                    <span>💨 Vitesse Vent :</span>
                    <b style="color: #60A5FA;">${cp.weather.wind_mph} mph</b>
                  </div>
                  <div style="display: flex; justify-content: space-between;">
                    <span>🌧️ Précipitation :</span>
                    <b style="color: #93C5FD;">${cp.weather.rain_in_hr} in/h</b>
                  </div>
                  <div style="display: flex; justify-content: space-between;">
                    <span>❄️ Chute de Neige :</span>
                    <b style="color: #E2E8F0;">${cp.weather.snow_in_hr} in/h</b>
                  </div>
                </div>
                <div style="font-size: 10px; color: #F1F5F9; margin-top: 7px; background: #111827; padding: 5px 8px; border-radius: 6px; border-left: 3px solid ${color};">
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
            html: `<div style="background: #2563EB; color: #FFFFFF; font-weight: 800; font-size: 11px; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid #FFFFFF; box-shadow: 0 0 12px rgba(37,99,235,0.7);">A</div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          });

          const destIcon = L.divIcon({
            className: 'custom-pin-b',
            html: `<div style="background: #EF4444; color: #FFFFFF; font-weight: 800; font-size: 11px; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid #FFFFFF; box-shadow: 0 0 12px rgba(239,68,68,0.7);">B</div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          });

          layers.addLayer(L.marker([originCp.lat, originCp.lng], { icon: originIcon, zIndexOffset: 1000 }));
          layers.addLayer(L.marker([destCp.lat, destCp.lng], { icon: destIcon, zIndexOffset: 1000 }));
        }
      }
    });

    if (allLatLngs.length > 0) {
      map.fitBounds(allLatLngs, { padding: [45, 45] });
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
          radius: 32000 + forecast.intensity * 22000,
          fillColor: color,
          fillOpacity: 0.18 + forecast.intensity * 0.28,
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
      className={`relative w-full h-[580px] lg:h-[620px] rounded-2xl overflow-hidden border transition-all duration-200 shadow-2xl ${
        isDark
          ? 'bg-[#0B0F19] border-blue-900/30 shadow-blue-950/20'
          : 'bg-white border-slate-200 shadow-slate-200'
      }`}
    >
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating Modern OSRM Navigation Toolbar (Top Left) */}
      <div className="absolute top-3.5 left-3.5 z-[1000] flex flex-wrap items-center gap-2">
        {/* Map Views Switcher */}
        <div
          className={`flex items-center gap-1 p-1 rounded-xl backdrop-blur-md border shadow-lg ${
            isDark ? 'bg-[#0B0F19]/90 border-slate-800' : 'bg-white/95 border-slate-200'
          }`}
        >
          {(
            [
              { key: 'dark', label: 'Sombre', icon: '🌃' },
              { key: 'light', label: 'Clair', icon: '☀️' },
              { key: 'satellite', label: 'Satellite', icon: '🛰️' },
              { key: 'navigation', label: 'Routes', icon: '🛣️' },
            ] as const
          ).map((v) => (
            <button
              key={v.key}
              type="button"
              onClick={() => setMapStyle(v.key)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                mapStyle === v.key
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-900/40'
                  : isDark
                  ? 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span>{v.icon}</span>
              <span className="hidden sm:inline">{v.label}</span>
            </button>
          ))}
        </div>

        {/* Recenter button */}
        <button
          type="button"
          onClick={handleRecenter}
          className={`p-2 rounded-xl backdrop-blur-md border shadow-lg text-xs transition flex items-center gap-1.5 font-medium ${
            isDark
              ? 'bg-[#0B0F19]/90 border-slate-800 text-slate-300 hover:text-white hover:border-blue-500/50'
              : 'bg-white/95 border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-400'
          }`}
          title="Recadrer sur l'ensemble de l'itinéraire"
        >
          <Compass className="w-3.5 h-3.5 text-blue-500" />
          <span className="hidden md:inline">Recadrer</span>
        </button>

        {/* Toggle Heatmap pill */}
        <button
          type="button"
          onClick={onToggleHeatmap}
          className={`p-2 rounded-xl backdrop-blur-md border shadow-lg text-xs transition flex items-center gap-1.5 font-medium ${
            showHeatmap
              ? 'bg-blue-600/20 border-blue-500 text-blue-400 font-bold'
              : isDark
              ? 'bg-[#0B0F19]/90 border-slate-800 text-slate-400 hover:text-white'
              : 'bg-white/95 border-slate-200 text-slate-600'
          }`}
          title="Afficher/Masquer le calque météo dynamique"
        >
          <Layers className="w-3.5 h-3.5 text-blue-500" />
          <span className="hidden md:inline">{showHeatmap ? 'Radar Météo Actif' : 'Radar Masqué'}</span>
        </button>
      </div>

      {/* Floating Status / Telemetry Indicator (Bottom Right) */}
      <div
        className={`absolute bottom-3.5 right-3.5 z-[1000] backdrop-blur-md px-3 py-1.5 rounded-xl border text-[11px] font-mono flex items-center gap-2 shadow-lg ${
          isDark
            ? 'bg-[#0B0F19]/90 border-slate-800 text-slate-300'
            : 'bg-white/95 border-slate-200 text-slate-700'
        }`}
      >
        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
        <span>Corridor Temps Réel • OSRM + Open-Meteo</span>
      </div>
    </div>
  );
};
