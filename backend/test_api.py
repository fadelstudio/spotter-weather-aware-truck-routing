import sys
from pathlib import Path

root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

import os
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.config.settings")

import django
django.setup()

from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status

class TestTruckRoutingAPI(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_health_check_endpoint(self):
        resp = self.client.get("/api/health/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        data = resp.json()
        self.assertEqual(data.get("status"), "healthy")
        self.assertIn("Spotter", data.get("service", ""))

    def test_analyze_routes_success(self):
        payload = {
            "origin": "Chicago, IL",
            "destination": "Denver, CO",
            "departure_time": "2026-11-03T08:00:00Z",
            "load_weight": 42000,
            "sampling_interval_miles": 50,
            "weather_mode": "scenario"
        }
        resp = self.client.post("/api/routes/analyze/", payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        data = resp.json()

        self.assertEqual(data.get("status"), "success")
        self.assertIn("routes", data)
        routes = data["routes"]
        
        # Verify exactly 3 alternative routes returned
        self.assertEqual(len(routes), 3)

        # Verify exactly 1 route is recommended
        recommended = [r for r in routes if r.get("is_recommended")]
        self.assertEqual(len(recommended), 1)

        rec_route = recommended[0]
        self.assertIn("risk_summary", rec_route)
        self.assertIn("geometry", rec_route)
        self.assertIn("checkpoints", rec_route)
        self.assertTrue(len(rec_route["checkpoints"]) > 0)

        # Verify corridor heatmap structure
        self.assertIn("corridor_heatmap", data)
        heatmap = data["corridor_heatmap"]
        self.assertIn("hours", heatmap)
        self.assertIn("grid_points", heatmap)
        self.assertTrue(len(heatmap["grid_points"]) > 0)

    def test_load_weight_rule_escalation(self):
        # Chicago to Denver with 42,000 lbs in storm scenario
        payload = {
            "origin": "Chicago, IL",
            "destination": "Denver, CO",
            "load_weight": 42000,
            "sampling_interval_miles": 25,
            "weather_mode": "scenario"
        }
        resp = self.client.post("/api/routes/analyze/", payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        data = resp.json()

        # Checkpoints with wind between 35-44 mph should be escalated to Severe
        found_escalation = False
        for route in data["routes"]:
            for cp in route["checkpoints"]:
                eval_res = cp["risk_evaluation"]
                w_mph = cp["weather"]["wind_mph"]
                if 35.0 <= w_mph < 45.0 and eval_res["wind"]["level"] == "Severe":
                    found_escalation = True
                    self.assertIn("Upgraded to Severe", eval_res["wind"]["reason"])
                    break
            if found_escalation:
                break
        self.assertTrue(found_escalation, "Expected 42,000 lbs load rule escalation to Severe on 35-44 mph wind")

if __name__ == "__main__":
    import unittest
    unittest.main()
