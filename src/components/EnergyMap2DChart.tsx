import { useEffect, useState } from 'react';
import {
  ACTIVE_SIM_MARKER_COLOR,
  CarSlotConfig,
  EnergyMap2DAnalysis,
  GlobalAssumptions,
  ORIGINAL_MARKER_COLOR,
  POWERTRAIN_META,
  Point2D,
  SavedScenario,
  ScenarioRates,
  applyScenarioToCars,
  areScenarioRatesEqual,
  calculateTco,
  extractScenarioRates,
  formatEur,
  getBlendedElectricityPrice,
} from '../data/cars';
import { Language, TRANSLATIONS } from '../i18n/translations';

interface EnergyMap2DChartProps {
  cars: CarSlotConfig[];
  analysis: EnergyMap2DAnalysis;
  assumptions: GlobalAssumptions;
  annualKm: number;
  simulatedRates?: ScenarioRates | null;
  savedScenarios?: SavedScenario[];
  isDark: boolean;
  lang: Language;
}

interface PlacedBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

function overlapsAny(
  cand: PlacedBox,
  placed: PlacedBox[],
  pad = 6
): boolean {
  return placed.some(
    (b) =>
      !(
        cand.x + cand.w + pad <= b.x ||
        b.x + b.w + pad <= cand.x ||
        cand.y + cand.h + pad <= b.y ||
        b.y + b.h + pad <= cand.y
      )
  );
}

function findFreeBox(
  anchors: Array<{ x: number; y: number }>,
  w: number,
  h: number,
  bounds: { left: number; top: number; right: number; bottom: number },
  placed: PlacedBox[]
): PlacedBox | null {
  const clampBox = (cx: number, cy: number): PlacedBox => ({
    x: Math.max(bounds.left, Math.min(bounds.right - w, cx - w / 2)),
    y: Math.max(bounds.top, Math.min(bounds.bottom - h, cy - h / 2)),
    w,
    h,
  });

  const offsets = [
    [0, 0],
    [0, -18],
    [0, 18],
    [28, 0],
    [-28, 0],
    [28, -18],
    [-28, -18],
    [28, 18],
    [-28, 18],
    [0, -34],
    [0, 34],
    [54, 0],
    [-54, 0],
    [54, -22],
    [-54, -22],
    [54, 22],
    [-54, 22],
  ];

  for (const anchor of anchors) {
    for (const [dx, dy] of offsets) {
      const cand = clampBox(anchor.x + dx, anchor.y + dy);
      if (!overlapsAny(cand, placed, 6)) {
        return cand;
      }
    }
  }
  return null;
}

interface MapScenarioMarker {
  id: string;
  kind: 'original' | 'simulated' | 'saved';
  badgeLabel: string;
  shortTag: string;
  legendLabel: string;
  color: string;
  fuelX: number;
  chargeY: number;
  px: number;
  py: number;
  bestPtLabel: string;
  bestAnnualCost: number;
}

export function EnergyMap2DChart({
  cars,
  analysis,
  assumptions,
  annualKm,
  simulatedRates = null,
  savedScenarios = [],
  isDark,
  lang,
}: EnergyMap2DChartProps) {
  const [hoverPt, setHoverPt] = useState<Point2D | null>(null);
  const [isCompact, setIsCompact] = useState<boolean>(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(max-width: 768px)').matches
      : false
  );
  const t = TRANSLATIONS[lang];

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const sync = () => setIsCompact(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const width = isCompact ? 420 : 760;
  const height = isCompact ? 306 : 346;
  const padLeft = isCompact ? 56 : 68;
  const padRight = isCompact ? 18 : 28;
  const padTop = isCompact ? 22 : 26;
  const padBottom = isCompact ? 48 : 48;

  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;
  const bounds = {
    left: padLeft + 6,
    top: padTop + 6,
    right: width - padRight - 6,
    bottom: height - padBottom - 6,
  };

  const {
    xMin,
    xMax,
    xTicks,
    yMin,
    yMax,
    yTicks,
    currentFuelX,
    currentChargeY,
    zones,
    breakingLines,
    evalAnnualEnergy,
  } = analysis;

  const xForFuel = (x: number) =>
    padLeft + ((x - xMin) / (xMax - xMin)) * plotW;
  const yForCharge = (y: number) =>
    padTop + plotH - ((y - yMin) / (yMax - yMin)) * plotH;

  const hasGasOrHybrid = cars.some(
    (c) => c.powertrain === 'gasoline' || c.powertrain === 'hybrid'
  );

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const ctm = svg.getScreenCTM();
    let svgX: number;
    let svgY: number;

    if (ctm) {
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const mapped = pt.matrixTransform(ctm.inverse());
      svgX = mapped.x;
      svgY = mapped.y;
    } else {
      const rect = svg.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      svgX = ((e.clientX - rect.left) / rect.width) * width;
      svgY = ((e.clientY - rect.top) / rect.height) * height;
    }

    if (
      svgX < padLeft ||
      svgX > width - padRight ||
      svgY < padTop ||
      svgY > height - padBottom
    ) {
      setHoverPt(null);
      return;
    }

    const fuel = xMin + ((svgX - padLeft) / plotW) * (xMax - xMin);
    const charge = yMin + ((padTop + plotH - svgY) / plotH) * (yMax - yMin);
    setHoverPt({
      x: Math.max(xMin, Math.min(xMax, fuel)),
      y: Math.max(yMin, Math.min(yMax, charge)),
    });
  };

  const inspectPt = hoverPt ?? {
    x: Math.max(xMin, Math.min(xMax, currentFuelX)),
    y: Math.max(yMin, Math.min(yMax, currentChargeY)),
  };

  const inspectCosts = cars.map((_, idx) =>
    evalAnnualEnergy(idx, inspectPt.x, inspectPt.y)
  );
  const minInspectCost = Math.min(...inspectCosts);

  // Build map markers: Original calculation + Simulated + Saved scenarios
  const originalColor = isDark
    ? ORIGINAL_MARKER_COLOR.dark
    : ORIGINAL_MARKER_COLOR.light;
  const simColor = isDark
    ? ACTIVE_SIM_MARKER_COLOR.dark
    : ACTIVE_SIM_MARKER_COLOR.light;

  const buildMarker = (
    id: string,
    kind: 'original' | 'simulated' | 'saved',
    badgeLabel: string,
    shortTag: string,
    legendLabel: string,
    color: string,
    rates: ScenarioRates
  ): MapScenarioMarker => {
    const scAssump: GlobalAssumptions = { ...assumptions, ...rates };
    const scCars = applyScenarioToCars(cars, rates);
    const fuelX = hasGasOrHybrid ? rates.gasolinePrice : rates.dieselPrice;
    const chargeY = getBlendedElectricityPrice(scAssump);
    const px = xForFuel(Math.max(xMin, Math.min(xMax, fuelX)));
    const py = yForCharge(Math.max(yMin, Math.min(yMax, chargeY)));

    const annualCosts = scCars.map((car) =>
      calculateTco(car, scAssump).annualEnergyCost
    );
    const bestAnnualCost = Math.min(...annualCosts);
    const bestIdx = Math.max(
      0,
      annualCosts.findIndex((c) => c === bestAnnualCost)
    );
    const bestPtLabel =
      t.powertrains[cars[bestIdx]?.powertrain ?? 'electric'].shortLabel;

    return {
      id,
      kind,
      badgeLabel,
      shortTag,
      legendLabel,
      color,
      fuelX,
      chargeY,
      px,
      py,
      bestPtLabel,
      bestAnnualCost,
    };
  };

  const origRates = extractScenarioRates(assumptions, cars);
  const origFuelX = hasGasOrHybrid ? origRates.gasolinePrice : origRates.dieselPrice;
  const origChargeY = getBlendedElectricityPrice(assumptions);
  const visibleSaved = savedScenarios.filter((s) => s.visible);

  const mapMarkers: MapScenarioMarker[] = [
    buildMarker(
      'original',
      'original',
      `${t.charts.pointOrigShort}: €${origFuelX.toFixed(2)} · €${origChargeY.toFixed(2)}`,
      t.charts.pointOrigShort,
      t.charts.originalCalculation,
      originalColor,
      origRates
    ),
  ];

  const simMatchesVisibleSaved =
    simulatedRates !== null &&
    visibleSaved.some((s) =>
      areScenarioRatesEqual(s.rates, simulatedRates, cars, false)
    );

  if (
    simulatedRates !== null &&
    !areScenarioRatesEqual(simulatedRates, origRates, cars, false) &&
    !simMatchesVisibleSaved
  ) {
    const simFuelX = hasGasOrHybrid
      ? simulatedRates.gasolinePrice
      : simulatedRates.dieselPrice;
    const simChargeY = getBlendedElectricityPrice({
      ...assumptions,
      ...simulatedRates,
    });
    const badgePrefix = isCompact
      ? t.charts.simShort
      : t.charts.simulatedCalculation;
    mapMarkers.push(
      buildMarker(
        'simulated',
        'simulated',
        `${badgePrefix}: €${simFuelX.toFixed(2)} · €${simChargeY.toFixed(2)}`,
        t.charts.simShort,
        t.charts.simulatedCalculation,
        simColor,
        simulatedRates
      )
    );
  }

  for (const s of visibleSaved) {
    const sFuelX = hasGasOrHybrid
      ? s.rates.gasolinePrice
      : s.rates.dieselPrice;
    const sChargeY = getBlendedElectricityPrice({
      ...assumptions,
      ...s.rates,
    });
    mapMarkers.push(
      buildMarker(
        s.id,
        'saved',
        `${s.shortTag}: €${sFuelX.toFixed(2)} · €${sChargeY.toFixed(2)}`,
        s.shortTag,
        s.shortTag,
        isDark ? s.darkColor : s.color,
        s.rates
      )
    );
  }

  // Reserve all marker dots first so labels never sit on top of any dot
  const placedBoxes: PlacedBox[] = mapMarkers.map((m) => ({
    x: m.px - 9,
    y: m.py - 9,
    w: 18,
    h: 18,
  }));

  // Compute collision-free badge boxes closely anchored to Original, Simulated, and Saved scenario pins
  const markerLabels = mapMarkers.map((m) => {
    const fullW = Math.max(
      isCompact ? 104 : 114,
      m.badgeLabel.length * (isCompact ? 6.2 : 5.9) + 28
    );
    const h = isCompact ? 22 : 21;
    const anchors = [
      { x: m.px + fullW / 2 + 10, y: m.py - 16 },
      { x: m.px - fullW / 2 - 10, y: m.py - 16 },
      { x: m.px + fullW / 2 + 10, y: m.py + 16 },
      { x: m.px - fullW / 2 - 10, y: m.py + 16 },
    ];
    let text = m.badgeLabel;
    let box = findFreeBox(anchors, fullW, h, bounds, placedBoxes);
    if (!box) {
      const compactW = Math.max(54, m.shortTag.length * 7.2 + 26);
      text = m.shortTag;
      box = findFreeBox(
        [
          { x: m.px + compactW / 2 + 9, y: m.py - 14 },
          { x: m.px - compactW / 2 - 9, y: m.py - 14 },
          { x: m.px + compactW / 2 + 9, y: m.py + 15 },
          { x: m.px - compactW / 2 - 9, y: m.py + 15 },
        ],
        compactW,
        h,
        bounds,
        placedBoxes
      );
    }
    if (!box) {
      box = {
        x: Math.max(bounds.left, Math.min(bounds.right - fullW, m.px + 10)),
        y: Math.max(bounds.top, Math.min(bounds.bottom - h, m.py - 22)),
        w: fullW,
        h,
      };
    }
    placedBoxes.push(box);
    return { marker: m, text, box };
  });

  const zoneLabels = zones.map((zone) => {
    if (zone.areaFraction < 0.06) return null;
    const ptShort = t.powertrains[zone.powertrain].shortLabel;
    const labelStr = t.charts.zoneBadgeLabel(ptShort);
    const w = Math.max(
      isCompact ? 104 : 102,
      labelStr.length * (isCompact ? 6.8 : 6.3) + 28
    );
    const h = isCompact ? 24 : 23;
    const cx = xForFuel(zone.centroid.x);
    const cy = yForCharge(zone.centroid.y);
    const box = findFreeBox([{ x: cx, y: cy }], w, h, bounds, placedBoxes);
    if (box) placedBoxes.push(box);
    return { zone, labelStr, box };
  });

  const activeBreakBadges = breakingLines.map((bl) => {
    const hasActive = Boolean(bl.activeStart && bl.activeEnd);
    if (!hasActive || !bl.activeStart || !bl.activeEnd) return null;
    const ax1 = xForFuel(bl.activeStart.x);
    const ay1 = yForCharge(bl.activeStart.y);
    const ax2 = xForFuel(bl.activeEnd.x);
    const ay2 = yForCharge(bl.activeEnd.y);
    const labelA = t.powertrains[cars[bl.carAIndex].powertrain].shortLabel;
    const labelB = t.powertrains[cars[bl.carBIndex].powertrain].shortLabel;
    const tagStr = `${labelA.slice(0, 4)} = ${labelB.slice(0, 4)}`;
    const w = isCompact ? 88 : 84;
    const h = isCompact ? 21 : 19;
    const anchors = [
      { x: (ax1 + ax2) / 2, y: (ay1 + ay2) / 2 },
      { x: ax1 * 0.72 + ax2 * 0.28, y: ay1 * 0.72 + ay2 * 0.28 },
      { x: ax1 * 0.28 + ax2 * 0.72, y: ay1 * 0.28 + ay2 * 0.72 },
    ];
    const box = findFreeBox(anchors, w, h, bounds, placedBoxes);
    if (box) placedBoxes.push(box);
    return { tagStr, box };
  });

  return (
    <div>
      <div className="chart-header sensitivity-chart-header">
        <div>
          <h3 className="chart-title">{t.studio.mapTitle2D}</h3>
          <p className="chart-sub">{t.charts.sensSub2D}</p>
        </div>
      </div>

      <div className="chart-legend sensitivity-legend" aria-label="Map legend">
        {cars.map((car, idx) => {
          const meta = POWERTRAIN_META[car.powertrain];
          const color = isDark ? meta.darkColor : meta.color;
          return (
            <div key={car.slotId} className="chart-legend-item">
              <span
                className="zone-swatch"
                style={{ backgroundColor: color }}
                aria-hidden="true"
              />
              <span>
                {t.studio.carWord} {idx + 1}:{' '}
                {t.powertrains[car.powertrain].shortLabel} (
                {t.bodyClasses[car.bodyClass]}) {t.charts.zoneWord}
              </span>
            </div>
          );
        })}
        <div className="chart-legend-item">
          <span className="chart-legend-break" aria-hidden="true" />
          <span>{t.charts.equalEnergyLegend}</span>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="tco-chart-svg sensitivity-svg"
        role="img"
        aria-label={t.studio.mapTitle2D}
        onPointerDown={handlePointerMove}
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setHoverPt(null)}
      >
        {/* Colored Winning Zones */}
        {zones.map((zone) => {
          const meta = POWERTRAIN_META[zone.powertrain];
          const color = isDark ? meta.darkColor : meta.color;
          const ptsStr = zone.polygon
            .map(
              (p) => `${xForFuel(p.x).toFixed(1)},${yForCharge(p.y).toFixed(1)}`
            )
            .join(' ');

          return (
            <polygon
              key={`zone-${zone.carIndex}`}
              points={ptsStr}
              fill={color}
              fillOpacity={isDark ? 0.24 : 0.16}
              stroke={color}
              strokeOpacity={0.35}
              strokeWidth="1"
            />
          );
        })}

        {/* Gridlines + Y-axis (Charging EUR/kWh) */}
        {yTicks.map((tick) => {
          const y = yForCharge(tick);
          return (
            <g key={tick} pointerEvents="none">
              <line
                x1={padLeft}
                y1={y}
                x2={width - padRight}
                y2={y}
                stroke="currentColor"
                strokeOpacity="0.14"
                strokeDasharray="3 4"
              />
              <text
                x={padLeft - 10}
                y={y + 4}
                textAnchor="end"
                className="chart-axis-text"
              >
                €{tick.toFixed(2)}
              </text>
            </g>
          );
        })}

        {/* Gridlines + X-axis (Fuel EUR/L) */}
        {xTicks.map((tick) => {
          const x = xForFuel(tick);
          return (
            <g key={tick} pointerEvents="none">
              <line
                x1={x}
                y1={padTop}
                x2={x}
                y2={height - padBottom}
                stroke="currentColor"
                strokeOpacity="0.12"
                strokeDasharray="3 4"
              />
              <text
                x={x}
                y={height - 24}
                textAnchor="middle"
                className="chart-axis-text"
              >
                €{tick.toFixed(2)}
              </text>
            </g>
          );
        })}

        {/* Axis Titles */}
        <text
          x={padLeft + plotW / 2}
          y={height - 5}
          textAnchor="middle"
          className="chart-axis-text"
        >
          {t.charts.fuelAxisTitle}
        </text>
        <text
          x={16}
          y={padTop + plotH / 2}
          textAnchor="middle"
          transform={`rotate(-90 16 ${padTop + plotH / 2})`}
          className="chart-axis-text"
        >
          {t.charts.chargingAxisTitle}
        </text>

        {/* Plot Border */}
        <rect
          x={padLeft}
          y={padTop}
          width={plotW}
          height={plotH}
          fill="none"
          stroke="var(--border-strong)"
          strokeWidth="1"
          pointerEvents="none"
        />

        {/* Breaking Lines */}
        {breakingLines.map((bl, idx) => {
          const fx1 = xForFuel(bl.fullStart.x);
          const fy1 = yForCharge(bl.fullStart.y);
          const fx2 = xForFuel(bl.fullEnd.x);
          const fy2 = yForCharge(bl.fullEnd.y);

          const hasActive = bl.activeStart && bl.activeEnd;
          const ax1 = bl.activeStart ? xForFuel(bl.activeStart.x) : 0;
          const ay1 = bl.activeStart ? yForCharge(bl.activeStart.y) : 0;
          const ax2 = bl.activeEnd ? xForFuel(bl.activeEnd.x) : 0;
          const ay2 = bl.activeEnd ? yForCharge(bl.activeEnd.y) : 0;

          return (
            <g key={`bl-${idx}`} pointerEvents="none">
              <line
                x1={fx1}
                y1={fy1}
                x2={fx2}
                y2={fy2}
                stroke="var(--text-primary)"
                strokeOpacity={hasActive ? 0.2 : 0.32}
                strokeWidth="1.2"
                strokeDasharray="2 4"
              />

              {hasActive && (
                <>
                  <line
                    x1={ax1}
                    y1={ay1}
                    x2={ax2}
                    y2={ay2}
                    stroke="var(--bg)"
                    strokeWidth="5"
                    strokeOpacity="0.72"
                  />
                  <line
                    x1={ax1}
                    y1={ay1}
                    x2={ax2}
                    y2={ay2}
                    stroke="var(--text-primary)"
                    strokeWidth="2.4"
                    strokeDasharray="6 4"
                  />
                </>
              )}
            </g>
          );
        })}

        {/* Non-Overlapping Zone Area Cards */}
        {zoneLabels.map((entry) => {
          if (!entry || !entry.box) return null;
          const meta = POWERTRAIN_META[entry.zone.powertrain];
          const color = isDark ? meta.darkColor : meta.color;
          const { box, labelStr } = entry;
          return (
            <g key={`zlabel-${entry.zone.carIndex}`} pointerEvents="none">
              <rect
                x={box.x}
                y={box.y}
                width={box.w}
                height={box.h}
                rx="4"
                fill="var(--surface-elevated)"
                fillOpacity="0.94"
                stroke={color}
                strokeWidth="1.4"
              />
              <rect
                x={box.x + 8}
                y={box.y + box.h / 2 - 4}
                width="8"
                height="8"
                rx="2"
                fill={color}
              />
              <text
                x={box.x + 21}
                y={box.y + box.h * 0.67}
                textAnchor="start"
                className="sensitivity-zone-label"
                fill={isDark ? '#f4f6f5' : '#111614'}
              >
                {labelStr}
              </text>
            </g>
          );
        })}

        {/* Non-Overlapping Active Breaking-Line Tags */}
        {activeBreakBadges.map((entry, idx) => {
          if (!entry || !entry.box) return null;
          const { box, tagStr } = entry;
          return (
            <g key={`btag-${idx}`} pointerEvents="none">
              <rect
                x={box.x}
                y={box.y}
                width={box.w}
                height={box.h}
                rx="3"
                fill="var(--text-primary)"
              />
              <text
                x={box.x + box.w / 2}
                y={box.y + box.h * 0.68}
                textAnchor="middle"
                className="sensitivity-break-tag"
                fill="var(--bg)"
              >
                {tagStr}
              </text>
            </g>
          );
        })}

        {/* Original Calculation + Simulated + Saved Scenario Pins */}
        {markerLabels.map(({ marker, text, box }) => {
          const isOriginal = marker.kind === 'original';
          return (
            <g key={`map-sc-${marker.id}`} pointerEvents="none">
              <line
                x1={marker.px}
                y1={marker.py}
                x2={marker.px}
                y2={height - padBottom}
                stroke={marker.color}
                strokeOpacity={isOriginal ? 0.45 : 0.55}
                strokeWidth="1.3"
                strokeDasharray="3 3"
              />
              <line
                x1={padLeft}
                y1={marker.py}
                x2={marker.px}
                y2={marker.py}
                stroke={marker.color}
                strokeOpacity={isOriginal ? 0.45 : 0.55}
                strokeWidth="1.3"
                strokeDasharray="3 3"
              />
              <circle
                cx={marker.px}
                cy={marker.py}
                r="10"
                fill={marker.color}
                fillOpacity="0.18"
              />

              {isOriginal ? (
                <>
                  <circle
                    cx={marker.px}
                    cy={marker.py}
                    r="6.5"
                    fill="var(--bg)"
                    stroke={marker.color}
                    strokeWidth="2.5"
                  />
                  <circle cx={marker.px} cy={marker.py} r="2.8" fill={marker.color} />
                </>
              ) : (
                <>
                  <circle
                    cx={marker.px}
                    cy={marker.py}
                    r="6.5"
                    fill={marker.color}
                    stroke="var(--bg)"
                    strokeWidth="2"
                  />
                  <circle cx={marker.px} cy={marker.py} r="2.2" fill="#ffffff" />
                </>
              )}

              <rect
                x={box.x}
                y={box.y}
                width={box.w}
                height={box.h}
                rx="6"
                fill={isOriginal ? 'var(--bg)' : marker.color}
                stroke={marker.color}
                strokeWidth={isOriginal ? '1.8' : '1.2'}
              />
              {isOriginal ? (
                <g>
                  <circle
                    cx={box.x + 11}
                    cy={box.y + box.h / 2}
                    r="3.6"
                    fill="none"
                    stroke={marker.color}
                    strokeWidth="1.6"
                  />
                  <circle
                    cx={box.x + 11}
                    cy={box.y + box.h / 2}
                    r="1.4"
                    fill={marker.color}
                  />
                </g>
              ) : marker.kind === 'simulated' ? (
                <polygon
                  points={`${box.x + 11},${box.y + box.h / 2 - 4} ${box.x + 15},${box.y + box.h / 2} ${box.x + 11},${box.y + box.h / 2 + 4} ${box.x + 7},${box.y + box.h / 2}`}
                  fill="#ffffff"
                />
              ) : (
                <rect
                  x={box.x + 7.5}
                  y={box.y + box.h / 2 - 3.5}
                  width="7"
                  height="7"
                  rx="1.5"
                  fill="#ffffff"
                />
              )}
              <text
                x={box.x + 20}
                y={box.y + box.h * 0.68}
                textAnchor="start"
                className="sensitivity-point-tag"
                fill={isOriginal ? marker.color : '#ffffff'}
              >
                {text}
              </text>
            </g>
          );
        })}

        {/* Interactive Hover Crosshair (Inspection Only) */}
        {hoverPt && (
          <g pointerEvents="none">
            <line
              x1={xForFuel(hoverPt.x)}
              y1={padTop}
              x2={xForFuel(hoverPt.x)}
              y2={height - padBottom}
              stroke="var(--text-primary)"
              strokeOpacity="0.45"
              strokeWidth="1.1"
            />
            <line
              x1={padLeft}
              y1={yForCharge(hoverPt.y)}
              x2={width - padRight}
              y2={yForCharge(hoverPt.y)}
              stroke="var(--text-primary)"
              strokeOpacity="0.45"
              strokeWidth="1.1"
            />
            <circle
              cx={xForFuel(hoverPt.x)}
              cy={yForCharge(hoverPt.y)}
              r="4.5"
              fill="var(--accent)"
              stroke="var(--bg)"
              strokeWidth="1.8"
            />
          </g>
        )}
      </svg>

      {/* Live Energy Readout Strip at Hovered or Original (Fuel, Charging) Coordinate */}
      <div className="sensitivity-readout-bar">
        <span className="sensitivity-readout-x tabular-nums">
          {hoverPt ? t.charts.atLabel : t.charts.originalCalculation} €
          {inspectPt.x.toFixed(2)}/L · €{inspectPt.y.toFixed(2)}/kWh:
        </span>
        <div className={`sensitivity-readout-vals cols-${cars.length}`}>
          {cars.map((car, idx) => {
            const color = isDark
              ? POWERTRAIN_META[car.powertrain].darkColor
              : POWERTRAIN_META[car.powertrain].color;
            const annualCost = inspectCosts[idx] ?? 0;
            const per100Km = annualKm > 0 ? (annualCost / annualKm) * 100 : 0;
            const isMin = annualCost <= minInspectCost + 0.5;
            return (
              <span
                key={car.slotId}
                className={`sensitivity-readout-item tabular-nums${
                  isMin ? ' is-best' : ''
                }`}
              >
                <span
                  className="sensitivity-dot"
                  style={{ backgroundColor: color }}
                  aria-hidden="true"
                />
                {t.powertrains[car.powertrain].shortLabel}:{' '}
                {formatEur(annualCost, 0, t.locale)}/{t.studio.yrUnit} (
                {formatEur(per100Km, 2, t.locale)}/100km)
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
