import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Layers } from 'lucide-react';

interface HeatmapSliderProps {
  hours: number[];
  selectedHour: number;
  onHourChange: (hour: number) => void;
  showHeatmap: boolean;
  onToggleHeatmap: () => void;
  theme?: 'dark' | 'light';
}

export const HeatmapSlider: React.FC<HeatmapSliderProps> = ({
  hours,
  selectedHour,
  onHourChange,
  showHeatmap,
  onToggleHeatmap,
  theme = 'dark',
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const isDark = theme === 'dark';

  // Play animation through available forecast hours
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isPlaying && hours.length > 0) {
      interval = setInterval(() => {
        onHourChange(
          (() => {
            const currentIdx = hours.indexOf(selectedHour);
            const nextIdx = (currentIdx + 1) % hours.length;
            return hours[nextIdx];
          })()
        );
      }, 1200);
    }
    return () => clearInterval(interval);
  }, [isPlaying, selectedHour, hours, onHourChange]);

  if (!hours || hours.length === 0) return null;

  return (
    <div
      className={`rounded-xl p-4 border transition-colors shadow-xl ${
        isDark
          ? 'bg-[#0B0F19] border-blue-900/30 text-slate-100 shadow-blue-950/10'
          : 'bg-white border-slate-200 text-slate-900 shadow-slate-200/50'
      }`}
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleHeatmap}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
              showHeatmap
                ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                : isDark
                ? 'bg-slate-900 border-slate-800 text-slate-400'
                : 'bg-slate-100 border-slate-200 text-slate-600'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            {showHeatmap ? 'Calque Météo Corridor Actif' : 'Calque Météo Masqué'}
          </button>

          <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Horizon Prévisionnel :{' '}
            <strong className="text-blue-500 font-mono">T+{selectedHour} Heures</strong>
          </span>
        </div>

        {/* Play / Pause Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border transition ${
              isDark
                ? 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border-blue-500/40'
                : 'bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-300'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" /> Pause
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" /> Animation Tempête
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setIsPlaying(false);
              onHourChange(hours[0]);
            }}
            className={`p-1.5 rounded-lg border transition ${
              isDark
                ? 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border-slate-800'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
            }`}
            title="Réinitialiser à T+0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Slider */}
      <div className="px-1">
        <input
          type="range"
          min={0}
          max={hours[hours.length - 1]}
          step={3}
          value={selectedHour}
          onChange={(e) => {
            setIsPlaying(false);
            const val = Number(e.target.value);
            const closest = hours.reduce((prev, curr) =>
              Math.abs(curr - val) < Math.abs(prev - val) ? curr : prev
            );
            onHourChange(closest);
          }}
          className="w-full accent-blue-600 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
        />

        {/* Ticks */}
        <div className="flex justify-between text-[10px] font-mono mt-1">
          {hours.map((h) => (
            <span
              key={h}
              className={`cursor-pointer transition ${
                h === selectedHour
                  ? 'text-blue-500 font-bold underline'
                  : isDark
                  ? 'text-slate-500 hover:text-slate-300'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
              onClick={() => {
                setIsPlaying(false);
                onHourChange(h);
              }}
            >
              +{h}h
            </span>
          ))}
        </div>
      </div>

      {/* Color Legend */}
      <div
        className={`flex flex-wrap items-center justify-between text-[10px] font-mono pt-2.5 mt-2 border-t border-dashed gap-2 ${
          isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'
        }`}
      >
        <span className="font-semibold uppercase tracking-wider">Légende Risque :</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block shadow-sm shadow-blue-500/50" /> Faible
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> Modéré
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" /> Élevé
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block shadow-sm shadow-red-500/50" /> Sévère
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-950 border border-red-500 inline-block" /> No Travel
          </span>
        </div>
      </div>
    </div>
  );
};
