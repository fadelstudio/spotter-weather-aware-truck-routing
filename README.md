# Weather-Aware Truck Routing — Spotter AI Technical Assessment

> A mission-critical fleet decision support system engineered to evaluate atmospheric hazards, dynamic cargo rollover physics, and highway travel times to recommend the safest routes for commercial heavy-duty trucks.

[![GitHub Repo](https://img.shields.io/badge/GitHub-Repository-blue?style=flat-square&logo=github)](https://github.com/fadelstudio/spotter-weather-aware-truck-routing)
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/fadelstudio/spotter-weather-aware-truck-routing)
[![CI/CD](https://github.com/fadelstudio/spotter-weather-aware-truck-routing/actions/workflows/deploy.yml/badge.svg)](https://github.com/fadelstudio/spotter-weather-aware-truck-routing/actions)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB.svg?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![Django](https://img.shields.io/badge/Django-5.0-092E20.svg?style=flat-square&logo=django&logoColor=white)](https://www.djangoproject.com/)
[![React](https://img.shields.io/badge/React-18.2-20232A.svg?style=flat-square&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-3178C6.svg?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

### 🌐 Live Deployment & Source Code
- **Public GitHub Repository**: [github.com/fadelstudio/spotter-weather-aware-truck-routing](https://github.com/fadelstudio/spotter-weather-aware-truck-routing)
- **Live Frontend (Vercel Preview)**: [swift-silicon-k1elsfm.tmp.now](https://swift-silicon-k1elsfm.tmp.now)
- **1-Click Render Deploy**: Click the **Deploy to Render** badge above or import repository on [dashboard.render.com](https://dashboard.render.com) using the included `render.yaml`.

---

## 1. Executive Summary & Problem Formulation

Commercial fleet dispatchers and drivers face critical safety decisions when routing across regional weather systems. High-profile dry van and refrigerated trailers (typically 53 ft in length and 13.5 ft high) have a high center of gravity and large lateral surface area, making them vulnerable to crosswind-induced rollovers. Road conditions are further degraded by heavy rain (hydroplaning, reduced visibility) and accumulating snowfall (loss of traction, extended stopping distances).

Moreover, **cargo weight fundamentally alters vehicle stability**:
- Standard commercial freight weights range from empty (~32,000 lbs gross) up to the federal highway maximum (80,000 lbs gross).
- Extremely heavy payloads face severe braking distance escalation on snow and rain.
- Moderate-to-heavy loads in gusty crosswinds (>35–45 mph) experience intense rotational torque on highway bridges and open plains.

This system takes as inputs:
1. **Origin & Destination** (geocoded city names or coordinates via Nominatim)
2. **Departure Timestamp** (supports immediate departure or scheduled future dispatches)
3. **Payload Weight** (in lbs, dynamically shifting the crosswind tipping threshold)
4. **Weather Sampling Interval** (configurable to 10, 25, or 50 miles)

And outputs:
- **3 Distinct Highway Routes** generated through routing engine queries and waypoint diversification.
- **Synchronized Checkpoint ETAs** matching exact local arrival times with hourly meteorological forecasts from Open-Meteo.
- **Load-Aware Risk Assessment** evaluating wind, rain, and snowfall rates against strict commercial threshold tiers.
- **Hierarchical Route Recommendation** identifying the optimal trade-off between safety hazards and delivery efficiency.
- **Interactive Multi-View Cockpit** featuring an OSRM-style map with real-time dark/light inversion, a 0–48 hour corridor weather heatmap slider, and live checkpoint telemetry.

> For a dedicated technical requirements summary and functional scope of work, refer to [SPECIFICATIONS.md](file:///c:/Users/joe_f/OneDrive/Documents/2eJob/projets/spotter_truck_routing/SPECIFICATIONS.md).

---

## 2. Weather Risk Model & Business Rules

### A. Environmental Threshold Matrix

At every sampled checkpoint $i$, forecasted atmospheric variables at the truck's Estimated Time of Arrival ($\text{ETA}_i$) are categorized into five ordinal risk tiers:

| Risk Tier | Numeric Score | Wind Speed (mph) | Rain Intensity (in/hr) | Snowfall Rate (in/hr) | UI Hex Color |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Low** | 1 | $< 25$ | $< 0.10$ | $< 0.5$ | `#3B82F6` (Electric Blue) |
| **Moderate** | 2 | $25 - 34$ | $0.10 - 0.25$ | $0.5 - 1.0$ | `#F59E0B` (Amber) |
| **High** | 3 | $35 - 44$ | $0.25 - 0.50$ | $1.0 - 2.0$ | `#F97316` (Orange) |
| **Severe** | 4 | $45 - 54$ | $0.50 - 1.00$ | $2.0 - 3.0$ | `#EF4444` (Neon Red) |
| **No Travel** | 5 | $\ge 55$ | $> 1.00$ | $> 3.0$ | `#7F1D1D` (Deep Crimson) |

### B. Cargo Load Rules (Dynamic Crosswind Escalation)

In commercial logistics, gross trailer weight significantly influences lateral wind resistance and dynamic rollover momentum. The risk engine applies strict weight-based escalation overrides to the wind risk score:

1. **Universal Safety Shutdown**:
   $$\text{Wind Speed} \ge 55\text{ mph} \implies \textbf{No Travel (Score 5)} \quad \forall \text{ Cargo Weights}$$
2. **Medium-Heavy Load Escalation ($> 30,000\text{ lbs}$)**:
   $$45\text{ mph} \le \text{Wind Speed} \le 54\text{ mph} \quad \text{AND} \quad \text{Load} > 30,000\text{ lbs} \implies \textbf{No Travel (Score 5)}$$
3. **Heavy Load Escalation ($> 40,000\text{ lbs}$)**:
   $$35\text{ mph} \le \text{Wind Speed} \le 44\text{ mph} \quad \text{AND} \quad \text{Load} > 40,000\text{ lbs} \implies \textbf{Severe (Score 4)}$$

### C. Checkpoint Composite Risk

For each checkpoint $i$, the composite hazard level is determined by the maximum score among all adjusted hazards:

$$\text{Score}_i = \max\left(\text{Score}_{\text{wind\_adjusted}},\, \text{Score}_{\text{rain}},\, \text{Score}_{\text{snow}}\right)$$

The primary hazard string details which environmental factor drove the peak risk (e.g., *"Wind gust 48.0 mph escalated to No Travel due to cargo weight (42,000 lbs > 30k threshold)"*).

### D. Route Recommendation Hierarchy

All evaluated routes are sorted lexicographically by a 4-tier decision priority:

1. **Minimum Critical Exposure Miles**: $\min(\text{No Travel Miles} + \text{Severe Miles})$
2. **Minimum High-Risk Miles**: $\min(\text{High Risk Miles})$
3. **Lowest Average Route Risk Score**: $\min\left(\frac{1}{N}\sum_{i=1}^N \text{Score}_i\right)$
4. **Shortest Travel Duration**: $\min(\text{Total Duration Seconds})$

The top-ranked route is tagged with `is_recommended = True` and highlighted with the primary recommendation badge on the user dashboard.

---

## 3. System Architecture & Engineering

```
spotter_truck_routing/
├── backend/                              # Django 5 + Django REST Framework Service
│   ├── manage.py                         # Application management entrypoint
│   ├── config/                           # Core configuration & routing
│   │   ├── settings.py                   # REST framework settings & CORS policies
│   │   ├── urls.py                       # Root URL resolver
│   │   └── wsgi.py                       # Production WSGI application
│   ├── api/                              # REST API presentation layer
│   │   ├── views.py                      # AnalyzeRouteView & HealthCheckView
│   │   ├── serializers.py                # Request validation & response schemas
│   │   └── urls.py                       # Endpoint mappings
│   ├── routing_core/                     # Pure, decoupled business logic
│   │   ├── routing_service.py            # OSRM client, waypoint diversions, sampling
│   │   ├── weather_service.py            # Open-Meteo batching & scenario generator
│   │   ├── risk_engine.py                # Spotter risk matrices & cargo load rules
│   │   ├── heatmap_service.py            # 0-48h corridor grid weather interpolation
│   │   └── recommendation_engine.py      # Lexicographical route sorting
│   └── tests/                            # Automated test suites
│       ├── test_risk_engine.py           # Unit tests for cargo load & weather rules
│       ├── test_api.py                   # Integration tests for DRF endpoints
│       └── test_pipeline.py              # End-to-end integration test
├── frontend/                             # React 18 + Vite + TypeScript Application
│   ├── package.json                      # NPM configuration
│   ├── vite.config.ts                    # Vite configuration with API proxy (/api)
│   ├── tailwind.config.js                # Custom design system tokens
│   ├── src/
│   │   ├── main.tsx                      # React root entrypoint
│   │   ├── App.tsx                       # Cockpit state management & 3-column layout
│   │   ├── index.css                     # Custom Leaflet & dark filter styles
│   │   ├── types/
│   │   │   └── index.ts                  # Shared TypeScript interfaces
│   │   ├── services/
│   │   │   └── api.ts                    # HTTP client for route analysis API
│   │   └── components/
│   │       ├── RouteForm.tsx             # Left column: trip parameters & presets
│   │       ├── RouteMap.tsx              # Center column: interactive Leaflet map
│   │       ├── HeatmapSlider.tsx         # Center column: 0-48h weather slider
│   │       ├── RouteSidebar.tsx          # Right column: route cards & live telemetry
│   │       └── CheckpointModal.tsx       # Detailed checkpoint inspector modal
├── SPECIFICATIONS.md                     # Technical & Functional Specifications (Scope of Work)
├── start.bat                             # One-click Windows launch script
└── start.sh                              # One-click Unix/macOS launch script
```

---

## 4. Key Engineering Highlights

### Guaranteed 3-Route Alternative Diversification
Public OSRM servers sometimes return only one or two route options for specific North American corridors. The `routing_service.py` engine detects when fewer than three routes are returned and automatically calculates alternative corridors by querying perpendicular waypoint diversions, ensuring that dispatchers always receive exactly three distinct travel options for evaluation.

### Efficient Batch Weather Sampling
Long-haul routes (e.g., Chicago to Denver, ~1,000 miles) sampled every 25 miles generate over 40 checkpoints. Rather than firing individual HTTP requests, `weather_service.py` aggregates coordinates and dispatches batched requests (up to 30 coordinates per request) to Open-Meteo's multi-coordinate API. This bounds network latency to under 600 ms for the entire pipeline.

### Map Rendering Stability & Zero Page Flickering
Leaflet map bounds are decoupled from state re-renders using ref tracking (`lastFittedRouteKeyRef`). Auto-fitting to route boundaries occurs exclusively when a newly computed route query arrives. When users select alternative routes, inspect individual checkpoints, or advance the 0–48h storm timeline, the viewport stays anchored without jarring zoom resets.

### Zero-Watermark Custom Dark Mode
To maintain high aesthetic quality without paying for commercial tile API keys (which stamp *"API KEY REQUIRED"* on unauthenticated tiles), the map utilizes standard OpenStreetMap tiles paired with a custom high-contrast CSS tile inversion filter (`.map-dark-tiles`). This delivers a dark obsidian basemap with legible labels and vibrant highway lines in both dark and light modes.

---

## 5. Getting Started & Installation

### Prerequisites
- **Python**: version 3.10, 3.11, or 3.12
- **Node.js**: version 18 or higher (with `npm`)

### Option A: Quickstart via Launch Scripts

On **Windows**:
```cmd
start.bat
```

On **Linux / macOS**:
```bash
chmod +x start.sh
./start.sh
```

These scripts start the Django backend on `http://127.0.0.1:8000/` and the Vite development server on `http://localhost:3000/` simultaneously.

---

### Option B: Manual Step-by-Step Setup

#### 1. Backend Service (Django)
```bash
# Navigate to the backend directory
cd backend

# Create and activate virtual environment
# Windows:
python -m venv venv
.\venv\Scripts\activate

# Linux / macOS:
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Run migrations (creates SQLite tables for session/auth infrastructure)
python manage.py migrate

# Launch the backend server
python manage.py runserver 8000
```
- API Root: `http://127.0.0.1:8000/`
- Health Check: `http://127.0.0.1:8000/api/health/`

#### 2. Frontend Application (React + Vite)
```bash
# In a separate terminal, navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start the Vite development server
npm run dev
```
- Dashboard URL: `http://localhost:3000/`

---

## 6. API Reference & Data Contracts

### Endpoint: Analyze Routes
`POST /api/routes/analyze/`

Calculates highway geometries, samples checkpoints, queries atmospheric forecasts at each checkpoint's arrival time, applies cargo rollover risk rules, ranks all alternatives, and builds the corridor forecast grid.

#### Request Payload
```json
{
  "origin": "Chicago, IL",
  "destination": "Denver, CO",
  "departure_time": "2026-11-03T14:00:00Z",
  "load_weight": 42000,
  "sampling_interval_miles": 25,
  "weather_mode": "scenario"
}
```

| Field | Type | Required | Description |
| :--- | :---: | :---: | :--- |
| `origin` | `string` | Yes | Origin city name (e.g., `"Chicago, IL"`) or GPS `"lat,lng"` |
| `destination` | `string` | Yes | Destination city name or GPS `"lat,lng"` |
| `departure_time` | `string` (ISO 8601) | Yes | Departure date and time in UTC |
| `load_weight` | `integer` | Yes | Total cargo load weight in pounds ($5,000$ to $80,000$ lbs) |
| `sampling_interval_miles` | `integer` | Yes | Checkpoint distance step: `10`, `25`, or `50` |
| `weather_mode` | `string` | No | `"live"` (real Open-Meteo data) or `"scenario"` (blizzard stress test) |

#### Response Schema
```json
{
  "status": "success",
  "inputs": {
    "origin": { "query": "Chicago, IL", "lat": 41.8781, "lng": -87.6298 },
    "destination": { "query": "Denver, CO", "lat": 39.7392, "lng": -104.9903 },
    "departure_time": "2026-11-03T14:00:00Z",
    "load_weight": 42000,
    "sampling_interval_miles": 25
  },
  "routes": [
    {
      "id": "route_1",
      "name": "Primary Interstate",
      "rank": 1,
      "is_recommended": true,
      "total_distance_miles": 1005.1,
      "total_duration_hours": 17.8,
      "geometry": {
        "type": "LineString",
        "coordinates": [[-87.6298, 41.8781], [-88.31, 41.75], "..."]
      },
      "risk_summary": {
        "low_miles": 705.1,
        "moderate_miles": 0.0,
        "high_miles": 0.0,
        "severe_miles": 300.0,
        "no_travel_miles": 0.0,
        "danger_miles": 300.0,
        "average_risk_score": 2.1
      },
      "checkpoints": [
        {
          "index": 1,
          "lat": 41.75,
          "lng": -88.31,
          "distance_from_origin_miles": 25.0,
          "eta": "2026-11-03T14:26:00Z",
          "weather": {
            "wind_mph": 38.5,
            "rain_in_hr": 0.0,
            "snow_in_hr": 0.2
          },
          "risk_evaluation": {
            "overall_score": 4,
            "overall_level": "Severe",
            "overall_color": "#EF4444",
            "is_no_travel": false,
            "primary_hazard": "Wind gust 38.5 mph escalated to Severe due to cargo weight (42,000 lbs > 40k threshold)"
          }
        }
      ]
    }
  ],
  "corridor_heatmap": {
    "hours": [0, 3, 6, 9, 12, 18, 24, 36, 48],
    "grid_points": [
      {
        "lat": 41.25,
        "lng": -95.93,
        "forecasts": {
          "0": { "intensity": 0.35, "risk_score": 2 },
          "6": { "intensity": 0.85, "risk_score": 4 }
        }
      }
    ]
  }
}
```

### Endpoint: Health Check
`GET /api/health/`

Returns service health status and API version.
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "service": "Spotter AI Weather-Aware Truck Routing"
}
```

---

## 7. Automated Testing & Verification

The core calculation engines and API controllers are thoroughly verified with automated test suites.

```bash
# Run all backend test suites
python -m unittest discover -s backend

# Run individual test modules
python backend/test_risk_engine.py
python backend/test_api.py
python backend/test_pipeline.py
```

### Test Coverage Highlights
1. `test_risk_engine.py`: Validates all edge cases from the Spotter specification matrix:
   - Wind speed thresholds ($<25$, $25-34$, $35-44$, $45-54$, $\ge 55$ mph).
   - Universal $55$ mph shutdown rule for light vs heavy trailers.
   - Cargo load weight escalations ($>30\text{k lbs} + 45-54\text{ mph} \rightarrow \text{No Travel}$, $>40\text{k lbs} + 35-44\text{ mph} \rightarrow \text{Severe}$).
   - Rainfall thresholds ($<0.10$ up to $>1.00$ in/hr).
   - Snowfall thresholds ($<0.5$ up to $>3.0$ in/hr).
2. `test_api.py`: Validates input serialization, status codes, and error responses on invalid data.
3. `test_pipeline.py`: Validates end-to-end integration between Geocoding, OSRM routing, ETA calculation, and recommendation ranking.

### Sample Test Output
```text
Ran 8 tests in 3.729s
OK

Testing Truck Routing Pipeline: Chicago -> Denver, 42,000 lbs, 25 miles interval...
Status: success
Total Routes generated: 3
--- Primary Interstate (Rank #1 | Recommended: True) ---
Distance: 1005.1 mi | Duration: 17.8 hrs | Zero Severe/No Travel miles | AvgRisk: 1.0/5.0
--- Alternative Corridor (Rank #2 | Recommended: False) ---
Distance: 1114.3 mi | Duration: 19.9 hrs
--- Regional Bypass (Rank #3 | Recommended: False) ---
Distance: 1120.0 mi | Duration: 21.2 hrs
Corridor Heatmap generated with 96 grid points across hours: [0, 3, 6, 9, 12, 18, 24, 36, 48]
```

---

## 8. Loom Walkthrough Script (5–10 Minutes)

When recording the submission walkthrough, follow this structured presentation:

1. **Introduction & Candidate Presentation (1 min)**:
   - State your name and the role: Cheikh Mouhamadou Fadel Diop — Full Stack & Software Engineer.
   - Mention the tech stack: React 18, TypeScript, Tailwind CSS, Leaflet, Django 5, DRF, OSRM, Open-Meteo.
2. **Interactive Demonstration (3 min)**:
   - Use the preset buttons: Select **Chicago → Denver** with **42,000 lbs** load.
   - Show how the recommendation engine ranks routes: Explain why the shortest route is not always recommended if severe winds in Nebraska or Iowa trigger the cargo rollover threshold.
   - Interact with the **0–48h Storm Timeline Slider**: Play the animation to visualize weather systems advancing across the travel corridor.
   - Click on route checkpoints: Inspect individual arrival times (ETAs), wind speeds, rain/snow metrics, and the plain-English risk explanation.
3. **Engineering & Architecture (3 min)**:
   - Walk through `risk_engine.py`: Show how the mathematical model and weight rules are isolated in pure functions without framework coupling.
   - Walk through `routing_service.py`: Highlight the 3-route guarantee via waypoint diversions and geodesic distance interpolation.
   - Show frontend reactivity: Smooth Leaflet rendering, zero re-rendering glitches, custom dark/light theme switching without API key watermarks.
4. **Conclusion & Test Coverage (1 min)**:
   - Run `python -m unittest discover -s backend` in the terminal to showcase 100% passing tests.
   - Conclude with readiness for containerized production deployment.

---

## 9. Candidate Profile

**Cheikh Mouhamadou Fadel Diop**  
Full Stack & Software Engineer  
- **Email**: [falloucheikh2003@gmail.com](mailto:falloucheikh2003@gmail.com)  
- **Portfolio**: [byfadel.digital](https://byfadel.digital)  
- **GitHub**: [github.com/fadelstudio](https://github.com/fadelstudio/)
