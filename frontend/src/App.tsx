import React, { useState, useEffect } from 'react';
import { RouteForm } from './components/RouteForm';
import { RouteMap } from './components/RouteMap';
import { RouteSidebar } from './components/RouteSidebar';
import { HeatmapSlider } from './components/HeatmapSlider';
import { CheckpointModal } from './components/CheckpointModal';
import { RoutingAnalysisResponse, Checkpoint } from './types';
import { analyzeRoutes } from './services/api';
import { Truck, ShieldCheck, Github, Sun, Moon, Map, Sliders, Layers, RefreshCw } from 'lucide-react';

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
  const [loadWeight, setLoadWeight] = useState(42000);
  const [samplingInterval, setSamplingInterval] = useState(25);
  const [weatherMode, setWeatherMode] = useState<'live' | 'scenario'>('scenario');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<RoutingAnalysisResponse | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string>('');
  const [selectedHour, setSelectedHour] = useState<number>(0);
  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<Checkpoint | null>(null);

  // Mobile active tab ('config' | 'map' | 'routes')
  const [mobileTab, setMobileTab] = useState<'config' | 'map' | 'routes'>('map');

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
      // Switch to map view on mobile once analyzed
      setMobileTab('map');
    } catch (err: any) {
      console.error('Erreur analyse de route:', err);
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
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 antialiased ${
        isDark ? 'bg-[#090D16] text-slate-100' : 'bg-[#F8FAFC] text-slate-900'
      }`}
    >
      {/* 1. Header Cockpit Topbar */}
      <header
        className={`sticky top-0 z-50 px-4 sm:px-6 py-2.5 border-b backdrop-blur-md flex items-center justify-between gap-4 transition-colors ${
          isDark
            ? 'bg-[#090D16]/95 border-slate-800'
            : 'bg-white/95 border-slate-200'
        }`}
      >
        {/* Left Branding */}
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 text-white p-2 rounded-lg flex items-center justify-center">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight">Spotter AI</span>
              <span className="text-[10px] bg-blue-500/10 text-blue-400 font-mono font-medium px-2 py-0.5 rounded border border-blue-500/20">
                Weather-Aware Routing
              </span>
            </div>
            <p className={`text-[10px] hidden sm:block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Système Décisionnel Haute Sécurité • Vitesse du Vent & Surcharge
            </p>
          </div>
        </div>

        {/* Right Tools & Candidate Metadata */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs">
          {/* Theme Switcher Button */}
          <button
            type="button"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition cursor-pointer ${
              isDark
                ? 'bg-slate-900/80 hover:bg-slate-800 text-blue-400 border-slate-800'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
            }`}
            title="Basculer Mode Clair / Sombre"
          >
            {isDark ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[11px] hidden sm:inline">Mode Clair</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-[11px] hidden sm:inline">Mode Sombre</span>
              </>
            )}
          </button>

          {/* Candidate Badge */}
          <div
            className={`hidden md:flex items-center gap-2 font-mono text-[11px] px-3 py-1.5 rounded-lg border ${
              isDark ? 'bg-slate-900/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
            <span>Cheikh M. Fadel Diop</span>
          </div>

          {/* GitHub link */}
          <a
            href="https://github.com/cheikhfadeldiop"
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition ${
              isDark
                ? 'bg-slate-900/80 hover:bg-slate-800 text-slate-200 border-slate-800'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
            }`}
          >
            <Github className="w-3.5 h-3.5" />
            <span className="text-[11px] font-medium hidden sm:inline">GitHub</span>
          </a>
        </div>
      </header>

      {/* Mobile Navigation Tabs (visible only on small screens) */}
      <div
        className={`lg:hidden flex border-b px-2 py-1.5 gap-1 text-xs font-semibold ${
          isDark ? 'bg-[#0B0F19] border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <button
          type="button"
          onClick={() => setMobileTab('config')}
          className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition ${
            mobileTab === 'config'
              ? 'bg-blue-600 text-white'
              : isDark
              ? 'text-slate-400 hover:bg-slate-800'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" /> Trajet
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('map')}
          className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition ${
            mobileTab === 'map'
              ? 'bg-blue-600 text-white'
              : isDark
              ? 'text-slate-400 hover:bg-slate-800'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Map className="w-3.5 h-3.5" /> Carte & Météo
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('routes')}
          className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition ${
            mobileTab === 'routes'
              ? 'bg-blue-600 text-white'
              : isDark
              ? 'text-slate-400 hover:bg-slate-800'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-3.5 h-3.5" /> Itinéraires ({data?.routes?.length || 0})
        </button>
      </div>

      {/* 2. Main 3-Section Cockpit Grid */}
      <main className="flex-1 w-full max-w-[1720px] mx-auto p-3 sm:p-4 lg:p-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 xl:gap-5 items-start">
          {/* SECTION 1 : GAUCHE (Formulaire de Trajet & Spécifications Camion) */}
          <div
            className={`lg:col-span-3 space-y-4 ${
              mobileTab === 'config' ? 'block' : 'hidden lg:block'
            }`}
          >
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

            {/* Truck Rule Summary Card */}
            <div
              className={`rounded-xl p-3.5 border transition-all text-xs font-mono ${
                isDark
                  ? 'bg-[#0B0F19] border-slate-800 text-slate-300'
                  : 'bg-white border-slate-200 text-slate-700'
              }`}
            >
              <div
                className={`flex items-center justify-between pb-2 mb-2 border-b border-dashed text-[11px] font-bold uppercase text-blue-500 ${
                  isDark ? 'border-slate-800' : 'border-slate-200'
                }`}
              >
                <span>Règles de Basculement au Vent</span>
                <span className={`text-[10px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Spotter AI</span>
              </div>
              <div className="space-y-1.5 text-[10.5px]">
                <div
                  className={`flex items-center justify-between p-2 rounded-lg border transition-colors ${
                    isDark ? 'bg-slate-900/50 border-slate-800/80' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-medium">
                    <span>Vent ≥ 55 mph <span className="text-slate-500 text-[10px]">(Tout poids)</span></span>
                    <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>→</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold font-mono bg-red-500/15 text-red-400 border border-red-500/30">
                    No Travel
                  </span>
                </div>
                <div
                  className={`flex items-center justify-between p-2 rounded-lg border transition-colors ${
                    isDark ? 'bg-slate-900/50 border-slate-800/80' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-medium">
                    <span>Vent 45–54 mph + &gt;30 000 lbs</span>
                    <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>→</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold font-mono bg-red-500/15 text-red-400 border border-red-500/30">
                    No Travel
                  </span>
                </div>
                <div
                  className={`flex items-center justify-between p-2 rounded-lg border transition-colors ${
                    isDark ? 'bg-slate-900/50 border-slate-800/80' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-medium">
                    <span>Vent 35–44 mph + &gt;40 000 lbs</span>
                    <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>→</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold font-mono bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    Sévère
                  </span>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-xs font-mono">
                <strong>Notice:</strong> {error}
              </div>
            )}
          </div>

          {/* SECTION 2 : CENTRE PLUS LARGE (Carte Leaflet OSRM & Timeline 0-48h) */}
          <div
            className={`lg:col-span-6 space-y-3.5 ${
              mobileTab === 'map' ? 'block' : 'hidden lg:block'
            }`}
          >
            <RouteMap
              routes={data?.routes || []}
              selectedRouteId={selectedRouteId}
              onSelectRoute={(id) => setSelectedRouteId(id)}
              selectedHour={selectedHour}
              showHeatmap={showHeatmap}
              onToggleHeatmap={() => setShowHeatmap(!showHeatmap)}
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
          </div>

          {/* SECTION 3 : DROITE EN PILE (3 Options de Routes & Télémétrie en Direct) */}
          <div
            className={`lg:col-span-3 space-y-4 ${
              mobileTab === 'routes' ? 'block' : 'hidden lg:block'
            }`}
          >
            <RouteSidebar
              routes={data?.routes || []}
              selectedRouteId={selectedRouteId}
              onSelectRoute={(id) => setSelectedRouteId(id)}
              selectedCheckpoint={selectedCheckpoint}
              onClearCheckpoint={() => setSelectedCheckpoint(null)}
              theme={theme}
            />
          </div>
        </div>
      </main>

      {/* Modal d'inspection détaillée si l'utilisateur clique */}
      <CheckpointModal
        checkpoint={selectedCheckpoint}
        onClose={() => setSelectedCheckpoint(null)}
        theme={theme}
      />

      {/* Footer minimaliste */}
      <footer
        className={`border-t py-3 px-6 text-center text-[10px] font-mono transition-colors ${
          isDark
            ? 'border-slate-800/80 bg-[#090D16] text-slate-500'
            : 'border-slate-200 bg-slate-50 text-slate-500'
        }`}
      >
        Spotter AI Truck Routing Platform • React 18, TypeScript, Tailwind, Leaflet & Django REST Framework
      </footer>
    </div>
  );
};
