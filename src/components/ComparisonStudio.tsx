import { useEffect, useRef, useState } from 'react';
import {
  BodyClassId,
  CAR_PRESETS,
  CarSlotConfig,
  ComparisonMode,
  GlobalAssumptions,
  POWERTRAIN_META,
  POWERTRAIN_ORDER,
  PowertrainId,
  SensitivityMode,
  calculateTco,
  computeEnergyMap2D,
  computeSensitivity,
  createSlotFromPreset,
  formatEur,
  getBlendedElectricityPrice,
  getUnitPrice,
  scaledResalePct,
} from '../data/cars';
import { Language, TRANSLATIONS } from '../i18n/translations';
import { LiveFuelFeed, fetchLiveFuelFeed } from '../services/fuelPrices';
import { CarSketch } from './CarSketch';
import { ComparisonChart } from './ComparisonChart';
import { EnergyMap2DChart } from './EnergyMap2DChart';
import { SensitivityChart } from './SensitivityChart';

interface ComparisonStudioProps {
  isDark: boolean;
  lang: Language;
}

const DEFAULT_SLOTS: CarSlotConfig[] = [
  createSlotFromPreset('slot-1', 'gasoline', 'sedan'),
  createSlotFromPreset('slot-2', 'hybrid', 'sedan'),
  createSlotFromPreset('slot-3', 'electric', 'sedan'),
];

const LANG_DEFAULT_COUNTRY: Record<Language, string> = {
  en: 'EU',
  de: 'DE',
  nl: 'NL',
  fr: 'FR',
};

export function ComparisonStudio({ isDark, lang }: ComparisonStudioProps) {
  const t = TRANSLATIONS[lang];
  const [compareCount, setCompareCount] = useState<2 | 3>(3);
  const [slots, setSlots] = useState<CarSlotConfig[]>(DEFAULT_SLOTS);
  const [customMixMode, setCustomMixMode] = useState<boolean>(false);
  const [simCustomMixMode, setSimCustomMixMode] = useState<boolean>(false);
  const [sensitivityView, setSensitivityView] = useState<'1d' | '2d'>('1d');
  const [sensitivityMode, setSensitivityMode] =
    useState<SensitivityMode>('fuel');
  const [sensitivityScope, setSensitivityScope] = useState<
    'all' | '0-1' | '0-2' | '1-2'
  >('all');
  const [assumptions, setAssumptions] = useState<GlobalAssumptions>({
    comparisonMode: 'energy',
    annualKm: 15000,
    years: 5,
    gasolinePrice: 1.75,
    dieselPrice: 1.68,
    homeAcPrice: 0.3,
    publicAcPrice: 0.49,
    publicDcPrice: 0.69,
    homeAcShare: 70,
    publicAcShare: 20,
    publicDcShare: 10,
    chargeLossPct: 10,
    monthlyChargingFee: 5,
    wallboxCost: 1200,
  });
  const [draftAssumptions, setDraftAssumptions] =
    useState<GlobalAssumptions>(assumptions);
  const initialSimRates = {
    gasolinePrice: assumptions.gasolinePrice,
    dieselPrice: assumptions.dieselPrice,
    homeAcPrice: assumptions.homeAcPrice,
    publicAcPrice: assumptions.publicAcPrice,
    publicDcPrice: assumptions.publicDcPrice,
    homeAcShare: assumptions.homeAcShare,
    publicAcShare: assumptions.publicAcShare,
    publicDcShare: assumptions.publicDcShare,
  };
  const [simRates, setSimRates] = useState(initialSimRates);
  const [draftSimRates, setDraftSimRates] = useState(initialSimRates);
  const [fuelFeed, setFuelFeed] = useState<LiveFuelFeed | null>(null);
  const [fuelFeedLoading, setFuelFeedLoading] = useState<boolean>(true);
  const [selectedCountry, setSelectedCountry] = useState<string>(
    LANG_DEFAULT_COUNTRY[lang]
  );
  const [fuelCustomEdited, setFuelCustomEdited] = useState<boolean>(false);
  const userEditedFuelRef = useRef<boolean>(false);
  const userSelectedCountryRef = useRef<boolean>(false);
  const initialFeedSyncedRef = useRef<boolean>(false);
  const columnsRef = useRef<HTMLDivElement | null>(null);
  const simChartRef = useRef<HTMLDivElement | null>(null);

  const defaultCountryForLang = LANG_DEFAULT_COUNTRY[lang];

  const resolveCountryInFeed = (feed: LiveFuelFeed, code: string) => {
    if (code === 'EU') return 'EU';
    return feed.countries.some((c) => c.countryCode === code) ? code : 'EU';
  };

  const getPricesForCountry = (feed: LiveFuelFeed, code: string) => {
    const entry = feed.countries.find((c) => c.countryCode === code);
    const source = entry ?? feed.euAverage;
    return {
      gasoline: Number(source.petrolPrice.toFixed(2)),
      diesel: Number(source.dieselPrice.toFixed(2)),
    };
  };

  const hasPendingSettings =
    draftAssumptions.annualKm !== assumptions.annualKm ||
    draftAssumptions.years !== assumptions.years ||
    draftAssumptions.gasolinePrice !== assumptions.gasolinePrice ||
    draftAssumptions.dieselPrice !== assumptions.dieselPrice ||
    draftAssumptions.homeAcPrice !== assumptions.homeAcPrice ||
    draftAssumptions.publicAcPrice !== assumptions.publicAcPrice ||
    draftAssumptions.publicDcPrice !== assumptions.publicDcPrice ||
    draftAssumptions.homeAcShare !== assumptions.homeAcShare ||
    draftAssumptions.publicAcShare !== assumptions.publicAcShare ||
    draftAssumptions.publicDcShare !== assumptions.publicDcShare ||
    draftAssumptions.chargeLossPct !== assumptions.chargeLossPct ||
    draftAssumptions.monthlyChargingFee !== assumptions.monthlyChargingFee ||
    draftAssumptions.wallboxCost !== assumptions.wallboxCost;

  useEffect(() => {
    let cancelled = false;
    fetchLiveFuelFeed().then((feed) => {
      if (cancelled) return;
      setFuelFeedLoading(false);
      if (!feed) return;
      setFuelFeed(feed);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Prefill Country Fuel Market & Gasoline/Diesel rates from top-right language setting
  useEffect(() => {
    if (!fuelFeed) return;
    if (!userSelectedCountryRef.current) {
      const targetCode = resolveCountryInFeed(fuelFeed, defaultCountryForLang);
      setSelectedCountry(targetCode);
      if (!userEditedFuelRef.current) {
        const rates = getPricesForCountry(fuelFeed, targetCode);
        setDraftAssumptions((prev) => ({
          ...prev,
          gasolinePrice: rates.gasoline,
          dieselPrice: rates.diesel,
        }));
        if (!initialFeedSyncedRef.current || !hasPendingSettings) {
          initialFeedSyncedRef.current = true;
          setAssumptions((prev) => ({
            ...prev,
            gasolinePrice: rates.gasoline,
            dieselPrice: rates.diesel,
          }));
          setSimRates((prev) => ({
            ...prev,
            gasolinePrice: rates.gasoline,
            dieselPrice: rates.diesel,
          }));
          setDraftSimRates((prev) => ({
            ...prev,
            gasolinePrice: rates.gasoline,
            dieselPrice: rates.diesel,
          }));
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fuelFeed, defaultCountryForLang]);

  const handleSelectCountry = (code: string) => {
    userSelectedCountryRef.current = code !== defaultCountryForLang;
    setSelectedCountry(code);
    if (!fuelFeed) return;
    const rates = getPricesForCountry(fuelFeed, code);
    userEditedFuelRef.current = false;
    setFuelCustomEdited(false);
    setDraftAssumptions((prev) => ({
      ...prev,
      gasolinePrice: rates.gasoline,
      dieselPrice: rates.diesel,
    }));
  };

  const handleCalculate = () => {
    const nextSimRates = {
      gasolinePrice: draftAssumptions.gasolinePrice,
      dieselPrice: draftAssumptions.dieselPrice,
      homeAcPrice: draftAssumptions.homeAcPrice,
      publicAcPrice: draftAssumptions.publicAcPrice,
      publicDcPrice: draftAssumptions.publicDcPrice,
      homeAcShare: draftAssumptions.homeAcShare,
      publicAcShare: draftAssumptions.publicAcShare,
      publicDcShare: draftAssumptions.publicDcShare,
    };
    setAssumptions(draftAssumptions);
    setSimCustomMixMode(customMixMode);
    setSimRates(nextSimRates);
    setDraftSimRates(nextSimRates);
    requestAnimationFrame(() => {
      columnsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const handleSimCalculate = () => {
    setSimRates(draftSimRates);
    requestAnimationFrame(() => {
      simChartRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const activeCars = slots.slice(0, compareCount);
  const results = activeCars.map((car) => calculateTco(car, assumptions));

  const sensitivityCars =
    compareCount === 2 || sensitivityScope === 'all'
      ? activeCars
      : sensitivityScope === '0-1'
        ? [activeCars[0], activeCars[1]]
        : sensitivityScope === '0-2'
          ? [activeCars[0], activeCars[2]]
          : [activeCars[1], activeCars[2]];

  const simAssumptions: GlobalAssumptions = {
    ...assumptions,
    ...simRates,
  };
  const draftSimAssumptions: GlobalAssumptions = {
    ...assumptions,
    ...draftSimRates,
  };
  const draftSimBlendedElecPrice =
    getBlendedElectricityPrice(draftSimAssumptions);

  const hasPendingSim =
    Math.abs(draftSimRates.gasolinePrice - simRates.gasolinePrice) > 0.001 ||
    Math.abs(draftSimRates.dieselPrice - simRates.dieselPrice) > 0.001 ||
    Math.abs(draftSimRates.homeAcPrice - simRates.homeAcPrice) > 0.001 ||
    Math.abs(draftSimRates.publicAcPrice - simRates.publicAcPrice) > 0.001 ||
    Math.abs(draftSimRates.publicDcPrice - simRates.publicDcPrice) > 0.001 ||
    draftSimRates.homeAcShare !== simRates.homeAcShare ||
    draftSimRates.publicAcShare !== simRates.publicAcShare ||
    draftSimRates.publicDcShare !== simRates.publicDcShare;

  const isSimModified =
    Math.abs(draftSimRates.gasolinePrice - assumptions.gasolinePrice) > 0.001 ||
    Math.abs(draftSimRates.dieselPrice - assumptions.dieselPrice) > 0.001 ||
    Math.abs(draftSimRates.homeAcPrice - assumptions.homeAcPrice) > 0.001 ||
    Math.abs(draftSimRates.publicAcPrice - assumptions.publicAcPrice) > 0.001 ||
    Math.abs(draftSimRates.publicDcPrice - assumptions.publicDcPrice) > 0.001 ||
    draftSimRates.homeAcShare !== assumptions.homeAcShare ||
    draftSimRates.publicAcShare !== assumptions.publicAcShare ||
    draftSimRates.publicDcShare !== assumptions.publicDcShare ||
    Math.abs(simRates.gasolinePrice - assumptions.gasolinePrice) > 0.001 ||
    Math.abs(simRates.dieselPrice - assumptions.dieselPrice) > 0.001 ||
    Math.abs(simRates.homeAcPrice - assumptions.homeAcPrice) > 0.001 ||
    Math.abs(simRates.publicAcPrice - assumptions.publicAcPrice) > 0.001 ||
    Math.abs(simRates.publicDcPrice - assumptions.publicDcPrice) > 0.001 ||
    simRates.homeAcShare !== assumptions.homeAcShare ||
    simRates.publicAcShare !== assumptions.publicAcShare ||
    simRates.publicDcShare !== assumptions.publicDcShare;

  const sensitivity = computeSensitivity(
    sensitivityCars,
    simAssumptions,
    sensitivityMode
  );
  const energyMap2D = computeEnergyMap2D(sensitivityCars, simAssumptions);

  const isEnergyOnly = assumptions.comparisonMode === 'energy';
  const blendedElecPrice = getBlendedElectricityPrice(assumptions);
  const draftBlendedElecPrice = getBlendedElectricityPrice(draftAssumptions);

  const minActiveTotal = Math.min(...results.map((r) => r.activeTotal));
  const maxActiveTotal = Math.max(...results.map((r) => r.activeTotal), 1);
  const minEnergyCost = Math.min(...results.map((r) => r.totalEnergyCost));

  const bestIdx = results.findIndex((r) => r.activeTotal === minActiveTotal);
  const worstIdx = results.reduce(
    (maxI, r, i, arr) => (r.activeTotal > arr[maxI].activeTotal ? i : maxI),
    0
  );
  const bestCar = activeCars[bestIdx];
  const worstCar = activeCars[worstIdx];
  const bestRes = results[bestIdx];
  const worstRes = results[worstIdx];
  const totalSavings = worstRes.activeTotal - bestRes.activeTotal;

  const sortedByCost = results
    .map((r, i) => ({ idx: i, total: r.activeTotal }))
    .sort((a, b) => a.total - b.total);
  const runnerUp = sortedByCost[1];
  const runnerUpGap = runnerUp ? runnerUp.total - bestRes.activeTotal : 0;

  const hasElectric = activeCars.some((c) => c.powertrain === 'electric');

  const handleSketchTypeClick = (pt: PowertrainId) => {
    const existingIdx = activeCars.findIndex((c) => c.powertrain === pt);

    if (existingIdx >= 0) {
      if (compareCount === 3) {
        const remaining = activeCars.filter((_, i) => i !== existingIdx);
        setCompareCount(2);
        setSlots([remaining[0], remaining[1], slots[2]]);
      }
      return;
    }

    if (compareCount === 2) {
      const nextThird = createSlotFromPreset(
        'slot-3',
        pt,
        activeCars[0].bodyClass
      );
      setSlots([activeCars[0], activeCars[1], nextThird]);
      setCompareCount(3);
    } else {
      setSlots((prev) => [
        prev[0],
        prev[1],
        createSlotFromPreset('slot-3', pt, prev[2].bodyClass),
      ]);
    }
  };

  const applyQuickPreset = (types: PowertrainId[]) => {
    const count = types.length === 2 ? 2 : 3;
    setCompareCount(count);
    setSlots((prev) => [
      createSlotFromPreset('slot-1', types[0], prev[0].bodyClass),
      createSlotFromPreset('slot-2', types[1], prev[1].bodyClass),
      createSlotFromPreset('slot-3', types[2] ?? 'electric', prev[2].bodyClass),
    ]);
  };

  const updateSlotPowertrain = (idx: number, nextPt: PowertrainId) => {
    setSlots((prev) =>
      prev.map((slot, i) =>
        i === idx
          ? createSlotFromPreset(slot.slotId, nextPt, slot.bodyClass)
          : slot
      )
    );
  };

  const updateSlotBodyClass = (idx: number, nextBody: BodyClassId) => {
    setSlots((prev) =>
      prev.map((slot, i) =>
        i === idx
          ? createSlotFromPreset(slot.slotId, slot.powertrain, nextBody)
          : slot
      )
    );
  };

  const updateSlotField = (
    idx: number,
    field: keyof Pick<
      CarSlotConfig,
      | 'purchasePrice'
      | 'subsidyAmount'
      | 'consumption'
      | 'annualService'
      | 'annualTax'
      | 'annualInsurance'
      | 'resalePct'
    >,
    rawValue: number
  ) => {
    const safeValue = Number.isFinite(rawValue) ? Math.max(0, rawValue) : 0;
    setSlots((prev) =>
      prev.map((slot, i) =>
        i === idx ? { ...slot, [field]: safeValue } : slot
      )
    );
  };

  const toggleSlotSubsidy = (idx: number) => {
    setSlots((prev) =>
      prev.map((slot, i) =>
        i === idx ? { ...slot, subsidyEnabled: !slot.subsidyEnabled } : slot
      )
    );
  };

  const resetSlotToPreset = (idx: number) => {
    const target = slots[idx];
    const preset = CAR_PRESETS[target.powertrain][target.bodyClass];
    setSlots((prev) =>
      prev.map((slot, i) =>
        i === idx
          ? {
              ...slot,
              purchasePrice: preset.purchasePrice,
              subsidyEnabled: false,
              subsidyAmount: preset.defaultSubsidy,
              consumption: preset.consumption,
              annualService: preset.annualService,
              annualTax: preset.annualTax,
              annualInsurance: preset.annualInsurance,
              resalePct: preset.resalePct5Yr,
            }
          : slot
      )
    );
  };

  const updateChargingShare = (
    key: 'homeAcShare' | 'publicAcShare' | 'publicDcShare',
    nextVal: number
  ) => {
    const clamped = Math.max(0, Math.min(100, Math.round(nextVal)));
    if (customMixMode) {
      setDraftAssumptions((prev) => ({
        ...prev,
        [key]: clamped,
      }));
      return;
    }

    setDraftAssumptions((prev) => {
      const otherKeys = (
        ['homeAcShare', 'publicAcShare', 'publicDcShare'] as const
      ).filter((k) => k !== key);
      const remaining = 100 - clamped;
      const otherSum = prev[otherKeys[0]] + prev[otherKeys[1]];

      let v0 = 0;
      let v1 = 0;
      if (otherSum === 0) {
        v0 = Math.round(remaining / 2);
        v1 = remaining - v0;
      } else {
        v0 = Math.round((prev[otherKeys[0]] / otherSum) * remaining);
        v1 = remaining - v0;
      }

      return {
        ...prev,
        [key]: clamped,
        [otherKeys[0]]: v0,
        [otherKeys[1]]: v1,
      };
    });
  };

  const applyChargingMixPreset = (home: number, pubAc: number, pubDc: number) => {
    setCustomMixMode(false);
    setDraftAssumptions((prev) => ({
      ...prev,
      homeAcShare: home,
      publicAcShare: pubAc,
      publicDcShare: pubDc,
    }));
  };

  const totalMixPct =
    draftAssumptions.homeAcShare +
    draftAssumptions.publicAcShare +
    draftAssumptions.publicDcShare;
  const isHomePreset =
    !customMixMode &&
    draftAssumptions.homeAcShare === 80 &&
    draftAssumptions.publicAcShare === 15 &&
    draftAssumptions.publicDcShare === 5;
  const isMixedPreset =
    !customMixMode &&
    draftAssumptions.homeAcShare === 50 &&
    draftAssumptions.publicAcShare === 30 &&
    draftAssumptions.publicDcShare === 20;
  const isPublicPreset =
    !customMixMode &&
    draftAssumptions.homeAcShare === 0 &&
    draftAssumptions.publicAcShare === 50 &&
    draftAssumptions.publicDcShare === 50;

  const updateSimChargingShare = (
    key: 'homeAcShare' | 'publicAcShare' | 'publicDcShare',
    nextVal: number
  ) => {
    const clamped = Math.max(0, Math.min(100, Math.round(nextVal)));
    if (simCustomMixMode) {
      setDraftSimRates((prev) => ({
        ...prev,
        [key]: clamped,
      }));
      return;
    }

    setDraftSimRates((prev) => {
      const otherKeys = (
        ['homeAcShare', 'publicAcShare', 'publicDcShare'] as const
      ).filter((k) => k !== key);
      const remaining = 100 - clamped;
      const otherSum = prev[otherKeys[0]] + prev[otherKeys[1]];

      let v0 = 0;
      let v1 = 0;
      if (otherSum === 0) {
        v0 = Math.round(remaining / 2);
        v1 = remaining - v0;
      } else {
        v0 = Math.round((prev[otherKeys[0]] / otherSum) * remaining);
        v1 = remaining - v0;
      }

      return {
        ...prev,
        [key]: clamped,
        [otherKeys[0]]: v0,
        [otherKeys[1]]: v1,
      };
    });
  };

  const applySimChargingMixPreset = (
    home: number,
    pubAc: number,
    pubDc: number
  ) => {
    setSimCustomMixMode(false);
    setDraftSimRates((prev) => ({
      ...prev,
      homeAcShare: home,
      publicAcShare: pubAc,
      publicDcShare: pubDc,
    }));
  };

  const simTotalMixPct =
    draftSimRates.homeAcShare +
    draftSimRates.publicAcShare +
    draftSimRates.publicDcShare;
  const isSimHomePreset =
    !simCustomMixMode &&
    draftSimRates.homeAcShare === 80 &&
    draftSimRates.publicAcShare === 15 &&
    draftSimRates.publicDcShare === 5;
  const isSimMixedPreset =
    !simCustomMixMode &&
    draftSimRates.homeAcShare === 50 &&
    draftSimRates.publicAcShare === 30 &&
    draftSimRates.publicDcShare === 20;
  const isSimPublicPreset =
    !simCustomMixMode &&
    draftSimRates.homeAcShare === 0 &&
    draftSimRates.publicAcShare === 50 &&
    draftSimRates.publicDcShare === 50;

  const setComparisonMode = (mode: ComparisonMode) => {
    setDraftAssumptions((prev) => ({ ...prev, comparisonMode: mode }));
    setAssumptions((prev) => ({ ...prev, comparisonMode: mode }));
  };

  const bestMeta = POWERTRAIN_META[bestCar.powertrain];
  const bestAccent = isDark ? bestMeta.darkColor : bestMeta.color;

  return (
    <section id="compare" className="compare-section">
      <div className="container">
        <div className="compare-header-row">
          <div>
            <h2 className="section-title">{t.studio.title}</h2>
            <p className="section-sub">{t.studio.sub}</p>
          </div>

          <div className="compare-controls-right">
            <div
              className="segmented-control compare-count-toggle"
              role="tablist"
              aria-label={t.studio.carCountAria}
            >
              <button
                type="button"
                role="tab"
                aria-selected={compareCount === 2}
                className={`seg-btn${compareCount === 2 ? ' is-active' : ''}`}
                onClick={() => setCompareCount(2)}
              >
                {t.studio.twoCars}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={compareCount === 3}
                className={`seg-btn${compareCount === 3 ? ' is-active' : ''}`}
                onClick={() => setCompareCount(3)}
              >
                {t.studio.threeCars}
              </button>
            </div>

            <div className="preset-links" aria-label="Quick comparisons">
              <button
                type="button"
                className="preset-link-btn"
                onClick={() => applyQuickPreset(['gasoline', 'electric'])}
              >
                {t.studio.quickGasEv}
              </button>
              <span aria-hidden="true" className="preset-sep">
                ·
              </span>
              <button
                type="button"
                className="preset-link-btn"
                onClick={() =>
                  applyQuickPreset(['gasoline', 'hybrid', 'electric'])
                }
              >
                {t.studio.quickGasHybEv}
              </button>
              <span aria-hidden="true" className="preset-sep">
                ·
              </span>
              <button
                type="button"
                className="preset-link-btn"
                onClick={() =>
                  applyQuickPreset(['diesel', 'hybrid', 'electric'])
                }
              >
                {t.studio.quickDieselHybEv}
              </button>
            </div>
          </div>
        </div>

        {/* Clear Pre-Comparison Scope Choice: Energy Only vs Total Cost of Ownership */}
        <div
          className="scope-selector-grid"
          role="radiogroup"
          aria-label={t.studio.scopeAria}
        >
          <button
            type="button"
            role="radio"
            aria-checked={isEnergyOnly}
            className={`scope-card${isEnergyOnly ? ' is-active' : ''}`}
            onClick={() => setComparisonMode('energy')}
          >
            <div className="scope-card-head">
              <span className="scope-card-title">
                {t.studio.scopeEnergyTitle}
              </span>
              <span className="scope-card-status">
                {isEnergyOnly ? t.studio.scopeActive : t.studio.scopeSelect}
              </span>
            </div>
            <p className="scope-card-desc">{t.studio.scopeEnergyDesc}</p>
          </button>

          <button
            type="button"
            role="radio"
            aria-checked={!isEnergyOnly}
            className={`scope-card${!isEnergyOnly ? ' is-active' : ''}`}
            onClick={() => setComparisonMode('tco')}
          >
            <div className="scope-card-head">
              <span className="scope-card-title">{t.studio.scopeTcoTitle}</span>
              <span className="scope-card-status">
                {!isEnergyOnly ? t.studio.scopeActive : t.studio.scopeSelect}
              </span>
            </div>
            <p className="scope-card-desc">{t.studio.scopeTcoDesc}</p>
          </button>
        </div>

        {/* Interactive Car Type Sketch Selector */}
        <div
          className="sketch-selector-grid"
          role="group"
          aria-label={t.studio.chooseTypesAria}
        >
          {POWERTRAIN_ORDER.map((ptId) => {
            const meta = POWERTRAIN_META[ptId];
            const ptText = t.powertrains[ptId];
            const activeSlotIndices = activeCars
              .map((c, idx) => (c.powertrain === ptId ? idx : -1))
              .filter((idx) => idx >= 0);
            const isSelected = activeSlotIndices.length > 0;
            const color = isDark ? meta.darkColor : meta.color;
            const baselinePreset = CAR_PRESETS[ptId].sedan;

            return (
              <button
                key={ptId}
                type="button"
                aria-pressed={isSelected}
                className={`sketch-card${isSelected ? ' is-selected' : ''}`}
                onClick={() => handleSketchTypeClick(ptId)}
              >
                <div className="sketch-card-top">
                  <span className="sketch-card-title">{ptText.label}</span>
                  <span
                    className="sketch-card-state"
                    style={isSelected ? { color } : undefined}
                  >
                    {isSelected
                      ? activeSlotIndices
                          .map((i) => `${t.studio.carWord} ${i + 1}`)
                          .join(' · ')
                      : compareCount === 2
                        ? t.studio.addThird
                        : t.studio.selectWord}
                  </span>
                </div>

                <div className="sketch-card-art">
                  <CarSketch
                    powertrain={ptId}
                    bodyClass="sedan"
                    accentColor={color}
                    className="sketch-svg"
                  />
                </div>

                <div className="sketch-card-meta">
                  <span className="tabular-nums">
                    {baselinePreset.consumption} {meta.consumptionUnit}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">
                    {t.studio.fromPrice(
                      formatEur(CAR_PRESETS[ptId].compact.purchasePrice, 0, t.locale)
                    )}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Driving, Fuel & 3-Tier Charging Assumptions Panel */}
        <div
          className="assumptions-panel"
          aria-label={t.studio.elecTariffsTitle}
        >
          <div className="assumptions-row-top">
            <div className="assumption-field assumption-field-wide">
              <div className="assumption-label-row">
                <label htmlFor="annual-km-range" className="assumption-label">
                  {t.studio.annualDistance}
                </label>
                <span className="assumption-val tabular-nums">
                  {draftAssumptions.annualKm.toLocaleString(t.locale)}{' '}
                  {t.studio.kmUnit}/{t.studio.yrUnit}
                </span>
              </div>
              <input
                id="annual-km-range"
                type="range"
                min={5000}
                max={40000}
                step={1000}
                value={draftAssumptions.annualKm}
                onChange={(e) =>
                  setDraftAssumptions((prev) => ({
                    ...prev,
                    annualKm: Number(e.target.value),
                  }))
                }
                className="range-input"
              />
            </div>

            <div className="assumption-field">
              <span className="assumption-label">{t.studio.horizon}</span>
              <div
                className="horizon-tabs horizon-years-tabs"
                role="group"
                aria-label={t.studio.horizon}
              >
                {[1, 3, 5, 8].map((yr) => (
                  <button
                    key={yr}
                    type="button"
                    className={`horizon-btn${
                      draftAssumptions.years === yr ? ' is-active' : ''
                    }`}
                    onClick={() =>
                      setDraftAssumptions((prev) => ({ ...prev, years: yr }))
                    }
                  >
                    {t.studio.yrButton(yr)}
                  </button>
                ))}
              </div>
            </div>

            <div className="assumption-field">
              <label htmlFor="gas-price-input" className="assumption-label">
                {t.studio.gasolineRate}
              </label>
              <input
                id="gas-price-input"
                type="number"
                min={0.5}
                max={4}
                step={0.01}
                value={draftAssumptions.gasolinePrice}
                onChange={(e) => {
                  userEditedFuelRef.current = true;
                  setFuelCustomEdited(true);
                  setDraftAssumptions((prev) => ({
                    ...prev,
                    gasolinePrice: Math.max(0, Number(e.target.value)),
                  }));
                }}
                className="num-input tabular-nums"
              />
            </div>

            <div className="assumption-field">
              <label htmlFor="diesel-price-input" className="assumption-label">
                {t.studio.dieselRate}
              </label>
              <input
                id="diesel-price-input"
                type="number"
                min={0.5}
                max={4}
                step={0.01}
                value={draftAssumptions.dieselPrice}
                onChange={(e) => {
                  userEditedFuelRef.current = true;
                  setFuelCustomEdited(true);
                  setDraftAssumptions((prev) => ({
                    ...prev,
                    dieselPrice: Math.max(0, Number(e.target.value)),
                  }));
                }}
                className="num-input tabular-nums"
              />
            </div>
          </div>

          {/* Regional Live Fuel Feed Country Pre-Fill & Attribution */}
          <div className="fuel-feed-bar">
            <div className="fuel-feed-left">
              <label
                htmlFor="fuel-country-select"
                className="fuel-feed-label"
              >
                {t.studio.fuelMarketCountry}
              </label>
              {fuelFeed ? (
                <select
                  id="fuel-country-select"
                  value={selectedCountry}
                  onChange={(e) => handleSelectCountry(e.target.value)}
                  className="country-select"
                >
                  <option value="EU">
                    {t.studio.euAverageOption}
                    {defaultCountryForLang === 'EU'
                      ? ` (${t.studio.autoTag})`
                      : ''}
                  </option>
                  {fuelFeed.countries.map((c) => (
                    <option key={c.countryCode} value={c.countryCode}>
                      {c.countryName} ({c.countryCode})
                      {c.countryCode === defaultCountryForLang
                        ? ` · ${t.studio.autoTag}`
                        : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="fuel-feed-meta">
                  {fuelFeedLoading ? t.studio.loadingFeed : t.studio.feedOffline}
                </span>
              )}
            </div>

            <div className="fuel-feed-right">
              {fuelFeed && fuelCustomEdited && (
                <button
                  type="button"
                  className="reset-link"
                  onClick={() => handleSelectCountry(selectedCountry)}
                >
                  {t.studio.applyLiveRate}
                </button>
              )}
              {fuelFeed && (
                <span className="fuel-feed-meta tabular-nums">
                  {t.studio.liveSourcePrefix}
                  {fuelFeed.bulletinDate ? ` · ${fuelFeed.bulletinDate}` : ''}
                </span>
              )}
            </div>
          </div>

          {/* Split Electricity Tariffs + Charging Mix + Losses + Monthly Fee + Wallbox */}
          <div className="assumptions-row-charging">
            <div className="charging-rates-group">
              <div className="charging-group-head">
                <span className="charging-group-title">
                  {t.studio.elecTariffsTitle}
                </span>
                <div className="charging-mix-presets">
                  <button
                    type="button"
                    className={`preset-link-btn${isHomePreset ? ' is-active' : ''}`}
                    onClick={() => applyChargingMixPreset(80, 15, 5)}
                  >
                    {t.studio.mixHome}
                  </button>
                  <span aria-hidden="true">·</span>
                  <button
                    type="button"
                    className={`preset-link-btn${isMixedPreset ? ' is-active' : ''}`}
                    onClick={() => applyChargingMixPreset(50, 30, 20)}
                  >
                    {t.studio.mixMixed}
                  </button>
                  <span aria-hidden="true">·</span>
                  <button
                    type="button"
                    className={`preset-link-btn${isPublicPreset ? ' is-active' : ''}`}
                    onClick={() => applyChargingMixPreset(0, 50, 50)}
                  >
                    {t.studio.mixPublic}
                  </button>
                  <span aria-hidden="true">·</span>
                  <button
                    type="button"
                    className={`preset-link-btn custom-mix-btn${
                      customMixMode ? ' is-active' : ''
                    }`}
                    onClick={() => setCustomMixMode(true)}
                  >
                    {t.studio.mixCustom}
                  </button>
                  <span
                    className={`mix-total-note tabular-nums${
                      totalMixPct !== 100 ? ' is-warn' : ''
                    }`}
                  >
                    {t.studio.mixTotalNote(totalMixPct)}
                  </span>
                </div>
              </div>

              <div className="charging-tiers-grid">
                <div className="charging-tier-box">
                  <div className="tier-head">
                    <label htmlFor="home-ac-price" className="tier-name">
                      {t.studio.homeAcLabel}
                    </label>
                    <span className="tier-share tabular-nums">
                      {draftAssumptions.homeAcShare}
                      {t.studio.shareSuffix}
                    </span>
                  </div>
                  <div className="tier-controls">
                    <input
                      id="home-ac-price"
                      type="number"
                      min={0.05}
                      max={1.5}
                      step={0.02}
                      value={draftAssumptions.homeAcPrice}
                      onChange={(e) =>
                        setDraftAssumptions((prev) => ({
                          ...prev,
                          homeAcPrice: Math.max(0, Number(e.target.value)),
                        }))
                      }
                      aria-label={t.studio.homeAcLabel}
                      className="num-input tabular-nums"
                    />
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={customMixMode ? 1 : 5}
                      value={draftAssumptions.homeAcShare}
                      onChange={(e) =>
                        updateChargingShare(
                          'homeAcShare',
                          Number(e.target.value)
                        )
                      }
                      aria-label={`${t.studio.homeAcLabel} ${t.studio.shareSuffix}`}
                      className="range-input tier-range"
                    />
                  </div>
                </div>

                <div className="charging-tier-box">
                  <div className="tier-head">
                    <label htmlFor="public-ac-price" className="tier-name">
                      {t.studio.publicAcLabel}
                    </label>
                    <span className="tier-share tabular-nums">
                      {draftAssumptions.publicAcShare}
                      {t.studio.shareSuffix}
                    </span>
                  </div>
                  <div className="tier-controls">
                    <input
                      id="public-ac-price"
                      type="number"
                      min={0.05}
                      max={1.5}
                      step={0.02}
                      value={draftAssumptions.publicAcPrice}
                      onChange={(e) =>
                        setDraftAssumptions((prev) => ({
                          ...prev,
                          publicAcPrice: Math.max(0, Number(e.target.value)),
                        }))
                      }
                      aria-label={t.studio.publicAcLabel}
                      className="num-input tabular-nums"
                    />
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={customMixMode ? 1 : 5}
                      value={draftAssumptions.publicAcShare}
                      onChange={(e) =>
                        updateChargingShare(
                          'publicAcShare',
                          Number(e.target.value)
                        )
                      }
                      aria-label={`${t.studio.publicAcLabel} ${t.studio.shareSuffix}`}
                      className="range-input tier-range"
                    />
                  </div>
                </div>

                <div className="charging-tier-box">
                  <div className="tier-head">
                    <label htmlFor="public-dc-price" className="tier-name">
                      {t.studio.publicDcLabel}
                    </label>
                    <span className="tier-share tabular-nums">
                      {draftAssumptions.publicDcShare}
                      {t.studio.shareSuffix}
                    </span>
                  </div>
                  <div className="tier-controls">
                    <input
                      id="public-dc-price"
                      type="number"
                      min={0.05}
                      max={2.0}
                      step={0.02}
                      value={draftAssumptions.publicDcPrice}
                      onChange={(e) =>
                        setDraftAssumptions((prev) => ({
                          ...prev,
                          publicDcPrice: Math.max(0, Number(e.target.value)),
                        }))
                      }
                      aria-label={t.studio.publicDcLabel}
                      className="num-input tabular-nums"
                    />
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={customMixMode ? 1 : 5}
                      value={draftAssumptions.publicDcShare}
                      onChange={(e) =>
                        updateChargingShare(
                          'publicDcShare',
                          Number(e.target.value)
                        )
                      }
                      aria-label={`${t.studio.publicDcLabel} ${t.studio.shareSuffix}`}
                      className="range-input tier-range"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="charging-extras-group">
              <div className="charging-group-head">
                <span className="charging-group-title">
                  {t.studio.lossesFeesTitle}
                </span>
                <span className="blended-rate-note tabular-nums">
                  {t.studio.avgPrefix}{' '}
                  {formatEur(draftBlendedElecPrice, 3, t.locale)}
                  /kWh
                </span>
              </div>

              <div
                className={`charging-extras-grid${
                  isEnergyOnly ? ' is-energy-only' : ''
                }`}
              >
                <label className="assumption-field">
                  <span className="assumption-label">
                    {t.studio.chargeLossesLabel}
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={30}
                    step={1}
                    value={draftAssumptions.chargeLossPct}
                    onChange={(e) =>
                      setDraftAssumptions((prev) => ({
                        ...prev,
                        chargeLossPct: Math.max(
                          0,
                          Math.min(35, Number(e.target.value))
                        ),
                      }))
                    }
                    className="num-input tabular-nums"
                  />
                </label>

                <label className="assumption-field">
                  <span className="assumption-label">
                    {t.studio.fixedFeeLabel}
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={draftAssumptions.monthlyChargingFee}
                    onChange={(e) =>
                      setDraftAssumptions((prev) => ({
                        ...prev,
                        monthlyChargingFee: Math.max(0, Number(e.target.value)),
                      }))
                    }
                    className="num-input tabular-nums"
                  />
                </label>

                {!isEnergyOnly && (
                  <label className="assumption-field">
                    <span className="assumption-label">
                      {t.studio.wallboxLabel}
                    </span>
                    <input
                      type="number"
                      min={0}
                      max={6000}
                      step={100}
                      value={draftAssumptions.wallboxCost}
                      onChange={(e) =>
                        setDraftAssumptions((prev) => ({
                          ...prev,
                          wallboxCost: Math.max(0, Number(e.target.value)),
                        }))
                      }
                      className="num-input tabular-nums"
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

          <div className="assumptions-calc-bar">
            <span
              className={`calc-status-note${
                hasPendingSettings ? ' is-pending' : ''
              }`}
            >
              <span className="calc-status-dot" aria-hidden="true" />
              {hasPendingSettings
                ? t.studio.settingsPendingNote
                : t.studio.settingsSyncedNote}
            </span>

            <button
              type="button"
              onClick={handleCalculate}
              className={`btn btn-primary calculate-btn${
                hasPendingSettings ? ' is-pending' : ''
              }`}
            >
              {t.studio.calculateBtn}
            </button>
          </div>
        </div>

        {/* 2 or 3 Comparison Columns */}
        <div
          ref={columnsRef}
          className={`compare-columns ${
            compareCount === 2 ? 'cols-2' : 'cols-3'
          }`}
        >
          {activeCars.map((car, idx) => {
            const res = results[idx];
            const meta = POWERTRAIN_META[car.powertrain];
            const color = isDark ? meta.darkColor : meta.color;
            const isWinner = idx === bestIdx;
            const deltaVsWinner = res.activeTotal - minActiveTotal;
            const effResalePct = scaledResalePct(
              car.resalePct,
              assumptions.years
            );

            const depW = isEnergyOnly
              ? 0
              : (res.netDepreciation / maxActiveTotal) * 100;
            const wallW = isEnergyOnly
              ? 0
              : (res.wallboxCost / maxActiveTotal) * 100;
            const eneW = (res.totalEnergyCost / maxActiveTotal) * 100;
            const srvW = isEnergyOnly
              ? 0
              : (res.totalServiceCost / maxActiveTotal) * 100;
            const taxInsW = isEnergyOnly
              ? 0
              : ((res.totalTaxCost + res.totalInsuranceCost) /
                  maxActiveTotal) *
                100;

            return (
              <article
                key={car.slotId}
                className={`compare-card${isWinner ? ' is-leader' : ''}`}
                style={isWinner ? { borderColor: color } : undefined}
              >
                <div className="compare-card-head">
                  <span className="compare-slot-kicker">
                    {t.studio.carWord} {idx + 1} · {t.bodyClasses[car.bodyClass]}
                  </span>

                  <div className="compare-card-head-right">
                    {isWinner ? (
                      <span
                        className="winner-tag"
                        style={{ backgroundColor: color, color: '#f4f6f5' }}
                      >
                        {t.studio.winnerBestValue}
                      </span>
                    ) : (
                      <span className="delta-tag tabular-nums">
                        {t.studio.vsWinner(
                          formatEur(deltaVsWinner, 0, t.locale)
                        )}
                      </span>
                    )}
                    <button
                      type="button"
                      className="reset-link"
                      onClick={() => resetSlotToPreset(idx)}
                      aria-label={`${t.studio.reset} ${t.studio.carWord} ${idx + 1}`}
                    >
                      <svg
                        width="11"
                        height="11"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
                        <polyline points="3 3 3 8 8 8" />
                      </svg>
                      <span>{t.studio.reset}</span>
                    </button>
                  </div>
                </div>

                {/* Powertrain Type Tabs */}
                <div
                  className="slot-pt-tabs"
                  role="tablist"
                  aria-label={`${t.studio.carWord} ${idx + 1}`}
                >
                  {POWERTRAIN_ORDER.map((pt) => (
                    <button
                      key={pt}
                      type="button"
                      role="tab"
                      aria-selected={car.powertrain === pt}
                      className={`slot-pt-btn${
                        car.powertrain === pt ? ' is-active' : ''
                      }`}
                      onClick={() => updateSlotPowertrain(idx, pt)}
                    >
                      {t.powertrains[pt].shortLabel}
                    </button>
                  ))}
                </div>

                {/* Vehicle Sketch Preview */}
                <div className="compare-card-sketch">
                  <CarSketch
                    powertrain={car.powertrain}
                    bodyClass={car.bodyClass}
                    accentColor={color}
                    className="compare-sketch-svg"
                  />
                </div>

                {/* Body Class Switcher */}
                <div
                  className="body-class-row"
                  role="group"
                  aria-label={`${t.studio.carWord} ${idx + 1}`}
                >
                  {(['compact', 'sedan', 'suv'] as BodyClassId[]).map(
                    (bodyId) => (
                      <button
                        key={bodyId}
                        type="button"
                        className={`body-class-btn${
                          car.bodyClass === bodyId ? ' is-active' : ''
                        }`}
                        onClick={() => updateSlotBodyClass(idx, bodyId)}
                      >
                        {t.bodyClasses[bodyId]}
                      </button>
                    )
                  )}
                </div>

                {/* Primary Headline Metrics */}
                <div className="tco-headline-block">
                  <div className="tco-primary">
                    <span className="tco-label">
                      {isEnergyOnly
                        ? t.studio.energySpendYr(assumptions.years)
                        : t.studio.totalCostYr(assumptions.years)}
                    </span>
                    <span className="tco-big tabular-nums">
                      {formatEur(res.activeTotal, 0, t.locale)}
                    </span>
                    <span className="tco-sub-line tabular-nums">
                      {formatEur(res.activeMonthly, 0, t.locale)} /{' '}
                      {t.studio.moUnit} ·{' '}
                      {formatEur(res.activePerKm, 2, t.locale)} /{' '}
                      {t.studio.kmUnit}
                    </span>
                  </div>

                  <div className="tco-energy-box">
                    <span className="tco-label">
                      {isEnergyOnly
                        ? t.studio.annualEnergyLabel
                        : t.studio.energySpendLabel}
                    </span>
                    <span
                      className="tco-energy-val tabular-nums"
                      style={{ color }}
                    >
                      {formatEur(res.annualEnergyCost, 0, t.locale)} /{' '}
                      {t.studio.yrUnit}
                    </span>
                    <span className="tco-sub-line tabular-nums">
                      {formatEur(res.energyCostPer100Km, 2, t.locale)} / 100 km
                    </span>
                  </div>
                </div>

                {/* Stacked Proportional Cost Bar */}
                <div className="cost-bar-wrap" aria-label="Cost proportion bar">
                  <div className="cost-bar-track">
                    {!isEnergyOnly && (
                      <>
                        <span
                          className="cost-seg"
                          style={{ width: `${depW}%`, backgroundColor: color }}
                          title={formatEur(res.netDepreciation, 0, t.locale)}
                        />
                        {wallW > 0 && (
                          <span
                            className="cost-seg"
                            style={{
                              width: `${wallW}%`,
                              backgroundColor: color,
                              opacity: 0.82,
                            }}
                            title={formatEur(res.wallboxCost, 0, t.locale)}
                          />
                        )}
                      </>
                    )}
                    <span
                      className="cost-seg"
                      style={{
                        width: `${eneW}%`,
                        backgroundColor: color,
                        opacity: isEnergyOnly ? 1 : 0.62,
                      }}
                      title={formatEur(res.totalEnergyCost, 0, t.locale)}
                    />
                    {!isEnergyOnly && (
                      <>
                        <span
                          className="cost-seg"
                          style={{
                            width: `${srvW}%`,
                            backgroundColor: color,
                            opacity: 0.4,
                          }}
                          title={formatEur(res.totalServiceCost, 0, t.locale)}
                        />
                        <span
                          className="cost-seg"
                          style={{
                            width: `${taxInsW}%`,
                            backgroundColor: color,
                            opacity: 0.22,
                          }}
                          title={formatEur(
                            res.totalTaxCost + res.totalInsuranceCost,
                            0,
                            t.locale
                          )}
                        />
                      </>
                    )}
                  </div>
                </div>

                {/* Editable Vehicle Spec Inputs */}
                <div className="slot-inputs-grid">
                  <label className="slot-input-item">
                    <span className="slot-input-label">
                      {t.studio.consumptionLabel(meta.consumptionUnit)}
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={40}
                      step={0.1}
                      value={car.consumption}
                      onChange={(e) =>
                        updateSlotField(
                          idx,
                          'consumption',
                          Number(e.target.value)
                        )
                      }
                      className="slot-num-input tabular-nums"
                    />
                  </label>

                  {!isEnergyOnly && (
                    <>
                      <label className="slot-input-item">
                        <span className="slot-input-label">
                          {t.studio.purchasePriceLabel}
                        </span>
                        <input
                          type="number"
                          min={5000}
                          max={200000}
                          step={500}
                          value={car.purchasePrice}
                          onChange={(e) =>
                            updateSlotField(
                              idx,
                              'purchasePrice',
                              Number(e.target.value)
                            )
                          }
                          className="slot-num-input tabular-nums"
                        />
                      </label>

                      <label className="slot-input-item">
                        <span className="slot-input-label">
                          {t.studio.serviceYrLabel}
                        </span>
                        <input
                          type="number"
                          min={0}
                          max={5000}
                          step={20}
                          value={car.annualService}
                          onChange={(e) =>
                            updateSlotField(
                              idx,
                              'annualService',
                              Number(e.target.value)
                            )
                          }
                          className="slot-num-input tabular-nums"
                        />
                      </label>

                      <label className="slot-input-item">
                        <span className="slot-input-label">
                          {t.studio.roadTaxYrLabel}
                        </span>
                        <input
                          type="number"
                          min={0}
                          max={4000}
                          step={10}
                          value={car.annualTax}
                          onChange={(e) =>
                            updateSlotField(
                              idx,
                              'annualTax',
                              Number(e.target.value)
                            )
                          }
                          className="slot-num-input tabular-nums"
                        />
                      </label>

                      <label className="slot-input-item">
                        <span className="slot-input-label">
                          {t.studio.insuranceYrLabel}
                        </span>
                        <input
                          type="number"
                          min={0}
                          max={6000}
                          step={20}
                          value={car.annualInsurance}
                          onChange={(e) =>
                            updateSlotField(
                              idx,
                              'annualInsurance',
                              Number(e.target.value)
                            )
                          }
                          className="slot-num-input tabular-nums"
                        />
                      </label>

                      <label className="slot-input-item">
                        <span className="slot-input-label">
                          {t.studio.resaleLabel}
                        </span>
                        <input
                          type="number"
                          min={10}
                          max={90}
                          step={1}
                          value={car.resalePct}
                          onChange={(e) =>
                            updateSlotField(
                              idx,
                              'resalePct',
                              Math.min(90, Number(e.target.value))
                            )
                          }
                          className="slot-num-input tabular-nums"
                        />
                      </label>
                    </>
                  )}
                </div>

                {/* Uniform Subsidy Slot across all columns (Hybrid & Electric active, Gasoline/Diesel spacer) */}
                {!isEnergyOnly && (
                  <div className="subsidy-slot">
                    {(car.powertrain === 'hybrid' ||
                      car.powertrain === 'electric') && (
                      <div className="subsidy-row">
                        <label className="subsidy-toggle">
                          <input
                            type="checkbox"
                            checked={car.subsidyEnabled}
                            onChange={() => toggleSlotSubsidy(idx)}
                          />
                          <span>{t.studio.optionalSubsidy}</span>
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={25000}
                          step={250}
                          disabled={!car.subsidyEnabled}
                          value={car.subsidyAmount}
                          onChange={(e) =>
                            updateSlotField(
                              idx,
                              'subsidyAmount',
                              Number(e.target.value)
                            )
                          }
                          aria-label={`${t.studio.optionalSubsidy} ${t.studio.carWord} ${idx + 1}`}
                          className="subsidy-input tabular-nums"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Detailed Breakdown List */}
                <div className="breakdown-list">
                  {!isEnergyOnly && (
                    <>
                      <div className="breakdown-row">
                        <span>
                          {t.studio.depreciationLabel(
                            100 - effResalePct,
                            res.effectiveSubsidy > 0
                              ? t.studio.subsidyNote(
                                  formatEur(res.effectiveSubsidy, 0, t.locale)
                                )
                              : ''
                          )}
                        </span>
                        <span className="tabular-nums">
                          {formatEur(res.netDepreciation, 0, t.locale)}
                        </span>
                      </div>
                      {car.powertrain === 'electric' && (
                        <div className="breakdown-row">
                          <span>{t.studio.oneTimeWallbox}</span>
                          <span className="tabular-nums">
                            {formatEur(res.wallboxCost, 0, t.locale)}
                          </span>
                        </div>
                      )}
                    </>
                  )}

                  <div className="breakdown-row">
                    <span>
                      {car.powertrain === 'electric'
                        ? t.studio.electricityLine(
                            res.billedConsumptionPer100Km.toFixed(1),
                            formatEur(
                              getUnitPrice(car.powertrain, assumptions),
                              2,
                              t.locale
                            )
                          )
                        : t.studio.fuelLine(
                            car.consumption.toFixed(1),
                            formatEur(
                              getUnitPrice(car.powertrain, assumptions),
                              2,
                              t.locale
                            )
                          )}
                    </span>
                    <span className="tabular-nums">
                      {formatEur(res.totalVariableEnergyCost, 0, t.locale)}
                    </span>
                  </div>

                  {car.powertrain === 'electric' &&
                    res.totalFixedChargingFee > 0 && (
                      <div className="breakdown-row">
                        <span>
                          {t.studio.fixedChargingFeeLine(
                            formatEur(
                              assumptions.monthlyChargingFee,
                              0,
                              t.locale
                            )
                          )}
                        </span>
                        <span className="tabular-nums">
                          {formatEur(res.totalFixedChargingFee, 0, t.locale)}
                        </span>
                      </div>
                    )}

                  {!isEnergyOnly && (
                    <>
                      <div className="breakdown-row">
                        <span>
                          {t.studio.maintenanceLine(assumptions.years)}
                        </span>
                        <span className="tabular-nums">
                          {formatEur(res.totalServiceCost, 0, t.locale)}
                        </span>
                      </div>
                      <div className="breakdown-row">
                        <span>{t.studio.roadTaxLine(assumptions.years)}</span>
                        <span className="tabular-nums">
                          {formatEur(res.totalTaxCost, 0, t.locale)}
                        </span>
                      </div>
                      <div className="breakdown-row">
                        <span>
                          {t.studio.insuranceLine(assumptions.years)}
                        </span>
                        <span className="tabular-nums">
                          {formatEur(res.totalInsuranceCost, 0, t.locale)}
                        </span>
                      </div>
                    </>
                  )}

                  <div className="breakdown-row breakdown-row-muted">
                    <span>{t.studio.co2PerYr}</span>
                    <span className="tabular-nums">
                      {Math.round(res.annualCo2Kg).toLocaleString(t.locale)} kg
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* Comparison Winner Banner placed directly below the 2 or 3 vehicle columns */}
        <div
          className="winner-banner"
          style={{ borderColor: bestAccent }}
          aria-live="polite"
        >
          <div className="winner-banner-left">
            <span className="winner-kicker" style={{ color: bestAccent }}>
              {t.studio.winnerKicker} ·{' '}
              {isEnergyOnly
                ? t.studio.energyOnlyTag
                : t.studio.tcoSuffix(assumptions.years)}
            </span>
            <h3 className="winner-headline">
              {t.studio.winsAt(
                bestIdx + 1,
                t.powertrains[bestCar.powertrain].label,
                t.bodyClasses[bestCar.bodyClass],
                formatEur(bestRes.activeTotal, 0, t.locale)
              )}
            </h3>
            <p className="winner-sub">
              {runnerUpGap > 1 && runnerUp
                ? t.studio.savesSummary(
                    formatEur(runnerUpGap, 0, t.locale),
                    formatEur(
                      runnerUpGap / (assumptions.years * 12),
                      0,
                      t.locale
                    ),
                    runnerUp.idx + 1,
                    t.powertrains[activeCars[runnerUp.idx].powertrain].shortLabel,
                    formatEur(totalSavings, 0, t.locale),
                    t.powertrains[worstCar.powertrain].shortLabel
                  )
                : t.studio.tiedSummary}
            </p>
          </div>

          <div className="winner-banner-stats">
            <div className="winner-stat">
              <span className="winner-stat-val tabular-nums">
                {formatEur(bestRes.activeMonthly, 0, t.locale)}
              </span>
              <span className="winner-stat-label">
                {t.studio.winnerPerMonth}
              </span>
            </div>
            <div className="winner-stat">
              <span className="winner-stat-val tabular-nums">
                {formatEur(bestRes.activePerKm, 2, t.locale)}
              </span>
              <span className="winner-stat-label">{t.studio.winnerPerKm}</span>
            </div>
            {hasElectric && (
              <div className="winner-stat">
                <span className="winner-stat-val tabular-nums">
                  {formatEur(blendedElecPrice, 2, t.locale)}
                </span>
                <span className="winner-stat-label">
                  {t.studio.blendedPerKwh}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Summary + Interactive Cumulative Chart */}
        <div className="compare-summary-grid">
          <div className="insight-panel">
            <div>
              <span className="insight-kicker">
                {isEnergyOnly
                  ? t.studio.energyBalanceKicker
                  : t.studio.ownershipBalanceKicker}
              </span>
              <h3 className="insight-title">
                {t.studio.leadsByOverYears(
                  t.powertrains[bestCar.powertrain].label,
                  t.bodyClasses[bestCar.bodyClass],
                  formatEur(totalSavings, 0, t.locale),
                  assumptions.years
                )}
              </h3>
              <p className="insight-copy">
                {t.studio.insightCopy(
                  assumptions.annualKm.toLocaleString(t.locale),
                  t.powertrains[bestCar.powertrain].label,
                  t.powertrains[worstCar.powertrain].label,
                  isEnergyOnly,
                  formatEur(
                    totalSavings / (assumptions.years * 12),
                    0,
                    t.locale
                  )
                )}
              </p>
            </div>

            <div className="insight-legend-rows">
              <div className="insight-stat">
                <span className="insight-stat-val tabular-nums">
                  {formatEur(bestRes.activeMonthly, 0, t.locale)}
                </span>
                <span className="insight-stat-label">
                  {isEnergyOnly
                    ? t.studio.lowestMonthlyEnergy
                    : t.studio.lowestMonthlyTco}{' '}
                  ({t.powertrains[bestCar.powertrain].shortLabel})
                </span>
              </div>
              <div className="insight-stat">
                <span className="insight-stat-val tabular-nums">
                  {formatEur(minEnergyCost / assumptions.years, 0, t.locale)}
                </span>
                <span className="insight-stat-label">
                  {t.studio.lowestAnnualEnergy}
                </span>
              </div>
            </div>
          </div>

          <ComparisonChart
            cars={activeCars}
            results={results}
            years={assumptions.years}
            comparisonMode={assumptions.comparisonMode}
            isDark={isDark}
            lang={lang}
          />
        </div>

        {/* Unified Sensitivity, Winning Zones, Scenario Simulator & Chart Card */}
        <div className="chart-panel sensitivity-unified-panel">
          {/* 1. Top: Sensitivity Header, 1D/2D & Scope Controls + Winning Zones Summary */}
          <div className="sensitivity-top-section">
            <div className="sensitivity-unified-header">
              <div className="sensitivity-heading-col">
                <span className="insight-kicker">
                  {t.studio.sensitivityKicker}
                </span>

                {sensitivityView === '2d' ? (
                  <>
                    <h3 className="insight-title">{t.studio.mapTitle2D}</h3>
                    <p className="insight-copy">{t.studio.mapCopy2D}</p>
                  </>
                ) : (
                  <>
                    <h3 className="insight-title">
                      {sensitivity.switches.length > 0 ? (
                        <>
                          {t.studio.switchesAt}{' '}
                          <span className="tabular-nums">
                            {sensitivity.switches
                              .map(
                                (sw) =>
                                  `€${sw.x.toFixed(2)}${
                                    sensitivityMode === 'fuel' ? '/L' : '/kWh'
                                  }`
                              )
                              .join(` ${t.studio.andWord} `)}
                          </span>
                          .
                        </>
                      ) : (
                        t.studio.winsEveryZone(
                          t.powertrains[
                            sensitivityCars[
                              sensitivity.regimes[0]?.winnerCarIndex ?? 0
                            ].powertrain
                          ].label
                        )
                      )}
                    </h3>
                    <p className="insight-copy">
                      {t.studio.sensitivityCopy1D(isEnergyOnly)}
                    </p>
                  </>
                )}
              </div>

              <div className="sensitivity-controls-col">
                <div
                  className="horizon-tabs sensitivity-view-tabs"
                  role="tablist"
                  aria-label={t.studio.sensitivityKicker}
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={sensitivityView === '1d'}
                    className={`horizon-btn${
                      sensitivityView === '1d' ? ' is-active' : ''
                    }`}
                    onClick={() => setSensitivityView('1d')}
                  >
                    {isEnergyOnly ? t.studio.view1DEnergy : t.studio.view1DTco}
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={sensitivityView === '2d'}
                    className={`horizon-btn${
                      sensitivityView === '2d' ? ' is-active' : ''
                    }`}
                    onClick={() => setSensitivityView('2d')}
                  >
                    {t.studio.view2DEnergy}
                  </button>
                </div>

                {compareCount === 3 && (
                  <div className="sensitivity-scope-box">
                    <span className="assumption-label">
                      {t.studio.analyzeBetween}
                    </span>
                    <div
                      className="horizon-tabs sensitivity-scope-tabs"
                      role="group"
                      aria-label={t.studio.analyzeBetween}
                    >
                      <button
                        type="button"
                        className={`horizon-btn${
                          sensitivityScope === 'all' ? ' is-active' : ''
                        }`}
                        onClick={() => setSensitivityScope('all')}
                      >
                        {t.studio.all3}
                      </button>
                      {([
                        ['0-1', 0, 1],
                        ['0-2', 0, 2],
                        ['1-2', 1, 2],
                      ] as const).map(([key, aIdx, bIdx]) => {
                        const aCar = activeCars[aIdx];
                        const bCar = activeCars[bIdx];
                        const samePt = aCar.powertrain === bCar.powertrain;
                        const label = samePt
                          ? `${t.studio.carWord} ${aIdx + 1} vs ${bIdx + 1}`
                          : `${t.powertrains[aCar.powertrain].shortLabel.slice(0, 3)} vs ${t.powertrains[bCar.powertrain].shortLabel.slice(0, 3)}`;
                        return (
                          <button
                            key={key}
                            type="button"
                            className={`horizon-btn${
                              sensitivityScope === key ? ' is-active' : ''
                            }`}
                            onClick={() => setSensitivityScope(key)}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {sensitivityView === '2d' ? (
              <div className="sensitivity-summary-box">
                <div className="threshold-head">
                  <span>{t.studio.zones2DHead}</span>
                  <span className="tabular-nums">
                    {t.studio.nowWord}: €{energyMap2D.currentFuelX.toFixed(2)}
                    /L · €{energyMap2D.currentChargeY.toFixed(2)}/kWh
                  </span>
                </div>

                <div className="sensitivity-results-grid">
                  <div className="sensitivity-subcol">
                    <span className="sensitivity-subcol-title">
                      {t.studio.coloredWinnerZones}
                    </span>
                    <div className="zone-summary-list">
                      {energyMap2D.zones.map((z) => {
                        const winMeta = POWERTRAIN_META[z.powertrain];
                        const winColor = isDark
                          ? winMeta.darkColor
                          : winMeta.color;
                        return (
                          <div key={z.carIndex} className="zone-summary-row">
                            <span className="zone-summary-left">
                              <span
                                className="zone-swatch"
                                style={{ backgroundColor: winColor }}
                                aria-hidden="true"
                              />
                              <strong>{t.powertrains[z.powertrain].label}</strong>
                            </span>
                            <span className="tabular-nums zone-range-text">
                              {t.studio.ofMap(Math.round(z.areaFraction * 100))}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {energyMap2D.breakingLines.length > 0 && (
                    <div className="sensitivity-subcol">
                      <span className="sensitivity-subcol-title">
                        {t.studio.breakEvenHead}
                      </span>
                      <div className="threshold-list">
                        {energyMap2D.breakingLines.map((bl, idx) => {
                          const ptA =
                            t.powertrains[
                              sensitivityCars[bl.carAIndex].powertrain
                            ].shortLabel;
                          const ptB =
                            t.powertrains[
                              sensitivityCars[bl.carBIndex].powertrain
                            ].shortLabel;
                          const atCurFuelY =
                            bl.slopeYPerX !== null && bl.interceptY !== null
                              ? bl.slopeYPerX * energyMap2D.currentFuelX +
                                bl.interceptY
                              : null;
                          return (
                            <div key={idx} className="threshold-row">
                              <span className="threshold-pair">
                                {ptA} = {ptB}
                              </span>
                              <span className="threshold-val tabular-nums">
                                {atCurFuelY !== null && atCurFuelY > 0
                                  ? t.studio.atFuelLabel(
                                      `€${atCurFuelY.toFixed(2)}`,
                                      `€${energyMap2D.currentFuelX.toFixed(2)}`
                                    )
                                  : t.studio.boundaryAcrossMap}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="sensitivity-summary-box">
                <div className="threshold-head">
                  <span>{t.studio.coloredWinnerZones}</span>
                  <span className="tabular-nums">
                    {t.studio.currentWord}: €{sensitivity.currentX.toFixed(2)}{' '}
                    {sensitivity.unitLabel}
                  </span>
                </div>

                <div className="sensitivity-results-grid">
                  <div className="sensitivity-subcol">
                    <span className="sensitivity-subcol-title">
                      {t.studio.coloredWinnerZones}
                    </span>
                    <div className="zone-summary-list">
                      {sensitivity.regimes.map((reg, rIdx) => {
                        const winCar = sensitivityCars[reg.winnerCarIndex];
                        const winMeta = POWERTRAIN_META[winCar.powertrain];
                        const winColor = isDark
                          ? winMeta.darkColor
                          : winMeta.color;
                        const unit = sensitivityMode === 'fuel' ? '/L' : '/kWh';
                        return (
                          <div key={rIdx} className="zone-summary-row">
                            <span className="zone-summary-left">
                              <span
                                className="zone-swatch"
                                style={{ backgroundColor: winColor }}
                                aria-hidden="true"
                              />
                              <strong>
                                {t.powertrains[winCar.powertrain].shortLabel}
                              </strong>
                            </span>
                            <span className="tabular-nums zone-range-text">
                              €{reg.xStart.toFixed(2)} – €{reg.xEnd.toFixed(2)}
                              {unit}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {(sensitivity.switches.length > 0 ||
                    sensitivity.pairwise.filter((p) => p.x > 0).length > 0) && (
                    <div className="sensitivity-subcol">
                      <span className="sensitivity-subcol-title">
                        {t.studio.breakEvenHead}
                      </span>
                      {sensitivity.switches.length > 0 && (
                        <div className="threshold-list">
                          {sensitivity.switches.map((sw, sIdx) => {
                            const fromLabel =
                              t.powertrains[
                                sensitivityCars[sw.fromCarIndex].powertrain
                              ].shortLabel;
                            const toLabel =
                              t.powertrains[
                                sensitivityCars[sw.toCarIndex].powertrain
                              ].shortLabel;
                            const unit =
                              sensitivityMode === 'fuel' ? '/L' : '/kWh';
                            return (
                              <div key={sIdx} className="threshold-row">
                                <span className="threshold-pair">
                                  {t.studio.breakPrefix}: {fromLabel} → {toLabel}
                                </span>
                                <span className="threshold-val tabular-nums">
                                  €{sw.x.toFixed(2)}
                                  {unit}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {sensitivity.pairwise.filter((p) => p.x > 0).length >
                        0 && (
                        <div className="threshold-sublist">
                          {sensitivity.pairwise
                            .filter((p) => p.x > 0)
                            .map((p, idx) => {
                              const belowLabel =
                                t.powertrains[
                                  sensitivityCars[p.cheaperBelowIndex]
                                    .powertrain
                                ].shortLabel;
                              const aboveLabel =
                                t.powertrains[
                                  sensitivityCars[p.cheaperAboveIndex]
                                    .powertrain
                                ].shortLabel;
                              const unit =
                                sensitivityMode === 'fuel' ? '/L' : '/kWh';
                              return (
                                <div key={idx} className="threshold-subrow">
                                  <span>
                                    {t.studio.beatsAbove(aboveLabel, belowLabel)}
                                  </span>
                                  <span className="tabular-nums">
                                    €{p.x.toFixed(2)}
                                    {unit}
                                  </span>
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 2. Middle: Scenario Simulator Energy Costs Box */}
          <div className="sim-energy-box">
            <div className="sim-energy-head">
              <div>
                <span className="sim-energy-title">{t.studio.simBoxTitle}</span>
                <p className="sim-energy-sub">{t.studio.simBoxSub}</p>
              </div>
              <div className="sim-energy-head-right">
                <span className="blended-rate-note tabular-nums">
                  {t.studio.avgPrefix}{' '}
                  {formatEur(draftSimBlendedElecPrice, 3, t.locale)}/kWh
                </span>
                <button
                  type="button"
                  disabled={!isSimModified}
                  className={`reset-link sim-reset-btn${
                    isSimModified ? '' : ' is-synced'
                  }`}
                  onClick={() => {
                    const resetRates = {
                      gasolinePrice: assumptions.gasolinePrice,
                      dieselPrice: assumptions.dieselPrice,
                      homeAcPrice: assumptions.homeAcPrice,
                      publicAcPrice: assumptions.publicAcPrice,
                      publicDcPrice: assumptions.publicDcPrice,
                      homeAcShare: assumptions.homeAcShare,
                      publicAcShare: assumptions.publicAcShare,
                      publicDcShare: assumptions.publicDcShare,
                    };
                    setSimCustomMixMode(customMixMode);
                    setDraftSimRates(resetRates);
                    setSimRates(resetRates);
                  }}
                >
                  {t.studio.simResetBtn}
                </button>
              </div>
            </div>

            <div className="sim-fuel-grid">
              <label className="sim-energy-field">
                <span className="assumption-label">{t.studio.gasolineRate}</span>
                <input
                  type="number"
                  min={0.5}
                  max={3.5}
                  step={0.05}
                  value={draftSimRates.gasolinePrice}
                  onChange={(e) =>
                    setDraftSimRates((prev) => ({
                      ...prev,
                      gasolinePrice: Math.max(0.1, Number(e.target.value)),
                    }))
                  }
                  className="slot-num-input tabular-nums"
                />
              </label>

              <label className="sim-energy-field">
                <span className="assumption-label">{t.studio.dieselRate}</span>
                <input
                  type="number"
                  min={0.5}
                  max={3.5}
                  step={0.05}
                  value={draftSimRates.dieselPrice}
                  onChange={(e) =>
                    setDraftSimRates((prev) => ({
                      ...prev,
                      dieselPrice: Math.max(0.1, Number(e.target.value)),
                    }))
                  }
                  className="slot-num-input tabular-nums"
                />
              </label>
            </div>

            <div className="sim-charging-subsection">
              <div className="charging-group-head">
                <span className="charging-group-title">
                  {t.studio.elecTariffsTitle}
                </span>
                <div className="charging-mix-presets">
                  <button
                    type="button"
                    className={`preset-link-btn${isSimHomePreset ? ' is-active' : ''}`}
                    onClick={() => applySimChargingMixPreset(80, 15, 5)}
                  >
                    {t.studio.mixHome}
                  </button>
                  <span aria-hidden="true">·</span>
                  <button
                    type="button"
                    className={`preset-link-btn${isSimMixedPreset ? ' is-active' : ''}`}
                    onClick={() => applySimChargingMixPreset(50, 30, 20)}
                  >
                    {t.studio.mixMixed}
                  </button>
                  <span aria-hidden="true">·</span>
                  <button
                    type="button"
                    className={`preset-link-btn${isSimPublicPreset ? ' is-active' : ''}`}
                    onClick={() => applySimChargingMixPreset(0, 50, 50)}
                  >
                    {t.studio.mixPublic}
                  </button>
                  <span aria-hidden="true">·</span>
                  <button
                    type="button"
                    className={`preset-link-btn custom-mix-btn${
                      simCustomMixMode ? ' is-active' : ''
                    }`}
                    onClick={() => setSimCustomMixMode(true)}
                  >
                    {t.studio.mixCustom}
                  </button>
                  <span
                    className={`mix-total-note tabular-nums${
                      simTotalMixPct !== 100 ? ' is-warn' : ''
                    }`}
                  >
                    {t.studio.mixTotalNote(simTotalMixPct)}
                  </span>
                </div>
              </div>

              <div className="charging-tiers-grid">
                <div className="charging-tier-box">
                  <div className="tier-head">
                    <label htmlFor="sim-home-ac-price" className="tier-name">
                      {t.studio.homeAcLabel}
                    </label>
                    <span className="tier-share tabular-nums">
                      {draftSimRates.homeAcShare}
                      {t.studio.shareSuffix}
                    </span>
                  </div>
                  <div className="tier-controls">
                    <input
                      id="sim-home-ac-price"
                      type="number"
                      min={0.05}
                      max={1.5}
                      step={0.02}
                      value={draftSimRates.homeAcPrice}
                      onChange={(e) =>
                        setDraftSimRates((prev) => ({
                          ...prev,
                          homeAcPrice: Math.max(0.01, Number(e.target.value)),
                        }))
                      }
                      aria-label={t.studio.homeAcLabel}
                      className="num-input tabular-nums"
                    />
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={simCustomMixMode ? 1 : 5}
                      value={draftSimRates.homeAcShare}
                      onChange={(e) =>
                        updateSimChargingShare(
                          'homeAcShare',
                          Number(e.target.value)
                        )
                      }
                      aria-label={`${t.studio.homeAcLabel} ${t.studio.shareSuffix}`}
                      className="range-input tier-range"
                    />
                  </div>
                </div>

                <div className="charging-tier-box">
                  <div className="tier-head">
                    <label htmlFor="sim-public-ac-price" className="tier-name">
                      {t.studio.publicAcLabel}
                    </label>
                    <span className="tier-share tabular-nums">
                      {draftSimRates.publicAcShare}
                      {t.studio.shareSuffix}
                    </span>
                  </div>
                  <div className="tier-controls">
                    <input
                      id="sim-public-ac-price"
                      type="number"
                      min={0.05}
                      max={1.5}
                      step={0.02}
                      value={draftSimRates.publicAcPrice}
                      onChange={(e) =>
                        setDraftSimRates((prev) => ({
                          ...prev,
                          publicAcPrice: Math.max(0.01, Number(e.target.value)),
                        }))
                      }
                      aria-label={t.studio.publicAcLabel}
                      className="num-input tabular-nums"
                    />
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={simCustomMixMode ? 1 : 5}
                      value={draftSimRates.publicAcShare}
                      onChange={(e) =>
                        updateSimChargingShare(
                          'publicAcShare',
                          Number(e.target.value)
                        )
                      }
                      aria-label={`${t.studio.publicAcLabel} ${t.studio.shareSuffix}`}
                      className="range-input tier-range"
                    />
                  </div>
                </div>

                <div className="charging-tier-box">
                  <div className="tier-head">
                    <label htmlFor="sim-public-dc-price" className="tier-name">
                      {t.studio.publicDcLabel}
                    </label>
                    <span className="tier-share tabular-nums">
                      {draftSimRates.publicDcShare}
                      {t.studio.shareSuffix}
                    </span>
                  </div>
                  <div className="tier-controls">
                    <input
                      id="sim-public-dc-price"
                      type="number"
                      min={0.05}
                      max={2.0}
                      step={0.02}
                      value={draftSimRates.publicDcPrice}
                      onChange={(e) =>
                        setDraftSimRates((prev) => ({
                          ...prev,
                          publicDcPrice: Math.max(0.01, Number(e.target.value)),
                        }))
                      }
                      aria-label={t.studio.publicDcLabel}
                      className="num-input tabular-nums"
                    />
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={simCustomMixMode ? 1 : 5}
                      value={draftSimRates.publicDcShare}
                      onChange={(e) =>
                        updateSimChargingShare(
                          'publicDcShare',
                          Number(e.target.value)
                        )
                      }
                      aria-label={`${t.studio.publicDcLabel} ${t.studio.shareSuffix}`}
                      className="range-input tier-range"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="assumptions-calc-bar sim-calc-bar">
              <span
                className={`calc-status-note${
                  hasPendingSim ? ' is-pending' : ''
                }`}
              >
                <span className="calc-status-dot" aria-hidden="true" />
                {hasPendingSim
                  ? t.studio.simPendingNote
                  : t.studio.simSyncedNote}
              </span>
              <button
                type="button"
                className={`btn btn-primary calculate-btn${
                  hasPendingSim ? ' is-pending' : ''
                }`}
                onClick={handleSimCalculate}
              >
                {t.studio.calculateBtn}
              </button>
            </div>
          </div>

          {/* 3. Bottom: Sensitivity Chart (1D or 2D) */}
          <div ref={simChartRef} className="sensitivity-chart-section">
            {sensitivityView === '2d' ? (
              <EnergyMap2DChart
                cars={sensitivityCars}
                analysis={energyMap2D}
                annualKm={assumptions.annualKm}
                isDark={isDark}
                lang={lang}
              />
            ) : (
              <SensitivityChart
                cars={sensitivityCars}
                analysis={sensitivity}
                years={assumptions.years}
                comparisonMode={assumptions.comparisonMode}
                isDark={isDark}
                lang={lang}
                embedded
                onModeChange={setSensitivityMode}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
