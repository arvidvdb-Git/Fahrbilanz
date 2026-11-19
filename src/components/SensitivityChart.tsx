import { useEffect, useState } from 'react';
import {
  ACTIVE_SIM_MARKER_COLOR,
  CarSlotConfig,
  ComparisonMode,
  GlobalAssumptions,
  ORIGINAL_MARKER_COLOR,
  POWERTRAIN_META,
  SavedScenario,
  ScenarioRates,
  SensitivityAnalysis,
  applyScenarioToCars,
  areScenarioRatesEqual,
  calculateTco,
  extractScenarioRates,
  formatEur,
  getBlendedElectricityPrice,
} from '../data/cars';
import { Language, TRANSLATIONS } from '../i18n/translations';

interface SensitivityChartProps {
  cars: CarSlotConfig[];
  analysis: SensitivityAnalysis;
  assumptions: GlobalAssumptions;
  years: number;
  comparisonMode: ComparisonMode;
  simulatedRates?: ScenarioRates | null;
  savedScenarios?: SavedScenario[];
  isDark: boolean;
  lang: Language;
  embedded?: boolean;
}

interface PlacedBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

function boxesOverlap(a: PlacedBox, b: PlacedBox, pad = 4): boolean {
  return !(
    a.x + a.w + pad <= b.x ||
    b.x + b.w + pad <= a.x ||
    a.y + a.h + pad <= b.y ||
    b.y + b.h + pad <= a.y
  );
}

function findPlotBox(
  anchors: Array<{ x: number; y: number }>,
  w: number,
  h: number,
  bounds: { left: number; top: number; right: number; bottom: number },
  placed: PlacedBox[]
): PlacedBox {
  const clampBox = (x: number, y: number): PlacedBox => ({
    x: Math.max(bounds.left, Math.min(bounds.right - w, x)),
    y: Math.max(bounds.top, Math.min(bounds.bottom - h, y)),
    w,
    h,
  });

  for (const a of anchors) {
    const cand = clampBox(a.x, a.y);
    if (!placed.some((p) => boxesOverlap(p, cand, 4))) {
      return cand;
    }
  }

  // Fallback sweep inside plot bounds
  const stepY = 24;
  for (let y = bounds.top; y <= bounds.bottom - h; y += stepY) {
    for (const a of anchors) {
      const cand = clampBox(a.x, y);
      if (!placed.some((p) => boxesOverlap(p, cand, 3))) {
        return cand;
      }
    }
  }

  return clampBox(anchors[0]?.x ?? bounds.left, anchors[0]?.y ?? bounds.top);
}

interface ChartScenarioMarker {
  id: string;
  kind: 'original' | 'simulated' | 'saved';
  badgeLabel: string;
  legendLabel: string;
  color: string;
  xVal: number;
  clampedX: number;
  inRange: boolean;
  carCosts: number[];
  bestCarIdx: number;
  bestCost: number;
  fuelDisplay: number;
  chargeDisplay: number;
}

export function SensitivityChart({
  cars,
  analysis,
  assumptions,
  years,
  comparisonMode,
  simulatedRates = null,
  savedScenarios = [],
  isDark,
  lang,
  embedded = false,
}: SensitivityChartProps) {
  const [hoverX, setHoverX] = useState<number | null>(null);
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
  const padLeft = isCompact ? 54 : 64;
  const padRight = isCompact ? 18 : 26;
  const padTop = isCompact ? 76 : 72;
  const padBottom = isCompact ? 38 : 42;

  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;
  const plotBounds = {
    left: padLeft + 6,
    top: padTop + 6,
    right: width - padRight - 6,
    bottom: height - padBottom - 6,
  };

  const {
    xMin,
    xMax,
    xTicks,
    currentX,
    lines,
    regimes,
    switches,
    mode,
    unitLabel,
  } = analysis;

  const hasGasOrHybrid = cars.some(
    (c) => c.powertrain === 'gasoline' || c.powertrain === 'hybrid'
  );

  const getSweptX = (rates: ScenarioRates): number => {
    if (mode === 'fuel') {
      return hasGasOrHybrid ? rates.gasolinePrice : rates.dieselPrice;
    }
    return getBlendedElectricityPrice({ ...assumptions, ...rates });
  };

  const formatX = (x: number) => `€${x.toFixed(2)}`;
  const unitSuffix = mode === 'fuel' ? '/L' : '/kWh';

  // Build markers: Original calculation (always), Active Simulated (if different & not matching visible saved), Saved scenarios
  const originalColor = isDark
    ? ORIGINAL_MARKER_COLOR.dark
    : ORIGINAL_MARKER_COLOR.light;
  const simColor = isDark
    ? ACTIVE_SIM_MARKER_COLOR.dark
    : ACTIVE_SIM_MARKER_COLOR.light;

  const includeTcoInScenario = comparisonMode !== 'energy';
  const origRates = extractScenarioRates(assumptions, cars);
  const origCarCosts = cars.map((car) => calculateTco(car, assumptions).activeTotal);
  const origBestCost = Math.min(...origCarCosts);
  const origBestIdx = Math.max(0, origCarCosts.findIndex((c) => c === origBestCost));

  const visibleSaved = savedScenarios.filter((s) => s.visible);

  const origPointLabel = `${
    isCompact ? t.charts.pointOrigShort : t.charts.originalCalculation
  }: ${formatX(currentX)}${unitSuffix}`;

  const scenarioMarkers: ChartScenarioMarker[] = [
    {
      id: 'original',
      kind: 'original',
      badgeLabel: origPointLabel,
      legendLabel: t.charts.originalCalculation,
      color: originalColor,
      xVal: currentX,
      clampedX: Math.max(xMin, Math.min(xMax, currentX)),
      inRange: currentX >= xMin && currentX <= xMax,
      carCosts: origCarCosts,
      bestCarIdx: origBestIdx,
      bestCost: origBestCost,
      fuelDisplay: hasGasOrHybrid
        ? origRates.gasolinePrice
        : origRates.dieselPrice,
      chargeDisplay: getBlendedElectricityPrice(assumptions),
    },
  ];

  const simMatchesVisibleSaved =
    simulatedRates !== null &&
    visibleSaved.some((s) =>
      areScenarioRatesEqual(s.rates, simulatedRates, cars, includeTcoInScenario)
    );

  if (
    simulatedRates !== null &&
    !areScenarioRatesEqual(simulatedRates, origRates, cars, includeTcoInScenario) &&
    !simMatchesVisibleSaved
  ) {
    const simAssump: GlobalAssumptions = { ...assumptions, ...simulatedRates };
    const simCars = applyScenarioToCars(cars, simulatedRates);
    const simX = getSweptX(simulatedRates);
    const simCosts = simCars.map((car) => calculateTco(car, simAssump).activeTotal);
    const bestCost = Math.min(...simCosts);
    const bestIdx = Math.max(0, simCosts.findIndex((c) => c === bestCost));
    scenarioMarkers.push({
      id: 'simulated',
      kind: 'simulated',
      badgeLabel: `${
        isCompact ? t.charts.simShort : t.charts.simulatedCalculation
      }: ${formatX(simX)}${unitSuffix}`,
      legendLabel: t.charts.simulatedCalculation,
      color: simColor,
      xVal: simX,
      clampedX: Math.max(xMin, Math.min(xMax, simX)),
      inRange: simX >= xMin && simX <= xMax,
      carCosts: simCosts,
      bestCarIdx: bestIdx,
      bestCost,
      fuelDisplay: hasGasOrHybrid
        ? simulatedRates.gasolinePrice
        : simulatedRates.dieselPrice,
      chargeDisplay: getBlendedElectricityPrice(simAssump),
    });
  }

  for (const s of visibleSaved) {
    const scAssump: GlobalAssumptions = { ...assumptions, ...s.rates };
    const scCars = applyScenarioToCars(cars, s.rates);
    const sx = getSweptX(s.rates);
    const scCosts = scCars.map((car) => calculateTco(car, scAssump).activeTotal);
    const bestCost = Math.min(...scCosts);
    const bestIdx = Math.max(0, scCosts.findIndex((c) => c === bestCost));
    scenarioMarkers.push({
      id: s.id,
      kind: 'saved',
      badgeLabel: `${s.shortTag}: ${formatX(sx)}${unitSuffix}`,
      legendLabel: s.shortTag,
      color: isDark ? s.darkColor : s.color,
      xVal: sx,
      clampedX: Math.max(xMin, Math.min(xMax, sx)),
      inRange: sx >= xMin && sx <= xMax,
      carCosts: scCosts,
      bestCarIdx: bestIdx,
      bestCost,
      fuelDisplay: hasGasOrHybrid
        ? s.rates.gasolinePrice
        : s.rates.dieselPrice,
      chargeDisplay: getBlendedElectricityPrice(scAssump),
    });
  }

  const ySamples = [
    ...lines.flatMap((l) => [l.evalAt(xMin), l.evalAt(xMax)]),
    ...scenarioMarkers.flatMap((m) => m.carCosts),
  ];
  const rawMin = Math.min(...ySamples);
  const rawMax = Math.max(...ySamples);
  const ySpan = Math.max(200, rawMax - rawMin);
  const yPad = Math.max(80, ySpan * 0.16);
  const paddedMin = Math.max(0, rawMin - yPad);
  const paddedMax = rawMax + yPad;
  const ySteps = [100, 200, 250, 500, 1000, 2000, 2500, 5000, 10000];
  const step =
    ySteps.find((st) => (paddedMax - paddedMin) / st <= 5.5) ?? 10000;
  const yMin = Math.max(0, Math.floor(paddedMin / step) * step);
  const yMax = Math.max(
    yMin + step * 2,
    Math.ceil(paddedMax / step) * step
  );

  const yTicks: number[] = [];
  for (let v = yMin; v <= yMax + 1e-6; v += step) {
    yTicks.push(Math.round(v));
  }

  const xForVal = (x: number) =>
    padLeft + ((x - xMin) / (xMax - xMin)) * plotW;
  const yForVal = (y: number) =>
    padTop + plotH - ((y - yMin) / (yMax - yMin)) * plotH;

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const ctm = svg.getScreenCTM();
    let svgX: number;

    if (ctm) {
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      svgX = pt.matrixTransform(ctm.inverse()).x;
    } else {
      const rect = svg.getBoundingClientRect();
      if (!rect.width) return;
      svgX = ((e.clientX - rect.left) / rect.width) * width;
    }

    if (svgX < padLeft || svgX > width - padRight) {
      setHoverX(null);
      return;
    }
    const val = xMin + ((svgX - padLeft) / plotW) * (xMax - xMin);
    setHoverX(Math.max(xMin, Math.min(xMax, val)));
  };

  const clampedOrigX = scenarioMarkers[0].clampedX;
  const activeX = hoverX ?? clampedOrigX;
  const activeMinVal = Math.min(...lines.map((l) => l.evalAt(activeX)));

  // Compute non-overlapping break badges in 2 dedicated lanes strictly ABOVE the zone ribbon
  const breakBadgeW = isCompact ? 104 : 114;
  const breakBadgeH = isCompact ? 22 : 20;
  const placedBreakBadges: PlacedBox[] = [];
  const switchPlacements = switches.map((sw) => {
    const bx = xForVal(sw.x);
    const by = yForVal(sw.y);
    const desiredX = Math.max(
      padLeft,
      Math.min(width - padRight - breakBadgeW, bx - breakBadgeW / 2)
    );
    const rowYs = [padTop - 26 - breakBadgeH, Math.max(2, padTop - 29 - breakBadgeH * 2)];
    let chosenBox: PlacedBox = {
      x: desiredX,
      y: rowYs[0],
      w: breakBadgeW,
      h: breakBadgeH,
    };

    outer: for (const ry of rowYs) {
      const offsets = [0, 24, -24, 48, -48];
      for (const dx of offsets) {
        const cx = Math.max(
          padLeft,
          Math.min(width - padRight - breakBadgeW, desiredX + dx)
        );
        const cand: PlacedBox = { x: cx, y: ry, w: breakBadgeW, h: breakBadgeH };
        if (!placedBreakBadges.some((p) => boxesOverlap(p, cand, 4))) {
          chosenBox = cand;
          break outer;
        }
      }
    }
    placedBreakBadges.push(chosenBox);
    return { sw, bx, by, badge: chosenBox };
  });

  // Reserve break dots & scenario marker dots so badges never obscure points
  const placedPlotBoxes: PlacedBox[] = [
    ...switchPlacements.map((sp) => ({
      x: sp.bx - 10,
      y: sp.by - 10,
      w: 20,
      h: 20,
    })),
    ...scenarioMarkers.flatMap((m) => {
      if (!m.inRange) return [];
      const mx = xForVal(m.clampedX);
      return m.carCosts.map((cost) => {
        const my = yForVal(cost);
        return { x: mx - 9, y: my - 9, w: 18, h: 18 };
      });
    }),
  ];

  // Place non-overlapping badges closely anchored near each plotted scenario point
  const markerPlacements = scenarioMarkers.map((marker) => {
    const px = xForVal(marker.clampedX);
    const bestPy = yForVal(marker.bestCost);

    const text = marker.badgeLabel;
    const badgeW = Math.max(
      isCompact ? 98 : 108,
      Math.min(
        isCompact ? 192 : 236,
        text.length * (isCompact ? 6.5 : 6.2) + 28
      )
    );
    const badgeH = isCompact ? 22 : 21;

    const candidates: Array<{ x: number; y: number }> = [
      { x: px + 10, y: bestPy - badgeH / 2 },
      { x: px - badgeW - 10, y: bestPy - badgeH / 2 },
      { x: px + 10, y: bestPy - badgeH - 8 },
      { x: px - badgeW - 10, y: bestPy - badgeH - 8 },
      { x: px + 10, y: bestPy + 10 },
      { x: px - badgeW - 10, y: bestPy + 10 },
      { x: px + 12, y: bestPy - badgeH * 2 - 12 },
      { x: px - badgeW - 12, y: bestPy - badgeH * 2 - 12 },
      { x: px + 12, y: bestPy + badgeH + 14 },
      { x: px - badgeW - 12, y: bestPy + badgeH + 14 },
      { x: px - badgeW / 2, y: Math.max(plotBounds.top, bestPy - badgeH - 14) },
      { x: px - badgeW / 2, y: Math.min(plotBounds.bottom - badgeH, bestPy + 14) },
    ];

    const box = findPlotBox(
      candidates,
      badgeW,
      badgeH,
      plotBounds,
      placedPlotBoxes
    );
    placedPlotBoxes.push(box);
    return { marker, px, bestPy, box };
  });

  const content = (
    <>
      <div className="chart-header sensitivity-chart-header">
        <div>
          <h3 className="chart-title">
            {comparisonMode === 'energy'
              ? t.charts.sensEnergyTitle(years)
              : t.charts.sensTcoTitle(years)}
          </h3>
          <p className="chart-sub">
            {mode === 'fuel'
              ? analysis.dieselTracksSpread
                ? t.charts.sensSubFuelSpread
                : t.charts.sensSubFuel
              : t.charts.sensSubElectricityPrice}
          </p>
        </div>
      </div>

      <div className="chart-legend sensitivity-legend" aria-label="Chart legend">
        {cars.map((car, idx) => {
          const meta = POWERTRAIN_META[car.powertrain];
          const color = isDark ? meta.darkColor : meta.color;
          return (
            <div key={car.slotId} className="chart-legend-item">
              <span
                className="chart-legend-line"
                style={{
                  backgroundColor: color,
                  borderBottom: idx === 2 ? `2px dashed ${color}` : undefined,
                }}
                aria-hidden="true"
              />
              <span>
                {t.studio.carWord} {idx + 1}:{' '}
                {t.powertrains[car.powertrain].shortLabel} (
                {t.bodyClasses[car.bodyClass]})
              </span>
            </div>
          );
        })}
        <div className="chart-legend-item">
          <span className="chart-legend-break" aria-hidden="true" />
          <span>{t.charts.breakingLineLegend}</span>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="tco-chart-svg sensitivity-svg"
        role="img"
        aria-label={t.charts.sensTcoTitle(years)}
        onPointerDown={handlePointerMove}
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setHoverX(null)}
      >
        {/* Colored Best-Value Winner Zones + Dedicated Top Zone Ribbon */}
        {regimes.map((reg) => {
          const x1 = xForVal(reg.xStart);
          const x2 = xForVal(reg.xEnd);
          const bandW = x2 - x1;
          const winnerCar = cars[reg.winnerCarIndex];
          const meta = POWERTRAIN_META[winnerCar.powertrain];
          const ptShort = t.powertrains[winnerCar.powertrain].shortLabel;
          const color = isDark ? meta.darkColor : meta.color;
          const midX = (x1 + x2) / 2;

          return (
            <g key={`${reg.xStart}-${reg.winnerCarIndex}`}>
              <rect
                x={x1}
                y={padTop}
                width={bandW}
                height={plotH}
                fill={color}
                fillOpacity={isDark ? 0.16 : 0.11}
              />
              <rect
                x={x1}
                y={padTop - 24}
                width={bandW}
                height={22}
                fill={color}
                fillOpacity={isDark ? 0.36 : 0.24}
              />
              <line
                x1={x1}
                y1={padTop}
                x2={x2}
                y2={padTop}
                stroke={color}
                strokeWidth="2"
                strokeOpacity="0.85"
              />
              {bandW >= (isCompact ? 48 : 62) && (
                <text
                  x={midX}
                  y={padTop - 9}
                  textAnchor="middle"
                  className="sensitivity-zone-label"
                  fill={isDark ? '#f4f6f5' : '#111614'}
                >
                  {bandW >= (isCompact ? 96 : 108)
                    ? t.charts.zoneBadgeLabel(ptShort)
                    : ptShort}
                </text>
              )}
            </g>
          );
        })}

        {/* Horizontal gridlines + Y labels */}
        {yTicks.map((tick) => {
          const y = yForVal(tick);
          return (
            <g key={tick} pointerEvents="none">
              <line
                x1={padLeft}
                y1={y}
                x2={width - padRight}
                y2={y}
                stroke="currentColor"
                strokeOpacity="0.12"
                strokeDasharray={tick === yMin ? undefined : '3 4'}
              />
              <text
                x={padLeft - 10}
                y={y + 4}
                textAnchor="end"
                className="chart-axis-text"
              >
                {tick >= 1000
                  ? `€${(tick / 1000).toFixed(
                      tick % 1000 === 0 ? 0 : tick % 100 === 0 ? 1 : 2
                    )}k`
                  : `€${Math.round(tick)}`}
              </text>
            </g>
          );
        })}

        {/* Vertical X ticks */}
        {xTicks.map((tick) => {
          const x = xForVal(tick);
          return (
            <g key={tick} pointerEvents="none">
              <line
                x1={x}
                y1={padTop}
                x2={x}
                y2={height - padBottom}
                stroke="currentColor"
                strokeOpacity="0.08"
              />
              <text
                x={x}
                y={height - 14}
                textAnchor="middle"
                className="chart-axis-text"
              >
                {formatX(tick)}
              </text>
            </g>
          );
        })}

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

        {/* Cost Lines across swept variable */}
        {lines.map((line, idx) => {
          const car = cars[idx];
          const meta = POWERTRAIN_META[car.powertrain];
          const color = isDark ? meta.darkColor : meta.color;
          const x1 = xForVal(xMin);
          const y1 = yForVal(line.evalAt(xMin));
          const x2 = xForVal(xMax);
          const y2 = yForVal(line.evalAt(xMax));

          return (
            <g key={line.slotId} pointerEvents="none">
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={color}
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={idx === 2 ? '7 4' : undefined}
              />
              <circle
                cx={x1}
                cy={y1}
                r="3.5"
                fill="var(--bg)"
                stroke={color}
                strokeWidth="2"
              />
              <circle cx={x2} cy={y2} r="3.5" fill={color} />
            </g>
          );
        })}

        {/* Prominent Vertical Breaking Lines + Non-Overlapping Upper Badges */}
        {switchPlacements.map(({ sw, bx, by, badge }, sIdx) => (
          <g key={`${sw.x}-${sIdx}`} pointerEvents="none">
            <line
              x1={bx}
              y1={padTop - 22}
              x2={bx}
              y2={height - padBottom}
              stroke="var(--bg)"
              strokeWidth="4.5"
              strokeOpacity="0.72"
            />
            <line
              x1={bx}
              y1={padTop - 22}
              x2={bx}
              y2={height - padBottom}
              stroke="var(--text-primary)"
              strokeWidth="2"
              strokeDasharray="5 4"
            />
            <circle
              cx={bx}
              cy={by}
              r="6"
              fill="var(--bg)"
              stroke="var(--text-primary)"
              strokeWidth="2.2"
            />
            <circle cx={bx} cy={by} r="2.3" fill="var(--text-primary)" />

            <rect
              x={badge.x}
              y={badge.y}
              width={badge.w}
              height={badge.h}
              rx="3"
              fill="var(--text-primary)"
            />
            <text
              x={badge.x + badge.w / 2}
              y={badge.y + badge.h * 0.68}
              textAnchor="middle"
              className="sensitivity-break-tag"
              fill="var(--bg)"
            >
              {t.studio.breakPrefix}: {formatX(sw.x)}
              {unitSuffix}
            </text>
          </g>
        ))}

        {/* Scenario Markers: Original calculation (always kept) + Simulated + Saved Scenarios */}
        {markerPlacements.map(({ marker, px, bestPy, box }) => {
          if (!marker.inRange) return null;
          const isOriginal = marker.kind === 'original';
          return (
            <g key={`sc-marker-${marker.id}`} pointerEvents="none">
              <line
                x1={px}
                y1={padTop}
                x2={px}
                y2={height - padBottom}
                stroke="var(--bg)"
                strokeWidth="4"
                strokeOpacity="0.6"
              />
              <line
                x1={px}
                y1={padTop}
                x2={px}
                y2={height - padBottom}
                stroke={marker.color}
                strokeWidth={isOriginal ? '2' : '2.2'}
                strokeDasharray={isOriginal ? '2 3' : '4 3'}
                strokeOpacity={isOriginal ? 0.85 : 0.95}
              />

              {/* Leader dot halo on winning car */}
              <circle
                cx={px}
                cy={bestPy}
                r="10.5"
                fill={marker.color}
                fillOpacity="0.2"
              />

              {marker.carCosts.map((cost, idx) => {
                const car = cars[idx];
                const carColor = isDark
                  ? POWERTRAIN_META[car.powertrain].darkColor
                  : POWERTRAIN_META[car.powertrain].color;
                const py = yForVal(cost);
                const isBest = idx === marker.bestCarIdx;

                if (isOriginal) {
                  return (
                    <g key={`orig-pt-${car.slotId}`}>
                      <circle
                        cx={px}
                        cy={py}
                        r={isBest ? '6.5' : '5'}
                        fill="var(--bg)"
                        stroke={marker.color}
                        strokeWidth="2.4"
                      />
                      <circle cx={px} cy={py} r="2.6" fill={carColor} />
                    </g>
                  );
                }

                // Simulated or Saved scenario: crisp diamond/ring in distinct scenario color
                return (
                  <g key={`sim-pt-${marker.id}-${car.slotId}`}>
                    <circle
                      cx={px}
                      cy={py}
                      r={isBest ? '6.5' : '4.8'}
                      fill={marker.color}
                      stroke="var(--bg)"
                      strokeWidth="2"
                    />
                    {isBest && (
                      <circle cx={px} cy={py} r="2.2" fill="var(--bg)" />
                    )}
                  </g>
                );
              })}

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
                {marker.badgeLabel}
              </text>
            </g>
          );
        })}

        {/* Interactive Hover Crosshair (Inspection Only) */}
        {hoverX !== null && (
          <g pointerEvents="none">
            <line
              x1={xForVal(hoverX)}
              y1={padTop}
              x2={xForVal(hoverX)}
              y2={height - padBottom}
              stroke="var(--text-primary)"
              strokeOpacity="0.6"
              strokeWidth="1.2"
            />
            {lines.map((l, idx) => {
              const car = cars[idx];
              const meta = POWERTRAIN_META[car.powertrain];
              const color = isDark ? meta.darkColor : meta.color;
              return (
                <circle
                  key={l.slotId}
                  cx={xForVal(hoverX)}
                  cy={yForVal(l.evalAt(hoverX))}
                  r="4.5"
                  fill={color}
                  stroke="var(--bg)"
                  strokeWidth="1.8"
                />
              );
            })}
          </g>
        )}
      </svg>

      {/* Live readout strip at hovered or original rate */}
      <div className="sensitivity-readout-bar">
        <span className="sensitivity-readout-x tabular-nums">
          {hoverX !== null ? t.charts.atLabel : t.charts.originalCalculation}{' '}
          {formatX(activeX)} {unitLabel}:
        </span>
        <div className={`sensitivity-readout-vals cols-${lines.length}`}>
          {lines.map((l, idx) => {
            const car = cars[idx];
            const meta = POWERTRAIN_META[car.powertrain];
            const color = isDark ? meta.darkColor : meta.color;
            const val = l.evalAt(activeX);
            const isMin = val <= activeMinVal + 0.5;
            return (
              <span
                key={l.slotId}
                className={`sensitivity-readout-item tabular-nums${
                  isMin ? ' is-best' : ''
                }`}
              >
                <span
                  className="sensitivity-dot"
                  style={{ backgroundColor: color }}
                  aria-hidden="true"
                />
                {t.studio.carWord} {idx + 1} (
                {t.powertrains[car.powertrain].shortLabel}):{' '}
                {formatEur(val, 0, t.locale)}
              </span>
            );
          })}
        </div>
      </div>
    </>
  );

  return embedded ? content : <div className="chart-panel">{content}</div>;
}
