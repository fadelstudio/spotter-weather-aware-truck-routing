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
      className={`rounded-xl p-5 border transition-all shadow-xl ${
        isDark
          ? 'bg-[#0B0F19] border-blue-900/30 text-slate-100 shadow-blue-950/10'
          : 'bg-white border-slate-200 text-slate-900 shadow-slate-200/50'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-dashed border-blue-500/20">
        <h2 className="text-sm font-bold flex items-center gap-2 text-blue-500 tracking-wide uppercase">
          <Navigation className="w-4 h-4" /> Paramètres d'Itinéraire
        </h2>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-blue-500/30 text-blue-400 bg-blue-500/10">
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
          Préréglages d'essai :
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
              className={`p-2 rounded-lg text-left border transition-all text-xs flex flex-col justify-between ${
                isDark
                  ? 'bg-slate-900/60 hover:bg-blue-950/40 border-slate-800 hover:border-blue-500/40 text-slate-200'
                  : 'bg-slate-50 hover:bg-blue-50/50 border-slate-200 hover:border-blue-400 text-slate-800'
              }`}
            >
              <span className="font-semibold truncate">{p.name}</span>
              <span className="text-[9px] text-blue-400 font-mono mt-0.5 truncate">{p.subtitle}</span>
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
              Origine
            </label>
            <input
              type="text"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="ex: Chicago, IL"
              required
              className={`w-full rounded-lg px-3 py-2 text-xs font-medium border transition focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                isDark
                  ? 'bg-[#070A12] border-slate-800 text-white focus:border-blue-500'
                  : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500'
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
              placeholder="ex: Denver, CO"
              required
              className={`w-full rounded-lg px-3 py-2 text-xs font-medium border transition focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                isDark
                  ? 'bg-[#070A12] border-slate-800 text-white focus:border-blue-500'
                  : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500'
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
            <Calendar className="w-3.5 h-3.5 text-blue-500" /> Date & Heure de départ
          </label>
          <input
            type="datetime-local"
            value={departureTime}
            onChange={(e) => setDepartureTime(e.target.value)}
            required
            className={`w-full rounded-lg px-3 py-2 text-xs font-medium border transition focus:outline-none focus:ring-1 focus:ring-blue-500 ${
              isDark
                ? 'bg-[#070A12] border-slate-800 text-white focus:border-blue-500'
                : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500'
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
              <Weight className="w-3.5 h-3.5 text-blue-500" /> Charge transportée
            </label>
            <span className="text-xs font-mono font-bold text-blue-400">
              {loadWeight.toLocaleString()} lbs
              {loadWeight > 40000 && (
                <span className="text-red-500 ml-1.5 font-sans font-medium text-[10px]">
                  (Sensibilité Vent : Sévère)
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
            className="w-full accent-blue-600 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
          <div className="flex justify-between text-[9px] text-slate-500 font-mono mt-1">
            <span>5k lb</span>
            <span className="text-amber-500">30k seuil</span>
            <span className="text-red-500">40k seuil</span>
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
            <Sliders className="w-3.5 h-3.5 text-blue-500" /> Pas d'échantillonnage météo
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {[10, 25, 50].map((step) => (
              <button
                key={step}
                type="button"
                onClick={() => setSamplingInterval(step)}
                className={`py-1.5 text-xs rounded-lg border font-medium transition ${
                  samplingInterval === step
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-900/30 font-semibold'
                    : isDark
                    ? 'bg-[#070A12] border-slate-800 text-slate-400 hover:border-slate-700'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                {step} miles
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
            <span>Source Atmosphérique :</span>
            <span className="text-[10px] text-blue-400 font-mono">
              {weatherMode === 'scenario' ? 'Tempête Blizzard' : 'Open-Meteo Direct'}
            </span>
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => setWeatherMode('live')}
              className={`py-1.5 px-2 text-xs rounded-lg border font-medium transition flex items-center justify-center gap-1.5 ${
                weatherMode === 'live'
                  ? 'bg-blue-600/20 border-blue-500 text-blue-400 font-bold'
                  : isDark
                  ? 'bg-[#070A12] border-slate-800 text-slate-400 hover:border-slate-700'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              🌐 Direct (Open-Meteo)
            </button>
            <button
              type="button"
              onClick={() => setWeatherMode('scenario')}
              className={`py-1.5 px-2 text-xs rounded-lg border font-medium transition flex items-center justify-center gap-1.5 ${
                weatherMode === 'scenario'
                  ? 'bg-red-500/20 border-red-500 text-red-400 font-bold'
                  : isDark
                  ? 'bg-[#070A12] border-slate-800 text-slate-400 hover:border-slate-700'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
              title="Démontre le basculement en Severe pour >40 000 lbs"
            >
              ⚡ Scénario Tempête
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-500 active:scale-[0.99] disabled:bg-slate-700 text-white text-xs font-bold uppercase tracking-wider py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
        >
          {loading ? (
            <>
              <RotateCcw className="w-4 h-4 animate-spin" /> Calcul Météo & Risques...
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-white" /> Optimiser & Recommander
            </>
          )}
        </button>
      </form>
    </div>
  );
};
