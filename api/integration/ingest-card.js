const https = require('https');

function setCors(res, origin) {
  const allowed = origin && (origin === 'https://v0-vendedor-app.vercel.app' || /\.vercel\.app$/.test(origin));
  res.setHeader('Access-Control-Allow-Origin', allowed ? origin : '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, apikey');
  res.setHeader('Vary', 'Origin');
}

async function readJsonBody(req) {
  try {
    if (typeof req.body === 'string') return JSON.parse(req.body || '{}');
    if (Buffer.isBuffer(req.body)) return JSON.parse(req.body.toString('utf8') || '{}');
    if (req.body && typeof req.body === 'object') return req.body; // already parsed
  } catch {}
  const chunks = [];
  return await new Promise((resolve) => {
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); } catch { resolve({}); }
    });
    req.on('error', () => resolve({}));
  });
}

function postJson(urlString, headers, payload) {
  return new Promise((resolve) => {
    try {
      const url = new URL(urlString);
      const opts = {
        hostname: url.hostname,
        path: url.pathname + (url.search || ''),
        port: url.port || 443,
        method: 'POST',
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
      req.write(JSON.stringify(payload));
      req.end();
    } catch (e) {
      resolve({ status: 0, body: String(e?.message || e) });
    }
  });
}

module.exports = async function handler(req, res) {
  try {
    setCors(res, req.headers?.origin);
    if (req.method === 'OPTIONS') { res.statusCode = 204; return res.end(); }
    if (req.method === 'GET') { res.statusCode = 200; return res.end(JSON.stringify({ ok: true, route: 'ingest-card' })); }
    if (req.method !== 'POST') { res.statusCode = 405; return res.end(JSON.stringify({ error: 'Method Not Allowed' })); }

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      res.statusCode = 500; return res.end(JSON.stringify({ error: 'Missing SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY' }));
    }

    const body = await readJsonBody(req);
    const date = String(body.p_date || body.date || '').slice(0, 10) || new Date().toISOString().slice(0,10);
    const total_paes = Number(body.p_total_paes ?? body.total_paes ?? 0);
    const total_salgados = Number(body.p_total_salgados ?? body.total_salgados ?? 0);
    const total_repasse = Number(body.p_total_repasse ?? body.total_repasse ?? 0);

    const insertPayload = [{
      user_id: '00000000-0000-0000-0000-000000000001',
      institute_id: 'default',
      entry_date: date,
      period: 'daily',
      amount: total_repasse,
      description: `Card diário: pães ${total_paes}, salgados ${total_salgados}`,
    }];

    const { status, body: respBody } = await postJson(
      `${SUPABASE_URL}/rest/v1/entradas`,
      {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Prefer': 'return=representation'
      },
      insertPayload
    );

    if (status < 200 || status >= 300) {
      res.statusCode = 200; return res.end(JSON.stringify({ ok: false, error: `REST ${status}: ${respBody}` }));
    }

    let inserted = null;
    try { inserted = JSON.parse(respBody); } catch {}
    res.statusCode = 200; return res.end(JSON.stringify({ ok: true, date, total_paes, total_salgados, total_repasse, inserted }));
  } catch (e) {
    res.statusCode = 200; return res.end(JSON.stringify({ ok: false, error: e?.message || 'Internal error' }));
  }
}