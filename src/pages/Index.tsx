import { useEffect, useMemo, useState, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, Clock, Package, Users, GraduationCap, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import InsumosTabela14 from "@/components/finance/InsumosTabela14";
import EntradasPanel from "@/components/finance/EntradasPanel";
import ThemeToggle from "@/components/ThemeToggle";
import { supabase as supabaseClient } from "@/integrations/supabase/client";
import React, { Suspense, lazy } from "react";
import PageTurn from "@/components/ui/PageTurn";
import ShiftChecklist from "@/components/ShiftChecklist";
import { speakSale } from "@/lib/voiceFeedback";

// Lazy loading para componentes pesados
const ProjecaoVendas = lazy(() => import("@/components/vendas/ProjecaoVendas"));
const IntegracaoVendas = lazy(() => import("@/components/integracao/IntegracaoVendas"));

// Tipos
type Turno = "manha" | "tarde" | "noite";
type Dia = "seg" | "ter" | "qua" | "qui" | "sex";

type HorarioDisponivel = {
  dia: Dia;
  turno: Turno;
};

type TurnoDisponivel = {
  id: string;
  camarada_id: string;
  dia: Dia;
  turno: Turno;
};

type Camarada = { 
  id: string; 
  nome: string; 
  curso: string; 
  turnos: Turno[];
  horarios_disponiveis?: HorarioDisponivel[];
};

type ItemEstoque = {
  id: string;
  produto: string;
  uso_semanal: number;
  unidades: number;
};

const Index = () => {
  useEffect(() => {
    document.title = "Marx Gestão – Crônicas da Padaria";
  }, []);
  const todayLabel = format(new Date(), "dd/MM/yyyy");

  // Estados gerais
  const [camaradas, setCamaradas] = useState<Camarada[]>([]);
  const [turnosDisponiveis, setTurnosDisponiveis] = useState<TurnoDisponivel[]>([]);
  const [institutos, setInstitutos] = useState<{ id: string; nome: string }[]>([]);
  const [escala, setEscala] = useState<{ id: string; camarada_id: string; instituto_id: string; turno: Turno; dia?: Dia }[]>([]);
  const [insumos, setInsumos] = useState<{ id: string; nome: string; custo_unitario: number }[]>([]);
  const [custosFixos, setCustosFixos] = useState<{ id: string; nome: string; valor_mensal: number }[]>([]);
  const [vendas, setVendas] = useState<{ id: string; data: string; unidades: number; preco_unitario: number }[]>([]);
  const [cas, setCas] = useState<{ id: string; nome: string; status: "aliado" | "neutro"; relacao: string; humor: string; desafios: string; oportunidades: string }[]>([]);
  const [agenda, setAgenda] = useState<{ id: string; data: string; titulo: string; notas?: string }[]>([]);
  const [estoque, setEstoque] = useState<ItemEstoque[]>([
    { id: '1', produto: 'Farinha de Trigo', uso_semanal: 50, unidades: 120 },
    { id: '2', produto: 'Açúcar', uso_semanal: 20, unidades: 45 },
    { id: '3', produto: 'Manteiga', uso_semanal: 15, unidades: 30 },
  ]);

  const [metaLucroBruto, setMetaLucroBruto] = useState<number | undefined>(undefined);
  const [metaLucroLiquido, setMetaLucroLiquido] = useState<number | undefined>(undefined);
  const [custoVariavelOverride, setCustoVariavelOverride] = useState<number | undefined>(undefined);

  // Estados para edição
  const [editingCA, setEditingCA] = useState<string | null>(null);
  const [editingEscala, setEditingEscala] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'camaradas' | 'institutos' | 'turnos' | 'estatisticas'>('camaradas');
  const [dataAgenda, setDataAgenda] = useState<Date | undefined>(undefined);

  const supabase: any = supabaseClient as any;

  // Carregar dados
  const loadAll = useCallback(async () => {
    try {
      const tables = [
        supabase.from("camaradas").select("id,nome,curso,turnos,horarios_disponiveis"),
        supabase.from("turnos_disponiveis").select("id,camarada_id,dia,turno"),
        supabase.from("institutos").select("id,nome"),
        supabase.from("escala").select("id,camarada_id,instituto_id,turno,dia"),
        supabase.from("insumos").select("id,nome,custo_unitario"),
        supabase.from("custos_fixos").select("id,nome,valor_mensal"),
        supabase.from("vendas_diarias").select("id,data,unidades,preco_unitario"),
        supabase.from("cas").select("id,nome,status,relacao,humor,desafios,oportunidades"),
        supabase.from("agenda").select("id,data,titulo,notas"),
      ];
      const [c1,c2,c3,c4,c5,c6,c7,c8,c9] = await Promise.all(tables);
      if (!c1.error && c1.data) setCamaradas(c1.data as any);
      if (!c2.error && c2.data) setTurnosDisponiveis(c2.data as any);
      if (!c3.error && c3.data) setInstitutos(c3.data as any);
      if (!c4.error && c4.data) setEscala(c4.data as any);
      if (!c5.error && c5.data) setInsumos(c5.data as any);
      if (!c6.error && c6.data) setCustosFixos(c6.data as any);
      if (!c7.error && c7.data) setVendas(c7.data as any);
      if (!c8.error && c8.data) setCas(c8.data as any);
      if (!c9.error && c9.data) setAgenda(c9.data as any);
    } catch (e) {
      console.warn("Supabase connection issue.");
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Financeiro: cálculos
  const totalCustosFixos = useMemo(() => custosFixos.reduce((s,c)=>s + (c.valor_mensal||0), 0), [custosFixos]);
  const custoVariavelPorUnidade = useMemo(() => insumos.reduce((s,i)=>s + (i.custo_unitario||0), 0), [insumos]);
  const vendasMes = useMemo(() => {
    const ref = new Date();
    const ym = `${ref.getFullYear()}-${String(ref.getMonth()+1).padStart(2,'0')}`;
    return vendas.filter(v=>v.data?.startsWith(ym));
  }, [vendas]);
  const unidadesMes = useMemo(()=> vendasMes.reduce((s,v)=>s+v.unidades,0), [vendasMes]);
  const receitaMes = useMemo(()=> vendasMes.reduce((s,v)=>s + v.unidades*v.preco_unitario,0), [vendasMes]);
  const custoVarUnidEfetivo = useMemo(()=> (custoVariavelOverride ?? custoVariavelPorUnidade), [custoVariavelOverride, custoVariavelPorUnidade]);
  const custoVariavelMes = useMemo(()=> unidadesMes * custoVarUnidEfetivo, [unidadesMes,custoVarUnidEfetivo]);
  const custoFixoDilPorUnid = useMemo(()=> unidadesMes>0 ? totalCustosFixos / unidadesMes : 0, [totalCustosFixos, unidadesMes]);
  const lucroBrutoMes = useMemo(()=> receitaMes - custoVariavelMes, [receitaMes,custoVariavelMes]);
  const lucroLiquidoMes = useMemo(()=> receitaMes - custoVariavelMes - totalCustosFixos, [receitaMes,custoVariavelMes,totalCustosFixos]);
  const precoMedio = useMemo(()=> unidadesMes>0 ? receitaMes / unidadesMes : 0, [receitaMes, unidadesMes]);

  // Helpers
  const notifyOk = (msg: string) => toast({ title: msg });
  const notifyErr = (msg: string) => toast({ title: "Erro", description: msg });

  // Submits
  const addCamarada = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const nome = String(fd.get("nome")||"").trim();
    const curso = String(fd.get("curso")||"").trim();
    const turnos = ["manha","tarde","noite"].filter(t=>fd.get(t)) as Turno[];
    
    const horarios_disponiveis: HorarioDisponivel[] = [];
    ["seg", "ter", "qua", "qui", "sex"].forEach(dia => {
      ["manha", "tarde", "noite"].forEach(turno => {
        if (fd.get(`${dia}-${turno}`)) {
          horarios_disponiveis.push({ dia: dia as Dia, turno: turno as Turno });
        }
      });
    });

    if(!nome) return notifyErr("Informe o nome.");
    const { data, error } = await supabase.from("camaradas").insert({ nome, curso, turnos, horarios_disponiveis }).select();
    if(error) return notifyErr(error.message);
    setCamaradas((p)=>[...(data as any), ...p]);
    e.currentTarget?.reset();
    notifyOk("Camarada cadastrado!");
  };

  const deleteCamarada = async (id: string, nome: string) => {
    if(!window.confirm(`Excluir ${nome}?`)) return;
    const { error } = await supabase.from("camaradas").delete().eq("id", id);
    if(error) return notifyErr(error.message);
    setCamaradas(p=>p.filter(c=>c.id!==id));
    notifyOk("Excluído.");
  };

  const addInstituto = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const nome = String(fd.get("instituto")||"").trim();
    if(!nome) return notifyErr("Informe o instituto.");
    const { data, error } = await supabase.from("institutos").insert({ nome }).select();
    if(error) return notifyErr(error.message);
    setInstitutos((p)=>[...(data as any), ...p]);
    e.currentTarget?.reset();
    notifyOk("Adicionado!");
  };

  const deleteInstituto = async (id: string, nome: string) => {
    if(!window.confirm(`Excluir ${nome} e suas escalas?`)) return;
    await supabase.from("escala").delete().eq("instituto_id", id);
    const { error } = await supabase.from("institutos").delete().eq("id", id);
    if(error) return notifyErr(error.message);
    setInstitutos(p=>p.filter(i=>i.id!==id));
    setEscala(p=>p.filter(e=>e.instituto_id!==id));
    notifyOk("Excluído.");
  };

  const addEscala = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const camarada_id = String(fd.get("camarada")||"");
    const instituto_id = String(fd.get("inst")||"");
    const turno = String(fd.get("turno")||"") as Turno;
    const dia = String(fd.get("dia")||"") as Dia;
    if(!camarada_id||!instituto_id||!turno||!dia) return notifyErr("Preencha tudo.");
    const { data, error } = await supabase.from("escala").insert({ camarada_id, instituto_id, turno, dia }).select();
    if(error) return notifyErr(error.message);
    setEscala((p)=>[...(data as any), ...p]);
    e.currentTarget?.reset();
    notifyOk("Atribuído!");
  };

  const removeEscala = async (id: string) => {
    const { error } = await supabase.from("escala").delete().eq("id", id);
    if(error) return notifyErr(error.message);
    setEscala(p=>p.filter(e=>e.id!==id));
    notifyOk("Removido.");
  };

  const addVenda = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = String(fd.get("data")||"");
    const unidades = Number(fd.get("unidades")||0);
    const preco_unitario = Number(fd.get("preco")||0);
    if(!data) return notifyErr("Data?");
    const { data: d, error } = await supabase.from("vendas_diarias").insert({ data, unidades, preco_unitario }).select();
    if(error) return notifyErr(error.message);
    setVendas((p)=>[...(d as any), ...p]);
    speakSale(`${unidades} unidades`);
    e.currentTarget?.reset();
    notifyOk("Venda registrada!");
  };

  const addCustoFixo = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const nome = String(fd.get("nome")||"").trim();
    const valor_mensal = Number(fd.get("valor")||0);
    const { data, error } = await supabase.from("custos_fixos").insert({ nome, valor_mensal }).select();
    if(error) return notifyErr(error.message);
    setCustosFixos(p=>[...(data as any), ...p]);
    e.currentTarget?.reset();
  };

  const deleteCustoFixo = async (id: string) => {
    await supabase.from("custos_fixos").delete().eq("id", id);
    setCustosFixos(p=>p.filter(c=>c.id!==id));
  };

  const addCA = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      nome: String(fd.get("nome")||""),
      status: String(fd.get("status")||"neutro") as any,
      relacao: String(fd.get("relacao")||""),
      humor: String(fd.get("humor")||""),
      desafios: String(fd.get("desafios")||""),
      oportunidades: String(fd.get("oportunidades")||""),
    };
    const { data, error } = await supabase.from("cas").insert(payload).select();
    if(error) return notifyErr(error.message);
    setCas(p=>[...(data as any), ...p]);
    e.currentTarget.reset();
  };

  const updateCA = async (id: string, patch: any) => {
    await supabase.from("cas").update(patch).eq("id", id);
    setCas(p=>p.map(ca=>ca.id===id? {...ca, ...patch}: ca));
  };

  const deleteCA = async (id: string) => {
    await supabase.from("cas").delete().eq("id", id);
    setCas(p=>p.filter(ca=>ca.id!==id));
  };

  const addAgenda = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if(!dataAgenda) return notifyErr("Data?");
    const payload = { data: dataAgenda.toISOString().slice(0,10), titulo: String(fd.get("titulo")||""), notas: String(fd.get("notas")||"") };
    const { data, error } = await supabase.from("agenda").insert(payload).select();
    if(error) return notifyErr(error.message);
    setAgenda(p=>[...(data as any), ...p]);
    setDataAgenda(undefined);
    e.currentTarget.reset();
  };

  const updateEscalaCamarada = async (id: string, camarada_id: string) => {
    await supabase.from("escala").update({ camarada_id }).eq("id", id);
    setEscala(p=>p.map(e=>e.id===id? {...e, camarada_id}: e));
  };

  const updateEscalaInstituto = async (id: string, instituto_id: string) => {
    await supabase.from("escala").update({ instituto_id }).eq("id", id);
    setEscala(p=>p.map(e=>e.id===id? {...e, instituto_id}: e));
  };

  const dias: Dia[] = ["seg","ter","qua","qui","sex"];
  const labelDia: Record<Dia,string> = { seg: "Seg", ter: "Ter", qua: "Qua", qui: "Qui", sex: "Sex" };
  const labelTurno: Record<Turno,string> = { manha: "Manhã", tarde: "Tarde", noite: "Noite" };

  const getCamaradasDisponiveis = (dia: Dia, turno: Turno) => {
    return camaradas.filter(c => {
      if(!c.horarios_disponiveis || c.horarios_disponiveis.length === 0) return c.turnos?.includes(turno);
      return c.horarios_disponiveis.some(h => h.dia === dia && h.turno === turno);
    });
  };

  const escalaSemanal = useMemo(() => {
    const map: any = {};
    institutos.forEach(i => {
      map[i.id] = { seg: { manha: [], tarde: [], noite: [] }, ter: { manha: [], tarde: [], noite: [] }, qua: { manha: [], tarde: [], noite: [] }, qui: { manha: [], tarde: [], noite: [] }, sex: { manha: [], tarde: [], noite: [] } };
    });
    escala.forEach(e => {
      if(!e.dia) return;
      const nome = camaradas.find(c=>c.id===e.camarada_id)?.nome || "—";
      if(map[e.instituto_id]) map[e.instituto_id][e.dia][e.turno].push({ id: e.id, camarada_id: e.camarada_id, nome });
    });
    return map;
  }, [escala, institutos, camaradas]);

  return (
    <main className="min-h-screen bg-[#fdfcf0] text-foreground font-serif selection:bg-primary/20">
      <header className="container py-12 border-b-8 border-double border-foreground mb-8">
        <div className="flex flex-col md:flex-row items-center justify-between border-b-2 border-foreground pb-6 mb-6">
          <div className="hidden md:block text-sm font-black uppercase tracking-[0.2em] border-2 border-foreground px-3 py-1">Vol. IV • No. 041</div>
          <h1 className="text-7xl md:text-9xl font-black tracking-tighter text-center uppercase leading-none drop-shadow-sm">
            Marx Gestão
          </h1>
          <div className="flex flex-col items-center md:items-end">
            <div className="text-xl font-bold tracking-tighter uppercase">{todayLabel}</div>
            <div className="flex items-center gap-4 mt-2">
              <ThemeToggle />
            </div>
          </div>
        </div>
        <div className="flex flex-col md:flex-row justify-between items-center text-xs font-black uppercase tracking-widest py-3 border-y-2 border-foreground mt-2 italic">
          <span className="flex items-center gap-2"><Clock size={14}/> Crônicas Diárias da Produção</span>
          <span className="hidden md:inline border-x-2 border-foreground px-8 mx-4">Onde o Pão Encontra a Teoria da Mais-Valia</span>
          <span className="flex items-center gap-2">Edição de Balanço Mensal <ArrowRight size={14}/></span>
        </div>
      </header>

      <section className="container pb-20">
        <Tabs defaultValue="protocolo" className="w-full">
          <TabsList className="flex flex-wrap h-auto gap-4 bg-transparent border-b-4 border-foreground mb-12 pb-4 rounded-none justify-start px-0 border-t-0 border-x-0">
            {["protocolo", "camaradas", "estoque", "financeiro", "vendas", "entradas", "integracao", "cas", "escala", "agenda"].map((tab) => (
              <TabsTrigger 
                key={tab}
                value={tab} 
                className="font-black text-xl uppercase tracking-tight border-b-4 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground rounded-none px-0 py-2 transition-all opacity-40 data-[state=active]:opacity-100 hover:opacity-100"
              >
                {tab === 'protocolo' ? 'Checklist' : (tab.charAt(0).toUpperCase() + tab.slice(1))}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="protocolo" className="mt-0 focus-visible:outline-none">
            <PageTurn pageKey="protocolo">
              <div className="max-w-4xl mx-auto border-4 border-foreground p-8 bg-background shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
                <header className="border-b-4 border-foreground pb-6 mb-8 text-center">
                  <h2 className="text-5xl font-black uppercase tracking-tighter italic">Protocolo de Operação</h2>
                  <p className="text-lg opacity-80 mt-2 font-bold uppercase italic tracking-widest">Lista de Verificação Obrigatória do Turno</p>
                </header>
                <ShiftChecklist onComplete={() => notifyOk("Protocolo arquivado com sucesso.")} />
              </div>
            </PageTurn>
          </TabsContent>

          <TabsContent value="camaradas" className="mt-0 focus-visible:outline-none">
            <PageTurn pageKey="camaradas">
              <div className="grid md:grid-cols-12 gap-8">
                <div className="md:col-span-12 lg:col-span-4 space-y-8">
                  <Card className="border-4 border-foreground rounded-none bg-background shadow-none">
                    <CardHeader className="border-b-4 border-foreground bg-foreground text-background py-4">
                      <CardTitle className="text-2xl font-black uppercase italic flex items-center gap-3">
                        <Users size={24}/> Alistamento
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-8">
                      <form onSubmit={addCamarada} className="space-y-6">
                        <div className="space-y-2">
                          <Label className="text-xs font-black uppercase tracking-widest">Nome do Camarada</Label>
                          <Input name="nome" placeholder="Ex: Lucas" className="rounded-none border-2 border-foreground h-12 font-bold text-lg focus-visible:ring-0" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-black uppercase tracking-widest">Faculdade/Curso</Label>
                          <Input name="curso" placeholder="Ex: História" className="rounded-none border-2 border-foreground h-12 italic focus-visible:ring-0" />
                        </div>
                        
                        <div className="space-y-4 pt-4 border-t-2 border-foreground/10">
                          <Label className="text-xs font-black uppercase tracking-widest block mb-4">Escala de Disponibilidade</Label>
                          <div className="grid grid-cols-5 gap-2">
                            {dias.map(d => (
                              <div key={d} className="space-y-2 text-center border-r border-foreground/10 last:border-0 pr-1">
                                <span className="text-[10px] font-black uppercase opacity-60 block mb-1">{labelDia[d]}</span>
                                {["manha", "tarde", "noite"].map(t => (
                                  <div key={t} className="flex items-center justify-between gap-1 mb-1">
                                    <span className="text-[8px] font-black opacity-40 uppercase">{t === 'manha' ? 'M' : t === 'tarde' ? 'T' : 'N'}</span>
                                    <input type="checkbox" name={`${d}-${t}`} className="w-4 h-4 accent-foreground cursor-pointer border-2 border-foreground rounded-none" title={`${labelDia[d]} - ${labelTurno[t as Turno]}`} />
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        </div>

                        <Button type="submit" className="w-full h-16 rounded-none border-4 border-foreground bg-foreground text-background font-black text-xl uppercase italic hover:bg-background hover:text-foreground transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-none translate-x-[-2px] translate-y-[-2px] hover:translate-x-0 hover:translate-y-0 active:scale-95 mt-4">
                          Comissionar Quadro
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </div>

                <div className="md:col-span-12 lg:col-span-8">
                  <div className="border-4 border-foreground bg-background p-1 min-h-[600px]">
                    <div className="border-2 border-foreground p-6">
                      <header className="border-b-2 border-foreground mb-6 pb-4 flex justify-between items-end">
                        <h3 className="text-4xl font-black uppercase tracking-tighter">Quadro de Camaradas</h3>
                        <span className="text-xs font-bold uppercase opacity-60">Total de membros: {camaradas.length}</span>
                      </header>
                      <div className="grid md:grid-cols-2 gap-6">
                        {camaradas.map(c => (
                          <div key={c.id} className="border-2 border-foreground p-4 relative group hover:bg-primary/5 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="text-2xl font-black uppercase leading-none mb-1">{c.nome}</h4>
                                <p className="text-xs font-bold uppercase italic opacity-70 flex items-center gap-1"><GraduationCap size={12}/> {c.curso}</p>
                              </div>
                              <Button variant="ghost" size="sm" className="h-8 w-8 rounded-none border-2 border-transparent hover:border-foreground opacity-0 group-hover:opacity-100 transition-all font-black text-xs" onClick={() => deleteCamarada(c.id, c.nome)}>✕</Button>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-4">
                              {c.horarios_disponiveis?.map((h, i) => (
                                <span key={i} className="text-[9px] font-black uppercase bg-foreground text-background px-1.5 py-0.5">{labelDia[h.dia]} {labelTurno[h.turno].charAt(0)}</span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </PageTurn>
          </TabsContent>

          <TabsContent value="estoque" className="mt-0 focus-visible:outline-none">
            <PageTurn pageKey="estoque">
              <div className="space-y-12">
                <header className="max-w-4xl mx-auto text-center border-double border-b-8 border-foreground pb-8">
                  <h2 className="text-6xl font-black uppercase tracking-tighter italic mb-4">Armazém e Suprimentos</h2>
                  <p className="text-xl font-bold uppercase tracking-widest max-w-2xl mx-auto italic opacity-70">Controle rigoroso das matérias-primas para evitar o desperdício do valor-trabalho.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  <div className="lg:col-span-1">
                    <Card className="border-4 border-foreground rounded-none bg-background shadow-none h-full sticky top-8">
                      <CardHeader className="bg-foreground text-background py-4">
                        <CardTitle className="text-xl font-black uppercase italic flex items-center gap-3"><Package size={20}/> Novo Registro</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-8">
                        <form onSubmit={(e) => {
                          e.preventDefault();
                          const fd = new FormData(e.currentTarget);
                          const produto = String(fd.get('produto'));
                          const uso = Number(fd.get('uso'));
                          const unid = Number(fd.get('unid'));
                          if(produto) {
                            setEstoque([...estoque, { id: crypto.randomUUID(), produto, uso_semanal: uso, unidades: unid }]);
                            e.currentTarget.reset();
                            notifyOk("Insumo catalogado.");
                          }
                        }} className="space-y-6">
                          <div className="space-y-1">
                            <Label className="text-[10px] font-black uppercase tracking-widest">Produto</Label>
                            <Input name="produto" className="rounded-none border-2 border-foreground font-bold h-12" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] font-black uppercase tracking-widest">Uso Semanal</Label>
                            <Input name="uso" type="number" className="rounded-none border-2 border-foreground h-12 font-serif text-xl italic" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] font-black uppercase tracking-widest">Qtd Atual (Unid)</Label>
                            <Input name="unid" type="number" className="rounded-none border-2 border-foreground h-12 font-serif text-xl italic" />
                          </div>
                          <Button type="submit" className="w-full h-14 rounded-none border-4 border-foreground bg-foreground text-background font-black uppercase italic hover:bg-background hover:text-foreground transition-all">Incorporar ao Estoque</Button>
                        </form>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="lg:col-span-3 grid md:grid-cols-2 gap-6">
                    {estoque.map(item => (
                      <div key={item.id} className="border-4 border-foreground bg-background p-6 flex flex-col justify-between group relative overflow-hidden">
                        <div className="absolute top-(-20px) right-(-20px) text-9xl font-black opacity-[0.03] pointer-events-none uppercase italic">{item.produto.charAt(0)}</div>
                        <div className="flex justify-between items-start mb-8 border-b-2 border-foreground pb-4">
                          <h4 className="text-4xl font-black uppercase tracking-tighter leading-none italic">{item.produto}</h4>
                          <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 h-8 w-8 p-0 rounded-none border-2 border-foreground" onClick={() => setEstoque(estoque.filter(i => i.id !== item.id))}>✕</Button>
                        </div>
                        <div className="grid grid-cols-2 gap-8 mb-8">
                          <div className="space-y-2">
                            <Label className="text-xs font-black uppercase tracking-widest opacity-60">Uso Semanal</Label>
                            <div className="flex items-center gap-2 border-b-4 border-foreground/20 pb-2">
                              <Input 
                                value={item.uso_semanal}
                                type="number"
                                onChange={(e) => setEstoque(estoque.map(i => i.id === item.id ? { ...i, uso_semanal: Number(e.target.value) } : i))}
                                className="border-none bg-transparent h-12 p-0 text-4xl font-serif italic text-center focus-visible:ring-0"
                              />
                              <span className="text-xs font-black uppercase pt-4">unid</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-black uppercase tracking-widest opacity-60">Unidades Disponíveis</Label>
                            <div className="flex items-center gap-2 border-b-4 border-foreground/20 pb-2">
                              <Input 
                                value={item.unidades}
                                type="number"
                                onChange={(e) => setEstoque(estoque.map(i => i.id === item.id ? { ...i, unidades: Number(e.target.value) } : i))}
                                className="border-none bg-transparent h-12 p-0 text-4xl font-serif italic text-center focus-visible:ring-0"
                              />
                              <span className="text-xs font-black uppercase pt-4">unid</span>
                            </div>
                          </div>
                        </div>
                        <div className="bg-foreground text-background p-4 flex justify-between items-center text-sm font-black uppercase tracking-widest italic">
                          <span>Provisão Estimada:</span>
                          <span className="text-2xl font-black">{(item.unidades / (item.uso_semanal || 1)).toFixed(1)} <span className="text-xs">semanas</span></span>
                        </div>
                        {item.unidades < item.uso_semanal && (
                          <div className="absolute top-0 left-0 bg-red-600 text-white w-full text-center text-[10px] font-black uppercase py-0.5 transform -rotate-45 translate-x-[-35%] translate-y-[25px]">RUPTURA IMINENTE</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </PageTurn>
          </TabsContent>

          <TabsContent value="financeiro" className="mt-0 focus-visible:outline-none">
            <PageTurn pageKey="financeiro">
              <div className="grid lg:grid-cols-12 gap-8">
                <div className="lg:col-span-4 space-y-8">
                  <Card className="border-4 border-foreground rounded-none bg-background shadow-none">
                    <CardHeader className="bg-foreground text-background py-4">
                      <CardTitle className="text-2xl font-black uppercase italic">Balanço do Mês</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-8 space-y-6">
                      <div className="flex justify-between items-end border-b-2 border-foreground pb-1">
                        <span className="text-sm font-black uppercase tracking-widest">Receita</span>
                        <span className="text-3xl font-black">R$ {receitaMes.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-end border-b-2 border-foreground pb-1">
                        <span className="text-sm font-black uppercase tracking-widest">Custos Variáveis</span>
                        <span className="text-xl font-bold italic">R$ {custoVariavelMes.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-end border-b-2 border-foreground pb-1">
                        <span className="text-sm font-black uppercase tracking-widest">Custos Fixos</span>
                        <span className="text-xl font-bold italic">R$ {totalCustosFixos.toFixed(2)}</span>
                      </div>
                      <div className="bg-foreground text-background p-6 text-center mt-8">
                        <span className="block text-xs font-black uppercase tracking-[0.2em] mb-2">Lucro Líquido Residual</span>
                        <span className="text-5xl font-black italic">R$ {lucroLiquidoMes.toFixed(2)}</span>
                      </div>
                      <div className="pt-4 text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Preço Médio Praticado: R$ {precoMedio.toFixed(2)} / Unidade</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-4 border-foreground rounded-none bg-background shadow-none">
                    <CardHeader className="border-b-4 border-foreground"><CardTitle className="uppercase italic font-black">Metas e Parâmetros</CardTitle></CardHeader>
                    <CardContent className="pt-6 space-y-4">
                      <div className="space-y-1">
                        <Label className="text-xs font-black uppercase">Meta Lucro Bruto</Label>
                        <Input type="number" value={metaLucroBruto ?? ''} onChange={(e)=> setMetaLucroBruto(e.target.value===''? undefined : Number(e.target.value))} className="rounded-none border-2 border-foreground font-serif italic text-lg" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-black uppercase">Fator de Override (CV/unid)</Label>
                        <Input type="number" value={custoVariavelOverride ?? ''} onChange={(e)=> setCustoVariavelOverride(e.target.value===''? undefined : Number(e.target.value))} className="rounded-none border-2 border-foreground font-serif italic text-lg" placeholder={`Base: R$ ${custoVariavelPorUnidade.toFixed(2)}`} />
                      </div>
                      <Button className="w-full h-12 rounded-none bg-foreground text-background font-black uppercase italic" onClick={()=> notifyOk("Parâmetros recalibrados.")}>Aplicar Teoria</Button>
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
          </TabsContent>

          <TabsContent value="vendas" className="mt-0 focus-visible:outline-none">
            <PageTurn pageKey="vendas">
              <Suspense fallback={<div className="p-20 text-center font-black uppercase italic text-4xl animate-pulse">Consultando o Mercado...</div>}>
                <ProjecaoVendas />
              </Suspense>
            </PageTurn>
          </TabsContent>

          <TabsContent value="entradas" className="mt-0 focus-visible:outline-none">
             <PageTurn pageKey="entradas">
               <EntradasPanel />
             </PageTurn>
          </TabsContent>

          <TabsContent value="integracao" className="mt-0 focus-visible:outline-none">
            <PageTurn pageKey="integracao">
              <Suspense fallback={<div className="p-20 text-center font-black uppercase italic text-4xl animate-pulse">Sincronizando Sistemas...</div>}>
                <IntegracaoVendas />
              </Suspense>
            </PageTurn>
          </TabsContent>

          <TabsContent value="cas" className="mt-0 focus-visible:outline-none">
            <PageTurn pageKey="cas">
              <div className="border-4 border-foreground bg-background p-8">
                <header className="border-b-4 border-foreground mb-8 pb-4">
                  <h2 className="text-5xl font-black uppercase tracking-tighter">Mapeamento de Aliados (CAs)</h2>
                  <p className="italic font-bold opacity-70">Monitoramento constante da recepção acadêmica e potencial de repasse.</p>
                </header>
                <form onSubmit={addCA} className="grid md:grid-cols-6 gap-4 mb-12 bg-muted/30 p-4 border-2 border-foreground">
                  <div className="md:col-span-2"><Label className="text-[10px] font-black uppercase">Nome do CA</Label><Input name="nome" className="rounded-none border-2 border-foreground h-10" /></div>
                  <div>
                    <Label className="text-[10px] font-black uppercase">Status</Label>
                    <Select name="status" defaultValue="neutro">
                      <SelectTrigger className="rounded-none border-2 border-foreground h-10"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="aliado">Aliado</SelectItem><SelectItem value="neutro">Neutro</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-3"><Label className="text-[10px] font-black uppercase">Relação / Humor / Desafios</Label><Input name="relacao" placeholder="Ex: Estável / Ativo / Burocracia" className="rounded-none border-2 border-foreground h-10 italic" /></div>
                  <Button type="submit" className="md:col-span-6 h-12 rounded-none border-4 border-foreground bg-foreground text-background font-black uppercase italic shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">Mapear Entidade</Button>
                </form>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {cas.map(ca => {
                    const isEditing = editingCA === ca.id;
                    return (
                      <div key={ca.id} className="border-2 border-foreground p-4 bg-background hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all flex flex-col justify-between">
                        {isEditing ? (
                          <div className="space-y-3">
                            <Input 
                              defaultValue={ca.nome} 
                              className="rounded-none border-2 border-foreground font-black uppercase h-8"
                              onBlur={(e) => updateCA(ca.id, { nome: e.target.value })}
                            />
                            <Select 
                              defaultValue={ca.status} 
                              onValueChange={(v) => updateCA(ca.id, { status: v })}
                            >
                              <SelectTrigger className="rounded-none border-2 border-foreground h-8"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="aliado">Aliado</SelectItem>
                                <SelectItem value="neutro">Neutro</SelectItem>
                              </SelectContent>
                            </Select>
                            <Input 
                              defaultValue={ca.relacao} 
                              className="rounded-none border-2 border-foreground italic h-8"
                              onBlur={(e) => updateCA(ca.id, { relacao: e.target.value })}
                            />
                            <Button 
                              className="w-full h-8 rounded-none bg-foreground text-background font-black text-[10px] uppercase"
                              onClick={() => setEditingCA(null)}
                            >
                              Salvar
                            </Button>
                          </div>
                        ) : (
                          <>
                            <div className="flex justify-between items-start mb-4 border-b border-foreground/20 pb-2">
                              <h4 className="text-2xl font-black uppercase leading-none">{ca.nome}</h4>
                              <Badge className={cn("rounded-none font-black uppercase text-[10px]", ca.status === 'aliado' ? 'bg-green-600' : 'bg-foreground')}>{ca.status}</Badge>
                            </div>
                            <div className="space-y-2 mb-4">
                              <p className="text-sm italic"><strong>Relação:</strong> {ca.relacao}</p>
                              <p className="text-sm"><strong>Oportunidades:</strong> {ca.oportunidades || '—'}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <Button variant="outline" size="sm" className="rounded-none border-2 border-foreground font-black text-[10px] uppercase" onClick={() => setEditingCA(ca.id)}>Editar</Button>
                              <Button variant="outline" size="sm" className="rounded-none border-2 border-foreground font-black text-[10px] uppercase hover:bg-red-600 hover:text-white" onClick={() => deleteCA(ca.id)}>Remover</Button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </PageTurn>
          </TabsContent>

          <TabsContent value="escala" className="mt-0 focus-visible:outline-none">
            <PageTurn pageKey="escala">
               <div className="space-y-12">
                  <header className="border-double border-b-8 border-foreground pb-8 text-center max-w-4xl mx-auto">
                    <h2 className="text-6xl font-black uppercase tracking-tighter italic italic">Plano de Escalonamento</h2>
                    <p className="text-xl font-bold uppercase tracking-widest italic opacity-70">Distribuição racional da força de trabalho entre os polos acadêmicos.</p>
                  </header>

                  <div className="grid lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-4 space-y-8">
                      <Card className="border-4 border-foreground rounded-none bg-background shadow-none">
                        <CardHeader className="bg-foreground text-background py-4"><CardTitle className="text-xl font-black uppercase italic">Gerenciar Institutos</CardTitle></CardHeader>
                        <CardContent className="pt-8 space-y-4">
                          <form onSubmit={addInstituto} className="flex gap-2">
                            <Input name="instituto" placeholder="Nome do instituto" className="rounded-none border-2 border-foreground" />
                            <Button type="submit" className="rounded-none bg-foreground text-background font-black">⊕</Button>
                          </form>
                          <div className="space-y-2">
                            {institutos.map(i => (
                              <div key={i.id} className="flex justify-between items-center bg-muted/30 p-2 border border-foreground/20">
                                <span className="font-bold uppercase text-sm tracking-tighter">{i.nome}</span>
                                <button onClick={() => deleteInstituto(i.id, i.nome)} className="text-red-600 font-bold hover:scale-110">✕</button>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-4 border-foreground rounded-none bg-background shadow-none">
                        <CardHeader className="bg-foreground text-background py-4"><CardTitle className="text-xl font-black uppercase italic">Designação</CardTitle></CardHeader>
                        <CardContent className="pt-8">
                          <form onSubmit={addEscala} className="space-y-4">
                            <select name="inst" className="w-full border-2 border-foreground h-12 px-3 font-bold bg-background rounded-none">
                              <option value="">Instituto</option>
                              {institutos.map(i=> <option key={i.id} value={i.id}>{i.nome}</option>)}
                            </select>
                            <div className="grid grid-cols-2 gap-2">
                              <select name="dia" className="border-2 border-foreground h-12 px-3 italic bg-background rounded-none">
                                <option value="">Dia</option>
                                <option value="seg">Segunda</option><option value="ter">Terça</option><option value="qua">Quarta</option><option value="qui">Quinta</option><option value="sex">Sexta</option>
                              </select>
                              <select name="turno" className="border-2 border-foreground h-12 px-3 italic bg-background rounded-none">
                                <option value="">Turno</option>
                                <option value="manha">Manhã</option><option value="tarde">Tarde</option><option value="noite">Noite</option>
                              </select>
                            </div>
                            <select name="camarada" className="w-full border-2 border-foreground h-12 px-3 font-bold bg-background rounded-none">
                              <option value="">Camarada</option>
                              {camaradas.map(c=> <option key={c.id} value={c.id}>{c.nome}</option>)}
                            </select>
                            <Button type="submit" className="w-full h-14 bg-foreground text-background rounded-none font-black uppercase italic">Vincular</Button>
                          </form>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="lg:col-span-8">
                       <div className="grid gap-8">
                         {institutos.map(i => (
                           <div key={i.id} className="border-4 border-foreground bg-background p-6">
                             <h4 className="text-3xl font-black uppercase italic border-b-2 border-foreground mb-4 pb-2">{i.nome}</h4>
                             <div className="grid grid-cols-6 gap-2">
                               <div className="bg-foreground text-background text-[10px] font-black uppercase flex items-center justify-center h-8">Turno</div>
                               {dias.map(d => <div key={d} className="bg-muted text-foreground text-[10px] font-black uppercase flex items-center justify-center h-8">{labelDia[d]}</div>)}
                               
                               {(["manha", "tarde", "noite"] as Turno[]).map(t => (
                                 <React.Fragment key={t}>
                                   <div className="text-[10px] font-black uppercase border border-foreground/20 flex items-center justify-center h-16 italic">{labelTurno[t]}</div>
                                   {dias.map(d => (
                                     <div key={d} className="border border-foreground/20 p-1 flex flex-col gap-1 overflow-y-auto h-16">
                                       {escalaSemanal[i.id]?.[d]?.[t]?.map((a: any) => (
                                         <Badge key={a.id} className="rounded-none bg-foreground text-background text-[9px] font-black uppercase flex justify-between items-center pr-1">
                                           <span className="truncate">{a.nome}</span>
                                           <button onClick={() => removeEscala(a.id)} className="ml-1 hover:text-red-400">✕</button>
                                         </Badge>
                                       ))}
                                     </div>
                                   ))}
                                 </React.Fragment>
                               ))}
                             </div>
                           </div>
                         ))}
                       </div>
                    </div>
                  </div>
               </div>
            </PageTurn>
          </TabsContent>

          <TabsContent value="agenda" className="mt-0 focus-visible:outline-none">
            <PageTurn pageKey="agenda">
              <div className="max-w-5xl mx-auto border-4 border-foreground bg-background shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] p-8">
                <header className="border-b-4 border-foreground mb-12 pb-4">
                  <h2 className="text-5xl font-black uppercase tracking-tighter">Agenda do Movimento</h2>
                  <p className="italic font-bold opacity-70">Eventos, reuniões e datas críticas para a gestão da padaria.</p>
                </header>
                <div className="grid md:grid-cols-12 gap-12">
                  <div className="md:col-span-4">
                    <form onSubmit={addAgenda} className="space-y-6">
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest">Compromisso</Label>
                        <Input name="titulo" className="rounded-none border-2 border-foreground h-12 font-bold" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest">Data</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full rounded-none border-2 border-foreground h-12 justify-start font-bold">
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {dataAgenda ? format(dataAgenda, "dd/MM/yyyy") : "Selecionar"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 rounded-none border-2 border-foreground"><Calendar mode="single" selected={dataAgenda} onSelect={setDataAgenda} /></PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest">Notas</Label>
                        <Input name="notes" className="rounded-none border-2 border-foreground h-12 italic" />
                      </div>
                      <Button type="submit" className="w-full h-16 rounded-none bg-foreground text-background font-black uppercase italic tracking-tighter text-xl border-4 border-foreground shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-none transition-all">Consignar Evento</Button>
                    </form>
                  </div>
                  <div className="md:col-span-8">
                    <div className="space-y-4">
                       {agenda.sort((a,b)=>a.data.localeCompare(b.data)).map(a => {
                         const past = new Date(a.data) < new Date(new Date().toISOString().slice(0,10));
                         return (
                           <div key={a.id} className={cn("border-2 border-foreground p-4 flex gap-6 items-center bg-background", past && "opacity-40 grayscale")}>
                             <div className="text-center min-w-[80px] border-r-2 border-foreground pr-6">
                               <div className="text-3xl font-black leading-none">{a.data.split('-')[2]}</div>
                               <div className="text-xs font-black uppercase">{a.data.split('-')[1]}</div>
                             </div>
                             <div>
                               <h4 className="text-2xl font-black uppercase italic tracking-tighter">{a.titulo}</h4>
                               <p className="text-xs font-bold opacity-60 uppercase tracking-widest">{a.notas || 'Sem anotações complementares'}</p>
                             </div>
                           </div>
                         );
                       })}
                    </div>
                  </div>
                </div>
              </div>
            </PageTurn>
          </TabsContent>
        </Tabs>
      </section>
    </main>
  );
};

export default Index;
