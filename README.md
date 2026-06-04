# TankPilot

> Findet die **günstigste Tankstelle nach Gesamtkosten** – nicht nur nach Literpreis.
> Umwegkosten (Hin- und Rückfahrt) werden automatisch eingerechnet.

**Live:** https://tank-pilot.vercel.app
**Backend:** https://tankpilot-backend.onrender.com/api/health

> Das Backend läuft auf einem kostenlosen Server (Render Free Tier) und schläft nach
> 15 Minuten Inaktivität ein. Der erste Request kann bis zu 60 Sekunden dauern.
> Einfach kurz warten und erneut versuchen.

---

## Algorithmus

```
Gesamtkosten = (Preis/L × Tankmenge)
             + (Umweg km × 2 × Verbrauch/100 × Referenzpreis der nächsten Station)
```

Referenz ist die **nächste** Tankstelle – nicht die günstigste. Das beantwortet die
eigentliche Frage: *Lohnt es sich, weiter zu fahren statt zur nächsten Station?*

---

## Lokale Entwicklung

```bash
# Abhängigkeiten installieren
cd backend && npm install
cd ../frontend && npm install
cd ..

# Umgebungsvariablen anlegen
cp .env.example backend/.env
# Werte in backend/.env eintragen (siehe unten)

# Beide Server starten
npm install        # concurrently installieren
npm run dev        # Backend :3001 + Frontend :5173
```

Browser: http://localhost:5173
API-Diagnose: http://localhost:3001/api/diagnose

---

## Umgebungsvariablen (`backend/.env`)

| Variable | Beschreibung | Key nötig? |
|----------|-------------|-----------|
| `TANKERKOENING_API_KEY` | DE-Tankpreise (Bundeskartellamt) | Demo-Key eingebaut |
| `ORS_API_KEY` | Straßendistanz (OpenRouteService) | Kostenlos: openrouteservice.org |
| `HERE_API_KEY` | PL/CZ/NL/... Preise (HERE Maps) (noch NICHT implementiert) | Kostenlos: developer.here.com |
| `PORT` | Backend-Port (Standard: 3001) | — |

Österreich (E-Control) und Frankreich (data.economie.gouv.fr) benötigen **keinen Key**.

---

## Datenquellen

| Land | API | Einzelstationen | Echtzeit |
|------|-----|----------------|---------|
| 🇩🇪 DE | Tankerkönig (Bundeskartellamt MTS-K) | ✅ | ✅ |
| 🇦🇹 AT | E-Control (Energieregulator) | ✅ max. 5 | ✅ |
| 🇫🇷 FR | data.economie.gouv.fr (Wirtschaftsministerium) | ✅ | alle 10 Min |
| 🇵🇱🇨🇿🇳🇱... | HERE Fuel Prices API | ⚠️ | ⚠️ |

Geocoding (Adresssuche): **Photon** (photon.komoot.io) – direkt im Browser, kein Key.
Routing: **OpenRouteService** – Fallback Haversine × 1,3 wenn kein Key gesetzt.
Karte: **Leaflet + OpenStreetMap** – kein Key.

---

## Projektstruktur

```
tankpilot/
├── backend/
│   ├── routes/
│   │   ├── calculate.js      # Hauptendpunkt – Gesamtkosten-Berechnung
│   │   ├── stations.js       # Tankstellen abrufen
│   │   ├── geocode.js        # Adresse → Koordinaten
│   │   ├── route.js          # Distanz berechnen
│   │   └── diagnose.js       # API-Status prüfen
│   ├── services/
│   │   ├── costCalculator.js       ← Kern-Algorithmus
│   │   ├── countryDetector.js      ← Länder- & Service-Erkennung
│   │   ├── tankerkoenigService.js  ← Deutschland
│   │   ├── econtrolService.js      ← Österreich
│   │   ├── franceService.js        ← Frankreich
│   │   ├── hereService.js          ← PL/CZ/NL/BE/CH/DK/LU - noch nicht implementiert
│   │   ├── routeService.js         ← ORS + Haversine-Fallback
│   │   └── currencyService.js      ← Währungsumrechnung (PLN, CZK ...)
│   ├── tests/
│   └── server.js
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── SearchForm.jsx   # Standort, Fahrzeugdaten, Radius
│       │   ├── MapView.jsx      # Leaflet-Karte
│       │   ├── ResultList.jsx   # Ergebnisliste
│       │   └── StationCard.jsx  # Einzelne Station mit Formel-Breakdown
│       ├── services/
│       │   └── api.js           # Backend-Calls + Photon-Geocoding
│       └── App.jsx
├── mobile/                      # Expo / React Native (vorbereitet, nicht deployed)
└── .env.example
```

---

## Tests

```bash
cd backend && npm test
# oder einzeln:
node backend/tests/api/validate-algorithm.js   # Algorithmus-Validierung
node backend/tests/api/debug-here.js           # HERE API diagnostizieren
node backend/tests/api/test-apis.js            # alle APIs testen (Backend muss laufen)
```

---

## Deployment

| Dienst | Plattform | Trigger |
|--------|-----------|---------|
| Frontend | Vercel | automatisch bei `git push` |
| Backend | Render.com (Free) | automatisch bei `git push` |

---

## Hochschulprojekt – THB Entrepreneurship 2026
