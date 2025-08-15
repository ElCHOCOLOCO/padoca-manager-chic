import { useEffect, useMemo, useState } from "react";
import { MSG, Periodo } from "@/components/integration/types";

function useQuery() {
	return useMemo(() => new URLSearchParams(window.location.search), []);
}

export default function MarxVendasEmbed() {
	const q = useQuery();
	const [connected, setConnected] = useState(false);
	const [period, setPeriod] = useState<Periodo>((q.get("period") as Periodo) || "daily");
	const [start, setStart] = useState<string>(q.get("start") || new Date().toISOString().slice(0,10));
	const [end, setEnd] = useState<string>(q.get("end") || new Date().toISOString().slice(0,10));

	useEffect(() => {
		window.parent.postMessage({ type: MSG.EXT_INIT }, "*");
		const onMsg = (e: MessageEvent) => {
			const m = e.data || {};
			if (m.type === MSG.HOST_READY || m.type === MSG.CONTEXT_DATA) {
				setConnected(true);
				const ctx = m.payload || {};
				if (ctx.period) setPeriod(ctx.period);
				if (ctx.range?.start) setStart(ctx.range.start);
				if (ctx.range?.end) setEnd(ctx.range.end);
			}
			if (m.type === MSG.ENTRIES_DATA) {
				// No-op: apenas exibe
			}
		};
		window.addEventListener("message", onMsg);
		return () => window.removeEventListener("message", onMsg);
	}, []);

	const requestEntries = () => {
		window.parent.postMessage({ type: MSG.REQUEST_ENTRIES, payload: { period, start, end } }, "*");
	};

	return (
		<div className="p-4 text-sm">
			<div className="mb-3">Plugin Marx Vendas (stub). Conexão: {connected ? "ok" : "…"}</div>
			<div className="grid md:grid-cols-3 gap-2 mb-3">
				<label className="flex flex-col"><span>Período</span>
					<select value={period} onChange={(e)=> setPeriod(e.target.value as Periodo)} className="border rounded px-2 py-1">
						<option value="daily">Diário</option>
						<option value="weekly">Semanal</option>
						<option value="monthly">Mensal</option>
					</select>
				</label>
				<label className="flex flex-col"><span>Início</span>
					<input type="date" value={start} onChange={(e)=> setStart(e.target.value)} className="border rounded px-2 py-1"/>
				</label>
				<label className="flex flex-col"><span>Fim</span>
					<input type="date" value={end} onChange={(e)=> setEnd(e.target.value)} className="border rounded px-2 py-1"/>
				</label>
			</div>
			<button onClick={requestEntries} className="border rounded px-3 py-1">Buscar entradas</button>
			<p className="mt-2 text-muted-foreground">Substitua este stub com a UI de "EL CHOCO LOCO / Marx Vendas" quando disponível.</p>
		</div>
	);
}