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
    return json(res, 500, { error: 'Missing SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY' });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const method = (req.method || 'GET').toUpperCase();
    const date = method === 'GET'
      ? (req.query?.date as string) || new Date().toISOString().slice(0,10)
      : (() => {
          try {
            const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
            return String(body.date || '').trim() || new Date().toISOString().slice(0,10);
          } catch { return new Date().toISOString().slice(0,10); }
        })();

    // Read from view/table 'projecoes_vendas'
    const { data: vendasMarxData, error: vendasMarxError } = await supabase
      .from('projecoes_vendas')
      .select('vendas_reais')
      .eq('data_referencia', date);
    if (vendasMarxError) return json(res, 200, { ok: false, error: vendasMarxError.message });

    const totalVendas = (vendasMarxData || []).reduce((total: number, item: any) => total + (item?.vendas_reais || 0), 0);
    if (!vendasMarxData || vendasMarxData.length === 0) {
      return json(res, 200, { ok: true, date, message: 'Sem dados em projecoes_vendas para a data' });
    }

    const paesVendidos = Math.floor(totalVendas * 0.4);
    const salgadosVendidos = Math.floor(totalVendas * 0.3);
    const repasseEstimado = totalVendas * 2;

    const insertPayload = {
      data: date,
      paes: paesVendidos,
      salgados: salgadosVendidos,
      chocolates: 0,
      refrigerantes: 0,
      repasse: repasseEstimado,
      lucro_dia: repasseEstimado,
      total_vendas: totalVendas,
      observacoes: `Recebido via API (${vendasMarxData?.length || 0} registros)`
    };

    const { error: insertErr } = await supabase
      .from('vendas_detalhadas')
      .insert([insertPayload]);
    if (insertErr) return json(res, 200, { ok: false, error: insertErr.message });

    // Best-effort audit
    try { await supabase.from('integration_audit').insert({ source: 'api/integration/receive', action: 'insert', ok: true, payload: insertPayload }); } catch {}

    return json(res, 200, { ok: true, date, totalVendas, paesVendidos, salgadosVendidos, repasseEstimado });
  } catch (e: any) {
    return json(res, 200, { ok: false, error: e?.message || 'Internal error' });
  }
}