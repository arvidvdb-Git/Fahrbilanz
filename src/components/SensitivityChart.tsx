import { useState } from 'react';
import {
  CarSlotConfig,
  ComparisonMode,
  POWERTRAIN_META,
  SensitivityAnalysis,
  SensitivityMode,
  formatEur,
} from '../data/cars';
import { Language, TRANSLATIONS } from '../i18n/translations';

interface SensitivityChartProps {
  cars: CarSlotConfig[];
  analysis: SensitivityAnalysis;
  years: number;
  comparisonMode: ComparisonMode;
  isDark: boolean;
  lang: Language;
  embedded?: boolean;
  onModeChange: (mode: SensitivityMode) => void;
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

export function SensitivityChart({
  cars,
  analysis,
  years,
  comparisonMode,
  isDark,
  lang,
  embedded = false,
  onModeChange,
}: SensitivityChartProps) {
  const [hoverX, setHoverX] = useState<number | null>(null);
  const t = TRANSLATIONS[lang];

  const width = 760;
  const height = 330;
  const padLeft = 64;
  const padRight = 26;
  const padTop = 72;
  const padBottom = 42;

  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const { xMin, xMax, currentX, lines, regimes, switches, mode, unitLabel } =
    analysis;

  const ySamples = lines.flatMap((l) => [l.evalAt(xMin), l.evalAt(xMax)]);
  const rawMin = Math.min(...ySamples);
  const rawMax = Math.max(...ySamples);
  const step = rawMax <= 14000 ? 2000 : 5000;
  const yMin = Math.max(0, Math.floor((rawMin * 0.9) / step) * step);
  const yMax = Math.max(
    yMin + step * 2,
    Math.ceil((rawMax * 1.06) / step) * step
  );

  const yTicks = [
    yMin,
    yMin + (yMax - yMin) * 0.25,
    yMin + (yMax - yMin) * 0.5,
    yMin + (yMax - yMin) * 0.75,
    yMax,
  ];

  const xTicks =
    mode === 'fuel'
      ? [0.5, 1.0, 1.5, 2.0, 2.5, 3.0]
      : mode === 'publicDc'
        ? [0.2, 0.4, 0.6, 0.8, 1.0, 1.2]
        : [0.1, 0.25, 0.4, 0.55, 0.7, 0.85];

  const xForVal = (x: number) =>
    padLeft + ((x - xMin) / (xMax - xMin)) * plotW;
  const yForVal = (y: number) =>
    padTop + plotH - ((y - yMin) / (yMax - yMin)) * plotH;

  const formatX = (x: number) => `€${x.toFixed(2)}`;

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

  const clampedCurX = Math.max(xMin, Math.min(xMax, currentX));
  const currentInRange = currentX >= xMin && currentX <= xMax;
  const activeX = hoverX ?? clampedCurX;
  const activeMinVal = Math.min(...lines.map((l) => l.evalAt(activeX)));

  // Compute non-overlapping break badges in 2 dedicated lanes strictly ABOVE the zone ribbon
  const breakBadgeW = 78;
  const breakBadgeH = 19;
  const placedBreakBadges: PlacedBox[] = [];
  const switchPlacements = switches.map((sw) => {
    const bx = xForVal(sw.x);
    const by = yForVal(sw.y);
    const desiredX = Math.max(
      padLeft,
      Math.min(width - padRight - breakBadgeW, bx - breakBadgeW / 2)
    );
    const rowYs = [5, 25];
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

  // Compute prominent non-overlapping "Now €X.XX" badge inside plot bounds
  const curPx = xForVal(clampedCurX);
  const curLineYs = lines.map((l) => yForVal(l.evalAt(clampedCurX)));
  const minCurPy = Math.min(...curLineYs);
  const maxCurPy = Math.max(...curLineYs);
  const nowText = `${t.charts.nowLabel}: ${formatX(currentX)}${
    mode === 'fuel' ? '/L' : '/kWh'
  }`;
  const nowW = Math.max(76, nowText.length * 6.1 + 14);
  const nowH = 19;

  const breakDotBoxes: PlacedBox[] = switchPlacements.map((sp) => ({
    x: sp.bx - 10,
    y: sp.by - 10,
    w: 20,
    h: 20,
  }));

  const nowCandidates: Array<{ x: number; y: number }> = [
    { x: curPx + 10, y: padTop + 8 },
    { x: curPx - nowW - 10, y: padTop + 8 },
    { x: curPx + 10, y: height - padBottom - nowH - 8 },
    { x: curPx - nowW - 10, y: height - padBottom - nowH - 8 },
    { x: curPx + 10, y: Math.max(padTop + 8, minCurPy - nowH - 10) },
    { x: curPx - nowW - 10, y: Math.min(height - padBottom - nowH - 8, maxCurPy + 12) },
  ];

  let nowBox: PlacedBox = {
    x: Math.max(
      padLeft + 6,
      Math.min(width - padRight - nowW - 6, nowCandidates[0].x)
    ),
    y: nowCandidates[0].y,
    w: nowW,
    h: nowH,
  };

  for (const c of nowCandidates) {
    const cx = Math.max(padLeft + 6, Math.min(width - padRight - nowW - 6, c.x));
    const cy = Math.max(padTop + 6, Math.min(height - padBottom - nowH - 6, c.y));
    const cand: PlacedBox = { x: cx, y: cy, w: nowW, h: nowH };
    const hitsSwitchLine = switchPlacements.some(
      (sp) => sp.bx > cand.x - 6 && sp.bx < cand.x + cand.w + 6
    );
    const hitsSwitchDot = breakDotBoxes.some((b) => boxesOverlap(b, cand, 4));
    if (!hitsSwitchLine && !hitsSwitchDot) {
      nowBox = cand;
      break;
    }
  }

  const content = (
    <>
      <div className="chart-header">
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
              : mode === 'homeAc'
                ? t.charts.sensSubHomeAc
                : mode === 'publicDc'
                  ? t.charts.sensSubPublicDc
                  : t.charts.sensSubBlended}
          </p>
        </div>

        <div
          className="horizon-tabs sensitivity-mode-tabs"
          role="tablist"
          aria-label="Sensitivity variable"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'fuel'}
            className={`horizon-btn${mode === 'fuel' ? ' is-active' : ''}`}
            onClick={() => onModeChange('fuel')}
          >
            {t.charts.tabFuel}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'homeAc'}
            className={`horizon-btn${mode === 'homeAc' ? ' is-active' : ''}`}
            onClick={() => onModeChange('homeAc')}
          >
            {t.charts.tabHomeAc}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'publicDc'}
            className={`horizon-btn${mode === 'publicDc' ? ' is-active' : ''}`}
            onClick={() => onModeChange('publicDc')}
          >
            {t.charts.tabPublicDc}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'blendedElec'}
            className={`horizon-btn${
              mode === 'blendedElec' ? ' is-active' : ''
            }`}
            onClick={() => onModeChange('blendedElec')}
          >
            {t.charts.tabAllKwh}
          </button>
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
        {/* Colored Best-Value Winner Zones + Dedicated Top Zone Ribbon (y = 54..76) */}
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
                y={padTop - 22}
                width={bandW}
                height={20}
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
              {bandW >= 62 && (
                <text
                  x={midX}
                  y={padTop - 8.5}
                  textAnchor="middle"
                  className="sensitivity-zone-label"
                  fill={isDark ? '#f4f6f5' : '#111614'}
                >
                  {bandW >= 112
                    ? `${t.charts.bestPrefix}: ${ptShort}`
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
                  ? `€${(tick / 1000).toFixed(tick % 1000 === 0 ? 0 : 1)}k`
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
              y1={badge.y + badge.h}
              x2={bx}
              y2={padTop - 22}
              stroke="var(--text-primary)"
              strokeOpacity="0.45"
              strokeWidth="1.2"
            />
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
              rx="4"
              fill="var(--text-primary)"
            />
            <text
              x={badge.x + badge.w / 2}
              y={badge.y + 12.5}
              textAnchor="middle"
              className="sensitivity-break-tag"
              fill="var(--bg)"
            >
              {formatX(sw.x)}
              {mode === 'fuel' ? '/L' : '/kWh'}
            </text>
          </g>
        ))}

        {/* Prominent Current Rate Marker (Locked / Not Manually Movable) */}
        {currentInRange && (
          <g pointerEvents="none">
            <line
              x1={curPx}
              y1={padTop}
              x2={curPx}
              y2={height - padBottom}
              stroke="var(--bg)"
              strokeWidth="4.5"
              strokeOpacity="0.65"
            />
            <line
              x1={curPx}
              y1={padTop}
              x2={curPx}
              y2={height - padBottom}
              stroke="var(--accent)"
              strokeWidth="2.2"
              strokeDasharray="3 3"
            />
            {lines.map((l, idx) => {
              const car = cars[idx];
              const meta = POWERTRAIN_META[car.powertrain];
              const color = isDark ? meta.darkColor : meta.color;
              const py = yForVal(l.evalAt(clampedCurX));
              return (
                <g key={`now-pt-${l.slotId}`}>
                  <circle
                    cx={curPx}
                    cy={py}
                    r="6"
                    fill="var(--bg)"
                    stroke={color}
                    strokeWidth="2.3"
                  />
                  <circle cx={curPx} cy={py} r="2.6" fill="var(--accent)" />
                </g>
              );
            })}
            <rect
              x={nowBox.x}
              y={nowBox.y}
              width={nowBox.w}
              height={nowBox.h}
              rx="4"
              fill="var(--accent)"
              stroke="var(--bg)"
              strokeWidth="1.2"
            />
            <text
              x={nowBox.x + nowBox.w / 2}
              y={nowBox.y + 12.5}
              textAnchor="middle"
              className="sensitivity-break-tag"
              fill="var(--accent-text)"
            >
              {nowText}
            </text>
          </g>
        )}

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

      {/* Live readout strip at hovered or current price */}
      <div className="sensitivity-readout-bar">
        <span className="sensitivity-readout-x tabular-nums">
          {hoverX !== null ? t.charts.atLabel : t.charts.currentLabel}{' '}
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
