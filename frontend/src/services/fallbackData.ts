import { RoutingAnalysisResponse, RouteOption, Checkpoint, RiskLevel, CorridorHeatmap } from '../types';

function classifyWind(windMph: number, loadWeight: number): { level: RiskLevel; score: number; reason: string } {
  let level: RiskLevel = 'Low';
  let score = 1;

  if (windMph >= 55) {
    level = 'No Travel';
    score = 5;
  } else if (windMph >= 45) {
    level = 'Severe';
    score = 4;
  } else if (windMph >= 35) {
    level = 'High';
    score = 3;
  } else if (windMph >= 25) {
    level = 'Moderate';
    score = 2;
  }

  let reason = `Wind speed ${windMph.toFixed(1)} mph`;
  if (windMph >= 55) {
    level = 'No Travel';
    score = 5;
    reason += ' (No Travel for any load >= 55 mph)';
  } else if (windMph >= 45 && loadWeight > 30000) {
    level = 'No Travel';
    score = 5;
    reason += ` (Upgraded to No Travel: wind ${windMph.toFixed(1)} mph with load ${loadWeight.toLocaleString()} lb > 30,000 lb)`;
  } else if (windMph >= 35 && loadWeight > 40000) {
    level = 'Severe';
    score = 4;
    reason += ` (Upgraded to Severe: wind ${windMph.toFixed(1)} mph with load ${loadWeight.toLocaleString()} lb > 40,000 lb)`;
  }

  return { level, score, reason };
}

function classifyRain(rainInHr: number): { level: RiskLevel; score: number; reason: string } {
  if (rainInHr > 1.0) return { level: 'No Travel', score: 5, reason: `Rain rate ${rainInHr.toFixed(2)} in/hr (> 1.00 in/hr)` };
  if (rainInHr >= 0.5) return { level: 'Severe', score: 4, reason: `Rain rate ${rainInHr.toFixed(2)} in/hr (0.50–1.00 in/hr)` };
  if (rainInHr >= 0.25) return { level: 'High', score: 3, reason: `Rain rate ${rainInHr.toFixed(2)} in/hr (0.25–0.50 in/hr)` };
  if (rainInHr >= 0.1) return { level: 'Moderate', score: 2, reason: `Rain rate ${rainInHr.toFixed(2)} in/hr (0.10–0.25 in/hr)` };
  return { level: 'Low', score: 1, reason: `Rain rate ${rainInHr.toFixed(2)} in/hr (< 0.10 in/hr)` };
}

function classifySnow(snowInHr: number): { level: RiskLevel; score: number; reason: string } {
  if (snowInHr > 3.0) return { level: 'No Travel', score: 5, reason: `Snow rate ${snowInHr.toFixed(2)} in/hr (> 3.0 in/hr)` };
  if (snowInHr >= 2.0) return { level: 'Severe', score: 4, reason: `Snow rate ${snowInHr.toFixed(2)} in/hr (2.0–3.0 in/hr)` };
  if (snowInHr >= 1.0) return { level: 'High', score: 3, reason: `Snow rate ${snowInHr.toFixed(2)} in/hr (1.0–2.0 in/hr)` };
  if (snowInHr >= 0.5) return { level: 'Moderate', score: 2, reason: `Snow rate ${snowInHr.toFixed(2)} in/hr (0.5–1.0 in/hr)` };
  return { level: 'Low', score: 1, reason: `Snow rate ${snowInHr.toFixed(2)} in/hr (< 0.5 in/hr)` };
}

const LEVEL_COLORS: Record<RiskLevel, string> = {
  Low: '#3B82F6',
  Moderate: '#F59E0B',
  High: '#F97316',
  Severe: '#EF4444',
  'No Travel': '#991B1B',
};

const LEVEL_NAMES: RiskLevel[] = ['Low', 'Moderate', 'High', 'Severe', 'No Travel'];

export function generateFallbackRouting(
  origin: string,
  destination: string,
  departureTime: string,
  loadWeight: number,
  samplingInterval: number,
  weatherMode: 'live' | 'scenario' = 'scenario'
): RoutingAnalysisResponse {
  // Preset Geocoordinates
  let origCoord: [number, number] = [-87.6298, 41.8781]; // [lng, lat]
  let destCoord: [number, number] = [-104.9903, 39.7392];

  if (origin.toLowerCase().includes('seattle')) {
    origCoord = [-122.3321, 47.6062];
    destCoord = [-111.891, 40.7608];
  } else if (origin.toLowerCase().includes('dallas')) {
    origCoord = [-96.797, 32.7767];
    destCoord = [-84.388, 33.749];
  }

  const baseDistance = origin.toLowerCase().includes('seattle') ? 840 : origin.toLowerCase().includes('dallas') ? 780 : 1005.1;
  const depDate = new Date(departureTime);

  // Generate 3 distinct routes
  const routeConfigs = [
    { id: 'route_1', name: 'Primary Interstate', distMult: 1.0, durMult: 1.0, curveOffset: 0.0, isStormExposed: true },
    { id: 'route_2', name: 'Alternative Corridor', distMult: 1.108, durMult: 1.118, curveOffset: 0.8, isStormExposed: true },
    { id: 'route_3', name: 'Regional Bypass', distMult: 1.114, durMult: 1.191, curveOffset: -1.6, isStormExposed: false },
  ];

  const routes: RouteOption[] = routeConfigs.map((cfg, rIdx) => {
    const totalDistance = Math.round(baseDistance * cfg.distMult * 10) / 10;
    const totalDurationHours = Math.round((totalDistance / 56.5) * 10) / 10;

    const numPoints = Math.max(12, Math.floor(totalDistance / samplingInterval));
    const coordinates: [number, number][] = [];
    const checkpoints: Checkpoint[] = [];

    let lowMiles = 0;
    let moderateMiles = 0;
    let highMiles = 0;
    let severeMiles = 0;
    let noTravelMiles = 0;
    let scoreSum = 0;

    for (let i = 0; i <= numPoints; i++) {
      const frac = i / numPoints;
      // Arc curvature for alternative routes
      const arc = Math.sin(frac * Math.PI) * cfg.curveOffset;
      const lng = origCoord[0] + (destCoord[0] - origCoord[0]) * frac;
      const lat = origCoord[1] + (destCoord[1] - origCoord[1]) * frac + arc;
      coordinates.push([lng, lat]);

      const distFromOrig = Math.round(frac * totalDistance * 10) / 10;
      const pointEta = new Date(depDate.getTime() + (distFromOrig / 56.5) * 3600 * 1000).toISOString();

      // Meteorological profile
      let windMph = 14.0 + Math.sin(frac * 4) * 6;
      let rainInHr = 0.0;
      let snowInHr = 0.0;

      // In the middle segment (e.g., Nebraska / Great Plains) in scenario mode, inject high winds
      if (weatherMode === 'scenario' && cfg.isStormExposed && frac >= 0.45 && frac <= 0.8) {
        windMph = 38.5 + (rIdx === 0 ? 4.0 : 2.0); // 38.5 - 42.5 mph
        snowInHr = 0.8;
      } else if (cfg.isStormExposed && frac > 0.5 && frac < 0.7) {
        windMph = 26.0;
      }

      const windEval = classifyWind(windMph, loadWeight);
      const rainEval = classifyRain(rainInHr);
      const snowEval = classifySnow(snowInHr);

      const overallScore = Math.max(windEval.score, rainEval.score, snowEval.score);
      const overallLevel = LEVEL_NAMES[overallScore - 1];
      const overallColor = LEVEL_COLORS[overallLevel];

      const stepDist = totalDistance / numPoints;
      if (overallScore === 1) lowMiles += stepDist;
      else if (overallScore === 2) moderateMiles += stepDist;
      else if (overallScore === 3) highMiles += stepDist;
      else if (overallScore === 4) severeMiles += stepDist;
      else if (overallScore === 5) noTravelMiles += stepDist;
      scoreSum += overallScore;

      checkpoints.push({
        index: i + 1,
        distance_from_origin_miles: distFromOrig,
        lat: Math.round(lat * 10000) / 10000,
        lng: Math.round(lng * 10000) / 10000,
        eta: pointEta,
        weather: {
          wind_mph: Math.round(windMph * 10) / 10,
          rain_in_hr: Math.round(rainInHr * 100) / 100,
          snow_in_hr: Math.round(snowInHr * 100) / 100,
        },
        risk_evaluation: {
          overall_level: overallLevel,
          overall_score: overallScore,
          overall_color: overallColor,
          is_no_travel: overallScore === 5,
          is_severe: overallScore >= 4,
          wind: {
            value_mph: windMph,
            level: windEval.level,
            score: windEval.score,
            reason: windEval.reason,
          },
          rain: {
            value_in_hr: rainInHr,
            level: rainEval.level,
            score: rainEval.score,
            reason: rainEval.reason,
          },
          snow: {
            value_in_hr: snowInHr,
            level: snowEval.level,
            score: snowEval.score,
            reason: snowEval.reason,
          },
          primary_hazard: windEval.score >= 3 ? windEval.reason : 'Normal nominal driving conditions',
        },
      });
    }

    const dangerMiles = Math.round((severeMiles + noTravelMiles) * 10) / 10;
    const avgScore = Math.round((scoreSum / checkpoints.length) * 100) / 100;

    return {
      id: cfg.id,
      name: cfg.name,
      rank: rIdx + 1,
      is_recommended: false,
      total_distance_miles: totalDistance,
      total_duration_hours: totalDurationHours,
      departure_time: departureTime,
      recommendation_rationale: '',
      risk_summary: {
        low_miles: Math.round(lowMiles * 10) / 10,
        moderate_miles: Math.round(moderateMiles * 10) / 10,
        high_miles: Math.round(highMiles * 10) / 10,
        severe_miles: Math.round(severeMiles * 10) / 10,
        no_travel_miles: Math.round(noTravelMiles * 10) / 10,
        danger_miles: dangerMiles,
        average_risk_score: avgScore,
      },
      geometry: {
        type: 'LineString',
        coordinates: coordinates,
      },
      checkpoints: checkpoints,
    };
  });

  // Rank routes strictly by Spotter Safety Hierarchy
  routes.sort((a, b) => {
    // 1. Min severe + no_travel
    if (a.risk_summary.danger_miles !== b.risk_summary.danger_miles) {
      return a.risk_summary.danger_miles - b.risk_summary.danger_miles;
    }
    // 2. Min high miles
    if (a.risk_summary.high_miles !== b.risk_summary.high_miles) {
      return a.risk_summary.high_miles - b.risk_summary.high_miles;
    }
    // 3. Min average risk score
    if (a.risk_summary.average_risk_score !== b.risk_summary.average_risk_score) {
      return a.risk_summary.average_risk_score - b.risk_summary.average_risk_score;
    }
    // 4. Min duration
    return a.total_duration_hours - b.total_duration_hours;
  });

  routes.forEach((r, idx) => {
    r.rank = idx + 1;
    r.is_recommended = idx === 0;
  });

  // Generate 0-48h Corridor Heatmap Grid
  const hours = [0, 3, 6, 9, 12, 18, 24, 36, 48];
  const gridPoints = [];

  const minLng = Math.min(origCoord[0], destCoord[0]) - 1.5;
  const maxLng = Math.max(origCoord[0], destCoord[0]) + 1.5;
  const minLat = Math.min(origCoord[1], destCoord[1]) - 1.5;
  const maxLat = Math.max(origCoord[1], destCoord[1]) + 1.5;

  const latSteps = 6;
  const lngSteps = 10;

  for (let r = 0; r < latSteps; r++) {
    const lat = minLat + (r / (latSteps - 1)) * (maxLat - minLat);
    for (let c = 0; c < lngSteps; c++) {
      const lng = minLng + (c / (lngSteps - 1)) * (maxLng - minLng);

      const forecasts: Record<string, any> = {};
      hours.forEach((h) => {
        // Storm front moving from west to east
        const stormCenterLng = -102.0 + (h / 48) * 14.0;
        const stormCenterLat = 40.5;
        const distToStorm = Math.hypot(lng - stormCenterLng, lat - stormCenterLat);

        let intensity = Math.max(0, 1.0 - distToStorm / 3.8);
        if (weatherMode === 'scenario' && intensity > 0.1) {
          let rScore = 1;
          if (intensity > 0.75) rScore = 4;
          else if (intensity > 0.5) rScore = 3;
          else if (intensity > 0.25) rScore = 2;

          forecasts[String(h)] = {
            intensity: Math.round(intensity * 100) / 100,
            risk_score: rScore,
            risk_level: LEVEL_NAMES[rScore - 1],
            wind_mph: Math.round((20 + intensity * 28) * 10) / 10,
            rain_in_hr: Math.round(intensity * 0.4 * 100) / 100,
            snow_in_hr: Math.round(intensity * 1.5 * 100) / 100,
          };
        } else {
          forecasts[String(h)] = {
            intensity: 0.05,
            risk_score: 1,
            risk_level: 'Low',
            wind_mph: 12.0,
            rain_in_hr: 0.0,
            snow_in_hr: 0.0,
          };
        }
      });

      gridPoints.push({
        lat: Math.round(lat * 1000) / 1000,
        lng: Math.round(lng * 1000) / 1000,
        forecasts,
      });
    }
  }

  const corridorHeatmap: CorridorHeatmap = {
    hours,
    bounding_box: {
      min_lat: minLat,
      max_lat: maxLat,
      min_lng: minLng,
      max_lng: maxLng,
    },
    grid_points: gridPoints,
  };

  return {
    status: 'success',
    inputs: {
      origin: { name: origin, lat: origCoord[1], lng: origCoord[0] },
      destination: { name: destination, lat: destCoord[1], lng: destCoord[0] },
      departure_time: departureTime,
      load_weight_lbs: loadWeight,
      sampling_interval_miles: samplingInterval,
    },
    routes,
    corridor_heatmap: corridorHeatmap,
  };
}
