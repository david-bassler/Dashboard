type WeatherCondition = 'sun' | 'rain' | 'mixed' | 'other';

interface WeatherDay {
  date: string;
  temperatureMin: number;
  temperatureMax: number;
  condition: WeatherCondition;
}

interface WeatherForecast {
  source: 'accuweather';
  location: string;
  fetchedAt: string;
  requestedDays: number;
  availableDays: number;
  sourceUrl: string | null;
  days: WeatherDay[];
}

class WeatherForecastElement extends HTMLElement {
  readonly #root: ShadowRoot;

  constructor() {
    super();
    this.#root = this.attachShadow({ mode: 'open' });
  }

  connectedCallback(): void {
    this.renderLoading();
    void this.load();
  }

  async load(): Promise<void> {
    try {
      const response = await fetch('/api/weather', { cache: 'no-store' });
      if (!response.ok) {
        const error = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(error?.message ?? `Wetterdaten konnten nicht geladen werden (${response.status}).`);
      }

      const forecast = (await response.json()) as WeatherForecast;
      this.renderForecast(forecast);
    } catch (error) {
      this.renderError(error instanceof Error ? error.message : 'Wetterdaten konnten nicht geladen werden.');
    }
  }

  renderLoading(): void {
    this.#root.innerHTML = `
      <link rel="stylesheet" href="/weather-forecast/weather-forecast.css">
      <article class="widget" aria-busy="true">
        <p class="state">Wetterdaten werden geladen …</p>
      </article>
    `;
  }

  renderError(message: string): void {
    this.#root.innerHTML = `
      <link rel="stylesheet" href="/weather-forecast/weather-forecast.css">
      <article class="widget widget--error">
        <header class="widget-header">
          <div>
            <p class="eyebrow">Wetter</p>
            <h2>Vorhersage</h2>
          </div>
        </header>
        <p class="state">${escapeHtml(message)}</p>
      </article>
    `;
  }

  renderForecast(forecast: WeatherForecast): void {
    const days = forecast.days.map((day) => this.renderDay(day)).join('');
    const limitation = forecast.availableDays < forecast.requestedDays
      ? `<p class="limitation">${forecast.availableDays} von ${forecast.requestedDays} gewünschten Tagen sind über den konfigurierten AccuWeather-Endpunkt verfügbar.</p>`
      : '';
    const source = forecast.sourceUrl
      ? `<a href="${escapeAttribute(forecast.sourceUrl)}" target="_blank" rel="noreferrer">AccuWeather</a>`
      : 'AccuWeather';

    this.#root.innerHTML = `
      <link rel="stylesheet" href="/weather-forecast/weather-forecast.css">
      <article class="widget">
        <header class="widget-header">
          <div>
            <p class="eyebrow">Wetter · ${escapeHtml(forecast.location)}</p>
            <h2>Die nächsten vier Wochen</h2>
          </div>
          <p class="updated">Stand ${formatTimestamp(forecast.fetchedAt)}</p>
        </header>

        ${limitation}

        <div class="forecast-grid">
          ${days}
        </div>

        <footer class="source">Daten: ${source}</footer>
      </article>
    `;
  }

  renderDay(day: WeatherDay): string {
    const condition = conditionPresentation(day.condition);
    return `
      <section class="day" aria-label="${escapeAttribute(formatLongDate(day.date))}: ${condition.label}">
        <time datetime="${escapeAttribute(day.date)}">${escapeHtml(formatDate(day.date))}</time>
        <span class="condition" title="${condition.label}" aria-hidden="true">${condition.symbol}</span>
        <div class="temperatures">
          <strong>${formatTemperature(day.temperatureMax)}</strong>
          <span>${formatTemperature(day.temperatureMin)}</span>
        </div>
      </section>
    `;
  }
}

function conditionPresentation(condition: WeatherCondition): { label: string; symbol: string } {
  switch (condition) {
    case 'sun':
      return { label: 'Sonnig', symbol: '☀' };
    case 'rain':
      return { label: 'Regen', symbol: '☂' };
    case 'mixed':
      return { label: 'Wechselhaft', symbol: '◐' };
    default:
      return { label: 'Bewölkt', symbol: '☁' };
  }
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('de-DE', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(`${value}T12:00:00`));
}

function formatLongDate(value: string): string {
  return new Intl.DateTimeFormat('de-DE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(`${value}T12:00:00`));
}

function formatTimestamp(value: string): string {
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatTemperature(value: number): string {
  return `${Math.round(value)}°`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function escapeAttribute(value: string): string {
  return escapeHtml(value);
}

customElements.define('weather-forecast', WeatherForecastElement);
