export interface CountryFuelPrice {
  countryCode: string;
  countryName: string;
  petrolPrice: number;
  dieselPrice: number;
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

export async function fetchLiveFuelFeed(): Promise<LiveFuelFeed | null> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 5000);

  try {
    const [pricesRes, detectedCode] = await Promise.all([
      fetch('https://eurooilwatch.com/api/v1/prices', {
        signal: controller.signal,
      }),
      detectVisitorCountryCode(),
    ]);

    if (!pricesRes.ok) return null;
    const raw = (await pricesRes.json()) as EuroOilWatchResponse;

    const countries: CountryFuelPrice[] = (raw.countries ?? [])
      .filter(
        (c): c is Required<CountryFuelPrice> =>
          typeof c.countryCode === 'string' &&
          typeof c.countryName === 'string' &&
          typeof c.petrolPrice === 'number' &&
          typeof c.dieselPrice === 'number'
      )
      .sort((a, b) => a.countryName.localeCompare(b.countryName));

    if (countries.length === 0) return null;

    const euAverage = {
      petrolPrice:
        typeof raw.euAverage?.petrolPrice === 'number'
          ? raw.euAverage.petrolPrice
          : countries.reduce((s, c) => s + c.petrolPrice, 0) / countries.length,
      dieselPrice:
        typeof raw.euAverage?.dieselPrice === 'number'
          ? raw.euAverage.dieselPrice
          : countries.reduce((s, c) => s + c.dieselPrice, 0) / countries.length,
    };

    const matched = countries.some((c) => c.countryCode === detectedCode);

    return {
      bulletinDate: raw.bulletinDate || '',
      dataSource: raw.dataSource || 'EC Weekly Oil Bulletin',
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
