import { RoutingAnalysisResponse } from '../types';

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
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Server returned ${response.status}: ${response.statusText}`);
  }

  return response.json();
}
