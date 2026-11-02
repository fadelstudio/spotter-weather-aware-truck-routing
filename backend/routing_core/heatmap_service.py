"""
Heatmap Service for Weather-Aware Truck Routing.
Generates an atmospheric corridor grid with 0-48h forecast slices for the interactive timeline slider.
"""
import math
from typing import List, Dict, Any, Tuple

def generate_corridor_heatmap(
    origin_coords: Tuple[float, float],
    dest_coords: Tuple[float, float],
    departure_time_iso: str
) -> Dict[str, Any]:
    """
    Builds a 2D bounding grid along the trip corridor and computes hourly weather vectors
    for 0, 3, 6, 9, 12, 18, 24, 36, 48 hours.
    """
    orig_lat, orig_lon = origin_coords
    dest_lat, dest_lon = dest_coords

    min_lat = min(orig_lat, dest_lat) - 1.2
    max_lat = max(orig_lat, dest_lat) + 1.2
    min_lon = min(orig_lon, dest_lon) - 1.5
    max_lon = max(orig_lon, dest_lon) + 1.5

    # 12x8 spatial grid
    lat_steps = 7
    lon_steps = 11

    hours = [0, 3, 6, 9, 12, 18, 24, 36, 48]
    grid_points = []

    for i in range(lat_steps + 1):
        lat = min_lat + (max_lat - min_lat) * (i / lat_steps)
        for j in range(lon_steps + 1):
            lon = min_lon + (max_lon - min_lon) * (j / lon_steps)

            forecasts = {}
            for h in hours:
                # Weather simulation with moving front across 48 hours
                # Front moves eastward at ~25 mph
                time_offset = h * 0.08
                storm_center_lon = (min_lon + 3.0) + time_offset * 3.5
                storm_center_lat = (min_lat + max_lat) / 2.0 + math.sin(time_offset) * 0.8

                dist_to_storm = math.hypot(lat - storm_center_lat, lon - storm_center_lon)
                intensity = math.exp(-(dist_to_storm ** 2) / 4.5)

                wind_mph = round(10.0 + intensity * 48.0, 1)
                rain_rate = round(max(0.0, intensity * 0.85), 2)
                snow_rate = round(max(0.0, intensity * 2.2), 2) if lon < -100.0 else 0.0

                if wind_mph >= 55 or rain_rate > 1.0 or snow_rate > 3.0:
                    risk_score = 5
                    level = "No Travel"
                elif wind_mph >= 45 or rain_rate >= 0.5 or snow_rate >= 2.0:
                    risk_score = 4
                    level = "Severe"
                elif wind_mph >= 35 or rain_rate >= 0.25 or snow_rate >= 1.0:
                    risk_score = 3
                    level = "High"
                elif wind_mph >= 25 or rain_rate >= 0.10 or snow_rate >= 0.5:
                    risk_score = 2
                    level = "Moderate"
                else:
                    risk_score = 1
                    level = "Low"

                forecasts[str(h)] = {
                    "risk_score": risk_score,
                    "risk_level": level,
                    "wind_mph": wind_mph,
                    "rain_in_hr": rain_rate,
                    "snow_in_hr": snow_rate,
                    "intensity": round(min(1.0, intensity * 1.2), 2)
                }

            grid_points.append({
                "lat": round(lat, 4),
                "lng": round(lon, 4),
                "forecasts": forecasts
            })

    return {
        "hours": hours,
        "bounding_box": {
            "min_lat": min_lat,
            "max_lat": max_lat,
            "min_lng": min_lon,
            "max_lng": max_lon
        },
        "grid_points": grid_points
    }
