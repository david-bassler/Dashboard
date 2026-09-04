import { mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { WeatherForecast } from '../domain/weather.ts';

export class WeatherCache {
  readonly #path: string;

  constructor(path: string) {
    this.#path = path;
  }

  async read(): Promise<WeatherForecast | null> {
    try {
      const content = await readFile(this.#path, 'utf8');
      return JSON.parse(content) as WeatherForecast;
    } catch (error) {
      if (isNotFoundError(error)) {
        return null;
      }
      throw error;
    }
  }

  async isFresh(maxAgeMs: number, now = Date.now()): Promise<boolean> {
    try {
      const metadata = await stat(this.#path);
      return now - metadata.mtimeMs < maxAgeMs;
    } catch (error) {
      if (isNotFoundError(error)) {
        return false;
      }
      throw error;
    }
  }

  async write(forecast: WeatherForecast): Promise<void> {
    await mkdir(dirname(this.#path), { recursive: true });
    const temporaryPath = `${this.#path}.${process.pid}.tmp`;
    await writeFile(temporaryPath, `${JSON.stringify(forecast, null, 2)}\n`, 'utf8');
    await rename(temporaryPath, this.#path);
  }
}

function isNotFoundError(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT';
}
