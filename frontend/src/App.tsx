import React, { useState, useEffect } from 'react';
import { RouteForm } from './components/RouteForm';
import { RouteMap } from './components/RouteMap';
import { RouteComparison } from './components/RouteComparison';
import { HeatmapSlider } from './components/HeatmapSlider';
import { CheckpointModal } from './components/CheckpointModal';
import { RoutingAnalysisResponse, RouteOption, Checkpoint } from './types';
import { analyzeRoutes } from './services/api';
import { Truck, ShieldCheck, Github, ExternalLink, Info } from 'lucide-react';

export const App: React.FC = () => {
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
        // Find recommended route or default to first
        const rec = res.routes.find((r) => r.is_recommended) || res.routes[0];
        setSelectedRouteId(rec.id);
      }
    } catch (err: any) {
      console.error('Failed to analyze routes:', err);
      setError(err.message || 'Error communicating with routing & weather engine.');
    } finally {
      setLoading(false);
    }
  };

  // Run initial calculation on load
  useEffect(() => {
    handleAnalyze();
  }, []);

  const activeRoute = data?.routes.find((r) => r.id === selectedRouteId);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="bg-slate-900/90 border-b border-slate-800 backdrop-blur-md sticky top-0 z-50 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500/20 text-emerald-400 p-2 rounded-xl border border-emerald-500/30">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-base text-white tracking-tight flex items-center gap-2">
              Weather-Aware Truck Routing
              <span className="text-[10px] bg-slate-800 text-emerald-400 font-semibold px-2 py-0.5 rounded-full border border-slate-700">
                Spotter AI Assessment
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Commercial Fleet Safety & Dynamic Weather Risk Optimization
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="hidden sm:flex items-center gap-2 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Candidate: <strong>Cheikh M. Fadel Diop</strong></span>
          </div>
          <a
            href="https://github.com/cheikhfadeldiop"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 transition"
          >
            <Github className="w-3.5 h-3.5" />
            <span>GitHub</span>
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form & Trip Info */}
        <div className="lg:col-span-4 space-y-5">
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
          />

          {/* Quick Active Route Metrics */}
          {activeRoute && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-300">Active Route: {activeRoute.name}</span>
                {activeRoute.is_recommended && (
                  <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    ★ Safest Choice
                  </span>
                )}
              </div>
              <p className="text-slate-400 text-[11px]">{activeRoute.recommendation_rationale}</p>
              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-500 flex justify-between">
                <span>Checkpoints sampled: {activeRoute.checkpoints.length}</span>
                <span>Distance: {activeRoute.total_distance_miles} mi</span>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-xs">
              <strong>Notice:</strong> {error}
            </div>
          )}
        </div>

        {/* Right Column: Map, Heatmap Slider, and Route Comparison */}
        <div className="lg:col-span-8 space-y-5">
          {/* Map */}
          <RouteMap
            routes={data?.routes || []}
            selectedRouteId={selectedRouteId}
            onSelectRoute={(id) => setSelectedRouteId(id)}
            selectedHour={selectedHour}
            showHeatmap={showHeatmap}
            corridorHeatmap={data?.corridor_heatmap}
            onSelectCheckpoint={(cp) => setSelectedCheckpoint(cp)}
          />

          {/* Heatmap 0-48h Slider */}
          <HeatmapSlider
            hours={data?.corridor_heatmap?.hours || [0, 3, 6, 9, 12, 18, 24, 36, 48]}
            selectedHour={selectedHour}
            onHourChange={(h) => setSelectedHour(h)}
            showHeatmap={showHeatmap}
            onToggleHeatmap={() => setShowHeatmap(!showHeatmap)}
          />

          {/* Route Comparison Cards */}
          <RouteComparison
            routes={data?.routes || []}
            selectedRouteId={selectedRouteId}
            onSelectRoute={(id) => setSelectedRouteId(id)}
          />
        </div>
      </main>

      {/* Checkpoint Inspection Modal */}
      <CheckpointModal
        checkpoint={selectedCheckpoint}
        onClose={() => setSelectedCheckpoint(null)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/50 py-4 px-6 text-center text-xs text-slate-500">
        Weather-Aware Truck Routing Engine • Built for Spotter AI Technical Assessment • By Cheikh M. Fadel Diop
      </footer>
    </div>
  );
};
