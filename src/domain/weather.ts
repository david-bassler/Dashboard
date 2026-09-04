export type WeatherCondition = 'sun' | 'rain' | 'mixed' | 'other';

export interface WeatherDay {
  date: string;
  temperatureMin: number;
  temperatureMax: number;
  condition: WeatherCondition;
}

export interface WeatherForecast {
  source: 'accuweather';
  location: string;
  fetchedAt: string;
  requestedDays: number;
  availableDays: number;
  sourceUrl: string | null;
  days: WeatherDay[];
}

export interface WeatherProvider {
  fetchForecast(): Promise<WeatherForecast>;
}
