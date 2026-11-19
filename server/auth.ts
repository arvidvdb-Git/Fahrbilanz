import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

export interface DealerTenant {
  tenantId: string;
  keyHash: string;
  allowedOrigins: string[];
  rateLimitPerMin: number;
  isSandbox: boolean;
}

export interface EmbedTokenClaims {
  tenantId: string;
  origin: string;
  iat: number;
  exp: number;
}

export interface AuthenticatedContext {
  tenantId: string;
  authMethod: 'api-key' | 'embed-token' | 'open-dev';
  allowedOrigins: string[];
}

declare module 'express-serve-static-core' {
  interface Request {
    dealerAuth?: AuthenticatedContext;
  }
}

const DEFAULT_RATE_LIMIT = Number(
  process.env.FAHRBILANZ_RATE_LIMIT_PER_MIN || '60'
);

const TOKEN_SECRET =
  process.env.FAHRBILANZ_TOKEN_SECRET ||
  crypto.randomBytes(32).toString('hex');

function sha256Hex(raw: string): string {
  return crypto.createHash('sha256').update(raw, 'utf8').digest('hex');
}

function parseDealerRegistry(): Map<string, DealerTenant> {
  const map = new Map<string, DealerTenant>();
  const raw = (process.env.FAHRBILANZ_DEALER_KEYS || '').trim();

  if (raw) {
    // Format: apiKey:tenantId:https://origin1.com,https://origin2.com;apiKey2:tenant2:*
    for (const entry of raw.split(';')) {
      const trimmed = entry.trim();
      if (!trimmed) continue;
      const firstColon = trimmed.indexOf(':');
      const secondColon =
        firstColon >= 0 ? trimmed.indexOf(':', firstColon + 1) : -1;
      if (firstColon <= 0 || secondColon <= firstColon + 1) continue;

      const apiKey = trimmed.slice(0, firstColon).trim();
      const tenantId = trimmed.slice(firstColon + 1, secondColon).trim();
      const originsRaw = trimmed.slice(secondColon + 1).trim();
      const allowedOrigins = originsRaw
        ? originsRaw
            .split(',')
            .map((o) => o.trim().replace(/\/+$/, ''))
            .filter(Boolean)
        : ['*'];

      const keyHash = sha256Hex(apiKey);
      map.set(keyHash, {
        tenantId,
        keyHash,
        allowedOrigins,
        rateLimitPerMin: DEFAULT_RATE_LIMIT,
        isSandbox: false,
      });
    }
  }

  // In non-production mode without explicit keys, register a sandbox key for local testing
  if (map.size === 0 && process.env.NODE_ENV !== 'production') {
    const demoHash = sha256Hex('fbz_demo_dealer_key');
    map.set(demoHash, {
      tenantId: 'demo-dealer',
      keyHash: demoHash,
      allowedOrigins: ['*'],
      rateLimitPerMin: DEFAULT_RATE_LIMIT,
      isSandbox: true,
    });
  }

  return map;
}

const TENANT_REGISTRY = parseDealerRegistry();

export function lookupDealerByApiKey(rawKey: string): DealerTenant | null {
  if (!rawKey) return null;
  const candidateHash = sha256Hex(rawKey.trim());
  for (const [storedHash, tenant] of TENANT_REGISTRY.entries()) {
    const a = Buffer.from(candidateHash, 'hex');
    const b = Buffer.from(storedHash, 'hex');
    if (a.length === b.length && crypto.timingSafeEqual(a, b)) {
      return tenant;
    }
  }
  return null;
}

export function signEmbedToken(
  tenantId: string,
  origin: string,
  ttlSeconds = 900
): { token: string; expiresAt: number } {
  const nowSec = Math.floor(Date.now() / 1000);
  const clampedTtl = Math.max(60, Math.min(3600, ttlSeconds));
  const payload: EmbedTokenClaims = {
    tenantId,
    origin: origin.replace(/\/+$/, ''),
    iat: nowSec,
    exp: nowSec + clampedTtl,
  };
  const bodyB64 = Buffer.from(JSON.stringify(payload), 'utf8').toString(
    'base64url'
  );
  const sigB64 = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(bodyB64)
    .digest('base64url');
  return {
    token: `fbz_tok_${bodyB64}.${sigB64}`,
    expiresAt: payload.exp,
  };
}

export function verifyEmbedToken(rawToken: string): EmbedTokenClaims | null {
  if (!rawToken || !rawToken.startsWith('fbz_tok_')) return null;
  const compact = rawToken.slice('fbz_tok_'.length);
  const dotIdx = compact.indexOf('.');
  if (dotIdx <= 0) return null;

  const bodyB64 = compact.slice(0, dotIdx);
  const sigB64 = compact.slice(dotIdx + 1);
  if (!bodyB64 || !sigB64) return null;

  const expectedSig = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(bodyB64)
    .digest('base64url');

  const sigBuf = Buffer.from(sigB64, 'utf8');
  const expectedBuf = Buffer.from(expectedSig, 'utf8');
  if (
    sigBuf.length !== expectedBuf.length ||
    !crypto.timingSafeEqual(sigBuf, expectedBuf)
  ) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(bodyB64, 'base64url').toString('utf8')
    ) as EmbedTokenClaims;
    const nowSec = Math.floor(Date.now() / 1000);
    if (
      typeof parsed.tenantId !== 'string' ||
      typeof parsed.origin !== 'string' ||
      typeof parsed.exp !== 'number' ||
      parsed.exp < nowSec
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function isOriginAllowed(
  requestOrigin: string | undefined,
  allowedOrigins: string[]
): boolean {
  if (allowedOrigins.includes('*')) return true;
  if (!requestOrigin) return true; // server-to-server call with no browser Origin header
  const clean = requestOrigin.replace(/\/+$/, '').toLowerCase();
  return allowedOrigins.some((o) => o.toLowerCase() === clean);
}

const rateBuckets = new Map<string, number[]>();

export function checkSlidingRateLimit(
  bucketKey: string,
  maxPerMin: number
): { allowed: boolean; remaining: number; resetEpochSec: number } {
  const now = Date.now();
  const windowMs = 60_000;
  const existing = (rateBuckets.get(bucketKey) || []).filter(
    (ts) => now - ts < windowMs
  );

  if (existing.length >= maxPerMin) {
    rateBuckets.set(bucketKey, existing);
    const oldest = existing[0] ?? now;
    return {
      allowed: false,
      remaining: 0,
      resetEpochSec: Math.ceil((oldest + windowMs) / 1000),
    };
  }

  existing.push(now);
  rateBuckets.set(bucketKey, existing);
  return {
    allowed: true,
    remaining: Math.max(0, maxPerMin - existing.length),
    resetEpochSec: Math.ceil((now + windowMs) / 1000),
  };
}

export function applyDealerCorsHeaders(
  req: Request,
  res: Response,
  allowedOrigins: string[]
) {
  const originHeader = req.get('origin');
  if (originHeader && isOriginAllowed(originHeader, allowedOrigins)) {
    res.setHeader('Access-Control-Allow-Origin', originHeader);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-API-Key'
  );
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
}

export function requireDealerAuth(options?: { allowEmbedToken?: boolean }) {
  const allowEmbed = options?.allowEmbedToken !== false;
  const requireKey = process.env.FAHRBILANZ_REQUIRE_API_KEY !== 'false';

  return (req: Request, res: Response, next: NextFunction) => {
    const requestOrigin = req.get('origin');
    const referer = req.get('referer');
    let effectiveOrigin = requestOrigin;
    if (!effectiveOrigin && referer) {
      try {
        effectiveOrigin = new URL(referer).origin;
      } catch {
        effectiveOrigin = undefined;
      }
    }

    const apiKeyHeader = req.get('x-api-key');
    const authHeader = req.get('authorization');
    const bearerToken =
      authHeader && authHeader.toLowerCase().startsWith('bearer ')
        ? authHeader.slice(7).trim()
        : '';

    let tenant: DealerTenant | null = null;
    let authMethod: AuthenticatedContext['authMethod'] | null = null;
    let allowedOrigins: string[] = [];

    if (apiKeyHeader) {
      tenant = lookupDealerByApiKey(apiKeyHeader);
      if (tenant) {
        authMethod = 'api-key';
        allowedOrigins = tenant.allowedOrigins;
      }
    } else if (allowEmbed && bearerToken) {
      const claims = verifyEmbedToken(bearerToken);
      if (claims) {
        authMethod = 'embed-token';
        allowedOrigins = [claims.origin];
        tenant = {
          tenantId: claims.tenantId,
          keyHash: '',
          allowedOrigins,
          rateLimitPerMin: DEFAULT_RATE_LIMIT,
          isSandbox: false,
        };
      }
    }

    if (!tenant || !authMethod) {
      if (!requireKey && process.env.NODE_ENV !== 'production') {
        authMethod = 'open-dev';
        allowedOrigins = ['*'];
        tenant = {
          tenantId: 'dev-unauthenticated',
          keyHash: '',
          allowedOrigins,
          rateLimitPerMin: DEFAULT_RATE_LIMIT,
          isSandbox: true,
        };
      } else {
        res.status(401).json({
          error: 'unauthorized',
          message:
            'Valid X-API-Key header or short-lived Bearer embed token required.',
        });
        return;
      }
    }

    if (!isOriginAllowed(effectiveOrigin, allowedOrigins)) {
      res.status(403).json({
        error: 'forbidden_origin',
        message: `Origin ${effectiveOrigin ?? '(unknown)'} is not allowlisted for tenant ${tenant.tenantId}.`,
      });
      return;
    }

    applyDealerCorsHeaders(req, res, allowedOrigins);

    const rateKey = `${tenant.tenantId}:${req.ip || 'unknown'}`;
    const rate = checkSlidingRateLimit(rateKey, tenant.rateLimitPerMin);
    res.setHeader('X-RateLimit-Limit', String(tenant.rateLimitPerMin));
    res.setHeader('X-RateLimit-Remaining', String(rate.remaining));
    res.setHeader('X-RateLimit-Reset', String(rate.resetEpochSec));

    if (!rate.allowed) {
      res.status(429).json({
        error: 'rate_limit_exceeded',
        message: 'Too many API requests. Please retry after reset window.',
        resetEpochSec: rate.resetEpochSec,
      });
      return;
    }

    req.dealerAuth = {
      tenantId: tenant.tenantId,
      authMethod,
      allowedOrigins,
    };
    next();
  };
}

export function getAuthConfigurationSummary() {
  return {
    requireApiKey: process.env.FAHRBILANZ_REQUIRE_API_KEY !== 'false',
    registeredTenantsCount: TENANT_REGISTRY.size,
    hasSandboxFallback: Array.from(TENANT_REGISTRY.values()).some(
      (t) => t.isSandbox
    ),
    rateLimitPerMin: DEFAULT_RATE_LIMIT,
  };
}
