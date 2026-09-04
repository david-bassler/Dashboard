import assert from 'node:assert/strict';
import test from 'node:test';
import { classifyCondition, transformAccuWeatherForecast } from '../src/providers/accuweather/accuweather-transformer.ts';
import type { AccuWeatherDailyForecast, AccuWeatherDailyResponse } from '../src/providers/accuweather/accuweather-types.ts';

function day(overrides: Partial<AccuWeatherDailyForecast> = {}): AccuWeatherDailyForecast {
  return {
    Date: '2026-09-04T07:00:00+02:00',
    Temperature: {
      Minimum: { Value: 12, Unit: 'C', UnitType: 17 },
      Maximum: { Value: 21, Unit: 'C', UnitType: 17 },
    },
    Day: { Icon: 1, IconPhrase: 'Sunny', HasPrecipitation: false },
    Night: { Icon: 33, IconPhrase: 'Clear', HasPrecipitation: false },
    Link: 'https://example.test/weather',
    ...overrides,
  };
}

test('classifies sunny, rainy and mixed days', () => {
  assert.equal(classifyCondition(day()), 'sun');
  assert.equal(
    classifyCondition(day({
      Day: { Icon: 18, IconPhrase: 'Rain', HasPrecipitation: true, PrecipitationType: 'Rain' },
      Night: { Icon: 18, IconPhrase: 'Rain', HasPrecipitation: true, PrecipitationType: 'Rain' },
    })),
    'rain',
  );
  assert.equal(
    classifyCondition(day({
      Night: { Icon: 39, IconPhrase: 'Showers', HasPrecipitation: true, PrecipitationType: 'Rain' },
    })),
    'mixed',
  );
});

test('normalizes AccuWeather response without inventing missing forecast days', () => {
  const raw: AccuWeatherDailyResponse = {
    DailyForecasts: [day(), day({ Date: '2026-09-05T07:00:00+02:00' })],
  };

  const forecast = transformAccuWeatherForecast(raw, {
    locationName: 'Berlin',
    requestedDays: 28,
    fetchedAt: new Date('2026-09-04T06:00:00.000Z'),
  });

  assert.equal(forecast.requestedDays, 28);
  assert.equal(forecast.availableDays, 2);
  assert.equal(forecast.days.length, 2);
  assert.equal(forecast.days[0]?.temperatureMin, 12);
  assert.equal(forecast.days[0]?.temperatureMax, 21);
  assert.equal(forecast.sourceUrl, 'https://example.test/weather');
});
