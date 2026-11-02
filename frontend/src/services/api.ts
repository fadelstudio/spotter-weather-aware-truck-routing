import { RoutingAnalysisResponse } from '../types';

export async function analyzeRoutes(payload: {
  origin: string;
  destination: string;
  departure_time: string;
  load_weight: number;
  sampling_interval_miles: number;
  weather_mode?: 'live' | 'scenario';
}): Promise<RoutingAnalysisResponse> {
  const response = await fetch('/api/routes/analyze/', {
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
