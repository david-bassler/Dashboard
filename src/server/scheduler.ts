export interface DailyScheduler {
  stop(): void;
}

export function millisecondsUntilNextLocalHour(hour: number, now = new Date()): number {
  const next = new Date(now);
  next.setHours(hour, 0, 0, 0);

  if (next.getTime() <= now.getTime()) {
    next.setDate(next.getDate() + 1);
  }

  return next.getTime() - now.getTime();
}

export function startDailyScheduler(hour: number, task: () => Promise<void>): DailyScheduler {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let stopped = false;

  const scheduleNext = (): void => {
    if (stopped) {
      return;
    }

    const delay = millisecondsUntilNextLocalHour(hour);
    timer = setTimeout(async () => {
      try {
        await task();
      } catch (error) {
        console.error('[weather] scheduled refresh failed', error);
      } finally {
        scheduleNext();
      }
    }, delay);
  };

  scheduleNext();

  return {
    stop(): void {
      stopped = true;
      if (timer) {
        clearTimeout(timer);
      }
    },
  };
}
