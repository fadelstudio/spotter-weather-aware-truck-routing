"""
Risk Engine for Weather-Aware Truck Routing.
Implements the exact Spotter AI risk thresholds and load-sensitive rules.
"""
from enum import IntEnum
from typing import Dict, Any, Tuple

class RiskLevel(IntEnum):
    LOW = 1
    MODERATE = 2
    HIGH = 3
    SEVERE = 4
    NO_TRAVEL = 5

    @classmethod
    def from_str(cls, val: str) -> "RiskLevel":
        mapping = {
            "low": cls.LOW,
            "moderate": cls.MODERATE,
            "high": cls.HIGH,
            "severe": cls.SEVERE,
            "no travel": cls.NO_TRAVEL,
            "notravel": cls.NO_TRAVEL
        }
        return mapping.get(val.lower(), cls.LOW)

    def to_str(self) -> str:
        names = {
            self.LOW: "Low",
            self.MODERATE: "Moderate",
            self.HIGH: "High",
            self.SEVERE: "Severe",
            self.NO_TRAVEL: "No Travel"
        }
        return names.get(self, "Low")

    def to_color(self) -> str:
        colors = {
            self.LOW: "#10B981",       # Emerald Green
            self.MODERATE: "#F59E0B",  # Amber Yellow
            self.HIGH: "#F97316",      # Orange
            self.SEVERE: "#EF4444",    # Red
            self.NO_TRAVEL: "#7F1D1D"  # Dark Red / Maroon
        }
        return colors.get(self, "#10B981")


def classify_wind(wind_mph: float, load_weight_lbs: float) -> Tuple[RiskLevel, str]:
    """
    Classifies wind risk incorporating load weight rules:
    - Base wind thresholds:
      <25 mph: Low
      25–34 mph: Moderate
      35–44 mph: High
      45–54 mph: Severe
      >=55 mph: No Travel
    
    - Load rules:
      >=55 mph -> No Travel for any load
      45–54 mph + >30,000 lb -> No Travel
      35–44 mph + >40,000 lb -> Severe
    """
    # 1. Base classification
    if wind_mph >= 55.0:
        base_level = RiskLevel.NO_TRAVEL
    elif wind_mph >= 45.0:
        base_level = RiskLevel.SEVERE
    elif wind_mph >= 35.0:
        base_level = RiskLevel.HIGH
    elif wind_mph >= 25.0:
        base_level = RiskLevel.MODERATE
    else:
        base_level = RiskLevel.LOW

    # 2. Apply load weight overrides
    adjusted_level = base_level
    reason = f"Wind speed {wind_mph:.1f} mph"

    if wind_mph >= 55.0:
        adjusted_level = RiskLevel.NO_TRAVEL
        reason += " (No Travel for any load >= 55 mph)"
    elif 45.0 <= wind_mph < 55.0 and load_weight_lbs > 30000.0:
        adjusted_level = RiskLevel.NO_TRAVEL
        reason += f" (Upgraded to No Travel: wind {wind_mph:.1f} mph with load {load_weight_lbs:,.0f} lb > 30,000 lb)"
    elif 35.0 <= wind_mph < 45.0 and load_weight_lbs > 40000.0:
        adjusted_level = RiskLevel.SEVERE
        reason += f" (Upgraded to Severe: wind {wind_mph:.1f} mph with load {load_weight_lbs:,.0f} lb > 40,000 lb)"

    return adjusted_level, reason


def classify_rain(rain_in_hr: float) -> Tuple[RiskLevel, str]:
    """
    Classifies rain intensity (inches/hour):
    < 0.10 in/hr: Low
    0.10–0.25: Moderate
    0.25–0.50: High
    0.50–1.00: Severe
    > 1.00: No Travel
    """
    if rain_in_hr > 1.00:
        return RiskLevel.NO_TRAVEL, f"Rain rate {rain_in_hr:.2f} in/hr (> 1.00 in/hr)"
    elif rain_in_hr >= 0.50:
        return RiskLevel.SEVERE, f"Rain rate {rain_in_hr:.2f} in/hr (0.50–1.00 in/hr)"
    elif rain_in_hr >= 0.25:
        return RiskLevel.HIGH, f"Rain rate {rain_in_hr:.2f} in/hr (0.25–0.50 in/hr)"
    elif rain_in_hr >= 0.10:
        return RiskLevel.MODERATE, f"Rain rate {rain_in_hr:.2f} in/hr (0.10–0.25 in/hr)"
    else:
        return RiskLevel.LOW, f"Rain rate {rain_in_hr:.2f} in/hr (< 0.10 in/hr)"


def classify_snow(snow_in_hr: float) -> Tuple[RiskLevel, str]:
    """
    Classifies snow rate (inches/hour):
    < 0.5 in/hr: Low
    0.5–1.0: Moderate
    1.0–2.0: High
    2.0–3.0: Severe
    > 3.0: No Travel
    """
    if snow_in_hr > 3.0:
        return RiskLevel.NO_TRAVEL, f"Snow rate {snow_in_hr:.2f} in/hr (> 3.0 in/hr)"
    elif snow_in_hr >= 2.0:
        return RiskLevel.SEVERE, f"Snow rate {snow_in_hr:.2f} in/hr (2.0–3.0 in/hr)"
    elif snow_in_hr >= 1.0:
        return RiskLevel.HIGH, f"Snow rate {snow_in_hr:.2f} in/hr (1.0–2.0 in/hr)"
    elif snow_in_hr >= 0.5:
        return RiskLevel.MODERATE, f"Snow rate {snow_in_hr:.2f} in/hr (0.5–1.0 in/hr)"
    else:
        return RiskLevel.LOW, f"Snow rate {snow_in_hr:.2f} in/hr (< 0.5 in/hr)"


def evaluate_checkpoint_weather(
    wind_mph: float,
    rain_in_hr: float,
    snow_in_hr: float,
    load_weight_lbs: float
) -> Dict[str, Any]:
    """
    Evaluates weather at a single checkpoint and determines the overall risk level.
    The overall risk is the maximum of the individual risk factors.
    """
    wind_level, wind_reason = classify_wind(wind_mph, load_weight_lbs)
    rain_level, rain_reason = classify_rain(rain_in_hr)
    snow_level, snow_reason = classify_snow(snow_in_hr)

    overall_level = max(wind_level, rain_level, snow_level)

    # Determine driving factor for primary alert
    factors = []
    if wind_level == overall_level and overall_level >= RiskLevel.MODERATE:
        factors.append(wind_reason)
    if rain_level == overall_level and overall_level >= RiskLevel.MODERATE:
        factors.append(rain_reason)
    if snow_level == overall_level and overall_level >= RiskLevel.MODERATE:
        factors.append(snow_reason)

    return {
        "overall_level": overall_level.to_str(),
        "overall_score": int(overall_level),
        "overall_color": overall_level.to_color(),
        "is_no_travel": overall_level == RiskLevel.NO_TRAVEL,
        "is_severe": overall_level >= RiskLevel.SEVERE,
        "wind": {
            "value_mph": wind_mph,
            "level": wind_level.to_str(),
            "score": int(wind_level),
            "reason": wind_reason
        },
        "rain": {
            "value_in_hr": rain_in_hr,
            "level": rain_level.to_str(),
            "score": int(rain_level),
            "reason": rain_reason
        },
        "snow": {
            "value_in_hr": snow_in_hr,
            "level": snow_level.to_str(),
            "score": int(snow_level),
            "reason": snow_reason
        },
        "primary_hazard": " | ".join(factors) if factors else "Normal driving conditions"
    }
