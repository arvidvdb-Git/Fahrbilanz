export interface ServerCountryFuelPrice {
  countryCode: string;
  countryName: string;
  petrolPrice: number;
  dieselPrice: number;
  isDailyLive: boolean;
  lastUpdated?: string;
}

export interface ServerFuelFeed {
  bulletinDate: string;
  dataSource: string;
  countries: ServerCountryFuelPrice[];
  euAverage: {
    petrolPrice: number;
    dieselPrice: number;
  };
  cachedAtIso: string;
}

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

const CACHE_TTL_MS = 2 * 60 * 60 * 1000;
let cachedFeed: ServerFuelFeed | null = null;
let cachedAtMs = 0;

function formatIsoDatePart(raw?: string): string | undefined {
  if (!raw || typeof raw !== 'string') return undefined;
  const match = raw.match(/\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : undefined;
}

export async function getCachedServerFuelFeed(): Promise<ServerFuelFeed | null> {
  const now = Date.now();
  if (cachedFeed && now - cachedAtMs < CACHE_TTL_MS) {
    return cachedFeed;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5500);

  try {
    const [dailyRes, euRes] = await Promise.all([
      fetch('https://www.fuel-prices.eu/live/api.php', {
        signal: controller.signal,
      }).catch(() => null),
      fetch('https://eurooilwatch.com/api/v1/prices', {
        signal: controller.signal,
      }).catch(() => null),
    ]);

    const countryMap = new Map<string, ServerCountryFuelPrice>();
    let fallbackDate = '';
    let euAverageFallback:
      | { petrolPrice?: number; dieselPrice?: number }
      | undefined;

    if (euRes && euRes.ok) {
      const euRaw = (await euRes.json()) as {
        bulletinDate?: string;
        countries?: Array<{
          countryCode?: string;
          countryName?: string;
          petrolPrice?: number;
          dieselPrice?: number;
        }>;
        euAverage?: { petrolPrice?: number; dieselPrice?: number };
      };
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
      const dailyRaw = (await dailyRes.json()) as {
        ok?: boolean;
        data?: {
          countries?: Array<{
            country_code?: string;
            fuels?: {
              sp95?: { avg?: number };
              e5?: { avg?: number };
              e10?: { avg?: number };
              diesel?: { avg?: number };
            };
            last_fetched?: string;
            last_fetched_iso?: string;
          }>;
        };
      };

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
    if (countries.length === 0) return cachedFeed;

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

    cachedFeed = {
      bulletinDate: latestDailyDate || fallbackDate || '',
      dataSource: hasDailyUpdates
        ? 'Fuel-Prices.eu Daily + EC Oil Bulletin'
        : 'EC Weekly Oil Bulletin',
      countries,
      euAverage,
      cachedAtIso: new Date().toISOString(),
    };
    cachedAtMs = now;
    return cachedFeed;
  } catch {
    return cachedFeed;
  } finally {
    clearTimeout(timer);
  }
}
