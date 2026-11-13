export type PowertrainId = 'gasoline' | 'diesel' | 'hybrid' | 'electric';
export type BodyClassId = 'compact' | 'sedan' | 'suv';
export type ComparisonMode = 'tco' | 'energy';

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
  chargeLossPct: number; // % e.g. 10
  monthlyChargingFee: number; // EUR/mo fixed subscription/grid fee
  wallboxCost: number; // one-time wallbox hardware & install EUR
}

export interface TcoResult {
  energyCostPer100Km: number; // all-in energy cost per 100 km (incl. charge losses & monthly fee)
  variableEnergyPer100Km: number; // variable fuel or billed kWh cost per 100 km
  billedConsumptionPer100Km: number; // includes charge loss for electric
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
    consumptionUnit: 'L / 100 km',
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
    consumptionUnit: 'L / 100 km',
    color: '#3B668C',
    darkColor: '#6EA0CC',
    co2PerUnitKg: 2.65,
  },
  hybrid: {
    id: 'hybrid',
    label: 'Hybrid',
    shortLabel: 'Hybrid',
    tagline: 'Regenerative city savings paired with unlimited range',
    energyUnit: 'L',
    consumptionUnit: 'L / 100 km',
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
    consumptionUnit: 'kWh / 100 km',
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
      purchasePrice: 32500,
      consumption: 4.3,
      annualService: 620,
      annualTax: 140,
      annualInsurance: 1000,
      defaultSubsidy: 1500,
      resalePct5Yr: 52,
    },
    sedan: {
      purchasePrice: 40500,
      consumption: 4.7,
      annualService: 710,
      annualTax: 180,
      annualInsurance: 1140,
      defaultSubsidy: 1500,
      resalePct5Yr: 51,
    },
    suv: {
      purchasePrice: 45200,
      consumption: 5.5,
      annualService: 780,
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
  return {
    slotId,
    powertrain,
    bodyClass,
    purchasePrice: preset.purchasePrice,
    subsidyEnabled: false,
    subsidyAmount: preset.defaultSubsidy,
    consumption: preset.consumption,
    annualService: preset.annualService,
    annualTax: preset.annualTax,
    annualInsurance: preset.annualInsurance,
    resalePct: preset.resalePct5Yr,
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
  const unitPrice = getUnitPrice(car.powertrain, assumptions);
  const lossMultiplier = isElectric ? 1 + assumptions.chargeLossPct / 100 : 1;
  const billedConsumptionPer100Km = car.consumption * lossMultiplier;

  const variableEnergyPer100Km = billedConsumptionPer100Km * unitPrice;
  const annualVariableEnergy =
    (assumptions.annualKm / 100) * variableEnergyPer100Km;
  const annualFixedChargingFee = isElectric
    ? assumptions.monthlyChargingFee * 12
    : 0;
  const annualEnergyCost = annualVariableEnergy + annualFixedChargingFee;

  const totalVariableEnergyCost = annualVariableEnergy * assumptions.years;
  const totalFixedChargingFee = annualFixedChargingFee * assumptions.years;
  const totalEnergyCost = annualEnergyCost * assumptions.years;

  const energyCostPer100Km =
    assumptions.annualKm > 0
      ? (annualEnergyCost / assumptions.annualKm) * 100
      : variableEnergyPer100Km;

  const supportsSubsidy =
    car.powertrain === 'hybrid' || car.powertrain === 'electric';
  const effectiveSubsidy =
    supportsSubsidy && car.subsidyEnabled
      ? Math.min(car.purchasePrice, Math.max(0, car.subsidyAmount))
      : 0;
  const netPurchasePrice = Math.max(0, car.purchasePrice - effectiveSubsidy);

  const effectiveResalePct = scaledResalePct(car.resalePct, assumptions.years);
  const resaleValue = car.purchasePrice * (effectiveResalePct / 100);
  const netDepreciation = Math.max(0, netPurchasePrice - resaleValue);

  const wallboxCost = isElectric ? Math.max(0, assumptions.wallboxCost) : 0;
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

  const meta = POWERTRAIN_META[car.powertrain];
  const annualUnits = (assumptions.annualKm / 100) * billedConsumptionPer100Km;
  const annualCo2Kg = annualUnits * meta.co2PerUnitKg;

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

export type SensitivityMode = 'fuel' | 'homeAc' | 'publicDc' | 'blendedElec';

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
  const xMin = mode === 'fuel' ? 0.5 : mode === 'publicDc' ? 0.2 : 0.1;
  const xMax = mode === 'fuel' ? 3.0 : mode === 'publicDc' ? 1.2 : 0.9;

  const hasGasOrHybrid = cars.some(
    (c) => c.powertrain === 'gasoline' || c.powertrain === 'hybrid'
  );
  const hasDiesel = cars.some((c) => c.powertrain === 'diesel');
  const dieselTracksSpread = mode === 'fuel' && hasGasOrHybrid && hasDiesel;
  const dieselSpread = assumptions.dieselPrice - assumptions.gasolinePrice;

  let currentX = assumptions.gasolinePrice;
  if (mode === 'fuel') {
    currentX = hasGasOrHybrid
      ? assumptions.gasolinePrice
      : assumptions.dieselPrice;
  } else if (mode === 'homeAc') {
    currentX = assumptions.homeAcPrice;
  } else if (mode === 'publicDc') {
    currentX = assumptions.publicDcPrice;
  } else {
    currentX = getBlendedElectricityPrice(assumptions);
  }

  const unitLabel = mode === 'fuel' ? '€/L' : '€/kWh';
  const shareSum = Math.max(
    1,
    assumptions.homeAcShare +
      assumptions.publicAcShare +
      assumptions.publicDcShare
  );
  const wHome = assumptions.homeAcShare / shareSum;
  const wPubAc = assumptions.publicAcShare / shareSum;
  const wPubDc = assumptions.publicDcShare / shareSum;
  const blendedKwh = getBlendedElectricityPrice(assumptions);

  const lines: SensitivityLine[] = cars.map((car, idx) => {
    const isElectric = car.powertrain === 'electric';
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
    const totalUnits =
      (assumptions.annualKm / 100) *
      res.billedConsumptionPer100Km *
      assumptions.years;

    let slope = 0;
    let intercept = ownershipFixed;

    if (mode === 'fuel') {
      if (isElectric) {
        slope = 0;
        intercept = ownershipFixed + fixedCharging + totalUnits * blendedKwh;
      } else if (car.powertrain === 'diesel' && hasGasOrHybrid) {
        slope = totalUnits;
        intercept = ownershipFixed + totalUnits * dieselSpread;
      } else {
        slope = totalUnits;
        intercept = ownershipFixed;
      }
    } else if (mode === 'homeAc') {
      if (isElectric) {
        slope = totalUnits * wHome;
        intercept =
          ownershipFixed +
          fixedCharging +
          totalUnits *
            (wPubAc * assumptions.publicAcPrice +
              wPubDc * assumptions.publicDcPrice);
      } else {
        slope = 0;
        intercept = ownershipFixed + res.totalEnergyCost;
      }
    } else if (mode === 'publicDc') {
      if (isElectric) {
        slope = totalUnits * wPubDc;
        intercept =
          ownershipFixed +
          fixedCharging +
          totalUnits *
            (wHome * assumptions.homeAcPrice +
              wPubAc * assumptions.publicAcPrice);
      } else {
        slope = 0;
        intercept = ownershipFixed + res.totalEnergyCost;
      }
    } else {
      // blendedElec
      if (isElectric) {
        slope = totalUnits;
        intercept = ownershipFixed + fixedCharging;
      } else {
        slope = 0;
        intercept = ownershipFixed + res.totalEnergyCost;
      }
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
    const isElectric = car.powertrain === 'electric';
    const lossMult = isElectric ? 1 + assumptions.chargeLossPct / 100 : 1;
    const annualUnits =
      (assumptions.annualKm / 100) * car.consumption * lossMult;

    if (isElectric) {
      return {
        a: 0,
        b: annualUnits,
        c: assumptions.monthlyChargingFee * 12,
      };
    }
    if (car.powertrain === 'diesel' && hasGasOrHybrid) {
      return {
        a: annualUnits,
        b: 0,
        c: annualUnits * dieselSpread,
      };
    }
    return {
      a: annualUnits,
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

