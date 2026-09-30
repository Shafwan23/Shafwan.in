/* HTTP plumbing: JSON responses, CORS, request bodies and typed API errors. */

const MAX_BODY_BYTES = 16 * 1024;

export class ApiError extends Error {
  /**
   * @param {number} status HTTP status
   * @param {string} code machine-readable reason
   * @param {string} message shown to the visitor
   */
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

/** @param {{ ALLOWED_ORIGINS?: string }} env */
export function allowedOrigins(env) {
  return (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
}

/** Echoes the Origin back only when it is on the allow-list. */
export function corsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  if (!allowedOrigins(env).includes(origin)) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

export function json(data, { status = 200, headers = {}, cache = 'no-store' } = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': cache,
      'X-Content-Type-Options': 'nosniff',
      ...headers,
    },
  });
}

/** Writes are only accepted from the site itself (a cheap CSRF guard on top of CORS). */
export function requireSiteOrigin(request, env) {
  const origin = request.headers.get('Origin') || '';
  if (!allowedOrigins(env).includes(origin)) {
    throw new ApiError(403, 'origin', 'Requests are only accepted from shafwan.in.');
  }
}

/** Parses a small JSON object body, rejecting anything oversized or malformed. */
export async function readJson(request) {
  const declared = Number(request.headers.get('Content-Length') || 0);
  if (declared > MAX_BODY_BYTES) throw new ApiError(413, 'too_large', 'That request is too large.');
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) throw new ApiError(413, 'too_large', 'That request is too large.');
  let body;
  try {
    body = JSON.parse(text || '{}');
  } catch {
    throw new ApiError(400, 'bad_json', 'The request body is not valid JSON.');
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ApiError(400, 'bad_body', 'The request body must be a JSON object.');
  }
  return body;
}

/** The visitor's IP as Cloudflare sees it. */
export function clientIp(request) {
  return request.headers.get('CF-Connecting-IP') || '0.0.0.0';
}
