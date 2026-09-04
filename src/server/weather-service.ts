import type { WeatherProvider } from '../domain/weather.ts';
import { WeatherCache } from './cache.ts';

export class WeatherService {
  readonly #cache: WeatherCache;
  readonly #provider: WeatherProvider | null;
  #refreshInFlight: Promise<void> | null = null;

  constructor(cache: WeatherCache, provider: WeatherProvider | null) {
    this.#cache = cache;
    this.#provider = provider;
  }

  async getCachedForecast() {
    return this.#cache.read();
  }

  async ensureFresh(maxAgeMs: number): Promise<void> {
    if (await this.#cache.isFresh(maxAgeMs)) {
      return;
    }

    await this.refresh();
  }

  async refresh(): Promise<void> {
    if (!this.#provider) {
      console.warn('[weather] AccuWeather is not configured; keeping existing cache.');
      return;
    }

    if (this.#refreshInFlight) {
      return this.#refreshInFlight;
    }

    this.#refreshInFlight = (async () => {
      const forecast = await this.#provider.fetchForecast();
      await this.#cache.write(forecast);
      console.info(
        `[weather] refreshed ${forecast.availableDays}/${forecast.requestedDays} days for ${forecast.location}`,
      );
    })();

    try {
      await this.#refreshInFlight;
    } finally {
      this.#refreshInFlight = null;
    }
  }
}
