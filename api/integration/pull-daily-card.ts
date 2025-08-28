import { createClient } from '@supabase/supabase-js';

function json(res: any, status: number, body: any) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

// Pulls daily totals from products + sales_marx, upserts integration_daily_balance,
// and inserts an entrada com o repasse do dia.
export default async function handler(req: any, res: any) {
  try {
    const SUPABASE_URL = process.env.SUPABASE_URL as string;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return json(res, 500, { error: 'Missing SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY' });
    }
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // date=YYYY-MM-DD (default today UTC)
    const dateParam = (req.query?.date as string) || new Date().toISOString().slice(0, 10);
    const startIso = `${dateParam}T00:00:00.000Z`;
    const endIso = `${dateParam}T23:59:59.999Z`;

    // map product -> category
    const { data: products, error: prodErr } = await supabase
      .from('products')
      .select('id,category,active');
    if (prodErr) return json(res, 400, { error: prodErr.message });
    const catByProduct = new Map<string, string>();
    (products || []).forEach((p: any) => { if (p?.id) catByProduct.set(String(p.id), String(p.category || '')); });

    // aggregate sales
    const { data: sales, error: salesErr } = await supabase
      .from('sales_marx')
      .select('product_id,quantity,transfer_amount,sale_date,cancelled')
      .gte('sale_date', startIso)
      .lte('sale_date', endIso);
    if (salesErr) return json(res, 400, { error: salesErr.message });

    let paesUnits = 0;
    let salgadosUnits = 0;
    let repasse = 0;
    let totalVendas = 0;
    (sales || []).forEach((s: any) => {
      if (s?.cancelled) return;
      const qty = Number(s?.quantity || 0);
      repasse += Number(s?.transfer_amount || 0);
      totalVendas += Number(s?.transfer_amount || 0); // fallback
      const cat = catByProduct.get(String(s?.product_id)) || '';
      if (cat === 'paes') paesUnits += qty;
      else if (cat === 'salgados') salgadosUnits += qty;
    });

    // Upsert integration_daily_balance
    const payload = {
      data_date: dateParam,
      total_paes: paesUnits,
      total_salgados: salgadosUnits,
      total_repasse: repasse,
      total_vendas: totalVendas,
      updated_at: new Date().toISOString(),
    } as any;
    const { error: upsertErr } = await supabase.from('integration_daily_balance').upsert(payload, { onConflict: 'data_date' });
    if (upsertErr) return json(res, 400, { error: upsertErr.message });

    // Insert entrada (best-effort)
    try {
      await supabase.from('entradas').insert({
        user_id: '00000000-0000-0000-0000-000000000001',
        institute_id: 'default',
        entry_date: dateParam,
        period: 'daily',
        amount: repasse,
        description: `Card diário: pães ${paesUnits}, salgados ${salgadosUnits}`,
      });
    } catch {}

    // Audit best-effort
    try { await supabase.from('integration_audit').insert({ source: 'integration/pull-daily-card', action: 'upsert', ok: true, payload }); } catch {}

    return json(res, 200, { ok: true, date: dateParam, paes: paesUnits, salgados: salgadosUnits, repasse, total_vendas: totalVendas });
  } catch (e: any) {
    return json(res, 500, { error: e?.message || 'Internal error' });
  }
}

