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
        res.on('end', () => resolve({ status: res.statusCode || 0, body: Buffer.concat(chunks).toString('utf8') }));
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
      return json(res, 500, { error: 'Missing SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY' });
    }

    const headers = {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Accept-Profile': 'public'
    };

    const dateParam = (req.query?.date || '').toString().slice(0,10) || new Date().toISOString().slice(0,10);
    const startIso = `${dateParam}T00:00:00.000Z`;
    const endIso = `${dateParam}T23:59:59.999Z`;

    // products
    const prodUrl = `${SUPABASE_URL}/rest/v1/products?select=id,category,active`;
    const prodResp = await restRequest('GET', prodUrl, headers);
    if (prodResp.status < 200 || prodResp.status >= 300) return json(res, 500, { error: `REST ${prodResp.status}: ${prodResp.body}` });
    let products = [];
    try { products = JSON.parse(prodResp.body) || []; } catch {}
    const catByProduct = new Map();
    (products || []).forEach((p) => { if (p?.id) catByProduct.set(String(p.id), String(p.category || '')); });

    // sales for day
    const usp = new URLSearchParams();
    usp.append('select', 'product_id,quantity,transfer_amount,sale_date,cancelled');
    usp.append('sale_date', `gte.${startIso}`);
    usp.append('sale_date', `lte.${endIso}`);
    const salesUrl = `${SUPABASE_URL}/rest/v1/sales_marx?${usp.toString()}`;
    const salesResp = await restRequest('GET', salesUrl, headers);
    if (salesResp.status < 200 || salesResp.status >= 300) return json(res, 500, { error: `REST ${salesResp.status}: ${salesResp.body}` });
    let sales = [];
    try { sales = JSON.parse(salesResp.body) || []; } catch {}

    let paesUnits = 0, salgadosUnits = 0, repasse = 0, totalVendas = 0;
    (sales || []).forEach((s) => {
      if (s?.cancelled) return;
      const qty = Number(s?.quantity || 0);
      repasse += Number(s?.transfer_amount || 0);
      totalVendas += Number(s?.transfer_amount || 0);
      const cat = catByProduct.get(String(s?.product_id)) || '';
      if (cat === 'paes') paesUnits += qty;
      else if (cat === 'salgados') salgadosUnits += qty;
    });

    // upsert integration_daily_balance
    const upsertUrl = `${SUPABASE_URL}/rest/v1/integration_daily_balance?on_conflict=data_date`;
    const upsertHeaders = { ...headers, Prefer: 'resolution=merge-duplicates' };
    const upsertPayload = [{
      data_date: dateParam,
      total_paes: paesUnits,
      total_salgados: salgadosUnits,
      total_repasse: repasse,
      total_vendas: totalVendas,
      updated_at: new Date().toISOString(),
    }];
    const upResp = await restRequest('POST', upsertUrl, upsertHeaders, upsertPayload);
    if (upResp.status < 200 || upResp.status >= 300) return json(res, 500, { error: `REST ${upResp.status}: ${upResp.body}` });

    // insert entrada (best-effort)
    const entUrl = `${SUPABASE_URL}/rest/v1/entradas`;
    const entPayload = [{
      user_id: '00000000-0000-0000-0000-000000000001',
      institute_id: 'default',
      entry_date: dateParam,
      period: 'daily',
      amount: repasse,
      description: `Card diário: pães ${paesUnits}, salgados ${salgadosUnits}`,
    }];
    await restRequest('POST', entUrl, headers, entPayload);

    return json(res, 200, { ok: true, date: dateParam, paes: paesUnits, salgados: salgadosUnits, repasse, total_vendas: totalVendas });
  } catch (e) {
    return json(res, 200, { ok: false, error: e?.message || 'Internal error' });
  }
}

