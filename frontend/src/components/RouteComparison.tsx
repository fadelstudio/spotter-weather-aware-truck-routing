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
          Options d'Itinéraires ({routes.length})
        </h3>
        <span className="text-[10px] text-blue-500 font-mono tracking-tight">
          Tri Hiérarchique de Sécurité Spotter
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
              className={`relative rounded-xl p-3.5 border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? isDark
                    ? 'bg-[#0E1526] border-blue-500 shadow-lg shadow-blue-950/50 ring-1 ring-blue-500/60'
                    : 'bg-blue-50/50 border-blue-500 shadow-md ring-1 ring-blue-400'
                  : isDark
                  ? 'bg-[#0B0F19] border-slate-800/90 hover:border-slate-700 hover:bg-[#0F172A]'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              {/* Badge Recommended */}
              {route.is_recommended && (
                <div className="absolute -top-2.5 right-3 bg-blue-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md uppercase tracking-wider border border-blue-400">
                  <Star className="w-2.5 h-2.5 fill-white" /> Recommandé
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                      isDark
                        ? 'bg-slate-900 border-slate-800 text-slate-300'
                        : 'bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    #{route.rank}
                  </span>
                  <span
                    className={`text-xs font-bold truncate max-w-[130px] ${
                      isDark ? 'text-slate-100' : 'text-slate-900'
                    }`}
                  >
                    {route.name}
                  </span>
                </div>

                {/* Primary Metrics */}
                <div
                  className={`grid grid-cols-2 gap-2 my-2 py-2 border-y border-dashed text-xs ${
                    isDark ? 'border-slate-800 text-slate-300' : 'border-slate-200 text-slate-700'
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
                <div className="my-2">
                  <div className="flex justify-between text-[10px] mb-1 font-mono">
                    <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Score de Risque :</span>
                    <span className="font-bold text-blue-500">
                      {risk_summary.average_risk_score} / 5.0
                    </span>
                  </div>

                  {/* Multi-segmented fine 3px line */}
                  <div
                    className={`h-2 w-full rounded-full flex overflow-hidden border ${
                      isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
                    }`}
                  >
                    {risk_summary.low_miles > 0 && (
                      <div
                        style={{
                          width: `${(risk_summary.low_miles / route.total_distance_miles) * 100}%`,
                        }}
                        className="bg-blue-500"
                        title={`Faible: ${risk_summary.low_miles} mi`}
                      />
                    )}
                    {risk_summary.moderate_miles > 0 && (
                      <div
                        style={{
                          width: `${(risk_summary.moderate_miles / route.total_distance_miles) * 100}%`,
                        }}
                        className="bg-amber-400"
                        title={`Modéré: ${risk_summary.moderate_miles} mi`}
                      />
                    )}
                    {risk_summary.high_miles > 0 && (
                      <div
                        style={{
                          width: `${(risk_summary.high_miles / route.total_distance_miles) * 100}%`,
                        }}
                        className="bg-orange-500"
                        title={`Élevé: ${risk_summary.high_miles} mi`}
                      />
                    )}
                    {risk_summary.severe_miles > 0 && (
                      <div
                        style={{
                          width: `${(risk_summary.severe_miles / route.total_distance_miles) * 100}%`,
                        }}
                        className="bg-red-500"
                        title={`Sévère: ${risk_summary.severe_miles} mi`}
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

                  {/* Hazard tags */}
                  <div className="flex flex-wrap gap-1 mt-2 text-[10px]">
                    {risk_summary.danger_miles > 0 ? (
                      <span className="bg-red-500/15 text-red-500 border border-red-500/30 px-1.5 py-0.5 rounded flex items-center gap-1 font-mono font-medium">
                        <AlertOctagon className="w-3 h-3" /> {risk_summary.danger_miles} mi Sévère/Interdit
                      </span>
                    ) : (
                      <span className="bg-blue-500/15 text-blue-500 border border-blue-500/30 px-1.5 py-0.5 rounded flex items-center gap-1 font-mono font-medium">
                        <CheckCircle2 className="w-3 h-3" /> 0 mi Danger Sévère
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Rationale explanation */}
              <div
                className={`mt-2 pt-2 border-t border-dashed text-[10px] leading-tight ${
                  isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'
                }`}
              >
                {route.recommendation_rationale}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
