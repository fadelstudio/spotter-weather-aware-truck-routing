import { RoutingAnalysisResponse } from '../types';
import { generateFallbackRouting } from './fallbackData';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export async function analyzeRoutes(payload: {
  origin: string;
  destination: string;
  departure_time: string;
  load_weight: number;
  sampling_interval_miles: number;
  weather_mode?: 'live' | 'scenario';
}): Promise<RoutingAnalysisResponse> {
  const url = `${API_BASE}/api/routes/analyze/`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      return await response.json();
    }
  } catch {
    // Backend offline / GitHub Pages mode
  }

  // Seamless client-side routing & physics engine for GitHub Pages and offline mode
  return await generateFallbackRouting(
    payload.origin,
    payload.destination,
    payload.departure_time,
    payload.load_weight,
    payload.sampling_interval_miles,
    payload.weather_mode || 'scenario'
  );
}
