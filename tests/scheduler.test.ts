import assert from 'node:assert/strict';
import test from 'node:test';
import { millisecondsUntilNextLocalHour } from '../src/server/scheduler.ts';

test('schedules later on the same day when refresh hour is ahead', () => {
  const now = new Date(2026, 8, 4, 5, 30, 0, 0);
  assert.equal(millisecondsUntilNextLocalHour(6, now), 30 * 60 * 1000);
});

test('schedules the next day when refresh hour already passed', () => {
  const now = new Date(2026, 8, 4, 6, 30, 0, 0);
  const delay = millisecondsUntilNextLocalHour(6, now);
  assert.ok(delay > 23 * 60 * 60 * 1000);
  assert.ok(delay <= 24 * 60 * 60 * 1000);
});
