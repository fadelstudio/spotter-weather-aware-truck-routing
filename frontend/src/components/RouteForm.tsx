import React from 'react';
import { Navigation, Calendar, Weight, Sliders, Play, RotateCcw, Globe, Zap } from 'lucide-react';

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
  theme?: 'dark' | 'light';
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
  loading,
  theme = 'dark',
}) => {
  const presets = [
    {
      name: 'Chicago → Denver',
      subtitle: 'Winter Squall',
      orig: 'Chicago, IL',
      dest: 'Denver, CO',
      weight: 42000,
      mode: 'scenario' as const,
    },
    {
      name: 'Seattle → Salt Lake',
      subtitle: 'Mountain Pass',
      orig: 'Seattle, WA',
      dest: 'Salt Lake City, UT',
      weight: 32000,
      mode: 'live' as const,
    },
    {
      name: 'Dallas → Atlanta',
      subtitle: 'Southern Interstate',
      orig: 'Dallas, TX',
      dest: 'Atlanta, GA',
      weight: 28000,
      mode: 'live' as const,
    },
  ];

  const isDark = theme === 'dark';

  return (
    <div
      className={`rounded-xl p-5 shadow-sm transition-colors ${
        isDark
          ? 'bg-[#0B0F19] text-slate-100'
          : 'bg-white text-slate-900'
      }`}
    >
      {/* Header */}
      <div
        className={`flex items-center justify-between pb-3 mb-4 border-b ${
          isDark ? 'border-white/[0.04]' : 'border-black/[0.04]'
        }`}
      >
        <h2 className="text-sm font-semibold flex items-center gap-2 text-blue-500 tracking-wide uppercase">
          <Navigation className="w-4 h-4" /> Trip Parameters
        </h2>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded text-blue-400 bg-blue-500/10">
          Spotter AI v2.0
        </span>
      </div>

      {/* Quick Presets */}
      <div className="mb-4">
        <label
          className={`text-[10px] font-semibold uppercase tracking-wider block mb-1.5 ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}
        >
          Quick Route Presets:
        </label>
        <div className="grid grid-cols-3 gap-1.5">
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
              className={`p-2.5 rounded-lg text-left transition text-xs flex flex-col justify-between cursor-pointer ${
                isDark
                  ? 'bg-[#070A12] hover:bg-slate-900 text-slate-200'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-800'
              }`}
            >
              <span className="font-medium truncate">{p.name}</span>
              <span
                className={`text-[9px] font-mono mt-0.5 truncate ${
                  isDark ? 'text-blue-400' : 'text-blue-600'
                }`}
              >
                {p.subtitle}
              </span>
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {/* Origin & Destination */}
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label
              className={`block text-[10px] font-semibold uppercase tracking-wider mb-1 ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              Origin
            </label>
            <input
              type="text"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="e.g. Chicago, IL"
              required
              className={`w-full rounded-lg px-3 py-2 text-xs font-medium transition focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                isDark
                  ? 'bg-[#070A12] text-white'
                  : 'bg-slate-50 text-slate-900'
              }`}
            />
          </div>
          <div>
            <label
              className={`block text-[10px] font-semibold uppercase tracking-wider mb-1 ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              Destination
            </label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="e.g. Denver, CO"
              required
              className={`w-full rounded-lg px-3 py-2 text-xs font-medium transition focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                isDark
                  ? 'bg-[#070A12] text-white'
                  : 'bg-slate-50 text-slate-900'
              }`}
            />
          </div>
        </div>

        {/* Departure Time */}
        <div>
          <label
            className={`block text-[10px] font-semibold uppercase tracking-wider mb-1 flex items-center gap-1.5 ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-blue-500" /> Departure Date & Time
          </label>
          <input
            type="datetime-local"
            value={departureTime}
            onChange={(e) => setDepartureTime(e.target.value)}
            required
            className={`w-full rounded-lg px-3 py-2 text-xs font-medium transition focus:outline-none focus:ring-1 focus:ring-blue-500 ${
              isDark
                ? 'bg-[#070A12] text-white'
                : 'bg-slate-50 text-slate-900'
            }`}
          />
        </div>

        {/* Load Weight */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label
              className={`text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1.5 ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              <Weight className="w-3.5 h-3.5 text-blue-500" /> Cargo Load Weight
            </label>
            <span
              className={`text-xs font-mono font-bold ${
                isDark ? 'text-blue-400' : 'text-blue-600'
              }`}
            >
              {loadWeight.toLocaleString()} lbs
              {loadWeight > 40000 && (
                <span
                  className={`ml-1.5 font-sans font-medium text-[10px] ${
                    isDark ? 'text-red-400' : 'text-red-600'
                  }`}
                >
                  (Wind Sensitivity: Severe)
                </span>
              )}
            </span>
          </div>
          <input
            type="range"
            min="5000"
            max="60000"
            step="1000"
            value={loadWeight}
            onChange={(e) => setLoadWeight(Number(e.target.value))}
            className={`w-full accent-blue-600 cursor-pointer h-1.5 rounded-lg ${
              isDark ? 'bg-slate-800' : 'bg-slate-200'
            }`}
          />
          <div
            className={`flex justify-between text-[9px] font-mono mt-1 ${
              isDark ? 'text-slate-500' : 'text-slate-400'
            }`}
          >
            <span>5k lb</span>
            <span className={isDark ? 'text-amber-400' : 'text-amber-600'}>30k threshold</span>
            <span className={isDark ? 'text-red-400' : 'text-red-600'}>40k threshold</span>
            <span>60k lb</span>
          </div>
        </div>

        {/* Sampling Interval */}
        <div>
          <label
            className={`block text-[10px] font-semibold uppercase tracking-wider mb-1 flex items-center gap-1.5 ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-blue-500" /> Weather Sampling Interval
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {[10, 25, 50].map((step) => (
              <button
                key={step}
                type="button"
                onClick={() => setSamplingInterval(step)}
                className={`py-1.5 text-xs rounded-lg font-medium transition cursor-pointer ${
                  samplingInterval === step
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : isDark
                    ? 'bg-[#070A12] text-slate-400 hover:text-white hover:bg-slate-900'
                    : 'bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Every {step} miles
              </button>
            ))}
          </div>
        </div>

        {/* Atmospheric Source */}
        <div>
          <label
            className={`block text-[10px] font-semibold uppercase tracking-wider mb-1 flex items-center justify-between ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            <span>Atmospheric Engine Mode:</span>
            <span
              className={`text-[10px] font-mono ${
                isDark ? 'text-blue-400' : 'text-blue-600'
              }`}
            >
              {weatherMode === 'scenario' ? 'Blizzard Storm Scenario' : 'Direct (Open-Meteo)'}
            </span>
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => setWeatherMode('live')}
              className={`py-1.5 px-2 text-xs rounded-lg font-medium transition flex items-center justify-center gap-1.5 cursor-pointer ${
                weatherMode === 'live'
                  ? isDark
                    ? 'bg-blue-600/20 text-blue-400 font-semibold'
                    : 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                  : isDark
                  ? 'bg-[#070A12] text-slate-400 hover:text-white hover:bg-slate-900'
                  : 'bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Globe className={`w-3.5 h-3.5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              <span>Direct (Open-Meteo)</span>
            </button>
            <button
              type="button"
              onClick={() => setWeatherMode('scenario')}
              className={`py-1.5 px-2 text-xs rounded-lg font-medium transition flex items-center justify-center gap-1.5 cursor-pointer ${
                weatherMode === 'scenario'
                  ? isDark
                    ? 'bg-red-500/20 text-red-400 font-semibold'
                    : 'bg-red-50 text-red-700 font-semibold shadow-xs'
                  : isDark
                  ? 'bg-[#070A12] text-slate-400 hover:text-white hover:bg-slate-900'
                  : 'bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title="Demonstrates severe escalation for loads >40,000 lbs"
            >
              <Zap className={`w-3.5 h-3.5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
              <span>Storm Scenario</span>
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-semibold uppercase tracking-wider py-2.5 rounded-lg flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
        >
          {loading ? (
            <>
              <RotateCcw className="w-4 h-4 animate-spin" /> Computing Weather & Risk...
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-white" /> Optimize & Recommend Route
            </>
          )}
        </button>
      </form>
    </div>
  );
};
