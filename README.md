# Händler-Planungsapp (Außendienst-Routenoptimierung)

Eine moderne, performante React-Anwendung zur automatisierten Planung und Optimierung von Außendienst-Routen für Händlerbesuche.

## Features

- **Reales Straßennetz (ORS):** Berechnung echter Fahrstrecken und Zeiten über die [OpenRouteService API](https://openrouteservice.org/).
- **Intelligente Optimierung:** Routenoptimierung mittels Nearest-Neighbor Heuristik und anschließender 2-Opt-Verbesserung.
- **Termintreue & Zeitplanung:** Berücksichtigung von fixen Besuchszeiten, Berechnung von Ankunfts- und Abfahrtszeiten sowie automatischer Ausweis von Wartezeiten und Verspätungen.
- **CSV-Import & Export:** Einfaches Einlesen der Händlerdaten (inkl. Debitor, Name, Adresse, Termin, Dauer) und Export der optimierten Route.
- **Modernes Design:** Übersichtliche Split-Screen UI mit interaktiver Karte (Leaflet), Dark-Mode Unterstützung und Glassmorphism-Elementen.

## Installation & Start

1. Repository klonen oder herunterladen.
2. Abhängigkeiten installieren:
   ```bash
   npm install
   ```
3. Entwicklungsserver starten:
   ```bash
   npm run dev
   ```
4. Die App ist standardmäßig unter `http://localhost:5173` erreichbar.

## Nutzung
1. Geben Sie optional einen OpenRouteService API-Key in der Sidebar ein (für genaue Straßendaten, andernfalls wird mit Luftlinien-Distanzen gerechnet).
2. Start- und Endpunkt (optional) eintragen.
3. Tour-Startzeit und Standard-Aufenthaltszeit definieren.
4. CSV hochladen oder Händlerdaten in das Textfeld eintragen. 
   **Format:** `Debitor; Name; Adresse; [Zeit HH:MM]; [Dauer Min]`
5. Auf "Route optimieren" klicken.
6. Die berechnete Liste als CSV exportieren.

## Tech-Stack
- [React](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- [Leaflet](https://leafletjs.com/) & [React-Leaflet](https://react-leaflet.js.org/) für die Kartendarstellung.
- [Lucide Icons](https://lucide.dev/) für die Vektorgrafiken.
