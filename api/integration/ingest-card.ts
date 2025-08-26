import { createClient } from '@supabase/supabase-js';

export const config = { runtime: 'edge' } as const;

function corsHeaders(origin?: string): HeadersInit {
  const allowed = origin && (origin === 'https://v0-vendedor-app.vercel.app' || origin.endsWith('.vercel.app'));
  return {
    'Access-Control-Allow-Origin': allowed ? origin! : 'https://v0-vendedor-app.vercel.app',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey',
    'Vary': 'Origin'
  };
}

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('Origin') || undefined;
  const cors = corsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: { 'Content-Type': 'application/json', ...cors } });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL as string | undefined;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: 'Missing SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY' }), { status: 500, headers: { 'Content-Type': 'application/json', ...cors } });
  }

  try {
    const body = await req.json().catch(()=> ({}));
    const date = String(body.p_date || body.date || '').slice(0, 10) || new Date().toISOString().slice(0,10);
    const total_paes = Number(body.p_total_paes ?? body.total_paes ?? 0);
    const total_salgados = Number(body.p_total_salgados ?? body.total_salgados ?? 0);
    const total_repasse = Number(body.p_total_repasse ?? body.total_repasse ?? 0);

    const insertPayload = {
      user_id: '00000000-0000-0000-0000-000000000001',
      institute_id: 'default',
      entry_date: date,
      period: 'daily',
      amount: total_repasse,
      description: `Card diário: pães ${total_paes}, salgados ${total_salgados}`,
    } as any;

    const restUrl = `${SUPABASE_URL}/rest/v1/entradas`;
    const resp = await fetch(restUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify([insertPayload])
    });

    if (!resp.ok) {
      const text = await resp.text();
      return new Response(JSON.stringify({ ok: false, error: `REST ${resp.status}: ${text}` }), { status: 200, headers: { 'Content-Type': 'application/json', ...cors } });
    }

    const data = await resp.json().catch(()=>null);
    return new Response(JSON.stringify({ ok: true, date, total_paes, total_salgados, total_repasse, inserted: data }), { status: 200, headers: { 'Content-Type': 'application/json', ...cors } });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e?.message || 'Internal error' }), { status: 200, headers: { 'Content-Type': 'application/json', ...cors } });
  }
}