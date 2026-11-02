import React, { useState, useEffect } from 'react';
import { RouteForm } from './components/RouteForm';
import { RouteMap } from './components/RouteMap';
import { RouteComparison } from './components/RouteComparison';
import { HeatmapSlider } from './components/HeatmapSlider';
import { CheckpointModal } from './components/CheckpointModal';
import { RoutingAnalysisResponse, Checkpoint } from './types';
import { analyzeRoutes } from './services/api';
import { Truck, ShieldCheck, Github, Sun, Moon } from 'lucide-react';

export const App: React.FC = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [origin, setOrigin] = useState('Chicago, IL');
  const [destination, setDestination] = useState('Denver, CO');
  const [departureTime, setDepartureTime] = useState(() => {
    const d = new Date();
    d.setMinutes(0);
    d.setSeconds(0);
    return d.toISOString().slice(0, 16);
  });
  const [loadWeight, setLoadWeight] = useState(42000); // 42k lb triggers severe rule at 35-44 mph
  const [samplingInterval, setSamplingInterval] = useState(25);
  const [weatherMode, setWeatherMode] = useState<'live' | 'scenario'>('scenario');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<RoutingAnalysisResponse | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string>('');
  const [selectedHour, setSelectedHour] = useState<number>(0);
  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<Checkpoint | null>(null);

  const isDark = theme === 'dark';

  const handleAnalyze = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await analyzeRoutes({
        origin,
        destination,
        departure_time: new Date(departureTime).toISOString(),
        load_weight: loadWeight,
        sampling_interval_miles: samplingInterval,
        weather_mode: weatherMode,
      });

      setData(res);
      if (res.routes && res.routes.length > 0) {
        const rec = res.routes.find((r) => r.is_recommended) || res.routes[0];
        setSelectedRouteId(rec.id);
      }
    } catch (err: any) {
      console.error('Failed to analyze routes:', err);
      setError(err.message || 'Erreur lors de la communication avec le moteur météo & routage.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleAnalyze();
  }, []);

  const activeRoute = data?.routes.find((r) => r.id === selectedRouteId);

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-200 font-sans ${
        isDark ? 'bg-[#070A12] text-slate-100' : 'bg-[#F8FAFC] text-slate-900'
      }`}
    >
      {/* Top Header */}
      <header
        className={`sticky top-0 z-50 px-6 py-3 border-b backdrop-blur-md flex flex-wrap items-center justify-between gap-4 transition-colors ${
          isDark
            ? 'bg-[#0B0F19]/90 border-blue-900/30'
            : 'bg-white/90 border-slate-200'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="bg-blue-600/15 text-blue-500 p-2 rounded-xl border border-blue-500/30 shadow-sm shadow-blue-500/10">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-tight flex items-center gap-2">
              <span>Weather-Aware Truck Routing</span>
              <span className="text-[10px] bg-blue-500/10 text-blue-400 font-mono px-2 py-0.5 rounded-full border border-blue-500/20">
                Spotter AI
              </span>
            </h1>
            <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Optimisation Sécurisée & Modélisation Atmosphérique des Poids Lourds
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          {/* Light / Dark Mode Toggle Button */}
          <button
            type="button"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer ${
              isDark
                ? 'bg-slate-900 hover:bg-slate-800 text-blue-400 border-slate-800'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
            }`}
            title="Basculer Mode Clair / Sombre"
          >
            {isDark ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[11px]">Mode Clair</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-[11px]">Mode Sombre</span>
              </>
            )}
          </button>

          <div
            className={`hidden sm:flex items-center gap-2 font-mono text-[11px] px-2.5 py-1.5 rounded-lg border ${
              isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
            <span>Cheikh M. Fadel Diop</span>
          </div>

          <a
            href="https://github.com/cheikhfadeldiop"
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition ${
              isDark
                ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-800'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
            }`}
          >
            <Github className="w-3.5 h-3.5" />
            <span className="text-[11px] font-medium">GitHub</span>
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Form & Route Summary */}
        <div className="lg:col-span-4 space-y-4">
          <RouteForm
            origin={origin}
            setOrigin={setOrigin}
            destination={destination}
            setDestination={setDestination}
            departureTime={departureTime}
            setDepartureTime={setDepartureTime}
            loadWeight={loadWeight}
            setLoadWeight={setLoadWeight}
            samplingInterval={samplingInterval}
            setSamplingInterval={setSamplingInterval}
            weatherMode={weatherMode}
            setWeatherMode={setWeatherMode}
            onSubmit={handleAnalyze}
            loading={loading}
            theme={theme}
          />

          {/* Active Route Telemetry Pill */}
          {activeRoute && (
            <div
              className={`rounded-xl p-4 border transition-colors shadow-lg ${
                isDark
                  ? 'bg-[#0B0F19] border-blue-900/30 text-slate-300'
                  : 'bg-white border-slate-200 text-slate-800 shadow-slate-100'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-xs uppercase tracking-wider text-blue-500">
                  Itinéraire Actif : {activeRoute.name}
                </span>
                {activeRoute.is_recommended && (
                  <span className="text-[10px] font-mono font-bold bg-blue-500/15 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/30">
                    ★ Choix Recommandé
                  </span>
                )}
              </div>
              <p className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {activeRoute.recommendation_rationale}
              </p>
              <div
                className={`pt-2 mt-2 border-t border-dashed flex justify-between text-[10px] font-mono ${
                  isDark ? 'border-slate-800 text-slate-500' : 'border-slate-200 text-slate-500'
                }`}
              >
                <span>Checkpoints : {activeRoute.checkpoints.length}</span>
                <span>Distance Totale : {activeRoute.total_distance_miles} mi</span>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl text-xs font-mono">
              <strong>Notice:</strong> {error}
            </div>
          )}
        </div>

        {/* Right Column: Map, Heatmap Slider, and Route Comparison */}
        <div className="lg:col-span-8 space-y-4">
          <RouteMap
            routes={data?.routes || []}
            selectedRouteId={selectedRouteId}
            onSelectRoute={(id) => setSelectedRouteId(id)}
            selectedHour={selectedHour}
            showHeatmap={showHeatmap}
            corridorHeatmap={data?.corridor_heatmap}
            onSelectCheckpoint={(cp) => setSelectedCheckpoint(cp)}
            theme={theme}
          />

          <HeatmapSlider
            hours={data?.corridor_heatmap?.hours || [0, 3, 6, 9, 12, 18, 24, 36, 48]}
            selectedHour={selectedHour}
            onHourChange={(h) => setSelectedHour(h)}
            showHeatmap={showHeatmap}
            onToggleHeatmap={() => setShowHeatmap(!showHeatmap)}
            theme={theme}
          />

          <RouteComparison
            routes={data?.routes || []}
            selectedRouteId={selectedRouteId}
            onSelectRoute={(id) => setSelectedRouteId(id)}
            theme={theme}
          />
        </div>
      </main>

      {/* Checkpoint Inspection Modal */}
      <CheckpointModal
        checkpoint={selectedCheckpoint}
        onClose={() => setSelectedCheckpoint(null)}
        theme={theme}
      />

      {/* Footer */}
      <footer
        className={`border-t py-3.5 px-6 text-center text-[11px] font-mono transition-colors ${
          isDark
            ? 'border-blue-900/20 bg-[#070A12] text-slate-500'
            : 'border-slate-200 bg-slate-50 text-slate-500'
        }`}
      >
        Spotter AI Weather-Aware Truck Routing • Candidate: Cheikh M. Fadel Diop • Mission-Critical Fleet Decision Support
      </footer>
    </div>
  );
};
