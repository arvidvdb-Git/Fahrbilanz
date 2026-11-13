import { useState } from 'react';
import {
  CarSlotConfig,
  EnergyMap2DAnalysis,
  POWERTRAIN_META,
  Point2D,
  formatEur,
} from '../data/cars';
import { Language, TRANSLATIONS } from '../i18n/translations';

interface EnergyMap2DChartProps {
  cars: CarSlotConfig[];
  analysis: EnergyMap2DAnalysis;
  annualKm: number;
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
    [0, -26],
    [0, 26],
    [48, 0],
    [-48, 0],
    [48, -26],
    [-48, -26],
    [48, 26],
    [-48, 26],
    [0, -52],
    [0, 52],
    [92, 0],
    [-92, 0],
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

export function EnergyMap2DChart({
  cars,
  analysis,
  annualKm,
  isDark,
  lang,
}: EnergyMap2DChartProps) {
  const [hoverPt, setHoverPt] = useState<Point2D | null>(null);
  const t = TRANSLATIONS[lang];

  const width = 760;
  const height = 340;
  const padLeft = 68;
  const padRight = 28;
  const padTop = 26;
  const padBottom = 48;

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
    yMin,
    yMax,
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

  const xTicks = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0];
  const yTicks = [0.1, 0.3, 0.5, 0.7, 0.9];

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

  const curClampedX = Math.max(xMin, Math.min(xMax, currentFuelX));
  const curClampedY = Math.max(yMin, Math.min(yMax, currentChargeY));
  const curPx = xForFuel(curClampedX);
  const curPy = yForCharge(curClampedY);

  // Compute collision-free placements for Now box, Zone labels, and active Breaking-Line tags
  const placedBoxes: PlacedBox[] = [
    // Reserve the small bullseye circle itself so no label sits directly over the dot
    { x: curPx - 12, y: curPy - 12, w: 24, h: 24 },
  ];

  const nowText = `${t.charts.nowLabel}: €${currentFuelX.toFixed(2)} · €${currentChargeY.toFixed(2)}`;
  const nowW = Math.max(106, nowText.length * 5.9 + 14);
  const nowH = 19;
  const nowBox =
    findFreeBox(
      [
        { x: curPx + nowW / 2 + 14, y: curPy - 20 },
        { x: curPx - nowW / 2 - 14, y: curPy - 20 },
        { x: curPx + nowW / 2 + 14, y: curPy + 22 },
        { x: curPx - nowW / 2 - 14, y: curPy + 22 },
      ],
      nowW,
      nowH,
      bounds,
      placedBoxes
    ) ?? {
      x: Math.min(bounds.right - nowW, curPx + 12),
      y: Math.max(bounds.top, curPy - 24),
      w: nowW,
      h: nowH,
    };
  placedBoxes.push(nowBox);

  const zoneLabels = zones.map((zone) => {
    if (zone.areaFraction < 0.06) return null;
    const ptShort = t.powertrains[zone.powertrain].shortLabel;
    const labelStr = `${t.charts.bestPrefix}: ${ptShort}`;
    const w = Math.max(92, labelStr.length * 6.0 + 16);
    const h = 21;
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
    const tagStr = `${labelA.slice(0, 3)} = ${labelB.slice(0, 3)}`;
    const w = 68;
    const h = 18;
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
            .map((p) => `${xForFuel(p.x).toFixed(1)},${yForCharge(p.y).toFixed(1)}`)
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

        {/* Non-Overlapping Zone "Best" Cards */}
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
                rx="5"
                fill="var(--bg)"
                fillOpacity="0.92"
                stroke={color}
                strokeWidth="1.3"
              />
              <text
                x={box.x + box.w / 2}
                y={box.y + 13.8}
                textAnchor="middle"
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
                rx="4"
                fill="var(--text-primary)"
              />
              <text
                x={box.x + box.w / 2}
                y={box.y + 12}
                textAnchor="middle"
                className="sensitivity-break-tag"
                fill="var(--bg)"
              >
                {tagStr}
              </text>
            </g>
          );
        })}

        {/* Current (Fuel, Charging) Position Marker + Axis Guides (Locked) */}
        <g pointerEvents="none">
          <line
            x1={curPx}
            y1={curPy}
            x2={curPx}
            y2={height - padBottom}
            stroke="var(--accent)"
            strokeOpacity="0.55"
            strokeWidth="1.4"
            strokeDasharray="3 3"
          />
          <line
            x1={padLeft}
            y1={curPy}
            x2={curPx}
            y2={curPy}
            stroke="var(--accent)"
            strokeOpacity="0.55"
            strokeWidth="1.4"
            strokeDasharray="3 3"
          />
          <circle
            cx={curPx}
            cy={curPy}
            r="9.5"
            fill="var(--accent)"
            fillOpacity="0.22"
          />
          <circle
            cx={curPx}
            cy={curPy}
            r="6.5"
            fill="var(--bg)"
            stroke="var(--accent)"
            strokeWidth="2.5"
          />
          <circle cx={curPx} cy={curPy} r="3" fill="var(--accent)" />

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

      {/* Live Energy Readout Strip at Hovered or Current (Fuel, Charging) Coordinate */}
      <div className="sensitivity-readout-bar">
        <span className="sensitivity-readout-x tabular-nums">
          {hoverPt ? t.charts.atLabel : t.charts.nowLabel} €
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
