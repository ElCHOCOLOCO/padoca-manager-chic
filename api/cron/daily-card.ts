import { createClient } from '@supabase/supabase-js';

function json(res: any, status: number, body: any) {
	res.statusCode = status;
	res.setHeader('Content-Type', 'application/json');
	res.end(JSON.stringify(body));
}

export default async function handler(req: any, res: any) {
	try {
		const SUPABASE_URL = process.env.SUPABASE_URL as string;
		const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
		if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
			return json(res, 500, { error: 'Missing SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY' });
		}
		const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

		// Determine target date (YYYY-MM-DD); allow override via ?date=YYYY-MM-DD
		const dateParam = (req.query?.date as string) || new Date().toISOString().slice(0, 10);
		const startIso = `${dateParam}T00:00:00.000Z`;
		const endIso = `${dateParam}T23:59:59.999Z`;

		// Load product categories
		const { data: products, error: prodErr } = await supabase
			.from('products')
			.select('id,category,active');
		if (prodErr) return json(res, 400, { error: prodErr.message });
		const catByProduct = new Map<string, string>();
		(products || []).forEach((p: any) => { if (p?.id) catByProduct.set(String(p.id), String(p.category || '')); });

		// Load sales for the day
		let salesQuery = supabase
			.from('sales_marx')
			.select('product_id,quantity,transfer_amount,sale_date,cancelled')
			.gte('sale_date', startIso)
			.lte('sale_date', endIso);
		const { data: sales, error: salesErr } = await salesQuery;
		if (salesErr) return json(res, 400, { error: salesErr.message });

		let paesUnits = 0;
		let salgadosUnits = 0;
		let repasse = 0;
		let totalVendas = 0;
		(sales || []).forEach((s: any) => {
			if (s?.cancelled) return;
			const qty = Number(s?.quantity || 0);
			repasse += Number(s?.transfer_amount || 0);
			// If no revenue field available, approximate total_vendas by repasse
			totalVendas += Number(s?.transfer_amount || 0);
			const cat = catByProduct.get(String(s?.product_id)) || '';
			if (cat === 'paes') paesUnits += qty;
			else if (cat === 'salgados') salgadosUnits += qty;
		});

		// Upsert into integration_daily_balance
		const payload = {
			data_date: dateParam,
			total_paes: paesUnits,
			total_salgados: salgadosUnits,
			total_repasse: repasse,
			total_vendas: totalVendas,
			updated_at: new Date().toISOString(),
		};
		const { error: upsertErr } = await supabase
			.from('integration_daily_balance')
			.upsert(payload as any, { onConflict: 'data_date' });
		if (upsertErr) return json(res, 400, { error: upsertErr.message });

		// Best-effort audit
		try { await supabase.from('integration_audit').insert({ source: 'cron/daily-card', action: 'upsert', ok: true, payload }); } catch {}

		return json(res, 200, { ok: true, date: dateParam, paes: paesUnits, salgados: salgadosUnits, repasse, total_vendas: totalVendas });
	} catch (e: any) {
		return json(res, 500, { error: e?.message || 'Internal error' });
	}
}