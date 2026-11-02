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
}

export const RouteMap: React.FC<RouteMapProps> = ({
  routes,
  selectedRouteId,
  onSelectRoute,
  selectedHour,
  showHeatmap,
  corridorHeatmap,
  onSelectCheckpoint,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const layersGroupRef = useRef<any>(null);
  const heatmapGroupRef = useRef<any>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    if (typeof L === 'undefined') {
      console.warn('Leaflet script not yet loaded');
      return;
    }

    // Default center in central US (Kansas)
    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      attributionControl: false,
    }).setView([39.5, -98.35], 5);

    // CartoDB Dark Matter tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    layersGroupRef.current = L.layerGroup().addTo(map);
    heatmapGroupRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

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

      // Polyline base styling
      const polyColor = isSelected ? '#334155' : '#475569';
      const polyWeight = isSelected ? 4 : 2.5;
      const polyOpacity = isSelected ? 0.6 : 0.35;

      const polyline = L.polyline(coords, {
        color: polyColor,
        weight: polyWeight,
        opacity: polyOpacity,
        lineCap: 'round',
        lineJoin: 'round',
      });

      polyline.on('click', () => onSelectRoute(route.id));
      layers.addLayer(polyline);

      // If route is selected, draw colored highway segments between checkpoints
      if (isSelected && route.checkpoints && route.checkpoints.length > 1) {
        for (let i = 0; i < route.checkpoints.length - 1; i++) {
          const cpA = route.checkpoints[i];
          const cpB = route.checkpoints[i + 1];
          const segColor = cpB.risk_evaluation.overall_color || '#10B981';

          const segLine = L.polyline([[cpA.lat, cpA.lng], [cpB.lat, cpB.lng]], {
            color: segColor,
            weight: 5,
            opacity: 0.9,
            lineCap: 'round',
          });
          layers.addLayer(segLine);
        }

        // Draw checkpoints markers for the selected route
        route.checkpoints.forEach((cp, idx) => {
          const evalRes = cp.risk_evaluation;
          const color = evalRes.overall_color || '#10B981';
          const isDanger = evalRes.overall_score >= 4;

          const marker = L.circleMarker([cp.lat, cp.lng], {
            radius: isDanger ? 8 : 5.5,
            fillColor: color,
            color: '#0F172A',
            weight: 2,
            opacity: 1,
            fillOpacity: 1,
          });

          // Modern dark tooltip content
          const popupHtml = `
            <div style="font-family: Inter, sans-serif; background: #0F172A; color: #F8FAFC; padding: 6px 8px; border-radius: 8px; min-width: 180px; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
              <div style="font-size: 12px; font-weight: 700; margin-bottom: 4px; display: flex; justify-content: space-between; align-items: center;">
                <span>Mile ${cp.distance_from_origin_miles}</span>
                <span style="background: ${color}25; color: ${color}; border: 1px solid ${color}60; padding: 1px 6px; border-radius: 4px; font-size: 11px; font-weight: 800;">
                  ${evalRes.overall_level}
                </span>
              </div>
              <div style="font-size: 11px; color: #94A3B8; margin-bottom: 6px;">
                🕒 ETA: <b>${new Date(cp.eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</b>
              </div>
              <div style="font-size: 11px; border-top: 1px solid #334155; padding-top: 5px; line-height: 1.5;">
                <div>💨 Wind: <b>${cp.weather.wind_mph} mph</b> (${evalRes.wind.level})</div>
                <div>🌧️ Rain: <b>${cp.weather.rain_in_hr} in/hr</b></div>
                <div>❄️ Snow: <b>${cp.weather.snow_in_hr} in/hr</b></div>
              </div>
              <div style="font-size: 10px; color: #CBD5E1; margin-top: 5px; font-style: italic; background: #1E293B; padding: 3px 5px; border-radius: 4px;">
                ⚠️ ${evalRes.primary_hazard}
              </div>
            </div>
          `;

          marker.bindPopup(popupHtml);
          marker.on('click', () => onSelectCheckpoint(cp));
          layers.addLayer(marker);
        });

        // Add Origin & Destination badges
        const originCp = route.checkpoints[0];
        const destCp = route.checkpoints[route.checkpoints.length - 1];

        const originIcon = L.divIcon({
          className: 'custom-pin-origin',
          html: `<div style="background: #10B981; color: #0F172A; font-weight: 900; font-size: 11px; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid #FFFFFF; box-shadow: 0 4px 10px rgba(0,0,0,0.5);">A</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const destIcon = L.divIcon({
          className: 'custom-pin-dest',
          html: `<div style="background: #EF4444; color: #FFFFFF; font-weight: 900; font-size: 11px; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid #FFFFFF; box-shadow: 0 4px 10px rgba(0,0,0,0.5);">B</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        layers.addLayer(L.marker([originCp.lat, originCp.lng], { icon: originIcon, zIndexOffset: 1000 }));
        layers.addLayer(L.marker([destCp.lat, destCp.lng], { icon: destIcon, zIndexOffset: 1000 }));
      }
    });

    // Fit map bounds to encompass trip
    if (allLatLngs.length > 0) {
      map.fitBounds(allLatLngs, { padding: [40, 40] });
    }
  }, [routes, selectedRouteId, onSelectRoute, onSelectCheckpoint]);

  // Update Corridor Heatmap Grid based on selectedHour
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

      // Only draw visible heat circles if there is noticeable weather (intensity > 0.1)
      if (forecast.intensity > 0.08) {
        let color = '#38BDF8'; // Sky blue for light
        if (forecast.risk_score === 2) color = '#F59E0B'; // Amber
        else if (forecast.risk_score === 3) color = '#F97316'; // Orange
        else if (forecast.risk_score === 4) color = '#EF4444'; // Red
        else if (forecast.risk_score >= 5) color = '#7F1D1D'; // Maroon

        const circle = L.circle([pt.lat, pt.lng], {
          radius: 35000 + forecast.intensity * 25000, // 35km - 60km radius
          fillColor: color,
          fillOpacity: 0.22 + forecast.intensity * 0.35,
          stroke: false,
          interactive: false,
        });

        heatmapGroup.addLayer(circle);
      }
    });
  }, [showHeatmap, corridorHeatmap, selectedHour]);

  return (
    <div className="relative w-full h-[520px] rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
      <div ref={mapContainerRef} className="w-full h-full" />
      
      {/* Map Header Overlay */}
      <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-xs text-slate-300 z-[1000] flex items-center gap-2 shadow-lg">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>Live Corridor Tracking</span>
      </div>
    </div>
  );
};
