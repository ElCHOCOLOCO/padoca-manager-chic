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

  const { id } = req.query || {};
  if (!id || typeof id !== 'string') return json(res, 400, { error: 'id is required' });

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('entradas').select('*').eq('id', id).single();
      if (error) return json(res, 404, { error: error.message });
      return json(res, 200, data);
    }

    if (req.method === 'PUT' || req.method === 'PATCH') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const update = {
        amount: body.amount,
        description: body.description ?? null,
      };
      const { error } = await supabase.from('entradas').update(update).eq('id', id);
      if (error) return json(res, 400, { error: error.message });
      try { await supabase.from('integration_audit').insert({ source: 'api/entries/[id]', action: 'update', ok: true, payload: { id, update } }); } catch {}
      return json(res, 200, { id });
    }

    if (req.method === 'DELETE') {
      const { error } = await supabase.from('entradas').delete().eq('id', id);
      if (error) return json(res, 400, { error: error.message });
      try { await supabase.from('integration_audit').insert({ source: 'api/entries/[id]', action: 'delete', ok: true, payload: { id } }); } catch {}
      return json(res, 204, null);
    }

    res.setHeader('Allow', 'GET, PUT, PATCH, DELETE');
    return json(res, 405, { error: 'Method Not Allowed' });
  } catch (e: any) {
    return json(res, 500, { error: e?.message || 'Internal error' });
  }
}