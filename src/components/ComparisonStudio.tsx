import { useEffect, useRef, useState } from 'react';
import {
  ACTIVE_SIM_MARKER_COLOR,
  BodyClassId,
  CAR_PRESETS,
  CarSlotConfig,
  ComparisonMode,
  GlobalAssumptions,
  HybridTripProfile,
  ORIGINAL_MARKER_COLOR,
  POWERTRAIN_META,
  POWERTRAIN_ORDER,
  PowertrainId,
  SCENARIO_COLOR_PALETTE,
  SavedScenario,
  ScenarioRates,
  SensitivityMode,
  applyScenarioToCars,
  areScenarioRatesEqual,
  buildBaseTcoOverrides,
  calculateTco,
  computeEnergyMap2D,
  computeSensitivity,
  createSlotFromPreset,
  extractScenarioRates,
  formatEur,
  getBlendedElectricityPrice,
  getUnitPrice,
  scaledResalePct,
} from '../data/cars';
import { Language, TRANSLATIONS } from '../i18n/translations';
import { LiveFuelFeed } from '../services/fuelPrices';
import { CarSketch } from './CarSketch';
import { ComparisonChart } from './ComparisonChart';
import { EnergyMap2DChart } from './EnergyMap2DChart';
import { SensitivityChart } from './SensitivityChart';

interface ComparisonStudioProps {
  isDark: boolean;
  lang: Language;
  fuelFeed: LiveFuelFeed | null;
  fuelFeedLoading: boolean;
}

interface NumericFieldProps {
  id?: string;
  value: number;
  min?: number;
  max?: number;
  decimals?: number;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
  onValueChange: (val: number) => void;
}

function formatNumericDraft(val: number, decimals = 2): string {
  if (!Number.isFinite(val)) return '0';
  const rounded = Number(val.toFixed(decimals));
  return String(rounded);
}

function NumericField({
  id,
  value,
  min,
  max,
  decimals = 2,
  disabled = false,
  ariaLabel,
  className,
  onValueChange,
}: NumericFieldProps) {
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState(() => formatNumericDraft(value, decimals));
  const hasTypedRef = useRef(false);
  const selectAllPendingRef = useRef(false);
  const selectTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!focused) {
      setDraft(formatNumericDraft(value, decimals));
    }
  }, [value, decimals, focused]);

  useEffect(() => {
    return () => {
      if (selectTimerRef.current !== null) {
        window.clearTimeout(selectTimerRef.current);
      }
    };
  }, []);

  const clampFinal = (num: number): number => {
    let next = num;
    if (typeof min === 'number') next = Math.max(min, next);
    if (typeof max === 'number') next = Math.min(max, next);
    return Number(next.toFixed(decimals));
  };

  const selectFullText = (input: HTMLInputElement) => {
    if (hasTypedRef.current || document.activeElement !== input) return;
    const len = input.value.length;
    if (len === 0) return;
    try {
      input.setSelectionRange(0, len);
    } catch {
      try {
        input.select();
      } catch {
        // ignore unsupported input selection
      }
    }
  };

  return (
    <input
      id={id}
      type="text"
      inputMode={decimals > 0 ? 'decimal' : 'numeric'}
      disabled={disabled}
      placeholder="0"
      aria-label={ariaLabel}
      value={draft}
      onFocus={(e) => {
        const input = e.currentTarget;
        setFocused(true);
        hasTypedRef.current = false;
        if (value === 0) {
          selectAllPendingRef.current = false;
          setDraft('');
          return;
        }
        const formatted = formatNumericDraft(value, decimals);
        setDraft(formatted);
        selectAllPendingRef.current = true;
        selectFullText(input);
        requestAnimationFrame(() => selectFullText(input));
        if (selectTimerRef.current !== null) {
          window.clearTimeout(selectTimerRef.current);
        }
        selectTimerRef.current = window.setTimeout(() => {
          selectFullText(input);
        }, 45);
      }}
      onPointerUp={(e) => {
        if (selectAllPendingRef.current && !hasTypedRef.current) {
          const input = e.currentTarget;
          requestAnimationFrame(() => selectFullText(input));
        }
        selectAllPendingRef.current = false;
      }}
      onChange={(e) => {
        hasTypedRef.current = true;
        selectAllPendingRef.current = false;
        let raw = e.target.value;
        // Prevent a sticky leading zero when typing digits (e.g. "05" -> "5"), while keeping "0." / "0,"
        if (/^0\d/.test(raw)) {
          raw = raw.replace(/^0+(?=\d)/, '');
        }
        setDraft(raw);
        const normalized = raw.replace(',', '.').trim();
        if (
          normalized === '' ||
          normalized === '.' ||
          normalized === '-' ||
          normalized.endsWith('.')
        ) {
          return;
        }
        const parsed = Number(normalized);
        if (Number.isFinite(parsed)) {
          const clampedTyping =
            typeof max === 'number'
              ? Math.min(max, Math.max(0, parsed))
              : Math.max(0, parsed);
          onValueChange(Number(clampedTyping.toFixed(decimals)));
        }
      }}
      onBlur={() => {
        setFocused(false);
        hasTypedRef.current = false;
        selectAllPendingRef.current = false;
        if (selectTimerRef.current !== null) {
          window.clearTimeout(selectTimerRef.current);
          selectTimerRef.current = null;
        }
        const normalized = draft.replace(',', '.').trim();
        if (normalized === '') {
          if (typeof min !== 'number' || min <= 0) {
            onValueChange(0);
            setDraft('0');
          } else {
            setDraft(formatNumericDraft(value, decimals));
          }
          return;
        }
        const parsed = Number(normalized);
        if (Number.isFinite(parsed)) {
          const clamped = clampFinal(parsed);
          onValueChange(clamped);
          setDraft(formatNumericDraft(clamped, decimals));
        } else {
          setDraft(formatNumericDraft(value, decimals));
        }
      }}
      className={className}
    />
  );
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

export function ComparisonStudio({
  isDark,
  lang,
  fuelFeed,
  fuelFeedLoading,
}: ComparisonStudioProps) {
  const t = TRANSLATIONS[lang];
  const [compareCount, setCompareCount] = useState<2 | 3>(3);
  const [slots, setSlots] = useState<CarSlotConfig[]>(DEFAULT_SLOTS);
  const [pendingPick, setPendingPick] = useState<PowertrainId[] | null>(null);
  const [mobileEditIdx, setMobileEditIdx] = useState<number>(0);
  const [customMixMode, setCustomMixMode] = useState<boolean>(false);
  const [simCustomMixMode, setSimCustomMixMode] = useState<boolean>(false);
  const [simDialog, setSimDialog] = useState<'oil' | 'charging' | 'tco' | null>(
    null
  );
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
    monthlyChargingFee: 5,
    wallboxCost: 1200,
    rentWallboxElectric: true,
    rentWallboxHybrid: false,
    buyWallboxElectric: true,
    buyWallboxHybrid: false,
  });
  const [draftAssumptions, setDraftAssumptions] =
    useState<GlobalAssumptions>(assumptions);
  const initialSimRates: ScenarioRates = extractScenarioRates(
    assumptions,
    DEFAULT_SLOTS
  );
  const [simRates, setSimRates] = useState<ScenarioRates>(initialSimRates);
  const [draftSimRates, setDraftSimRates] =
    useState<ScenarioRates>(initialSimRates);
  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>([]);
  const scenarioCounterRef = useRef<number>(1);
  const [selectedCountry, setSelectedCountry] = useState<string>(
    LANG_DEFAULT_COUNTRY[lang]
  );
  const [fuelCustomEdited, setFuelCustomEdited] = useState<boolean>(false);
  const userEditedFuelRef = useRef<boolean>(false);
  const userSelectedCountryRef = useRef<boolean>(false);
  const initialFeedSyncedRef = useRef<boolean>(false);
  const columnsRef = useRef<HTMLDivElement | null>(null);
  const mobileEditorRef = useRef<HTMLDivElement | null>(null);
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
    draftAssumptions.monthlyChargingFee !== assumptions.monthlyChargingFee ||
    draftAssumptions.wallboxCost !== assumptions.wallboxCost ||
    draftAssumptions.rentWallboxElectric !== assumptions.rentWallboxElectric ||
    draftAssumptions.rentWallboxHybrid !== assumptions.rentWallboxHybrid ||
    draftAssumptions.buyWallboxElectric !== assumptions.buyWallboxElectric ||
    draftAssumptions.buyWallboxHybrid !== assumptions.buyWallboxHybrid;

  useEffect(() => {
    if (!simDialog) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSimDialog(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [simDialog]);

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
    const nextSimRates = extractScenarioRates(draftAssumptions, activeCars);
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
    setSimDialog(null);
    requestAnimationFrame(() => {
      simChartRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const MAX_SAVED_SCENARIOS = 5;

  const handleSaveScenario = () => {
    const includeTcoScope = assumptions.comparisonMode !== 'energy';
    setSimRates(draftSimRates);
    const existing = savedScenarios.find((s) =>
      areScenarioRatesEqual(
        s.rates,
        draftSimRates,
        sensitivityCars,
        includeTcoScope
      )
    );
    if (existing) {
      if (!existing.visible) {
        setSavedScenarios((prev) =>
          prev.map((s) =>
            s.id === existing.id ? { ...s, visible: true } : s
          )
        );
      }
      return;
    }
    if (savedScenarios.length >= MAX_SAVED_SCENARIOS) return;

    const usedColors = new Set(savedScenarios.map((s) => s.color));
    const paletteEntry =
      SCENARIO_COLOR_PALETTE.find((p) => !usedColors.has(p.light)) ??
      SCENARIO_COLOR_PALETTE[
        savedScenarios.length % SCENARIO_COLOR_PALETTE.length
      ];

    const num = scenarioCounterRef.current;
    scenarioCounterRef.current += 1;

    const nextScenario: SavedScenario = {
      id: `sc-${Date.now()}-${num}`,
      shortTag: `S${num}`,
      color: paletteEntry.light,
      darkColor: paletteEntry.dark,
      visible: true,
      rates: {
        ...draftSimRates,
        tcoBySlot: draftSimRates.tcoBySlot
          ? { ...draftSimRates.tcoBySlot }
          : buildBaseTcoOverrides(activeCars),
      },
    };

    setSavedScenarios((prev) => [...prev, nextScenario]);
  };

  const handleToggleScenarioVisibility = (id: string) => {
    setSavedScenarios((prev) =>
      prev.map((s) => (s.id === id ? { ...s, visible: !s.visible } : s))
    );
  };

  const handleLoadScenario = (scenario: SavedScenario) => {
    const loaded: ScenarioRates = {
      ...scenario.rates,
      tcoBySlot: scenario.rates.tcoBySlot
        ? { ...scenario.rates.tcoBySlot }
        : buildBaseTcoOverrides(activeCars),
    };
    setDraftSimRates(loaded);
    setSimRates(loaded);
    setSavedScenarios((prev) =>
      prev.map((s) => (s.id === scenario.id ? { ...s, visible: true } : s))
    );
  };

  const handleDeleteScenario = (id: string) => {
    setSavedScenarios((prev) => prev.filter((s) => s.id !== id));
  };

  const handleClearScenarios = () => {
    setSavedScenarios([]);
    scenarioCounterRef.current = 1;
  };

  const activeCars = slots.slice(0, compareCount);
  const effectiveEditIdx = mobileEditIdx >= compareCount ? 0 : mobileEditIdx;
  const results = activeCars.map((car) => calculateTco(car, assumptions));

  const sensitivityCars =
    compareCount === 2 || sensitivityScope === 'all'
      ? activeCars
      : sensitivityScope === '0-1'
        ? [activeCars[0], activeCars[1]]
        : sensitivityScope === '0-2'
          ? [activeCars[0], activeCars[2]]
          : [activeCars[1], activeCars[2]];

  const isEnergyOnly = assumptions.comparisonMode === 'energy';
  const includeTcoScenario = !isEnergyOnly && sensitivityView === '1d';

  const draftSimAssumptions: GlobalAssumptions = {
    ...assumptions,
    ...draftSimRates,
  };
  const draftSimBlendedElecPrice =
    getBlendedElectricityPrice(draftSimAssumptions);

  const hasPendingSim = !areScenarioRatesEqual(
    draftSimRates,
    simRates,
    sensitivityCars,
    includeTcoScenario
  );
  const baseRates = extractScenarioRates(assumptions, activeCars);
  const hasActiveSimulation = !areScenarioRatesEqual(
    simRates,
    baseRates,
    sensitivityCars,
    includeTcoScenario
  );
  const isSimModified =
    !areScenarioRatesEqual(
      draftSimRates,
      baseRates,
      sensitivityCars,
      includeTcoScenario
    ) || hasActiveSimulation;
  const draftMatchesSaved = savedScenarios.some((s) =>
    areScenarioRatesEqual(
      s.rates,
      draftSimRates,
      sensitivityCars,
      includeTcoScenario
    )
  );

  const sensitivity = computeSensitivity(
    sensitivityCars,
    assumptions,
    sensitivityMode
  );
  const energyMap2D = computeEnergyMap2D(sensitivityCars, assumptions);

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
  const hasActiveHybrid = activeCars.some((c) => c.powertrain === 'hybrid');
  const hasAnyWallboxBuy = results.some((r) => r.wallboxCost > 0);
  const hasAnyWallboxRent = results.some((r) => r.totalFixedChargingFee > 0);
  const activeFeedCountry = fuelFeed?.countries.find(
    (c) => c.countryCode === selectedCountry
  );
  const isCurrentCountryDailyLive = Boolean(
    activeFeedCountry?.isDailyLive ||
      (selectedCountry === 'EU' &&
        fuelFeed?.countries.some((c) => c.isDailyLive))
  );

  const buildSlotForPowertrain = (
    slotId: string,
    pt: PowertrainId,
    existingPool: CarSlotConfig[],
    fallbackBody: BodyClassId
  ): CarSlotConfig => {
    const match = existingPool.find((c) => c.powertrain === pt);
    if (match) return { ...match, slotId };
    return createSlotFromPreset(slotId, pt, fallbackBody);
  };

  const handleSetCompareCount = (nextCount: 2 | 3) => {
    setPendingPick(null);
    setCompareCount(nextCount);
    if (nextCount === 2) {
      setSensitivityScope('all');
      if (mobileEditIdx > 1) setMobileEditIdx(0);
    }
  };

  const syncSimSlotsList = (nextSlots: CarSlotConfig[]) => {
    const firstHybrid = nextSlots.find((s) => s.powertrain === 'hybrid');
    const nextMap = buildBaseTcoOverrides(nextSlots);
    const applySync = (prev: ScenarioRates): ScenarioRates => ({
      ...prev,
      hybridTripProfile: firstHybrid
        ? firstHybrid.hybridTripProfile
        : prev.hybridTripProfile,
      tcoBySlot: nextMap,
    });
    setDraftSimRates(applySync);
    setSimRates(applySync);
  };

  const handleSketchTypeClick = (pt: PowertrainId) => {
    if (pendingPick !== null) {
      const idx = pendingPick.indexOf(pt);
      if (idx >= 0) {
        setPendingPick(pendingPick.filter((item) => item !== pt));
        return;
      }
      if (pendingPick.length === 0) {
        setPendingPick([pt]);
        return;
      }
      const nextPts: [PowertrainId, PowertrainId] = [pendingPick[0], pt];
      const nextSlot1 = buildSlotForPowertrain(
        'slot-1',
        nextPts[0],
        slots,
        slots[0].bodyClass
      );
      const nextSlot2 = buildSlotForPowertrain(
        'slot-2',
        nextPts[1],
        slots,
        slots[1].bodyClass
      );
      const nextSlots = [nextSlot1, nextSlot2, slots[2]];
      setSlots(nextSlots);
      setCompareCount(2);
      setSensitivityScope('all');
      setPendingPick(null);
      syncSimSlotsList(nextSlots);
      return;
    }

    const existingIdx = activeCars.findIndex((c) => c.powertrain === pt);

    if (existingIdx >= 0) {
      if (compareCount === 3) {
        const remaining = activeCars.filter((_, i) => i !== existingIdx);
        const dropped = activeCars[existingIdx];
        const nextSlots = [
          { ...remaining[0], slotId: 'slot-1' },
          { ...remaining[1], slotId: 'slot-2' },
          { ...dropped, slotId: 'slot-3' },
        ];
        setCompareCount(2);
        setSensitivityScope('all');
        if (mobileEditIdx >= 2) setMobileEditIdx(0);
        setSlots(nextSlots);
        syncSimSlotsList(nextSlots);
      } else {
        const remainingPt =
          activeCars.find((_, i) => i !== existingIdx)?.powertrain ?? null;
        setPendingPick(remainingPt ? [remainingPt] : []);
      }
      return;
    }

    if (compareCount === 2) {
      const nextThird = createSlotFromPreset(
        'slot-3',
        pt,
        activeCars[0].bodyClass
      );
      const nextSlots = [activeCars[0], activeCars[1], nextThird];
      setSlots(nextSlots);
      setCompareCount(3);
      syncSimSlotsList(nextSlots);
    } else {
      const nextSlots = [
        slots[0],
        slots[1],
        createSlotFromPreset('slot-3', pt, slots[2].bodyClass),
      ];
      setSlots(nextSlots);
      syncSimSlotsList(nextSlots);
    }
  };

  const applyQuickPreset = (types: PowertrainId[]) => {
    const count = types.length === 2 ? 2 : 3;
    setPendingPick(null);
    setCompareCount(count);
    if (count === 2) {
      setSensitivityScope('all');
      if (mobileEditIdx >= 2) setMobileEditIdx(0);
    }
    const nextSlots = [
      createSlotFromPreset('slot-1', types[0], slots[0].bodyClass),
      createSlotFromPreset('slot-2', types[1], slots[1].bodyClass),
      createSlotFromPreset('slot-3', types[2] ?? 'electric', slots[2].bodyClass),
    ];
    setSlots(nextSlots);
    syncSimSlotsList(nextSlots);
  };

  const quickPresetOptions: Array<{
    label: string;
    types: PowertrainId[];
  }> =
    compareCount === 2
      ? [
          { label: t.studio.quickGasEv, types: ['gasoline', 'electric'] },
          { label: t.studio.quickGasHyb, types: ['gasoline', 'hybrid'] },
          { label: t.studio.quickHybEv, types: ['hybrid', 'electric'] },
        ]
      : [
          {
            label: t.studio.quickGasHybEv,
            types: ['gasoline', 'hybrid', 'electric'],
          },
          {
            label: t.studio.quickDieselHybEv,
            types: ['diesel', 'hybrid', 'electric'],
          },
        ];

  const isPresetActive = (types: PowertrainId[]) =>
    pendingPick === null &&
    activeCars.length === types.length &&
    types.every((pt, i) => activeCars[i]?.powertrain === pt);

  const displayedPowertrains: PowertrainId[] =
    pendingPick !== null
      ? pendingPick
      : activeCars.map((c) => c.powertrain);

  const syncSimSlotFromBase = (nextSlot: CarSlotConfig) => {
    const syncRates = (prev: ScenarioRates): ScenarioRates => ({
      ...prev,
      hybridTripProfile:
        nextSlot.powertrain === 'hybrid'
          ? nextSlot.hybridTripProfile
          : prev.hybridTripProfile,
      tcoBySlot: {
        ...(prev.tcoBySlot ?? {}),
        [nextSlot.slotId]: {
          purchasePrice: nextSlot.purchasePrice,
          resalePct: nextSlot.resalePct,
        },
      },
    });
    setDraftSimRates(syncRates);
    setSimRates(syncRates);
  };

  const updateSlotPowertrain = (idx: number, nextPt: PowertrainId) => {
    const target = slots[idx];
    const nextSlot = createSlotFromPreset(
      target.slotId,
      nextPt,
      target.bodyClass
    );
    setSlots((prev) => prev.map((slot, i) => (i === idx ? nextSlot : slot)));
    syncSimSlotFromBase(nextSlot);
  };

  const updateSlotBodyClass = (idx: number, nextBody: BodyClassId) => {
    const target = slots[idx];
    const nextSlot = createSlotFromPreset(
      target.slotId,
      target.powertrain,
      nextBody
    );
    setSlots((prev) => prev.map((slot, i) => (i === idx ? nextSlot : slot)));
    syncSimSlotFromBase(nextSlot);
  };

  const updateSlotField = (
    idx: number,
    field: keyof Pick<
      CarSlotConfig,
      | 'purchasePrice'
      | 'subsidyAmount'
      | 'consumption'
      | 'hybridWeightedFuel'
      | 'hybridDepletedFuel'
      | 'hybridElectricRangeKm'
      | 'hybridBatteryKwh'
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
    if (field === 'purchasePrice' || field === 'resalePct') {
      const target = slots[idx];
      if (target) {
        syncSimSlotFromBase({ ...target, [field]: safeValue });
      }
    }
  };

  const updateSlotTripProfile = (idx: number, profile: HybridTripProfile) => {
    setSlots((prev) =>
      prev.map((slot, i) =>
        i === idx ? { ...slot, hybridTripProfile: profile } : slot
      )
    );
    const target = slots[idx];
    if (target) {
      syncSimSlotFromBase({ ...target, hybridTripProfile: profile });
    }
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
    const hybridFallback = CAR_PRESETS.hybrid[target.bodyClass];
    const resetSlot: CarSlotConfig = {
      ...target,
      purchasePrice: preset.purchasePrice,
      subsidyEnabled: false,
      subsidyAmount: preset.defaultSubsidy,
      consumption: preset.consumption,
      hybridWeightedFuel:
        preset.hybridWeightedFuel ?? hybridFallback.hybridWeightedFuel ?? 1.6,
      hybridDepletedFuel:
        preset.hybridDepletedFuel ?? hybridFallback.hybridDepletedFuel ?? 6.2,
      hybridElectricRangeKm:
        preset.hybridElectricRangeKm ??
        hybridFallback.hybridElectricRangeKm ??
        65,
      hybridBatteryKwh:
        preset.hybridBatteryKwh ?? hybridFallback.hybridBatteryKwh ?? 13.0,
      hybridTripProfile: 'short',
      annualService: preset.annualService,
      annualTax: preset.annualTax,
      annualInsurance: preset.annualInsurance,
      resalePct: preset.resalePct5Yr,
    };
    setSlots((prev) => prev.map((slot, i) => (i === idx ? resetSlot : slot)));
    syncSimSlotFromBase(resetSlot);
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
                onClick={() => handleSetCompareCount(2)}
              >
                {t.studio.twoCars}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={compareCount === 3}
                className={`seg-btn${compareCount === 3 ? ' is-active' : ''}`}
                onClick={() => handleSetCompareCount(3)}
              >
                {t.studio.threeCars}
              </button>
            </div>

            <div className="preset-links" aria-label="Quick comparisons">
              {quickPresetOptions.map((preset, pIdx) => (
                <span key={preset.label} className="preset-link-item">
                  {pIdx > 0 && (
                    <span aria-hidden="true" className="preset-sep">
                      ·
                    </span>
                  )}
                  <button
                    type="button"
                    className={`preset-link-btn${
                      isPresetActive(preset.types) ? ' is-active' : ''
                    }`}
                    onClick={() => applyQuickPreset(preset.types)}
                  >
                    {preset.label}
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Standalone Comparison Scope Strip (structurally independent of the 4 car-type cards) */}
        <div className="scope-bar">
          <div className="scope-bar-controls">
            <span className="scope-bar-label">{t.studio.scopeAria}</span>
            <div
              className="scope-segmented"
              role="radiogroup"
              aria-label={t.studio.scopeAria}
            >
              <button
                type="button"
                role="radio"
                aria-checked={isEnergyOnly}
                className={`scope-pill-btn${isEnergyOnly ? ' is-active' : ''}`}
                onClick={() => setComparisonMode('energy')}
              >
                {t.studio.scopeEnergyTitle}
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={!isEnergyOnly}
                className={`scope-pill-btn${!isEnergyOnly ? ' is-active' : ''}`}
                onClick={() => setComparisonMode('tco')}
              >
                {t.studio.scopeTcoTitle}
              </button>
            </div>
          </div>
          <p className="scope-bar-desc">
            {isEnergyOnly ? t.studio.scopeEnergyDesc : t.studio.scopeTcoDesc}
          </p>
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
            const activeSlotIndices = displayedPowertrains
              .map((p, idx) => (p === ptId ? idx : -1))
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
                style={
                  {
                    '--pt-color': color,
                    '--pt-badge-text': isDark ? '#111614' : '#ffffff',
                  } as React.CSSProperties
                }
                onClick={() => handleSketchTypeClick(ptId)}
              >
                <div className="sketch-card-top">
                  <span className="sketch-card-title">{ptText.label}</span>
                  <span className="sketch-card-state">
                    {isSelected
                      ? `✓ ${activeSlotIndices
                          .map((i) => `${t.studio.carWord} ${i + 1}`)
                          .join(' · ')} ×`
                      : pendingPick === null && compareCount === 2
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
                    {ptId === 'hybrid'
                      ? t.studio.hybridShortCardNote(
                          String(baselinePreset.hybridWeightedFuel ?? 1.6),
                          baselinePreset.hybridElectricRangeKm ?? 65
                        )
                      : `${baselinePreset.consumption} ${meta.consumptionUnit}`}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
        <p
          className={`sketch-helper-note${pendingPick !== null ? ' is-warn' : ''}`}
          aria-live="polite"
        >
          {pendingPick !== null
            ? t.studio.sketchHelperNeedTwo(pendingPick.length)
            : t.studio.sketchHelperDefault(compareCount)}
        </p>

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
              <NumericField
                id="gas-price-input"
                min={0.5}
                max={4}
                decimals={2}
                value={draftAssumptions.gasolinePrice}
                onValueChange={(nextVal) => {
                  userEditedFuelRef.current = true;
                  setFuelCustomEdited(true);
                  setDraftAssumptions((prev) => ({
                    ...prev,
                    gasolinePrice: nextVal,
                  }));
                }}
                className="num-input tabular-nums"
              />
            </div>

            <div className="assumption-field">
              <label htmlFor="diesel-price-input" className="assumption-label">
                {t.studio.dieselRate}
              </label>
              <NumericField
                id="diesel-price-input"
                min={0.5}
                max={4}
                decimals={2}
                value={draftAssumptions.dieselPrice}
                onValueChange={(nextVal) => {
                  userEditedFuelRef.current = true;
                  setFuelCustomEdited(true);
                  setDraftAssumptions((prev) => ({
                    ...prev,
                    dieselPrice: nextVal,
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
              {fuelFeed && (
                <>
                  <button
                    type="button"
                    disabled={!fuelCustomEdited}
                    className={`reset-link sim-reset-btn${
                      fuelCustomEdited ? '' : ' is-synced'
                    }`}
                    onClick={() => handleSelectCountry(selectedCountry)}
                  >
                    {t.studio.applyLiveRate}
                  </button>
                  {isCurrentCountryDailyLive && (
                    <span className="fuel-live-badge">{t.studio.liveDailyTag}</span>
                  )}
                  <span className="fuel-feed-meta tabular-nums">
                    {t.studio.liveSourcePrefix}
                    {fuelFeed.bulletinDate ? ` · ${fuelFeed.bulletinDate}` : ''}
                  </span>
                </>
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
                  <div
                    className="horizon-tabs charging-mix-tabs"
                    role="group"
                    aria-label={t.studio.elecTariffsTitle}
                  >
                    <button
                      type="button"
                      className={`horizon-btn${isHomePreset ? ' is-active' : ''}`}
                      onClick={() => applyChargingMixPreset(80, 15, 5)}
                    >
                      {t.studio.mixHome}
                    </button>
                    <button
                      type="button"
                      className={`horizon-btn${isMixedPreset ? ' is-active' : ''}`}
                      onClick={() => applyChargingMixPreset(50, 30, 20)}
                    >
                      {t.studio.mixMixed}
                    </button>
                    <button
                      type="button"
                      className={`horizon-btn${isPublicPreset ? ' is-active' : ''}`}
                      onClick={() => applyChargingMixPreset(0, 50, 50)}
                    >
                      {t.studio.mixPublic}
                    </button>
                    <button
                      type="button"
                      className={`horizon-btn${customMixMode ? ' is-active' : ''}`}
                      onClick={() => setCustomMixMode(true)}
                    >
                      {t.studio.mixCustom}
                    </button>
                  </div>
                  <span
                    className={`mix-total-note tabular-nums${
                      customMixMode && totalMixPct !== 100
                        ? ' is-error'
                        : totalMixPct !== 100
                          ? ' is-warn'
                          : ''
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
                    <div className="tier-share-input-wrap tabular-nums">
                      <NumericField
                        min={0}
                        max={100}
                        decimals={0}
                        value={draftAssumptions.homeAcShare}
                        onValueChange={(nextVal) =>
                          updateChargingShare('homeAcShare', nextVal)
                        }
                        ariaLabel={`${t.studio.homeAcLabel} ${t.studio.shareSuffix}`}
                        className="tier-share-input tabular-nums"
                      />
                      <span>%</span>
                    </div>
                  </div>
                  <div className="tier-controls">
                    <NumericField
                      id="home-ac-price"
                      min={0.05}
                      max={1.5}
                      decimals={2}
                      value={draftAssumptions.homeAcPrice}
                      onValueChange={(nextVal) =>
                        setDraftAssumptions((prev) => ({
                          ...prev,
                          homeAcPrice: nextVal,
                        }))
                      }
                      ariaLabel={t.studio.homeAcLabel}
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
                    <div className="tier-share-input-wrap tabular-nums">
                      <NumericField
                        min={0}
                        max={100}
                        decimals={0}
                        value={draftAssumptions.publicAcShare}
                        onValueChange={(nextVal) =>
                          updateChargingShare('publicAcShare', nextVal)
                        }
                        ariaLabel={`${t.studio.publicAcLabel} ${t.studio.shareSuffix}`}
                        className="tier-share-input tabular-nums"
                      />
                      <span>%</span>
                    </div>
                  </div>
                  <div className="tier-controls">
                    <NumericField
                      id="public-ac-price"
                      min={0.05}
                      max={1.5}
                      decimals={2}
                      value={draftAssumptions.publicAcPrice}
                      onValueChange={(nextVal) =>
                        setDraftAssumptions((prev) => ({
                          ...prev,
                          publicAcPrice: nextVal,
                        }))
                      }
                      ariaLabel={t.studio.publicAcLabel}
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
                    <div className="tier-share-input-wrap tabular-nums">
                      <NumericField
                        min={0}
                        max={100}
                        decimals={0}
                        value={draftAssumptions.publicDcShare}
                        onValueChange={(nextVal) =>
                          updateChargingShare('publicDcShare', nextVal)
                        }
                        ariaLabel={`${t.studio.publicDcLabel} ${t.studio.shareSuffix}`}
                        className="tier-share-input tabular-nums"
                      />
                      <span>%</span>
                    </div>
                  </div>
                  <div className="tier-controls">
                    <NumericField
                      id="public-dc-price"
                      min={0.05}
                      max={2.0}
                      decimals={2}
                      value={draftAssumptions.publicDcPrice}
                      onValueChange={(nextVal) =>
                        setDraftAssumptions((prev) => ({
                          ...prev,
                          publicDcPrice: nextVal,
                        }))
                      }
                      ariaLabel={t.studio.publicDcLabel}
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
                <div className="assumption-field">
                  <label
                    htmlFor="rent-wallbox-input"
                    className="assumption-label"
                  >
                    {t.studio.fixedFeeLabel}
                  </label>
                  <NumericField
                    id="rent-wallbox-input"
                    min={0}
                    max={100}
                    decimals={0}
                    value={draftAssumptions.monthlyChargingFee}
                    onValueChange={(nextVal) =>
                      setDraftAssumptions((prev) => ({
                        ...prev,
                        monthlyChargingFee: nextVal,
                      }))
                    }
                    className="num-input tabular-nums"
                  />
                  <div
                    className="wallbox-applies-row"
                    role="group"
                    aria-label={`${t.studio.fixedFeeLabel} — ${t.studio.appliesToLabel}`}
                  >
                    <span className="wallbox-applies-label">
                      {t.studio.appliesToLabel}:
                    </span>
                    {hasElectric && (
                      <label className="wallbox-check-label">
                        <input
                          type="checkbox"
                          checked={draftAssumptions.rentWallboxElectric}
                          onChange={(e) =>
                            setDraftAssumptions((prev) => ({
                              ...prev,
                              rentWallboxElectric: e.target.checked,
                            }))
                          }
                        />
                        <span>{t.powertrains.electric.shortLabel}</span>
                      </label>
                    )}
                    {hasActiveHybrid && (
                      <label className="wallbox-check-label">
                        <input
                          type="checkbox"
                          checked={draftAssumptions.rentWallboxHybrid}
                          onChange={(e) =>
                            setDraftAssumptions((prev) => ({
                              ...prev,
                              rentWallboxHybrid: e.target.checked,
                            }))
                          }
                        />
                        <span>{t.powertrains.hybrid.shortLabel}</span>
                      </label>
                    )}
                    {!hasElectric && !hasActiveHybrid && (
                      <span className="wallbox-none-note">
                        {t.studio.noPlugInSelectedNote}
                      </span>
                    )}
                  </div>
                </div>

                {!isEnergyOnly && (
                  <div className="assumption-field">
                    <label
                      htmlFor="buy-wallbox-input"
                      className="assumption-label"
                    >
                      {t.studio.wallboxLabel}
                    </label>
                    <NumericField
                      id="buy-wallbox-input"
                      min={0}
                      max={6000}
                      decimals={0}
                      value={draftAssumptions.wallboxCost}
                      onValueChange={(nextVal) =>
                        setDraftAssumptions((prev) => ({
                          ...prev,
                          wallboxCost: nextVal,
                        }))
                      }
                      className="num-input tabular-nums"
                    />
                    <div
                      className="wallbox-applies-row"
                      role="group"
                      aria-label={`${t.studio.wallboxLabel} — ${t.studio.appliesToLabel}`}
                    >
                      <span className="wallbox-applies-label">
                        {t.studio.appliesToLabel}:
                      </span>
                      {hasElectric && (
                        <label className="wallbox-check-label">
                          <input
                            type="checkbox"
                            checked={draftAssumptions.buyWallboxElectric}
                            onChange={(e) =>
                              setDraftAssumptions((prev) => ({
                                ...prev,
                                buyWallboxElectric: e.target.checked,
                              }))
                            }
                          />
                          <span>{t.powertrains.electric.shortLabel}</span>
                        </label>
                      )}
                      {hasActiveHybrid && (
                        <label className="wallbox-check-label">
                          <input
                            type="checkbox"
                            checked={draftAssumptions.buyWallboxHybrid}
                            onChange={(e) =>
                              setDraftAssumptions((prev) => ({
                                ...prev,
                                buyWallboxHybrid: e.target.checked,
                              }))
                            }
                          />
                          <span>{t.powertrains.hybrid.shortLabel}</span>
                        </label>
                      )}
                      {!hasElectric && !hasActiveHybrid && (
                        <span className="wallbox-none-note">
                          {t.studio.noPlugInSelectedNote}
                        </span>
                      )}
                    </div>
                  </div>
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

        {/* Comparison Results Anchor (Desktop Multi-Column + Mobile Side-by-Side Matrix & Tabbed Editor) */}
        <div ref={columnsRef} className="compare-results-anchor">
          <div className="mobile-compare-wrap">
            {/* Single-Car Tabbed Spec Editor for Mobile (positioned above the comparison matrix) */}
            {(() => {
              const editCar = activeCars[effectiveEditIdx] ?? activeCars[0];
              const editMeta = POWERTRAIN_META[editCar.powertrain];
              const editRes = results[effectiveEditIdx] ?? results[0];
              return (
                <div ref={mobileEditorRef} className="mobile-editor-card">
                  <div className="mobile-editor-head">
                    <span className="mobile-editor-title">
                      {t.studio.editSpecsTitle}
                    </span>
                    <button
                      type="button"
                      className="reset-link"
                      onClick={() => resetSlotToPreset(effectiveEditIdx)}
                    >
                      {t.studio.reset}
                    </button>
                  </div>

                  <div
                    className={`mobile-editor-tabs ${
                      compareCount === 2 ? 'cols-2' : 'cols-3'
                    }`}
                    role="tablist"
                    aria-label={t.studio.editSpecsTitle}
                  >
                    {activeCars.map((c, idx) => (
                      <button
                        key={c.slotId}
                        type="button"
                        role="tab"
                        aria-selected={effectiveEditIdx === idx}
                        className={`horizon-btn mobile-editor-tab${
                          effectiveEditIdx === idx ? ' is-active' : ''
                        }`}
                        onClick={() => setMobileEditIdx(idx)}
                      >
                        {t.studio.carWord} {idx + 1}:{' '}
                        {t.powertrains[c.powertrain].shortLabel}
                      </button>
                    ))}
                  </div>

                  <div
                    className="slot-pt-tabs"
                    role="tablist"
                    aria-label={`${t.studio.carWord} ${effectiveEditIdx + 1}`}
                  >
                    {POWERTRAIN_ORDER.map((pt) => (
                      <button
                        key={pt}
                        type="button"
                        role="tab"
                        aria-selected={editCar.powertrain === pt}
                        className={`slot-pt-btn${
                          editCar.powertrain === pt ? ' is-active' : ''
                        }`}
                        onClick={() =>
                          updateSlotPowertrain(effectiveEditIdx, pt)
                        }
                      >
                        {t.powertrains[pt].shortLabel}
                      </button>
                    ))}
                  </div>

                  <div
                    className="body-class-row"
                    role="group"
                    aria-label={`${t.studio.carWord} ${effectiveEditIdx + 1}`}
                  >
                    {(['compact', 'sedan', 'suv'] as BodyClassId[]).map(
                      (bodyId) => (
                        <button
                          key={bodyId}
                          type="button"
                          className={`body-class-btn${
                            editCar.bodyClass === bodyId ? ' is-active' : ''
                          }`}
                          onClick={() =>
                            updateSlotBodyClass(effectiveEditIdx, bodyId)
                          }
                        >
                          {t.bodyClasses[bodyId]}
                        </button>
                      )
                    )}
                  </div>

                  <div className="slot-inputs-grid">
                    {editCar.powertrain === 'hybrid' ? (
                      <>
                        <label className="slot-input-item">
                          <span className="slot-input-label">
                            <span>
                              {t.studio.hybridFwName}{' '}
                              <span className="nowrap-unit">(L/100 km)</span>
                            </span>
                          </span>
                          <NumericField
                            min={0}
                            max={25}
                            decimals={1}
                            value={editCar.hybridWeightedFuel}
                            onValueChange={(nextVal) =>
                              updateSlotField(
                                effectiveEditIdx,
                                'hybridWeightedFuel',
                                nextVal
                              )
                            }
                            className="slot-num-input tabular-nums"
                          />
                        </label>

                        <label className="slot-input-item">
                          <span className="slot-input-label">
                            <span>
                              {t.studio.hybridFcsName}{' '}
                              <span className="nowrap-unit">(L/100 km)</span>
                            </span>
                          </span>
                          <NumericField
                            min={1}
                            max={25}
                            decimals={1}
                            value={editCar.hybridDepletedFuel}
                            onValueChange={(nextVal) =>
                              updateSlotField(
                                effectiveEditIdx,
                                'hybridDepletedFuel',
                                nextVal
                              )
                            }
                            className="slot-num-input tabular-nums"
                          />
                        </label>

                        <label className="slot-input-item">
                          <span className="slot-input-label">
                            <span>
                              {t.studio.hybridRangeName}{' '}
                              <span className="nowrap-unit">(km)</span>
                            </span>
                          </span>
                          <NumericField
                            min={5}
                            max={250}
                            decimals={0}
                            value={editCar.hybridElectricRangeKm}
                            onValueChange={(nextVal) =>
                              updateSlotField(
                                effectiveEditIdx,
                                'hybridElectricRangeKm',
                                nextVal
                              )
                            }
                            className="slot-num-input tabular-nums"
                          />
                        </label>

                        <label className="slot-input-item">
                          <span className="slot-input-label">
                            <span>
                              {t.studio.hybridBatteryName}{' '}
                              <span className="nowrap-unit">(kWh)</span>
                            </span>
                          </span>
                          <NumericField
                            min={1}
                            max={60}
                            decimals={1}
                            value={editCar.hybridBatteryKwh}
                            onValueChange={(nextVal) =>
                              updateSlotField(
                                effectiveEditIdx,
                                'hybridBatteryKwh',
                                nextVal
                              )
                            }
                            className="slot-num-input tabular-nums"
                          />
                        </label>
                      </>
                    ) : (
                      <label className="slot-input-item">
                        <span className="slot-input-label">
                          {t.studio.combinedConsumptionName}{' '}
                          <span className="nowrap-unit">
                            ({editMeta.consumptionUnit})
                          </span>
                        </span>
                        <NumericField
                          min={1}
                          max={40}
                          decimals={1}
                          value={editCar.consumption}
                          onValueChange={(nextVal) =>
                            updateSlotField(
                              effectiveEditIdx,
                              'consumption',
                              nextVal
                            )
                          }
                          className="slot-num-input tabular-nums"
                        />
                      </label>
                    )}

                    {!isEnergyOnly && (
                      <>
                        <label className="slot-input-item">
                          <span className="slot-input-label">
                            {t.studio.purchasePriceLabel}
                          </span>
                          <NumericField
                            min={1000}
                            max={250000}
                            decimals={0}
                            value={editCar.purchasePrice}
                            onValueChange={(nextVal) =>
                              updateSlotField(
                                effectiveEditIdx,
                                'purchasePrice',
                                nextVal
                              )
                            }
                            className="slot-num-input tabular-nums"
                          />
                        </label>

                        <label className="slot-input-item">
                          <span className="slot-input-label">
                            {t.studio.serviceYrLabel}
                          </span>
                          <NumericField
                            min={0}
                            max={5000}
                            decimals={0}
                            value={editCar.annualService}
                            onValueChange={(nextVal) =>
                              updateSlotField(
                                effectiveEditIdx,
                                'annualService',
                                nextVal
                              )
                            }
                            className="slot-num-input tabular-nums"
                          />
                        </label>

                        <label className="slot-input-item">
                          <span className="slot-input-label">
                            {t.studio.roadTaxYrLabel}
                          </span>
                          <NumericField
                            min={0}
                            max={4000}
                            decimals={0}
                            value={editCar.annualTax}
                            onValueChange={(nextVal) =>
                              updateSlotField(
                                effectiveEditIdx,
                                'annualTax',
                                nextVal
                              )
                            }
                            className="slot-num-input tabular-nums"
                          />
                        </label>

                        <label className="slot-input-item">
                          <span className="slot-input-label">
                            {t.studio.insuranceYrLabel}
                          </span>
                          <NumericField
                            min={0}
                            max={6000}
                            decimals={0}
                            value={editCar.annualInsurance}
                            onValueChange={(nextVal) =>
                              updateSlotField(
                                effectiveEditIdx,
                                'annualInsurance',
                                nextVal
                              )
                            }
                            className="slot-num-input tabular-nums"
                          />
                        </label>

                        <label className="slot-input-item">
                          <span className="slot-input-label">
                            {t.studio.resaleLabel}
                          </span>
                          <NumericField
                            min={10}
                            max={90}
                            decimals={0}
                            value={editCar.resalePct}
                            onValueChange={(nextVal) =>
                              updateSlotField(
                                effectiveEditIdx,
                                'resalePct',
                                nextVal
                              )
                            }
                            className="slot-num-input tabular-nums"
                          />
                        </label>
                      </>
                    )}
                  </div>

                  {editCar.powertrain === 'hybrid' && editRes.hybridStats && (
                    <div className="hybrid-config-block">
                      <span className="assumption-label">
                        {t.studio.hybridTripLabel}
                      </span>
                      <div
                        className="hybrid-trip-toggle"
                        role="group"
                        aria-label={t.studio.hybridTripLabel}
                      >
                        <button
                          type="button"
                          className={`horizon-btn${
                            editCar.hybridTripProfile === 'short'
                              ? ' is-active'
                              : ''
                          }`}
                          onClick={() =>
                            updateSlotTripProfile(effectiveEditIdx, 'short')
                          }
                        >
                          {t.studio.hybridTripShort}
                        </button>
                        <button
                          type="button"
                          className={`horizon-btn${
                            editCar.hybridTripProfile === 'long'
                              ? ' is-active'
                              : ''
                          }`}
                          onClick={() =>
                            updateSlotTripProfile(effectiveEditIdx, 'long')
                          }
                        >
                          {t.studio.hybridTripLong}
                        </button>
                      </div>
                      <p className="hybrid-share-note tabular-nums">
                        {t.studio.hybridShareSummary(
                          String(
                            Math.round(editRes.hybridStats.electricShareS * 100)
                          ),
                          String(Math.round(editRes.hybridStats.uf * 100)),
                          editRes.hybridStats.fuelPer100Km.toFixed(1),
                          editRes.hybridStats.elecWallPer100Km.toFixed(1)
                        )}
                      </p>
                    </div>
                  )}

                  {!isEnergyOnly &&
                    (editCar.powertrain === 'hybrid' ||
                      editCar.powertrain === 'electric') && (
                      <div className="subsidy-row">
                        <label className="subsidy-toggle">
                          <input
                            type="checkbox"
                            checked={editCar.subsidyEnabled}
                            onChange={() => toggleSlotSubsidy(effectiveEditIdx)}
                          />
                          <span>{t.studio.optionalSubsidy}</span>
                        </label>
                        <NumericField
                          min={0}
                          max={25000}
                          decimals={0}
                          disabled={!editCar.subsidyEnabled}
                          value={editCar.subsidyAmount}
                          onValueChange={(nextVal) =>
                            updateSlotField(
                              effectiveEditIdx,
                              'subsidyAmount',
                              nextVal
                            )
                          }
                          ariaLabel={`${t.studio.optionalSubsidy} ${t.studio.carWord} ${effectiveEditIdx + 1}`}
                          className="subsidy-input tabular-nums"
                        />
                      </div>
                    )}
                </div>
              );
            })()}

            {/* Compact Side-by-Side Comparison Matrix */}
            <div className="mobile-matrix-card">
              <div className="mobile-matrix-head">
                <h3 className="mobile-matrix-title">{t.studio.sideBySideTitle}</h3>
                <span className="mobile-matrix-scope">
                  {isEnergyOnly
                    ? t.studio.energyOnlyTag
                    : t.studio.tcoSuffix(assumptions.years)}
                </span>
              </div>

              <div
                className={`mobile-matrix-grid ${
                  compareCount === 2 ? 'cols-2' : 'cols-3'
                }`}
              >
                {activeCars.map((car, idx) => {
                  const res = results[idx];
                  const meta = POWERTRAIN_META[car.powertrain];
                  const color = isDark ? meta.darkColor : meta.color;
                  const isWinner = idx === bestIdx;
                  const deltaVsWinner = res.activeTotal - minActiveTotal;
                  const eneW = (res.totalEnergyCost / maxActiveTotal) * 100;
                  const depW = isEnergyOnly
                    ? 0
                    : (res.netDepreciation / maxActiveTotal) * 100;
                  const srvW = isEnergyOnly
                    ? 0
                    : (res.totalServiceCost / maxActiveTotal) * 100;
                  const taxInsW = isEnergyOnly
                    ? 0
                    : ((res.totalTaxCost + res.totalInsuranceCost) /
                        maxActiveTotal) *
                      100;

                  return (
                    <div
                      key={car.slotId}
                      className={`mobile-matrix-col${
                        isWinner ? ' is-leader' : ''
                      }`}
                      style={isWinner ? { borderColor: color } : undefined}
                    >
                      <div
                        className="mobile-col-bar"
                        style={{ backgroundColor: color }}
                      />
                      <div className="mobile-col-header">
                        <span className="mobile-col-num">
                          {t.studio.carWord} {idx + 1}
                        </span>
                        <button
                          type="button"
                          className="mobile-col-edit-btn"
                          onClick={() => {
                            setMobileEditIdx(idx);
                            mobileEditorRef.current?.scrollIntoView({
                              behavior: 'smooth',
                              block: 'nearest',
                            });
                          }}
                        >
                          {t.studio.editButton}
                        </button>
                      </div>

                      <div className="mobile-col-sketch">
                        <CarSketch
                          powertrain={car.powertrain}
                          bodyClass={car.bodyClass}
                          accentColor={color}
                          className="mobile-matrix-sketch-svg"
                        />
                      </div>

                      <div className="mobile-col-identity">
                        <strong className="mobile-col-pt">
                          {t.powertrains[car.powertrain].shortLabel}
                        </strong>
                        <span className="mobile-col-body">
                          {t.bodyClasses[car.bodyClass]}
                        </span>
                      </div>

                      {isWinner ? (
                        <span
                          className="mobile-col-badge is-winner"
                          style={{ backgroundColor: color, color: '#f4f6f5' }}
                        >
                          {t.studio.winnerShort}
                        </span>
                      ) : (
                        <span className="mobile-col-badge tabular-nums">
                          +{formatEur(deltaVsWinner, 0, t.locale)}
                        </span>
                      )}

                      <div className="mobile-col-primary">
                        <span className="mobile-col-total tabular-nums">
                          {formatEur(res.activeTotal, 0, t.locale)}
                        </span>
                        <span className="mobile-col-sub tabular-nums">
                          {formatEur(res.activeMonthly, 0, t.locale)}/
                          {t.studio.moUnit}
                        </span>
                        <span className="mobile-col-sub tabular-nums">
                          {formatEur(res.activePerKm, 2, t.locale)}/
                          {t.studio.kmUnit}
                        </span>
                      </div>

                      <div className="cost-bar-track mobile-col-track">
                        {!isEnergyOnly && (
                          <span
                            className="cost-seg"
                            style={{ width: `${depW}%`, backgroundColor: color }}
                          />
                        )}
                        <span
                          className="cost-seg"
                          style={{
                            width: `${eneW}%`,
                            backgroundColor: color,
                            opacity: isEnergyOnly ? 1 : 0.62,
                          }}
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
                            />
                            <span
                              className="cost-seg"
                              style={{
                                width: `${taxInsW}%`,
                                backgroundColor: color,
                                opacity: 0.22,
                              }}
                            />
                          </>
                        )}
                      </div>

                      <dl className="mobile-col-rows">
                        <div className="mobile-col-row">
                          <dt>{t.studio.annualEnergyLabel}</dt>
                          <dd className="tabular-nums" style={{ color }}>
                            {formatEur(res.annualEnergyCost, 0, t.locale)}/
                            {t.studio.yrUnit}
                          </dd>
                        </div>
                        <div className="mobile-col-row">
                          <dt>100 km</dt>
                          <dd className="tabular-nums">
                            {formatEur(res.energyCostPer100Km, 2, t.locale)}
                          </dd>
                        </div>
                        <div className="mobile-col-row">
                          <dt className="nowrap-unit">
                            {car.powertrain === 'hybrid' && res.hybridStats
                              ? 'L + kWh/100km'
                              : meta.consumptionUnit}
                          </dt>
                          <dd className="tabular-nums">
                            {car.powertrain === 'hybrid' && res.hybridStats
                              ? `${res.hybridStats.fuelPer100Km.toFixed(1)} + ${res.hybridStats.elecWallPer100Km.toFixed(1)}`
                              : car.consumption.toFixed(1)}
                          </dd>
                        </div>
                        {!isEnergyOnly && (
                          <>
                            <div className="mobile-col-row">
                              <dt>{t.studio.depreciationShort}</dt>
                              <dd className="tabular-nums">
                                {formatEur(res.netDepreciation, 0, t.locale)}
                              </dd>
                            </div>
                            {hasAnyWallboxBuy && (
                              <div className="mobile-col-row">
                                <dt>{t.studio.oneTimeWallbox}</dt>
                                <dd className="tabular-nums">
                                  {res.wallboxCost > 0
                                    ? formatEur(res.wallboxCost, 0, t.locale)
                                    : '—'}
                                </dd>
                              </div>
                            )}
                            {hasAnyWallboxRent && (
                              <div className="mobile-col-row">
                                <dt>{t.studio.fixedFeeShort}</dt>
                                <dd className="tabular-nums">
                                  {res.totalFixedChargingFee > 0
                                    ? formatEur(
                                        res.totalFixedChargingFee,
                                        0,
                                        t.locale
                                      )
                                    : '—'}
                                </dd>
                              </div>
                            )}
                            <div className="mobile-col-row">
                              <dt>{t.studio.energySpendLabel}</dt>
                              <dd className="tabular-nums">
                                {formatEur(res.totalEnergyCost, 0, t.locale)}
                              </dd>
                            </div>
                            <div className="mobile-col-row">
                              <dt>{t.studio.maintenanceShort}</dt>
                              <dd className="tabular-nums">
                                {formatEur(res.totalServiceCost, 0, t.locale)}
                              </dd>
                            </div>
                            <div className="mobile-col-row">
                              <dt>{t.studio.roadTaxShort}</dt>
                              <dd className="tabular-nums">
                                {formatEur(res.totalTaxCost, 0, t.locale)}
                              </dd>
                            </div>
                            <div className="mobile-col-row">
                              <dt>{t.studio.insuranceShort}</dt>
                              <dd className="tabular-nums">
                                {formatEur(res.totalInsuranceCost, 0, t.locale)}
                              </dd>
                            </div>
                          </>
                        )}
                        <div className="mobile-col-row">
                          <dt>CO₂/{t.studio.yrUnit}</dt>
                          <dd className="tabular-nums">
                            {Math.round(res.annualCo2Kg).toLocaleString(t.locale)}{' '}
                            kg
                          </dd>
                        </div>
                      </dl>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Desktop / Tablet 2 or 3 Comparison Columns */}
          <div
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
                  {car.powertrain === 'hybrid' ? (
                    <>
                      <label className="slot-input-item">
                        <span className="slot-input-label">
                          <span>
                            {t.studio.hybridFwName}{' '}
                            <span className="nowrap-unit">(L/100 km)</span>
                          </span>
                        </span>
                        <NumericField
                          min={0}
                          max={25}
                          decimals={1}
                          value={car.hybridWeightedFuel}
                          onValueChange={(nextVal) =>
                            updateSlotField(idx, 'hybridWeightedFuel', nextVal)
                          }
                          className="slot-num-input tabular-nums"
                        />
                      </label>

                      <label className="slot-input-item">
                        <span className="slot-input-label">
                          <span>
                            {t.studio.hybridFcsName}{' '}
                            <span className="nowrap-unit">(L/100 km)</span>
                          </span>
                        </span>
                        <NumericField
                          min={1}
                          max={25}
                          decimals={1}
                          value={car.hybridDepletedFuel}
                          onValueChange={(nextVal) =>
                            updateSlotField(idx, 'hybridDepletedFuel', nextVal)
                          }
                          className="slot-num-input tabular-nums"
                        />
                      </label>

                      <label className="slot-input-item">
                        <span className="slot-input-label">
                          <span>
                            {t.studio.hybridRangeName}{' '}
                            <span className="nowrap-unit">(km)</span>
                          </span>
                        </span>
                        <NumericField
                          min={5}
                          max={250}
                          decimals={0}
                          value={car.hybridElectricRangeKm}
                          onValueChange={(nextVal) =>
                            updateSlotField(
                              idx,
                              'hybridElectricRangeKm',
                              nextVal
                            )
                          }
                          className="slot-num-input tabular-nums"
                        />
                      </label>

                      <label className="slot-input-item">
                        <span className="slot-input-label">
                          <span>
                            {t.studio.hybridBatteryName}{' '}
                            <span className="nowrap-unit">(kWh)</span>
                          </span>
                        </span>
                        <NumericField
                          min={1}
                          max={60}
                          decimals={1}
                          value={car.hybridBatteryKwh}
                          onValueChange={(nextVal) =>
                            updateSlotField(idx, 'hybridBatteryKwh', nextVal)
                          }
                          className="slot-num-input tabular-nums"
                        />
                      </label>
                    </>
                  ) : (
                    <label className="slot-input-item">
                      <span className="slot-input-label">
                        <span>
                          {t.studio.combinedConsumptionName}{' '}
                          <span className="nowrap-unit">
                            ({meta.consumptionUnit})
                          </span>
                        </span>
                      </span>
                      <NumericField
                        min={1}
                        max={40}
                        decimals={1}
                        value={car.consumption}
                        onValueChange={(nextVal) =>
                          updateSlotField(idx, 'consumption', nextVal)
                        }
                        className="slot-num-input tabular-nums"
                      />
                    </label>
                  )}

                  {!isEnergyOnly && (
                    <>
                      <label className="slot-input-item">
                        <span className="slot-input-label">
                          {t.studio.purchasePriceLabel}
                        </span>
                        <NumericField
                          min={1000}
                          max={250000}
                          decimals={0}
                          value={car.purchasePrice}
                          onValueChange={(nextVal) =>
                            updateSlotField(idx, 'purchasePrice', nextVal)
                          }
                          className="slot-num-input tabular-nums"
                        />
                      </label>

                      <label className="slot-input-item">
                        <span className="slot-input-label">
                          {t.studio.serviceYrLabel}
                        </span>
                        <NumericField
                          min={0}
                          max={5000}
                          decimals={0}
                          value={car.annualService}
                          onValueChange={(nextVal) =>
                            updateSlotField(idx, 'annualService', nextVal)
                          }
                          className="slot-num-input tabular-nums"
                        />
                      </label>

                      <label className="slot-input-item">
                        <span className="slot-input-label">
                          {t.studio.roadTaxYrLabel}
                        </span>
                        <NumericField
                          min={0}
                          max={4000}
                          decimals={0}
                          value={car.annualTax}
                          onValueChange={(nextVal) =>
                            updateSlotField(idx, 'annualTax', nextVal)
                          }
                          className="slot-num-input tabular-nums"
                        />
                      </label>

                      <label className="slot-input-item">
                        <span className="slot-input-label">
                          {t.studio.insuranceYrLabel}
                        </span>
                        <NumericField
                          min={0}
                          max={6000}
                          decimals={0}
                          value={car.annualInsurance}
                          onValueChange={(nextVal) =>
                            updateSlotField(idx, 'annualInsurance', nextVal)
                          }
                          className="slot-num-input tabular-nums"
                        />
                      </label>

                      <label className="slot-input-item">
                        <span className="slot-input-label">
                          {t.studio.resaleLabel}
                        </span>
                        <NumericField
                          min={10}
                          max={90}
                          decimals={0}
                          value={car.resalePct}
                          onValueChange={(nextVal) =>
                            updateSlotField(idx, 'resalePct', nextVal)
                          }
                          className="slot-num-input tabular-nums"
                        />
                      </label>
                    </>
                  )}
                </div>

                {car.powertrain === 'hybrid' && res.hybridStats && (
                  <div className="hybrid-config-block">
                    <span className="assumption-label">
                      {t.studio.hybridTripLabel}
                    </span>
                    <div
                      className="hybrid-trip-toggle"
                      role="group"
                      aria-label={t.studio.hybridTripLabel}
                    >
                      <button
                        type="button"
                        className={`horizon-btn${
                          car.hybridTripProfile === 'short' ? ' is-active' : ''
                        }`}
                        onClick={() => updateSlotTripProfile(idx, 'short')}
                      >
                        {t.studio.hybridTripShort}
                      </button>
                      <button
                        type="button"
                        className={`horizon-btn${
                          car.hybridTripProfile === 'long' ? ' is-active' : ''
                        }`}
                        onClick={() => updateSlotTripProfile(idx, 'long')}
                      >
                        {t.studio.hybridTripLong}
                      </button>
                    </div>
                    <p className="hybrid-share-note tabular-nums">
                      {t.studio.hybridShareSummary(
                        String(Math.round(res.hybridStats.electricShareS * 100)),
                        String(Math.round(res.hybridStats.uf * 100)),
                        res.hybridStats.fuelPer100Km.toFixed(1),
                        res.hybridStats.elecWallPer100Km.toFixed(1)
                      )}
                    </p>
                  </div>
                )}

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
                        <NumericField
                          min={0}
                          max={25000}
                          decimals={0}
                          disabled={!car.subsidyEnabled}
                          value={car.subsidyAmount}
                          onValueChange={(nextVal) =>
                            updateSlotField(idx, 'subsidyAmount', nextVal)
                          }
                          ariaLabel={`${t.studio.optionalSubsidy} ${t.studio.carWord} ${idx + 1}`}
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
                      {res.wallboxCost > 0 && (
                        <div className="breakdown-row">
                          <span>{t.studio.oneTimeWallbox}</span>
                          <span className="tabular-nums">
                            {formatEur(res.wallboxCost, 0, t.locale)}
                          </span>
                        </div>
                      )}
                    </>
                  )}

                  {car.powertrain === 'hybrid' && res.hybridStats ? (
                    <>
                      <div className="breakdown-row">
                        <span>
                          {t.studio.fuelLine(
                            res.hybridStats.fuelPer100Km.toFixed(1),
                            formatEur(assumptions.gasolinePrice, 2, t.locale)
                          )}
                        </span>
                        <span className="tabular-nums">
                          {formatEur(res.totalFuelCost, 0, t.locale)}
                        </span>
                      </div>
                      <div className="breakdown-row">
                        <span>
                          {t.studio.electricityLine(
                            res.hybridStats.elecWallPer100Km.toFixed(1),
                            formatEur(blendedElecPrice, 2, t.locale)
                          )}
                        </span>
                        <span className="tabular-nums">
                          {formatEur(res.totalElectricityCost, 0, t.locale)}
                        </span>
                      </div>
                    </>
                  ) : (
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
                  )}

                  {res.totalFixedChargingFee > 0 && (
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

        {/* Unified Sensitivity, Winning Zones, Chart, Dialog Simulator & Scenario Table */}
        <div className="chart-panel sensitivity-unified-panel">
          {/* 1. Top: Header + ALL Chart Controls */}
          <div className="sensitivity-top-section">
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

            <div className="sensitivity-chart-toolbar">
              <div className="sensitivity-toolbar-group">
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

                {sensitivityView === '1d' && (
                  <div
                    className="horizon-tabs sensitivity-mode-tabs"
                    role="tablist"
                    aria-label="Sensitivity variable"
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={sensitivityMode === 'fuel'}
                      className={`horizon-btn${
                        sensitivityMode === 'fuel' ? ' is-active' : ''
                      }`}
                      onClick={() => setSensitivityMode('fuel')}
                    >
                      {t.charts.tabFuel}
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={sensitivityMode === 'blendedElec'}
                      className={`horizon-btn${
                        sensitivityMode === 'blendedElec' ? ' is-active' : ''
                      }`}
                      onClick={() => setSensitivityMode('blendedElec')}
                    >
                      {t.charts.tabElectricityPrice}
                    </button>
                  </div>
                )}
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
                      className={`horizon-btn scope-btn-stack${
                        sensitivityScope === 'all' ? ' is-active' : ''
                      }`}
                      onClick={() => setSensitivityScope('all')}
                    >
                      <span className="scope-btn-main">{t.studio.all3}</span>
                      <span className="scope-btn-detail">
                        {activeCars
                          .map((c) => t.powertrains[c.powertrain].shortLabel)
                          .join(' · ')}
                      </span>
                    </button>
                    {([
                      ['0-1', 0, 1],
                      ['1-2', 1, 2],
                      ['0-2', 0, 2],
                    ] as const).map(([key, aIdx, bIdx]) => {
                      const aCar = activeCars[aIdx];
                      const bCar = activeCars[bIdx];
                      const detail = `${t.powertrains[aCar.powertrain].shortLabel} ${t.bodyClasses[aCar.bodyClass]} · ${t.powertrains[bCar.powertrain].shortLabel} ${t.bodyClasses[bCar.bodyClass]}`;
                      return (
                        <button
                          key={key}
                          type="button"
                          className={`horizon-btn scope-btn-stack${
                            sensitivityScope === key ? ' is-active' : ''
                          }`}
                          onClick={() => setSensitivityScope(key)}
                        >
                          <span className="scope-btn-main">
                            {t.studio.pairVersusLabel(aIdx + 1, bIdx + 1)}
                          </span>
                          <span className="scope-btn-detail">{detail}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 2. Compact Colored Winner Zones Summary Box */}
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

          {/* 3. Sensitivity / 2D Chart Directly Below Winner Zones */}
          <div ref={simChartRef} className="sensitivity-chart-section">
            {sensitivityView === '2d' ? (
              <EnergyMap2DChart
                cars={sensitivityCars}
                analysis={energyMap2D}
                assumptions={assumptions}
                annualKm={assumptions.annualKm}
                simulatedRates={hasActiveSimulation ? simRates : null}
                savedScenarios={savedScenarios}
                isDark={isDark}
                lang={lang}
              />
            ) : (
              <SensitivityChart
                cars={sensitivityCars}
                analysis={sensitivity}
                assumptions={assumptions}
                years={assumptions.years}
                comparisonMode={assumptions.comparisonMode}
                simulatedRates={hasActiveSimulation ? simRates : null}
                savedScenarios={savedScenarios}
                isDark={isDark}
                lang={lang}
                embedded
              />
            )}
          </div>

          {/* 4. Compact Interactive Simulator Box Below the Chart */}
          <div className="sim-energy-box">
            <div className="sim-energy-head">
              <div className="sim-energy-title-wrap">
                <span className="insight-kicker">{t.studio.simBoxKicker}</span>
                <h3 className="sim-energy-title">{t.studio.simBoxTitle}</h3>
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
                    const resetRates = extractScenarioRates(
                      assumptions,
                      activeCars
                    );
                    setSimCustomMixMode(customMixMode);
                    setDraftSimRates(resetRates);
                    setSimRates(resetRates);
                  }}
                >
                  {t.studio.simResetBtn}
                </button>
              </div>
            </div>

            <div className="sim-trigger-grid">
              <button
                type="button"
                className="sim-trigger-btn"
                onClick={() => setSimDialog('oil')}
              >
                <span className="sim-trigger-label">
                  {t.studio.simChangeOilBtn}
                </span>
                <span className="sim-trigger-meta tabular-nums">
                  €{draftSimRates.gasolinePrice.toFixed(2)} / €
                  {draftSimRates.dieselPrice.toFixed(2)}/L
                </span>
              </button>

              <button
                type="button"
                className="sim-trigger-btn"
                onClick={() => setSimDialog('charging')}
              >
                <span className="sim-trigger-label">
                  {t.studio.simChangeChargingBtn}
                </span>
                <span className="sim-trigger-meta tabular-nums">
                  €{draftSimBlendedElecPrice.toFixed(3)}/kWh ·{' '}
                  {draftSimRates.homeAcShare}/{draftSimRates.publicAcShare}/
                  {draftSimRates.publicDcShare}%
                  {hasActiveHybrid &&
                    ` · ${
                      (draftSimRates.hybridTripProfile ?? 'short') === 'long'
                        ? t.studio.hybridTripLong
                        : t.studio.hybridTripShort
                    }`}
                </span>
              </button>

              {!isEnergyOnly && (
                <button
                  type="button"
                  className="sim-trigger-btn"
                  onClick={() => setSimDialog('tco')}
                >
                  <span className="sim-trigger-label">
                    {t.studio.simChangeTcoBtn}
                  </span>
                  <span className="sim-trigger-meta tabular-nums">
                    {activeCars
                      .map((car) => {
                        const ov = draftSimRates.tcoBySlot?.[car.slotId];
                        const price = ov ? ov.purchasePrice : car.purchasePrice;
                        const resale = ov ? ov.resalePct : car.resalePct;
                        return `${t.powertrains[car.powertrain].shortLabel} ${formatEur(price, 0, t.locale)} (${resale}%)`;
                      })
                      .join(' · ')}
                  </span>
                </button>
              )}
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
              <div className="sim-calc-actions">
                <button
                  type="button"
                  disabled={
                    savedScenarios.length >= MAX_SAVED_SCENARIOS &&
                    !draftMatchesSaved
                  }
                  className="btn btn-secondary sim-save-btn"
                  onClick={handleSaveScenario}
                >
                  {t.studio.simSaveBtn}
                </button>
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

            {savedScenarios.length > 0 && (
              <div className="saved-scenarios-bar">
                <div className="saved-scenarios-head">
                  <span className="saved-scenarios-title">
                    {t.studio.simSavedTitle(
                      savedScenarios.length,
                      MAX_SAVED_SCENARIOS
                    )}
                  </span>
                  <button
                    type="button"
                    className="reset-link"
                    onClick={handleClearScenarios}
                  >
                    {t.studio.simClearAllBtn}
                  </button>
                </div>
                <div className="saved-scenarios-list">
                  {savedScenarios.map((sc) => {
                    const scColor = isDark ? sc.darkColor : sc.color;
                    const scBlended = getBlendedElectricityPrice({
                      ...assumptions,
                      ...sc.rates,
                    });
                    const isLoaded = areScenarioRatesEqual(
                      sc.rates,
                      draftSimRates,
                      sensitivityCars,
                      includeTcoScenario
                    );
                    const scGas = sensitivityCars.some(
                      (c) =>
                        c.powertrain === 'gasoline' ||
                        c.powertrain === 'hybrid'
                    )
                      ? sc.rates.gasolinePrice
                      : sc.rates.dieselPrice;
                    return (
                      <div
                        key={sc.id}
                        className={`saved-scenario-chip${
                          !sc.visible ? ' is-hidden' : ''
                        }${isLoaded ? ' is-loaded' : ''}`}
                      >
                        <button
                          type="button"
                          className="saved-scenario-vis-btn"
                          onClick={() => handleToggleScenarioVisibility(sc.id)}
                          aria-label={
                            sc.visible
                              ? `${t.studio.simHideScenarioAria} (${sc.shortTag})`
                              : `${t.studio.simShowScenarioAria} (${sc.shortTag})`
                          }
                          aria-pressed={sc.visible}
                        >
                          <span
                            className="saved-scenario-dot"
                            style={{
                              backgroundColor: sc.visible
                                ? scColor
                                : 'transparent',
                              borderColor: scColor,
                            }}
                            aria-hidden="true"
                          />
                        </button>
                        <button
                          type="button"
                          className="saved-scenario-load-btn tabular-nums"
                          onClick={() => handleLoadScenario(sc)}
                        >
                          <strong>{sc.shortTag}</strong>
                          <span>
                            €{scGas.toFixed(2)}/L · €{scBlended.toFixed(2)}/kWh
                          </span>
                        </button>
                        <button
                          type="button"
                          className="saved-scenario-del-btn"
                          onClick={() => handleDeleteScenario(sc.id)}
                          aria-label={`${t.studio.simDeleteScenarioAria} (${sc.shortTag})`}
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 5. Bottom: Plotted Scenarios Summary Table */}
          {(() => {
            const hasGasOrHybSens = sensitivityCars.some(
              (c) => c.powertrain === 'gasoline' || c.powertrain === 'hybrid'
            );
            const isMap2D = sensitivityView === '2d';
            const origColor = isDark
              ? ORIGINAL_MARKER_COLOR.dark
              : ORIGINAL_MARKER_COLOR.light;
            const simColor = isDark
              ? ACTIVE_SIM_MARKER_COLOR.dark
              : ACTIVE_SIM_MARKER_COLOR.light;
            const visibleSaved = savedScenarios.filter((s) => s.visible);
            const buildRow = (
              id: string,
              kind: 'original' | 'simulated' | 'saved',
              label: string,
              color: string,
              rates: ScenarioRates
            ) => {
              const scAssump: GlobalAssumptions = { ...assumptions, ...rates };
              const scCars = applyScenarioToCars(sensitivityCars, rates);
              const scResults = scCars.map((c) => calculateTco(c, scAssump));
              const costs = scResults.map((r) =>
                isMap2D ? r.annualEnergyCost : r.activeTotal
              );
              const bestCost = Math.min(...costs);
              const bestRowIdx = Math.max(
                0,
                costs.findIndex((c) => c === bestCost)
              );
              const bestPt =
                t.powertrains[scCars[bestRowIdx]?.powertrain ?? 'electric']
                  .shortLabel;
              return {
                id,
                kind,
                label,
                color,
                fuelDisplay: hasGasOrHybSens
                  ? rates.gasolinePrice
                  : rates.dieselPrice,
                chargeDisplay: getBlendedElectricityPrice(scAssump),
                bestPt,
                bestCost,
              };
            };

            const tableRows = [
              buildRow(
                'original',
                'original',
                t.charts.originalCalculation,
                origColor,
                baseRates
              ),
            ];
            const simMatchesSaved = visibleSaved.some((s) =>
              areScenarioRatesEqual(
                s.rates,
                simRates,
                sensitivityCars,
                includeTcoScenario
              )
            );
            if (hasActiveSimulation && !simMatchesSaved) {
              tableRows.push(
                buildRow(
                  'simulated',
                  'simulated',
                  t.charts.simulatedCalculation,
                  simColor,
                  simRates
                )
              );
            }
            for (const sc of visibleSaved) {
              tableRows.push(
                buildRow(
                  sc.id,
                  'saved',
                  sc.shortTag,
                  isDark ? sc.darkColor : sc.color,
                  sc.rates
                )
              );
            }

            return (
              <div
                className="chart-scenario-legend"
                aria-label="Plotted scenarios"
              >
                <table className="chart-scenario-table">
                  <thead>
                    <tr>
                      <th>{t.charts.colScenario}</th>
                      <th>{t.charts.colFuel}</th>
                      <th>{t.charts.colCharging}</th>
                      <th>{t.charts.colResult}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.map((m) => (
                      <tr key={m.id}>
                        <td>
                          <span className="chart-scenario-cell-name">
                            <span
                              className={`chart-scenario-swatch${
                                m.kind === 'original' ? ' is-original' : ''
                              }`}
                              style={{
                                backgroundColor:
                                  m.kind === 'original'
                                    ? 'transparent'
                                    : m.color,
                                borderColor: m.color,
                              }}
                              aria-hidden="true"
                            />
                            <span className="chart-scenario-name">
                              {m.label}
                            </span>
                          </span>
                        </td>
                        <td className="tabular-nums">
                          €{m.fuelDisplay.toFixed(2)}/L
                        </td>
                        <td className="tabular-nums">
                          €{m.chargeDisplay.toFixed(2)}/kWh
                        </td>
                        <td className="tabular-nums chart-scenario-result">
                          {m.bestPt} · {formatEur(m.bestCost, 0, t.locale)}
                          {isMap2D ? `/${t.studio.yrUnit}` : ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </div>

        {/* Interactive Simulator Input Dialog */}
        {simDialog !== null && (
          <div
            className="sim-modal-backdrop"
            onPointerDown={(e) => {
              if (e.target === e.currentTarget) setSimDialog(null);
            }}
          >
            <div
              className="sim-modal-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="sim-dialog-title"
            >
              <div className="sim-modal-head">
                <h3 id="sim-dialog-title" className="sim-modal-title">
                  {simDialog === 'oil'
                    ? t.studio.simDialogOilTitle
                    : simDialog === 'charging'
                      ? t.studio.simDialogChargingTitle
                      : t.studio.simDialogTcoTitle}
                </h3>
                <button
                  type="button"
                  className="sim-modal-close"
                  onClick={() => setSimDialog(null)}
                  aria-label={t.studio.simDialogCloseAria}
                >
                  ×
                </button>
              </div>

              <div className="sim-modal-body">
                {simDialog === 'oil' && (
                  <div className="sim-fuel-grid">
                    <label className="sim-energy-field">
                      <span className="assumption-label">
                        {t.studio.gasolineRate}
                      </span>
                      <NumericField
                        min={0.5}
                        max={4.0}
                        decimals={2}
                        value={draftSimRates.gasolinePrice}
                        onValueChange={(nextVal) =>
                          setDraftSimRates((prev) => ({
                            ...prev,
                            gasolinePrice: nextVal,
                          }))
                        }
                        className="slot-num-input tabular-nums"
                      />
                    </label>

                    <label className="sim-energy-field">
                      <span className="assumption-label">
                        {t.studio.dieselRate}
                      </span>
                      <NumericField
                        min={0.5}
                        max={4.0}
                        decimals={2}
                        value={draftSimRates.dieselPrice}
                        onValueChange={(nextVal) =>
                          setDraftSimRates((prev) => ({
                            ...prev,
                            dieselPrice: nextVal,
                          }))
                        }
                        className="slot-num-input tabular-nums"
                      />
                    </label>
                  </div>
                )}

                {simDialog === 'charging' && (
                  <div className="sim-charging-subsection">
                    <div className="charging-group-head">
                      <span className="charging-group-title">
                        {t.studio.avgPrefix}{' '}
                        {formatEur(draftSimBlendedElecPrice, 3, t.locale)}/kWh
                      </span>
                      <div className="charging-mix-presets">
                        <div
                          className="horizon-tabs charging-mix-tabs"
                          role="group"
                          aria-label={t.studio.elecTariffsTitle}
                        >
                          <button
                            type="button"
                            className={`horizon-btn${
                              isSimHomePreset ? ' is-active' : ''
                            }`}
                            onClick={() => applySimChargingMixPreset(80, 15, 5)}
                          >
                            {t.studio.mixHome}
                          </button>
                          <button
                            type="button"
                            className={`horizon-btn${
                              isSimMixedPreset ? ' is-active' : ''
                            }`}
                            onClick={() => applySimChargingMixPreset(50, 30, 20)}
                          >
                            {t.studio.mixMixed}
                          </button>
                          <button
                            type="button"
                            className={`horizon-btn${
                              isSimPublicPreset ? ' is-active' : ''
                            }`}
                            onClick={() => applySimChargingMixPreset(0, 50, 50)}
                          >
                            {t.studio.mixPublic}
                          </button>
                          <button
                            type="button"
                            className={`horizon-btn${
                              simCustomMixMode ? ' is-active' : ''
                            }`}
                            onClick={() => setSimCustomMixMode(true)}
                          >
                            {t.studio.mixCustom}
                          </button>
                        </div>
                        <span
                          className={`mix-total-note tabular-nums${
                            simCustomMixMode && simTotalMixPct !== 100
                              ? ' is-error'
                              : simTotalMixPct !== 100
                                ? ' is-warn'
                                : ''
                          }`}
                        >
                          {t.studio.mixTotalNote(simTotalMixPct)}
                        </span>
                      </div>
                    </div>

                    <div className="charging-tiers-grid sim-tiers-grid">
                      <div className="charging-tier-box">
                        <div className="tier-head">
                          <label
                            htmlFor="sim-home-ac-price"
                            className="tier-name"
                          >
                            {t.studio.homeAcLabel}
                          </label>
                          <div className="tier-share-input-wrap tabular-nums">
                            <NumericField
                              min={0}
                              max={100}
                              decimals={0}
                              value={draftSimRates.homeAcShare}
                              onValueChange={(nextVal) =>
                                updateSimChargingShare('homeAcShare', nextVal)
                              }
                              ariaLabel={`${t.studio.homeAcLabel} ${t.studio.shareSuffix}`}
                              className="tier-share-input tabular-nums"
                            />
                            <span>%</span>
                          </div>
                        </div>
                        <div className="tier-controls">
                          <NumericField
                            id="sim-home-ac-price"
                            min={0.05}
                            max={1.5}
                            decimals={2}
                            value={draftSimRates.homeAcPrice}
                            onValueChange={(nextVal) =>
                              setDraftSimRates((prev) => ({
                                ...prev,
                                homeAcPrice: nextVal,
                              }))
                            }
                            ariaLabel={t.studio.homeAcLabel}
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
                          <label
                            htmlFor="sim-public-ac-price"
                            className="tier-name"
                          >
                            {t.studio.publicAcLabel}
                          </label>
                          <div className="tier-share-input-wrap tabular-nums">
                            <NumericField
                              min={0}
                              max={100}
                              decimals={0}
                              value={draftSimRates.publicAcShare}
                              onValueChange={(nextVal) =>
                                updateSimChargingShare('publicAcShare', nextVal)
                              }
                              ariaLabel={`${t.studio.publicAcLabel} ${t.studio.shareSuffix}`}
                              className="tier-share-input tabular-nums"
                            />
                            <span>%</span>
                          </div>
                        </div>
                        <div className="tier-controls">
                          <NumericField
                            id="sim-public-ac-price"
                            min={0.05}
                            max={1.5}
                            decimals={2}
                            value={draftSimRates.publicAcPrice}
                            onValueChange={(nextVal) =>
                              setDraftSimRates((prev) => ({
                                ...prev,
                                publicAcPrice: nextVal,
                              }))
                            }
                            ariaLabel={t.studio.publicAcLabel}
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
                          <label
                            htmlFor="sim-public-dc-price"
                            className="tier-name"
                          >
                            {t.studio.publicDcLabel}
                          </label>
                          <div className="tier-share-input-wrap tabular-nums">
                            <NumericField
                              min={0}
                              max={100}
                              decimals={0}
                              value={draftSimRates.publicDcShare}
                              onValueChange={(nextVal) =>
                                updateSimChargingShare('publicDcShare', nextVal)
                              }
                              ariaLabel={`${t.studio.publicDcLabel} ${t.studio.shareSuffix}`}
                              className="tier-share-input tabular-nums"
                            />
                            <span>%</span>
                          </div>
                        </div>
                        <div className="tier-controls">
                          <NumericField
                            id="sim-public-dc-price"
                            min={0.05}
                            max={2.0}
                            decimals={2}
                            value={draftSimRates.publicDcPrice}
                            onValueChange={(nextVal) =>
                              setDraftSimRates((prev) => ({
                                ...prev,
                                publicDcPrice: nextVal,
                              }))
                            }
                            ariaLabel={t.studio.publicDcLabel}
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

                    {hasActiveHybrid && (
                      <div className="hybrid-config-block sim-hybrid-box">
                        <span className="assumption-label">
                          {t.studio.hybridTripLabel}
                        </span>
                        <div
                          className="hybrid-trip-toggle"
                          role="group"
                          aria-label={t.studio.hybridTripLabel}
                        >
                          <button
                            type="button"
                            className={`horizon-btn${
                              (draftSimRates.hybridTripProfile ?? 'short') ===
                              'short'
                                ? ' is-active'
                                : ''
                            }`}
                            onClick={() =>
                              setDraftSimRates((prev) => ({
                                ...prev,
                                hybridTripProfile: 'short',
                              }))
                            }
                          >
                            {t.studio.hybridTripShort}
                          </button>
                          <button
                            type="button"
                            className={`horizon-btn${
                              draftSimRates.hybridTripProfile === 'long'
                                ? ' is-active'
                                : ''
                            }`}
                            onClick={() =>
                              setDraftSimRates((prev) => ({
                                ...prev,
                                hybridTripProfile: 'long',
                              }))
                            }
                          >
                            {t.studio.hybridTripLong}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {simDialog === 'tco' && !isEnergyOnly && (
                  <div className="sim-tco-cars-grid">
                    {activeCars.map((car, idx) => {
                      const ov = draftSimRates.tcoBySlot?.[car.slotId];
                      const curPrice = ov ? ov.purchasePrice : car.purchasePrice;
                      const curResale = ov ? ov.resalePct : car.resalePct;
                      const color = isDark
                        ? POWERTRAIN_META[car.powertrain].darkColor
                        : POWERTRAIN_META[car.powertrain].color;
                      return (
                        <div key={car.slotId} className="sim-tco-car-card">
                          <div className="sim-tco-car-head">
                            <span
                              className="zone-swatch"
                              style={{ backgroundColor: color }}
                              aria-hidden="true"
                            />
                            <strong>
                              {t.studio.carWord} {idx + 1}:{' '}
                              {t.powertrains[car.powertrain].shortLabel} (
                              {t.bodyClasses[car.bodyClass]})
                            </strong>
                          </div>
                          <div className="sim-fuel-grid">
                            <label className="sim-energy-field">
                              <span className="assumption-label">
                                {t.studio.purchasePriceLabel}
                              </span>
                              <NumericField
                                min={1000}
                                max={250000}
                                decimals={0}
                                value={curPrice}
                                onValueChange={(nextVal) =>
                                  setDraftSimRates((prev) => ({
                                    ...prev,
                                    tcoBySlot: {
                                      ...(prev.tcoBySlot ??
                                        buildBaseTcoOverrides(activeCars)),
                                      [car.slotId]: {
                                        purchasePrice: nextVal,
                                        resalePct: curResale,
                                      },
                                    },
                                  }))
                                }
                                className="slot-num-input tabular-nums"
                              />
                            </label>

                            <label className="sim-energy-field">
                              <span className="assumption-label">
                                {t.studio.resaleLabel}
                              </span>
                              <NumericField
                                min={10}
                                max={90}
                                decimals={0}
                                value={curResale}
                                onValueChange={(nextVal) =>
                                  setDraftSimRates((prev) => ({
                                    ...prev,
                                    tcoBySlot: {
                                      ...(prev.tcoBySlot ??
                                        buildBaseTcoOverrides(activeCars)),
                                      [car.slotId]: {
                                        purchasePrice: curPrice,
                                        resalePct: nextVal,
                                      },
                                    },
                                  }))
                                }
                                className="slot-num-input tabular-nums"
                              />
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="sim-modal-foot">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSimDialog(null)}
                >
                  {t.studio.simDialogDone}
                </button>
                <button
                  type="button"
                  className="btn btn-primary calculate-btn"
                  onClick={handleSimCalculate}
                >
                  {t.studio.calculateBtn}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
