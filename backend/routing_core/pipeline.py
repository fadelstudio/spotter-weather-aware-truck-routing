"""
Unified Pipeline for Weather-Aware Truck Routing.
Orchestrates geocoding, multi-route fetching, checkpoint sampling, weather evaluation,
load rules application, hierarchical recommendation, and heatmap corridor generation.
"""
from datetime import datetime, timezone
from typing import Dict, Any

from .risk_engine import evaluate_checkpoint_weather
from .routing_service import (
    geocode_city,
    fetch_osrm_routes,
    sample_route_checkpoints,
    haversine_distance_miles
)
from .weather_service import fetch_checkpoint_weather
from .recommendation_engine import process_route_risks_and_recommend
from .heatmap_service import generate_corridor_heatmap

def run_truck_routing_pipeline(
    origin_name: str,
    destination_name: str,
    departure_time_iso: str = None,
    load_weight_lbs: float = 35000.0,
    sampling_interval_miles: float = 25.0,
    weather_mode: str = "live"
) -> Dict[str, Any]:
    """
    Executes the end-to-end routing and weather risk assessment.
    """
    # 1. Parse or default departure time
    if not departure_time_iso:
        dep_dt = datetime.now(timezone.utc)
    else:
        try:
            dep_dt = datetime.fromisoformat(departure_time_iso.replace("Z", "+00:00"))
        except Exception:
            dep_dt = datetime.now(timezone.utc)

    # 2. Geocode Origin & Destination
    orig_lat, orig_lon, orig_display = geocode_city(origin_name)
    dest_lat, dest_lon, dest_display = geocode_city(destination_name)

    # 3. Fetch 3 routes from OSRM
    raw_routes = fetch_osrm_routes((orig_lat, orig_lon), (dest_lat, dest_lon))
    # Ensure exactly up to 3 routes
    raw_routes = raw_routes[:3]

    processed_routes = []
    for idx, raw in enumerate(raw_routes):
        geometry = raw.get("geometry", {})
        coords = geometry.get("coordinates", [])
        dist_meters = float(raw.get("distance", 0.0))
        dur_seconds = float(raw.get("duration", 0.0))

        dist_miles = round(dist_meters * 0.000621371, 1)
        dur_hours = round(dur_seconds / 3600.0, 1)

        # 4. Sample checkpoints along the route
        checkpoints = sample_route_checkpoints(
            coordinates=coords,
            total_duration_seconds=dur_seconds,
            total_distance_meters=dist_meters,
            departure_time=dep_dt,
            step_miles=sampling_interval_miles
        )

        # 5. Fetch weather for checkpoints at their respective ETAs
        fetch_checkpoint_weather(checkpoints, weather_mode=weather_mode)

        # 6. Apply Spotter Risk Rules + Load Weight Rules to every checkpoint
        for cp in checkpoints:
            w = cp.get("weather", {"wind_mph": 15.0, "rain_in_hr": 0.0, "snow_in_hr": 0.0})
            risk_eval = evaluate_checkpoint_weather(
                wind_mph=w.get("wind_mph", 0.0),
                rain_in_hr=w.get("rain_in_hr", 0.0),
                snow_in_hr=w.get("snow_in_hr", 0.0),
                load_weight_lbs=load_weight_lbs
            )
            cp["risk_evaluation"] = risk_eval

        route_name = raw.get("name") or f"Option {idx + 1}"
        if not route_name or route_name == f"Option {idx + 1}":
            names = ["Primary Interstate", "Alternative Corridor", "Regional Bypass"]
            route_name = names[idx] if idx < len(names) else f"Route Option {idx + 1}"

        processed_routes.append({
            "id": f"route_{idx + 1}",
            "name": route_name,
            "total_distance_miles": dist_miles,
            "total_duration_hours": dur_hours,
            "departure_time": dep_dt.isoformat(),
            "geometry": geometry,
            "checkpoints": checkpoints
        })

    # 7. Rank and recommend the safest route
    ranked_routes = process_route_risks_and_recommend(processed_routes, load_weight_lbs)

    # 8. Generate weather corridor heatmap with 0-48h slider data
    corridor_heatmap = generate_corridor_heatmap(
        (orig_lat, orig_lon),
        (dest_lat, dest_lon),
        dep_dt.isoformat()
    )

    return {
        "status": "success",
        "inputs": {
            "origin": {"name": orig_display, "lat": orig_lat, "lng": orig_lon},
            "destination": {"name": dest_display, "lat": dest_lat, "lng": dest_lon},
            "departure_time": dep_dt.isoformat(),
            "load_weight_lbs": load_weight_lbs,
            "sampling_interval_miles": sampling_interval_miles
        },
        "routes": ranked_routes,
        "corridor_heatmap": corridor_heatmap
    }
