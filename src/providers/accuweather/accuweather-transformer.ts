import type { WeatherCondition, WeatherDay, WeatherForecast } from '../../domain/weather.ts';
import type {
  AccuWeatherDailyForecast,
  AccuWeatherDailyResponse,
  AccuWeatherHalfDay,
} from './accuweather-types.ts';

export interface AccuWeatherTransformOptions {
  locationName: string;
  requestedDays: number;
  fetchedAt?: Date;
}

function isRain(period: AccuWeatherHalfDay): boolean {
  if (!period.HasPrecipitation) {
    return false;
  }

  const type = period.PrecipitationType?.toLowerCase();
  if (!type) {
    return true;
  }

  return type.includes('rain') || type.includes('shower') || type.includes('thunder');
}

function isSunnyDay(period: AccuWeatherHalfDay): boolean {
  return period.Icon >= 1 && period.Icon <= 5 && !period.HasPrecipitation;
}

export function classifyCondition(forecast: AccuWeatherDailyForecast): WeatherCondition {
  const dayRain = isRain(forecast.Day);
  const nightRain = isRain(forecast.Night);

  if (dayRain && nightRain) {
    return 'rain';
  }

  if (dayRain || nightRain) {
    return 'mixed';
  }

  if (isSunnyDay(forecast.Day)) {
    return 'sun';
  }

  return 'other';
}

function toWeatherDay(forecast: AccuWeatherDailyForecast): WeatherDay {
  return {
    date: forecast.Date.slice(0, 10),
    temperatureMin: forecast.Temperature.Minimum.Value,
    temperatureMax: forecast.Temperature.Maximum.Value,
    condition: classifyCondition(forecast),
  };
}

export function transformAccuWeatherForecast(
  raw: AccuWeatherDailyResponse,
  options: AccuWeatherTransformOptions,
): WeatherForecast {
  const days = raw.DailyForecasts.slice(0, options.requestedDays).map(toWeatherDay);
  const firstLink = raw.DailyForecasts.find((day) => day.Link)?.Link ?? null;

  return {
    source: 'accuweather',
    location: options.locationName,
    fetchedAt: (options.fetchedAt ?? new Date()).toISOString(),
    requestedDays: options.requestedDays,
    availableDays: days.length,
    sourceUrl: firstLink,
    days,
  };
}
