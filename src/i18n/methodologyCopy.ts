import type { Language } from './translations';

export interface MethodologyCardCopy {
  tag: string;
  title: string;
  body: string;
  formula?: string;
}

export interface MethodologyCopy {
  kicker: string;
  title: string;
  sub: string;
  cards: MethodologyCardCopy[];
  guidesKicker: string;
  guidesTitle: string;
  guidesSub: string;
  openGuideLabel: string;
  activeGuideLabel: string;
}

export const METHODOLOGY_COPY: Record<Language, MethodologyCopy> = {
  en: {
    kicker: 'Methodology & Formula Transparency',
    title: 'How Fahrbilanz calculates every euro per kilometer.',
    sub: 'Every number in the comparison table, cumulative spend curve, and winning zone chart uses transparent, reproducible physics and European retail data.',
    cards: [
      {
        tag: '01 · Plug-in Hybrid Model',
        title: 'Real-world electric share (s) & 12% charge loss',
        body: 'Official WLTP brochure consumption understates real fuel burn on longer trips. Fahrbilanz derives the brochure utility factor from weighted vs. discharged consumption, scales it by your trip profile (100% UF for mainly short trips, 70% UF for mainly long trips), and divides net battery energy by 0.88 efficiency to measure wall-socket electricity.',
        formula:
          'UF = 1 − F_w / F_cs · e_wall = (100 × B / R) / 0.88 · Fuel = (1 − s) × F_cs',
      },
      {
        tag: '02 · Charging Mix & Wallbox',
        title: 'Split AC/DC tariffs & powertrain-specific hardware',
        body: 'Full electric vehicles divide driving consumption (kWh/100 km) by 0.88 to account for AC/DC conversion losses, then price each kWh by your weighted Home AC, Public AC, and Public DC mix. Monthly wallbox rental and one-time wallbox purchase costs apply selectively only to Electric and/or Plug-in Hybrid vehicles.',
        formula:
          'Blended €/kWh = (%Home·P_home + %PubAC·P_ac + %DC·P_dc) / 100',
      },
      {
        tag: '03 · Ownership & Resale Curves',
        title: 'Horizon-linked depreciation & yearly running costs',
        body: 'In Total Cost of Ownership (TCO) mode, depreciation equals net purchase price (after optional EV/hybrid subsidy) minus retained value at your selected 1-, 3-, 5-, or 8-year horizon. Annual servicing, road tax, and insurance accumulate linearly each year alongside energy and charging fees.',
        formula:
          'TCO = max(0, Price − Subsidy − Resale_H) + Wallbox + Energy + H·(Service + Tax + Ins)',
      },
      {
        tag: '04 · EU Fuel Benchmarks & B2B API',
        title: 'Live European pump feeds & dealer integration',
        body: 'Petrol (Euro-Super 95) and diesel baselines refresh from Fuel-Prices.eu daily averages and the European Commission Weekly Oil Bulletin. Automotive dealers and fleet portals can license the same calculation engine server-side via authenticated REST endpoints (/api/v1/calculate).',
        formula: 'GET /api/v1/fuel-prices · POST /api/v1/calculate',
      },
    ],
    guidesKicker: 'Pre-Configured Country & Segment Guides',
    guidesTitle: 'Popular European Comparison Presets',
    guidesSub:
      'Open a localized comparison pre-loaded with national fuel benchmarks, mileage assumptions, and powertrain pairings.',
    openGuideLabel: 'Load comparison',
    activeGuideLabel: 'Currently loaded',
  },
  de: {
    kicker: 'Methodik & Formeltransparenz',
    title: 'Wie Fahrbilanz jeden Cent pro Kilometer berechnet.',
    sub: 'Alle Werte in der Vergleichstabelle, der kumulierten Kostenkurve und den Gewinnzonen basieren auf nachvollziehbaren physikalischen Formeln und europäischen Marktdaten.',
    cards: [
      {
        tag: '01 · Plug-in-Hybrid-Modell',
        title: 'Realer Elektroanteil (s) & 12 % Ladeverlust',
        body: 'Gewichtete WLTP-Prospektwerte unterschätzen oft den realen Kraftstoffverbrauch auf Langstrecken. Fahrbilanz bestimmt den Nutzanteil (UF) aus gewichtetem und entladenem Verbrauch, passt ihn an das Streckenprofil an (100 % UF bei Kurzstrecken, 70 % UF bei Langstrecken) und teilt die Netto-Batterieenergie durch den Wirkungsgrad 0,88.',
        formula:
          'UF = 1 − F_w / F_cs · e_wall = (100 × B / R) / 0,88 · Sprit = (1 − s) × F_cs',
      },
      {
        tag: '02 · Lademix & Wallbox',
        title: 'Gewichtete AC/DC-Tarife & Wallbox-Zuordnung',
        body: 'Reine Elektroautos teilen den Fahrverbrauch (kWh/100 km) durch 0,88 für Ladeverluste und bewerten jede kWh nach Ihrem Mix aus Wallbox (Home AC), öffentlicher AC-Säule und DC-Schnelllader. Wallbox-Miete und Wallbox-Kauf lassen sich gezielt für E-Auto und/oder Plug-in-Hybrid aktivieren.',
        formula:
          'Ø €/kWh = (%Home·P_home + %PubAC·P_ac + %DC·P_dc) / 100',
      },
      {
        tag: '03 · TCO & Restwertkurven',
        title: 'Dynamischer Wertverlust je Haltedauer (1–8 Jahre)',
        body: 'Im Gesamtkosten-Modus (TCO) ergibt sich der Wertverlust aus Nettokaufpreis (abzüglich optionaler Förderung) minus Restwert zum gewählten 1-, 3-, 5- oder 8-Jahres-Horizont. Wartung, Kfz-Steuer und Versicherung laufen jährlich zusammen mit den Energiekosten auf.',
        formula:
          'TCO = max(0, Preis − Prämie − Restwert_H) + Wallbox + Energie + H·(Service + Steuer + Vers.)',
      },
      {
        tag: '04 · EU-Kraftstoffdaten & Händler-API',
        title: 'Tägliche/wöchentliche EU-Daten & B2B-Schnittstelle',
        body: 'Benzin- (Super E5/95) und Dieselpreise stammen aus täglichen Durchschnittswerten von Fuel-Prices.eu sowie dem Weekly Oil Bulletin der EU-Kommission. Autohäuser können die Rechenlogik serverseitig über authentifizierte REST-Endpunkte (/api/v1/calculate) einbinden.',
        formula: 'GET /api/v1/fuel-prices · POST /api/v1/calculate',
      },
    ],
    guidesKicker: 'Vorkonfigurierte Länder- & Segment-Vergleiche',
    guidesTitle: 'Beliebte europäische Vergleichs-Szenarien',
    guidesSub:
      'Öffnen Sie direkt einen vorkonfigurierten Vergleich mit nationalen Kraftstoffpreisen und typischer Antriebskombination.',
    openGuideLabel: 'Vergleich laden',
    activeGuideLabel: 'Aktuell geladen',
  },
  nl: {
    kicker: 'Methodologie & Formuletransparantie',
    title: 'Hoe Fahrbilanz elke cent per kilometer berekent.',
    sub: 'Alle bedragen in de vergelijkingstabel, cumulatieve grafiek en omslagpunten gebruiken transparante formules en actuele Europese brandstofdata.',
    cards: [
      {
        tag: '01 · Plug-in Hybride Model',
        title: 'Werkelijk elektrisch aandeel (s) & 12% laadverlies',
        body: 'WLTP-folderwaarden onderschatten vaak het brandstofverbruik op langere ritten. Fahrbilanz berekent de utility factor uit gewogen versus lege-accu verbruik, schaalt die op je ritprofiel (100% UF voor korte ritten, 70% UF voor lange ritten) en rekent met 88% laadefficiëntie aan het stopcontact.',
        formula:
          'UF = 1 − F_w / F_cs · e_wall = (100 × B / R) / 0,88 · Brandstof = (1 − s) × F_cs',
      },
      {
        tag: '02 · Laadmix & Wallbox',
        title: 'Gewogen AC/DC-tarieven & wallbox-keuzes',
        body: 'Volledig elektrische auto’s delen het rijverbruik (kWh/100 km) door 0,88 voor laadverlies en vermenigvuldigen dit met de gewogen prijs van thuis AC, publiek AC en DC-snelladen. Huur of aankoop van een wallbox pas je selectief toe op elektrisch en/of plug-in hybride.',
        formula:
          'Gem. €/kWh = (%Thuis·P_thuis + %PubAC·P_ac + %DC·P_dc) / 100',
      },
      {
        tag: '03 · TCO & Restwaardecurve',
        title: 'Horizon-afhankelijke afschrijving & jaarlijkse lasten',
        body: 'In TCO-modus is de afschrijving gelijk aan de netto aanschafprijs (minus eventuele subsidie) min de verwachte restwaarde na 1, 3, 5 of 8 jaar. Onderhoud, wegenbelasting en verzekering tellen per jaar mee naast energie- en laadkosten.',
        formula:
          'TCO = max(0, Prijs − Subsidie − Restwaarde_H) + Wallbox + Energie + H·(Onderh. + Bel. + Verz.)',
      },
      {
        tag: '04 · EU-brandstofprijzen & B2B API',
        title: 'Actuele Europese pompdata & dealer-API',
        body: 'Benzine- (Euro95) en dieselprijzen worden ververst via Fuel-Prices.eu daggemiddelden en het Weekly Oil Bulletin van de Europese Commissie. Dealers en leaseportalen kunnen de rekenkern server-side koppelen via beveiligde API-endpoints (/api/v1/calculate).',
        formula: 'GET /api/v1/fuel-prices · POST /api/v1/calculate',
      },
    ],
    guidesKicker: 'Vooraf ingestelde landen- en segmentgidsen',
    guidesTitle: 'Populaire Europese vergelijkingen',
    guidesSub:
      'Open direct een gelokaliseerde vergelijking met nationale brandstofprijzen en representatieve voertuigcombinaties.',
    openGuideLabel: 'Vergelijking laden',
    activeGuideLabel: 'Nu geladen',
  },
  fr: {
    kicker: 'Méthodologie & Transparence des Calculs',
    title: 'Comment Fahrbilanz calcule chaque centime au kilomètre.',
    sub: 'Chaque chiffre du tableau comparatif, des courbes cumulées et des zones gagnantes repose sur des équations vérifiables et des données européennes officielles.',
    cards: [
      {
        tag: '01 · Modèle Hybride Rechargeable',
        title: 'Part électrique réelle (s) & perte de charge 12 %',
        body: 'La consommation WLTP pondérée sous-estime l’essence consommée sur longs trajets. Fahrbilanz calcule le facteur d’utilisation (UF) à partir des consommations pondérée et batterie déchargée, l’ajuste selon votre profil (100 % UF en trajets courts, 70 % UF en trajets longs) et applique un rendement de charge de 0,88.',
        formula:
          'UF = 1 − F_w / F_cs · e_wall = (100 × B / R) / 0,88 · Carb. = (1 − s) × F_cs',
      },
      {
        tag: '02 · Mix de Recharge & Borne',
        title: 'Tarifs AC/DC pondérés & coûts de borne ciblés',
        body: 'Les véhicules 100 % électriques divisent leur consommation (kWh/100 km) par 0,88 pour intégrer les pertes à la prise, puis appliquent votre mix Domicile AC / Borne publique AC / Charge rapide DC. La location ou l’achat de borne s’applique au choix à l’électrique et/ou à l’hybride.',
        formula:
          '€/kWh mix = (%Dom·P_dom + %PubAC·P_ac + %DC·P_dc) / 100',
      },
      {
        tag: '03 · TCO & Valeur Résiduelle',
        title: 'Dépréciation dynamique & frais annuels complets',
        body: 'En mode Coût Total (TCO), la dépréciation correspond au prix net (bonus déduit si activé) moins la valeur de revente estimée à 1, 3, 5 ou 8 ans. L’entretien, la taxe routière et l’assurance s’ajoutent chaque année aux dépenses d’énergie.',
        formula:
          'TCO = max(0, Prix − Bonus − Revente_H) + Borne + Énergie + H·(Entretien + Taxe + Assur.)',
      },
      {
        tag: '04 · Prix UE & API Concessionnaires',
        title: 'Flux carburants européens & API B2B sécurisée',
        body: 'Les tarifs essence (SP95) et gazole proviennent des moyennes quotidiennes Fuel-Prices.eu et du Weekly Oil Bulletin de la Commission européenne. Les distributeurs automobiles peuvent interroger ce moteur côté serveur via l’API REST (/api/v1/calculate).',
        formula: 'GET /api/v1/fuel-prices · POST /api/v1/calculate',
      },
    ],
    guidesKicker: 'Guides Préconfigurés par Pays & Segment',
    guidesTitle: 'Comparatifs Européens Populaires',
    guidesSub:
      'Chargez directement un scénario localisé avec les prix nationaux du carburant et le duo de motorisations adapté.',
    openGuideLabel: 'Charger ce comparatif',
    activeGuideLabel: 'Comparatif actif',
  },
};
