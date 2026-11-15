// Interactive 3D Rotating Aerodynamic Vehicle Wireframe Cross-Section
export function initSpecsCanvas(canvas: HTMLCanvasElement | null): () => void {
  if (!canvas) return () => {};
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};

  const prefersReduced = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;
  let angle = 0.42;
  const targetSpeed = 0.0055;
  let hoverBoost = 0;
  let rafId = 0;

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.floor(canvas.clientWidth * dpr);
    const h = Math.floor(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
  };

  const onEnter = () => {
    hoverBoost = 0.014;
  };
  const onLeave = () => {
    hoverBoost = 0;
  };

  const parent = canvas.parentElement;
  parent?.addEventListener('pointerenter', onEnter);
  parent?.addEventListener('pointerleave', onLeave);
  window.addEventListener('resize', resize, { passive: true });
  resize();

  // Longitudinal vehicle profile stations (x from -1 front to +1 rear, y bottom, yRoof, halfWidth)
  const stations = [
    { x: -0.98, yBot: 0.14, yTop: 0.02, halfW: 0.34 },
    { x: -0.82, yBot: 0.18, yTop: -0.14, halfW: 0.42 },
    { x: -0.52, yBot: 0.18, yTop: -0.22, halfW: 0.45 },
    { x: -0.18, yBot: 0.18, yTop: -0.46, halfW: 0.44 },
    { x: 0.22, yBot: 0.18, yTop: -0.46, halfW: 0.44 },
    { x: 0.58, yBot: 0.18, yTop: -0.32, halfW: 0.45 },
    { x: 0.86, yBot: 0.16, yTop: -0.16, halfW: 0.42 },
    { x: 0.98, yBot: 0.12, yTop: -0.02, halfW: 0.35 },
  ];

  const project = (
    x: number,
    y: number,
    z: number,
    cx: number,
    cy: number,
    scale: number,
    yaw: number
  ) => {
    const pitch = 0.24;
    const cosY = Math.cos(yaw);
    const sinY = Math.sin(yaw);
    const x1 = x * cosY - z * sinY;
    const z1 = x * sinY + z * cosY;

    const cosP = Math.cos(pitch);
    const sinP = Math.sin(pitch);
    const y2 = y * cosP - z1 * sinP;
    const z2 = y * sinP + z1 * cosP;

    const persp = 3.2 / (3.2 + z2 * 0.55);
    return {
      px: cx + x1 * scale * persp,
      py: cy + y2 * scale * persp,
    };
  };

  const draw = () => {
    resize();
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const isDark =
      document.documentElement.getAttribute('data-theme') !== 'light';
    const strokeMain = isDark
      ? 'rgba(239, 243, 241, 0.24)'
      : 'rgba(17, 22, 20, 0.2)';
    const strokeAccent = isDark
      ? 'rgba(110, 154, 116, 0.82)'
      : 'rgba(61, 87, 64, 0.78)';

    const cx = w * 0.5;
    const cy = h * 0.4;
    const scale = Math.min(w * 0.42, h * 0.56);

    if (!prefersReduced) {
      angle += targetSpeed + hoverBoost;
    }

    ctx.lineWidth = Math.max(1.1, w / 460);

    // Draw longitudinal ribs (left, center ridge, right)
    const ribs = [-1, -0.5, 0, 0.5, 1];
    ribs.forEach((ribFactor) => {
      const isCenter = ribFactor === 0;
      ctx.beginPath();
      ctx.strokeStyle = isCenter ? strokeAccent : strokeMain;

      stations.forEach((st, idx) => {
        const z = st.halfW * ribFactor;
        const archDrop = Math.abs(ribFactor) * 0.08;
        const p = project(
          st.x,
          st.yTop + archDrop,
          z,
          cx,
          cy,
          scale,
          angle
        );
        if (idx === 0) ctx.moveTo(p.px, p.py);
        else ctx.lineTo(p.px, p.py);
      });
      ctx.stroke();

      // Floor / battery skateboard perimeter rib
      if (Math.abs(ribFactor) === 1) {
        ctx.beginPath();
        ctx.strokeStyle = strokeAccent;
        stations.forEach((st, idx) => {
          const p = project(
            st.x,
            st.yBot,
            st.halfW * ribFactor,
            cx,
            cy,
            scale,
            angle
          );
          if (idx === 0) ctx.moveTo(p.px, p.py);
          else ctx.lineTo(p.px, p.py);
        });
        ctx.stroke();
      }
    });

    // Draw transverse cross-section frames
    stations.forEach((st, idx) => {
      ctx.beginPath();
      ctx.strokeStyle = idx === 3 || idx === 4 ? strokeAccent : strokeMain;
      const pts = [
        project(st.x, st.yBot, -st.halfW, cx, cy, scale, angle),
        project(st.x, st.yTop + 0.08, -st.halfW * 0.85, cx, cy, scale, angle),
        project(st.x, st.yTop, 0, cx, cy, scale, angle),
        project(st.x, st.yTop + 0.08, st.halfW * 0.85, cx, cy, scale, angle),
        project(st.x, st.yBot, st.halfW, cx, cy, scale, angle),
        project(st.x, st.yBot, -st.halfW, cx, cy, scale, angle),
      ];
      pts.forEach((p, pIdx) => {
        if (pIdx === 0) ctx.moveTo(p.px, p.py);
        else ctx.lineTo(p.px, p.py);
      });
      ctx.stroke();
    });

    // Draw 4 wheel ellipses at axle stations
    const axles = [-0.56, 0.56];
    const sides = [-0.44, 0.44];
    axles.forEach((ax) => {
      sides.forEach((sz) => {
        ctx.beginPath();
        ctx.strokeStyle = strokeAccent;
        const steps = 16;
        for (let s = 0; s <= steps; s++) {
          const theta = (s / steps) * Math.PI * 2;
          const wx = ax + Math.cos(theta) * 0.14;
          const wy = 0.2 + Math.sin(theta) * 0.14;
          const p = project(wx, wy, sz, cx, cy, scale, angle);
          if (s === 0) ctx.moveTo(p.px, p.py);
          else ctx.lineTo(p.px, p.py);
        }
        ctx.stroke();
      });
    });

    if (!prefersReduced) {
      rafId = requestAnimationFrame(draw);
    }
  };

  rafId = requestAnimationFrame(draw);

  return () => {
    cancelAnimationFrame(rafId);
    parent?.removeEventListener('pointerenter', onEnter);
    parent?.removeEventListener('pointerleave', onLeave);
    window.removeEventListener('resize', resize);
  };
}
