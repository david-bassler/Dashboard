# Personal Dashboard PoC

Dependency-freier PoC mit Node.js 26, TypeScript, nativen Web Components und plain CSS.

## Voraussetzungen

- Node.js 26.8.1
- AccuWeather API-Key
- AccuWeather Location-Key

Es gibt keine npm-Abhängigkeiten und deshalb auch keinen Installationsschritt.

## Konfiguration

```bash
cp .env.example .env
```

Dann mindestens setzen:

```dotenv
ACCUWEATHER_API_KEY=...
ACCUWEATHER_LOCATION_KEY=...
ACCUWEATHER_LOCATION_NAME=Berlin
```

Der öffentliche AccuWeather-Core-Weather-Endpunkt liefert je nach Tarif 1, 5, 7, 10 oder maximal 15 Tage. Das Dashboard-Ziel bleibt 28 Tage. Wenn weniger Tage geliefert werden, speichert und zeigt der PoC nur die tatsächlich verfügbaren Daten.

`ACCUWEATHER_FORECAST_DAYS=15` setzt den verwendeten Core-Weather-Endpunkt. Bei einem Tarif mit weniger Forecast-Tagen muss der Wert entsprechend auf 5, 7 oder 10 reduziert werden.

## Start

```bash
npm start
```

Danach: `http://localhost:3000`

Node lädt `.env` über seine eingebaute `--env-file-if-exists`-Option. Der Server führt TypeScript direkt über das native Type-Stripping von Node aus.

## Datenfluss

```text
AccuWeather
  -> AccuWeatherProvider
  -> AccuWeather Transformer
  -> provider-unabhängiges WeatherForecast
  -> data/weather.json
  -> GET /api/weather
  -> <weather-forecast>
```

Der Browser ruft niemals AccuWeather direkt auf.

## Aktualisierung

- Beim Serverstart wird `data/weather.json` geprüft.
- Fehlt der Cache oder ist er älter als 24 Stunden, wird ein Refresh versucht.
- Zusätzlich läuft täglich zur lokalen Stunde `WEATHER_REFRESH_HOUR` (Standard: 06:00) ein Refresh.
- Schlägt AccuWeather fehl, bleibt der vorhandene Cache erhalten.
- Ein Browser-Reload verursacht nur `GET /api/weather`, keinen AccuWeather-Request.

## Endpoints

- `GET /api/weather` — normalisierter Wetter-Cache
- `GET /health` — einfacher Healthcheck

## Client-Build

Browser können TypeScript nicht direkt ausführen. `scripts/build-client.ts` verwendet ausschließlich Nodes eingebautes `node:module`-API `stripTypeScriptTypes()` und erzeugt daraus `dist/ui/*.js`. Es wird kein Bundler und keine externe Transpiler-Library verwendet.

## Tests

```bash
npm test
```

Die Tests decken aktuell Transformer, Cache und Scheduler-Berechnung ab.
