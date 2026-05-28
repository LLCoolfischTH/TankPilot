# TankPilot – MVP

> Findet nicht nur den günstigsten Literpreis – sondern die **günstigste Tankstelle nach Gesamtkosten** (Preis + Umweg).

## Schnellstart

```bash
# 1. Abhängigkeiten installieren
cd backend && npm install
cd ../frontend && npm install
cd ..

# 2. Umgebungsvariablen anlegen
cp .env.example backend/.env
# ORS_API_KEY in backend/.env eintragen (optional, Fallback ist Haversine)

# 3. Beide Server starten
npm install          # concurrently installieren
npm run dev          # startet Backend (Port 3001) + Frontend (Port 5173)
```

Browser öffnen: http://localhost:5173

## Algorithmus

```
Gesamtkosten = (Preis/L × Tankmenge)
             + (Umweg km × 2 × Verbrauch/100 × Referenzpreis)
```

Der **Umweg wird doppelt gezählt** (Hin- und Rückfahrt zum Ausgangspunkt).

## APIs (alle kostenlos)

| API | Zweck | Key nötig? |
|-----|-------|-----------|
| Tankerkönig | DE-Tankpreise | Demo-Key eingebaut |
| OpenRouteService | Straßendistanz | Kostenlos registrieren |
| OpenStreetMap | Karte | Nein |

## Tests

```bash
cd backend && npm test
```

## Projektstruktur

```
tankpilot/
├── backend/
│   ├── routes/          # Express-Routen
│   ├── services/
│   │   ├── costCalculator.js     ← Kern-Algorithmus
│   │   ├── tankerkoenigService.js
│   │   └── routeService.js
│   ├── tests/
│   └── server.js
└── frontend/
    └── src/
        ├── components/  # React-Komponenten
        ├── services/    # API-Calls
        └── App.jsx
```

## Hochschulprojekt – THB Entrepreneurship 2026
