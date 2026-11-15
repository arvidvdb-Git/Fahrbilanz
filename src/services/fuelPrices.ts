export interface CountryFuelPrice {
  countryCode: string;
  countryName: string;
  petrolPrice: number;
  dieselPrice: number;
  isDailyLive?: boolean;
  lastUpdated?: string;
}

export interface LiveFuelFeed {
  bulletinDate: string;
  dataSource: string;
  countries: CountryFuelPrice[];
  euAverage: {
    petrolPrice: number;
    dieselPrice: number;
  };
  detectedCountryCode: string;
}

const TIMEZONE_TO_COUNTRY: Record<string, string> = {
  'Europe/Berlin': 'DE',
  'Europe/Busingen': 'DE',
  'Europe/Amsterdam': 'NL',
  'Europe/Paris': 'FR',
  'Europe/Brussels': 'BE',
  'Europe/Vienna': 'AT',
  'Europe/Luxembourg': 'LU',
  'Europe/Madrid': 'ES',
  'Europe/Rome': 'IT',
  'Europe/Lisbon': 'PT',
  'Europe/Dublin': 'IE',
  'Europe/Copenhagen': 'DK',
  'Europe/Stockholm': 'SE',
  'Europe/Helsinki': 'FI',
  'Europe/Warsaw': 'PL',
  'Europe/Prague': 'CZ',
  'Europe/Budapest': 'HU',
  'Europe/Athens': 'GR',
  'Europe/Bucharest': 'RO',
  'Europe/Sofia': 'BG',
  'Europe/Zagreb': 'HR',
  'Europe/Ljubljana': 'SI',
  'Europe/Bratislava': 'SK',
  'Europe/Tallinn': 'EE',
  'Europe/Riga': 'LV',
  'Europe/Vilnius': 'LT',
  'Europe/Malta': 'MT',
  'Europe/Nicosia': 'CY',
  'Europe/London': 'GB',
  'Atlantic/Reykjavik': 'IS',
};

const EUROPEAN_COUNTRY_NAMES: Record<string, string> = {
  AT: 'Austria',
  BE: 'Belgium',
  BG: 'Bulgaria',
  CY: 'Cyprus',
  CZ: 'Czechia',
  DE: 'Germany',
  DK: 'Denmark',
  EE: 'Estonia',
  ES: 'Spain',
  FI: 'Finland',
  FR: 'France',
  GB: 'United Kingdom',
  GR: 'Greece',
  HR: 'Croatia',
  HU: 'Hungary',
  IE: 'Ireland',
  IS: 'Iceland',
  IT: 'Italy',
  LT: 'Lithuania',
  LU: 'Luxembourg',
  LV: 'Latvia',
  MT: 'Malta',
  NL: 'Netherlands',
  PL: 'Poland',
  PT: 'Portugal',
  RO: 'Romania',
  SE: 'Sweden',
  SI: 'Slovenia',
  SK: 'Slovakia',
};

function inferCountryFromBrowser(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && TIMEZONE_TO_COUNTRY[tz]) {
      return TIMEZONE_TO_COUNTRY[tz];
    }
    const langParts = (navigator.language || '').split('-');
    if (langParts.length >= 2) {
      return langParts[1].toUpperCase();
    }
  } catch {
    // Ignore restricted environments
  }
  return 'EU';
}

async function detectVisitorCountryCode(): Promise<string> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 3500);

  try {
    const res = await fetch('https://get.geojs.io/v1/ip/country.json', {
      signal: controller.signal,
    });
    if (res.ok) {
      const data = (await res.json()) as { country?: string };
      if (data.country && typeof data.country === 'string') {
        return data.country.toUpperCase();
      }
    }
  } catch {
    // Fall through to secondary endpoint
  } finally {
    window.clearTimeout(timer);
  }

  const controller2 = new AbortController();
  const timer2 = window.setTimeout(() => controller2.abort(), 3000);
  try {
    const res = await fetch('https://api.country.is/', {
      signal: controller2.signal,
    });
    if (res.ok) {
      const data = (await res.json()) as { country?: string };
      if (data.country && typeof data.country === 'string') {
        return data.country.toUpperCase();
      }
    }
  } catch {
    // Fall back to timezone/locale inference
  } finally {
    window.clearTimeout(timer2);
  }

  return inferCountryFromBrowser();
}

interface FuelPricesEuFuelEntry {
  avg?: number;
}

interface FuelPricesEuCountry {
  country_code?: string;
  fuels?: {
    sp95?: FuelPricesEuFuelEntry;
    e5?: FuelPricesEuFuelEntry;
    e10?: FuelPricesEuFuelEntry;
    diesel?: FuelPricesEuFuelEntry;
  };
  last_fetched?: string;
  last_fetched_iso?: string;
}

interface FuelPricesEuResponse {
  ok?: boolean;
  data?: {
    countries?: FuelPricesEuCountry[];
  };
}

interface EuroOilWatchResponse {
  bulletinDate?: string;
  dataSource?: string;
  countries?: Array<{
    countryCode?: string;
    countryName?: string;
    petrolPrice?: number;
    dieselPrice?: number;
  }>;
  euAverage?: {
    petrolPrice?: number;
    dieselPrice?: number;
  };
}

function formatIsoDatePart(raw?: string): string | undefined {
  if (!raw || typeof raw !== 'string') return undefined;
  const match = raw.match(/\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : undefined;
}

export async function fetchLiveFuelFeed(): Promise<LiveFuelFeed | null> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 5500);

  try {
    const [dailyRes, euRes, detectedCode] = await Promise.all([
      fetch('https://www.fuel-prices.eu/live/api.php', {
        signal: controller.signal,
      }).catch(() => null),
      fetch('https://eurooilwatch.com/api/v1/prices', {
        signal: controller.signal,
      }).catch(() => null),
      detectVisitorCountryCode(),
    ]);

    const countryMap = new Map<string, CountryFuelPrice>();
    let fallbackDate = '';
    let euAverageFallback: { petrolPrice?: number; dieselPrice?: number } | undefined;

    if (euRes && euRes.ok) {
      const euRaw = (await euRes.json()) as EuroOilWatchResponse;
      fallbackDate = euRaw.bulletinDate || '';
      euAverageFallback = euRaw.euAverage;

      for (const c of euRaw.countries ?? []) {
        if (
          typeof c.countryCode === 'string' &&
          typeof c.countryName === 'string' &&
          typeof c.petrolPrice === 'number' &&
          typeof c.dieselPrice === 'number'
        ) {
          countryMap.set(c.countryCode.toUpperCase(), {
            countryCode: c.countryCode.toUpperCase(),
            countryName: c.countryName,
            petrolPrice: c.petrolPrice,
            dieselPrice: c.dieselPrice,
            isDailyLive: false,
            lastUpdated: fallbackDate || undefined,
          });
        }
      }
    }

    let latestDailyDate = '';
    let hasDailyUpdates = false;

    if (dailyRes && dailyRes.ok) {
      const dailyRaw = (await dailyRes.json()) as FuelPricesEuResponse;
      if (dailyRaw.ok !== false) {
        for (const c of dailyRaw.data?.countries ?? []) {
          const code = c.country_code?.toUpperCase();
          if (!code || !EUROPEAN_COUNTRY_NAMES[code]) continue;

          const petrol =
            c.fuels?.sp95?.avg ?? c.fuels?.e5?.avg ?? c.fuels?.e10?.avg;
          const diesel = c.fuels?.diesel?.avg;
          if (typeof petrol !== 'number' || typeof diesel !== 'number') continue;

          const datePart =
            formatIsoDatePart(c.last_fetched_iso) ??
            formatIsoDatePart(c.last_fetched);
          if (datePart && datePart > latestDailyDate) {
            latestDailyDate = datePart;
          }
          hasDailyUpdates = true;

          const existing = countryMap.get(code);
          countryMap.set(code, {
            countryCode: code,
            countryName: existing?.countryName ?? EUROPEAN_COUNTRY_NAMES[code],
            petrolPrice: petrol,
            dieselPrice: diesel,
            isDailyLive: true,
            lastUpdated: datePart,
          });
        }
      }
    }

    const countries = Array.from(countryMap.values()).sort((a, b) =>
      a.countryName.localeCompare(b.countryName)
    );
    if (countries.length === 0) return null;

    const euCountries = countries.filter(
      (c) => c.countryCode !== 'GB' && c.countryCode !== 'IS'
    );
    const avgPool = euCountries.length > 0 ? euCountries : countries;

    const euAverage = {
      petrolPrice:
        hasDailyUpdates || typeof euAverageFallback?.petrolPrice !== 'number'
          ? avgPool.reduce((s, c) => s + c.petrolPrice, 0) / avgPool.length
          : euAverageFallback.petrolPrice,
      dieselPrice:
        hasDailyUpdates || typeof euAverageFallback?.dieselPrice !== 'number'
          ? avgPool.reduce((s, c) => s + c.dieselPrice, 0) / avgPool.length
          : euAverageFallback.dieselPrice,
    };

    const matched = countries.some((c) => c.countryCode === detectedCode);

    return {
      bulletinDate: latestDailyDate || fallbackDate || '',
      dataSource: hasDailyUpdates
        ? 'Fuel-Prices.eu Daily + EC Oil Bulletin'
        : 'EC Weekly Oil Bulletin',
      countries,
      euAverage,
      detectedCountryCode: matched ? detectedCode : 'EU',
    };
  } catch {
    return null;
  } finally {
    window.clearTimeout(timer);
  }
}
