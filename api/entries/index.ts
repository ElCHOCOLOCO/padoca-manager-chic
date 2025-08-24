import { createClient } from '@supabase/supabase-js';

function json(res: any, status: number, body: any) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

export default async function handler(req: any, res: any) {
  const SUPABASE_URL = process.env.SUPABASE_URL as string;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return json(res, 500, { error: 'Missing server env SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' });
  }
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    if (req.method === 'GET') {
      const { period, start, end, instituteId } = req.query || {};
      const inst = (instituteId as string) || 'default';
      let q = supabase
        .from('entradas')
        .select('*')
        .eq('institute_id', inst)
        .order('entry_date', { ascending: true });
      if (period) q = q.eq('period', String(period));
      if (start) q = q.gte('entry_date', String(start));
      if (end) q = q.lte('entry_date', String(end));
      const { data, error } = await q;
      if (error) return json(res, 400, { error: error.message });
      return json(res, 200, data);
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const payload = {
        user_id: body.user_id || '00000000-0000-0000-0000-000000000001',
        institute_id: body.institute_id || 'default',
        entry_date: body.entry_date,
        period: body.period,
        amount: body.amount,
        description: body.description ?? null,
      };
      if (!payload.entry_date || !payload.period || typeof payload.amount !== 'number') {
        return json(res, 422, { error: 'entry_date, period and amount are required' });
      }
      const { data, error } = await supabase.from('entradas').insert(payload).select();
      if (error) return json(res, 400, { error: error.message });
      // best-effort audit (ignore error if table doesn't exist)
      try { await supabase.from('integration_audit').insert({ source: 'api/entries', action: 'create', ok: true, payload }); } catch {}
      return json(res, 201, data?.[0] ?? null);
    }

    res.setHeader('Allow', 'GET, POST');
    return json(res, 405, { error: 'Method Not Allowed' });
  } catch (e: any) {
    return json(res, 500, { error: e?.message || 'Internal error' });
  }
}