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
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
      <div
        className={`rounded-xl max-w-md w-full p-5 relative shadow-xl transition-all animate-in fade-in zoom-in-95 duration-150 ${
          isDark
            ? 'bg-[#0B0F19] text-slate-100'
            : 'bg-white text-slate-900'
        }`}
      >
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-1.5 rounded-lg transition cursor-pointer ${
            isDark
              ? 'text-slate-400 hover:text-white hover:bg-white/5'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center font-mono font-bold text-white text-sm shadow-xs"
            style={{ backgroundColor: evalRes.overall_color }}
          >
            {evalRes.overall_score}
          </div>
          <div>
            <h3 className="font-semibold text-sm tracking-wide">
              Checkpoint #{checkpoint.index} — Mile {checkpoint.distance_from_origin_miles}
            </h3>
            <p className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              ETA: {new Date(checkpoint.eta).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div
          className="px-3 py-2 rounded-xl text-xs font-bold mb-4 flex items-center justify-between"
          style={{
            backgroundColor: `${evalRes.overall_color}18`,
            color: evalRes.overall_color,
          }}
        >
          <span className="flex items-center gap-1.5 uppercase tracking-wider font-mono">
            {evalRes.is_no_travel ? (
              <AlertOctagon className="w-4 h-4" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            Status: {evalRes.overall_level}
          </span>
          <span className="text-[10px] font-mono opacity-80">
            GPS: {checkpoint.lat.toFixed(3)}, {checkpoint.lng.toFixed(3)}
          </span>
        </div>

        {/* Hazard details */}
        <div className="space-y-2 text-xs">
          {/* Wind */}
          <div
            className={`p-3 rounded-xl flex items-start justify-between ${
              isDark ? 'bg-[#070A12]' : 'bg-slate-50'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <Wind className="w-4 h-4 text-blue-500 mt-0.5" />
              <div>
                <span className="font-semibold text-xs">Wind Speed:</span>
                <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {evalRes.wind.reason}
                </p>
              </div>
            </div>
            <span className="font-mono font-bold">{checkpoint.weather.wind_mph} mph</span>
          </div>

          {/* Rain */}
          <div
            className={`p-3 rounded-xl flex items-start justify-between ${
              isDark ? 'bg-[#070A12]' : 'bg-slate-50'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <CloudRain className="w-4 h-4 text-blue-400 mt-0.5" />
              <div>
                <span className="font-semibold text-xs">Rainfall Rate:</span>
                <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {evalRes.rain.reason}
                </p>
              </div>
            </div>
            <span className="font-mono font-bold">{checkpoint.weather.rain_in_hr} in/hr</span>
          </div>

          {/* Snow */}
          <div
            className={`p-3 rounded-xl flex items-start justify-between ${
              isDark ? 'bg-[#070A12]' : 'bg-slate-50'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <Snowflake className="w-4 h-4 text-cyan-400 mt-0.5" />
              <div>
                <span className="font-semibold text-xs">Snowfall Rate:</span>
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
          className={`mt-4 p-3 rounded-lg text-xs ${
            isDark
              ? 'bg-[#070A12] text-slate-300'
              : 'bg-slate-50 text-slate-800'
          }`}
        >
          <strong
            className={`block mb-0.5 uppercase tracking-wider text-[10px] ${
              isDark ? 'text-blue-400' : 'text-blue-600'
            }`}
          >
            Warning Summary:
          </strong>
          {evalRes.primary_hazard}
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold uppercase tracking-wider py-2.5 rounded-lg transition cursor-pointer shadow-sm"
        >
          Close Inspection
        </button>
      </div>
    </div>
  );
};
