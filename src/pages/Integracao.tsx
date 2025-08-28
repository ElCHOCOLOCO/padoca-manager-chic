// src/pages/Integracao.tsx
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL as string;
const supabaseAnon = (import.meta as any).env.VITE_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseAnon);

type Balance = {
  data_date: string;
  total_paes: number;
  total_salgados: number;
  total_repasse: number;
  total_vendas: number;
  updated_at: string;
};

export default function Integracao() {
  const [online, setOnline] = useState(false);
  const [ultimo, setUltimo] = useState<Balance | null>(null);
  const [historico, setHistorico] = useState<Balance[]>([]);
  const [resumo, setResumo] = useState({ total_paes: 0, total_salgados: 0, total_repasse: 0, total_vendas: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refetch() {
    try {
      setError(null);
      const { data: last, error: e1 } = await supabase
        .from('integration_daily_balance')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1);
      setOnline(!e1);
      setUltimo((last?.[0] as Balance) || null);

      const { data: hist } = await supabase
        .from('integration_daily_balance')
        .select('data_date,total_paes,total_salgados,total_repasse,total_vendas,updated_at')
        .order('data_date', { ascending: false })
        .limit(10);
      setHistorico((hist as Balance[]) || []);

      const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
      const { data: ult7 } = await supabase
        .from('integration_daily_balance')
        .select('total_paes,total_salgados,total_repasse,total_vendas,data_date')
        .gte('data_date', sevenDaysAgo);

      const acc = (ult7 || []).reduce(
        (a: any, r: any) => ({
          total_paes: a.total_paes + Number(r.total_paes || 0),
          total_salgados: a.total_salgados + Number(r.total_salgados || 0),
          total_repasse: a.total_repasse + Number(r.total_repasse || 0),
          total_vendas: a.total_vendas + Number(r.total_vendas || 0),
        }),
        { total_paes: 0, total_salgados: 0, total_repasse: 0, total_vendas: 0 }
      );
      setResumo(acc);
    } catch (e: any) {
      setOnline(false);
      setError(e?.message || 'Falha ao carregar');
    }
  }

  useEffect(() => { void refetch(); }, []);

  async function handlePull() {
    try {
      setLoading(true);
      setError(null);
      const today = new Date().toISOString().slice(0, 10);
      const resp = await fetch(`/api/integration/pull-daily-card?date=${encodeURIComponent(today)}`);
      const body = await resp.json().catch(() => ({}));
      if (!resp.ok || body?.ok === false) throw new Error(body?.error || `Falha ao receber (${resp.status})`);
      await refetch();
    } catch (e: any) {
      setError(e?.message || 'Erro ao receber');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 16, maxWidth: 900, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Integração - Gestão</h1>

      <div style={{ marginBottom: 12, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
        <strong>Status:</strong> {online ? 'Conectado' : 'Offline/Erro'}
        <button onClick={handlePull} disabled={loading} style={{ padding: '6px 10px', border: '1px solid #ccc', borderRadius: 6, background: loading ? '#eee' : '#fafafa', cursor: loading ? 'not-allowed' : 'pointer' }}>
          {loading ? 'Recebendo…' : 'Receber agora'}
        </button>
        {error && <span style={{ color: 'red', marginLeft: 8 }}>{error}</span>}
        {ultimo && (
          <div style={{ fontSize: 12, opacity: 0.8 }}>
            Último: {ultimo.data_date} • Vendas: R$ {Number(ultimo.total_vendas || 0).toFixed(2)} • Repasse: R$ {Number(ultimo.total_repasse || 0).toFixed(2)}
          </div>
        )}
      </div>

      <div style={{ marginBottom: 16 }}>
        <strong>Resumo (últimos 7 dias)</strong>
        <div style={{ fontSize: 14, marginTop: 6 }}>
          Pães: {resumo.total_paes}
          {' • '}Salgados: {resumo.total_salgados}
          {' • '}Repasse: R$ {resumo.total_repasse.toFixed(2)}
          {' • '}Vendas: R$ {resumo.total_vendas.toFixed(2)}
        </div>
      </div>

      <div>
        <strong>Histórico (10 últimos)</strong>
        <ul style={{ fontSize: 14, marginTop: 8, lineHeight: 1.6 }}>
          {(historico || []).map((r, i) => (
            <li key={i}>
              {r.data_date} — Pães {r.total_paes} • Salgados {r.total_salgados} • Repasse R$ {Number(r.total_repasse || 0).toFixed(2)} • Vendas R$ {Number(r.total_vendas || 0).toFixed(2)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
