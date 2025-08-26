function setCors(res, origin) {
  const allowed = origin && (origin === 'https://v0-vendedor-app.vercel.app' || /\.vercel\.app$/.test(origin));
  res.setHeader('Access-Control-Allow-Origin', allowed ? origin : '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, apikey');
  res.setHeader('Vary', 'Origin');
}

export default async function handler(req, res) {
  try {
    setCors(res, req.headers?.origin);
    if (req.method === 'OPTIONS') { res.statusCode = 204; return res.end(); }
    if (req.method !== 'POST') { res.statusCode = 405; return res.end(JSON.stringify({ error: 'Method Not Allowed' })); }

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      res.statusCode = 500; return res.end(JSON.stringify({ error: 'Missing SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY' }));
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
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

    const resp = await fetch(`${SUPABASE_URL}/rest/v1/entradas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(insertPayload)
    });

    if (!resp.ok) {
      const text = await resp.text();
      res.statusCode = 200; return res.end(JSON.stringify({ ok: false, error: `REST ${resp.status}: ${text}` }));
    }

    const data = await resp.json().catch(()=>null);
    res.statusCode = 200; return res.end(JSON.stringify({ ok: true, date, total_paes, total_salgados, total_repasse, inserted: data }));
  } catch (e) {
    res.statusCode = 200; return res.end(JSON.stringify({ ok: false, error: e?.message || 'Internal error' }));
  }
}