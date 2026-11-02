import React, { useEffect, useRef } from 'react';
import { RouteOption, Checkpoint, CorridorHeatmap } from '../types';

declare const L: any; // Leaflet global from CDN

interface RouteMapProps {
  routes: RouteOption[];
  selectedRouteId: string;
  onSelectRoute: (id: string) => void;
  selectedHour: number;
  showHeatmap: boolean;
  corridorHeatmap?: CorridorHeatmap;
  onSelectCheckpoint: (cp: Checkpoint) => void;
  theme?: 'dark' | 'light';
}

export const RouteMap: React.FC<RouteMapProps> = ({
  routes,
  selectedRouteId,
  onSelectRoute,
  selectedHour,
  showHeatmap,
  corridorHeatmap,
  onSelectCheckpoint,
  theme = 'dark',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const layersGroupRef = useRef<any>(null);
  const heatmapGroupRef = useRef<any>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    if (typeof L === 'undefined') {
      console.warn('Leaflet script not yet loaded');
      return;
    }

    // Default center in central US
    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      attributionControl: false,
    }).setView([39.5, -98.35], 5);

    // Initial Tile Layer (Clean Esri Canvas with Zero Watermarks)
    const tileUrl =
      theme === 'light'
        ? 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}'
        : 'https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';

    tileLayerRef.current = L.tileLayer(tileUrl, {
      maxZoom: 16,
      subdomains: ['server', 'services'],
    }).addTo(map);

    layersGroupRef.current = L.layerGroup().addTo(map);
    heatmapGroupRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    // Trigger map layout reflow
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile Layer on Theme Change (Dark vs Light without watermarks)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !tileLayerRef.current) return;

    const newTileUrl =
      theme === 'light'
        ? 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}'
        : 'https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';

    tileLayerRef.current.setUrl(newTileUrl);
  }, [theme]);

  // Update Routes and Checkpoints
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layers = layersGroupRef.current;
    if (!map || !layers) return;

    layers.clearLayers();

    if (!routes || routes.length === 0) return;

    const allLatLngs: [number, number][] = [];

    // Draw all routes
    routes.forEach((route) => {
      const isSelected = route.id === selectedRouteId;
      const coords = route.geometry.coordinates.map((c) => [c[1], c[0]]);
      coords.forEach((c) => allLatLngs.push(c as [number, number]));

      if (!isSelected) {
        // Alternative routes: Clean fine hairline dashed line
        const altPolyline = L.polyline(coords, {
          color: theme === 'dark' ? '#64748B' : '#94A3B8',
          weight: 2,
          dashArray: '5, 8',
          opacity: 0.55,
          lineCap: 'round',
          lineJoin: 'round',
        });
        altPolyline.on('click', () => onSelectRoute(route.id));
        layers.addLayer(altPolyline);
      } else {
        // Selected route base halo
        const baseGlow = L.polyline(coords, {
          color: '#3B82F6',
          weight: 6,
          opacity: 0.15,
          lineCap: 'round',
          lineJoin: 'round',
        });
        layers.addLayer(baseGlow);

        // Segmented Highway by exact risk color
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
                weight: 3.5,
                opacity: 0.95,
                lineCap: 'round',
              }
            );
            layers.addLayer(segLine);
          }

          // Minimalist Checkpoints Nodes
          route.checkpoints.forEach((cp) => {
            const evalRes = cp.risk_evaluation;
            const color = evalRes.overall_color || '#3B82F6';
            const isDanger = evalRes.overall_score >= 4;

            const marker = L.circleMarker([cp.lat, cp.lng], {
              radius: isDanger ? 6 : 4,
              fillColor: color,
              color: theme === 'dark' ? '#0B0F19' : '#FFFFFF',
              weight: 1.5,
              opacity: 1,
              fillOpacity: 1,
            });

            // Modern Precision Tooltip
            const popupHtml = `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: ${theme === 'dark' ? '#0F172A' : '#FFFFFF'}; color: ${theme === 'dark' ? '#F8FAFC' : '#0F172A'}; padding: 8px 10px; border-radius: 8px; border: 1px solid ${theme === 'dark' ? '#334155' : '#E2E8F0'}; min-width: 190px; box-shadow: 0 10px 25px rgba(0,0,0,0.3);">
                <div style="font-size: 11px; font-weight: 700; margin-bottom: 4px; display: flex; justify-content: space-between; align-items: center;">
                  <span>MILE ${cp.distance_from_origin_miles}</span>
                  <span style="background: ${color}20; color: ${color}; border: 1px solid ${color}50; padding: 1px 5px; border-radius: 4px; font-size: 10px; font-weight: 800; letter-spacing: 0.5px;">
                    ${evalRes.overall_level.toUpperCase()}
                  </span>
                </div>
                <div style="font-size: 11px; color: ${theme === 'dark' ? '#94A3B8' : '#64748B'}; margin-bottom: 6px;">
                  ETA: <b>${new Date(cp.eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</b>
                </div>
                <div style="font-size: 11px; border-top: 1px solid ${theme === 'dark' ? '#1E293B' : '#F1F5F9'}; padding-top: 5px; line-height: 1.6;">
                  <div>💨 Vent: <b>${cp.weather.wind_mph} mph</b></div>
                  <div>🌧️ Pluie: <b>${cp.weather.rain_in_hr} in/hr</b></div>
                  <div>❄️ Neige: <b>${cp.weather.snow_in_hr} in/hr</b></div>
                </div>
                <div style="font-size: 10px; color: ${theme === 'dark' ? '#CBD5E1' : '#334155'}; margin-top: 5px; background: ${theme === 'dark' ? '#1E293B' : '#F8FAFC'}; padding: 4px 6px; border-radius: 4px; border: 1px solid ${theme === 'dark' ? '#334155' : '#E2E8F0'};">
                  ⚡ ${evalRes.primary_hazard}
                </div>
              </div>
            `;

            marker.bindPopup(popupHtml);
            marker.on('click', () => onSelectCheckpoint(cp));
            layers.addLayer(marker);
          });

          // Minimalist A & B Pins
          const originCp = route.checkpoints[0];
          const destCp = route.checkpoints[route.checkpoints.length - 1];

          const originIcon = L.divIcon({
            className: 'custom-pin-a',
            html: `<div style="background: #2563EB; color: #FFFFFF; font-weight: 800; font-size: 10px; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 1.5px solid #FFFFFF; box-shadow: 0 0 10px rgba(37,99,235,0.6);">A</div>`,
            iconSize: [22, 22],
            iconAnchor: [11, 11],
          });

          const destIcon = L.divIcon({
            className: 'custom-pin-b',
            html: `<div style="background: #EF4444; color: #FFFFFF; font-weight: 800; font-size: 10px; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 1.5px solid #FFFFFF; box-shadow: 0 0 10px rgba(239,68,68,0.6);">B</div>`,
            iconSize: [22, 22],
            iconAnchor: [11, 11],
          });

          layers.addLayer(
            L.marker([originCp.lat, originCp.lng], {
              icon: originIcon,
              zIndexOffset: 1000,
            })
          );
          layers.addLayer(
            L.marker([destCp.lat, destCp.lng], {
              icon: destIcon,
              zIndexOffset: 1000,
            })
          );
        }
      }
    });

    if (allLatLngs.length > 0) {
      map.fitBounds(allLatLngs, { padding: [40, 40] });
    }
  }, [routes, selectedRouteId, onSelectRoute, onSelectCheckpoint, theme]);

  // Update Corridor Heatmap Grid
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
        let color = '#3B82F6'; // Electric Blue
        if (forecast.risk_score === 2) color = '#F59E0B'; // Amber
        else if (forecast.risk_score === 3) color = '#F97316'; // Orange
        else if (forecast.risk_score >= 4) color = '#EF4444'; // Neon Red

        const circle = L.circle([pt.lat, pt.lng], {
          radius: 30000 + forecast.intensity * 20000,
          fillColor: color,
          fillOpacity: 0.16 + forecast.intensity * 0.28,
          stroke: false,
          interactive: false,
        });

        heatmapGroup.addLayer(circle);
      }
    });
  }, [showHeatmap, corridorHeatmap, selectedHour]);

  return (
    <div
      className={`relative w-full h-[520px] rounded-xl overflow-hidden border transition-colors shadow-2xl ${
        theme === 'dark'
          ? 'bg-[#0B0F19] border-blue-900/40 shadow-blue-950/20'
          : 'bg-white border-slate-200 shadow-slate-200'
      }`}
    >
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating Status Pill */}
      <div
        className={`absolute top-3 left-3 backdrop-blur-md px-3 py-1.5 rounded-lg border text-xs z-[1000] flex items-center gap-2 shadow-sm ${
          theme === 'dark'
            ? 'bg-[#0F172A]/90 border-slate-700/80 text-slate-200'
            : 'bg-white/90 border-slate-200 text-slate-700'
        }`}
      >
        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
        <span className="font-medium tracking-wide">Corridor Tracking Active</span>
      </div>
    </div>
  );
};
