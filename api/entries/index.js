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

    const commonHeaders = {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Accept-Profile': 'public',
      'Prefer': 'return=representation'
    };

    if (req.method === 'GET') {
      const q = req.query || {};
      const instituteId = String(q.instituteId || 'default');
      const period = q.period ? String(q.period) : undefined;
      const entryDate = q.entry_date ? String(q.entry_date).slice(0, 10) : undefined;
      const start = q.start ? String(q.start) : undefined;
      const end = q.end ? String(q.end) : undefined;

      const usp = new URLSearchParams();
      usp.set('select', '*');
      usp.set('order', 'entry_date.asc');
      usp.set('institute_id', `eq.${instituteId}`);
      if (period) usp.set('period', `eq.${period}`);
      if (entryDate) usp.set('entry_date', `eq.${entryDate}`);
      if (!entryDate && start) usp.append('entry_date', `gte.${start}`);
      if (!entryDate && end) usp.append('entry_date', `lte.${end}`);

      const url = `${SUPABASE_URL}/rest/v1/entradas?${usp.toString()}`;
      const { status, body } = await restRequest('GET', url, commonHeaders);
      if (status < 200 || status >= 300) return json(res, 500, { error: `REST ${status}: ${body}` });
      try { return json(res, 200, JSON.parse(body)); } catch { return json(res, 200, body); }
    }

    if (req.method === 'POST') {
      const bodyRaw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
      let body;
      try { body = JSON.parse(bodyRaw || '{}'); } catch { body = {}; }

      const payload = [{
        user_id: body.user_id || '00000000-0000-0000-0000-000000000001',
        institute_id: body.institute_id || 'default',
        entry_date: body.entry_date,
        period: body.period,
        amount: Number(body.amount),
        description: body.description ?? null,
      }];

      if (!payload[0].entry_date || !payload[0].period || !Number.isFinite(payload[0].amount)) {
        return json(res, 422, { error: 'entry_date, period and amount are required' });
      }

      const url = `${SUPABASE_URL}/rest/v1/entradas`;
      const { status, body: resp } = await restRequest('POST', url, commonHeaders, payload);
      if (status < 200 || status >= 300) return json(res, 500, { error: `REST ${status}: ${resp}` });
      try { return json(res, 201, JSON.parse(resp)?.[0] ?? null); } catch { return json(res, 201, resp); }
    }

    res.setHeader('Allow', 'GET, POST');
    return json(res, 405, { error: 'Method Not Allowed' });
  } catch (e) {
    return json(res, 500, { error: e?.message || 'Internal error' });
  }
}