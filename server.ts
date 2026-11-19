import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import type { Request, Response } from 'express';
import {
  applyDealerCorsHeaders,
  getAuthConfigurationSummary,
  isOriginAllowed,
  lookupDealerByApiKey,
  requireDealerAuth,
  signEmbedToken,
} from './server/auth.ts';
import { getCachedServerFuelFeed } from './server/fuelService.ts';
import {
  CAR_PRESETS,
  POWERTRAIN_META,
  calculateTco,
  computeEnergyMap2D,
  computeSensitivity,
  createSlotFromPreset,
  getBlendedElectricityPrice,
} from './src/data/cars.ts';
import type {
  BodyClassId,
  CarSlotConfig,
  GlobalAssumptions,
  PowertrainId,
  SensitivityMode,
} from './src/data/cars.ts';
import {
  PROGRAMMATIC_PRESET_ORDER,
  SEO_PRESETS,
  SUPPORTED_LANGS,
  buildHreflangLinks,
  resolveSeoRoute,
} from './src/data/seoRoutes.ts';
import type { SupportedLang } from './src/data/seoRoutes.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProduction = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

const VALID_POWERTRAINS = new Set<PowertrainId>([
  'gasoline',
  'diesel',
  'hybrid',
  'electric',
]);
const VALID_BODIES = new Set<BodyClassId>(['compact', 'sedan', 'suv']);

const OG_LOCALE_MAP: Record<SupportedLang, string> = {
  en: 'en_IE',
  de: 'de_DE',
  nl: 'nl_NL',
  fr: 'fr_FR',
};

function clampNum(val: unknown, min: number, max: number, fallback: number): number {
  if (typeof val !== 'number' || !Number.isFinite(val)) return fallback;
  return Math.max(min, Math.min(max, val));
}

function sanitizeAssumptions(raw: unknown): GlobalAssumptions {
  const input = (raw && typeof raw === 'object' ? raw : {}) as Record<
    string,
    unknown
  >;
  const yearsRaw = clampNum(input.years, 1, 15, 1);
  return {
    comparisonMode: input.comparisonMode === 'tco' ? 'tco' : 'energy',
    annualKm: clampNum(input.annualKm, 1000, 120000, 15000),
    years: Math.round(yearsRaw),
    gasolinePrice: clampNum(input.gasolinePrice, 0.2, 5, 1.75),
    dieselPrice: clampNum(input.dieselPrice, 0.2, 5, 1.68),
    homeAcPrice: clampNum(input.homeAcPrice, 0.01, 2.5, 0.3),
    publicAcPrice: clampNum(input.publicAcPrice, 0.01, 2.5, 0.49),
    publicDcPrice: clampNum(input.publicDcPrice, 0.01, 3.0, 0.69),
    homeAcShare: clampNum(input.homeAcShare, 0, 100, 70),
    publicAcShare: clampNum(input.publicAcShare, 0, 100, 20),
    publicDcShare: clampNum(input.publicDcShare, 0, 100, 10),
    monthlyChargingFee: clampNum(input.monthlyChargingFee, 0, 200, 5),
    wallboxCost: clampNum(input.wallboxCost, 0, 10000, 1200),
    rentWallboxElectric:
      typeof input.rentWallboxElectric === 'boolean'
        ? input.rentWallboxElectric
        : true,
    rentWallboxHybrid:
      typeof input.rentWallboxHybrid === 'boolean'
        ? input.rentWallboxHybrid
        : false,
    buyWallboxElectric:
      typeof input.buyWallboxElectric === 'boolean'
        ? input.buyWallboxElectric
        : true,
    buyWallboxHybrid:
      typeof input.buyWallboxHybrid === 'boolean'
        ? input.buyWallboxHybrid
        : false,
  };
}

function sanitizeSlots(
  rawCars: unknown,
  years: number
): CarSlotConfig[] | null {
  if (!Array.isArray(rawCars) || rawCars.length === 0 || rawCars.length > 3) {
    return null;
  }

  return rawCars.map((raw, idx) => {
    const item = (raw && typeof raw === 'object' ? raw : {}) as Record<
      string,
      unknown
    >;
    const powertrain: PowertrainId =
      typeof item.powertrain === 'string' &&
      VALID_POWERTRAINS.has(item.powertrain as PowertrainId)
        ? (item.powertrain as PowertrainId)
        : idx === 0
          ? 'gasoline'
          : 'electric';
    const bodyClass: BodyClassId =
      typeof item.bodyClass === 'string' &&
      VALID_BODIES.has(item.bodyClass as BodyClassId)
        ? (item.bodyClass as BodyClassId)
        : 'sedan';

    const base = createSlotFromPreset(
      typeof item.slotId === 'string' && item.slotId.trim()
        ? item.slotId.trim().slice(0, 40)
        : `slot-${idx + 1}`,
      powertrain,
      bodyClass,
      years
    );

    return {
      ...base,
      purchasePrice: clampNum(item.purchasePrice, 1000, 350000, base.purchasePrice),
      subsidyEnabled:
        typeof item.subsidyEnabled === 'boolean'
          ? item.subsidyEnabled
          : base.subsidyEnabled,
      subsidyAmount: clampNum(item.subsidyAmount, 0, 30000, base.subsidyAmount),
      consumption: clampNum(item.consumption, 0.5, 50, base.consumption),
      hybridWeightedFuel: clampNum(
        item.hybridWeightedFuel,
        0,
        25,
        base.hybridWeightedFuel
      ),
      hybridDepletedFuel: clampNum(
        item.hybridDepletedFuel,
        1,
        25,
        base.hybridDepletedFuel
      ),
      hybridElectricRangeKm: clampNum(
        item.hybridElectricRangeKm,
        5,
        300,
        base.hybridElectricRangeKm
      ),
      hybridBatteryKwh: clampNum(
        item.hybridBatteryKwh,
        1,
        80,
        base.hybridBatteryKwh
      ),
      hybridTripProfile:
        item.hybridTripProfile === 'long' ? 'long' : 'short',
      annualService: clampNum(item.annualService, 0, 10000, base.annualService),
      annualTax: clampNum(item.annualTax, 0, 10000, base.annualTax),
      annualInsurance: clampNum(
        item.annualInsurance,
        0,
        15000,
        base.annualInsurance
      ),
      resalePct: clampNum(item.resalePct, 5, 95, base.resalePct),
    };
  });
}

function resolvePublicOrigin(req: Request): string {
  const configured = (process.env.APP_URL || '').trim().replace(/\/+$/, '');
  if (configured) return configured;
  const protoHeader = req.get('x-forwarded-proto');
  const protocol = protoHeader ? protoHeader.split(',')[0].trim() : req.protocol;
  const host = req.get('x-forwarded-host') || req.get('host') || `localhost:${PORT}`;
  return `${protocol}://${host}`.replace(/\/+$/, '');
}

function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function injectSeoMeta(
  html: string,
  reqPath: string,
  origin: string
): string {
  const resolved = resolveSeoRoute(reqPath);
  const preset = SEO_PRESETS[resolved.presetId];
  const copy = preset.meta[resolved.lang];
  const canonicalUrl =
    resolved.canonicalPath === '/'
      ? `${origin}/`
      : `${origin}${resolved.canonicalPath}`;
  const hreflangs = buildHreflangLinks(origin, resolved.presetId);
  const hreflangTags = hreflangs
    .map(
      (link) =>
        `<link rel="alternate" hreflang="${escapeHtmlAttr(link.hreflang)}" href="${escapeHtmlAttr(link.href)}" />`
    )
    .join('\n    ');

  const ogImg = `${origin}/og-image.png`;
  const titleEsc = escapeHtmlAttr(copy.title);
  const descEsc = escapeHtmlAttr(copy.description);
  const urlEsc = escapeHtmlAttr(canonicalUrl);
  const ogImgEsc = escapeHtmlAttr(ogImg);

  let out = html.replace(
    /<html lang="[^"]*"/i,
    `<html lang="${resolved.lang}"`
  );
  out = out.replace(/<title>[\s\S]*?<\/title>/i, `<title>${titleEsc}</title>`);
  out = out.replace(
    /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="description" content="${descEsc}" />`
  );
  out = out.replace(
    /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i,
    `<link rel="canonical" href="${urlEsc}" />\n    ${hreflangTags}`
  );
  out = out.replace(
    /<meta property="og:url" content="[^"]*"\s*\/?>/i,
    `<meta property="og:url" content="${urlEsc}" />`
  );
  out = out.replace(
    /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:title" content="${titleEsc}" />`
  );
  out = out.replace(
    /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:description" content="${descEsc}" />`
  );
  out = out.replace(
    /<meta\s+property="og:image"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:image" content="${ogImgEsc}" />`
  );
  out = out.replace(
    /<meta property="og:locale" content="[^"]*"\s*\/?>/i,
    `<meta property="og:locale" content="${OG_LOCALE_MAP[resolved.lang]}" />`
  );
  out = out.replace(
    /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:title" content="${titleEsc}" />`
  );
  out = out.replace(
    /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:description" content="${descEsc}" />`
  );
  out = out.replace(
    /<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:image" content="${ogImgEsc}" />`
  );

  return out;
}

async function startServer() {
  const app = express();
  app.set('trust proxy', true);
  app.use(express.json({ limit: '120kb' }));

  // Handle CORS preflight for B2B API consumers (Express 5 compatible)
  app.use('/api/v1', (req: Request, res: Response, next) => {
    if (req.method === 'OPTIONS') {
      const reqOrigin = req.get('origin') || '*';
      applyDealerCorsHeaders(req, res, [reqOrigin]);
      res.status(204).end();
      return;
    }
    next();
  });

  // Public health endpoint
  app.get('/api/v1/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'fahrbilanz-b2b-api',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      auth: getAuthConfigurationSummary(),
    });
  });

  // Developer & dealer API reference schema
  app.get('/api/v1/docs', (req: Request, res: Response) => {
    const origin = resolvePublicOrigin(req);
    res.json({
      service: 'Fahrbilanz Vehicle Energy & TCO Calculation API',
      version: '1.0.0',
      authentication: {
        serverToServer: 'Pass header X-API-Key: <dealer_api_key>',
        browserEmbedFlow:
          'Call POST /api/v1/tokens/issue from your dealer backend with X-API-Key to obtain a short-lived HMAC Bearer token bound to your allowed origin.',
      },
      endpoints: [
        { method: 'GET', path: '/api/v1/health', auth: 'public' },
        { method: 'GET', path: '/api/v1/fuel-prices', auth: 'public' },
        { method: 'GET', path: '/api/v1/presets', auth: 'X-API-Key | Bearer' },
        {
          method: 'POST',
          path: '/api/v1/tokens/issue',
          auth: 'X-API-Key (server-only)',
          body: { origin: 'https://your-dealer-domain.com', ttlSeconds: 900 },
        },
        {
          method: 'POST',
          path: '/api/v1/calculate',
          auth: 'X-API-Key | Bearer',
          body: {
            assumptions: { comparisonMode: 'tco', years: 3, annualKm: 15000 },
            cars: [
              { powertrain: 'gasoline', bodyClass: 'sedan' },
              { powertrain: 'electric', bodyClass: 'sedan' },
            ],
          },
        },
        {
          method: 'POST',
          path: '/api/v1/sensitivity',
          auth: 'X-API-Key | Bearer',
          body: {
            mode: 'fuel',
            assumptions: { comparisonMode: 'energy', years: 1 },
            cars: [
              { powertrain: 'gasoline', bodyClass: 'sedan' },
              { powertrain: 'electric', bodyClass: 'sedan' },
            ],
          },
        },
        {
          method: 'POST',
          path: '/api/v1/energy-map',
          auth: 'X-API-Key | Bearer',
        },
      ],
      sampleCurl: `curl -X POST ${origin}/api/v1/calculate -H "Content-Type: application/json" -H "X-API-Key: <your-key>" -d '{"assumptions":{"comparisonMode":"tco","years":1},"cars":[{"powertrain":"gasoline","bodyClass":"sedan"},{"powertrain":"electric","bodyClass":"sedan"}]}'`,
    });
  });

  // Live European fuel price proxy with server-side caching
  app.get('/api/v1/fuel-prices', async (req: Request, res: Response) => {
    const feed = await getCachedServerFuelFeed();
    if (!feed) {
      res.status(503).json({
        error: 'upstream_unavailable',
        message: 'European fuel feed temporarily unavailable.',
      });
      return;
    }

    const countryQuery =
      typeof req.query.country === 'string'
        ? req.query.country.trim().toUpperCase()
        : '';
    if (countryQuery) {
      const country = feed.countries.find(
        (c) => c.countryCode === countryQuery
      );
      if (!country) {
        res.status(404).json({
          error: 'country_not_found',
          countryCode: countryQuery,
          euAverage: feed.euAverage,
        });
        return;
      }
      res.json({
        bulletinDate: feed.bulletinDate,
        dataSource: feed.dataSource,
        country,
        euAverage: feed.euAverage,
        cachedAtIso: feed.cachedAtIso,
      });
      return;
    }

    res.json(feed);
  });

  // Exchange master dealer API key (backend-only) for short-lived browser embed Bearer token
  app.post('/api/v1/tokens/issue', (req: Request, res: Response) => {
    const rawKey = req.get('x-api-key') || '';
    const tenant = lookupDealerByApiKey(rawKey);
    if (!tenant) {
      res.status(401).json({
        error: 'unauthorized',
        message: 'Valid master X-API-Key required to issue embed tokens.',
      });
      return;
    }

    const body = (req.body && typeof req.body === 'object' ? req.body : {}) as {
      origin?: unknown;
      ttlSeconds?: unknown;
    };
    const targetOrigin =
      typeof body.origin === 'string' && body.origin.trim()
        ? body.origin.trim().replace(/\/+$/, '')
        : tenant.allowedOrigins[0] || '*';

    if (
      targetOrigin !== '*' &&
      !isOriginAllowed(targetOrigin, tenant.allowedOrigins)
    ) {
      res.status(403).json({
        error: 'origin_not_allowed',
        message: `Origin ${targetOrigin} is not permitted for tenant ${tenant.tenantId}.`,
      });
      return;
    }

    const ttlSeconds =
      typeof body.ttlSeconds === 'number' ? body.ttlSeconds : 900;
    const issued = signEmbedToken(tenant.tenantId, targetOrigin, ttlSeconds);
    res.json({
      tenantId: tenant.tenantId,
      tokenType: 'Bearer',
      token: issued.token,
      expiresAtEpochSec: issued.expiresAt,
      boundOrigin: targetOrigin,
    });
  });

  // Vehicle preset catalog
  app.get('/api/v1/presets', requireDealerAuth(), (_req: Request, res: Response) => {
    res.json({
      powertrains: POWERTRAIN_META,
      presets: CAR_PRESETS,
    });
  });

  // Core server-side calculation endpoint
  app.post(
    '/api/v1/calculate',
    requireDealerAuth(),
    (req: Request, res: Response) => {
      const body = (req.body && typeof req.body === 'object' ? req.body : {}) as {
        assumptions?: unknown;
        cars?: unknown;
      };
      const assumptions = sanitizeAssumptions(body.assumptions);
      const cars = sanitizeSlots(body.cars, assumptions.years);
      if (!cars) {
        res.status(400).json({
          error: 'invalid_cars',
          message: 'Provide a cars array with 1 to 3 valid vehicle entries.',
        });
        return;
      }

      const results = cars.map((car) => ({
        slotId: car.slotId,
        powertrain: car.powertrain,
        bodyClass: car.bodyClass,
        input: car,
        metrics: calculateTco(car, assumptions),
      }));

      const sorted = results
        .map((r, idx) => ({ idx, val: r.metrics.activeTotal }))
        .sort((a, b) => a.val - b.val);
      const winnerIndex = sorted[0]?.idx ?? 0;
      const runnerUpIndex = sorted[1]?.idx ?? winnerIndex;
      const worstIndex = sorted[sorted.length - 1]?.idx ?? winnerIndex;

      res.json({
        tenantId: req.dealerAuth?.tenantId,
        calculatedAt: new Date().toISOString(),
        blendedElectricityPrice: getBlendedElectricityPrice(assumptions),
        assumptions,
        winnerIndex,
        savingsVsRunnerUp:
          results.length > 1
            ? results[runnerUpIndex].metrics.activeTotal -
              results[winnerIndex].metrics.activeTotal
            : 0,
        savingsVsHighest:
          results.length > 1
            ? results[worstIndex].metrics.activeTotal -
              results[winnerIndex].metrics.activeTotal
            : 0,
        results,
      });
    }
  );

  // 1D break-even sensitivity analysis endpoint
  app.post(
    '/api/v1/sensitivity',
    requireDealerAuth(),
    (req: Request, res: Response) => {
      const body = (req.body && typeof req.body === 'object' ? req.body : {}) as {
        assumptions?: unknown;
        cars?: unknown;
        mode?: unknown;
        focusXs?: unknown;
      };
      const assumptions = sanitizeAssumptions(body.assumptions);
      const cars = sanitizeSlots(body.cars, assumptions.years);
      if (!cars || cars.length < 2) {
        res.status(400).json({
          error: 'invalid_cars',
          message:
            'Provide 2 or 3 vehicle entries to compute sensitivity curves.',
        });
        return;
      }
      const mode: SensitivityMode =
        body.mode === 'blendedElec' ? 'blendedElec' : 'fuel';
      const focusXs = Array.isArray(body.focusXs)
        ? body.focusXs.filter(
            (n): n is number => typeof n === 'number' && Number.isFinite(n)
          )
        : undefined;

      const analysis = computeSensitivity(cars, assumptions, mode, { focusXs });
      res.json({
        tenantId: req.dealerAuth?.tenantId,
        mode: analysis.mode,
        xMin: analysis.xMin,
        xMax: analysis.xMax,
        xTicks: analysis.xTicks,
        currentX: analysis.currentX,
        unitLabel: analysis.unitLabel,
        hasVariableSlope: analysis.hasVariableSlope,
        dieselTracksSpread: analysis.dieselTracksSpread,
        lines: analysis.lines.map((l) => ({
          slotId: l.slotId,
          carIndex: l.carIndex,
          powertrain: l.powertrain,
          intercept: l.intercept,
          slope: l.slope,
          yAtMin: l.evalAt(analysis.xMin),
          yAtMax: l.evalAt(analysis.xMax),
        })),
        regimes: analysis.regimes,
        switches: analysis.switches,
        pairwise: analysis.pairwise,
      });
    }
  );

  // 2D Energy Winning Zone polygon map endpoint
  app.post(
    '/api/v1/energy-map',
    requireDealerAuth(),
    (req: Request, res: Response) => {
      const body = (req.body && typeof req.body === 'object' ? req.body : {}) as {
        assumptions?: unknown;
        cars?: unknown;
        focusXs?: unknown;
        focusChargeYs?: unknown;
      };
      const assumptions = sanitizeAssumptions(body.assumptions);
      const cars = sanitizeSlots(body.cars, assumptions.years);
      if (!cars || cars.length < 2) {
        res.status(400).json({
          error: 'invalid_cars',
          message: 'Provide 2 or 3 vehicle entries to compute 2D winning zones.',
        });
        return;
      }
      const focusXs = Array.isArray(body.focusXs)
        ? body.focusXs.filter(
            (n): n is number => typeof n === 'number' && Number.isFinite(n)
          )
        : undefined;
      const focusChargeYs = Array.isArray(body.focusChargeYs)
        ? body.focusChargeYs.filter(
            (n): n is number => typeof n === 'number' && Number.isFinite(n)
          )
        : undefined;

      const map = computeEnergyMap2D(cars, assumptions, {
        focusXs,
        focusChargeYs,
      });
      res.json({
        tenantId: req.dealerAuth?.tenantId,
        xMin: map.xMin,
        xMax: map.xMax,
        xTicks: map.xTicks,
        yMin: map.yMin,
        yMax: map.yMax,
        yTicks: map.yTicks,
        currentFuelX: map.currentFuelX,
        currentChargeY: map.currentChargeY,
        dieselTracksSpread: map.dieselTracksSpread,
        zones: map.zones,
        breakingLines: map.breakingLines,
      });
    }
  );

  // Dynamic localized XML sitemap covering /, /en|de|nl|fr/, and programmatic comparison landing pages
  app.get('/sitemap.xml', (req: Request, res: Response) => {
    const origin = resolvePublicOrigin(req);
    const today = new Date().toISOString().slice(0, 10);
    const allPresetIds = ['home', ...PROGRAMMATIC_PRESET_ORDER] as const;
    const urlEntries: string[] = [];

    for (const presetId of allPresetIds) {
      const preset = SEO_PRESETS[presetId];
      const priority = presetId === 'home' ? '1.0' : '0.85';
      const alternates = SUPPORTED_LANGS.map(
        (l) =>
          `    <xhtml:link rel="alternate" hreflang="${l}" href="${escapeHtmlAttr(origin + preset.paths[l])}" />`
      );
      alternates.push(
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeHtmlAttr(origin + preset.paths.en)}" />`
      );

      for (const lang of SUPPORTED_LANGS) {
        urlEntries.push(
          `  <url>\n    <loc>${escapeHtmlAttr(origin + preset.paths[lang])}</loc>\n${alternates.join('\n')}\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${priority}</priority>\n  </url>`
        );
      }
    }

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.send(
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urlEntries.join('\n')}\n</urlset>\n`
    );
  });

  app.get('/robots.txt', (req: Request, res: Response) => {
    const origin = resolvePublicOrigin(req);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(
      [
        'User-agent: *',
        'Allow: /',
        'Disallow: /api/',
        '',
        'User-agent: Googlebot',
        'Allow: /',
        '',
        'User-agent: Bingbot',
        'Allow: /',
        '',
        'User-agent: OAI-SearchBot',
        'Allow: /',
        '',
        'User-agent: PerplexityBot',
        'Allow: /',
        '',
        `Sitemap: ${origin}/sitemap.xml`,
      ].join('\n')
    );
  });

  const distDir = path.resolve(__dirname, 'dist');
  const distHtmlPath = path.resolve(distDir, 'index.html');
  const useStaticProd =
    isProduction || process.env.npm_lifecycle_event === 'start';

  if (!useStaticProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);

    app.get(/.*/, async (req: Request, res: Response, next) => {
      if (
        req.path.startsWith('/api/') ||
        req.path === '/sitemap.xml' ||
        req.path === '/robots.txt'
      ) {
        next();
        return;
      }
      try {
        const indexPath = path.resolve(__dirname, 'index.html');
        const template = await fs.readFile(indexPath, 'utf-8');
        const transformed = await vite.transformIndexHtml(
          req.originalUrl,
          template
        );
        const origin = resolvePublicOrigin(req);
        const html = injectSeoMeta(transformed, req.path, origin);
        res.status(200).set({ 'Content-Type': 'text/html; charset=utf-8' }).end(html);
      } catch (err) {
        vite.ssrFixStacktrace(err as Error);
        next(err);
      }
    });
  } else {
    app.use(express.static(distDir, { index: false }));

    app.get(/.*/, async (req: Request, res: Response, next) => {
      if (req.path.startsWith('/api/')) {
        next();
        return;
      }
      try {
        const template = await fs.readFile(distHtmlPath, 'utf-8');
        const origin = resolvePublicOrigin(req);
        const html = injectSeoMeta(template, req.path, origin);
        res.status(200).set({ 'Content-Type': 'text/html; charset=utf-8' }).end(html);
      } catch (err) {
        next(err);
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Fahrbilanz server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start Fahrbilanz server:', err);
  process.exit(1);
});
