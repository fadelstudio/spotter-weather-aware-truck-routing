import React from 'react';
import { RouteOption } from '../types';
import { Star, Clock, Milestone, ShieldAlert, CheckCircle2, AlertTriangle, AlertOctagon } from 'lucide-react';

interface RouteComparisonProps {
  routes: RouteOption[];
  selectedRouteId: string;
  onSelectRoute: (id: string) => void;
}

export const RouteComparison: React.FC<RouteComparisonProps> = ({
  routes,
  selectedRouteId,
  onSelectRoute,
}) => {
  if (!routes || routes.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
          Generated Route Options ({routes.length})
        </h3>
        <span className="text-xs text-slate-500">Sorted by Spotter Risk Hierarchy</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {routes.map((route) => {
          const isSelected = route.id === selectedRouteId;
          const { risk_summary } = route;

          return (
            <div
              key={route.id}
              onClick={() => onSelectRoute(route.id)}
              className={`relative rounded-xl p-4 border transition cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-800/90 border-emerald-500 shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-500'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
              }`}
            >
              {/* Badge Recommended */}
              {route.is_recommended && (
                <div className="absolute -top-2.5 right-3 bg-emerald-500 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                  <Star className="w-3 h-3 fill-slate-950" /> RECOMMENDED
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    Option #{route.rank}
                  </span>
                  <span className="text-xs font-bold text-slate-200 truncate max-w-[140px]">
                    {route.name}
                  </span>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-2 my-2 py-2 border-y border-slate-800 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Milestone className="w-4 h-4 text-emerald-400" />
                    <span><strong>{route.total_distance_miles}</strong> mi</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Clock className="w-4 h-4 text-sky-400" />
                    <span><strong>{route.total_duration_hours}</strong> hrs</span>
                  </div>
                </div>

                {/* Risk Distribution Bar */}
                <div className="my-2.5">
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-400">Risk Profile:</span>
                    <span className="font-semibold text-slate-200">
                      Avg Score: {risk_summary.average_risk_score} / 5.0
                    </span>
                  </div>

                  {/* Multi-segmented progress bar */}
                  <div className="h-2.5 w-full bg-slate-950 rounded-full flex overflow-hidden border border-slate-800">
                    {risk_summary.low_miles > 0 && (
                      <div
                        style={{ width: `${(risk_summary.low_miles / route.total_distance_miles) * 100}%` }}
                        className="bg-emerald-500"
                        title={`Low: ${risk_summary.low_miles} mi`}
                      />
                    )}
                    {risk_summary.moderate_miles > 0 && (
                      <div
                        style={{ width: `${(risk_summary.moderate_miles / route.total_distance_miles) * 100}%` }}
                        className="bg-amber-400"
                        title={`Moderate: ${risk_summary.moderate_miles} mi`}
                      />
                    )}
                    {risk_summary.high_miles > 0 && (
                      <div
                        style={{ width: `${(risk_summary.high_miles / route.total_distance_miles) * 100}%` }}
                        className="bg-orange-500"
                        title={`High: ${risk_summary.high_miles} mi`}
                      />
                    )}
                    {risk_summary.severe_miles > 0 && (
                      <div
                        style={{ width: `${(risk_summary.severe_miles / route.total_distance_miles) * 100}%` }}
                        className="bg-red-500"
                        title={`Severe: ${risk_summary.severe_miles} mi`}
                      />
                    )}
                    {risk_summary.no_travel_miles > 0 && (
                      <div
                        style={{ width: `${(risk_summary.no_travel_miles / route.total_distance_miles) * 100}%` }}
                        className="bg-red-950 border-l border-red-500"
                        title={`No Travel: ${risk_summary.no_travel_miles} mi`}
                      />
                    )}
                  </div>

                  {/* Breakdown tags */}
                  <div className="flex flex-wrap gap-1 mt-2 text-[10px]">
                    {risk_summary.danger_miles > 0 ? (
                      <span className="bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded flex items-center gap-1">
                        <AlertOctagon className="w-3 h-3" /> {risk_summary.danger_miles} mi Severe/NoTravel
                      </span>
                    ) : (
                      <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> 0 mi Severe/NoTravel
                      </span>
                    )}

                    {risk_summary.high_miles > 0 && (
                      <span className="bg-orange-500/20 text-orange-400 border border-orange-500/30 px-1.5 py-0.5 rounded flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> {risk_summary.high_miles} mi High
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Rationale explanation */}
              <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400 italic">
                {route.recommendation_rationale}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
