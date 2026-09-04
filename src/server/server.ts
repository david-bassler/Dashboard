import { createReadStream } from 'node:fs';
import { access } from 'node:fs/promises';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { AccuWeatherProvider } from '../providers/accuweather/accuweather-fetcher.ts';
import { WeatherCache } from './cache.ts';
import { loadConfig } from './config.ts';
import { startDailyScheduler } from './scheduler.ts';
import { WeatherService } from './weather-service.ts';

const projectRoot = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const staticRoot = join(projectRoot, 'dist', 'ui');
const cache = new WeatherCache(join(projectRoot, 'data', 'weather.json'));
const config = loadConfig();

const provider = config.accuweather.apiKey && config.accuweather.locationKey
  ? new AccuWeatherProvider({
      apiKey: config.accuweather.apiKey,
      locationKey: config.accuweather.locationKey,
      locationName: config.accuweather.locationName,
      language: config.accuweather.language,
      forecastDays: config.accuweather.forecastDays,
      requestedDays: config.requestedForecastDays,
    })
  : null;

const weather = new WeatherService(cache, provider);

try {
  await weather.ensureFresh(config.weatherCacheMaxAgeMs);
} catch (error) {
  console.error('[weather] initial refresh failed; existing cache will be used if available', error);
}

const scheduler = startDailyScheduler(config.weatherRefreshHour, () => weather.refresh());

const server = createServer(async (request, response) => {
  try {
    await route(request, response);
  } catch (error) {
    console.error('[server] request failed', error);
    sendJson(response, 500, { error: 'internal_server_error' });
  }
});

server.listen(config.port, () => {
  console.info(`Dashboard listening on http://localhost:${config.port}`);
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    scheduler.stop();
    server.close(() => process.exit(0));
  });
}

async function route(request: IncomingMessage, response: ServerResponse): Promise<void> {
  if (request.method !== 'GET') {
    response.writeHead(405, { Allow: 'GET' });
    response.end();
    return;
  }

  const url = new URL(request.url ?? '/', 'http://localhost');

  if (url.pathname === '/api/weather') {
    const forecast = await weather.getCachedForecast();
    if (!forecast) {
      sendJson(response, 503, {
        error: 'weather_unavailable',
        message: 'Noch keine Wetterdaten im lokalen Cache. AccuWeather konfigurieren und Server neu starten.',
      });
      return;
    }

    sendJson(response, 200, forecast, {
      'Cache-Control': 'no-cache',
    });
    return;
  }

  if (url.pathname === '/health') {
    sendJson(response, 200, { status: 'ok' });
    return;
  }

  await serveStatic(url.pathname, response);
}

async function serveStatic(pathname: string, response: ServerResponse): Promise<void> {
  const requested = pathname === '/' ? '/index.html' : pathname;
  const safeRelativePath = normalize(requested).replace(/^([/\\])+/, '');
  const filePath = resolve(staticRoot, safeRelativePath);

  if (!filePath.startsWith(`${resolve(staticRoot)}${process.platform === 'win32' ? '\\' : '/'}`)) {
    response.writeHead(403);
    response.end();
    return;
  }

  try {
    await access(filePath);
  } catch {
    response.writeHead(404);
    response.end('Not found');
    return;
  }

  response.writeHead(200, {
    'Content-Type': contentType(filePath),
    'Cache-Control': filePath.endsWith('.html') ? 'no-cache' : 'public, max-age=3600',
    'X-Content-Type-Options': 'nosniff',
  });
  createReadStream(filePath).pipe(response);
}

function sendJson(
  response: ServerResponse,
  status: number,
  body: unknown,
  headers: Record<string, string> = {},
): void {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
    ...headers,
  });
  response.end(JSON.stringify(body));
}

function contentType(path: string): string {
  switch (extname(path)) {
    case '.html':
      return 'text/html; charset=utf-8';
    case '.js':
      return 'text/javascript; charset=utf-8';
    case '.css':
      return 'text/css; charset=utf-8';
    default:
      return 'application/octet-stream';
  }
}
