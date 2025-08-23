// src/pages/Integracao.tsx
import { useEffect, useState, useCallback } from 'react';
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

type Entrada = {
  data_date: string;
  paes: number;
  salgados: number;
  repasse: number;
  total_vendas: number;
  created_at: string;
  origem: string;
};

export default function Integracao() {
  const [online, setOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ultimo, setUltimo] = useState<Balance | null>(null);
  const [historico, setHistorico] = useState<Balance[]>([]);
  const [resumo, setResumo] = useState({ total_paes: 0, total_salgados: 0, total_repasse: 0, total_vendas: 0 });
  const [entradas, setEntradas] = useState<Entrada[]>([]);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      // Último balanço
      const { data: last, error: e1 } = await supabase
        .from('integration_daily_balance')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1);
      setOnline(!e1);
      setUltimo((last?.[0] as Balance) || null);

      // Histórico
      const { data: hist } = await supabase
        .from('integration_daily_balance')
        .select('data_date,total_paes,total_salgados,total_repasse,total_vendas,updated_at')
        .order('data_date', { ascending: false })
        .limit(10);
      setHistorico((hist as Balance[]) || []);

      // Resumo 7d (RPC se existir; senão calcula)
      let sum = { total_paes: 0, total_salgados: 0, total_repasse: 0, total_vendas: 0 };
      const { data: s7, error: s7err } = await supabase.rpc('get_resumo_7d');
      if (!s7err && Array.isArray(s7) && s7.length > 0) {
        const r = s7[0] as any;
        sum = {
          total_paes: Number(r.total_paes || 0),
          total_salgados: Number(r.total_salgados || 0),
          total_repasse: Number(r.total_repasse || 0),
          total_vendas: Number(r.total_vendas || 0),
        };
      } else {
        const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
        const { data: last7 } = await supabase
          .from('integration_daily_balance')
          .select('total_paes,total_salgados,total_repasse,total_vendas,data_date')
          .gte('data_date', sevenDaysAgo);
        for (const r of last7 || []) {
          sum.total_paes += Number((r as any).total_paes || 0);
          sum.total_salgados += Number((r as any).total_salgados || 0);
          sum.total_repasse += Number((r as any).total_repasse || 0);
          sum.total_vendas += Number((r as any).total_vendas || 0);
        }
      }
      setResumo(sum);

      // Entradas (RPC se existir; senão fallback)
      const { data: ent, error: entErr } = await supabase.rpc('get_entradas', { p_limit: 50 });
      if (!entErr && Array.isArray(ent)) {
        setEntradas(ent as Entrada[]);
      } else {
        const { data: ent2 } = await supabase
          .from('entradas')
          .select('data_date,paes,salgados,repasse,total_vendas,created_at,origem')
          .order('created_at', { ascending: false })
          .limit(50);
        setEntradas((ent2 as Entrada[]) || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    const ch = supabase
      .channel('ingest-integration')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'integration_daily_balance' }, () => {
        refetch();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [refetch]);

  return (
    <div style={{ padding: 16, maxWidth: 1000, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Integração - Gestão</h1>

      <div style={{ marginBottom: 12, fontSize: 14 }}>
        <strong>Status:</strong> {online ? 'Conectado ao Supabase' : 'Offline/Erro'}
        {ultimo && (
          <div style={{ fontSize: 12, opacity: 0.8 }}>
            Último recebimento: {ultimo.data_date} • Vendas: R$
            {Number(ultimo.total_vendas || 0).toFixed(2)} • Repasse: R$
            {Number(ultimo.total_repasse || 0).toFixed(2)}
          </div>
        )}
      </div>

      <div style={{ marginBottom: 12 }}>
        <button onClick={refetch} disabled={loading} style={{ padding: '6px 10px', border: '1px solid #ddd', borderRadius: 6 }}>
          {loading ? 'Atualizando…' : 'Receber dados'}
        </button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <strong>Resumo (últimos 7 dias)</strong>
        <div style={{ fontSize: 14, marginTop: 6 }}>
          Pães: {resumo.total_paes} • Salgados: {resumo.total_salgados} • Repasse: R$ {resumo.total_repasse.toFixed(2)} • Vendas: R$ {resumo.total_vendas.toFixed(2)}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
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

        <div>
          <strong>Entradas (espelho)</strong>
          <ul style={{ fontSize: 14, marginTop: 8, lineHeight: 1.6 }}>
            {(entradas || []).map((e, i) => (
              <li key={i}>
                {e.data_date} — Pães {e.paes} • Salgados {e.salgados} • Repasse R$ {Number(e.repasse || 0).toFixed(2)} • Vendas R$ {Number(e.total_vendas || 0).toFixed(2)} • {e.origem}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
