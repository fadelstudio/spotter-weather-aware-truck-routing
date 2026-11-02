# CAHIER DES CHARGES TECHNIQUE & FONCTIONNEL (FR)
## Projet : Weather-Aware Truck Routing (Spotter AI Assessment)

> **Document de référence en français décrivant le contexte métier, les règles de calcul et les spécifications techniques.**  
> Pour la documentation principale en anglais, consulter le [README.md](file:///c:/Users/joe_f/OneDrive/Documents/2eJob/projets/spotter_truck_routing/README.md).

---

### 1. Contexte & Objectif
Développer une application Web Full Stack **React (Frontend) + Django (Backend)** permettant à un chauffeur de camion de sélectionner l'itinéraire routier le plus sûr en fonction :
1. De la météo en temps réel et prévisionnelle (vent, pluie, neige).
2. Du poids du chargement (influence critique sur la sensibilité au vent).
3. Du temps de trajet total.

---

### 2. Données d'Entrée Utilisateur
* **Origine & Destination** : Noms de villes (ex: "Chicago, IL" à "Denver, CO") ou coordonnées GPS (lat, lng).
* **Date et Heure de départ** : `datetime` (ex: `2026-11-03T08:00:00Z`).
* **Poids du chargement (Load weight)** : en livres (`lbs`) (ex: 35,000 lbs).
* **Pas d'échantillonnage météo** : `10 miles`, `25 miles` ou `50 miles` (paramétrable par l'utilisateur).

---

### 3. Règles Métier & Algorithme de Risque Météo

#### A. Seuils de Risque par Variable Météo
| Condition | Low (Faible) | Moderate (Modéré) | High (Élevé) | Severe (Sévère) | No Travel (Interdiction) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Vent (Wind)** | < 25 mph | 25 – 34 mph | 35 – 44 mph | 45 – 54 mph | $\ge$ 55 mph |
| **Pluie (Rain)** | < 0.10 in/hr | 0.10 – 0.25 in/hr | 0.25 – 0.50 in/hr | 0.50 – 1.00 in/hr | > 1.00 in/hr |
| **Neige (Snow)** | < 0.5 in/hr | 0.5 – 1.0 in/hr | 1.0 – 2.0 in/hr | 2.0 – 3.0 in/hr | > 3.0 in/hr |

#### B. Règles de Surcharge / Poids (Load Rules)
Ces règles modifient le niveau de risque du vent selon la charge transportée :
1. **Règle Universelle** : `Wind ≥ 55 mph` $\rightarrow$ **No Travel** (quel que soit le poids).
2. **Règle Poids Moyen (> 30,000 lbs)** : `Wind 45–54 mph` ET `Load > 30,000 lbs` $\rightarrow$ **No Travel**.
3. **Règle Poids Lourd (> 40,000 lbs)** : `Wind 35–44 mph` ET `Load > 40,000 lbs` $\rightarrow$ **Severe**.

#### C. Risque Global au Checkpoint
Pour chaque checkpoint $i$, le risque composite est le **maximum** des risques entre :
$$\text{Risk}_{\text{checkpoint}} = \max(\text{Risk}_{\text{wind\_adjusted}}, \text{Risk}_{\text{rain}}, \text{Risk}_{\text{snow}})$$
Avec l'échelle ordinale : $\text{Low} (1) < \text{Moderate} (2) < \text{High} (3) < \text{Severe} (4) < \text{No Travel} (5)$.

---

### 4. Algorithme de Recommandation d'Itinéraire

Le système génère **3 options d'itinéraires distincts** via l'API de routage.  
Il classe et recommande le meilleur itinéraire selon la hiérarchie stricte suivante :
1. **Moins de miles en "No Travel" & "Severe"** (Priorité 1 absolue).
2. **Moins de miles en "High"** (Priorité 2).
3. **Score de risque moyen le plus faible** ($\sum \text{risk\_score}_i / N$) (Priorité 3).
4. **Temps de trajet le plus court** (Priorité 4).

L'itinéraire gagnant reçoit le badge **"Recommended"**.

---

### 5. Fonctionnalités Cartographiques & Heatmap 0–48h

1. **Tracé multi-itinéraires** :
   * Affichage des 3 itinéraires sur la carte (Leaflet / Mapbox).
   * L'itinéraire actif/recommandé est mis en évidence, les alternatives sont visibles en arrière-plan.
   * Découpage des segments ou des checkpoints par couleur de risque :
     * Vert : Low
     * Jaune : Moderate
     * Orange : High
     * Rouge : Severe
     * Noir / Rouge Foncé : No Travel
2. **Checkpoints interactifs** :
   * Clic sur un checkpoint : Affiche ETA exacte, vitesse du vent, précipitations de pluie, chute de neige, poids pris en compte et risque calculé.
3. **Heatmap du Corridor Météo avec Slider 0–48h** :
   * Un curseur temporel interactif (de $H+0$ à $H+48$ heures par pas de 1h ou 3h).
   * Affichage d'un calque météo dynamique (intensité des précipitations ou rafales de vent) le long du couloir de déplacement entre l'origine et la destination.
   * Permet au chauffeur d'observer l'évolution d'une tempête ou d'un front neigeux sur 48h.

---

### 6. Architecture Technique

```
spotter_truck_routing/
├── backend/                  # Django + Django REST Framework
│   ├── manage.py
│   ├── config/               # Settings, URLs, WSGI
│   │   ├── settings.py
│   │   └── urls.py
│   ├── api/                  # Endpoints REST API
│   │   ├── views.py
│   │   └── serializers.py
│   └── routing_core/         # Logique métier pure & découplée
│       ├── routing_service.py       # OSRM / OpenRouteService (3 routes)
│       ├── weather_service.py       # Open-Meteo (Météo synchronisée à l'ETA)
│       ├── risk_engine.py           # Règles météo + Load rules + Scoring
│       ├── heatmap_service.py       # Grille corridor prévisionnelle 0-48h
│       └── recommendation_engine.py # Tri hiérarchique des routes
└── frontend/                 # React 18 + Vite + TypeScript + Tailwind
    ├── package.json
    ├── tailwind.config.js
    └── src/
        ├── components/
        │   ├── RouteForm.tsx         # Saisie Origine, Dest, Date, Poids, Pas
        │   ├── RouteMap.tsx          # Carte Leaflet + Tracé des routes + Checkpoints
        │   ├── RouteSummaryCards.tsx # Comparatif des 3 routes + Badge Recommandé
        │   ├── ForecastSlider.tsx    # Slider 0-48h pour la Heatmap
        │   └── CheckpointModal.tsx   # Détails météo du point
        ├── services/
        │   └── api.ts                # Appels Axios vers le backend Django
        └── types/
            └── index.ts              # Interfaces TypeScript strictes
```

---

### 7. Choix des APIs Externes (100% Gratuites & Sans Clé Complexe)
* **Routage** : OSRM (Open Source Routing Machine - `router.project-osrm.org`) ou OpenRouteService. Aucun paiement ni carte bancaire requis.
* **Météo** : Open-Meteo API (`api.open-meteo.com`). Entièrement gratuite, open source, prévisions horaires jusqu'à 7-14 jours (vent à 10m en mph, pluie en mm/inches, neige en cm/inches).
* **Géocodage** : Nominatim OpenStreetMap (`nominatim.openstreetmap.org`) pour convertir les noms de villes en coordonnées GPS.
