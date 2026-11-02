# Technical & Functional Specifications

## Project: Weather-Aware Truck Routing (Spotter AI Assessment)

---

### 1. Context & Core Objective

Develop a mission-critical full-stack web application (**React 18 Frontend + Django 5 REST Backend**) designed to assist commercial truck drivers and fleet operators in selecting the safest and most weather-resilient highway route based on:
1. **Real-time and forecasted atmospheric conditions** (wind speed, rain intensity, snowfall rate).
2. **Cargo payload weight** (dynamic rollover risk and crosswind sensitivity).
3. **Total travel duration and delivery efficiency**.

---

### 2. User Input Parameters

* **Origin & Destination**: Geocoded city names (e.g., `"Chicago, IL"` to `"Denver, CO"`) or geographical coordinates (`latitude, longitude`).
* **Departure Timestamp**: ISO 8601 date and time supporting immediate dispatch or future scheduled trips.
* **Cargo Load Weight**: Payload weight specified in pounds (`lbs`) ranging between $5,000$ and $80,000$ lbs.
* **Weather Sampling Interval**: Configurable highway distance steps (`10 miles`, `25 miles`, or `50 miles`).

---

### 3. Business Rules & Meteorological Risk Model

#### A. Environmental Risk Threshold Matrix
At each checkpoint along the route, weather variables forecasted at the truck's Estimated Time of Arrival (**ETA**) are classified into five ordinal risk tiers:

| Condition | Low (1) | Moderate (2) | High (3) | Severe (4) | No Travel (5) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Wind Speed** | $< 25$ mph | $25 - 34$ mph | $35 - 44$ mph | $45 - 54$ mph | $\ge 55$ mph |
| **Rain Intensity** | $< 0.10$ in/hr | $0.10 - 0.25$ in/hr | $0.25 - 0.50$ in/hr | $0.50 - 1.00$ in/hr | $> 1.00$ in/hr |
| **Snowfall Rate** | $< 0.5$ in/hr | $0.5 - 1.0$ in/hr | $1.0 - 2.0$ in/hr | $2.0 - 3.0$ in/hr | $> 3.0$ in/hr |

#### B. Cargo Load Weight Escalation Rules
Trailer gross weight alters dynamic crosswind stability and rotational rollover momentum:
1. **Universal Safety Rule**: `Wind ≥ 55 mph` $\implies$ **No Travel** (mandatory shutdown regardless of cargo weight).
2. **Medium-Heavy Load Rule (> 30,000 lbs)**: `Wind 45–54 mph` AND `Load > 30,000 lbs` $\implies$ **No Travel**.
3. **Heavy Load Rule (> 40,000 lbs)**: `Wind 35–44 mph` AND `Load > 40,000 lbs` $\implies$ **Severe**.

#### C. Checkpoint Composite Risk
For each sampled checkpoint $i$, the overall risk level is the supremum of all adjusted environmental hazards:
$$\text{Risk}_{\text{checkpoint}} = \max\left(\text{Risk}_{\text{wind\_adjusted}},\, \text{Risk}_{\text{rain}},\, \text{Risk}_{\text{snow}}\right)$$
Using the ordinal hierarchy: $\text{Low (1)} < \text{Moderate (2)} < \text{High (3)} < \text{Severe (4)} < \text{No Travel (5)}$.

---

### 4. Route Recommendation Algorithm

The system generates **three distinct alternative highway routes** and ranks them using a strict lexicographical safety hierarchy:
1. **Priority 1 (Absolute Safety)**: Minimize combined miles under **No Travel** and **Severe** conditions ($\min(\text{No Travel Miles} + \text{Severe Miles})$).
2. **Priority 2 (High Risk Reduction)**: Minimize miles exposed to **High** risk conditions ($\min(\text{High Miles})$).
3. **Priority 3 (Overall Route Quality)**: Lowest average composite risk score ($\min\left(\frac{1}{N}\sum_{i=1}^N \text{Score}_i\right)$).
4. **Priority 4 (Efficiency)**: Shortest total travel duration ($\min(\text{Total Duration Seconds})$).

The top-ranked route is awarded the **"Recommended"** badge.

---

### 5. Geospatial & UI Requirements

1. **Multi-Route Highway Visualization**:
   - Render all three generated route options on an interactive Leaflet map.
   - Selected route is prominently displayed; non-selected alternatives are subtly rendered in the background.
   - Route segments and checkpoint nodes are color-coded strictly by their computed risk tier:
     - Blue (`#3B82F6`): Low Risk
     - Amber (`#F59E0B`): Moderate Risk
     - Orange (`#F97316`): High Risk
     - Neon Red (`#EF4444`): Severe Risk
     - Deep Crimson (`#991B1B`): No Travel
2. **Interactive Checkpoint Inspection**:
   - Clickable checkpoints display a detailed telemetry card and modal showing arrival ETA, wind speed, rain rate, snow rate, load weight rules applied, and plain-English safety warnings.
3. **0–48h Dynamic Weather Corridor Heatmap**:
   - Interactive temporal slider ($T+0$ to $T+48$ hours) with play/pause storm animation.
   - Spatial weather grid showing storm intensity evolution across the travel corridor.

---

### 6. Technical Stack & Architecture

* **Backend**: Python 3.11+, Django 5, Django REST Framework. Decoupled pure business logic under `backend/routing_core/`.
* **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, Leaflet GIS.
* **External Services (No API Key Dependencies)**:
  - Routing: OSRM (Open Source Routing Machine).
  - Weather: Open-Meteo API (hourly synchronized forecasts).
  - Geocoding: Nominatim OpenStreetMap.

