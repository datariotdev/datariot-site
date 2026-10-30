import { OrvelisError, normalizeRequest, buildCompletion, parseCompletion } from '../server/orvelis-core.mjs';

// Inject dependencies for tests without paid API calls.
export function createHandler({ env = process.env, fetcher = fetch } = {}) {
  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Vary', 'Origin');
    const origin = req.headers.origin;
    const origins = (env.ORVELIS_ALLOWED_ORIGINS || 'https://datariot.xyz').split(',').map(s => s.trim());
    const send = (status, body) => res.status(status).json(body);
    if (origin && !origins.includes(origin)) return send(403, { error: 'ORIGIN_DENIED' });
    if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'POST') { res.setHeader('Allow', 'POST, OPTIONS'); return send(405, { error: 'METHOD_NOT_ALLOWED' }); }
    try {
      if (!String(req.headers['content-type'] || '').toLowerCase().startsWith('application/json')) throw new OrvelisError(415, 'INVALID_REQUEST');
      if (Number(req.headers['content-length'] || 0) > 262144) throw new OrvelisError(413, 'REQUEST_TOO_LARGE');
      let raw;
      try { raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body); }
      catch { throw new OrvelisError(400, 'INVALID_REQUEST'); }
      if (!raw || Buffer.byteLength(raw) > 262144) throw new OrvelisError(413, 'REQUEST_TOO_LARGE');
      let body;
      try { body = JSON.parse(raw); } catch { throw new OrvelisError(400, 'INVALID_REQUEST'); }
      const request = normalizeRequest(body);
      const authorization = req.headers.authorization || '';
      if (!/^Bearer [^\s]+$/.test(authorization)) throw new OrvelisError(401, 'SIGN_IN_REQUIRED');
      const supabaseUrl = (env.SUPABASE_URL || env.EXPO_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
      const anonKey = env.SUPABASE_ANON_KEY || env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
      if (!env.OPENAI_API_KEY || !supabaseUrl || !anonKey) throw new OrvelisError(503, 'NOT_CONFIGURED');
      const headers = { apikey: anonKey, Authorization: authorization };
      const userResponse = await fetcher(`${supabaseUrl}/auth/v1/user`, { headers, signal: AbortSignal.timeout(8000) });
      if ([401, 403].includes(userResponse.status)) throw new OrvelisError(401, 'SIGN_IN_REQUIRED');
      if (!userResponse.ok) throw new OrvelisError(503, 'UNAVAILABLE');
      const user = await userResponse.json();
      if (!user?.id || user.is_anonymous) throw new OrvelisError(401, 'SIGN_IN_REQUIRED');
      // Atomic quota works across function instances; fail closed if not installed.
      const quota = await fetcher(`${supabaseUrl}/rest/v1/rpc/consume_orvelis_quota`, {
        method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: '{}', signal: AbortSignal.timeout(8000) });
      if (!quota.ok) throw new OrvelisError(503, 'UNAVAILABLE');
      const allowed = await quota.json();
      if (allowed === false) throw new OrvelisError(429, 'RATE_LIMITED');
      if (allowed !== true) throw new OrvelisError(503, 'UNAVAILABLE');
      const response = await fetcher('https://api.openai.com/v1/chat/completions', {
        method: 'POST', signal: AbortSignal.timeout(30000),
        headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(buildCompletion(request, env.ORVELIS_MODEL || 'gpt-4o')) });
      if (!response.ok) throw new OrvelisError(response.status === 429 ? 429 : 502, response.status === 429 ? 'RATE_LIMITED' : 'UNAVAILABLE');
      return send(200, { data: parseCompletion(await response.json(), request) });
    } catch (error) {
      // Never expose provider messages, keys, prompts or tokens to clients/logs.
      if (error instanceof OrvelisError) return send(error.status, { error: error.code });
      if (['TimeoutError', 'AbortError'].includes(error?.name)) return send(504, { error: 'TIMEOUT' });
      return send(502, { error: 'UNAVAILABLE' });
    }
  };
}
export default createHandler();
