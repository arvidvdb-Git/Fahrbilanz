import { BodyClassId, PowertrainId } from '../data/cars';

export type Language = 'en' | 'de' | 'nl' | 'fr';

export const LANGUAGE_ORDER: Language[] = ['en', 'de', 'nl', 'fr'];

export const LANGUAGE_LABELS: Record<Language, { code: string; name: string }> = {
  en: { code: 'EN', name: 'English' },
  de: { code: 'DE', name: 'Deutsch' },
  nl: { code: 'NL', name: 'Nederlands' },
  fr: { code: 'FR', name: 'Français' },
};

export interface Translations {
  locale: string;
  nav: {
    powertrains: string;
    energySplit: string;
    costDrivers: string;
    compare: string;
    cta: string;
    menuLabel: string;
    skipToContent: string;
  };
  hero: {
    kicker: string;
    title: string;
    sub: string;
    primaryCta: string;
    secondaryCta: string;
    energyPer100: string;
    annualEnergy: string;
    monthlyTco5Yr: string;
    swatchAriaLabel: string;
  };
  showcase: {
    ariaLabel: string;
    stages: Record<PowertrainId, { title: string; highlights: string[] }>;
  };
  slider: {
    gasLabel: string;
    evLabel: string;
    ariaLabel: string;
    title: string;
    sub: string;
    tabListAria: string;
    wallboxTab: string;
    pumpTab: string;
    evMetricLabel: string;
    gasMetricLabel: string;
  };
  bento: {
    title: string;
    tile1Title: string;
    tile1Sub: string;
    tile2Title: string;
    tile2Sub: string;
    tile3Title: string;
    tile3Sub: string;
    tile3Meta: string;
  };
  seo: {
    title: string;
    description: string;
  };
  footer: {
    tagline: string;
    darkMode: string;
    lightMode: string;
    toggleThemeAria: string;
    disclaimer: string;
    sourceAttribution: string;
    imprintLink: string;
    privacyLink: string;
    accessibilityLink: string;
    cookieSettings: string;
  };
  privacy: {
    kicker: string;
    title: string;
    lead: string;
    backBtn: string;
    updated: string;
    cards: Array<{ title: string; body: string }>;
  };
  imprint: {
    kicker: string;
    title: string;
    lead: string;
    updated: string;
    cards: Array<{ title: string; body: string }>;
  };
  accessibility: {
    kicker: string;
    title: string;
    lead: string;
    updated: string;
    cards: Array<{ title: string; body: string }>;
  };
  cookies: {
    title: string;
    body: string;
    privacyLink: string;
    essentialBtn: string;
    allowBtn: string;
  };
  powertrains: Record<
    PowertrainId,
    { label: string; shortLabel: string; tagline: string }
  >;
  bodyClasses: Record<BodyClassId, string>;
  studio: {
    title: string;
    sub: string;
    twoCars: string;
    threeCars: string;
    carCountAria: string;
    quickGasEv: string;
    quickGasHybEv: string;
    quickDieselHybEv: string;
    scopeTcoTitle: string;
    scopeTcoDesc: string;
    scopeEnergyTitle: string;
    scopeEnergyDesc: string;
    scopeActive: string;
    scopeSelect: string;
    scopeAria: string;
    chooseTypesAria: string;
    carWord: string;
    addThird: string;
    selectWord: string;
    fromPrice: (priceStr: string) => string;
    annualDistance: string;
    horizon: string;
    yrShort: string;
    yrButton: (yr: number) => string;
    gasolineRate: string;
    dieselRate: string;
    fuelMarketCountry: string;
    euAverageOption: string;
    autoTag: string;
    applyLiveRate: string;
    liveSourcePrefix: string;
    loadingFeed: string;
    feedOffline: string;
    elecTariffsTitle: string;
    mixHome: string;
    mixMixed: string;
    mixPublic: string;
    mixCustom: string;
    mixTotalNote: (total: number) => string;
    homeAcLabel: string;
    publicAcLabel: string;
    publicDcLabel: string;
    shareSuffix: string;
    lossesFeesTitle: string;
    avgPrefix: string;
    chargeLossesLabel: string;
    fixedFeeLabel: string;
    wallboxLabel: string;
    winnerKicker: string;
    energyOnlyTag: string;
    tcoSuffix: (years: number) => string;
    winsAt: (
      carNum: number,
      ptLabel: string,
      bodyLabel: string,
      totalStr: string
    ) => string;
    savesSummary: (
      gapStr: string,
      monthlyStr: string,
      runnerIdx: number,
      runnerPt: string,
      totalSavingsStr: string,
      worstPt: string
    ) => string;
    tiedSummary: string;
    winnerPerMonth: string;
    winnerPerKm: string;
    blendedPerKwh: string;
    winnerBestValue: string;
    vsWinner: (deltaStr: string) => string;
    reset: string;
    energySpendYr: (years: number) => string;
    totalCostYr: (years: number) => string;
    annualEnergyLabel: string;
    energySpendLabel: string;
    consumptionLabel: (unit: string) => string;
    purchasePriceLabel: string;
    serviceYrLabel: string;
    roadTaxYrLabel: string;
    insuranceYrLabel: string;
    resaleLabel: string;
    optionalSubsidy: string;
    depreciationLabel: (lossPct: number, subsidyNote: string) => string;
    subsidyNote: (amtStr: string) => string;
    oneTimeWallbox: string;
    electricityLine: (billed: string, rateStr: string) => string;
    fuelLine: (cons: string, rateStr: string) => string;
    fixedChargingFeeLine: (monthlyStr: string) => string;
    maintenanceLine: (years: number) => string;
    roadTaxLine: (years: number) => string;
    insuranceLine: (years: number) => string;
    co2PerYr: string;
    energyBalanceKicker: string;
    ownershipBalanceKicker: string;
    leadsByOverYears: (
      ptLabel: string,
      bodyLabel: string,
      savingsStr: string,
      years: number
    ) => string;
    insightCopy: (
      kmStr: string,
      bestPt: string,
      worstPt: string,
      isEnergyOnly: boolean,
      monthlyStr: string
    ) => string;
    lowestMonthlyEnergy: string;
    lowestMonthlyTco: string;
    lowestAnnualEnergy: string;
    sensitivityKicker: string;
    mapTitle2D: string;
    mapCopy2D: string;
    switchesAt: string;
    andWord: string;
    winsEveryZone: (ptLabel: string) => string;
    sensitivityCopy1D: (isEnergyOnly: boolean) => string;
    analyzeBetween: string;
    all3: string;
    zones2DHead: string;
    nowWord: string;
    ofMap: (pct: number) => string;
    atFuelLabel: (yStr: string, xStr: string) => string;
    boundaryAcrossMap: string;
    coloredWinnerZones: string;
    breakEvenHead: string;
    currentWord: string;
    breakPrefix: string;
    beatsAbove: (abovePt: string, belowPt: string) => string;
    view1DEnergy: string;
    view1DTco: string;
    view2DEnergy: string;
    moUnit: string;
    yrUnit: string;
    kmUnit: string;
    calculateBtn: string;
    settingsPendingNote: string;
    settingsSyncedNote: string;
    simBoxTitle: string;
    simBoxSub: string;
    simResetBtn: string;
    simPendingNote: string;
    simSyncedNote: string;
  };
  charts: {
    cumulEnergyTitle: string;
    cumulTcoTitle: string;
    cumulEnergySub: (years: number) => string;
    cumulTcoSub: (years: number) => string;
    yrTick: (yr: number) => string;
    parityTag: (yr: string) => string;
    hoverYearLabel: (yr: number) => string;
    afterYearsLabel: (years: number) => string;
    sensEnergyTitle: (years: number) => string;
    sensTcoTitle: (years: number) => string;
    sensSubFuelSpread: string;
    sensSubFuel: string;
    sensSubHomeAc: string;
    sensSubPublicDc: string;
    sensSubBlended: string;
    tabFuel: string;
    tabHomeAc: string;
    tabPublicDc: string;
    tabAllKwh: string;
    breakingLineLegend: string;
    bestPrefix: string;
    nowLabel: string;
    atLabel: string;
    currentLabel: string;
    zoneWord: string;
    equalEnergyLegend: string;
    fuelAxisTitle: string;
    chargingAxisTitle: string;
  };
}

export const TRANSLATIONS: Record<Language, Translations> = {
  en: {
    locale: 'en-IE',
    nav: {
      powertrains: 'Powertrains',
      energySplit: 'Energy Split',
      costDrivers: 'Cost Drivers',
      compare: 'Compare',
      cta: 'Compare Cars',
      menuLabel: 'Toggle navigation menu',
      skipToContent: 'Skip to main content',
    },
    hero: {
      kicker: 'Gasoline · Diesel · Hybrid · Full Electric',
      title: 'See the real cost behind every kilometer.',
      sub: 'Compare annual energy expenses and 5-year total cost of ownership across two or three vehicles, calibrated to your actual distance and local rates.',
      primaryCta: 'Compare 2 or 3 Cars',
      secondaryCta: 'Explore Powertrains',
      energyPer100: 'Energy / 100 km',
      annualEnergy: 'Annual Energy',
      monthlyTco5Yr: '5-Yr Monthly TCO',
      swatchAriaLabel: 'Preview powertrain sketch',
    },
    showcase: {
      ariaLabel: 'Powertrain showcase',
      stages: {
        gasoline: {
          title: 'Gasoline',
          highlights: [
            'Lowest upfront purchase price',
            '6.8 L / 100 km baseline consumption',
            'Familiar refueling anywhere in minutes',
          ],
        },
        diesel: {
          title: 'Diesel',
          highlights: [
            'Long-distance highway endurance',
            '5.2 L / 100 km highway efficiency',
            'Strong value past 25,000 km / year',
          ],
        },
        hybrid: {
          title: 'Hybrid',
          highlights: [
            'Regenerative city energy recovery',
            '4.7 L / 100 km blended economy',
            'Dual electric and fuel flexibility',
          ],
        },
        electric: {
          title: 'Full Electric',
          highlights: [
            'Lowest cost per kilometer',
            '16.8 kWh / 100 km consumption',
            'Minimal brake wear & zero exhaust',
          ],
        },
      },
    },
    slider: {
      gasLabel: 'Gasoline · €11.90 / 100 km',
      evLabel: 'Wallbox EV · €5.38 / 100 km',
      ariaLabel: 'Compare electric and combustion energy cost',
      title: 'Pump prices vs. home kilowatt-hours.',
      sub: 'At 15,000 km per year, charging an electric sedan at home trims annual energy spending by roughly €980 compared to a gasoline sedan—before counting maintenance or tax savings.',
      tabListAria: 'Energy source comparison',
      wallboxTab: 'Wallbox EV',
      pumpTab: 'Fuel Pump',
      evMetricLabel: 'Electric per 100 km',
      gasMetricLabel: 'Gasoline per 100 km',
    },
    bento: {
      title: 'What drives total ownership.',
      tile1Title: 'Depreciation & Resale',
      tile1Sub:
        'Typically 45–55% of 5-year ownership—sticker price alone never tells the whole story',
      tile2Title: 'Service & Wear',
      tile2Sub:
        'Regenerative braking and fewer fluids reduce annual workshop invoices',
      tile3Title: '15,000 km / yr',
      tile3Sub: '60-month baseline across 4 powertrains',
      tile3Meta: 'WLTP · Real Mix',
    },
    seo: {
      title: 'Fahrbilanz – EV, Hybrid, Diesel & Gasoline Cost Comparator',
      description:
        'Compare energy spend and total cost of ownership for gasoline, diesel, hybrid, and electric cars using EU fuel prices, charging mixes, and break-even charts.',
    },
    footer: {
      tagline: 'Energy & Total Cost of Ownership Comparator',
      darkMode: 'Dark Mode',
      lightMode: 'Light Mode',
      toggleThemeAria: 'Toggle color theme',
      disclaimer:
        'Simulation notice: All figures, tax estimates, and market averages are provided purely as an illustrative simulation for informational purposes only and do not constitute financial, tax, or legal advice.',
      sourceAttribution: 'Fuel rate source: European Commission Weekly Oil Bulletin',
      imprintLink: 'Imprint',
      privacyLink: 'Privacy',
      accessibilityLink: 'Accessibility',
      cookieSettings: 'Cookie Preferences',
    },
    privacy: {
      kicker: 'Privacy & GDPR Data Protection',
      title: 'Privacy Notice',
      lead: 'Fahrbilanz is built as a stateless client-side simulation tool. No personal data are saved, used, tracked, or given to third parties by the application.',
      backBtn: 'Back to Calculator',
      updated: 'Effective November 2026 · GDPR Information',
      cards: [
        {
          title: '1. Data Controller & Contact',
          body: 'Responsible for this website: Fahrbilanz Operator ([Insert Legal Name / Company], [Street Address, City, Country]). Direct privacy contact: arvidvdbwbs@gmail.com.',
        },
        {
          title: '2. Zero Simulator Data Saved or Sold',
          body: 'All vehicle selections, annual mileage entries, charging tariffs, and cost calculations execute exclusively in memory inside your browser. We do not collect, log, store, profile, or share calculator inputs with third parties or advertisers.',
        },
        {
          title: '3. Hosting & Server Access Logs (Art. 6(1)(f) GDPR)',
          body: 'When opening this web app (hosted on Google Cloud Run in europe-west3), the infrastructure temporarily processes technical connection metadata (IP address, timestamp, requested URL, user-agent) solely in volatile security logs to deliver the page and mitigate abuse under legitimate interest (Art. 6(1)(f) GDPR).',
        },
        {
          title: '4. Public EU Fuel Rate Lookup',
          body: 'To pre-fill average European fuel prices, your browser loads read-only public retail fuel statistics from the European Commission Weekly Oil Bulletin. No personal identifiers or vehicle inputs are sent.',
        },
        {
          title: '5. Essential Local Storage Only',
          body: 'Your cookie-notice choice is stored locally under fahrbilanz_cookie_notice strictly to remember whether to hide the notice. It contains zero tracking tokens and never leaves your device.',
        },
        {
          title: '6. Your GDPR Rights',
          body: 'Under the EU GDPR (Art. 15–22 & Art. 77), you have the right to request information, rectification, erasure, or restriction regarding any personal data processed by server infrastructure, and to lodge a complaint with a national supervisory authority. Contact: arvidvdbwbs@gmail.com.',
        },
      ],
    },
    imprint: {
      kicker: 'Legal Notice · § 5 DDG / EU e-Commerce Disclosure',
      title: 'Imprint & Terms of Use',
      lead: 'Statutory operator disclosure, non-advice terms of use, and official public fuel price data attribution for Fahrbilanz.',
      updated: 'Effective November 2026 · Public Pre-Launch Ready',
      cards: [
        {
          title: '1. Website Operator',
          body: 'Service: Fahrbilanz — Vehicle Energy & TCO Comparator · Operator: [Insert Full Legal Name or Registered Company] · Address: [Insert Street Address, Postal Code, City, Country] · Email: arvidvdbwbs@gmail.com · Phone: [Optional / If Required].',
        },
        {
          title: '2. Commercial & Tax Details (If Applicable)',
          body: 'If operated commercially, insert your Commercial Register & Court, Managing Director, and VAT Identification Number (USt-IdNr. / VAT ID) here before binding your final custom domain.',
        },
        {
          title: '3. Terms of Use & Informational Disclaimer',
          body: 'Fahrbilanz provides free, non-binding vehicle energy and total cost of ownership simulations for general educational and informational use. Outputs depend on user assumptions and benchmark defaults and do not constitute financial, tax, purchasing, or legal advice.',
        },
        {
          title: '4. Data Attribution & Copyright',
          body: 'European retail petrol (Euro-Super 95) and diesel benchmark averages are attributed to the European Commission Weekly Oil Bulletin (energy.ec.europa.eu). All simulation software, UI architecture, and original vehicle sketches © 2026 Fahrbilanz.',
        },
      ],
    },
    accessibility: {
      kicker: 'Digital Accessibility · WCAG 2.1 AA / EAA',
      title: 'Accessibility Statement',
      lead: 'Fahrbilanz is designed to make powertrain cost comparisons usable across keyboards, screen readers, mobile viewports, and motion-sensitive setups.',
      updated: 'Evaluated November 2026 · Target WCAG 2.1 AA',
      cards: [
        {
          title: '1. Standards & Compatibility',
          body: 'We aim for conformance with Web Content Accessibility Guidelines (WCAG) 2.1 Level AA and the European Accessibility Act (EAA) across modern desktop and mobile browsers.',
        },
        {
          title: '2. Implemented Measures',
          body: 'Semantic HTML landmarks, keyboard skip-to-content link, visible high-contrast focus outlines, ARIA tab/radio states, 44px touch targets on mobile menus, crisp color-contrast ratios across light and dark modes, and full prefers-reduced-motion support.',
        },
        {
          title: '3. Known Visual Interactive Notes',
          body: 'Interactive SVG charts include live numeric readout summaries and tabular zone breakdowns directly above and below every plot so exact cost values remain accessible without mouse hovering.',
        },
        {
          title: '4. Feedback & Barrier Reporting',
          body: 'If you encounter an accessibility barrier or need comparison data in an alternative format, please reach out directly via email at arvidvdbwbs@gmail.com.',
        },
      ],
    },
    cookies: {
      title: 'Cookie & Privacy Notice',
      body: 'Fahrbilanz runs purely in your browser and never saves, uses, or shares personal data with third parties. Essential technical storage is used solely to remember this notice.',
      privacyLink: 'Privacy Notice',
      essentialBtn: 'Essential only',
      allowBtn: 'Allow cookies',
    },
    powertrains: {
      gasoline: {
        label: 'Gasoline',
        shortLabel: 'Gasoline',
        tagline: 'Lowest upfront purchase price, familiar refueling',
      },
      diesel: {
        label: 'Diesel',
        shortLabel: 'Diesel',
        tagline: 'High highway efficiency for long annual distances',
      },
      hybrid: {
        label: 'Hybrid',
        shortLabel: 'Hybrid',
        tagline: 'Regenerative city savings paired with unlimited range',
      },
      electric: {
        label: 'Full Electric',
        shortLabel: 'Electric',
        tagline: 'Lowest energy cost per km and minimal brake wear',
      },
    },
    bodyClasses: {
      compact: 'Compact',
      sedan: 'Sedan',
      suv: 'SUV',
    },
    studio: {
      title: 'Compare 2 or 3 cars.',
      sub: 'Choose whether to compare pure energy costs or total cost of ownership, pick your car types from the sketches, and tune local fuel and charging tariffs.',
      twoCars: '2 Cars',
      threeCars: '3 Cars',
      carCountAria: 'Number of cars to compare',
      quickGasEv: 'Gas vs. Electric',
      quickGasHybEv: 'Gas vs. Hybrid vs. EV',
      quickDieselHybEv: 'Diesel vs. Hybrid vs. EV',
      scopeTcoTitle: 'Total Cost of Ownership (TCO)',
      scopeTcoDesc:
        'Full ownership balance: depreciation, optional subsidy, wallbox, energy & charge losses, service, road tax, and insurance.',
      scopeEnergyTitle: 'Energy Cost Only',
      scopeEnergyDesc:
        'Compare pump fuel vs. blended Home AC, Public AC, and Public DC charging including charge losses and monthly charging fees.',
      scopeActive: 'Active',
      scopeSelect: 'Select',
      scopeAria: 'Comparison scope',
      chooseTypesAria: 'Choose car types to compare',
      carWord: 'Car',
      addThird: '+ Add 3rd',
      selectWord: 'Select',
      fromPrice: (p) => `From ${p}`,
      annualDistance: 'Annual Distance',
      horizon: 'Horizon',
      yrShort: 'yr',
      yrButton: (yr) => `${yr} yr`,
      gasolineRate: 'Gasoline (€/L)',
      dieselRate: 'Diesel (€/L)',
      fuelMarketCountry: 'Country Fuel Market',
      euAverageOption: 'EU-27 Average',
      autoTag: 'Language default',
      applyLiveRate: 'Reset to live avg',
      liveSourcePrefix: 'EC Weekly Oil Bulletin',
      loadingFeed: 'Loading regional fuel rates…',
      feedOffline: 'Using European baseline fuel averages',
      elecTariffsTitle: 'Electricity Tariffs & Charging Mix',
      mixHome: '80/15/5 Home',
      mixMixed: '50/30/20 Mixed',
      mixPublic: '0/50/50 Public',
      mixCustom: 'Custom',
      mixTotalNote: (total) =>
        total === 100
          ? '100% total'
          : `${total}% total (normalized)`,
      homeAcLabel: 'Home AC (Lowest)',
      publicAcLabel: 'Public AC (Medium)',
      publicDcLabel: 'Public DC (Highest)',
      shareSuffix: '% share',
      lossesFeesTitle: 'Losses, Fees & Hardware',
      avgPrefix: 'Avg.',
      chargeLossesLabel: 'Charge Losses (%)',
      fixedFeeLabel: 'Fixed Fee (€/mo)',
      wallboxLabel: 'Wallbox 1× (€)',
      winnerKicker: 'Comparison Winner',
      energyOnlyTag: 'Energy Cost Only',
      tcoSuffix: (years) => `${years}-Year TCO`,
      winsAt: (num, pt, body, total) =>
        `Car ${num}: ${pt} ${body} wins at ${total}`,
      savesSummary: (gap, monthly, rIdx, rPt, totalSav, worstPt) =>
        `Saves ${gap} (${monthly}/mo) ahead of Car ${rIdx} (${rPt}) and ${totalSav} vs. ${worstPt}.`,
      tiedSummary:
        'Currently tied for lowest cost under your selected assumptions.',
      winnerPerMonth: 'Winner / month',
      winnerPerKm: 'Winner / km',
      blendedPerKwh: 'Blended / kWh',
      winnerBestValue: 'Winner · Best Value',
      vsWinner: (delta) => `+${delta} vs. winner`,
      reset: 'Reset',
      energySpendYr: (y) => `${y}-Year Energy Spend`,
      totalCostYr: (y) => `${y}-Year Total Cost`,
      annualEnergyLabel: 'Annual Energy',
      energySpendLabel: 'Energy Spend',
      consumptionLabel: (u) => `Consumption (${u})`,
      purchasePriceLabel: 'Purchase Price (€)',
      serviceYrLabel: 'Service / yr (€)',
      roadTaxYrLabel: 'Road Tax / yr (€)',
      insuranceYrLabel: 'Insurance / yr (€)',
      resaleLabel: '5-Yr Resale (%)',
      optionalSubsidy: 'Optional subsidy',
      depreciationLabel: (loss, note) => `Depreciation (${loss}% loss${note})`,
      subsidyNote: (amt) => ` · −${amt} subsidy`,
      oneTimeWallbox: 'One-time Wallbox',
      electricityLine: (billed, rate) =>
        `Electricity (${billed} kWh/100km billed @ ${rate}/kWh)`,
      fuelLine: (cons, rate) => `Fuel (${cons} L/100km @ ${rate}/L)`,
      fixedChargingFeeLine: (mo) => `Fixed charging fee (${mo}/mo)`,
      maintenanceLine: (y) => `Maintenance (${y} yr)`,
      roadTaxLine: (y) => `Road Tax (${y} yr)`,
      insuranceLine: (y) => `Insurance (${y} yr)`,
      co2PerYr: 'Estimated CO₂ / yr',
      energyBalanceKicker: 'Energy Balance Summary',
      ownershipBalanceKicker: 'Ownership Balance',
      leadsByOverYears: (pt, body, sav, y) =>
        `${pt} ${body} leads by ${sav} over ${y} years.`,
      insightCopy: (km, bestPt, worstPt, isEnergy, mo) =>
        `At ${km} km/yr, choosing ${bestPt.toLowerCase()} over ${worstPt.toLowerCase()} lowers ${
          isEnergy ? 'energy spending' : 'total ownership cost'
        } by ${mo} / month.`,
      lowestMonthlyEnergy: 'Lowest monthly energy',
      lowestMonthlyTco: 'Lowest monthly TCO',
      lowestAnnualEnergy: 'Lowest annual energy bill',
      sensitivityKicker: 'Sensitivity & Winning Zones',
      mapTitle2D: 'Energy price map: Fuel vs. Charging',
      mapCopy2D:
        'Compares pure energy costs only (no depreciation, service, or tax) with fuel price on the X-axis and blended charging rate on the Y-axis. Dashed lines mark exact energy parity.',
      switchesAt: 'Winner switches at',
      andWord: 'and',
      winsEveryZone: (pt) => `${pt} wins every price zone in this range.`,
      sensitivityCopy1D: (isEnergy) =>
        `Each colored zone shows which car delivers the lowest ${
          isEnergy ? 'energy cost' : 'total cost of ownership'
        } at that price. Switch to the Fuel × Charging map to compare both energy prices simultaneously.`,
      analyzeBetween: 'Analyze Between (3 Cars Active)',
      all3: 'All 3',
      zones2DHead: '2D Colored Zones & Breaking Lines',
      nowWord: 'Now',
      ofMap: (pct) => `${pct}% of map`,
      atFuelLabel: (yStr, xStr) => `${yStr}/kWh @ ${xStr}/L`,
      boundaryAcrossMap: 'Boundary across map',
      coloredWinnerZones: 'Colored Winner Zones',
      breakEvenHead: 'Break-Even Thresholds',
      currentWord: 'Current',
      breakPrefix: 'Break',
      beatsAbove: (above, below) => `${above} beats ${below} above`,
      view1DEnergy: '1D Energy Sweep',
      view1DTco: '1D TCO Sweep',
      view2DEnergy: 'Energy Only: Fuel × Charging (2D)',
      moUnit: 'mo',
      yrUnit: 'yr',
      kmUnit: 'km',
      calculateBtn: 'Calculate',
      settingsPendingNote: 'Settings changed — click Calculate to update results.',
      settingsSyncedNote: 'Comparison matches current settings.',
      simBoxTitle: 'Simulate Scenario Energy Costs',
      simBoxSub: 'Adjust scenario rates below, then click Calculate to update the chart and jump down.',
      simResetBtn: 'Sync to calculated',
      simPendingNote: 'Scenario edited — click Calculate to update chart.',
      simSyncedNote: 'Chart matches scenario above.',
    },
    charts: {
      cumulEnergyTitle: 'Cumulative Energy Spend Over Time',
      cumulTcoTitle: 'Cumulative Cost Over Time',
      cumulEnergySub: (y) =>
        `Fuel & blended AC/DC charging costs including losses and monthly fee (Year 0 to Year ${y})`,
      cumulTcoSub: (y) =>
        `Net depreciation, wallbox, energy, service, tax, and insurance (Year 0 to Year ${y})`,
      yrTick: (yr) => `Yr ${yr}`,
      parityTag: (yr) => `Parity Yr ${yr}`,
      hoverYearLabel: (yr) => `Year ${yr}`,
      afterYearsLabel: (y) => `After ${y} Years`,
      sensEnergyTitle: (y) => `Energy Cost Sensitivity (${y}-Year)`,
      sensTcoTitle: (y) => `Break-Even Sensitivity (${y}-Year TCO)`,
      sensSubFuelSpread:
        'Colored zones show which car wins at each pump price (€/L); hover plot to inspect',
      sensSubFuel:
        'Colored zones show which car wins at each fuel price (€/L); hover plot to inspect',
      sensSubHomeAc:
        'Sweeping Home AC charging tariff (€/kWh); hover plot to inspect',
      sensSubPublicDc:
        'Sweeping Public DC fast-charging tariff (€/kWh); hover plot to inspect',
      sensSubBlended:
        'Sweeping overall blended electricity tariff (€/kWh) across your full charging mix',
      tabFuel: 'Fuel (€/L)',
      tabHomeAc: 'Home AC',
      tabPublicDc: 'Public DC',
      tabAllKwh: 'All kWh',
      breakingLineLegend: 'Breaking line (winner switches)',
      bestPrefix: 'Best',
      nowLabel: 'Now',
      atLabel: 'At',
      currentLabel: 'Current',
      zoneWord: 'zone',
      equalEnergyLegend: 'Breaking line (equal energy cost)',
      fuelAxisTitle: 'Fuel Price (€/L) →',
      chargingAxisTitle: 'Charging (€/kWh) →',
    },
  },
  de: {
    locale: 'de-DE',
    nav: {
      powertrains: 'Antriebe',
      energySplit: 'Energiekosten',
      costDrivers: 'Kostentreiber',
      compare: 'Vergleich',
      cta: 'Autos vergleichen',
      menuLabel: 'Navigation öffnen',
      skipToContent: 'Zum Hauptinhalt springen',
    },
    hero: {
      kicker: 'Benzin · Diesel · Hybrid · Voll-Elektro',
      title: 'Die wahren Kosten hinter jedem Kilometer.',
      sub: 'Vergleichen Sie jährliche Energiekosten und die 5-Jahres-Gesamtkosten (TCO) für zwei oder drei Fahrzeuge – abgestimmt auf Ihre Fahrleistung und lokale Tarife.',
      primaryCta: '2 oder 3 Autos vergleichen',
      secondaryCta: 'Antriebe entdecken',
      energyPer100: 'Energie / 100 km',
      annualEnergy: 'Energie / Jahr',
      monthlyTco5Yr: '5-J. TCO / Monat',
      swatchAriaLabel: 'Antriebsskizze wählen',
    },
    showcase: {
      ariaLabel: 'Antriebs-Showcase',
      stages: {
        gasoline: {
          title: 'Benziner',
          highlights: [
            'Niedrigster Kaufpreis in der Anschaffung',
            '6,8 L / 100 km Richtwert im Mix',
            'Überall in wenigen Minuten tanken',
          ],
        },
        diesel: {
          title: 'Diesel',
          highlights: [
            'Hohe Langstrecken-Ausdauer auf der Autobahn',
            '5,2 L / 100 km Verbrauch im Basismodell',
            'Wirtschaftlich stark ab 25.000 km / Jahr',
          ],
        },
        hybrid: {
          title: 'Hybrid',
          highlights: [
            'Rekuperation im dichten Stadtverkehr',
            '4,7 L / 100 km kombinierter Verbrauch',
            'Doppelte Antriebsflexibilität ohne Reichweitensorgen',
          ],
        },
        electric: {
          title: 'Voll-Elektro',
          highlights: [
            'Geringste Energiekosten pro Kilometer',
            '16,8 kWh / 100 km Stromverbrauch',
            'Minimaler Bremsverschleiß und null Abgase',
          ],
        },
      },
    },
    slider: {
      gasLabel: 'Benzin · 11,90 € / 100 km',
      evLabel: 'Wallbox E-Auto · 5,38 € / 100 km',
      ariaLabel: 'Elektro- und Verbrenner-Energiekosten vergleichen',
      title: 'Zapfsäule vs. heimische Kilowattstunden.',
      sub: 'Bei 15.000 km im Jahr senkt das Laden zu Hause die jährlichen Energiekosten um rund 980 € gegenüber einem Benziner – noch vor Wartungs- und Steuervorteilen.',
      tabListAria: 'Energiequellen-Vergleich',
      wallboxTab: 'Wallbox E-Auto',
      pumpTab: 'Zapfsäule',
      evMetricLabel: 'Elektrisch pro 100 km',
      gasMetricLabel: 'Benzin pro 100 km',
    },
    bento: {
      title: 'Was die Gesamtkosten bestimmt.',
      tile1Title: 'Wertverlust & Wiederverkauf',
      tile1Sub:
        'Typischerweise 45–55 % der 5-Jahres-Kosten – der Listenpreis allein täuscht oft',
      tile2Title: 'Wartung & Verschleiß',
      tile2Sub:
        'Rekuperatives Bremsen und weniger Betriebsstoffe senken Werkstattrechnungen',
      tile3Title: '15.000 km / Jahr',
      tile3Sub: '60-Monats-Basis über 4 Antriebsarten',
      tile3Meta: 'WLTP · Real-Mix',
    },
    seo: {
      title: 'Fahrbilanz – E-Auto, Hybrid, Diesel & Benzin Kostenvergleich',
      description:
        'Vergleichen Sie Energiekosten und Gesamtkosten (TCO) für Benzin-, Diesel-, Hybrid- und Elektroautos mit EU-Kraftstoffpreisen, Lademix und Gewinnschwellen.',
    },
    footer: {
      tagline: 'Energie- & Gesamtkostenvergleich (TCO)',
      darkMode: 'Dunkelmodus',
      lightMode: 'Hellmodus',
      toggleThemeAria: 'Farbschema wechseln',
      disclaimer:
        'Simulationshinweis: Alle Werte, Steuersätze und Marktpreise dienen ausschließlich der unverbindlichen Information und stellen keine Finanz-, Steuer- oder Rechtsberatung dar.',
      sourceAttribution: 'Datenquelle Kraftstoffpreise: EU-Kommission Weekly Oil Bulletin',
      imprintLink: 'Impressum',
      privacyLink: 'Datenschutz',
      accessibilityLink: 'Barrierefreiheit',
      cookieSettings: 'Cookie-Einstellungen',
    },
    privacy: {
      kicker: 'Datenschutz & DSGVO',
      title: 'Datenschutzerklärung',
      lead: 'Fahrbilanz arbeitet als reine Browser-Simulation. Durch die Anwendung selbst werden keinerlei personenbezogene Daten gespeichert, ausgewertet oder an Dritte weitergegeben.',
      backBtn: 'Zurück zum Rechner',
      updated: 'Stand November 2026 · DSGVO-Hinweise',
      cards: [
        {
          title: '1. Verantwortlicher & Kontakt',
          body: 'Verantwortlich für diese Website: Betreiber von Fahrbilanz ([Vor- und Nachname / Firma eintragen], [Straße, PLZ, Ort, Land]). E-Mail für Datenschutzanfragen: arvidvdbwbs@gmail.com.',
        },
        {
          title: '2. Keine Speicherung Ihrer Rechner-Eingaben',
          body: 'Alle Fahrzeugdaten, Jahreskilometer, Ladetarife und Berechnungen verbleiben ausschließlich im Arbeitsspeicher Ihres Browsers. Es werden keine Konten, Profile oder Nutzungsstatistiken gespeichert oder verkauft.',
        },
        {
          title: '3. Hosting & Server-Logfiles (Art. 6 Abs. 1 lit. f DSGVO)',
          body: 'Beim Aufruf dieser Web-App (gehostet über Google Cloud Run in europe-west3) verarbeitet die Server-Infrastruktur kurzzeitig technische Verbindungsdaten (IP-Adresse, Zeitstempel, aufgerufener Pfad, User-Agent) in Sicherheitsprotokollen auf Grundlage berechtigter Interessen (Art. 6 Abs. 1 lit. f DSGVO) zur Auslieferung und Abwehr von Angriffen.',
        },
        {
          title: '4. Öffentliche EU-Kraftstoffpreise',
          body: 'Zur Vorbelegung aktueller Durchschnittspreise lädt Ihr Browser schreibgeschützt öffentliche Statistiken (Weekly Oil Bulletin der Europäischen Kommission) ohne Übermittlung persönlicher Daten.',
        },
        {
          title: '5. Technisch notwendiger Speicher',
          body: 'Ihre Auswahl im Cookie-Hinweis wird lokal unter fahrbilanz_cookie_notice gespeichert, um die Anzeige zu steuern. Es werden keine Tracking-Cookies gesetzt.',
        },
        {
          title: '6. Ihre Rechte nach der DSGVO',
          body: 'Sie haben nach Art. 15–22 sowie Art. 77 DSGVO das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung sowie auf Beschwerde bei einer Datenschutz-Aufsichtsbehörde. Kontakt: arvidvdbwbs@gmail.com.',
        },
      ],
    },
    imprint: {
      kicker: 'Pflichtangaben gemäß § 5 DDG / EU-Recht',
      title: 'Impressum & Nutzungsbedingungen',
      lead: 'Anbieterkennzeichnung, Haftungsausschluss für unverbindliche Modellrechnungen und Quellenangaben für Fahrbilanz.',
      updated: 'Stand November 2026 · Vorbereitete Angaben',
      cards: [
        {
          title: '1. Diensteanbieter / Betreiber',
          body: 'Angebot: Fahrbilanz — Energie- & Gesamtkostenvergleich · Betreiber: [Vollständiger Name oder Firma eintragen] · Anschrift: [Straße, Hausnummer, PLZ, Ort, Land] · E-Mail: arvidvdbwbs@gmail.com · Telefon: [Optional ergänzen].',
        },
        {
          title: '2. Register- & Steuerdaten (falls gewerblich)',
          body: 'Bei gewerblichem Betrieb bitte vor Veröffentlichung unter eigener Domain Handelsregister, Registergericht, Vertretungsberechtigte und USt-IdNr. ergänzen.',
        },
        {
          title: '3. Nutzungsbedingungen & Haftungsausschluss',
          body: 'Fahrbilanz stellt kostenfreie, unverbindliche Beispielberechnungen zu Energie- und Haltekosten bereit. Alle Ergebnisse ersetzen keine individuelle Finanz-, Steuer-, Kauf- oder Rechtsberatung.',
        },
        {
          title: '4. Datenquellen & Urheberrecht',
          body: 'Europäische Benzin- (Euro-Super 95) und Dieselpreise basieren auf dem Weekly Oil Bulletin der Europäischen Kommission (energy.ec.europa.eu). Software, Gestaltung und Fahrzeugskizzen © 2026 Fahrbilanz.',
        },
      ],
    },
    accessibility: {
      kicker: 'Digitale Barrierefreiheit · WCAG 2.1 AA / BFSG',
      title: 'Erklärung zur Barrierefreiheit',
      lead: 'Fahrbilanz ist darauf ausgelegt, Antriebsvergleiche per Tastatur, Screenreader, auf Mobilgeräten und bei reduzierter Bewegung klar zugänglich zu machen.',
      updated: 'Stand November 2026 · Zielstandard WCAG 2.1 AA',
      cards: [
        {
          title: '1. Konformitätsziel',
          body: 'Wir orientieren uns an den Web Content Accessibility Guidelines (WCAG) 2.1 Stufe AA sowie dem Barrierefreiheitsstärkungsgesetz (BFSG) bzw. dem European Accessibility Act.',
        },
        {
          title: '2. Umgesetzte Maßnahmen',
          body: 'Semantische HTML-Struktur, Sprunglink zum Hauptinhalt, sichtbare Tastatur-Fokusrahmen, ARIA-Rollen für Tabs und Schalter, 44-px-Touchflächen im Mobilmenü, geprüfte Farbkontraste im Hell-/Dunkelmodus sowie Unterstützung für prefers-reduced-motion.',
        },
        {
          title: '3. Zugängliche Diagrammdaten',
          body: 'Alle interaktiven SVG-Diagramme werden direkt darüber und darunter durch tabellarische Gewinnzonen, Gewinnschwellen und Live-Wertleisten begleitet, sodass alle Zahlen auch ohne Mauszeiger ablesbar sind.',
        },
        {
          title: '4. Feedback & Meldung von Barrieren',
          body: 'Falls Ihnen Barrieren auffallen oder Sie Informationen in einem anderen Format benötigen, kontaktieren Sie uns bitte per E-Mail unter arvidvdbwbs@gmail.com.',
        },
      ],
    },
    cookies: {
      title: 'Cookie- & Datenschutzhinweis',
      body: 'Fahrbilanz berechnet alles lokal im Browser – es werden keine Daten gespeichert, genutzt oder an Dritte weitergegeben. Technisch notwendige Speicherung merkt sich nur Ihre Auswahl.',
      privacyLink: 'Datenschutz',
      essentialBtn: 'Nur notwendige',
      allowBtn: 'Cookies erlauben',
    },
    powertrains: {
      gasoline: {
        label: 'Benzin',
        shortLabel: 'Benzin',
        tagline: 'Geringster Kaufpreis, gewohntes Tanken',
      },
      diesel: {
        label: 'Diesel',
        shortLabel: 'Diesel',
        tagline: 'Hohe Autobahneffizienz für Vielfahrer',
      },
      hybrid: {
        label: 'Hybrid',
        shortLabel: 'Hybrid',
        tagline: 'Stadt-Rekuperation plus volle Reichweite',
      },
      electric: {
        label: 'Voll-Elektro',
        shortLabel: 'Elektro',
        tagline: 'Geringste Energiekosten pro km und kaum Bremsverschleiß',
      },
    },
    bodyClasses: {
      compact: 'Kompakt',
      sedan: 'Limousine',
      suv: 'SUV',
    },
    studio: {
      title: '2 oder 3 Autos vergleichen.',
      sub: 'Wählen Sie zwischen reinem Energiekostenvergleich oder den gesamten Haltekosten (TCO), tippen Sie auf die Fahrzeugskizzen und passen Sie lokale Tarife an.',
      twoCars: '2 Autos',
      threeCars: '3 Autos',
      carCountAria: 'Anzahl der Fahrzeuge im Vergleich',
      quickGasEv: 'Benzin vs. Elektro',
      quickGasHybEv: 'Benzin vs. Hybrid vs. Elektro',
      quickDieselHybEv: 'Diesel vs. Hybrid vs. Elektro',
      scopeTcoTitle: 'Gesamtkosten (TCO)',
      scopeTcoDesc:
        'Komplette Haltebilanz: Wertverlust, optionale Förderung, Wallbox, Energie & Ladeverluste, Wartung, Kfz-Steuer und Versicherung.',
      scopeEnergyTitle: 'Nur Energiekosten',
      scopeEnergyDesc:
        'Vergleicht Kraftstoff an der Zapfsäule mit gemischtem Heim-AC-, öffentlichem AC- und DC-Laden inkl. Ladeverlusten und Grundgebühr.',
      scopeActive: 'Aktiv',
      scopeSelect: 'Wählen',
      scopeAria: 'Vergleichsumfang',
      chooseTypesAria: 'Antriebsarten für den Vergleich wählen',
      carWord: 'Auto',
      addThird: '+ 3. Auto',
      selectWord: 'Wählen',
      fromPrice: (p) => `Ab ${p}`,
      annualDistance: 'Jährliche Fahrleistung',
      horizon: 'Haltedauer',
      yrShort: 'J.',
      yrButton: (yr) => `${yr} J.`,
      gasolineRate: 'Benzin (€/L)',
      dieselRate: 'Diesel (€/L)',
      fuelMarketCountry: 'Länder-Kraftstoffmarkt',
      euAverageOption: 'EU-27 Durchschnitt',
      autoTag: 'Sprach-Standard',
      applyLiveRate: 'Live-Wert laden',
      liveSourcePrefix: 'EU-Kommission Weekly Oil Bulletin',
      loadingFeed: 'Lade regionale Kraftstoffpreise…',
      feedOffline: 'Europäische Richtwerte aktiv',
      elecTariffsTitle: 'Stromtarife & Lademix',
      mixHome: '80/15/5 Zuhause',
      mixMixed: '50/30/20 Gemischt',
      mixPublic: '0/50/50 Öffentlich',
      mixCustom: 'Benutzerdefiniert',
      mixTotalNote: (total) =>
        total === 100 ? '100% Summe' : `${total}% Summe (normiert)`,
      homeAcLabel: 'Heim-AC (Günstig)',
      publicAcLabel: 'Öffentl. AC (Mittel)',
      publicDcLabel: 'Öffentl. DC (Hoch)',
      shareSuffix: '% Anteil',
      lossesFeesTitle: 'Verluste, Gebühren & Hardware',
      avgPrefix: 'Ø',
      chargeLossesLabel: 'Ladeverluste (%)',
      fixedFeeLabel: 'Grundgebühr (€/Mo)',
      wallboxLabel: 'Wallbox 1× (€)',
      winnerKicker: 'Vergleichssieger',
      energyOnlyTag: 'Nur Energiekosten',
      tcoSuffix: (years) => `${years}-Jahres-TCO`,
      winsAt: (num, pt, body, total) =>
        `Auto ${num}: ${pt} (${body}) gewinnt mit ${total}`,
      savesSummary: (gap, monthly, rIdx, rPt, totalSav, worstPt) =>
        `Spart ${gap} (${monthly}/Mo) vor Auto ${rIdx} (${rPt}) und ${totalSav} gegenüber ${worstPt}.`,
      tiedSummary: 'Aktuell gleichauf bei den gewählten Annahmen.',
      winnerPerMonth: 'Sieger / Monat',
      winnerPerKm: 'Sieger / km',
      blendedPerKwh: 'Mischpreis / kWh',
      winnerBestValue: 'Sieger · Bestwert',
      vsWinner: (delta) => `+${delta} vs. Sieger`,
      reset: 'Zurücksetzen',
      energySpendYr: (y) => `${y}-J. Energiekosten`,
      totalCostYr: (y) => `${y}-J. Gesamtkosten`,
      annualEnergyLabel: 'Energie / Jahr',
      energySpendLabel: 'Energiekosten',
      consumptionLabel: (u) => `Verbrauch (${u})`,
      purchasePriceLabel: 'Kaufpreis (€)',
      serviceYrLabel: 'Wartung / J. (€)',
      roadTaxYrLabel: 'Kfz-Steuer / J. (€)',
      insuranceYrLabel: 'Versicherung / J. (€)',
      resaleLabel: '5-J. Restwert (%)',
      optionalSubsidy: 'Optionale Förderung',
      depreciationLabel: (loss, note) => `Wertverlust (${loss}% Minus${note})`,
      subsidyNote: (amt) => ` · −${amt} Förderung`,
      oneTimeWallbox: 'Einmalige Wallbox',
      electricityLine: (billed, rate) =>
        `Strom (${billed} kWh/100km abgerechnet @ ${rate}/kWh)`,
      fuelLine: (cons, rate) => `Kraftstoff (${cons} L/100km @ ${rate}/L)`,
      fixedChargingFeeLine: (mo) => `Lade-Grundgebühr (${mo}/Mo)`,
      maintenanceLine: (y) => `Wartung (${y} J.)`,
      roadTaxLine: (y) => `Kfz-Steuer (${y} J.)`,
      insuranceLine: (y) => `Versicherung (${y} J.)`,
      co2PerYr: 'Geschätztes CO₂ / Jahr',
      energyBalanceKicker: 'Energiebilanz',
      ownershipBalanceKicker: 'Gesamtkosten-Bilanz',
      leadsByOverYears: (pt, body, sav, y) =>
        `${pt} (${body}) führt über ${y} Jahre mit ${sav} Vorsprung.`,
      insightCopy: (km, bestPt, worstPt, isEnergy, mo) =>
        `Bei ${km} km/Jahr senkt ${bestPt} statt ${worstPt} die ${
          isEnergy ? 'Energiekosten' : 'Gesamtkosten'
        } um ${mo} pro Monat.`,
      lowestMonthlyEnergy: 'Günstigste Energie / Monat',
      lowestMonthlyTco: 'Günstigste TCO / Monat',
      lowestAnnualEnergy: 'Günstigste Jahresenergie',
      sensitivityKicker: 'Sensitivität & Gewinnzonen',
      mapTitle2D: 'Energiepreiskarte: Kraftstoff vs. Laden',
      mapCopy2D:
        'Vergleicht ausschließlich reine Energiekosten (ohne Wertverlust, Wartung oder Steuer) mit Kraftstoffpreis auf der X-Achse und Ladetarif auf der Y-Achse. Gestrichelte Linien markieren exakte Parität.',
      switchesAt: 'Sieger wechselt bei',
      andWord: 'und',
      winsEveryZone: (pt) => `${pt} gewinnt jede Preiszone in diesem Bereich.`,
      sensitivityCopy1D: (isEnergy) =>
        `Jede farbige Zone zeigt, welches Auto die niedrigsten ${
          isEnergy ? 'Energiekosten' : 'Gesamtkosten'
        } erzielt. Wechseln Sie zur Karte Kraftstoff × Laden für beide Preise gleichzeitig.`,
      analyzeBetween: 'Analyse zwischen (3 Autos aktiv)',
      all3: 'Alle 3',
      zones2DHead: '2D-Zonen & Grenzlinien',
      nowWord: 'Aktuell',
      ofMap: (pct) => `${pct}% der Karte`,
      atFuelLabel: (yStr, xStr) => `${yStr}/kWh @ ${xStr}/L`,
      boundaryAcrossMap: 'Grenzlinie über Karte',
      coloredWinnerZones: 'Farbige Siegerzonen',
      breakEvenHead: 'Gewinnschwellen',
      currentWord: 'Aktuell',
      breakPrefix: 'Wechsel',
      beatsAbove: (above, below) => `${above} schlägt ${below} ab`,
      view1DEnergy: '1D Energie-Kurve',
      view1DTco: '1D TCO-Kurve',
      view2DEnergy: 'Nur Energie: Sprit × Laden (2D)',
      moUnit: 'Mo',
      yrUnit: 'J.',
      kmUnit: 'km',
      calculateBtn: 'Berechnen',
      settingsPendingNote: 'Eingaben geändert — für neues Ergebnis „Berechnen“ klicken.',
      settingsSyncedNote: 'Ergebnis entspricht den aktuellen Einstellungen.',
      simBoxTitle: 'Energiekosten-Szenario simulieren',
      simBoxSub: 'Tarife hier anpassen und auf „Berechnen“ klicken, um das Diagramm direkt zu aktualisieren.',
      simResetBtn: 'Auf Berechnung zurücksetzen',
      simPendingNote: 'Szenario geändert — „Berechnen“ für Diagramm-Update klicken.',
      simSyncedNote: 'Diagramm entspricht dem Szenario oben.',
    },
    charts: {
      cumulEnergyTitle: 'Kumulierte Energiekosten im Zeitverlauf',
      cumulTcoTitle: 'Kumulierte Gesamtkosten im Zeitverlauf',
      cumulEnergySub: (y) =>
        `Kraftstoff & gemischtes AC/DC-Laden inkl. Ladeverlusten und Grundgebühr (Jahr 0 bis Jahr ${y})`,
      cumulTcoSub: (y) =>
        `Netto-Wertverlust, Wallbox, Energie, Wartung, Steuer und Versicherung (Jahr 0 bis Jahr ${y})`,
      yrTick: (yr) => `J. ${yr}`,
      parityTag: (yr) => `Parität J. ${yr}`,
      hoverYearLabel: (yr) => `Jahr ${yr}`,
      afterYearsLabel: (y) => `Nach ${y} Jahren`,
      sensEnergyTitle: (y) => `Energiekosten-Sensitivität (${y} Jahre)`,
      sensTcoTitle: (y) => `Break-Even-Sensitivität (${y}-J. TCO)`,
      sensSubFuelSpread:
        'Farbige Zonen zeigen den Sieger je Literpreis (€/L); zum Prüfen darüberfahren',
      sensSubFuel:
        'Farbige Zonen zeigen den Sieger je Kraftstoffpreis (€/L); zum Prüfen darüberfahren',
      sensSubHomeAc:
        'Variation des Heim-AC-Ladetarifs (€/kWh); zum Prüfen darüberfahren',
      sensSubPublicDc:
        'Variation des öffentlichen DC-Schnellladetarifs (€/kWh); zum Prüfen darüberfahren',
      sensSubBlended:
        'Variation des gemischten Strompreises (€/kWh) über Ihren Lademix',
      tabFuel: 'Sprit (€/L)',
      tabHomeAc: 'Heim-AC',
      tabPublicDc: 'Öffentl. DC',
      tabAllKwh: 'Alle kWh',
      breakingLineLegend: 'Grenzlinie (Siegerwechsel)',
      bestPrefix: 'Best',
      nowLabel: 'Jetzt',
      atLabel: 'Bei',
      currentLabel: 'Aktuell',
      zoneWord: 'Zone',
      equalEnergyLegend: 'Grenzlinie (gleiche Energiekosten)',
      fuelAxisTitle: 'Kraftstoffpreis (€/L) →',
      chargingAxisTitle: 'Laden (€/kWh) →',
    },
  },
  nl: {
    locale: 'nl-NL',
    nav: {
      powertrains: 'Aandrijving',
      energySplit: 'Energiesplit',
      costDrivers: 'Kostenfactoren',
      compare: 'Vergelijken',
      cta: 'Auto’s vergelijken',
      menuLabel: 'Navigatiemenu',
      skipToContent: 'Ga naar hoofdinhoud',
    },
    hero: {
      kicker: 'Benzine · Diesel · Hybride · Volledig Elektrisch',
      title: 'Zie de echte kosten achter elke kilometer.',
      sub: 'Vergelijk jaarlijkse energiekosten en 5-jaars totale eigendomskosten (TCO) van twee of drie auto’s, afgestemd op uw kilometers en lokale tarieven.',
      primaryCta: 'Vergelijk 2 of 3 auto’s',
      secondaryCta: 'Bekijk aandrijvingen',
      energyPer100: 'Energie / 100 km',
      annualEnergy: 'Energie / jaar',
      monthlyTco5Yr: '5-jr TCO / mnd',
      swatchAriaLabel: 'Kies schets aandrijving',
    },
    showcase: {
      ariaLabel: 'Aandrijvingen showcase',
      stages: {
        gasoline: {
          title: 'Benzine',
          highlights: [
            'Laagste aanschafprijs bij instap',
            '6,8 L / 100 km basisverbruik',
            'Overal binnen enkele minuten getankt',
          ],
        },
        diesel: {
          title: 'Diesel',
          highlights: [
            'Efficiënt op lange snelwegritten',
            '5,2 L / 100 km standaardverbruik',
            'Sterk voordeel boven 25.000 km / jaar',
          ],
        },
        hybrid: {
          title: 'Hybride',
          highlights: [
            'Regeneratief terugwinnen in de stad',
            '4,7 L / 100 km gecombineerd verbruik',
            'Dubbele flexibiliteit van elektrisch en benzine',
          ],
        },
        electric: {
          title: 'Volledig Elektrisch',
          highlights: [
            'Laagste energiekosten per kilometer',
            '16,8 kWh / 100 km verbruik',
            'Minimale remslijtage en nul uitstoot',
          ],
        },
      },
    },
    slider: {
      gasLabel: 'Benzine · € 11,90 / 100 km',
      evLabel: 'Wallbox EV · € 5,38 / 100 km',
      ariaLabel: 'Vergelijk elektrische en brandstofkosten',
      title: 'Pomp-prijzen vs. kilowatturen thuis.',
      sub: 'Bij 15.000 km per jaar bespaart thuisladen zo’n € 980 per jaar aan energie ten opzichte van een benzine-sedan — nog vóór onderhoud en wegenbelasting.',
      tabListAria: 'Energiebron vergelijking',
      wallboxTab: 'Wallbox EV',
      pumpTab: 'Brandstofpomp',
      evMetricLabel: 'Elektrisch per 100 km',
      gasMetricLabel: 'Benzine per 100 km',
    },
    bento: {
      title: 'Wat de totale kosten bepaalt.',
      tile1Title: 'Afschrijving & Restwaarde',
      tile1Sub:
        'Vaak 45–55% van 5 jaar bezit — de catalogusprijs alleen vertelt niet het hele verhaal',
      tile2Title: 'Onderhoud & Slijtage',
      tile2Sub:
        'Regeneratief remmen en minder vloeistoffen verlagen de jaarlijkse garagekosten',
      tile3Title: '15.000 km / jr',
      tile3Sub: '60-maands basis over 4 aandrijfvormen',
      tile3Meta: 'WLTP · Praktijkmix',
    },
    seo: {
      title: 'Fahrbilanz – EV, Hybride, Diesel & Benzine Kostenvergelijker',
      description:
        'Vergelijk energiekosten en totale eigendomskosten (TCO) van benzine-, diesel-, hybride- en elektrische auto’s met actuele EU-brandstofprijzen en laadmix.',
    },
    footer: {
      tagline: 'Energie- & Totale Eigendomskosten Vergelijker',
      darkMode: 'Donkere modus',
      lightMode: 'Lichte modus',
      toggleThemeAria: 'Wissel kleurthema',
      disclaimer:
        'Simulatie-disclaimer: Alle bedragen, belastingindicaties en marktgemiddelden zijn uitsluitend bedoeld als informatieve simulatie en vormen geen financieel, fiscaal of juridisch advies.',
      sourceAttribution: 'Brandstofbron: Europese Commissie Weekly Oil Bulletin',
      imprintLink: 'Colofon',
      privacyLink: 'Privacy',
      accessibilityLink: 'Toegankelijkheid',
      cookieSettings: 'Cookievoorkeuren',
    },
    privacy: {
      kicker: 'Privacy & AVG-gegevensbescherming',
      title: 'Privacyverklaring',
      lead: 'Fahrbilanz werkt volledig lokaal in uw browser. Er worden door de calculator zelf geen persoonlijke gegevens opgeslagen, gebruikt of gedeeld met derden.',
      backBtn: 'Terug naar calculator',
      updated: 'Versie november 2026 · AVG-informatie',
      cards: [
        {
          title: '1. Verwerkingsverantwoordelijke',
          body: 'Verantwoordelijk voor deze website: Beheerder van Fahrbilanz ([Volledige naam of bedrijfsnaam], [Adres, Postcode, Plaats, Land]). E-mail voor privacyvragen: arvidvdbwbs@gmail.com.',
        },
        {
          title: '2. Geen opslag van uw rekeninvoer',
          body: 'Alle voertuigkeuzes, kilometers, tarieven en berekeningen blijven uitsluitend lokaal in het geheugen van uw browser. Wij slaan geen invoer of profielen op en delen niets met derden.',
        },
        {
          title: '3. Hosting & Serverlogs (Art. 6 lid 1 sub f AVG)',
          body: 'Bij het laden van de webapplicatie (gehost op Google Cloud Run in europe-west3) verwerkt de serverinfrastructuur kortstondig technische verbindingsgegevens (IP-adres, tijdstip, URL, user-agent) in beveiligingslogs op basis van gerechtvaardigd belang (Art. 6 lid 1 sub f AVG).',
        },
        {
          title: '4. Openbare EU-brandstofprijzen',
          body: 'Voor actuele gemiddelde brandstofprijzen haalt uw browser alleen-lezen publieke EU-cijfers (European Commission Weekly Oil Bulletin) op zonder persoonlijke gegevens mee te sturen.',
        },
        {
          title: '5. Strikt noodzakelijke opslag',
          body: 'De keuze bij de cookie-melding wordt uitsluitend lokaal onder fahrbilanz_cookie_notice bewaard om de melding te verbergen en bevat geen tracking-id’s.',
        },
        {
          title: '6. Uw rechten onder de AVG',
          body: 'Op grond van de AVG (art. 15–22 en art. 77) heeft u recht op inzage, rectificatie, wissing, beperking van verwerking en het indienen van een klacht bij de Autoriteit Persoonsgegevens. Contact: arvidvdbwbs@gmail.com.',
        },
      ],
    },
    imprint: {
      kicker: 'Juridische vermelding & Bronnen',
      title: 'Colofon & Gebruiksvoorwaarden',
      lead: 'Identiteit van de aanbieder, niet-bindende voorwaarden voor simulaties en officiële bronvermelding voor Fahrbilanz.',
      updated: 'Versie november 2026 · Voorbereid voor publicatie',
      cards: [
        {
          title: '1. Beheerder van de website',
          body: 'Dienst: Fahrbilanz — Energie- & TCO-vergelijker · Beheerder: [Volledige naam of rechtspersoon] · Vestigingsadres: [Straat, Huisnummer, Postcode, Plaats, Land] · E-mail: arvidvdbwbs@gmail.com.',
        },
        {
          title: '2. Handelsregister & Btw-nummer (indien zakelijk)',
          body: 'Indien u de website commercieel exploiteert, vul hier vóór publicatie op een eigen domein uw KvK-nummer en btw-identificatienummer in.',
        },
        {
          title: '3. Gebruiksvoorwaarden & Vrijwaring',
          body: 'Alle berekeningen en scenario’s op Fahrbilanz zijn uitsluitend illustratief en informatief en gelden niet als financieel, fiscaal of juridisch advies.',
        },
        {
          title: '4. Bronvermelding & Auteursrecht',
          body: 'Gemiddelde Europese benzine- en dieselprijzen zijn afkomstig uit het Weekly Oil Bulletin van de Europese Commissie (energy.ec.europa.eu). Interface en schetsen © 2026 Fahrbilanz.',
        },
      ],
    },
    accessibility: {
      kicker: 'Digitale Toegankelijkheid · WCAG 2.1 AA',
      title: 'Toegankelijkheidsverklaring',
      lead: 'Fahrbilanz is gebouwd om autokostenvergelijkingen toegankelijk te maken via toetsenbord, schermlezers, mobiel en verminderde beweging.',
      updated: 'Evaluatie november 2026 · Richtlijn WCAG 2.1 AA',
      cards: [
        {
          title: '1. Standaard & Compatibiliteit',
          body: 'Wij streven naar naleving van de Web Content Accessibility Guidelines (WCAG) 2.1 niveau AA en de European Accessibility Act.',
        },
        {
          title: '2. Toegepaste maatregelen',
          body: 'Semantische HTML-secties, snelkoppeling naar hoofdinhoud, duidelijke focusranden, ARIA-statussen, 44px aanraakdoelen, hoog contrast in licht/donker thema en ondersteuning voor prefers-reduced-motion.',
        },
        {
          title: '3. Toegankelijke grafiekgegevens',
          body: 'Interactieve SVG-grafieken zijn voorzien van uitgeschreven winnaarszones, omslagpunten en live leesregels zodat alle resultaten zonder muis leesbaar zijn.',
        },
        {
          title: '4. Feedback & Melden van drempels',
          body: 'Loopt u tegen een toegankelijkheidsprobleem aan? Mail gerust naar arvidvdbwbs@gmail.com.',
        },
      ],
    },
    cookies: {
      title: 'Cookie- & Privacyverklaring',
      body: 'Fahrbilanz draait volledig lokaal en slaat geen persoonlijke gegevens op voor eigen gebruik of derden. Strikt noodzakelijke opslag onthoudt alleen uw keuze.',
      privacyLink: 'Privacy',
      essentialBtn: 'Alleen noodzakelijk',
      allowBtn: 'Cookies toestaan',
    },
    powertrains: {
      gasoline: {
        label: 'Benzine',
        shortLabel: 'Benzine',
        tagline: 'Laagste aanschafprijs, vertrouwd tanken',
      },
      diesel: {
        label: 'Diesel',
        shortLabel: 'Diesel',
        tagline: 'Hoge snelwegefficiëntie voor veelkilometers',
      },
      hybrid: {
        label: 'Hybride',
        shortLabel: 'Hybride',
        tagline: 'Stadsbesparing door regeneratie met onbeperkt bereik',
      },
      electric: {
        label: 'Volledig Elektrisch',
        shortLabel: 'Elektrisch',
        tagline: 'Laagste energiekosten per km en minimale remslijtage',
      },
    },
    bodyClasses: {
      compact: 'Compact',
      sedan: 'Sedan',
      suv: 'SUV',
    },
    studio: {
      title: 'Vergelijk 2 of 3 auto’s.',
      sub: 'Kies of u alleen energiekosten of de totale eigendomskosten wilt vergelijken, selecteer autotypes via de schetsen en stel lokale tarieven in.',
      twoCars: '2 Auto’s',
      threeCars: '3 Auto’s',
      carCountAria: 'Aantal te vergelijken auto’s',
      quickGasEv: 'Benzine vs. Elektrisch',
      quickGasHybEv: 'Benzine vs. Hybride vs. EV',
      quickDieselHybEv: 'Diesel vs. Hybride vs. EV',
      scopeTcoTitle: 'Totale Eigendomskosten (TCO)',
      scopeTcoDesc:
        'Volledige balans: afschrijving, optionele subsidie, laadpaal, energie & laadverlies, onderhoud, wegenbelasting en verzekering.',
      scopeEnergyTitle: 'Alleen Energiekosten',
      scopeEnergyDesc:
        'Vergelijk brandstof aan de pomp met gewogen Thuis-AC, Publiek AC en Publiek DC laden incl. laadverliezen en abonnementskosten.',
      scopeActive: 'Actief',
      scopeSelect: 'Selecteer',
      scopeAria: 'Vergelijkingsbereik',
      chooseTypesAria: 'Kies autotypes om te vergelijken',
      carWord: 'Auto',
      addThird: '+ 3e erbij',
      selectWord: 'Kies',
      fromPrice: (p) => `Vanaf ${p}`,
      annualDistance: 'Jaarlijkse afstand',
      horizon: 'Looptijd',
      yrShort: 'jr',
      yrButton: (yr) => `${yr} jr`,
      gasolineRate: 'Benzine (€/L)',
      dieselRate: 'Diesel (€/L)',
      fuelMarketCountry: 'Brandstofmarkt per land',
      euAverageOption: 'EU-27 Gemiddelde',
      autoTag: 'Taalstandaard',
      applyLiveRate: 'Live-gemiddelde',
      liveSourcePrefix: 'EC Weekly Oil Bulletin',
      loadingFeed: 'Regionale brandstofprijzen laden…',
      feedOffline: 'Europese basisgemiddelden actief',
      elecTariffsTitle: 'Stroomtarieven & Laadmix',
      mixHome: '80/15/5 Thuis',
      mixMixed: '50/30/20 Mix',
      mixPublic: '0/50/50 Publiek',
      mixCustom: 'Aangepast',
      mixTotalNote: (total) =>
        total === 100 ? '100% totaal' : `${total}% totaal (genormaliseerd)`,
      homeAcLabel: 'Thuis AC (Laagst)',
      publicAcLabel: 'Publiek AC (Middel)',
      publicDcLabel: 'Publiek DC (Hoogst)',
      shareSuffix: '% aandeel',
      lossesFeesTitle: 'Verliezen, Abonnement & Hardware',
      avgPrefix: 'Gem.',
      chargeLossesLabel: 'Laadverlies (%)',
      fixedFeeLabel: 'Vaste kosten (€/mnd)',
      wallboxLabel: 'Laadpaal 1× (€)',
      winnerKicker: 'Winnaar van de vergelijking',
      energyOnlyTag: 'Alleen Energiekosten',
      tcoSuffix: (years) => `${years}-Jaars TCO`,
      winsAt: (num, pt, body, total) =>
        `Auto ${num}: ${pt} (${body}) wint met ${total}`,
      savesSummary: (gap, monthly, rIdx, rPt, totalSav, worstPt) =>
        `Bespaart ${gap} (${monthly}/mnd) voor Auto ${rIdx} (${rPt}) en ${totalSav} t.o.v. ${worstPt}.`,
      tiedSummary: 'Momenteel gelijkspel onder de gekozen aannames.',
      winnerPerMonth: 'Winnaar / mnd',
      winnerPerKm: 'Winnaar / km',
      blendedPerKwh: 'Gewogen / kWh',
      winnerBestValue: 'Winnaar · Beste keuze',
      vsWinner: (delta) => `+${delta} vs. winnaar`,
      reset: 'Herstel',
      energySpendYr: (y) => `${y}-Jaars Energiekosten`,
      totalCostYr: (y) => `${y}-Jaars Totale Kosten`,
      annualEnergyLabel: 'Energie / jr',
      energySpendLabel: 'Energiekosten',
      consumptionLabel: (u) => `Verbruik (${u})`,
      purchasePriceLabel: 'Aankoopprijs (€)',
      serviceYrLabel: 'Onderhoud / jr (€)',
      roadTaxYrLabel: 'Wegenbelasting / jr (€)',
      insuranceYrLabel: 'Verzekering / jr (€)',
      resaleLabel: '5-jr Restwaarde (%)',
      optionalSubsidy: 'Optionele subsidie',
      depreciationLabel: (loss, note) => `Afschrijving (${loss}% verlies${note})`,
      subsidyNote: (amt) => ` · −${amt} subsidie`,
      oneTimeWallbox: 'Eenmalige laadpaal',
      electricityLine: (billed, rate) =>
        `Elektriciteit (${billed} kWh/100km geladen @ ${rate}/kWh)`,
      fuelLine: (cons, rate) => `Brandstof (${cons} L/100km @ ${rate}/L)`,
      fixedChargingFeeLine: (mo) => `Vast laadtarief (${mo}/mnd)`,
      maintenanceLine: (y) => `Onderhoud (${y} jr)`,
      roadTaxLine: (y) => `Wegenbelasting (${y} jr)`,
      insuranceLine: (y) => `Verzekering (${y} jr)`,
      co2PerYr: 'Geschatte CO₂ / jr',
      energyBalanceKicker: 'Energiebalans',
      ownershipBalanceKicker: 'Eigendomsbalans',
      leadsByOverYears: (pt, body, sav, y) =>
        `${pt} (${body}) leidt met ${sav} over ${y} jaar.`,
      insightCopy: (km, bestPt, worstPt, isEnergy, mo) =>
        `Bij ${km} km/jr verlaagt ${bestPt.toLowerCase()} t.o.v. ${worstPt.toLowerCase()} de ${
          isEnergy ? 'energiekosten' : 'totale kosten'
        } met ${mo} per maand.`,
      lowestMonthlyEnergy: 'Laagste energie / mnd',
      lowestMonthlyTco: 'Laagste TCO / mnd',
      lowestAnnualEnergy: 'Laagste jaarlijkse energie',
      sensitivityKicker: 'Gevoeligheid & Winnaarszones',
      mapTitle2D: 'Energieprijskaart: Brandstof vs. Laden',
      mapCopy2D:
        'Vergelijkt puur energiekosten (zonder afschrijving, onderhoud of belasting) met brandstofprijs op de X-as en laadtarief op de Y-as. Stippellijnen tonen exacte gelijkheid.',
      switchesAt: 'Winnaar wisselt bij',
      andWord: 'en',
      winsEveryZone: (pt) => `${pt} wint in elke prijszone in dit bereik.`,
      sensitivityCopy1D: (isEnergy) =>
        `Elke gekleurde zone toont welke auto de laagste ${
          isEnergy ? 'energiekosten' : 'totale kosten'
        } biedt. Schakel naar de kaart Brandstof × Laden om beide tegelijk te bekijken.`,
      analyzeBetween: 'Analyseer tussen (3 auto’s actief)',
      all3: 'Alle 3',
      zones2DHead: '2D Kleurzones & Grenslijnen',
      nowWord: 'Nu',
      ofMap: (pct) => `${pct}% v/d kaart`,
      atFuelLabel: (yStr, xStr) => `${yStr}/kWh @ ${xStr}/L`,
      boundaryAcrossMap: 'Grens over kaart',
      coloredWinnerZones: 'Gekleurde Winnaarszones',
      breakEvenHead: 'Omslagpunten',
      currentWord: 'Huidig',
      breakPrefix: 'Omslag',
      beatsAbove: (above, below) => `${above} verslaat ${below} boven`,
      view1DEnergy: '1D Energie-curve',
      view1DTco: '1D TCO-curve',
      view2DEnergy: 'Alleen Energie: Brandstof × Laden (2D)',
      moUnit: 'mnd',
      yrUnit: 'jr',
      kmUnit: 'km',
      calculateBtn: 'Berekenen',
      settingsPendingNote: 'Instellingen gewijzigd — klik op Berekenen voor nieuw resultaat.',
      settingsSyncedNote: 'Vergelijking komt overeen met huidige instellingen.',
      simBoxTitle: 'Energiekosten-scenario simuleren',
      simBoxSub: 'Pas hier tarieven aan en klik op Berekenen om de grafiek bij te werken.',
      simResetBtn: 'Herstel naar berekend',
      simPendingNote: 'Scenario gewijzigd — klik op Berekenen voor nieuwe grafiek.',
      simSyncedNote: 'Grafiek komt overeen met bovenstaand scenario.',
    },
    charts: {
      cumulEnergyTitle: 'Cumulatieve Energiekosten over de Tijd',
      cumulTcoTitle: 'Cumulatieve Totale Kosten over de Tijd',
      cumulEnergySub: (y) =>
        `Brandstof & gewogen AC/DC-laden incl. laadverliezen en vaste kosten (Jaar 0 tot Jaar ${y})`,
      cumulTcoSub: (y) =>
        `Netto afschrijving, laadpaal, energie, onderhoud, belasting en verzekering (Jaar 0 tot Jaar ${y})`,
      yrTick: (yr) => `Jr ${yr}`,
      parityTag: (yr) => `Gelijk Jr ${yr}`,
      hoverYearLabel: (yr) => `Jaar ${yr}`,
      afterYearsLabel: (y) => `Na ${y} jaar`,
      sensEnergyTitle: (y) => `Energie-gevoeligheid (${y} jaar)`,
      sensTcoTitle: (y) => `Break-even Gevoeligheid (${y}-jr TCO)`,
      sensSubFuelSpread:
        'Kleurzones tonen de winnaar per literprijs (€/L); beweeg erover om te inspecteren',
      sensSubFuel:
        'Kleurzones tonen de winnaar per brandstofprijs (€/L); beweeg erover om te inspecteren',
      sensSubHomeAc:
        'Variatie van Thuis-AC laadtarief (€/kWh); beweeg erover om te inspecteren',
      sensSubPublicDc:
        'Variatie van Publiek DC snellaadtarief (€/kWh); beweeg erover om te inspecteren',
      sensSubBlended:
        'Variatie van het gewogen stroomtarief (€/kWh) over uw volledige laadmix',
      tabFuel: 'Brandstof (€/L)',
      tabHomeAc: 'Thuis AC',
      tabPublicDc: 'Publiek DC',
      tabAllKwh: 'Alle kWh',
      breakingLineLegend: 'Grenslijn (winnaar wisselt)',
      bestPrefix: 'Beste',
      nowLabel: 'Nu',
      atLabel: 'Bij',
      currentLabel: 'Huidig',
      zoneWord: 'zone',
      equalEnergyLegend: 'Grenslijn (gelijke energiekosten)',
      fuelAxisTitle: 'Brandstofprijs (€/L) →',
      chargingAxisTitle: 'Laden (€/kWh) →',
    },
  },
  fr: {
    locale: 'fr-FR',
    nav: {
      powertrains: 'Motorisations',
      energySplit: 'Coût Énergie',
      costDrivers: 'Facteurs Clés',
      compare: 'Comparer',
      cta: 'Comparer',
      menuLabel: 'Ouvrir le menu',
      skipToContent: 'Aller au contenu principal',
    },
    hero: {
      kicker: 'Essence · Diesel · Hybride · 100 % Électrique',
      title: 'Visualisez le coût réel de chaque kilomètre.',
      sub: 'Comparez les dépenses annuelles d’énergie et le coût total de possession (TCO) sur 5 ans entre deux ou trois véhicules selon vos trajets et tarifs locaux.',
      primaryCta: 'Comparer 2 ou 3 voitures',
      secondaryCta: 'Explorer les moteurs',
      energyPer100: 'Énergie / 100 km',
      annualEnergy: 'Énergie / an',
      monthlyTco5Yr: 'TCO 5 ans / mois',
      swatchAriaLabel: 'Aperçu de motorisation',
    },
    showcase: {
      ariaLabel: 'Vitrine des motorisations',
      stages: {
        gasoline: {
          title: 'Essence',
          highlights: [
            'Prix d’achat initial le plus bas',
            '6,8 L / 100 km en consommation de référence',
            'Ravitaillement rapide partout sur le réseau',
          ],
        },
        diesel: {
          title: 'Diesel',
          highlights: [
            'Endurance élevée sur longs trajets autoroutiers',
            '5,2 L / 100 km en consommation mixte',
            'Pertinent au-delà de 25 000 km / an',
          ],
        },
        hybrid: {
          title: 'Hybride',
          highlights: [
            'Récupération d’énergie en conduite urbaine',
            '4,7 L / 100 km de consommation moyenne',
            'Double polyvalence thermique et électrique',
          ],
        },
        electric: {
          title: '100 % Électrique',
          highlights: [
            'Coût énergétique au kilomètre minimal',
            '16,8 kWh / 100 km de consommation',
            'Entretien réduit et zéro émission locale',
          ],
        },
      },
    },
    slider: {
      gasLabel: 'Essence · 11,90 € / 100 km',
      evLabel: 'Borne Électrique · 5,38 € / 100 km',
      ariaLabel: 'Comparer coût électrique et thermique',
      title: 'Prix à la pompe vs. kilowattheure à domicile.',
      sub: 'À 15 000 km/an, recharger une berline électrique chez soi réduit la facture d’énergie d’environ 980 €/an par rapport à l’essence — avant même l’entretien et les taxes.',
      tabListAria: 'Comparaison source d’énergie',
      wallboxTab: 'Borne Domicile',
      pumpTab: 'Pompe Carburant',
      evMetricLabel: 'Électrique / 100 km',
      gasMetricLabel: 'Essence / 100 km',
    },
    bento: {
      title: 'Ce qui pèse dans le coût total.',
      tile1Title: 'Décote & Revente',
      tile1Sub:
        'Souvent 45 à 55 % du coût sur 5 ans — le prix catalogue seul ne suffit jamais',
      tile2Title: 'Entretien & Usure',
      tile2Sub:
        'Freinage régénératif et moins de fluides allègent les passages en atelier',
      tile3Title: '15 000 km / an',
      tile3Sub: 'Base 60 mois sur 4 motorisations',
      tile3Meta: 'WLTP · Mix Réel',
    },
    seo: {
      title: 'Fahrbilanz – Comparateur Énergie & TCO Électrique, Hybride, Essence',
      description:
        'Comparez les dépenses d’énergie et le coût total de possession (TCO) des voitures essence, diesel, hybrides et électriques avec tarifs européens et graphiques.',
    },
    footer: {
      tagline: 'Comparateur Énergie & Coût Total de Possession',
      darkMode: 'Mode Sombre',
      lightMode: 'Mode Clair',
      toggleThemeAria: 'Changer le thème',
      disclaimer:
        'Avertissement : Cette simulation est fournie à titre purement informatif. Les montants calculés ne constituent ni un conseil financier, ni un conseil fiscal ou juridique.',
      sourceAttribution: 'Source carburants : Bulletin Pétrolier de la Commission européenne',
      imprintLink: 'Mentions légales',
      privacyLink: 'Confidentialité',
      accessibilityLink: 'Accessibilité',
      cookieSettings: 'Préférences cookies',
    },
    privacy: {
      kicker: 'Confidentialité & RGPD',
      title: 'Politique de Confidentialité',
      lead: 'Fahrbilanz fonctionne localement dans votre navigateur. Aucune donnée personnelle n’est enregistrée, utilisée ni transmise à des tiers par l’outil.',
      backBtn: 'Retour au comparateur',
      updated: 'Édition novembre 2026 · Informations RGPD',
      cards: [
        {
          title: '1. Responsable du traitement',
          body: 'Responsable de la publication : Éditeur de Fahrbilanz ([Nom légal ou société], [Adresse, Code postal, Ville, Pays]). Contact protection des données : arvidvdbwbs@gmail.com.',
        },
        {
          title: '2. Aucune donnée de simulation conservée',
          body: 'Vos choix de véhicules, kilométrages et tarifs sont calculés uniquement dans la mémoire de votre navigateur. Aucun profil, historique ou compte utilisateur n’est enregistré ni vendu à des tiers.',
        },
        {
          title: '3. Hébergement & Journaux techniques (Art. 6(1)(f) RGPD)',
          body: 'Lors de l’accès au site (hébergé sur Google Cloud Run en europe-west3), l’infrastructure traite temporairement les métadonnées techniques (adresse IP, horodatage, URL, navigateur) dans des journaux de sécurité sur la base de l’intérêt légitime (Art. 6(1)(f) RGPD).',
        },
        {
          title: '4. Prix publics des carburants UE',
          body: 'Les moyennes européennes à la pompe sont chargées en lecture seule depuis le Weekly Oil Bulletin de la Commission européenne sans transmission d’identifiant personnel.',
        },
        {
          title: '5. Préférence strictement essentielle',
          body: 'Votre choix sur la bannière d’information est enregistré localement sous fahrbilanz_cookie_notice uniquement pour la masquer, sans aucun traceur.',
        },
        {
          title: '6. Vos droits RGPD',
          body: 'Conformément au RGPD (Art. 15–22 et Art. 77), vous disposez d’un droit d’accès, de rectification, d’effacement, de limitation et d’un droit de réclamation auprès de votre autorité de contrôle (ex. CNIL). Contact : arvidvdbwbs@gmail.com.',
        },
      ],
    },
    imprint: {
      kicker: 'Mentions Légales & Sources',
      title: 'Mentions Légales & Conditions',
      lead: 'Informations légales sur l’éditeur, conditions d’utilisation non contractuelles et attribution officielle des données carburants pour Fahrbilanz.',
      updated: 'Édition novembre 2026 · Préparé pour publication',
      cards: [
        {
          title: '1. Éditeur du site',
          body: 'Service : Fahrbilanz — Comparateur Énergie & TCO · Éditeur : [Nom complet ou Raison sociale] · Adresse : [Adresse complète, Ville, Pays] · E-mail : arvidvdbwbs@gmail.com.',
        },
        {
          title: '2. Immatriculation & TVA (si activité commerciale)',
          body: 'En cas d’exploitation commerciale, complétez ici votre numéro SIREN/SIRET, RCS et numéro de TVA intracommunautaire avant mise en ligne sur votre domaine final.',
        },
        {
          title: '3. Conditions d’utilisation',
          body: 'Les simulations fournies par Fahrbilanz sont purement indicatives et pédagogiques ; elles ne sauraient engager la responsabilité de l’éditeur ni remplacer un conseil financier, fiscal ou juridique.',
        },
        {
          title: '4. Attribution des données & Droits',
          body: 'Les tarifs européens essence et diesel proviennent du Bulletin Pétrolier Hebdomadaire de la Commission européenne (energy.ec.europa.eu). Interface et schémas © 2026 Fahrbilanz.',
        },
      ],
    },
    accessibility: {
      kicker: 'Accessibilité Numérique · WCAG 2.1 AA',
      title: 'Déclaration d’Accessibilité',
      lead: 'Fahrbilanz est conçu pour rendre la comparaison des motorisations accessible au clavier, aux lecteurs d’écran, sur mobile et avec réduction de mouvement.',
      updated: 'Évaluation novembre 2026 · Objectif WCAG 2.1 AA',
      cards: [
        {
          title: '1. Conformité visée',
          body: 'Nous visons la conformité aux directives WCAG 2.1 niveau AA ainsi qu’aux exigences de l’Acte européen sur l’accessibilité (EAA).',
        },
        {
          title: '2. Mesures mises en œuvre',
          body: 'Balisage sémantique, lien d’évitement vers le contenu principal, contours de focus visibles, attributs ARIA, zones tactiles de 44 px sur mobile, contrastes élevés clair/sombre et prise en charge de prefers-reduced-motion.',
        },
        {
          title: '3. Données graphiques accessibles',
          body: 'Chaque graphique SVG interactif s’accompagne d’un tableau textuel des zones gagnantes, seuils de bascule et valeurs en direct sans nécessiter de survol souris.',
        },
        {
          title: '4. Signaler un défaut d’accessibilité',
          body: 'Pour signaler une difficulté d’accès ou demander une alternative accessible, contactez-nous par e-mail à arvidvdbwbs@gmail.com.',
        },
      ],
    },
    cookies: {
      title: 'Cookies & Confidentialité',
      body: 'Fahrbilanz fonctionne localement sans enregistrer, utiliser ni céder vos données à des tiers. Un stockage technique minimal retient uniquement votre choix.',
      privacyLink: 'Confidentialité',
      essentialBtn: 'Essentiels seuls',
      allowBtn: 'Autoriser les cookies',
    },
    powertrains: {
      gasoline: {
        label: 'Essence',
        shortLabel: 'Essence',
        tagline: 'Prix d’achat minimal, plein familier',
      },
      diesel: {
        label: 'Diesel',
        shortLabel: 'Diesel',
        tagline: 'Rendement autoroutier pour grands rouleurs',
      },
      hybrid: {
        label: 'Hybride',
        shortLabel: 'Hybride',
        tagline: 'Économies en ville et autonomie illimitée',
      },
      electric: {
        label: '100 % Électrique',
        shortLabel: 'Électrique',
        tagline: 'Coût énergétique minimal et faible usure des freins',
      },
    },
    bodyClasses: {
      compact: 'Compacte',
      sedan: 'Berline',
      suv: 'SUV',
    },
    studio: {
      title: 'Comparez 2 ou 3 voitures.',
      sub: 'Choisissez entre coût d’énergie pur ou coût total de possession (TCO), sélectionnez vos véhicules sur les croquis et ajustez les tarifs.',
      twoCars: '2 Voitures',
      threeCars: '3 Voitures',
      carCountAria: 'Nombre de voitures à comparer',
      quickGasEv: 'Essence vs. Électrique',
      quickGasHybEv: 'Essence vs. Hybride vs. Élec.',
      quickDieselHybEv: 'Diesel vs. Hybride vs. Élec.',
      scopeTcoTitle: 'Coût Total de Possession (TCO)',
      scopeTcoDesc:
        'Bilan complet : décote, bonus optionnel, borne, énergie & pertes de charge, entretien, taxe et assurance.',
      scopeEnergyTitle: 'Coût Énergie Uniquement',
      scopeEnergyDesc:
        'Compare carburant à la pompe et mix AC domicile, AC public et DC rapide avec pertes de charge et abonnement.',
      scopeActive: 'Actif',
      scopeSelect: 'Choisir',
      scopeAria: 'Périmètre de comparaison',
      chooseTypesAria: 'Choisir les motorisations à comparer',
      carWord: 'Voiture',
      addThird: '+ 3e voiture',
      selectWord: 'Choisir',
      fromPrice: (p) => `Dès ${p}`,
      annualDistance: 'Distance annuelle',
      horizon: 'Durée',
      yrShort: 'ans',
      yrButton: (yr) => (yr === 1 ? '1 an' : `${yr} ans`),
      gasolineRate: 'Essence (€/L)',
      dieselRate: 'Diesel (€/L)',
      fuelMarketCountry: 'Marché carburant par pays',
      euAverageOption: 'Moyenne UE-27',
      autoTag: 'Par défaut',
      applyLiveRate: 'Appliquer tarif live',
      liveSourcePrefix: 'Bulletin Pétrolier CE',
      loadingFeed: 'Chargement des prix régionaux…',
      feedOffline: 'Moyennes européennes de référence actives',
      elecTariffsTitle: 'Tarifs Électriques & Mix de Charge',
      mixHome: '80/15/5 Domicile',
      mixMixed: '50/30/20 Mixte',
      mixPublic: '0/50/50 Public',
      mixCustom: 'Personnalisé',
      mixTotalNote: (total) =>
        total === 100 ? '100% total' : `${total}% total (normalisé)`,
      homeAcLabel: 'Domicile AC (Bas)',
      publicAcLabel: 'Public AC (Moyen)',
      publicDcLabel: 'Public DC (Élevé)',
      shareSuffix: '% part',
      lossesFeesTitle: 'Pertes, Abonnement & Borne',
      avgPrefix: 'Moy.',
      chargeLossesLabel: 'Pertes charge (%)',
      fixedFeeLabel: 'Abonnement (€/mois)',
      wallboxLabel: 'Borne 1× (€)',
      winnerKicker: 'Gagnant du comparatif',
      energyOnlyTag: 'Énergie Uniquement',
      tcoSuffix: (years) => `TCO ${years} ans`,
      winsAt: (num, pt, body, total) =>
        `Voiture ${num} : ${pt} (${body}) gagne à ${total}`,
      savesSummary: (gap, monthly, rIdx, rPt, totalSav, worstPt) =>
        `Économise ${gap} (${monthly}/mois) devant Voiture ${rIdx} (${rPt}) et ${totalSav} face à ${worstPt}.`,
      tiedSummary: 'Actuellement à égalité selon vos paramètres.',
      winnerPerMonth: 'Gagnant / mois',
      winnerPerKm: 'Gagnant / km',
      blendedPerKwh: 'Mixte / kWh',
      winnerBestValue: 'Gagnant · Meilleur choix',
      vsWinner: (delta) => `+${delta} vs. gagnant`,
      reset: 'Réinit.',
      energySpendYr: (y) => `Énergie sur ${y} ans`,
      totalCostYr: (y) => `Coût Total ${y} ans`,
      annualEnergyLabel: 'Énergie / an',
      energySpendLabel: 'Dépense Énergie',
      consumptionLabel: (u) => `Conso. (${u})`,
      purchasePriceLabel: 'Prix d’achat (€)',
      serviceYrLabel: 'Entretien / an (€)',
      roadTaxYrLabel: 'Taxe / an (€)',
      insuranceYrLabel: 'Assurance / an (€)',
      resaleLabel: 'Revente 5 ans (%)',
      optionalSubsidy: 'Bonus optionnel',
      depreciationLabel: (loss, note) => `Décote (${loss}% perte${note})`,
      subsidyNote: (amt) => ` · −${amt} bonus`,
      oneTimeWallbox: 'Borne domicile (1×)',
      electricityLine: (billed, rate) =>
        `Électricité (${billed} kWh/100km facturés @ ${rate}/kWh)`,
      fuelLine: (cons, rate) => `Carburant (${cons} L/100km @ ${rate}/L)`,
      fixedChargingFeeLine: (mo) => `Abonnement borne (${mo}/mois)`,
      maintenanceLine: (y) => `Entretien (${y} ans)`,
      roadTaxLine: (y) => `Taxe (${y} ans)`,
      insuranceLine: (y) => `Assurance (${y} ans)`,
      co2PerYr: 'CO₂ estimé / an',
      energyBalanceKicker: 'Bilan Énergétique',
      ownershipBalanceKicker: 'Bilan de Possession',
      leadsByOverYears: (pt, body, sav, y) =>
        `${pt} (${body}) mène de ${sav} sur ${y} ans.`,
      insightCopy: (km, bestPt, worstPt, isEnergy, mo) =>
        `À ${km} km/an, choisir ${bestPt.toLowerCase()} plutôt que ${worstPt.toLowerCase()} réduit ${
          isEnergy ? 'la facture d’énergie' : 'le coût total'
        } de ${mo} par mois.`,
      lowestMonthlyEnergy: 'Énergie mensuelle min.',
      lowestMonthlyTco: 'TCO mensuel min.',
      lowestAnnualEnergy: 'Facture énergie annuelle min.',
      sensitivityKicker: 'Sensibilité & Zones Gagnantes',
      mapTitle2D: 'Carte énergie : Carburant vs. Recharge',
      mapCopy2D:
        'Compare uniquement les coûts d’énergie (hors décote, entretien et taxes) avec le carburant en abscisse et la recharge en ordonnée. Les pointillés marquent l’égalité exacte.',
      switchesAt: 'Bascule à',
      andWord: 'et',
      winsEveryZone: (pt) => `${pt} domine toute la plage de prix.`,
      sensitivityCopy1D: (isEnergy) =>
        `Chaque zone colorée indique le véhicule offrant le plus bas ${
          isEnergy ? 'coût énergétique' : 'coût total'
        }. Passez à la carte Carburant × Recharge pour comparer les deux simultanément.`,
      analyzeBetween: 'Analyser entre (3 voitures actives)',
      all3: 'Les 3',
      zones2DHead: 'Zones 2D & Lignes de Rupture',
      nowWord: 'Actuel',
      ofMap: (pct) => `${pct}% de la carte`,
      atFuelLabel: (yStr, xStr) => `${yStr}/kWh @ ${xStr}/L`,
      boundaryAcrossMap: 'Frontière sur carte',
      coloredWinnerZones: 'Zones Colorées Gagnantes',
      breakEvenHead: 'Seuils de Bascule',
      currentWord: 'Actuel',
      breakPrefix: 'Seuil',
      beatsAbove: (above, below) => `${above} bat ${below} dès`,
      view1DEnergy: 'Courbe Énergie 1D',
      view1DTco: 'Courbe TCO 1D',
      view2DEnergy: 'Énergie seule : Carburant × Recharge (2D)',
      moUnit: 'mois',
      yrUnit: 'ans',
      kmUnit: 'km',
      calculateBtn: 'Calculer',
      settingsPendingNote: 'Paramètres modifiés — cliquez sur Calculer pour mettre à jour.',
      settingsSyncedNote: 'Résultats alignés sur les paramètres actuels.',
      simBoxTitle: 'Simuler un scénario énergétique',
      simBoxSub: 'Ajustez ces tarifs puis cliquez sur Calculer pour actualiser le graphique.',
      simResetBtn: 'Réinitialiser',
      simPendingNote: 'Scénario modifié — cliquez sur Calculer pour mettre à jour.',
      simSyncedNote: 'Le graphique correspond au scénario ci-dessus.',
    },
    charts: {
      cumulEnergyTitle: 'Dépense Énergétique Cumulée',
      cumulTcoTitle: 'Coût Cumulé dans le Temps',
      cumulEnergySub: (y) =>
        `Carburant & recharge AC/DC mixte avec pertes et abonnement (Année 0 à ${y})`,
      cumulTcoSub: (y) =>
        `Décote nette, borne, énergie, entretien, taxe et assurance (Année 0 à ${y})`,
      yrTick: (yr) => `An ${yr}`,
      parityTag: (yr) => `Parité An ${yr}`,
      hoverYearLabel: (yr) => `Année ${yr}`,
      afterYearsLabel: (y) => `Après ${y} ans`,
      sensEnergyTitle: (y) => `Sensibilité Énergie (${y} ans)`,
      sensTcoTitle: (y) => `Seuil de Rentabilité (TCO ${y} ans)`,
      sensSubFuelSpread:
        'Zones colorées par gagnant selon le prix à la pompe (€/L) ; survolez pour inspecter',
      sensSubFuel:
        'Zones colorées par gagnant selon le carburant (€/L) ; survolez pour inspecter',
      sensSubHomeAc:
        'Variation du tarif Domicile AC (€/kWh) ; survolez pour inspecter',
      sensSubPublicDc:
        'Variation du tarif Public DC rapide (€/kWh) ; survolez pour inspecter',
      sensSubBlended:
        'Variation du tarif électrique mixte (€/kWh) sur l’ensemble de votre mix',
      tabFuel: 'Carburant (€/L)',
      tabHomeAc: 'Domicile AC',
      tabPublicDc: 'Public DC',
      tabAllKwh: 'Mix kWh',
      breakingLineLegend: 'Ligne de rupture (changement)',
      bestPrefix: 'Top',
      nowLabel: 'Act.',
      atLabel: 'À',
      currentLabel: 'Actuel',
      zoneWord: 'zone',
      equalEnergyLegend: 'Ligne de rupture (énergie égale)',
      fuelAxisTitle: 'Carburant (€/L) →',
      chargingAxisTitle: 'Recharge (€/kWh) →',
    },
  },
};
