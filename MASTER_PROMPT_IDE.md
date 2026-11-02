# MASTER PROMPT POUR L'IDE : WEATHER-AWARE TRUCK ROUTING
> **Projet** : Take-Home Assessment — Spotter AI  
> **Poste ciblé** : Remote FullStack Engineer (React + Django)  
> **Technologies** : React 18 / TypeScript / Vite / Tailwind CSS / Leaflet + Django 5 / Django REST Framework / Python 3  
> **Évaluation** : 40% Logique météo/routage/risque, 40% UI/Carte/Heatmap, 15% Qualité de code, 5% Documentation & Démo Loom.

---

## 🎯 INSTRUCTIONS POUR L'AGENT / ASSISTANT DANS L'IDE

Agis comme un **Tech Lead & Staff Full Stack Engineer**. Tu dois développer l'application complète **Weather-Aware Truck Routing** pour Spotter AI en suivant une rigueur d'ingénierie irréprochable. Le code doit être propre, typé (TypeScript + Python Type Hints), testé, documenté et prêt à être hébergé.

---

## 📌 1. RÈGLES MÉTIER ET FORMULES DE CALCUL (STRICTES)

### A. Classification du risque météo par checkpoint
Chaque checkpoint d'un itinéraire est évalué en fonction des prévisions météo à son heure d'arrivée estimée (**ETA**) :

| Condition | Low (1) | Moderate (2) | High (3) | Severe (4) | No Travel (5) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Vent (Wind)** | < 25 mph | 25 – 34 mph | 35 – 44 mph | 45 – 54 mph | $\ge$ 55 mph |
| **Pluie (Rain)** | < 0.10 in/hr | 0.10 – 0.25 in/hr | 0.25 – 0.50 in/hr | 0.50 – 1.00 in/hr | > 1.00 in/hr |
| **Neige (Snow)** | < 0.5 in/hr | 0.5 – 1.0 in/hr | 1.0 – 2.0 in/hr | 2.0 – 3.0 in/hr | > 3.0 in/hr |

### B. Règles de sensibilité au poids (Load Rules)
La charge transportée (`load_weight` en livres / lbs) aggrave le risque lié au vent :
1. `wind_speed >= 55 mph` $\rightarrow$ **No Travel** (indépendamment du poids).
2. `45 <= wind_speed <= 54 mph` ET `load_weight > 30,000 lbs` $\rightarrow$ **No Travel**.
3. `35 <= wind_speed <= 44 mph` ET `load_weight > 40,000 lbs` $\rightarrow$ **Severe**.

### C. Risque composite au Checkpoint
```python
checkpoint_risk = max(adjusted_wind_risk, rain_risk, snow_risk)
```

### D. Algorithme de Recommandation des 3 Itinéraires
Trier les 3 routes générées par :
1. `no_travel_miles + severe_miles` (Ascendant - Moins il y en a, mieux c'est).
2. `high_miles` (Ascendant).
3. `average_risk_score` (Ascendant, où Low=1, Mod=2, High=3, Severe=4, No Travel=5).
4. `total_duration_seconds` (Ascendant - Le plus rapide).

La route en tête de ce tri est étiquetée `is_recommended = True`.

---

## 🗺️ 2. HEATMAP CORRIDOR & SLIDER 0–48H

* L'application doit générer une grille de points météo le long du corridor de déplacement (bounding box élargie autour des routes).
* Un **slider temporel interactif** sur le frontend permet de faire glisser l'heure de $T+0$ à $T+48$ heures.
* En déplaçant le curseur, la carte Leaflet met à jour en temps réel la heatmap météo (zones de vent violent, pluie forte ou tempête de neige) pour visualiser la trajectoire des intempéries le long du voyage.

---

## 🔌 3. APIS EXTERNES À UTILISER (GRATUITES, ZERO-CONFIG)
1. **Routage** : OSRM (`https://router.project-osrm.org/route/v1/driving/{coords}?overview=full&geometries=geojson&alternatives=3`).
2. **Météo** : Open-Meteo (`https://api.open-meteo.com/v1/forecast?latitude=...&longitude=...&hourly=wind_speed_10m,precipitation,snowfall&wind_speed_unit=mph&precipitation_unit=inch`).
3. **Géocodage** : OpenStreetMap Nominatim (`https://nominatim.openstreetmap.org/search?q={query}&format=json&limit=1`).

---

## 🏗️ 4. SPÉCIFICATION DE L'API DJANGO (BACKEND)

### Endpoint : `POST /api/routes/analyze/`
#### Request Body :
```json
{
  "origin": "Chicago, IL",
  "destination": "Denver, CO",
  "departure_time": "2026-11-03T08:00:00Z",
  "load_weight": 35000,
  "sampling_interval_miles": 25
}
```

#### Response Body :
```json
{
  "origin": {"name": "Chicago, IL", "lat": 41.8781, "lng": -87.6298},
  "destination": {"name": "Denver, CO", "lat": 39.7392, "lng": -104.9903},
  "load_weight": 35000,
  "routes": [
    {
      "id": "route_1",
      "name": "Via I-80 W",
      "is_recommended": true,
      "total_distance_miles": 1004.2,
      "total_duration_hours": 15.2,
      "estimated_arrival": "2026-11-03T23:12:00Z",
      "risk_summary": {
        "low_miles": 650.0,
        "moderate_miles": 250.0,
        "high_miles": 104.2,
        "severe_miles": 0.0,
        "no_travel_miles": 0.0,
        "average_risk_score": 1.45
      },
      "geometry": { "type": "LineString", "coordinates": [...] },
      "checkpoints": [
        {
          "index": 0,
          "distance_from_origin_miles": 0.0,
          "lat": 41.8781,
          "lng": -87.6298,
          "eta": "2026-11-03T08:00:00Z",
          "weather": {
            "wind_mph": 18.5,
            "rain_in_hr": 0.0,
            "snow_in_hr": 0.0
          },
          "risk_levels": {
            "wind": "Low",
            "rain": "Low",
            "snow": "Low",
            "overall": "Low"
          }
        }
      ]
    }
  ],
  "corridor_heatmap": {
    "hours": [0, 3, 6, 12, 18, 24, 36, 48],
    "grid_points": [
      {
        "lat": 41.5,
        "lng": -90.2,
        "forecasts": {
          "0": {"risk_score": 1, "wind_mph": 15, "precipitation": 0.0},
          "3": {"risk_score": 3, "wind_mph": 38, "precipitation": 0.3}
        }
      }
    ]
  }
}
```

---

## 💻 5. ARCHITECTURE REACT (FRONTEND)

* **Stack** : Vite + React 18 + TypeScript + Tailwind CSS + Lucide Icons + React-Leaflet + Leaflet-Heat (ou calques SVG de densité).
* **Composants clés** :
  1. `RouteForm` : Champs de saisie réactifs avec autocomplétion des villes et préréglages instantanés (ex: "Chicago $\rightarrow$ Denver", "Seattle $\rightarrow$ Salt Lake City", "Dallas $\rightarrow$ Atlanta").
  2. `RouteMap` : Carte interactive plein écran affichant les 3 routes tracées en polylignes colorées selon leur risque moyen, avec marqueurs de checkpoints personnalisés.
  3. `RouteComparisonCards` : 3 cartes comparatives affichant distance, temps, badge "Recommended", météo critique et répartition des miles par niveau de risque.
  4. `HeatmapSlider` : Curseur temporel 0–48h en bas de carte avec bouton Play/Pause pour animer la météo le long du trajet.
  5. `CheckpointModal / Tooltip` : Affiche les détails au clic sur n'importe quel checkpoint.

---

## 🎬 6. SCRIPT DU WALKTHROUGH LOOM (POUR LA VIDÉO DE 5-10 MIN)

1. **Introduction (1 min)** : Présentation de Cheikh M. Fadel Diop, stack technique (React, TypeScript, Django, OSRM, Open-Meteo), résumé de la mission.
2. **Démonstration en direct (3 min)** :
   * Saisie d'un trajet à fort enjeu météo (ex: Chicago vers Denver en hiver avec 42 000 lbs de chargement).
   * Analyse des 3 routes générées.
   * Démonstration des règles de sensibilité au poids (montrer qu'un vent de 40 mph devient "Severe" pour > 40 000 lbs).
   * Manipulation du slider météo 0-48h pour visualiser le front d'intempéries sur la carte.
3. **Revue de code & Architecture (3 min)** :
   * Côté Django : Présenter `risk_engine.py` (règles pures, tests unitaires) et `routing_service.py`.
   * Côté React : Montrer la fluidité de Leaflet, le typage TypeScript strict et la gestion de l'état.
4. **Conclusion & Hébergement (1 min)** : Mention du repo GitHub et de l'URL de déploiement en ligne.
