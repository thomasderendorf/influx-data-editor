# InfluxDB Editor

Webapp zur Verwaltung von InfluxDB 1.x Datenreihen aus ioBroker.

## Voraussetzungen
- Docker + Docker Compose
- InfluxDB 1.x erreichbar vom Docker-Host

## Setup

1. **`docker-compose.yml` anpassen:**
   ```yaml
   INFLUX_URL:  http://<IP-deiner-InfluxDB>:8086
   INFLUX_DB:   iobroker        # dein DB-Name
   INFLUX_USER: ""              # falls Auth aktiviert
   INFLUX_PASS: ""
   ```

2. **Starten:**
   ```bash
   docker compose up -d --build
   ```

3. **Browser öffnen:** http://localhost:3000

## Funktionen

- **Messreihen-Liste** – alle Measurements werden automatisch geladen
- **Zeitbereich** – frei einstellbar oder Schnellwahl (1h / 6h / 24h / 7d / 30d)
- **Diagramm** – zeitlicher Verlauf des gewählten Werts
- **Tabelle** – alle Datenpunkte tabellarisch mit Checkbox-Auswahl
- **Löschen** – ausgewählte Werte werden per InfluxDB DELETE entfernt

## Tipps

- Die App lädt max. 2000 Zeilen pro Abfrage (reicht für Debugging)
- Zeitstempel werden in deiner lokalen Zeitzone angezeigt
- Nach dem Löschen werden die Daten automatisch neu geladen
