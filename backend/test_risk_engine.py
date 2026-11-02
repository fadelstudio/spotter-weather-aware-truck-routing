import sys
from pathlib import Path

root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

import unittest
from backend.routing_core.risk_engine import (
    RiskLevel,
    classify_wind,
    classify_rain,
    classify_snow,
    evaluate_checkpoint_weather
)

class TestSpotterRiskEngine(unittest.TestCase):

    def test_wind_base_thresholds(self):
        self.assertEqual(classify_wind(15.0, 20000)[0], RiskLevel.LOW)
        self.assertEqual(classify_wind(28.0, 20000)[0], RiskLevel.MODERATE)
        self.assertEqual(classify_wind(38.0, 20000)[0], RiskLevel.HIGH)
        self.assertEqual(classify_wind(48.0, 20000)[0], RiskLevel.SEVERE)
        self.assertEqual(classify_wind(58.0, 20000)[0], RiskLevel.NO_TRAVEL)

    def test_wind_load_rules(self):
        # Rule 1: >= 55 mph -> No Travel for any load
        self.assertEqual(classify_wind(56.0, 5000)[0], RiskLevel.NO_TRAVEL)
        self.assertEqual(classify_wind(60.0, 45000)[0], RiskLevel.NO_TRAVEL)

        # Rule 2: 45–54 mph + >30,000 lb -> No Travel
        self.assertEqual(classify_wind(46.0, 25000)[0], RiskLevel.SEVERE)      # <= 30k lb -> Severe
        self.assertEqual(classify_wind(46.0, 32000)[0], RiskLevel.NO_TRAVEL)   # > 30k lb -> No Travel
        self.assertEqual(classify_wind(52.0, 42000)[0], RiskLevel.NO_TRAVEL)

        # Rule 3: 35–44 mph + >40,000 lb -> Severe
        self.assertEqual(classify_wind(40.0, 35000)[0], RiskLevel.HIGH)        # <= 40k lb -> High
        self.assertEqual(classify_wind(40.0, 42000)[0], RiskLevel.SEVERE)      # > 40k lb -> Severe

    def test_rain_thresholds(self):
        self.assertEqual(classify_rain(0.05)[0], RiskLevel.LOW)
        self.assertEqual(classify_rain(0.18)[0], RiskLevel.MODERATE)
        self.assertEqual(classify_rain(0.35)[0], RiskLevel.HIGH)
        self.assertEqual(classify_rain(0.75)[0], RiskLevel.SEVERE)
        self.assertEqual(classify_rain(1.20)[0], RiskLevel.NO_TRAVEL)

    def test_snow_thresholds(self):
        self.assertEqual(classify_snow(0.2)[0], RiskLevel.LOW)
        self.assertEqual(classify_snow(0.8)[0], RiskLevel.MODERATE)
        self.assertEqual(classify_snow(1.5)[0], RiskLevel.HIGH)
        self.assertEqual(classify_snow(2.5)[0], RiskLevel.SEVERE)
        self.assertEqual(classify_snow(3.5)[0], RiskLevel.NO_TRAVEL)

    def test_composite_evaluation(self):
        # Wind: Moderate (28 mph, 20k lb), Rain: High (0.35), Snow: Low (0.1) -> Overall: High
        res = evaluate_checkpoint_weather(wind_mph=28.0, rain_in_hr=0.35, snow_in_hr=0.1, load_weight_lbs=20000)
        self.assertEqual(res["overall_level"], "High")
        self.assertEqual(res["overall_score"], 3)

        # Wind upgraded by load: 38 mph + 45k lb -> Severe, Rain: Low, Snow: Low -> Overall: Severe
        res2 = evaluate_checkpoint_weather(wind_mph=38.0, rain_in_hr=0.0, snow_in_hr=0.0, load_weight_lbs=45000)
        self.assertEqual(res2["overall_level"], "Severe")
        self.assertEqual(res2["overall_score"], 4)

if __name__ == "__main__":
    unittest.main()
