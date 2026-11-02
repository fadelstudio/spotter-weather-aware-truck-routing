export type RiskLevel = 'Low' | 'Moderate' | 'High' | 'Severe' | 'No Travel';

export interface WeatherCondition {
  wind_mph: number;
  rain_in_hr: number;
  snow_in_hr: number;
}

export interface FactorEvaluation {
  value_mph?: number;
  value_in_hr?: number;
  level: RiskLevel;
  score: number;
  reason: string;
}

export interface CheckpointRiskEvaluation {
  overall_level: RiskLevel;
  overall_score: number;
  overall_color: string;
  is_no_travel: boolean;
  is_severe: boolean;
  wind: FactorEvaluation;
  rain: FactorEvaluation;
  snow: FactorEvaluation;
  primary_hazard: string;
}

export interface Checkpoint {
  index: number;
  distance_from_origin_miles: number;
  lat: number;
  lng: number;
  eta: string;
  weather: WeatherCondition;
  risk_evaluation: CheckpointRiskEvaluation;
}

export interface RiskSummary {
  low_miles: number;
  moderate_miles: number;
  high_miles: number;
  severe_miles: number;
  no_travel_miles: number;
  danger_miles: number;
  average_risk_score: number;
}

export interface RouteOption {
  id: string;
  name: string;
  rank: number;
  is_recommended: boolean;
  total_distance_miles: number;
  total_duration_hours: number;
  departure_time: string;
  recommendation_rationale: string;
  risk_summary: RiskSummary;
  geometry: {
    type: 'LineString';
    coordinates: [number, number][]; // [lng, lat]
  };
  checkpoints: Checkpoint[];
}

export interface HeatmapForecast {
  risk_score: number;
  risk_level: RiskLevel;
  wind_mph: number;
  rain_in_hr: number;
  snow_in_hr: number;
  intensity: number;
}

export interface HeatmapGridPoint {
  lat: number;
  lng: number;
  forecasts: Record<string, HeatmapForecast>;
}

export interface CorridorHeatmap {
  hours: number[];
  bounding_box: {
    min_lat: number;
    max_lat: number;
    min_lng: number;
    max_lng: number;
  };
  grid_points: HeatmapGridPoint[];
}

export interface RoutingAnalysisResponse {
  status: string;
  inputs: {
    origin: { name: string; lat: number; lng: number };
    destination: { name: string; lat: number; lng: number };
    departure_time: string;
    load_weight_lbs: number;
    sampling_interval_miles: number;
  };
  routes: RouteOption[];
  corridor_heatmap: CorridorHeatmap;
}
