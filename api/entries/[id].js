import https from 'https';

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(typeof body === 'string' ? body : JSON.stringify(body));
}

function restRequest(method, urlString, headers = {}, payload = null) {
  return new Promise((resolve) => {
    try {
      const url = new URL(urlString);
      const opts = {
        hostname: url.hostname,
        path: url.pathname + (url.search || ''),
        port: url.port || 443,
        method,
        headers,
      };
      const req = https.request(opts, (res) => {
        const chunks = [];
        res.on('data', (d) => chunks.push(d));
        res.on('end', () => {
          const body = Buffer.concat(chunks).toString('utf8');
          resolve({ status: res.statusCode || 0, body });
        });
      });
      req.on('error', (e) => resolve({ status: 0, body: String(e?.message || e) }));
      if (payload) req.write(typeof payload === 'string' ? payload : JSON.stringify(payload));
      req.end();
    } catch (e) {
      resolve({ status: 0, body: String(e?.message || e) });
    }
  });
}

export default async function handler(req, res) {
  try {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return json(res, 500, { error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' });
    }

    const { id } = req.query || {};
    if (!id || typeof id !== 'string') return json(res, 400, { error: 'id is required' });

    const commonHeaders = {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Accept-Profile': 'public',
      'Prefer': 'return=representation'
    };

    const baseUrl = `${SUPABASE_URL}/rest/v1/entradas?id=eq.${encodeURIComponent(id)}`;

    if (req.method === 'GET') {
      const { status, body } = await restRequest('GET', baseUrl, commonHeaders);
      if (status < 200 || status >= 300) return json(res, 500, { error: `REST ${status}: ${body}` });
      try {
        const arr = JSON.parse(body);
        const single = Array.isArray(arr) ? arr[0] ?? null : arr;
        return json(res, single ? 200 : 404, single ?? { error: 'Not found' });
      } catch {
        return json(res, 200, body);
      }
    }

    if (req.method === 'PUT' || req.method === 'PATCH') {
      const bodyRaw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
      let body;
      try { body = JSON.parse(bodyRaw || '{}'); } catch { body = {}; }
      const update = {
        amount: Number(body.amount),
        description: body.description ?? null,
      };
      const { status, body: resp } = await restRequest(req.method, baseUrl, commonHeaders, [update]);
      if (status < 200 || status >= 300) return json(res, 500, { error: `REST ${status}: ${resp}` });
      return json(res, 200, { id });
    }

    if (req.method === 'DELETE') {
      const { status, body } = await restRequest('DELETE', baseUrl, commonHeaders);
      if (status < 200 || status >= 300) return json(res, 500, { error: `REST ${status}: ${body}` });
      return json(res, 204, null);
    }

    res.setHeader('Allow', 'GET, PUT, PATCH, DELETE');
    return json(res, 405, { error: 'Method Not Allowed' });
  } catch (e) {
    return json(res, 500, { error: e?.message || 'Internal error' });
  }
}