"""
Recommendation Engine for Weather-Aware Truck Routing.
Implements the 4-level hierarchical ranking to select and recommend the safest route.
"""
from typing import List, Dict, Any

def process_route_risks_and_recommend(
    routes: List[Dict[str, Any]],
    load_weight_lbs: float
) -> List[Dict[str, Any]]:
    """
    Computes risk breakdowns for each route and ranks them according to:
    1. Fewest Severe & No Travel miles
    2. Fewest High miles
    3. Lowest average risk score
    4. Shortest travel time
    """
    for route in routes:
        checkpoints = route.get("checkpoints", [])
        if not checkpoints:
            continue

        low_miles = 0.0
        moderate_miles = 0.0
        high_miles = 0.0
        severe_miles = 0.0
        no_travel_miles = 0.0
        scores = []

        total_cps = len(checkpoints)
        for i in range(total_cps):
            cp = checkpoints[i]
            # Segment mileage associated with this checkpoint
            if i == 0:
                seg_miles = checkpoints[1]["distance_from_origin_miles"] / 2.0 if total_cps > 1 else 0.0
            elif i == total_cps - 1:
                seg_miles = (checkpoints[-1]["distance_from_origin_miles"] - checkpoints[-2]["distance_from_origin_miles"]) / 2.0
            else:
                d_prev = checkpoints[i - 1]["distance_from_origin_miles"]
                d_next = checkpoints[i + 1]["distance_from_origin_miles"]
                seg_miles = (d_next - d_prev) / 2.0

            lvl = cp.get("risk_evaluation", {}).get("overall_level", "Low")
            score = cp.get("risk_evaluation", {}).get("overall_score", 1)
            scores.append(score)

            if lvl == "No Travel":
                no_travel_miles += seg_miles
            elif lvl == "Severe":
                severe_miles += seg_miles
            elif lvl == "High":
                high_miles += seg_miles
            elif lvl == "Moderate":
                moderate_miles += seg_miles
            else:
                low_miles += seg_miles

        avg_score = sum(scores) / len(scores) if scores else 1.0

        route["risk_summary"] = {
            "low_miles": round(low_miles, 1),
            "moderate_miles": round(moderate_miles, 1),
            "high_miles": round(high_miles, 1),
            "severe_miles": round(severe_miles, 1),
            "no_travel_miles": round(no_travel_miles, 1),
            "danger_miles": round(severe_miles + no_travel_miles, 1),
            "average_risk_score": round(avg_score, 2)
        }

    # Sorting hierarchy
    def ranking_key(r):
        summary = r.get("risk_summary", {})
        danger = summary.get("danger_miles", 0.0)
        high = summary.get("high_miles", 0.0)
        avg_risk = summary.get("average_risk_score", 1.0)
        dur = r.get("total_duration_hours", 0.0)
        return (danger, high, avg_risk, dur)

    sorted_routes = sorted(routes, key=ranking_key)

    for i, r in enumerate(sorted_routes):
        r["rank"] = i + 1
        r["is_recommended"] = (i == 0)
        
        summary = r.get("risk_summary", {})
        if i == 0:
            reasons = []
            if summary.get("danger_miles", 0.0) == 0:
                reasons.append("Zero Severe / No Travel miles")
            else:
                reasons.append(f"Lowest exposure to critical weather ({summary.get('danger_miles')} mi)")
            reasons.append(f"Average risk score: {summary.get('average_risk_score')}/5.0")
            reasons.append(f"Duration: {r.get('total_duration_hours')} hrs")
            r["recommendation_rationale"] = " | ".join(reasons)
        else:
            r["recommendation_rationale"] = f"Alternative route {i+1} (Higher risk or travel time)"

    return sorted_routes
