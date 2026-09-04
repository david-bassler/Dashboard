import type { WeatherForecast, WeatherProvider } from '../../domain/weather.ts';
import type { AccuWeatherDailyResponse } from './accuweather-types.ts';
import { transformAccuWeatherForecast } from './accuweather-transformer.ts';

export type AccuWeatherForecastDays = 1 | 5 | 7 | 10 | 15;

export interface AccuWeatherConfig {
  apiKey: string;
  locationKey: string;
  locationName: string;
  language: string;
  forecastDays: AccuWeatherForecastDays;
  requestedDays: number;
}

export class AccuWeatherProvider implements WeatherProvider {
  readonly #config: AccuWeatherConfig;

  constructor(config: AccuWeatherConfig) {
    this.#config = config;
  }

  async fetchForecast(): Promise<WeatherForecast> {
    const url = new URL(
      `https://dataservice.accuweather.com/forecasts/v1/daily/${this.#config.forecastDays}day/${encodeURIComponent(this.#config.locationKey)}`,
    );
    url.searchParams.set('metric', 'true');
    url.searchParams.set('language', this.#config.language);
    url.searchParams.set('details', 'false');

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.#config.apiKey}`,
        Accept: 'application/json',
        'Accept-Encoding': 'gzip',
      },
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `AccuWeather request failed with ${response.status} ${response.statusText}: ${body.slice(0, 300)}`,
      );
    }

    const raw = (await response.json()) as AccuWeatherDailyResponse;
    if (!Array.isArray(raw.DailyForecasts)) {
      throw new Error('AccuWeather response does not contain DailyForecasts.');
    }

    return transformAccuWeatherForecast(raw, {
      locationName: this.#config.locationName,
      requestedDays: this.#config.requestedDays,
    });
  }
}
