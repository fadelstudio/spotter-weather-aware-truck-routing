import React from 'react';
import { RouteOption } from '../types';
import { Star, Clock, Milestone, AlertOctagon, CheckCircle2 } from 'lucide-react';

interface RouteComparisonProps {
  routes: RouteOption[];
  selectedRouteId: string;
  onSelectRoute: (id: string) => void;
  theme?: 'dark' | 'light';
}

export const RouteComparison: React.FC<RouteComparisonProps> = ({
  routes,
  selectedRouteId,
  onSelectRoute,
  theme = 'dark',
}) => {
  if (!routes || routes.length === 0) return null;

  const isDark = theme === 'dark';

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <h3
          className={`text-[11px] font-bold uppercase tracking-wider ${
            isDark ? 'text-slate-400' : 'text-slate-600'
          }`}
        >
          Route Options ({routes.length})
        </h3>
        <span className="text-[10px] text-blue-500 font-mono tracking-tight">
          Spotter Safety Hierarchy Ranking
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {routes.map((route) => {
          const isSelected = route.id === selectedRouteId;
          const { risk_summary } = route;

          return (
            <div
              key={route.id}
              onClick={() => onSelectRoute(route.id)}
              className={`relative rounded-xl p-3.5 transition-all cursor-pointer flex flex-col justify-between ${
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
                    className={`text-xs font-bold truncate max-w-[130px] ${
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

              {/* KPIs (Distance, Time) */}
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
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Score:</span>
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

                {/* Danger Miles */}
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
    </div>
  );
};
