import React from 'react';
import { Checkpoint } from '../types';
import { X, Wind, CloudRain, Snowflake, AlertOctagon, CheckCircle2 } from 'lucide-react';

interface CheckpointModalProps {
  checkpoint: Checkpoint | null;
  onClose: () => void;
}

export const CheckpointModal: React.FC<CheckpointModalProps> = ({
  checkpoint,
  onClose,
}) => {
  if (!checkpoint) return null;

  const evalRes = checkpoint.risk_evaluation;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl text-slate-100 relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-md"
            style={{ backgroundColor: evalRes.overall_color }}
          >
            {evalRes.overall_score}
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-100">
              Checkpoint #{checkpoint.index} — Mile {checkpoint.distance_from_origin_miles}
            </h3>
            <p className="text-xs text-slate-400">
              ETA: {new Date(checkpoint.eta).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div
          className="px-3 py-2 rounded-xl border text-xs font-semibold mb-4 flex items-center justify-between"
          style={{
            borderColor: evalRes.overall_color,
            backgroundColor: `${evalRes.overall_color}15`,
            color: evalRes.overall_color,
          }}
        >
          <span className="flex items-center gap-1.5">
            {evalRes.is_no_travel ? (
              <AlertOctagon className="w-4 h-4" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            Status: {evalRes.overall_level.toUpperCase()}
          </span>
          <span className="text-[11px] opacity-80">
            Coordinates: {checkpoint.lat.toFixed(3)}, {checkpoint.lng.toFixed(3)}
          </span>
        </div>

        {/* Hazard details */}
        <div className="space-y-2 text-xs">
          {/* Wind */}
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-start justify-between">
            <div className="flex items-start gap-2.5">
              <Wind className="w-4 h-4 text-sky-400 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-200">Wind Velocity:</span>
                <p className="text-slate-400 mt-0.5">{evalRes.wind.reason}</p>
              </div>
            </div>
            <span className="font-bold text-slate-200">{checkpoint.weather.wind_mph} mph</span>
          </div>

          {/* Rain */}
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-start justify-between">
            <div className="flex items-start gap-2.5">
              <CloudRain className="w-4 h-4 text-indigo-400 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-200">Rainfall Rate:</span>
                <p className="text-slate-400 mt-0.5">{evalRes.rain.reason}</p>
              </div>
            </div>
            <span className="font-bold text-slate-200">{checkpoint.weather.rain_in_hr} in/hr</span>
          </div>

          {/* Snow */}
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-start justify-between">
            <div className="flex items-start gap-2.5">
              <Snowflake className="w-4 h-4 text-cyan-300 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-200">Snowfall Rate:</span>
                <p className="text-slate-400 mt-0.5">{evalRes.snow.reason}</p>
              </div>
            </div>
            <span className="font-bold text-slate-200">{checkpoint.weather.snow_in_hr} in/hr</span>
          </div>
        </div>

        {/* Primary Hazard message */}
        <div className="mt-4 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300">
          <strong className="text-amber-400 block mb-0.5">Primary Advisory:</strong>
          {evalRes.primary_hazard}
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold py-2 rounded-xl transition"
        >
          Close Inspection
        </button>
      </div>
    </div>
  );
};
