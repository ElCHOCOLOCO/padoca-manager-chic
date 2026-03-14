import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import PageTurn from "@/components/ui/PageTurn";
import InsumosTabela14 from "@/components/finance/InsumosTabela14";

interface FinanceiroSectionProps {
  custosFixos: { id: string, nome: string, valor_mensal: number }[];
  insumos: { id: string, nome: string, custo_unitario: number }[];
  vendas: { id: string, data: string, unidades: number, preco_unitario: number }[];
  metaLucroBruto: number | undefined;
  setMetaLucroBruto: (val: number | undefined) => void;
  metaLucroLiquido: number | undefined;
  setMetaLucroLiquido: (val: number | undefined) => void;
  custoVariavelOverride: number | undefined;
  setCustoVariavelOverride: (val: number | undefined) => void;
  addCustoFixo: (e: React.FormEvent<HTMLFormElement>) => void;
  deleteCustoFixo: (id: string) => void;
  addVenda: (e: React.FormEvent<HTMLFormElement>) => void;
  notifyOk: (msg: string) => void;
}

const FinanceiroSection: React.FC<FinanceiroSectionProps> = ({
  custosFixos,
  insumos,
  vendas,
  metaLucroBruto,
  setMetaLucroBruto,
  metaLucroLiquido,
  setMetaLucroLiquido,
  custoVariavelOverride,
  setCustoVariavelOverride,
  addCustoFixo,
  deleteCustoFixo,
  addVenda,
  notifyOk
}) => {
  const totalCustosFixos = useMemo(() => (custosFixos || []).reduce((s,c)=>s + (Number(c.valor_mensal)||0), 0), [custosFixos]);
  const custoVariavelPorUnidade = useMemo(() => (insumos || []).reduce((s,i)=>s + (Number(i.custo_unitario)||0), 0), [insumos]);
  
  const vendasMes = useMemo(() => {
    if (!vendas) return [];
    const ref = new Date();
    const ym = `${ref.getFullYear()}-${String(ref.getMonth()+1).padStart(2,'0')}`;
    return vendas.filter(v=> v.data && v.data.startsWith(ym));
  }, [vendas]);

  const unidadesMes = useMemo(()=> (vendasMes || []).reduce((s,v)=> s + (Number(v.unidades)||0), 0), [vendasMes]);
  const receitaMes = useMemo(()=> (vendasMes || []).reduce((s,v)=> s + ((Number(v.unidades)||0) * (Number(v.preco_unitario)||0)), 0), [vendasMes]);
  const custoVarUnidEfetivo = useMemo(()=> (custoVariavelOverride ?? custoVariavelPorUnidade), [custoVariavelOverride, custoVariavelPorUnidade]);
  const custoVariavelMes = useMemo(()=> unidadesMes * custoVarUnidEfetivo, [unidadesMes,custoVarUnidEfetivo]);
  const lucroBrutoMes = useMemo(()=> receitaMes - custoVariavelMes, [receitaMes,custoVariavelMes]);
  const lucroLiquidoMes = useMemo(()=> receitaMes - custoVariavelMes - totalCustosFixos, [receitaMes,custoVariavelMes,totalCustosFixos]);
  const margemContribuicao = useMemo(() => receitaMes > 0 ? (lucroBrutoMes / receitaMes) * 100 : 0, [lucroBrutoMes, receitaMes]);

  return (
    <PageTurn pageKey="financeiro">
      <div className="grid lg:grid-cols-12 gap-12">
        <div className="lg:col-span-4 space-y-8">
          <Card className="border-4 border-foreground rounded-none bg-background shadow-none">
            <CardHeader className="border-b-4 border-foreground bg-foreground text-background py-3">
              <CardTitle className="text-xl font-black uppercase italic text-center">Balanço do Mês</CardTitle>
            </CardHeader>
            <CardContent className="pt-8 space-y-6">
              <div className="border-b-2 border-foreground pb-2">
                <div className="text-[10px] font-black uppercase opacity-60">Receita Bruta</div>
                <div className="text-3xl font-black font-serif italic">R$ {receitaMes.toLocaleString()}</div>
              </div>
              <div className="border-b-2 border-foreground pb-2">
                <div className="text-[10px] font-black uppercase opacity-60">Margem de Contribuição</div>
                <div className="text-3xl font-black font-serif italic">{margemContribuicao.toFixed(1)}%</div>
              </div>
              <div className="bg-muted p-4 border-2 border-foreground">
                <div className="text-[10px] font-black uppercase opacity-60">Lucro Líquido Real</div>
                <div className={cn("text-4xl font-black font-serif italic", lucroLiquidoMes < 0 ? "text-red-600" : "text-emerald-600")}>
                  R$ {lucroLiquidoMes.toLocaleString()}
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t-2 border-foreground/10">
                <h4 className="text-xs font-black uppercase tracking-widest text-center">Parâmetros de Teoria Econômica</h4>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase">Meta Lucro Bruto (R$)</Label>
                  <Input type="number" value={metaLucroBruto ?? ''} onChange={(e)=> setMetaLucroBruto(e.target.value===''? undefined : Number(e.target.value))} className="rounded-none border-2 border-foreground font-serif italic text-lg" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-black uppercase">Fator de Override (CV/unid)</Label>
                  <Input type="number" value={custoVariavelOverride ?? ''} onChange={(e)=> setCustoVariavelOverride(e.target.value===''? undefined : Number(e.target.value))} className="rounded-none border-2 border-foreground font-serif italic text-lg" placeholder={`Base: R$ ${custoVariavelPorUnidade.toFixed(2)}`} />
                </div>
                <Button className="w-full h-12 rounded-none bg-foreground text-background font-black uppercase italic" onClick={()=> notifyOk("Parâmetros recalibrados.")}>Aplicar Teoria</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-8 space-y-8">
          <div className="border-4 border-foreground bg-background p-1">
            <div className="border-2 border-foreground p-6">
              <header className="border-b-4 border-foreground mb-8 pb-4">
                <h3 className="text-4xl font-black uppercase tracking-tighter">Diário de Insumos (14 Componentes)</h3>
              </header>
              <InsumosTabela14 />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="border-4 border-foreground bg-background p-6">
              <header className="border-b-2 border-foreground mb-4 pb-2">
                <h4 className="text-2xl font-black uppercase italic">Custos Fixos</h4>
              </header>
              <form onSubmit={addCustoFixo} className="flex gap-2 mb-4">
                <Input name="nome" placeholder="Item" className="rounded-none border-2 border-foreground h-10" />
                <Input name="valor" type="number" step="0.01" placeholder="R$" className="rounded-none border-2 border-foreground h-10 w-24" />
                <Button type="submit" className="rounded-none bg-foreground text-background font-black">⊕</Button>
              </form>
              <div className="space-y-2">
                {custosFixos.map(c=> (
                  <div key={c.id} className="flex justify-between items-center text-sm border-b border-foreground/10 py-1">
                    <span className="font-bold uppercase italic">{c.nome}</span>
                    <div className="flex items-center gap-4">
                      <span className="font-serif italic font-bold">R$ {c.valor_mensal.toFixed(2)}</span>
                      <button onClick={()=> deleteCustoFixo(c.id)} className="text-red-600 font-bold hover:scale-125 transition-transform">✕</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-4 border-foreground bg-background p-6">
              <header className="border-b-2 border-foreground mb-4 pb-2">
                <h4 className="text-2xl font-black uppercase italic">Registro de Vendas</h4>
              </header>
              <form onSubmit={addVenda} className="space-y-3">
                <Input name="data" type="date" className="rounded-none border-2 border-foreground h-10 font-bold" />
                <div className="flex gap-2">
                  <Input name="unidades" type="number" placeholder="Qtd" className="rounded-none border-2 border-foreground h-10" />
                  <Input name="preco" type="number" step="0.01" placeholder="R$/unid" className="rounded-none border-2 border-foreground h-10" />
                </div>
                <Button type="submit" className="w-full h-12 rounded-none border-2 border-foreground bg-foreground text-background font-black uppercase tracking-widest italic">Consolidar Venda</Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </PageTurn>
  );
};

// Helper function for class merging
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

export default FinanceiroSection;
