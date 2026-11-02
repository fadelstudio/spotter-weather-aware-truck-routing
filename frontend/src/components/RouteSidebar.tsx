import React from 'react';
import { RouteOption, Checkpoint } from '../types';
import { Star, Clock, Milestone, AlertOctagon, CheckCircle2, Wind, CloudRain, Snowflake, Info, X } from 'lucide-react';

interface RouteSidebarProps {
  routes: RouteOption[];
  selectedRouteId: string;
  onSelectRoute: (id: string) => void;
  selectedCheckpoint: Checkpoint | null;
  onClearCheckpoint: () => void;
  theme?: 'dark' | 'light';
}

export const RouteSidebar: React.FC<RouteSidebarProps> = ({
  routes,
  selectedRouteId,
  onSelectRoute,
  selectedCheckpoint,
  onClearCheckpoint,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';
  const activeRoute = routes.find((r) => r.id === selectedRouteId) || routes[0];

  return (
    <div className="space-y-4 flex flex-col h-full">
      {/* 1. Header of Right Column */}
      <div
        className={`flex items-center justify-between pb-2 border-b ${
          isDark ? 'border-white/[0.04]' : 'border-black/[0.04]'
        }`}
      >
        <div>
          <h3
            className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${
              isDark ? 'text-slate-200' : 'text-slate-800'
            }`}
          >
            <span>Route Options</span>
            <span className="text-[10px] bg-blue-600/15 text-blue-500 font-mono px-2 py-0.5 rounded-full">
              {routes.length} Alternatives
            </span>
          </h3>
          <p className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Ranked by Spotter Safety Hierarchy
          </p>
        </div>
      </div>

      {/* 2. Vertical Stack of Route Cards (No border-left, elevated shadow on active) */}
      <div className="space-y-2.5">
        {routes.map((route) => {
          const isSelected = route.id === selectedRouteId;
          const { risk_summary } = route;

          return (
            <div
              key={route.id}
              onClick={() => onSelectRoute(route.id)}
              className={`relative rounded-xl p-3.5 transition-all cursor-pointer ${
                isSelected
                  ? isDark
                    ? 'bg-[#0E1726] shadow-md shadow-blue-500/15 ring-1 ring-blue-500/30'
                    : 'bg-blue-50/50 shadow-md shadow-blue-600/10 ring-1 ring-blue-500/30'
                  : isDark
                  ? 'bg-[#0B0F19] shadow-sm hover:bg-[#0D1424]'
                  : 'bg-white shadow-sm hover:bg-slate-50/80'
              }`}
            >
              {/* Badge Recommended */}
              {route.is_recommended && (
                <div className="absolute -top-2.5 right-3 bg-blue-600 text-white text-[9px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-wider shadow-xs">
                  <Star className="w-2.5 h-2.5 fill-white" /> Recommended
                </div>
              )}

              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : isDark
                        ? 'bg-[#070A12] text-slate-300'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    #{route.rank}
                  </span>
                  <span
                    className={`text-xs font-bold truncate max-w-[160px] ${
                      isSelected
                        ? 'text-blue-500'
                        : isDark
                        ? 'text-slate-100'
                        : 'text-slate-900'
                    }`}
                  >
                    {route.name}
                  </span>
                </div>
              </div>

              {/* KPIs (Distance, Time, Risk Score) */}
              <div
                className={`grid grid-cols-2 gap-2 my-2 py-1.5 border-y text-xs ${
                  isDark
                    ? 'border-white/[0.04] text-slate-300'
                    : 'border-black/[0.04] text-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 font-mono">
                  <Milestone className="w-3.5 h-3.5 text-blue-500" />
                  <span>
                    <strong>{route.total_distance_miles}</strong> mi
                  </span>
                </div>
                <div className="flex items-center gap-1.5 font-mono">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  <span>
                    <strong>{route.total_duration_hours}</strong> h
                  </span>
                </div>
              </div>

              {/* Risk Distribution Bar */}
              <div className="mt-2">
                <div className="flex justify-between text-[10px] mb-1 font-mono">
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Composite Score:</span>
                  <span className="font-bold text-blue-500">
                    {risk_summary.average_risk_score} / 5.0
                  </span>
                </div>

                <div
                  className={`h-1.5 w-full rounded-full flex overflow-hidden ${
                    isDark ? 'bg-[#070A12]' : 'bg-slate-100'
                  }`}
                >
                  {risk_summary.low_miles > 0 && (
                    <div
                      style={{
                        width: `${(risk_summary.low_miles / route.total_distance_miles) * 100}%`,
                      }}
                      className="bg-blue-500"
                      title={`Low: ${risk_summary.low_miles} mi`}
                    />
                  )}
                  {risk_summary.moderate_miles > 0 && (
                    <div
                      style={{
                        width: `${(risk_summary.moderate_miles / route.total_distance_miles) * 100}%`,
                      }}
                      className="bg-amber-400"
                      title={`Moderate: ${risk_summary.moderate_miles} mi`}
                    />
                  )}
                  {risk_summary.high_miles > 0 && (
                    <div
                      style={{
                        width: `${(risk_summary.high_miles / route.total_distance_miles) * 100}%`,
                      }}
                      className="bg-orange-500"
                      title={`High: ${risk_summary.high_miles} mi`}
                    />
                  )}
                  {risk_summary.severe_miles > 0 && (
                    <div
                      style={{
                        width: `${(risk_summary.severe_miles / route.total_distance_miles) * 100}%`,
                      }}
                      className="bg-red-500"
                      title={`Severe: ${risk_summary.severe_miles} mi`}
                    />
                  )}
                  {risk_summary.no_travel_miles > 0 && (
                    <div
                      style={{
                        width: `${(risk_summary.no_travel_miles / route.total_distance_miles) * 100}%`,
                      }}
                      className="bg-red-950 border-l border-red-500"
                      title={`No Travel: ${risk_summary.no_travel_miles} mi`}
                    />
                  )}
                </div>

                {/* Danger miles indicator */}
                <div className="flex items-center justify-between mt-2 text-[10px]">
                  {risk_summary.danger_miles > 0 ? (
                    <span className="bg-red-500/15 text-red-500 px-2 py-0.5 rounded flex items-center gap-1 font-mono font-bold">
                      <AlertOctagon className="w-3 h-3" /> {risk_summary.danger_miles} mi Severe Danger
                    </span>
                  ) : (
                    <span className="bg-blue-500/15 text-blue-500 px-2 py-0.5 rounded flex items-center gap-1 font-mono font-bold">
                      <CheckCircle2 className="w-3 h-3" /> 0 mi Severe Danger
                    </span>
                  )}
                  <span className={`text-[9px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    {route.checkpoints.length} pts
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Live Checkpoint Telemetry / Route Diagnostics Panel */}
      <div
        className={`rounded-xl p-4 shadow-sm transition-colors mt-auto ${
          isDark
            ? 'bg-[#0B0F19] text-slate-100'
            : 'bg-white text-slate-900'
        }`}
      >
        {selectedCheckpoint ? (
          <div>
            <div
              className={`flex items-center justify-between pb-2 mb-2 border-b ${
                isDark ? 'border-white/[0.04]' : 'border-black/[0.04]'
              }`}
            >
              <span className="text-xs font-bold text-blue-500 flex items-center gap-1.5 uppercase font-mono">
                <Info className="w-3.5 h-3.5" /> Checkpoint #{selectedCheckpoint.index}
              </span>
              <button
                type="button"
                onClick={onClearCheckpoint}
                className={`p-1 rounded transition cursor-pointer ${
                  isDark ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-900'
                }`}
                title="Clear selection"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center justify-between mb-3 text-xs">
              <span className={`font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Mile {selectedCheckpoint.distance_from_origin_miles}
              </span>
              <span
                className="font-mono font-bold px-2 py-0.5 rounded text-[10px] uppercase"
                style={{
                  backgroundColor: `${selectedCheckpoint.risk_evaluation.overall_color}18`,
                  color: selectedCheckpoint.risk_evaluation.overall_color,
                }}
              >
                {selectedCheckpoint.risk_evaluation.overall_level}
              </span>
            </div>

            {/* Weather Breakdown */}
            <div className="space-y-1.5 text-xs font-mono">
              <div
                className={`p-2 rounded-lg flex items-center justify-between ${
                  isDark ? 'bg-[#070A12]' : 'bg-slate-50'
                }`}
              >
                <span className={`flex items-center gap-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  <Wind className="w-3.5 h-3.5 text-blue-500" /> Wind
                </span>
                <span className={`font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                  {selectedCheckpoint.weather.wind_mph} mph
                </span>
              </div>
              <div
                className={`p-2 rounded-lg flex items-center justify-between ${
                  isDark ? 'bg-[#070A12]' : 'bg-slate-50'
                }`}
              >
                <span className={`flex items-center gap-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  <CloudRain className="w-3.5 h-3.5 text-blue-400" /> Rain
                </span>
                <span className="font-bold">{selectedCheckpoint.weather.rain_in_hr} in/h</span>
              </div>
              <div
                className={`p-2 rounded-lg flex items-center justify-between ${
                  isDark ? 'bg-[#070A12]' : 'bg-slate-50'
                }`}
              >
                <span className={`flex items-center gap-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  <Snowflake className="w-3.5 h-3.5 text-cyan-400" /> Snow
                </span>
                <span className="font-bold">{selectedCheckpoint.weather.snow_in_hr} in/h</span>
              </div>
            </div>

            <p
              className={`text-[10px] mt-2.5 p-2 rounded-lg leading-relaxed ${
                isDark
                  ? 'bg-[#070A12] text-slate-300'
                  : 'bg-slate-50 text-slate-700'
              }`}
            >
              {selectedCheckpoint.risk_evaluation.primary_hazard}
            </p>
          </div>
        ) : (
          <div>
            <div
              className={`flex items-center justify-between pb-2 mb-2 border-b ${
                isDark ? 'border-white/[0.04]' : 'border-black/[0.04]'
              }`}
            >
              <span className="text-xs font-bold text-blue-500 uppercase tracking-wider flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" /> Live Telemetry
              </span>
              <span className={`text-[9px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Click any point
              </span>
            </div>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Click any checkpoint node along the route to inspect real-time wind, rain, snow conditions, and
              cargo rollover rules applied.
            </p>
            {activeRoute && (
              <div
                className={`mt-2.5 p-2 rounded-lg text-[10px] font-mono ${
                  isDark ? 'bg-[#070A12] text-slate-400' : 'bg-slate-50 text-slate-600'
                }`}
              >
                <div className="flex justify-between">
                  <span>Active Route:</span>
                  <span className="text-blue-500 font-bold">{activeRoute.name}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span>Monitored Checkpoints:</span>
                  <span>{activeRoute.checkpoints.length} points</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
