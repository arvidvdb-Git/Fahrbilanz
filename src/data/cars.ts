export type PowertrainId = 'gasoline' | 'diesel' | 'hybrid' | 'electric';
export type BodyClassId = 'compact' | 'sedan' | 'suv';
export type ComparisonMode = 'tco' | 'energy';
export type HybridTripProfile = 'short' | 'long';

export const CHARGING_LOSS_PCT = 12;
export const CHARGING_EFFICIENCY = 0.88; // 12% charging loss (eta = 0.88)

export interface PowertrainMeta {
  id: PowertrainId;
  label: string;
  shortLabel: string;
  tagline: string;
  energyUnit: 'L' | 'kWh';
  consumptionUnit: string;
  color: string;
  darkColor: string;
  co2PerUnitKg: number;
}

export interface CarPreset {
  purchasePrice: number;
  consumption: number; // L/100km or kWh/100km (driving consumption before charge losses)
  hybridWeightedFuel?: number; // F_w (L/100 km)
  hybridDepletedFuel?: number; // F_cs (L/100 km)
  hybridElectricRangeKm?: number; // R EAER (km)
  hybridBatteryKwh?: number; // B net (kWh)
  annualService: number; // EUR/yr
  annualTax: number; // EUR/yr
  annualInsurance: number; // EUR/yr
  defaultSubsidy: number; // optional one-off subsidy EUR
  resalePct5Yr: number; // % of purchase price retained after 5 years
}

export interface CarSlotConfig {
  slotId: string;
  powertrain: PowertrainId;
  bodyClass: BodyClassId;
  purchasePrice: number;
  subsidyEnabled: boolean;
  subsidyAmount: number;
  consumption: number;
  hybridWeightedFuel: number; // F_w: weighted combined fuel consumption (L/100 km)
  hybridDepletedFuel: number; // F_cs: fuel consumption with discharged battery (L/100 km)
  hybridElectricRangeKm: number; // R: electric range, combined EAER (km)
  hybridBatteryKwh: number; // B: net battery capacity (kWh)
  hybridTripProfile: HybridTripProfile; // 'short' => s = UF, 'long' => s = 0.70 * UF
  annualService: number;
  annualTax: number;
  annualInsurance: number;
  resalePct: number;
}

export interface GlobalAssumptions {
  comparisonMode: ComparisonMode;
  annualKm: number;
  years: number;
  gasolinePrice: number; // EUR/L
  dieselPrice: number; // EUR/L
  homeAcPrice: number; // EUR/kWh (lowest)
  publicAcPrice: number; // EUR/kWh (medium)
  publicDcPrice: number; // EUR/kWh (highest)
  homeAcShare: number; // % 0..100
  publicAcShare: number; // % 0..100
  publicDcShare: number; // % 0..100
  monthlyChargingFee: number; // EUR/mo rent wallbox fee
  wallboxCost: number; // one-time buy wallbox hardware & install EUR
  rentWallboxElectric: boolean; // apply monthly rent wallbox fee to full electric
  rentWallboxHybrid: boolean; // apply monthly rent wallbox fee to plug-in hybrid
  buyWallboxElectric: boolean; // apply one-time buy wallbox cost to full electric
  buyWallboxHybrid: boolean; // apply one-time buy wallbox cost to plug-in hybrid
}

export interface HybridEnergyStats {
  uf: number; // Brochure utility factor = 1 - F_w / F_cs
  electricShareS: number; // Real electric share s (UF or 0.70 * UF)
  eNetPer100Km: number; // 100 * B / R (kWh/100 km at battery)
  eWallPer100Km: number; // e_net / 0.88 (kWh/100 km at wall when electric)
  fuelPer100Km: number; // (1 - s) * F_cs (L/100 km)
  elecWallPer100Km: number; // s * e_wall (kWh/100 km at wall)
}

export interface TcoResult {
  energyCostPer100Km: number; // all-in energy cost per 100 km (incl. charge losses & monthly fee)
  variableEnergyPer100Km: number; // variable fuel + billed kWh cost per 100 km
  billedConsumptionPer100Km: number; // includes charge loss for electric (or fuel L/100km for hybrid/ICE)
  hybridStats: HybridEnergyStats | null;
  totalFuelCost: number;
  totalElectricityCost: number;
  annualEnergyCost: number; // variable energy + annual fixed charging fee
  totalVariableEnergyCost: number;
  totalFixedChargingFee: number;
  totalEnergyCost: number;
  netPurchasePrice: number; // purchasePrice - active subsidy
  effectiveSubsidy: number;
  netDepreciation: number;
  wallboxCost: number;
  totalServiceCost: number;
  totalTaxCost: number;
  totalInsuranceCost: number;
  totalTco: number; // full ownership total
  activeTotal: number; // either totalTco or totalEnergyCost depending on comparisonMode
  activeMonthly: number;
  activePerKm: number;
  monthlyTco: number;
  costPerKm: number;
  annualCo2Kg: number;
  cumulativeByYear: number[];
  cumulativeNetByYear: number[]; // respects comparisonMode (TCO or Energy Only)
}

export const POWERTRAIN_META: Record<PowertrainId, PowertrainMeta> = {
  gasoline: {
    id: 'gasoline',
    label: 'Gasoline',
    shortLabel: 'Gasoline',
    tagline: 'Lowest upfront purchase price, familiar refueling',
    energyUnit: 'L',
    consumptionUnit: 'L/100 km',
    color: '#C26D27',
    darkColor: '#E5954F',
    co2PerUnitKg: 2.37,
  },
  diesel: {
    id: 'diesel',
    label: 'Diesel',
    shortLabel: 'Diesel',
    tagline: 'High highway efficiency for long annual distances',
    energyUnit: 'L',
    consumptionUnit: 'L/100 km',
    color: '#3B668C',
    darkColor: '#6EA0CC',
    co2PerUnitKg: 2.65,
  },
  hybrid: {
    id: 'hybrid',
    label: 'Hybrid',
    shortLabel: 'Hybrid',
    tagline: 'Plug-in electric daily commutes paired with unlimited range',
    energyUnit: 'L',
    consumptionUnit: 'L/100 km',
    color: '#1F7A70',
    darkColor: '#4AB5A8',
    co2PerUnitKg: 2.37,
  },
  electric: {
    id: 'electric',
    label: 'Full Electric',
    shortLabel: 'Electric',
    tagline: 'Lowest energy cost per km and minimal brake wear',
    energyUnit: 'kWh',
    consumptionUnit: 'kWh/100 km',
    color: '#3D6E43',
    darkColor: '#68B372',
    co2PerUnitKg: 0.36,
  },
};

export const POWERTRAIN_ORDER: PowertrainId[] = [
  'gasoline',
  'diesel',
  'hybrid',
  'electric',
];

export const BODY_CLASS_META: Record<
  BodyClassId,
  { id: BodyClassId; label: string }
> = {
  compact: { id: 'compact', label: 'Compact' },
  sedan: { id: 'sedan', label: 'Sedan' },
  suv: { id: 'suv', label: 'SUV' },
};

export const CAR_PRESETS: Record<
  PowertrainId,
  Record<BodyClassId, CarPreset>
> = {
  gasoline: {
    compact: {
      purchasePrice: 28500,
      consumption: 6.2,
      annualService: 680,
      annualTax: 180,
      annualInsurance: 940,
      defaultSubsidy: 0,
      resalePct5Yr: 47,
    },
    sedan: {
      purchasePrice: 36500,
      consumption: 6.8,
      annualService: 790,
      annualTax: 240,
      annualInsurance: 1100,
      defaultSubsidy: 0,
      resalePct5Yr: 46,
    },
    suv: {
      purchasePrice: 41500,
      consumption: 7.9,
      annualService: 880,
      annualTax: 310,
      annualInsurance: 1180,
      defaultSubsidy: 0,
      resalePct5Yr: 49,
    },
  },
  diesel: {
    compact: {
      purchasePrice: 31500,
      consumption: 4.8,
      annualService: 760,
      annualTax: 320,
      annualInsurance: 960,
      defaultSubsidy: 0,
      resalePct5Yr: 44,
    },
    sedan: {
      purchasePrice: 39800,
      consumption: 5.2,
      annualService: 870,
      annualTax: 390,
      annualInsurance: 1090,
      defaultSubsidy: 0,
      resalePct5Yr: 45,
    },
    suv: {
      purchasePrice: 44800,
      consumption: 6.1,
      annualService: 950,
      annualTax: 460,
      annualInsurance: 1180,
      defaultSubsidy: 0,
      resalePct5Yr: 47,
    },
  },
  hybrid: {
    compact: {
      purchasePrice: 35900,
      consumption: 1.4,
      hybridWeightedFuel: 1.4,
      hybridDepletedFuel: 5.6,
      hybridElectricRangeKm: 62,
      hybridBatteryKwh: 11.5,
      annualService: 640,
      annualTax: 140,
      annualInsurance: 1000,
      defaultSubsidy: 1500,
      resalePct5Yr: 52,
    },
    sedan: {
      purchasePrice: 42900,
      consumption: 1.6,
      hybridWeightedFuel: 1.6,
      hybridDepletedFuel: 6.2,
      hybridElectricRangeKm: 65,
      hybridBatteryKwh: 13.0,
      annualService: 720,
      annualTax: 180,
      annualInsurance: 1140,
      defaultSubsidy: 1500,
      resalePct5Yr: 51,
    },
    suv: {
      purchasePrice: 47900,
      consumption: 1.9,
      hybridWeightedFuel: 1.9,
      hybridDepletedFuel: 7.2,
      hybridElectricRangeKm: 68,
      hybridBatteryKwh: 15.6,
      annualService: 790,
      annualTax: 220,
      annualInsurance: 1230,
      defaultSubsidy: 1500,
      resalePct5Yr: 53,
    },
  },
  electric: {
    compact: {
      purchasePrice: 35900,
      consumption: 15.4,
      annualService: 380,
      annualTax: 0,
      annualInsurance: 960,
      defaultSubsidy: 3000,
      resalePct5Yr: 46,
    },
    sedan: {
      purchasePrice: 44500,
      consumption: 16.8,
      annualService: 430,
      annualTax: 0,
      annualInsurance: 1090,
      defaultSubsidy: 3000,
      resalePct5Yr: 47,
    },
    suv: {
      purchasePrice: 48900,
      consumption: 19.2,
      annualService: 470,
      annualTax: 0,
      annualInsurance: 1190,
      defaultSubsidy: 3000,
      resalePct5Yr: 49,
    },
  },
};

export function createSlotFromPreset(
  slotId: string,
  powertrain: PowertrainId,
  bodyClass: BodyClassId = 'sedan'
): CarSlotConfig {
  const preset = CAR_PRESETS[powertrain][bodyClass];
  const hybridFallback = CAR_PRESETS.hybrid[bodyClass];
  return {
    slotId,
    powertrain,
    bodyClass,
    purchasePrice: preset.purchasePrice,
    subsidyEnabled: false,
    subsidyAmount: preset.defaultSubsidy,
    consumption: preset.consumption,
    hybridWeightedFuel:
      preset.hybridWeightedFuel ?? hybridFallback.hybridWeightedFuel ?? 1.6,
    hybridDepletedFuel:
      preset.hybridDepletedFuel ?? hybridFallback.hybridDepletedFuel ?? 6.2,
    hybridElectricRangeKm:
      preset.hybridElectricRangeKm ?? hybridFallback.hybridElectricRangeKm ?? 65,
    hybridBatteryKwh:
      preset.hybridBatteryKwh ?? hybridFallback.hybridBatteryKwh ?? 13.0,
    hybridTripProfile: 'short',
    annualService: preset.annualService,
    annualTax: preset.annualTax,
    annualInsurance: preset.annualInsurance,
    resalePct: preset.resalePct5Yr,
  };
}

export function computeHybridEnergyStats(
  car: Pick<
    CarSlotConfig,
    | 'hybridWeightedFuel'
    | 'hybridDepletedFuel'
    | 'hybridElectricRangeKm'
    | 'hybridBatteryKwh'
    | 'hybridTripProfile'
  >
): HybridEnergyStats {
  const fW = Math.max(0, car.hybridWeightedFuel);
  const fCs = Math.max(0.1, car.hybridDepletedFuel);
  const rKm = Math.max(1, car.hybridElectricRangeKm);
  const bKwh = Math.max(0, car.hybridBatteryKwh);

  const uf = Math.max(0, Math.min(1, 1 - fW / fCs));
  const electricShareS = car.hybridTripProfile === 'long' ? 0.7 * uf : uf;
  const eNetPer100Km = (100 * bKwh) / rKm;
  const eWallPer100Km = eNetPer100Km / CHARGING_EFFICIENCY;

  const fuelPer100Km = (1 - electricShareS) * fCs;
  const elecWallPer100Km = electricShareS * eWallPer100Km;

  return {
    uf,
    electricShareS,
    eNetPer100Km,
    eWallPer100Km,
    fuelPer100Km,
    elecWallPer100Km,
  };
}

export function scaledResalePct(resalePct5Yr: number, years: number): number {
  if (years === 5) return resalePct5Yr;
  const retention5 = Math.max(0.15, Math.min(0.85, resalePct5Yr / 100));
  const annualRetention = Math.pow(retention5, 1 / 5);
  return Math.round(Math.pow(annualRetention, years) * 100);
}

export function getBlendedElectricityPrice(
  assumptions: GlobalAssumptions
): number {
  const sum =
    assumptions.homeAcShare +
    assumptions.publicAcShare +
    assumptions.publicDcShare;
  if (sum <= 0) return assumptions.homeAcPrice;
  return (
    (assumptions.homeAcShare * assumptions.homeAcPrice +
      assumptions.publicAcShare * assumptions.publicAcPrice +
      assumptions.publicDcShare * assumptions.publicDcPrice) /
    sum
  );
}

export function getUnitPrice(
  powertrain: PowertrainId,
  assumptions: GlobalAssumptions
): number {
  if (powertrain === 'electric') return getBlendedElectricityPrice(assumptions);
  if (powertrain === 'diesel') return assumptions.dieselPrice;
  return assumptions.gasolinePrice;
}

export function calculateTco(
  car: CarSlotConfig,
  assumptions: GlobalAssumptions
): TcoResult {
  const isElectric = car.powertrain === 'electric';
  const isHybrid = car.powertrain === 'hybrid';
  const blendedElecPrice = getBlendedElectricityPrice(assumptions);

  const hybridStats = isHybrid ? computeHybridEnergyStats(car) : null;

  let billedConsumptionPer100Km = 0;
  let annualFuelLitres = 0;
  let annualElecKwh = 0;
  let variableEnergyPer100Km = 0;
  let annualFuelCost = 0;
  let annualElectricityCost = 0;

  if (isHybrid && hybridStats) {
    billedConsumptionPer100Km = hybridStats.fuelPer100Km;
    annualFuelLitres = (assumptions.annualKm / 100) * hybridStats.fuelPer100Km;
    annualElecKwh = (assumptions.annualKm / 100) * hybridStats.elecWallPer100Km;
    annualFuelCost = annualFuelLitres * assumptions.gasolinePrice;
    annualElectricityCost = annualElecKwh * blendedElecPrice;
    variableEnergyPer100Km =
      hybridStats.fuelPer100Km * assumptions.gasolinePrice +
      hybridStats.elecWallPer100Km * blendedElecPrice;
  } else if (isElectric) {
    billedConsumptionPer100Km = car.consumption / CHARGING_EFFICIENCY;
    annualElecKwh = (assumptions.annualKm / 100) * billedConsumptionPer100Km;
    annualElectricityCost = annualElecKwh * blendedElecPrice;
    variableEnergyPer100Km = billedConsumptionPer100Km * blendedElecPrice;
  } else {
    const fuelPrice =
      car.powertrain === 'diesel'
        ? assumptions.dieselPrice
        : assumptions.gasolinePrice;
    billedConsumptionPer100Km = car.consumption;
    annualFuelLitres = (assumptions.annualKm / 100) * car.consumption;
    annualFuelCost = annualFuelLitres * fuelPrice;
    variableEnergyPer100Km = car.consumption * fuelPrice;
  }

  const annualVariableEnergy = annualFuelCost + annualElectricityCost;
  const appliesRentWallbox =
    (isElectric && assumptions.rentWallboxElectric) ||
    (isHybrid && assumptions.rentWallboxHybrid);
  const annualFixedChargingFee = appliesRentWallbox
    ? assumptions.monthlyChargingFee * 12
    : 0;
  const annualEnergyCost = annualVariableEnergy + annualFixedChargingFee;

  const totalFuelCost = annualFuelCost * assumptions.years;
  const totalElectricityCost = annualElectricityCost * assumptions.years;
  const totalVariableEnergyCost = annualVariableEnergy * assumptions.years;
  const totalFixedChargingFee = annualFixedChargingFee * assumptions.years;
  const totalEnergyCost = annualEnergyCost * assumptions.years;

  const energyCostPer100Km =
    assumptions.annualKm > 0
      ? (annualEnergyCost / assumptions.annualKm) * 100
      : variableEnergyPer100Km;

  const supportsSubsidy = isHybrid || isElectric;
  const effectiveSubsidy =
    supportsSubsidy && car.subsidyEnabled
      ? Math.min(car.purchasePrice, Math.max(0, car.subsidyAmount))
      : 0;
  const netPurchasePrice = Math.max(0, car.purchasePrice - effectiveSubsidy);

  const effectiveResalePct = scaledResalePct(car.resalePct, assumptions.years);
  const resaleValue = car.purchasePrice * (effectiveResalePct / 100);
  const netDepreciation = Math.max(0, netPurchasePrice - resaleValue);

  const appliesBuyWallbox =
    (isElectric && assumptions.buyWallboxElectric) ||
    (isHybrid && assumptions.buyWallboxHybrid);
  const wallboxCost = appliesBuyWallbox
    ? Math.max(0, assumptions.wallboxCost)
    : 0;
  const totalServiceCost = car.annualService * assumptions.years;
  const totalTaxCost = car.annualTax * assumptions.years;
  const totalInsuranceCost = car.annualInsurance * assumptions.years;

  const totalTco =
    netDepreciation +
    wallboxCost +
    totalEnergyCost +
    totalServiceCost +
    totalTaxCost +
    totalInsuranceCost;

  const monthlyTco = totalTco / (assumptions.years * 12);
  const totalKm = assumptions.annualKm * assumptions.years;
  const costPerKm = totalKm > 0 ? totalTco / totalKm : 0;

  const activeTotal =
    assumptions.comparisonMode === 'energy' ? totalEnergyCost : totalTco;
  const activeMonthly = activeTotal / (assumptions.years * 12);
  const activePerKm = totalKm > 0 ? activeTotal / totalKm : 0;

  const annualCo2Kg = isHybrid
    ? annualFuelLitres * POWERTRAIN_META.gasoline.co2PerUnitKg +
      annualElecKwh * POWERTRAIN_META.electric.co2PerUnitKg
    : isElectric
      ? annualElecKwh * POWERTRAIN_META.electric.co2PerUnitKg
      : annualFuelLitres * POWERTRAIN_META[car.powertrain].co2PerUnitKg;

  const cumulativeByYear: number[] = [];
  const cumulativeNetByYear: number[] = [];

  for (let y = 0; y <= assumptions.years; y++) {
    if (assumptions.comparisonMode === 'energy') {
      const energyToY = annualEnergyCost * y;
      cumulativeNetByYear.push(energyToY);
      cumulativeByYear.push(energyToY);
    } else {
      const runningToY =
        (annualEnergyCost +
          car.annualService +
          car.annualTax +
          car.annualInsurance) *
        y;
      const retainedAtY =
        car.purchasePrice * (scaledResalePct(car.resalePct, y) / 100);
      const depAtY = Math.max(0, netPurchasePrice - retainedAtY);
      cumulativeNetByYear.push(depAtY + wallboxCost + runningToY);
      cumulativeByYear.push(netPurchasePrice + wallboxCost + runningToY);
    }
  }

  return {
    energyCostPer100Km,
    variableEnergyPer100Km,
    billedConsumptionPer100Km,
    hybridStats,
    totalFuelCost,
    totalElectricityCost,
    annualEnergyCost,
    totalVariableEnergyCost,
    totalFixedChargingFee,
    totalEnergyCost,
    netPurchasePrice,
    effectiveSubsidy,
    netDepreciation,
    wallboxCost,
    totalServiceCost,
    totalTaxCost,
    totalInsuranceCost,
    totalTco,
    activeTotal,
    activeMonthly,
    activePerKm,
    monthlyTco,
    costPerKm,
    annualCo2Kg,
    cumulativeByYear,
    cumulativeNetByYear,
  };
}

export function formatEur(
  value: number,
  decimals = 0,
  locale = 'en-IE'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export type SensitivityMode = 'fuel' | 'blendedElec';

export interface SensitivityLine {
  slotId: string;
  carIndex: number;
  powertrain: PowertrainId;
  intercept: number;
  slope: number;
  evalAt: (x: number) => number;
}

export interface WinnerSwitchPoint {
  x: number;
  y: number;
  fromCarIndex: number;
  toCarIndex: number;
}

export interface WinnerRegime {
  xStart: number;
  xEnd: number;
  winnerCarIndex: number;
}

export interface PairwiseCrossover {
  carAIndex: number;
  carBIndex: number;
  x: number;
  y: number;
  inRange: boolean;
  cheaperAboveIndex: number;
  cheaperBelowIndex: number;
}

export interface SensitivityAnalysis {
  mode: SensitivityMode;
  xMin: number;
  xMax: number;
  currentX: number;
  unitLabel: string;
  lines: SensitivityLine[];
  regimes: WinnerRegime[];
  switches: WinnerSwitchPoint[];
  pairwise: PairwiseCrossover[];
  hasVariableSlope: boolean;
  dieselTracksSpread: boolean;
}

export function computeSensitivity(
  cars: CarSlotConfig[],
  assumptions: GlobalAssumptions,
  mode: SensitivityMode
): SensitivityAnalysis {
  const xMin = mode === 'fuel' ? 0.5 : 0.1;
  const xMax = mode === 'fuel' ? 3.0 : 0.9;

  const hasGasOrHybrid = cars.some(
    (c) => c.powertrain === 'gasoline' || c.powertrain === 'hybrid'
  );
  const hasDiesel = cars.some((c) => c.powertrain === 'diesel');
  const dieselTracksSpread = mode === 'fuel' && hasGasOrHybrid && hasDiesel;
  const dieselSpread = assumptions.dieselPrice - assumptions.gasolinePrice;

  const currentX =
    mode === 'fuel'
      ? hasGasOrHybrid
        ? assumptions.gasolinePrice
        : assumptions.dieselPrice
      : getBlendedElectricityPrice(assumptions);

  const unitLabel = mode === 'fuel' ? '€/L' : '€/kWh';
  const blendedKwh = getBlendedElectricityPrice(assumptions);

  const lines: SensitivityLine[] = cars.map((car, idx) => {
    const isElectric = car.powertrain === 'electric';
    const isHybrid = car.powertrain === 'hybrid';
    const res = calculateTco(car, assumptions);

    const ownershipFixed =
      assumptions.comparisonMode === 'energy'
        ? 0
        : res.netDepreciation +
          res.wallboxCost +
          res.totalServiceCost +
          res.totalTaxCost +
          res.totalInsuranceCost;

    const fixedCharging = res.totalFixedChargingFee;
    const totalFuelUnits = isElectric
      ? 0
      : isHybrid && res.hybridStats
        ? (assumptions.annualKm / 100) *
          res.hybridStats.fuelPer100Km *
          assumptions.years
        : (assumptions.annualKm / 100) * car.consumption * assumptions.years;

    const totalElecUnits = isElectric
      ? (assumptions.annualKm / 100) *
        res.billedConsumptionPer100Km *
        assumptions.years
      : isHybrid && res.hybridStats
        ? (assumptions.annualKm / 100) *
          res.hybridStats.elecWallPer100Km *
          assumptions.years
        : 0;

    const fuelFixedPrice =
      car.powertrain === 'diesel'
        ? assumptions.dieselPrice
        : assumptions.gasolinePrice;
    const fuelFixedCost = totalFuelUnits * fuelFixedPrice;

    let slope = 0;
    let intercept = ownershipFixed;

    if (mode === 'fuel') {
      slope = totalFuelUnits;
      const spreadAdd =
        car.powertrain === 'diesel' && hasGasOrHybrid
          ? totalFuelUnits * dieselSpread
          : 0;
      intercept =
        ownershipFixed +
        fixedCharging +
        spreadAdd +
        totalElecUnits * blendedKwh;
    } else {
      // blendedElec: sweeping electricity price (€/kWh)
      slope = totalElecUnits;
      intercept = ownershipFixed + fixedCharging + fuelFixedCost;
    }

    return {
      slotId: car.slotId,
      carIndex: idx,
      powertrain: car.powertrain,
      intercept,
      slope,
      evalAt: (x: number) => intercept + slope * x,
    };
  });

  const pairwise: PairwiseCrossover[] = [];
  const internalCutPoints: number[] = [];

  for (let i = 0; i < lines.length; i++) {
    for (let j = i + 1; j < lines.length; j++) {
      const a = lines[i];
      const b = lines[j];
      const slopeDiff = a.slope - b.slope;
      if (Math.abs(slopeDiff) < 1e-6) continue;

      const x = (b.intercept - a.intercept) / slopeDiff;
      const y = a.evalAt(x);
      const inRange = x > xMin + 1e-4 && x < xMax - 1e-4;
      if (inRange) {
        internalCutPoints.push(x);
      }
      const cheaperAboveIndex =
        a.slope < b.slope ? a.carIndex : b.carIndex;
      const cheaperBelowIndex =
        a.slope < b.slope ? b.carIndex : a.carIndex;

      pairwise.push({
        carAIndex: a.carIndex,
        carBIndex: b.carIndex,
        x,
        y,
        inRange,
        cheaperAboveIndex,
        cheaperBelowIndex,
      });
    }
  }

  internalCutPoints.sort((a, b) => a - b);
  const uniqueCuts: number[] = [xMin];
  for (const pt of internalCutPoints) {
    if (pt - uniqueCuts[uniqueCuts.length - 1] > 1e-4) {
      uniqueCuts.push(pt);
    }
  }
  if (xMax - uniqueCuts[uniqueCuts.length - 1] > 1e-4) {
    uniqueCuts.push(xMax);
  }

  const rawRegimes: WinnerRegime[] = [];
  for (let k = 0; k < uniqueCuts.length - 1; k++) {
    const a = uniqueCuts[k];
    const b = uniqueCuts[k + 1];
    const mid = (a + b) / 2;

    let bestIdx = 0;
    let bestVal = Infinity;
    for (const line of lines) {
      const val = line.evalAt(mid);
      if (val < bestVal) {
        bestVal = val;
        bestIdx = line.carIndex;
      }
    }
    rawRegimes.push({ xStart: a, xEnd: b, winnerCarIndex: bestIdx });
  }

  const regimes: WinnerRegime[] = [];
  for (const reg of rawRegimes) {
    const last = regimes[regimes.length - 1];
    if (last && last.winnerCarIndex === reg.winnerCarIndex) {
      last.xEnd = reg.xEnd;
    } else {
      regimes.push({ ...reg });
    }
  }

  const switches: WinnerSwitchPoint[] = [];
  for (let k = 0; k < regimes.length - 1; k++) {
    const prevReg = regimes[k];
    const nextReg = regimes[k + 1];
    const switchX = prevReg.xEnd;
    const switchY = lines[prevReg.winnerCarIndex].evalAt(switchX);
    switches.push({
      x: switchX,
      y: switchY,
      fromCarIndex: prevReg.winnerCarIndex,
      toCarIndex: nextReg.winnerCarIndex,
    });
  }

  const slopes = lines.map((l) => l.slope);
  const hasVariableSlope = slopes.some((s) => s > 0) && lines.length >= 2;

  return {
    mode,
    xMin,
    xMax,
    currentX,
    unitLabel,
    lines,
    regimes,
    switches,
    pairwise,
    hasVariableSlope,
    dieselTracksSpread,
  };
}

export interface Point2D {
  x: number;
  y: number;
}

export interface EnergyMapZone {
  carIndex: number;
  powertrain: PowertrainId;
  polygon: Point2D[];
  centroid: Point2D;
  areaFraction: number;
}

export interface EnergyMapBreakingLine {
  carAIndex: number;
  carBIndex: number;
  /** Full segment inside the plot box */
  fullStart: Point2D;
  fullEnd: Point2D;
  /** Portion where carA and carB are tied for #1 best energy cost */
  activeStart: Point2D | null;
  activeEnd: Point2D | null;
  /** Slope description: chargingPrice = slope * fuelPrice + intercept */
  slopeYPerX: number | null;
  interceptY: number | null;
}

export interface EnergyMap2DAnalysis {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  currentFuelX: number;
  currentChargeY: number;
  dieselTracksSpread: boolean;
  evalAnnualEnergy: (carIndex: number, fuelX: number, chargeY: number) => number;
  zones: EnergyMapZone[];
  breakingLines: EnergyMapBreakingLine[];
}

function clipPolygonHalfPlane(
  poly: Point2D[],
  da: number,
  db: number,
  dc: number
): Point2D[] {
  if (poly.length === 0) return [];
  const evalFn = (p: Point2D) => da * p.x + db * p.y + dc;

  if (Math.abs(da) < 1e-9 && Math.abs(db) < 1e-9) {
    return dc <= 1e-9 ? poly : [];
  }

  const out: Point2D[] = [];
  for (let i = 0; i < poly.length; i++) {
    const s = poly[i];
    const e = poly[(i + 1) % poly.length];
    const fs = evalFn(s);
    const fe = evalFn(e);
    const sIn = fs <= 1e-9;
    const eIn = fe <= 1e-9;

    if (sIn && eIn) {
      out.push(e);
    } else if (sIn && !eIn) {
      const t = fs / (fs - fe);
      out.push({ x: s.x + t * (e.x - s.x), y: s.y + t * (e.y - s.y) });
    } else if (!sIn && eIn) {
      const t = fs / (fs - fe);
      out.push({ x: s.x + t * (e.x - s.x), y: s.y + t * (e.y - s.y) });
      out.push(e);
    }
  }
  return out;
}

function polygonAreaAndCentroid(poly: Point2D[]): {
  area: number;
  centroid: Point2D;
} {
  if (poly.length < 3) return { area: 0, centroid: { x: 0, y: 0 } };
  let twiceArea = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < poly.length; i++) {
    const p0 = poly[i];
    const p1 = poly[(i + 1) % poly.length];
    const cross = p0.x * p1.y - p1.x * p0.y;
    twiceArea += cross;
    cx += (p0.x + p1.x) * cross;
    cy += (p0.y + p1.y) * cross;
  }
  if (Math.abs(twiceArea) < 1e-9) {
    const avgX = poly.reduce((s, p) => s + p.x, 0) / poly.length;
    const avgY = poly.reduce((s, p) => s + p.y, 0) / poly.length;
    return { area: 0, centroid: { x: avgX, y: avgY } };
  }
  return {
    area: Math.abs(twiceArea) / 2,
    centroid: { x: cx / (3 * twiceArea), y: cy / (3 * twiceArea) },
  };
}

function clipLineToBox(
  da: number,
  db: number,
  dc: number,
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number
): [Point2D, Point2D] | null {
  const candidates: Point2D[] = [];
  const eps = 1e-7;

  if (Math.abs(db) > 1e-9) {
    const yAtXMin = (-dc - da * xMin) / db;
    if (yAtXMin >= yMin - eps && yAtXMin <= yMax + eps) {
      candidates.push({
        x: xMin,
        y: Math.max(yMin, Math.min(yMax, yAtXMin)),
      });
    }
    const yAtXMax = (-dc - da * xMax) / db;
    if (yAtXMax >= yMin - eps && yAtXMax <= yMax + eps) {
      candidates.push({
        x: xMax,
        y: Math.max(yMin, Math.min(yMax, yAtXMax)),
      });
    }
  }

  if (Math.abs(da) > 1e-9) {
    const xAtYMin = (-dc - db * yMin) / da;
    if (xAtYMin >= xMin - eps && xAtYMin <= xMax + eps) {
      candidates.push({
        x: Math.max(xMin, Math.min(xMax, xAtYMin)),
        y: yMin,
      });
    }
    const xAtYMax = (-dc - db * yMax) / da;
    if (xAtYMax >= xMin - eps && xAtYMax <= xMax + eps) {
      candidates.push({
        x: Math.max(xMin, Math.min(xMax, xAtYMax)),
        y: yMax,
      });
    }
  }

  // Deduplicate corners
  const unique: Point2D[] = [];
  for (const pt of candidates) {
    if (
      !unique.some(
        (u) => Math.hypot(u.x - pt.x, u.y - pt.y) < 1e-5
      )
    ) {
      unique.push(pt);
    }
  }
  if (unique.length < 2) return null;
  return [unique[0], unique[1]];
}

export function computeEnergyMap2D(
  cars: CarSlotConfig[],
  assumptions: GlobalAssumptions
): EnergyMap2DAnalysis {
  const xMin = 0.5;
  const xMax = 3.0;
  const yMin = 0.1;
  const yMax = 0.9;

  const hasGasOrHybrid = cars.some(
    (c) => c.powertrain === 'gasoline' || c.powertrain === 'hybrid'
  );
  const hasDiesel = cars.some((c) => c.powertrain === 'diesel');
  const dieselTracksSpread = hasGasOrHybrid && hasDiesel;
  const dieselSpread = assumptions.dieselPrice - assumptions.gasolinePrice;

  const currentFuelX = hasGasOrHybrid
    ? assumptions.gasolinePrice
    : assumptions.dieselPrice;
  const currentChargeY = getBlendedElectricityPrice(assumptions);

  // Annual Energy Cost(x, y) = a * x + b * y + c
  const planes = cars.map((car) => {
    if (car.powertrain === 'electric') {
      const annualElec =
        (assumptions.annualKm / 100) * (car.consumption / CHARGING_EFFICIENCY);
      return {
        a: 0,
        b: annualElec,
        c: assumptions.rentWallboxElectric
          ? assumptions.monthlyChargingFee * 12
          : 0,
      };
    }
    if (car.powertrain === 'hybrid') {
      const h = computeHybridEnergyStats(car);
      return {
        a: (assumptions.annualKm / 100) * h.fuelPer100Km,
        b: (assumptions.annualKm / 100) * h.elecWallPer100Km,
        c: assumptions.rentWallboxHybrid
          ? assumptions.monthlyChargingFee * 12
          : 0,
      };
    }
    const annualFuel = (assumptions.annualKm / 100) * car.consumption;
    if (car.powertrain === 'diesel' && hasGasOrHybrid) {
      return {
        a: annualFuel,
        b: 0,
        c: annualFuel * dieselSpread,
      };
    }
    return {
      a: annualFuel,
      b: 0,
      c: 0,
    };
  });

  const evalAnnualEnergy = (
    carIndex: number,
    fuelX: number,
    chargeY: number
  ) => {
    const p = planes[carIndex];
    if (!p) return 0;
    return p.a * fuelX + p.b * chargeY + p.c;
  };

  const baseRect: Point2D[] = [
    { x: xMin, y: yMin },
    { x: xMax, y: yMin },
    { x: xMax, y: yMax },
    { x: xMin, y: yMax },
  ];
  const boxArea = (xMax - xMin) * (yMax - yMin);

  const zones: EnergyMapZone[] = [];
  for (let i = 0; i < cars.length; i++) {
    let poly = baseRect;
    for (let j = 0; j < cars.length; j++) {
      if (i === j) continue;
      poly = clipPolygonHalfPlane(
        poly,
        planes[i].a - planes[j].a,
        planes[i].b - planes[j].b,
        planes[i].c - planes[j].c
      );
    }
    const { area, centroid } = polygonAreaAndCentroid(poly);
    if (poly.length >= 3 && area > boxArea * 0.002) {
      zones.push({
        carIndex: i,
        powertrain: cars[i].powertrain,
        polygon: poly,
        centroid,
        areaFraction: area / boxArea,
      });
    }
  }

  const breakingLines: EnergyMapBreakingLine[] = [];
  for (let i = 0; i < cars.length; i++) {
    for (let j = i + 1; j < cars.length; j++) {
      const da = planes[i].a - planes[j].a;
      const db = planes[i].b - planes[j].b;
      const dc = planes[i].c - planes[j].c;
      if (Math.abs(da) < 1e-6 && Math.abs(db) < 1e-6) continue;

      const seg = clipLineToBox(da, db, dc, xMin, xMax, yMin, yMax);
      if (!seg) continue;

      // Clip segment [seg[0], seg[1]] against all other cars k so we know where (i, j) are #1 best
      let t0 = 0;
      let t1 = 1;
      const dx = seg[1].x - seg[0].x;
      const dy = seg[1].y - seg[0].y;

      for (let k = 0; k < cars.length; k++) {
        if (k === i || k === j) continue;
        // Require E_i <= E_k along the line
        const ka = planes[i].a - planes[k].a;
        const kb = planes[i].b - planes[k].b;
        const kc = planes[i].c - planes[k].c;
        const f0 = ka * seg[0].x + kb * seg[0].y + kc;
        const slopeT = ka * dx + kb * dy;

        if (Math.abs(slopeT) < 1e-9) {
          if (f0 > 1e-6) {
            t0 = 1;
            t1 = 0;
            break;
          }
        } else {
          const tCut = -f0 / slopeT;
          if (slopeT > 0) {
            t1 = Math.min(t1, tCut);
          } else {
            t0 = Math.max(t0, tCut);
          }
        }
      }

      const hasActive = t1 - t0 > 1e-3;
      const activeStart = hasActive
        ? { x: seg[0].x + t0 * dx, y: seg[0].y + t0 * dy }
        : null;
      const activeEnd = hasActive
        ? { x: seg[0].x + t1 * dx, y: seg[0].y + t1 * dy }
        : null;

      const slopeYPerX = Math.abs(db) > 1e-6 ? -da / db : null;
      const interceptY = Math.abs(db) > 1e-6 ? -dc / db : null;

      breakingLines.push({
        carAIndex: i,
        carBIndex: j,
        fullStart: seg[0],
        fullEnd: seg[1],
        activeStart,
        activeEnd,
        slopeYPerX,
        interceptY,
      });
    }
  }

  return {
    xMin,
    xMax,
    yMin,
    yMax,
    currentFuelX,
    currentChargeY,
    dieselTracksSpread,
    evalAnnualEnergy,
    zones,
    breakingLines,
  };
}

export interface ScenarioCarTcoOverride {
  purchasePrice: number;
  resalePct: number;
}

export interface ScenarioRates {
  gasolinePrice: number;
  dieselPrice: number;
  homeAcPrice: number;
  publicAcPrice: number;
  publicDcPrice: number;
  homeAcShare: number;
  publicAcShare: number;
  publicDcShare: number;
  hybridTripProfile?: HybridTripProfile;
  tcoBySlot?: Record<string, ScenarioCarTcoOverride>;
}

export interface SavedScenario {
  id: string;
  shortTag: string;
  color: string;
  darkColor: string;
  visible: boolean;
  rates: ScenarioRates;
}

export const ORIGINAL_MARKER_COLOR = {
  light: '#111614',
  dark: '#EFF3F1',
};

export const ACTIVE_SIM_MARKER_COLOR = {
  light: '#7C3AED',
  dark: '#A78BFA',
};

export const SCENARIO_COLOR_PALETTE: Array<{ light: string; dark: string }> = [
  { light: '#C026D3', dark: '#E879F9' },
  { light: '#E11D48', dark: '#FB7185' },
  { light: '#4338CA', dark: '#818CF8' },
  { light: '#9D174D', dark: '#F472B6' },
  { light: '#6D28D9', dark: '#DDD6FE' },
];

export function buildBaseTcoOverrides(
  cars: CarSlotConfig[]
): Record<string, ScenarioCarTcoOverride> {
  const map: Record<string, ScenarioCarTcoOverride> = {};
  for (const c of cars) {
    map[c.slotId] = {
      purchasePrice: c.purchasePrice,
      resalePct: c.resalePct,
    };
  }
  return map;
}

export function extractScenarioRates(
  source: Pick<
    GlobalAssumptions,
    | 'gasolinePrice'
    | 'dieselPrice'
    | 'homeAcPrice'
    | 'publicAcPrice'
    | 'publicDcPrice'
    | 'homeAcShare'
    | 'publicAcShare'
    | 'publicDcShare'
  >,
  cars?: CarSlotConfig[]
): ScenarioRates {
  const firstHybrid = cars?.find((c) => c.powertrain === 'hybrid');
  return {
    gasolinePrice: source.gasolinePrice,
    dieselPrice: source.dieselPrice,
    homeAcPrice: source.homeAcPrice,
    publicAcPrice: source.publicAcPrice,
    publicDcPrice: source.publicDcPrice,
    homeAcShare: source.homeAcShare,
    publicAcShare: source.publicAcShare,
    publicDcShare: source.publicDcShare,
    hybridTripProfile: firstHybrid?.hybridTripProfile ?? 'short',
    tcoBySlot: cars ? buildBaseTcoOverrides(cars) : undefined,
  };
}

export function applyScenarioToCars(
  cars: CarSlotConfig[],
  rates?: ScenarioRates | null
): CarSlotConfig[] {
  if (!rates) return cars;
  return cars.map((car) => {
    const ov = rates.tcoBySlot?.[car.slotId];
    const nextTrip =
      car.powertrain === 'hybrid' && rates.hybridTripProfile
        ? rates.hybridTripProfile
        : car.hybridTripProfile;
    return {
      ...car,
      hybridTripProfile: nextTrip,
      purchasePrice: ov ? ov.purchasePrice : car.purchasePrice,
      resalePct: ov ? ov.resalePct : car.resalePct,
    };
  });
}

export function areScenarioRatesEqual(
  a: ScenarioRates,
  b: ScenarioRates,
  cars?: CarSlotConfig[],
  includeTco = true
): boolean {
  const baseSame =
    Math.abs(a.gasolinePrice - b.gasolinePrice) <= 0.001 &&
    Math.abs(a.dieselPrice - b.dieselPrice) <= 0.001 &&
    Math.abs(a.homeAcPrice - b.homeAcPrice) <= 0.001 &&
    Math.abs(a.publicAcPrice - b.publicAcPrice) <= 0.001 &&
    Math.abs(a.publicDcPrice - b.publicDcPrice) <= 0.001 &&
    a.homeAcShare === b.homeAcShare &&
    a.publicAcShare === b.publicAcShare &&
    a.publicDcShare === b.publicDcShare;
  if (!baseSame) return false;

  const hasHybrid = cars ? cars.some((c) => c.powertrain === 'hybrid') : true;
  if (hasHybrid) {
    const tripA = a.hybridTripProfile ?? 'short';
    const tripB = b.hybridTripProfile ?? 'short';
    if (tripA !== tripB) return false;
  }

  if (includeTco) {
    const slotIds = cars
      ? cars.map((c) => c.slotId)
      : Array.from(
          new Set([
            ...Object.keys(a.tcoBySlot ?? {}),
            ...Object.keys(b.tcoBySlot ?? {}),
          ])
        );
    for (const sid of slotIds) {
      const ca = a.tcoBySlot?.[sid];
      const cb = b.tcoBySlot?.[sid];
      const fallback = cars?.find((c) => c.slotId === sid);
      const pa = ca?.purchasePrice ?? fallback?.purchasePrice ?? 0;
      const pb = cb?.purchasePrice ?? fallback?.purchasePrice ?? 0;
      const ra = ca?.resalePct ?? fallback?.resalePct ?? 0;
      const rb = cb?.resalePct ?? fallback?.resalePct ?? 0;
      if (Math.abs(pa - pb) > 0.5 || Math.abs(ra - rb) > 0.1) return false;
    }
  }

  return true;
}


