import { useEffect, useState } from 'react';
import {
  CarSlotConfig,
  ComparisonMode,
  POWERTRAIN_META,
  TcoResult,
  formatEur,
} from '../data/cars';
import { Language, TRANSLATIONS } from '../i18n/translations';

interface ComparisonChartProps {
  cars: CarSlotConfig[];
  results: TcoResult[];
  years: number;
  comparisonMode: ComparisonMode;
  isDark: boolean;
  lang: Language;
}

export function ComparisonChart({
  cars,
  results,
  years,
  comparisonMode,
  isDark,
  lang,
}: ComparisonChartProps) {
  const [hoverYear, setHoverYear] = useState<number | null>(null);
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
  const height = isCompact ? 290 : 340;
  const padLeft = isCompact ? 56 : 76;
  const padRight = isCompact ? 22 : 56;
  const padTop = isCompact ? 68 : 76;
  const padBottom = isCompact ? 38 : 42;

  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const maxVal = Math.max(
    1000,
    ...results.flatMap((r) => r.cumulativeNetByYear)
  );
  const step = maxVal <= 12000 ? 2000 : 5000;
  const yMax = Math.ceil(maxVal / step) * step;
  const yTicks = [0, yMax * 0.25, yMax * 0.5, yMax * 0.75, yMax];

  const xForYear = (y: number) => padLeft + (y / years) * plotW;
  const yForVal = (val: number) => padTop + plotH - (val / yMax) * plotH;

  // Detect parity crossover year between the final-year winner and the car that started cheaper at Year 0
  let parityMarker: { yr: number; val: number } | null = null;
  if (results.length >= 2 && comparisonMode === 'tco') {
    const finalVals = results.map((r) => r.cumulativeNetByYear[years] ?? 0);
    const bestFinalIdx = finalVals.indexOf(Math.min(...finalVals));
    const bestFinalCurve = results[bestFinalIdx].cumulativeNetByYear;

    for (let j = 0; j < results.length; j++) {
      if (j === bestFinalIdx) continue;
      const otherCurve = results[j].cumulativeNetByYear;
      if (bestFinalCurve[0] > otherCurve[0]) {
        for (let y = 1; y <= years; y++) {
          const d0 = bestFinalCurve[y - 1] - otherCurve[y - 1];
          const d1 = bestFinalCurve[y] - otherCurve[y];
          if (d0 >= 0 && d1 <= 0 && d0 - d1 > 1e-6) {
            const frac = d0 / (d0 - d1);
            const crossYr = y - 1 + frac;
            const crossVal =
              bestFinalCurve[y - 1] +
              frac * (bestFinalCurve[y] - bestFinalCurve[y - 1]);
            if (!parityMarker || crossYr > parityMarker.yr) {
              parityMarker = { yr: crossYr, val: crossVal };
            }
            break;
          }
        }
      }
    }
  }

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
    if (svgX < padLeft - 8 || svgX > width - padRight + 8) {
      setHoverYear(null);
      return;
    }
    const rawYr = ((svgX - padLeft) / plotW) * years;
    const snapped = Math.max(0, Math.min(years, Math.round(rawYr)));
    setHoverYear(snapped);
  };

  const activeYr = hoverYear ?? years;
  const activeX = xForYear(activeYr);
  const activeVals = results.map((r) => r.cumulativeNetByYear[activeYr] ?? 0);
  const activeMinVal = Math.min(...activeVals);

  // Build superposed line badges at the active year (never placed below their own line, nudged upward cleanly if close)
  const badgeH = isCompact ? 26 : 26;
  const minBadgeGap = isCompact ? 29 : 30;
  const minBadgeCy = badgeH / 2 + 3;
  const maxBadgeCy = padTop + plotH - badgeH / 2 - 1;

  const lineBadges = cars
    .map((car, idx) => {
      const res = results[idx];
      if (!res) return null;
      const val = res.cumulativeNetByYear[activeYr] ?? 0;
      const meta = POWERTRAIN_META[car.powertrain];
      const color = isDark ? meta.darkColor : meta.color;
      const label = formatEur(val, 0, t.locale);
      const badgeW = Math.max(58, label.length * (isCompact ? 9.2 : 8.8) + 28);
      const rawY = yForVal(val);
      const badgeX = Math.max(
        padLeft + 4,
        Math.min(width - badgeW - 6, activeX - badgeW / 2)
      );
      return {
        slotId: car.slotId,
        idx,
        color,
        label,
        badgeW,
        badgeX,
        rawY,
        badgeCy: Math.min(maxBadgeCy, Math.max(minBadgeCy, rawY)),
      };
    })
    .filter((b): b is NonNullable<typeof b> => b !== null);

  lineBadges.sort((a, b) =>
    Math.abs(b.rawY - a.rawY) > 0.1 ? b.rawY - a.rawY : a.idx - b.idx
  );
  for (let k = 1; k < lineBadges.length; k++) {
    const lower = lineBadges[k - 1];
    const curr = lineBadges[k];
    if (lower.badgeCy - curr.badgeCy < minBadgeGap) {
      curr.badgeCy = Math.max(minBadgeCy, lower.badgeCy - minBadgeGap);
    }
  }

  return (
    <div className="chart-panel">
      <div className="chart-header">
        <div>
          <h3 className="chart-title">
            {comparisonMode === 'energy'
              ? t.charts.cumulEnergyTitle
              : t.charts.cumulTcoTitle}
          </h3>
          <p className="chart-sub">
            {comparisonMode === 'energy'
              ? t.charts.cumulEnergySub(years)
              : t.charts.cumulTcoSub(years)}
          </p>
        </div>

        <div className="chart-legend" aria-label="Chart legend">
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
        </div>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="tco-chart-svg sensitivity-svg"
        role="img"
        aria-label={
          comparisonMode === 'energy'
            ? t.charts.cumulEnergyTitle
            : t.charts.cumulTcoTitle
        }
        onPointerDown={handlePointerMove}
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setHoverYear(null)}
      >
        {/* Horizontal gridlines + Y labels */}
        {yTicks.map((tick) => {
          const y = yForVal(tick);
          return (
            <g key={tick}>
              <line
                x1={padLeft}
                y1={y}
                x2={width - padRight}
                y2={y}
                stroke="currentColor"
                strokeOpacity="0.1"
                strokeDasharray={tick === 0 ? undefined : '3 4'}
              />
              <text
                x={padLeft - 12}
                y={y + 4.5}
                textAnchor="end"
                className="chart-axis-text"
              >
                {tick === 0
                  ? '€0'
                  : tick >= 1000
                    ? `€${(tick / 1000).toFixed(tick % 1000 === 0 ? 0 : 1)}k`
                    : `€${Math.round(tick)}`}
              </text>
            </g>
          );
        })}

        {/* Vertical year ticks */}
        {Array.from({ length: years + 1 }, (_, y) => y).map((yr) => {
          const x = xForYear(yr);
          const isHovered = hoverYear === yr;
          return (
            <g key={yr}>
              <line
                x1={x}
                y1={padTop}
                x2={x}
                y2={height - padBottom}
                stroke={isHovered ? 'var(--accent)' : 'currentColor'}
                strokeOpacity={isHovered ? 0.65 : 0.08}
                strokeWidth={isHovered ? 1.75 : 1}
              />
              <text
                x={x}
                y={height - 12}
                textAnchor="middle"
                className="chart-axis-text"
                style={
                  isHovered
                    ? { fill: 'var(--text-primary)', fontWeight: 700 }
                    : undefined
                }
              >
                {t.charts.yrTick(yr)}
              </text>
            </g>
          );
        })}

        {/* Parity Crossover Marker */}
        {parityMarker && (
          <g pointerEvents="none">
            <line
              x1={xForYear(parityMarker.yr)}
              y1={padTop}
              x2={xForYear(parityMarker.yr)}
              y2={height - padBottom}
              stroke="var(--text-primary)"
              strokeOpacity="0.45"
              strokeWidth="1.4"
              strokeDasharray="4 3"
            />
            <circle
              cx={xForYear(parityMarker.yr)}
              cy={yForVal(parityMarker.val)}
              r="5"
              fill="var(--bg)"
              stroke="var(--text-primary)"
              strokeWidth="2"
            />
            <rect
              x={Math.min(
                width - padRight - 114,
                Math.max(padLeft, xForYear(parityMarker.yr) - 57)
              )}
              y={4}
              width="114"
              height="22"
              rx="5"
              fill="var(--surface-elevated)"
              stroke="var(--border-strong)"
            />
            <text
              x={
                Math.min(
                  width - padRight - 114,
                  Math.max(padLeft, xForYear(parityMarker.yr) - 57)
                ) + 57
              }
              y={19}
              textAnchor="middle"
              className="sensitivity-break-tag chart-parity-tag"
              fill="var(--text-primary)"
            >
              {t.charts.parityTag(parityMarker.yr.toFixed(1))}
            </text>
          </g>
        )}

        {/* Cost lines & year nodes */}
        {cars.map((car, idx) => {
          const res = results[idx];
          if (!res) return null;
          const meta = POWERTRAIN_META[car.powertrain];
          const color = isDark ? meta.darkColor : meta.color;
          const pts = res.cumulativeNetByYear
            .map(
              (val, yr) => `${xForYear(yr).toFixed(1)},${yForVal(val).toFixed(1)}`
            )
            .join(' ');

          return (
            <g key={car.slotId}>
              <polyline
                fill="none"
                stroke={color}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={idx === 2 ? '7 4' : undefined}
                points={pts}
              />
              {res.cumulativeNetByYear.map((val, yr) => {
                const isActiveNode = activeYr === yr;
                return (
                  <circle
                    key={yr}
                    cx={xForYear(yr)}
                    cy={yForVal(val)}
                    r={isActiveNode ? 5.5 : 3.2}
                    fill={isActiveNode ? color : 'var(--bg)'}
                    stroke={isActiveNode ? 'var(--bg)' : color}
                    strokeWidth="2"
                  />
                );
              })}
            </g>
          );
        })}

        {/* Superposed, de-overlapped value badges directly on the chart lines */}
        <g pointerEvents="none">
          {lineBadges.map((b) => {
            const boxTop = b.badgeCy - badgeH / 2;
            return (
              <g key={`badge-${b.slotId}`}>
                <rect
                  x={b.badgeX}
                  y={boxTop}
                  width={b.badgeW}
                  height={badgeH}
                  rx="6"
                  fill={isDark ? '#141917' : '#ffffff'}
                  fillOpacity="0.97"
                  stroke={b.color}
                  strokeWidth="2"
                />
                <circle
                  cx={b.badgeX + 12}
                  cy={b.badgeCy}
                  r="4.5"
                  fill={b.color}
                />
                <text
                  x={b.badgeX + 21}
                  y={b.badgeCy + 4.8}
                  textAnchor="start"
                  className="chart-line-badge-text"
                  fill="var(--text-primary)"
                >
                  {b.label}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Interactive Year Readout Bar (fixed structural rows prevent height jump on Year 0 hover) */}
      <div className="sensitivity-readout-bar">
        <span className="sensitivity-readout-x tabular-nums">
          {hoverYear !== null
            ? t.charts.hoverYearLabel(activeYr)
            : t.charts.afterYearsLabel(years)}
          :
        </span>
        <div
          className={`sensitivity-readout-vals cols-${cars.length}`}
        >
          {cars.map((car, idx) => {
            const meta = POWERTRAIN_META[car.powertrain];
            const color = isDark ? meta.darkColor : meta.color;
            const val = activeVals[idx] ?? 0;
            const isMin = val <= activeMinVal + 0.5;
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
                {t.studio.carWord} {idx + 1} ({t.powertrains[car.powertrain].shortLabel}):{' '}
                {formatEur(val, 0, t.locale)}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
