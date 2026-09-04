import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import type { WeatherForecast } from '../src/domain/weather.ts';
import { WeatherCache } from '../src/server/cache.ts';

const sample: WeatherForecast = {
  source: 'accuweather',
  location: 'Berlin',
  fetchedAt: '2026-09-04T06:00:00.000Z',
  requestedDays: 28,
  availableDays: 1,
  sourceUrl: null,
  days: [{
    date: '2026-09-04',
    temperatureMin: 12,
    temperatureMax: 21,
    condition: 'sun',
  }],
};

test('writes and reads the weather cache atomically', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'dashboard-cache-'));
  try {
    const cache = new WeatherCache(join(directory, 'data', 'weather.json'));
    assert.equal(await cache.read(), null);
    assert.equal(await cache.isFresh(86_400_000), false);

    await cache.write(sample);
    assert.deepEqual(await cache.read(), sample);
    assert.equal(await cache.isFresh(86_400_000), true);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
