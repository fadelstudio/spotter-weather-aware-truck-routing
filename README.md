# 🚛 Weather-Aware Truck Routing — Spotter AI

> **A mission-critical decision support system that helps commercial truck drivers select the safest, most weather-resilient route based on real-time atmospheric conditions, cargo load weight, and travel time.**

[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://www.python.org/)
[![Django](https://img.shields.io/badge/Django-5.0-green.svg)](https://www.djangoproject.com/)
[![React](https://img.shields.io/badge/React-18.2-61DAFB.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-3178C6.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC.svg)](https://tailwindcss.com/)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9-199900.svg)](https://leafletjs.com/)

---

## 📌 Executive Summary & Problem Statement

Commercial trucking safety depends heavily on atmospheric risks. Crosswinds above 45 mph can blow over high-profile tractor-trailers, while heavy rain (> 0.5 in/hr) causes hydroplaning and snow (> 1.0 in/hr) degrades braking distance. Furthermore, **truck weight dramatically alters risk thresholds**: empty or lighter trailers are vulnerable to rollovers at lower wind speeds, while extremely heavy loads face severe handling limitations on slippery roads.

This system takes:
1. **Origin & Destination** (geocoded addresses or coordinates)
2. **Departure Date & Time** (supports future trip scheduling)
3. **Load Weight** (in lbs, directly altering crosswind vulnerability)
4. **Sampling Interval** (every 10, 25, or 50 miles)

And delivers:
* **3 Alternative Routes** generated via high-performance routing APIs.
* **Checkpoint Weather Sampling** precisely synchronized with the truck's estimated arrival time (**ETA**).
* **Load-Aware Risk Assessment** classifying hazards from *Low* to *No Travel*.
* **Hierarchical Recommendation Engine** selecting the optimal route balancing safety and delivery time.
* **Interactive GIS Map** with color-coded risk segments, interactive checkpoints, and a **0–48 hour corridor weather heatmap slider**.

---

## 📐 Weather Risk Rules & Mathematical Model

### 1. Environmental Thresholds
At every checkpoint along each route, weather variables are classified into 5 ordinal risk tiers:

| Condition | Low (1) | Moderate (2) | High (3) | Severe (4) | No Travel (5) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Wind Speed** | `< 25 mph` | `25 – 34 mph` | `35 – 44 mph` | `45 – 54 mph` | `≥ 55 mph` |
| **Rain Intensity** | `< 0.10 in/hr` | `0.10 – 0.25 in/hr` | `0.25 – 0.50 in/hr` | `0.50 – 1.00 in/hr` | `> 1.00 in/hr` |
| **Snowfall Rate** | `< 0.5 in/hr` | `0.5 – 1.0 in/hr` | `1.0 – 2.0 in/hr` | `2.0 – 3.0 in/hr` | `> 3.0 in/hr` |

### 2. Cargo Load Weight Rules (Dynamic Crosswind Escalation)
Cargo weight alters wind hazard severity:
* $\text{Wind} \ge 55 \text{ mph} \implies \textbf{No Travel}$ (Mandatory shutdown for any load).
* $45 \le \text{Wind} \le 54 \text{ mph} \quad \text{AND} \quad \text{Load} > 30,000 \text{ lbs} \implies \textbf{No Travel}$.
* $35 \le \text{Wind} \le 44 \text{ mph} \quad \text{AND} \quad \text{Load} > 40,000 \text{ lbs} \implies \textbf{Severe}$.

### 3. Composite Checkpoint Risk
$$\text{Risk}_{\text{checkpoint}} = \max\left(\text{Risk}_{\text{wind\_adjusted}},\, \text{Risk}_{\text{rain}},\, \text{Risk}_{\text{snow}}\right)$$

### 4. Route Recommendation Hierarchy
Routes are evaluated across their entire distance and ranked via strict lexicographical ordering:
1. $\min(\text{No Travel miles} + \text{Severe miles})$
2. $\min(\text{High risk miles})$
3. $\min(\text{Average risk score})$
4. $\min(\text{Total travel duration})$

The winning route is assigned `is_recommended = True` and highlighted on the dashboard.

---

## 🏗️ System Architecture

```
                                  +----------------------------+
                                  |   React + TypeScript UI    |
                                  | (Vite, Tailwind, Leaflet)  |
                                  +--------------+-------------+
                                                 |
                                     HTTP POST /api/routes/analyze/
                                                 |
                                                 v
                                  +----------------------------+
                                  |     Django REST API        |
                                  |  (Request validation)      |
                                  +--------------+-------------+
                                                 |
                                                 v
+--------------------------------------------------------------------------------------------------+
|                                    ROUTING CORE PIPELINE                                         |
|                                                                                                  |
|   1. Geocoding Service (Nominatim / Geodesic)                                                    |
|          |                                                                                       |
|          v                                                                                       |
|   2. Multi-Route Engine (OSRM API -> 3 Route LineStrings)                                       |
|          |                                                                                       |
|          v                                                                                       |
|   3. Dynamic Checkpoint Sampler (10 / 25 / 50 miles step -> Cumulative Distance & Checkpoint ETAs|
|          |                                                                                       |
|          v                                                                                       |
|   4. Temporal Weather Fetcher (Open-Meteo API -> Hourly Forecast aligned to ETA)                 |
|          |                                                                                       |
|          v                                                                                       |
|   5. Load-Aware Risk Engine (Wind, Rain, Snow, Load weight escalation)                           |
|          |                                                                                       |
|          v                                                                                       |
|   6. Recommendation & Ranking Engine (Severe miles -> High miles -> Avg risk -> Travel time)     |
|          |                                                                                       |
|          v                                                                                       |
|   7. Corridor Heatmap Generator (Trip bounding box -> 0-48h forecast grid for timeline slider)   |
+--------------------------------------------------------------------------------------------------+
```

---

## 🚀 Quick Start Guide

### Prerequisites
* Python 3.10+
* Node.js 18+ & npm

### 1. Backend Setup (Django)
```bash
# Navigate to backend directory
cd backend

# (Optional) Create and activate virtual environment
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run Unit Tests
python -m unittest backend.test_risk_engine

# Start Django Development Server
python manage.py runserver 8000
```
Backend API will be live at: `http://127.0.0.1:8000/`  
Health check endpoint: `http://127.0.0.1:8000/api/health/`

### 2. Frontend Setup (React + Vite)
```bash
# In a new terminal, navigate to frontend directory
cd frontend

# Install npm packages
npm install

# Start Vite Dev Server
npm run dev
```
Frontend will be live at: `http://localhost:3000/`

---

## 🧪 Automated Testing & Verification

The core algorithmic logic is covered by unit and integration tests:

```bash
# Run All Test Suites (Risk Engine, DRF API endpoints, End-to-End Pipeline)
python -m unittest discover -s backend

# Or run specific test modules
python backend/test_risk_engine.py
python backend/test_api.py
python backend/test_pipeline.py
```

Sample test output:
```text
........
----------------------------------------------------------------------
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

## 📡 API Reference

### `POST /api/routes/analyze/`
Analyzes multiple routes, evaluates weather risks, and generates corridor heatmap data.

#### Request Body
```json
{
  "origin": "Chicago, IL",
  "destination": "Denver, CO",
  "departure_time": "2026-11-03T08:00:00Z",
  "load_weight": 42000,
  "sampling_interval_miles": 25
}
```

#### Response Structure
* `inputs`: Geocoded coordinates, departure timestamp, load weight.
* `routes`: List of up to 3 routes ranked by safety with distance, duration, geometry, checkpoint weather, and risk summaries.
* `corridor_heatmap`: Spatial grid along the corridor with forecast vectors for 0, 3, 6, 9, 12, 18, 24, 36, and 48 hours.

---

## 🎥 Loom Walkthrough Script (5–10 Minutes)

1. **Introduction (1 min)**:
   * State your name: Cheikh Mouhamadou Fadel Diop.
   * Highlight the stack: React 18, TypeScript, Tailwind, Leaflet, Django 5, DRF, OSRM, Open-Meteo.
2. **Interactive Demonstration (3 min)**:
   * Input a heavy-haul route: Chicago $\rightarrow$ Denver with 42,000 lbs load.
   * Demonstrate route comparison cards: Show how the safest route is chosen over the fastest route due to high winds in Nebraska.
   * Demonstrate the **0–48h Forecast Slider**: Move the slider to show a simulated snowstorm moving across the Great Plains and how it impacts the trip corridor.
   * Click on individual checkpoints to inspect ETA, wind, rain, snow, and risk reasons.
3. **Architecture & Code Quality (3 min)**:
   * Showcase `risk_engine.py`: Explain the strict adherence to the threshold table and the load weight escalation logic.
   * Showcase `routing_service.py`: Explain the geodesic checkpoint sampling and time-interpolated ETAs.
   * Showcase React map performance: Smooth Leaflet rendering, clear visual hierarchy.
4. **Conclusion (1 min)**:
   * Summary of test coverage and deployment readiness.

---

## 👨‍💻 Author
**Cheikh Mouhamadou Fadel Diop**  
Full Stack & Software Engineer  
* Email: [falloucheikh2003@gmail.com](mailto:falloucheikh2003@gmail.com)  
* Portfolio: [byfadel.digital](https://byfadel.digital)  
* GitHub: [github.com/cheikhfadeldiop](https://github.com/cheikhfadeldiop)
