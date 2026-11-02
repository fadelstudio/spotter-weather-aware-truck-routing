import sys
from pathlib import Path

root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

import json
from backend.routing_core.pipeline import run_truck_routing_pipeline

def test_pipeline():
    print("Testing Truck Routing Pipeline: Chicago -> Denver, 42,000 lbs, 25 miles interval...")
    res = run_truck_routing_pipeline(
        origin_name="Chicago, IL",
        destination_name="Denver, CO",
        departure_time_iso="2026-11-03T08:00:00Z",
        load_weight_lbs=42000,
        sampling_interval_miles=50.0
    )
    print(f"Status: {res['status']}")
    print(f"Total Routes generated: {len(res['routes'])}")
    for r in res['routes']:
        summary = r['risk_summary']
        print(f"\n--- {r['name']} (Rank #{r['rank']} | Recommended: {r['is_recommended']}) ---")
        print(f"Distance: {r['total_distance_miles']} mi | Duration: {r['total_duration_hours']} hrs")
        print(f"Risk breakdown: Danger={summary['danger_miles']} mi (Severe={summary['severe_miles']}, NoTravel={summary['no_travel_miles']}), High={summary['high_miles']}, AvgScore={summary['average_risk_score']}")
        print(f"Rationale: {r['recommendation_rationale']}")
        print(f"Checkpoints count: {len(r['checkpoints'])}")
        first_cp = r['checkpoints'][0]
        print(f"Sample checkpoint 0: Dist={first_cp['distance_from_origin_miles']} mi, ETA={first_cp['eta']}, Weather={first_cp['weather']}, Risk={first_cp['risk_evaluation']['overall_level']}")

    heatmap = res['corridor_heatmap']
    print(f"\nCorridor Heatmap generated with {len(heatmap['grid_points'])} grid points across hours: {heatmap['hours']}")

if __name__ == "__main__":
    test_pipeline()
