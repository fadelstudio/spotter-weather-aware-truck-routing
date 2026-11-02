import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, CloudRain, Wind, Layers } from 'lucide-react';

interface HeatmapSliderProps {
  hours: number[];
  selectedHour: number;
  onHourChange: (hour: number) => void;
  showHeatmap: boolean;
  onToggleHeatmap: () => void;
}

export const HeatmapSlider: React.FC<HeatmapSliderProps> = ({
  hours,
  selectedHour,
  onHourChange,
  showHeatmap,
  onToggleHeatmap,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

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
    <div className="bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-xl p-4 shadow-2xl text-slate-100">
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleHeatmap}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${showHeatmap
                ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
          >
            <Layers className="w-3.5 h-3.5" />
            {showHeatmap ? 'Corridor Heatmap Active' : 'Heatmap Hidden'}
          </button>

          <span className="text-xs text-slate-400">
            Forecast Horizon: <strong className="text-indigo-400">T+{selectedHour} Hours</strong>
          </span>
        </div>

        {/* Play / Pause Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-700 transition"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-slate-300" /> Pause Simulation
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-slate-300" /> Play Storm Timeline
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setIsPlaying(false);
              onHourChange(hours[0]);
            }}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg border border-slate-700 transition"
            title="Reset to departure time"
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
            // snap to nearest hour in array
            const closest = hours.reduce((prev, curr) =>
              Math.abs(curr - val) < Math.abs(prev - val) ? curr : prev
            );
            onHourChange(closest);
          }}
          className="w-full accent-indigo-500 bg-slate-950 cursor-pointer h-2 rounded-lg"
        />

        {/* Ticks */}
        <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
          {hours.map((h) => (
            <span
              key={h}
              className={`cursor-pointer ${h === selectedHour ? 'text-indigo-400 font-bold underline' : ''}`}
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
      <div className="flex flex-wrap items-center justify-between text-[11px] pt-3 mt-2 border-t border-slate-800 gap-2">
        <span className="text-slate-400 font-medium">Risk Legend:</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Low
          </span>
          <span className="flex items-center gap-1 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> Moderate
          </span>
          <span className="flex items-center gap-1 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" /> High
          </span>
          <span className="flex items-center gap-1 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> Severe
          </span>
          <span className="flex items-center gap-1 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-red-950 border border-red-500 inline-block" /> No Travel
          </span>
        </div>
      </div>
    </div>
  );
};
