import React from 'react';
import { Checkpoint } from '../types';
import { X, Wind, CloudRain, Snowflake, AlertOctagon, CheckCircle2 } from 'lucide-react';

interface CheckpointModalProps {
  checkpoint: Checkpoint | null;
  onClose: () => void;
  theme?: 'dark' | 'light';
}

export const CheckpointModal: React.FC<CheckpointModalProps> = ({
  checkpoint,
  onClose,
  theme = 'dark',
}) => {
  if (!checkpoint) return null;

  const isDark = theme === 'dark';
  const evalRes = checkpoint.risk_evaluation;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
      <div
        className={`border rounded-2xl max-w-md w-full p-5 shadow-2xl relative transition-all animate-in fade-in zoom-in-95 duration-150 ${
          isDark
            ? 'bg-[#0B0F19] border-blue-900/40 text-slate-100 shadow-blue-950/40'
            : 'bg-white border-slate-200 text-slate-900 shadow-slate-300'
        }`}
      >
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-1.5 rounded-lg transition ${
            isDark
              ? 'text-slate-400 hover:text-white hover:bg-slate-800'
              : 'text-slate-500 hover:text-black hover:bg-slate-100'
          }`}
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold text-white shadow-md"
            style={{ backgroundColor: evalRes.overall_color }}
          >
            {evalRes.overall_score}
          </div>
          <div>
            <h3 className="font-bold text-sm tracking-wide">
              Point de Contrôle #{checkpoint.index} — Mile {checkpoint.distance_from_origin_miles}
            </h3>
            <p className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              ETA : {new Date(checkpoint.eta).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div
          className="px-3 py-2 rounded-xl border text-xs font-bold mb-4 flex items-center justify-between"
          style={{
            borderColor: `${evalRes.overall_color}60`,
            backgroundColor: `${evalRes.overall_color}15`,
            color: evalRes.overall_color,
          }}
        >
          <span className="flex items-center gap-1.5 uppercase tracking-wider font-mono">
            {evalRes.is_no_travel ? (
              <AlertOctagon className="w-4 h-4" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            Statut : {evalRes.overall_level}
          </span>
          <span className="text-[10px] font-mono opacity-80">
            GPS: {checkpoint.lat.toFixed(3)}, {checkpoint.lng.toFixed(3)}
          </span>
        </div>

        {/* Hazard details */}
        <div className="space-y-2 text-xs">
          {/* Wind */}
          <div
            className={`p-3 rounded-xl border flex items-start justify-between ${
              isDark ? 'bg-[#070A12] border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <Wind className="w-4 h-4 text-blue-500 mt-0.5" />
              <div>
                <span className="font-semibold text-xs">Vitesse du Vent :</span>
                <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {evalRes.wind.reason}
                </p>
              </div>
            </div>
            <span className="font-mono font-bold">{checkpoint.weather.wind_mph} mph</span>
          </div>

          {/* Rain */}
          <div
            className={`p-3 rounded-xl border flex items-start justify-between ${
              isDark ? 'bg-[#070A12] border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <CloudRain className="w-4 h-4 text-blue-400 mt-0.5" />
              <div>
                <span className="font-semibold text-xs">Intensité Pluie :</span>
                <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {evalRes.rain.reason}
                </p>
              </div>
            </div>
            <span className="font-mono font-bold">{checkpoint.weather.rain_in_hr} in/hr</span>
          </div>

          {/* Snow */}
          <div
            className={`p-3 rounded-xl border flex items-start justify-between ${
              isDark ? 'bg-[#070A12] border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <Snowflake className="w-4 h-4 text-cyan-400 mt-0.5" />
              <div>
                <span className="font-semibold text-xs">Chute de Neige :</span>
                <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {evalRes.snow.reason}
                </p>
              </div>
            </div>
            <span className="font-mono font-bold">{checkpoint.weather.snow_in_hr} in/hr</span>
          </div>
        </div>

        {/* Primary Hazard message */}
        <div
          className={`mt-4 p-3 rounded-xl border text-xs ${
            isDark
              ? 'bg-blue-950/20 border-blue-900/40 text-slate-300'
              : 'bg-blue-50/60 border-blue-200 text-slate-800'
          }`}
        >
          <strong className="text-blue-500 block mb-0.5 uppercase tracking-wider text-[10px]">
            Synthèse d'Avertissement :
          </strong>
          {evalRes.primary_hazard}
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider py-2.5 rounded-xl transition shadow-md shadow-blue-600/20 cursor-pointer"
        >
          Fermer l'Inspection
        </button>
      </div>
    </div>
  );
};
