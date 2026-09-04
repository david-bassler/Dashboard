import type { AccuWeatherForecastDays } from '../providers/accuweather/accuweather-fetcher.ts';

export interface AppConfig {
  port: number;
  weatherRefreshHour: number;
  weatherCacheMaxAgeMs: number;
  requestedForecastDays: number;
  accuweather: {
    apiKey: string | null;
    locationKey: string | null;
    locationName: string;
    language: string;
    forecastDays: AccuWeatherForecastDays;
  };
}

function integerFromEnv(name: string, fallback: number, min: number, max: number): number {
  const raw = process.env[name];
  if (!raw) {
    return fallback;
  }

  const value = Number.parseInt(raw, 10);
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(`${name} must be an integer between ${min} and ${max}.`);
  }

  return value;
}

function forecastDaysFromEnv(): AccuWeatherForecastDays {
  const value = integerFromEnv('ACCUWEATHER_FORECAST_DAYS', 15, 1, 15);
  if (value === 1 || value === 5 || value === 7 || value === 10 || value === 15) {
    return value;
  }

  throw new Error('ACCUWEATHER_FORECAST_DAYS must be one of 1, 5, 7, 10 or 15.');
}

export function loadConfig(): AppConfig {
  return {
    port: integerFromEnv('PORT', 3000, 1, 65_535),
    weatherRefreshHour: integerFromEnv('WEATHER_REFRESH_HOUR', 6, 0, 23),
    weatherCacheMaxAgeMs: 24 * 60 * 60 * 1000,
    requestedForecastDays: 28,
    accuweather: {
      apiKey: process.env.ACCUWEATHER_API_KEY?.trim() || null,
      locationKey: process.env.ACCUWEATHER_LOCATION_KEY?.trim() || null,
      locationName: process.env.ACCUWEATHER_LOCATION_NAME?.trim() || 'Unbekannter Ort',
      language: process.env.ACCUWEATHER_LANGUAGE?.trim() || 'de-de',
      forecastDays: forecastDaysFromEnv(),
    },
  };
}
