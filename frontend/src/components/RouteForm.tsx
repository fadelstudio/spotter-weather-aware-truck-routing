import React from 'react';
import { Navigation, Calendar, Weight, Sliders, Play, RotateCcw } from 'lucide-react';

interface RouteFormProps {
  origin: string;
  setOrigin: (v: string) => void;
  destination: string;
  setDestination: (v: string) => void;
  departureTime: string;
  setDepartureTime: (v: string) => void;
  loadWeight: number;
  setLoadWeight: (v: number) => void;
  samplingInterval: number;
  setSamplingInterval: (v: number) => void;
  weatherMode: 'live' | 'scenario';
  setWeatherMode: (v: 'live' | 'scenario') => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
}

export const RouteForm: React.FC<RouteFormProps> = ({
  origin,
  setOrigin,
  destination,
  setDestination,
  departureTime,
  setDepartureTime,
  loadWeight,
  setLoadWeight,
  samplingInterval,
  setSamplingInterval,
  weatherMode,
  setWeatherMode,
  onSubmit,
  loading
}) => {
  const presets = [
    { name: 'Chicago → Denver (Winter Test)', orig: 'Chicago, IL', dest: 'Denver, CO', weight: 42000, mode: 'scenario' as const },
    { name: 'Seattle → Salt Lake City', orig: 'Seattle, WA', dest: 'Salt Lake City, UT', weight: 32000, mode: 'live' as const },
    { name: 'Dallas → Atlanta (Southern Run)', orig: 'Dallas, TX', dest: 'Atlanta, GA', weight: 28000, mode: 'live' as const }
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl text-slate-100">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-emerald-400">
          <Navigation className="w-5 h-5" /> Trip Parameters
        </h2>
        <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded">Spotter Engine v1.0</span>
      </div>

      {/* Quick Presets */}
      <div className="mb-4">
        <label className="text-xs font-medium text-slate-400 block mb-1.5">Quick Route Presets:</label>
        <div className="flex flex-wrap gap-1.5">
          {presets.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setOrigin(p.orig);
                setDestination(p.dest);
                setLoadWeight(p.weight);
                setWeatherMode(p.mode);
              }}
              className="text-xs bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1 rounded border border-slate-700/60 transition"
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {/* Origin & Destination */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Origin City</label>
            <input
              type="text"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="e.g. Chicago, IL"
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Destination City</label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="e.g. Denver, CO"
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Departure Time */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" /> Departure Date & Time
          </label>
          <input
            type="datetime-local"
            value={departureTime}
            onChange={(e) => setDepartureTime(e.target.value)}
            required
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Load Weight */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
              <Weight className="w-3.5 h-3.5 text-slate-400" /> Cargo Load Weight
            </label>
            <span className="text-xs font-semibold text-emerald-400">
              {loadWeight.toLocaleString()} lbs
              {loadWeight > 40000 && <span className="text-amber-400 ml-1.5 font-normal">(Heavy: Wind sensitivity escalated)</span>}
              {loadWeight > 30000 && loadWeight <= 40000 && <span className="text-sky-400 ml-1.5 font-normal">(Moderate Load)</span>}
            </span>
          </div>
          <input
            type="range"
            min="5000"
            max="60000"
            step="1000"
            value={loadWeight}
            onChange={(e) => setLoadWeight(Number(e.target.value))}
            className="w-full accent-emerald-500 bg-slate-950 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
            <span>Empty (5k lb)</span>
            <span>30k lb threshold</span>
            <span>40k lb threshold</span>
            <span>Max (60k lb)</span>
          </div>
        </div>

        {/* Sampling Interval */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-slate-400" /> Weather Sampling Interval
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[10, 25, 50].map((step) => (
              <button
                key={step}
                type="button"
                onClick={() => setSamplingInterval(step)}
                className={`py-1.5 text-xs rounded-lg border font-medium transition ${
                  samplingInterval === step
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                    : 'bg-slate-950 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                Every {step} miles
              </button>
            ))}
          </div>
        </div>

        {/* Atmospheric Source / Stress Test Scenario */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center justify-between">
            <span>Atmospheric Engine Mode:</span>
            <span className="text-[10px] text-indigo-400 font-mono">
              {weatherMode === 'scenario' ? 'Blizzard Stress-Test' : 'Live Open-Meteo'}
            </span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setWeatherMode('live')}
              className={`py-1.5 px-2 text-xs rounded-lg border font-medium transition flex items-center justify-center gap-1.5 ${
                weatherMode === 'live'
                  ? 'bg-sky-500/20 border-sky-500 text-sky-400 font-semibold'
                  : 'bg-slate-950 border-slate-700 text-slate-400 hover:border-slate-600'
              }`}
            >
              🌐 Live Forecast (Open-Meteo)
            </button>
            <button
              type="button"
              onClick={() => setWeatherMode('scenario')}
              className={`py-1.5 px-2 text-xs rounded-lg border font-medium transition flex items-center justify-center gap-1.5 ${
                weatherMode === 'scenario'
                  ? 'bg-amber-500/20 border-amber-500 text-amber-400 font-semibold'
                  : 'bg-slate-950 border-slate-700 text-slate-400 hover:border-slate-600'
              }`}
              title="Demonstrates Spotter weight escalation (42k lb + 40 mph wind = Severe) and safe detour recommendation"
            >
              ⚡ Storm Scenario (Demo Rules)
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition"
        >
          {loading ? (
            <>
              <RotateCcw className="w-4 h-4 animate-spin" /> Evaluating Weather Along Routes...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white" /> Analyze & Recommend Safest Route
            </>
          )}
        </button>
      </form>
    </div>
  );
};
