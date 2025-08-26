import { createClient } from '@supabase/supabase-js';

function setCors(res: any, origin?: string) {
  const isAllowed = !!origin && (origin === 'https://v0-vendedor-app.vercel.app' || origin.endsWith('.vercel.app'));
  res.setHeader('Access-Control-Allow-Origin', isAllowed ? origin : 'https://v0-vendedor-app.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, apikey');
  res.setHeader('Vary', 'Origin');
}

function json(res: any, status: number, body: any) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

export default async function handler(req: any, res: any) {
  setCors(res, req.headers?.origin as string | undefined);
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return json(res, 405, { error: 'Method Not Allowed' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL as string;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return json(res, 500, { error: 'Missing SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY' });
  }
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});

    // Support both RPC-like (p_*) and plain keys
    const date = String(body.p_date || body.date || '').slice(0, 10) || new Date().toISOString().slice(0,10);
    const total_paes = Number(body.p_total_paes ?? body.total_paes ?? 0);
    const total_salgados = Number(body.p_total_salgados ?? body.total_salgados ?? 0);
    const total_repasse = Number(body.p_total_repasse ?? body.total_repasse ?? 0);
    const period = 'daily';

    const insertPayload = {
      user_id: '00000000-0000-0000-0000-000000000001',
      institute_id: 'default',
      entry_date: date,
      period,
      amount: total_repasse,
      description: `Card diário: pães ${total_paes}, salgados ${total_salgados}`,
    };

    const { error } = await supabase.from('entradas').insert([insertPayload]);
    if (error) return json(res, 200, { ok: false, error: error.message });

    try { await supabase.from('integration_audit').insert({ source: 'api/integration/ingest-card', action: 'insert', ok: true, payload: insertPayload }); } catch {}

    return json(res, 200, { ok: true, date, total_paes, total_salgados, total_repasse });
  } catch (e: any) {
    return json(res, 200, { ok: false, error: e?.message || 'Internal error' });
  }
}