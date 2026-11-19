import type {
  BodyClassId,
  ComparisonMode,
  PowertrainId,
} from './cars.ts';

export type SupportedLang = 'en' | 'de' | 'nl' | 'fr';

export const SUPPORTED_LANGS: SupportedLang[] = ['en', 'de', 'nl', 'fr'];

export type SeoPresetId =
  | 'home'
  | 'ev-vs-petrol-germany'
  | 'hybrid-vs-electric-suv-cost'
  | 'ev-charging-cost-netherlands'
  | 'electric-vs-petrol-france'
  | 'diesel-vs-hybrid-vs-ev-europe';

export interface SeoPresetSlotSpec {
  powertrain: PowertrainId;
  bodyClass: BodyClassId;
}

export interface SeoPresetSpec {
  id: SeoPresetId;
  countryCode: string;
  comparisonMode: ComparisonMode;
  compareCount: 2 | 3;
  annualKm: number;
  years: 1 | 3 | 5 | 8;
  homeAcShare?: number;
  publicAcShare?: number;
  publicDcShare?: number;
  slots: SeoPresetSlotSpec[];
  paths: Record<SupportedLang, string>;
  aliases?: string[];
  meta: Record<
    SupportedLang,
    {
      title: string;
      description: string;
      badge: string;
      heading: string;
      summary: string;
    }
  >;
}

export const SEO_PRESETS: Record<SeoPresetId, SeoPresetSpec> = {
  home: {
    id: 'home',
    countryCode: 'EU',
    comparisonMode: 'energy',
    compareCount: 3,
    annualKm: 15000,
    years: 1,
    slots: [
      { powertrain: 'gasoline', bodyClass: 'sedan' },
      { powertrain: 'hybrid', bodyClass: 'sedan' },
      { powertrain: 'electric', bodyClass: 'sedan' },
    ],
    paths: {
      en: '/en/',
      de: '/de/',
      nl: '/nl/',
      fr: '/fr/',
    },
    meta: {
      en: {
        title: 'Fahrbilanz – EV, Hybrid, Diesel & Gasoline Cost Comparator',
        description:
          'Compare energy spend and total cost of ownership for gasoline, diesel, hybrid, and electric cars using EU fuel prices, charging mixes, and break-even charts.',
        badge: 'EU Energy & TCO Comparator',
        heading: 'Compare 2 or 3 Powertrains Side by Side',
        summary:
          'European Weekly Oil Bulletin rates paired with real AC/DC charging mixes.',
      },
      de: {
        title: 'Fahrbilanz – E-Auto, Hybrid, Diesel & Benziner Kostenvergleich',
        description:
          'Vergleichen Sie Energiekosten und Gesamtkosten (TCO) für Benzin, Diesel, Hybrid und Elektroautos mit EU-Kraftstoffpreisen, Lademix und Break-even-Analyse.',
        badge: 'EU Energie- & TCO-Vergleich',
        heading: '2 oder 3 Antriebsarten direkt vergleichen',
        summary:
          'Aktuelle europäische Kraftstoffpreise kombiniert mit realistischem AC/DC-Lademix.',
      },
      nl: {
        title: 'Fahrbilanz – Elektrisch, Hybride, Diesel & Benzine Vergelijker',
        description:
          'Vergelijk energiekosten en totale eigendomskosten (TCO) van benzine, diesel, hybride en elektrische auto’s met EU-brandstofprijzen en laadmix.',
        badge: 'EU Energie- & TCO-vergelijker',
        heading: 'Vergelijk 2 of 3 aandrijflijnen naast elkaar',
        summary:
          'Actuele Europese brandstofprijzen gecombineerd met realistische AC/DC-laadmix.',
      },
      fr: {
        title: 'Fahrbilanz – Comparateur Coût Électrique, Hybride & Essence',
        description:
          'Comparez dépenses énergétiques et coût total de possession (TCO) essence, diesel, hybride et électrique avec les prix UE et courbes de rentabilité.',
        badge: 'Comparateur Énergie & TCO UE',
        heading: 'Comparez 2 ou 3 motorisations côte à côte',
        summary:
          'Tarifs européens des carburants combinés au mix de recharge AC/DC.',
      },
    },
  },
  'ev-vs-petrol-germany': {
    id: 'ev-vs-petrol-germany',
    countryCode: 'DE',
    comparisonMode: 'tco',
    compareCount: 2,
    annualKm: 15000,
    years: 1,
    slots: [
      { powertrain: 'gasoline', bodyClass: 'sedan' },
      { powertrain: 'electric', bodyClass: 'sedan' },
    ],
    paths: {
      en: '/en/ev-vs-petrol-germany',
      de: '/de/elektroauto-vs-benziner-deutschland',
      nl: '/nl/elektrische-auto-vs-benzine-duitsland',
      fr: '/fr/voiture-electrique-vs-essence-allemagne',
    },
    aliases: ['/ev-vs-petrol-germany'],
    meta: {
      en: {
        title: 'EV vs Petrol Cost Calculator Germany | Fahrbilanz',
        description:
          'Compare real EV charging expenses and total ownership costs against petrol in Germany using live DE pump prices and split Home AC / Public DC rates.',
        badge: 'Germany · EV vs Petrol',
        heading: 'Electric vs. Petrol Running Costs in Germany',
        summary:
          'Pre-loaded with live German retail petrol prices, Home AC wallbox tariffs, and 1-year TCO depreciation.',
      },
      de: {
        title: 'Elektroauto vs Benziner Kostenvergleich Deutschland | Fahrbilanz',
        description:
          'Berechnen Sie Strom- und Gesamtkosten (TCO) von Elektroauto gegen Benziner in Deutschland mit aktuellen DE-Spritpreisen und eigenem Lademix.',
        badge: 'Deutschland · E-Auto vs. Benziner',
        heading: 'Elektroauto vs. Benziner Kostenvergleich Deutschland',
        summary:
          'Vorkonfiguriert mit aktuellen deutschen Benzinpreisen, Wallbox-Stromtarif und realem Wertverlust.',
      },
      nl: {
        title: 'Elektrische auto vs benzine kosten Duitsland | Fahrbilanz',
        description:
          'Vergelijk stroom- en totaalkosten van elektrisch rijden tegen benzine met Duitse brandstofprijzen, thuisladen en snelladen langs de snelweg.',
        badge: 'Duitsland · Elektrisch vs. Benzine',
        heading: 'Elektrisch vs. Benzine kosten voor Duitsland',
        summary:
          'Vooraf ingesteld met actuele Duitse benzineprijzen en representatieve laadmix.',
      },
      fr: {
        title: 'Voiture électrique vs essence en Allemagne | Fahrbilanz',
        description:
          'Comparez le coût réel d’une voiture électrique face à l’essence en Allemagne avec les prix du SP95 allemands et les tarifs de recharge AC/DC.',
        badge: 'Allemagne · Électrique vs. Essence',
        heading: 'Voiture électrique vs essence avec tarifs Allemagne',
        summary:
          'Préchargé avec les prix allemands du carburant et une comparaison TCO complète.',
      },
    },
  },
  'hybrid-vs-electric-suv-cost': {
    id: 'hybrid-vs-electric-suv-cost',
    countryCode: 'EU',
    comparisonMode: 'tco',
    compareCount: 2,
    annualKm: 15000,
    years: 3,
    slots: [
      { powertrain: 'hybrid', bodyClass: 'suv' },
      { powertrain: 'electric', bodyClass: 'suv' },
    ],
    paths: {
      en: '/en/hybrid-vs-electric-suv-cost',
      de: '/de/hybrid-vs-elektroauto-suv-kosten',
      nl: '/nl/hybride-vs-elektrisch-suv-kosten',
      fr: '/fr/hybride-vs-electrique-suv-cout',
    },
    aliases: ['/hybrid-vs-electric-suv-cost'],
    meta: {
      en: {
        title: 'Plug-in Hybrid vs Electric SUV Cost Calculator | Fahrbilanz',
        description:
          'Compare plug-in hybrid SUV fuel plus wallbox charging costs against a full electric SUV over 3 years with realistic electric trip share.',
        badge: 'SUV · Plug-in Hybrid vs EV',
        heading: 'Plug-in Hybrid vs. Full Electric SUV Total Cost',
        summary:
          'Models real-world PHEV utility factor, 12% charging loss, and 3-year SUV depreciation.',
      },
      de: {
        title: 'Plug-in Hybrid vs Elektroauto SUV Kostenvergleich | Fahrbilanz',
        description:
          'Vergleichen Sie Plug-in-Hybrid-SUV und reines Elektro-SUV über 3 Jahre – inklusive realem Elektroanteil, 12 % Ladeverlusten und Wertverlust.',
        badge: 'SUV · Plug-in-Hybrid vs. E-Auto',
        heading: 'Plug-in-Hybrid vs. Elektro-SUV Gesamtkosten',
        summary:
          'Berücksichtigt realen PHEV-Elektroanteil, Ladeverluste und 3-Jahres-Restwerte.',
      },
      nl: {
        title: 'Plug-in Hybride vs Elektrische SUV Kosten | Fahrbilanz',
        description:
          'Vergelijk een plug-in hybride SUV met een volledig elektrische SUV over 3 jaar inclusief realistisch elektrisch rij-aandeel en afschrijving.',
        badge: 'SUV · Plug-in Hybride vs. EV',
        heading: 'Plug-in Hybride vs. Elektrische SUV kosten',
        summary:
          'Inclusief werkelijk elektrisch aandeel van de PHEV en 3-jaars TCO-berekening.',
      },
      fr: {
        title: 'SUV Hybride Rechargeable vs Électrique : Coût Réel | Fahrbilanz',
        description:
          'Comparez un SUV hybride rechargeable (PHEV) et un SUV 100 % électrique sur 3 ans avec part électrique réelle et pertes de charge.',
        badge: 'SUV · Hybride PHEV vs. Électrique',
        heading: 'Coût d’un SUV Hybride Rechargeable vs Électrique',
        summary:
          'Intègre le facteur d’utilisation réel PHEV et la dépréciation SUV sur 3 ans.',
      },
    },
  },
  'ev-charging-cost-netherlands': {
    id: 'ev-charging-cost-netherlands',
    countryCode: 'NL',
    comparisonMode: 'energy',
    compareCount: 2,
    annualKm: 15000,
    years: 1,
    homeAcShare: 70,
    publicAcShare: 20,
    publicDcShare: 10,
    slots: [
      { powertrain: 'gasoline', bodyClass: 'compact' },
      { powertrain: 'electric', bodyClass: 'compact' },
    ],
    paths: {
      en: '/en/ev-charging-cost-netherlands',
      de: '/de/e-auto-ladekosten-niederlande',
      nl: '/nl/elektrische-auto-laadkosten-nederland',
      fr: '/fr/cout-recharge-voiture-electrique-pays-bas',
    },
    aliases: ['/ev-charging-cost-netherlands'],
    meta: {
      en: {
        title: 'EV Charging vs Petrol Cost Netherlands | Fahrbilanz',
        description:
          'Calculate EV charging costs per 100 km in the Netherlands across Home AC, Public AC, and DC fast chargers compared to live Dutch petrol prices.',
        badge: 'Netherlands · Charging Mix',
        heading: 'EV Charging vs. Petrol Costs in the Netherlands',
        summary:
          'Calibrated with Dutch pump prices and weighted Home AC, Public AC, and fast DC rates.',
      },
      de: {
        title: 'E-Auto Ladekosten vs Benzin Niederlande | Fahrbilanz',
        description:
          'Vergleichen Sie niederländische Ladetarife (Wallbox, öffentliche AC-Säule, DC-Schnelllader) mit den aktuellen Benzinpreisen in den Niederlanden.',
        badge: 'Niederlande · Ladekosten',
        heading: 'E-Auto Ladekosten vs. Benzin in den Niederlanden',
        summary:
          'Vorkonfiguriert mit niederländischen Kraftstoffpreisen und gemischtem AC/DC-Profil.',
      },
      nl: {
        title: 'Laadkosten elektrische auto vs benzine Nederland | Fahrbilanz',
        description:
          'Bereken je echte laadkosten per 100 km in Nederland (thuisladen, publiek AC en snelladen) versus actuele Nederlandse benzineprijzen.',
        badge: 'Nederland · Laadkosten & Benzine',
        heading: 'Laadkosten thuis & publiek vs. benzine in Nederland',
        summary:
          'Direct geladen met Nederlandse brandstofprijzen en gewogen 70/20/10 laadmix.',
      },
      fr: {
        title: 'Coût recharge voiture électrique vs essence Pays-Bas | Fahrbilanz',
        description:
          'Comparez le coût de recharge domicile, borne publique AC et charge rapide DC face aux prix de l’essence aux Pays-Bas.',
        badge: 'Pays-Bas · Mix de Recharge',
        heading: 'Coût de recharge électrique vs essence aux Pays-Bas',
        summary:
          'Préconfiguré avec les prix néerlandais à la pompe et mix AC/DC pondéré.',
      },
    },
  },
  'electric-vs-petrol-france': {
    id: 'electric-vs-petrol-france',
    countryCode: 'FR',
    comparisonMode: 'tco',
    compareCount: 2,
    annualKm: 15000,
    years: 3,
    slots: [
      { powertrain: 'gasoline', bodyClass: 'compact' },
      { powertrain: 'electric', bodyClass: 'compact' },
    ],
    paths: {
      en: '/en/electric-vs-petrol-france',
      de: '/de/elektroauto-vs-benziner-frankreich',
      nl: '/nl/elektrische-auto-vs-benzine-frankrijk',
      fr: '/fr/voiture-electrique-vs-essence-france',
    },
    aliases: ['/electric-vs-petrol-france'],
    meta: {
      en: {
        title: 'Electric vs Petrol Cost Calculator France | Fahrbilanz',
        description:
          'Compare electric compact running costs and 3-year ownership against petrol in France with live French fuel benchmarks and charging mix controls.',
        badge: 'France · EV vs Petrol',
        heading: 'Electric vs. Petrol Running Costs in France',
        summary:
          'Loads live French petrol benchmarks alongside 3-year compact ownership costs.',
      },
      de: {
        title: 'Elektroauto vs Benziner Kosten Frankreich | Fahrbilanz',
        description:
          'Vergleichen Sie Elektro- und Benziner-Kompaktwagen mit französischen Kraftstoffpreisen und 3-Jahres-Gesamtkostenrechnung.',
        badge: 'Frankreich · E-Auto vs. Benziner',
        heading: 'Elektroauto vs. Benziner in Frankreich vergleichen',
        summary:
          'Mit französischen Tankstellenpreisen und 3-Jahres-TCO-Voreinstellung.',
      },
      nl: {
        title: 'Elektrische auto vs benzine kosten Frankrijk | Fahrbilanz',
        description:
          'Vergelijk elektrisch rijden en benzine in Frankrijk op basis van Franse brandstofprijzen, laadverliezen en 3-jaars TCO.',
        badge: 'Frankrijk · Elektrisch vs. Benzine',
        heading: 'Elektrisch vs. Benzine in Frankrijk vergelijken',
        summary:
          'Voorzien van Franse brandstofprijzen en 3-jaars kostenvergelijking.',
      },
      fr: {
        title: 'Comparateur voiture électrique vs essence France | Fahrbilanz',
        description:
          'Calculez le coût réel entre voiture électrique et essence en France : prix SP95 français, mix domicile/rapide et TCO sur 3 ans.',
        badge: 'France · Électrique vs. Essence',
        heading: 'Comparateur coût réel électrique vs essence en France',
        summary:
          'Préchargé avec les tarifs français du carburant et la dépréciation sur 3 ans.',
      },
    },
  },
  'diesel-vs-hybrid-vs-ev-europe': {
    id: 'diesel-vs-hybrid-vs-ev-europe',
    countryCode: 'EU',
    comparisonMode: 'tco',
    compareCount: 3,
    annualKm: 20000,
    years: 5,
    slots: [
      { powertrain: 'diesel', bodyClass: 'sedan' },
      { powertrain: 'hybrid', bodyClass: 'sedan' },
      { powertrain: 'electric', bodyClass: 'sedan' },
    ],
    paths: {
      en: '/en/diesel-vs-hybrid-vs-ev-europe',
      de: '/de/diesel-vs-hybrid-vs-elektro-europa',
      nl: '/nl/diesel-vs-hybride-vs-elektrisch-europa',
      fr: '/fr/diesel-vs-hybride-vs-electrique-europe',
    },
    aliases: ['/diesel-vs-hybrid-vs-ev-europe'],
    meta: {
      en: {
        title: 'Diesel vs Hybrid vs Electric 5-Year TCO Europe | Fahrbilanz',
        description:
          'High-mileage 20,000 km/yr comparison of Diesel, Plug-in Hybrid, and Full Electric sedans over 5 years using European Commission fuel benchmarks.',
        badge: 'Europe · 20,000 km/yr TCO',
        heading: 'Diesel vs. Hybrid vs. Full Electric over 5 Years',
        summary:
          'Built for high-mileage European drivers comparing 20,000 km/year depreciation, tax, and fuel.',
      },
      de: {
        title: 'Diesel vs Hybrid vs Elektroauto 5-Jahres-TCO | Fahrbilanz',
        description:
          'Vielfahrer-Vergleich mit 20.000 km/Jahr über 5 Jahre: Diesel, Plug-in-Hybrid und Elektro-Limousine mit aktuellen EU-Kraftstoffpreisen.',
        badge: 'Europa · 20.000 km/Jahr',
        heading: 'Diesel vs. Hybrid vs. Elektro über 5 Jahre',
        summary:
          'Vorkonfiguriert für Vielfahrer mit 20.000 km Jahresfahrleistung und komplettem TCO.',
      },
      nl: {
        title: 'Diesel vs Hybride vs Elektrisch 5-jaars TCO | Fahrbilanz',
        description:
          'Vergelijk diesel, plug-in hybride en volledig elektrisch over 5 jaar bij 20.000 km per jaar met Europese brandstof- en stroomprijzen.',
        badge: 'Europa · 20.000 km/jaar',
        heading: 'Diesel vs. Hybride vs. Elektrisch over 5 jaar',
        summary:
          'Ingesteld voor 20.000 km per jaar inclusief motorrijtuigenbelasting en afschrijving.',
      },
      fr: {
        title: 'Diesel vs Hybride vs Électrique TCO 5 ans Europe | Fahrbilanz',
        description:
          'Comparatif gros rouleurs (20 000 km/an sur 5 ans) entre Diesel, Hybride rechargeable et Électrique selon les moyennes européennes.',
        badge: 'Europe · 20 000 km/an',
        heading: 'Diesel vs. Hybride vs. Électrique sur 5 ans',
        summary:
          'Calibré pour 20 000 km/an avec fiscalité, entretien et valeur résiduelle sur 5 ans.',
      },
    },
  },
};

export const PROGRAMMATIC_PRESET_ORDER: SeoPresetId[] = [
  'ev-vs-petrol-germany',
  'hybrid-vs-electric-suv-cost',
  'ev-charging-cost-netherlands',
  'electric-vs-petrol-france',
  'diesel-vs-hybrid-vs-ev-europe',
];

export interface ResolvedSeoRoute {
  lang: SupportedLang;
  presetId: SeoPresetId;
  canonicalPath: string;
  isExplicitLangRoute: boolean;
}

const ROUTE_LOOKUP = new Map<
  string,
  { lang: SupportedLang; presetId: SeoPresetId; isExplicitLangRoute: boolean }
>();

function normalizePathname(rawPath: string): string {
  const withoutQuery = rawPath.split('?')[0].split('#')[0] || '/';
  const cleaned = withoutQuery.replace(/\/+$/, '');
  return cleaned === '' ? '/' : cleaned.toLowerCase();
}

for (const preset of Object.values(SEO_PRESETS)) {
  for (const lang of SUPPORTED_LANGS) {
    const norm = normalizePathname(preset.paths[lang]);
    ROUTE_LOOKUP.set(norm, {
      lang,
      presetId: preset.id,
      isExplicitLangRoute: true,
    });
  }
  for (const alias of preset.aliases ?? []) {
    const norm = normalizePathname(alias);
    if (!ROUTE_LOOKUP.has(norm)) {
      ROUTE_LOOKUP.set(norm, {
        lang: 'en',
        presetId: preset.id,
        isExplicitLangRoute: false,
      });
    }
  }
}

export function resolveSeoRoute(pathname: string): ResolvedSeoRoute {
  const norm = normalizePathname(pathname);
  const hit = ROUTE_LOOKUP.get(norm);
  if (hit) {
    return {
      lang: hit.lang,
      presetId: hit.presetId,
      canonicalPath: SEO_PRESETS[hit.presetId].paths[hit.lang],
      isExplicitLangRoute: hit.isExplicitLangRoute,
    };
  }
  if (norm === '/') {
    return {
      lang: 'en',
      presetId: 'home',
      canonicalPath: SEO_PRESETS.home.paths.en,
      isExplicitLangRoute: false,
    };
  }
  const seg = norm.split('/')[1];
  if (
    seg === 'en' ||
    seg === 'de' ||
    seg === 'nl' ||
    seg === 'fr'
  ) {
    return {
      lang: seg,
      presetId: 'home',
      canonicalPath: SEO_PRESETS.home.paths[seg],
      isExplicitLangRoute: true,
    };
  }
  return {
    lang: 'en',
    presetId: 'home',
    canonicalPath: '/',
    isExplicitLangRoute: false,
  };
}

export function buildHreflangLinks(
  origin: string,
  presetId: SeoPresetId
): Array<{ hreflang: string; href: string }> {
  const cleanOrigin = origin.replace(/\/+$/, '');
  const preset = SEO_PRESETS[presetId];
  const links: Array<{ hreflang: string; href: string }> = SUPPORTED_LANGS.map(
    (lang) => ({
      hreflang: lang,
      href: `${cleanOrigin}${preset.paths[lang]}`,
    })
  );
  links.push({
    hreflang: 'x-default',
    href: `${cleanOrigin}${preset.paths.en}`,
  });
  return links;
}
