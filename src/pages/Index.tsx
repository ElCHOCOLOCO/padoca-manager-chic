import { useEffect, useMemo, useState, useCallback } from "react";
// Supabase: carregado dinamicamente para evitar erro quando não conectado
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
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import InsumosTabela14 from "@/components/finance/InsumosTabela14";
import EntradasPanel from "@/components/finance/EntradasPanel";
import IntegrationTab from "@/components/integration/IntegrationTab";
import ThemeToggle from "@/components/ThemeToggle";
import { supabase as supabaseClient } from "@/integrations/supabase/client";
import React, { Suspense, lazy } from "react";

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

type Camarada = { 
  id: string; 
  nome: string; 
  curso: string; 
  turnos: Turno[];
  horariosDisponiveis?: HorarioDisponivel[];
};

const Index = () => {
  useEffect(() => {
    document.title = "Gestão de Padaria – Painel";
  }, []);
  const todayLabel = format(new Date(), "dd/MM/yyyy");

  // Estados gerais
  const [camaradas, setCamaradas] = useState<Camarada[]>([]);
  const [institutos, setInstitutos] = useState<{ id: string; nome: string }[]>([]);
  const [escala, setEscala] = useState<{ id: string; camarada_id: string; instituto_id: string; turno: Turno; dia?: Dia }[]>([]);
  const [insumos, setInsumos] = useState<{ id: string; nome: string; custo_unitario: number }[]>([]);
  const [custosFixos, setCustosFixos] = useState<{ id: string; nome: string; valor_mensal: number }[]>([]);
  const [vendas, setVendas] = useState<{ id: string; data: string; unidades: number; preco_unitario: number }[]>([]);
  const [cas, setCas] = useState<{ id: string; nome: string; status: "aliado" | "neutro"; relacao: string; humor: string; desafios: string; oportunidades: string }[]>([]);
  const [agenda, setAgenda] = useState<{ id: string; data: string; titulo: string; notas?: string }[]>([]);


const [metaLucroBruto, setMetaLucroBruto] = useState<number | undefined>(undefined);
const [metaLucroLiquido, setMetaLucroLiquido] = useState<number | undefined>(undefined);
const [custoVariavelOverride, setCustoVariavelOverride] = useState<number | undefined>(undefined);

// Estados para edição
  const [editingCA, setEditingCA] = useState<string | null>(null);
  const [editingEscala, setEditingEscala] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'camaradas' | 'institutos' | 'turnos' | 'estatisticas'>('camaradas');

  const supabase: any = supabaseClient as any;

  // Carregar dados
  const loadAll = useCallback(async () => {
    try {
      const tables = [
        supabase.from("camaradas").select("id,nome,curso,turnos,horarios_disponiveis"),
        supabase.from("institutos").select("id,nome"),
        supabase.from("escala").select("id,camarada_id,instituto_id,turno,dia"),
        supabase.from("insumos").select("id,nome,custo_unitario"),
        supabase.from("custos_fixos").select("id,nome,valor_mensal"),
        supabase.from("vendas_diarias").select("id,data,unidades,preco_unitario"),
        supabase.from("cas").select("id,nome,status,relacao,humor,desafios,oportunidades"),
        supabase.from("agenda").select("id,data,titulo,notas"),
      ];
      const [c1,c2,c3,c4,c5,c6,c7,c8] = await Promise.all(tables);
      if (!c1.error && c1.data) setCamaradas(c1.data as any);
      if (!c2.error && c2.data) setInstitutos(c2.data as any);
      if (!c3.error && c3.data) setEscala(c3.data as any);
      if (!c4.error && c4.data) setInsumos(c4.data as any);
      if (!c5.error && c5.data) setCustosFixos(c5.data as any);
      if (!c6.error && c6.data) setVendas(c6.data as any);
      if (!c7.error && c7.data) setCas(c7.data as any);
      if (!c8.error && c8.data) setAgenda(c8.data as any);
    } catch (e) {
      console.warn("Conecte o Supabase para sincronizar dados.");
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
    const turnos = ["manha","tarde","noite"].filter(t=>fd.get(t));
    
    // Coletar horários disponíveis específicos
    const horariosDisponiveis: HorarioDisponivel[] = [];
    const dias: Dia[] = ["seg", "ter", "qua", "qui", "sex"];
    
    dias.forEach(dia => {
      turnos.forEach(turno => {
        const checkboxName = `${dia}-${turno}`;
        if (fd.get(checkboxName)) {
          horariosDisponiveis.push({ dia, turno });
        }
      });
    });
    
    if(!nome) return notifyErr("Informe o nome.");
    if(turnos.length === 0) return notifyErr("Selecione pelo menos um turno.");
    if(horariosDisponiveis.length === 0) return notifyErr("Selecione pelo menos um horário específico.");
    
    const { data, error } = await supabase.from("camaradas").insert({ 
      nome, 
      curso, 
      turnos,
      horarios_disponiveis: horariosDisponiveis
    }).select();
    if(error) return notifyErr(error.message);
    setCamaradas((p)=>[...(data as any), ...p]);
    e.currentTarget.reset();
    notifyOk("Camarada cadastrado!");
  };

  const addInstituto = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const nome = String(fd.get("instituto")||"").trim();
    if(!nome) return notifyErr("Informe o instituto.");
    const { data, error } = await supabase.from("institutos").insert({ nome }).select();
    if(error) return notifyErr(error.message);
    setInstitutos((p)=>[...(data as any), ...p]);
    e.currentTarget.reset();
    notifyOk("Instituto adicionado!");
  };

  const deleteInstituto = async (id: string, nome: string) => {
    // Verificar se há escalas associadas ao instituto
    const escalasAssociadas = escala.filter(e => e.instituto_id === id);
    
    if (escalasAssociadas.length > 0) {
      const confirmar = window.confirm(
        `O instituto "${nome}" possui ${escalasAssociadas.length} escala(s) atribuída(s).\n\n` +
        `Deseja excluir o instituto e todas as suas escalas?\n\n` +
        `Esta ação não pode ser desfeita.`
      );
      
      if (!confirmar) return;
      
      // Primeiro, excluir todas as escalas associadas
      const { error: errorEscalas } = await supabase
        .from("escala")
        .delete()
        .eq("instituto_id", id);
      
      if (errorEscalas) {
        notifyErr(`Erro ao excluir escalas: ${errorEscalas.message}`);
        return;
      }
      
      // Atualizar estado das escalas
      setEscala(prev => prev.filter(e => e.instituto_id !== id));
    } else {
      const confirmar = window.confirm(
        `Tem certeza que deseja excluir o instituto "${nome}"?\n\n` +
        `Esta ação não pode ser desfeita.`
      );
      
      if (!confirmar) return;
    }
    
    // Excluir o instituto
    const { error } = await supabase.from("institutos").delete().eq("id", id);
    if (error) {
      notifyErr(`Erro ao excluir instituto: ${error.message}`);
      return;
    }
    
    setInstitutos(prev => prev.filter(i => i.id !== id));
    notifyOk(`Instituto "${nome}" excluído com sucesso!`);
  };

  const addEscala = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const camarada_id = String(fd.get("camarada")||"");
    const instituto_id = String(fd.get("inst")||"");
    const turno = String(fd.get("turno")||"") as Turno;
    const dia = String(fd.get("dia")||"") as Dia;
    
    if(!camarada_id||!instituto_id||!turno||!dia) return notifyErr("Preencha todos os campos.");
    
    // Verificar se o camarada está disponível para este horário
    const camaradasDisponiveis = getCamaradasDisponiveis(dia, turno);
    const camaradaSelecionado = camaradasDisponiveis.find(c => c.id === camarada_id);
    
    if (!camaradaSelecionado) {
      notifyErr("Este camarada não está disponível para este horário.");
      return;
    }
    
    const { data, error } = await supabase.from("escala").insert({ camarada_id, instituto_id, turno, dia }).select();
    if(error) return notifyErr(error.message);
    setEscala((p)=>[...(data as any), ...p]);
    e.currentTarget.reset();
    notifyOk("Escala atribuída!");
  };

  const addInsumo = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const nome = String(fd.get("nome")||"").trim();
    const custo_unitario = Number(fd.get("custo")||0);
    if(!nome) return notifyErr("Informe o insumo.");
    const { data, error } = await supabase.from("insumos").insert({ nome, custo_unitario }).select();
    if(error) return notifyErr(error.message);
    setInsumos((p)=>[...(data as any), ...p]);
    e.currentTarget.reset();
    notifyOk("Insumo adicionado!");
  };

  const addCustoFixo = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const nome = String(fd.get("nome")||"").trim();
    const valor_mensal = Number(fd.get("valor")||0);
    if(!nome) return notifyErr("Informe o nome do custo.");
    const { data, error } = await supabase.from("custos_fixos").insert({ nome, valor_mensal }).select();
    if(error) return notifyErr(error.message);
    setCustosFixos((p)=>[...(data as any), ...p]);
    e.currentTarget.reset();
    notifyOk("Custo fixo adicionado!");
  };

  const updateInsumo = async (id: string, patch: Partial<{ nome: string; custo_unitario: number }>) => {
    const { error } = await supabase.from("insumos").update(patch).eq("id", id).select();
    if (error) return notifyErr(error.message);
    setInsumos((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
    notifyOk("Insumo atualizado!");
  };

  const deleteInsumo = async (id: string) => {
    const { error } = await supabase.from("insumos").delete().eq("id", id);
    if (error) return notifyErr(error.message);
    setInsumos((prev) => prev.filter((i) => i.id !== id));
    notifyOk("Insumo removido!");
  };

  const updateCustoFixo = async (id: string, patch: Partial<{ nome: string; valor_mensal: number }>) => {
    const { error } = await supabase.from("custos_fixos").update(patch).eq("id", id).select();
    if (error) return notifyErr(error.message);
    setCustosFixos((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    notifyOk("Custo fixo atualizado!");
  };

  const deleteCustoFixo = async (id: string) => {
    const { error } = await supabase.from("custos_fixos").delete().eq("id", id);
    if (error) return notifyErr(error.message);
    setCustosFixos((prev) => prev.filter((c) => c.id !== id));
    notifyOk("Custo fixo removido!");
  };

  const addVenda = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = String(fd.get("data")||"");
    const unidades = Number(fd.get("unidades")||0);
    const preco_unitario = Number(fd.get("preco")||0);
    if(!data) return notifyErr("Informe a data.");
    const { data: d, error } = await supabase.from("vendas_diarias").insert({ data, unidades, preco_unitario }).select();
    if(error) return notifyErr(error.message);
    setVendas((p)=>[...(d as any), ...p]);
    e.currentTarget.reset();
    notifyOk("Venda registrada!");
  };

  const addCA = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      nome: String(fd.get("nome")||"").trim(),
      status: String(fd.get("status")||"neutro") as "aliado"|"neutro",
      relacao: String(fd.get("relacao")||""),
      humor: String(fd.get("humor")||""),
      desafios: String(fd.get("desafios")||""),
      oportunidades: String(fd.get("oportunidades")||""),
    };
    if(!payload.nome) return notifyErr("Informe o nome do CA.");
    const { data, error } = await supabase.from("cas").insert(payload).select();
    if(error) return notifyErr(error.message);
    setCas((p)=>[...(data as any), ...p]);
    e.currentTarget.reset();
    notifyOk("CA cadastrado!");
  };

  const updateCA = async (id: string, payload: Partial<{ nome: string; status: "aliado" | "neutro"; relacao: string; humor: string; desafios: string; oportunidades: string }>) => {
    const { error } = await supabase.from("cas").update(payload).eq("id", id);
    if(error) return notifyErr(error.message);
    setCas((prev) => prev.map((ca) => (ca.id === id ? { ...ca, ...payload } : ca)));
    setEditingCA(null);
    notifyOk("CA atualizado!");
  };

  const deleteCA = async (id: string) => {
    const { error } = await supabase.from("cas").delete().eq("id", id);
    if(error) return notifyErr(error.message);
    setCas((prev) => prev.filter((ca) => ca.id !== id));
    notifyOk("CA removido!");
  };

  const updateEscala = async (id: string, payload: Partial<{ camarada_id: string; instituto_id: string; turno: Turno; dia?: Dia }>) => {
    const { error } = await supabase.from("escala").update(payload).eq("id", id);
    if(error) return notifyErr(error.message);
    setEscala((prev) => prev.map((e) => (e.id === id ? { ...e, ...payload } : e)));
    setEditingEscala(null);
    notifyOk("Escala atualizada!");
  };

  const updateEscalaCamarada = async (id: string, camarada_id: string) => {
    await updateEscala(id, { camarada_id });
  };

  const updateEscalaInstituto = async (id: string, instituto_id: string) => {
    await updateEscala(id, { instituto_id });
  };

  const [dataAgenda, setDataAgenda] = useState<Date | undefined>(undefined);
  const addAgenda = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if(!dataAgenda) return notifyErr("Escolha a data.");
    const payload = { data: dataAgenda.toISOString().slice(0,10), titulo: String(fd.get("titulo")||""), notas: String(fd.get("notas")||"") };
    if(!payload.titulo) return notifyErr("Informe o título.");
    const { data, error } = await supabase.from("agenda").insert(payload).select();
    if(error) return notifyErr(error.message);
    setAgenda((p)=>[...(data as any), ...p]);
    setDataAgenda(undefined);
    e.currentTarget.reset();
    notifyOk("Compromisso adicionado!");
  };

  // Escala semanal por instituto (seg-sex x turnos)
  const dias: Dia[] = ["seg","ter","qua","qui","sex"];
  const labelDia: Record<Dia,string> = { seg: "Seg", ter: "Ter", qua: "Qua", qui: "Qui", sex: "Sex" };
  const labelTurno: Record<Turno,string> = { manha: "Manhã", tarde: "Tarde", noite: "Noite" };

  // Função para filtrar camaradas disponíveis para um horário específico
  const getCamaradasDisponiveis = (dia: Dia, turno: Turno) => {
    return camaradas.filter(camarada => {
      // Se não tem horários específicos definidos, usa os turnos gerais
      if (!camarada.horariosDisponiveis || camarada.horariosDisponiveis.length === 0) {
        return camarada.turnos?.includes(turno);
      }
      
      // Verifica se o camarada tem disponibilidade para o horário específico
      return camarada.horariosDisponiveis.some(h => h.dia === dia && h.turno === turno);
    });
  };

  const assignEscala = async (instituto_id: string, dia: Dia, turno: Turno, camarada_id: string) => {
    if (!camarada_id) return;
    
    // Verificar se o camarada está disponível para este horário
    const camaradasDisponiveis = getCamaradasDisponiveis(dia, turno);
    const camaradaSelecionado = camaradasDisponiveis.find(c => c.id === camarada_id);
    
    if (!camaradaSelecionado) {
      notifyErr("Este camarada não está disponível para este horário.");
      return;
    }
    
    const { data, error } = await supabase.from("escala").insert({ instituto_id, dia, turno, camarada_id }).select();
    if (error) return notifyErr(error.message);
    setEscala((p)=>[...(data as any), ...p]);
    notifyOk("Atribuição adicionada!");
  };

  const removeEscala = async (id: string) => {
    const { error } = await supabase.from("escala").delete().eq("id", id);
    if (error) return notifyErr(error.message);
    setEscala((p)=> p.filter(e=> e.id !== id));
    notifyOk("Atribuição removida!");
  };

  const escalaSemanal = useMemo(()=>{
    const map: Record<string, Record<Dia, Record<Turno, { id: string; camarada_id: string; nome: string }[]>>> = {};
    institutos.forEach(i=>{
      map[i.id] = {
        seg: { manha: [], tarde: [], noite: [] },
        ter: { manha: [], tarde: [], noite: [] },
        qua: { manha: [], tarde: [], noite: [] },
        qui: { manha: [], tarde: [], noite: [] },
        sex: { manha: [], tarde: [], noite: [] },
      };
    });
    escala.forEach(e=>{
      if (!e.dia) return;
      const nome = camaradas.find(c=>c.id===e.camarada_id)?.nome || "—";
      if(map[e.instituto_id]){
        (map[e.instituto_id] as any)[e.dia][e.turno].push({ id: e.id, camarada_id: e.camarada_id, nome });
      }
    });
    return map;
  }, [escala, institutos, camaradas]);

  return (
    <main id="main" className="min-h-screen bg-background" role="main">
      <header className="container py-10 border-y">
        <div className="flex items-end justify-between">
          <h1 className="text-5xl font-bold font-playfair tracking-tight">Gestão de Padaria</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground" aria-live="polite">{todayLabel}</span>
            <ThemeToggle />
          </div>
        </div>
        <p className="text-muted-foreground mt-2">Cadastro, financeiro, CAs, escala e agenda — rápido e simples.</p>
      </header>

      <section className="container pb-20">
        <Tabs defaultValue="camaradas" className="w-full" activationMode="automatic">
          <TabsList className="grid grid-cols-8 sticky top-0 z-20 bg-background/80 backdrop-blur border-b rounded-none" role="tablist" aria-label="Seções do painel">
            <TabsTrigger value="camaradas">Camaradas</TabsTrigger>
            <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
            <TabsTrigger value="vendas">Vendas</TabsTrigger>
            <TabsTrigger value="entradas">Entradas</TabsTrigger>
            <TabsTrigger value="integracao">Integração</TabsTrigger>
            <TabsTrigger value="cas">CAs</TabsTrigger>
            <TabsTrigger value="escala">Escala</TabsTrigger>
            <TabsTrigger value="agenda">Agenda</TabsTrigger>
          </TabsList>


          <TabsContent value="camaradas" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Cadastro de camaradas</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Cadastre camaradas e defina seus horários específicos de disponibilidade
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={addCamarada} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="nome">Nome</Label>
                      <Input id="nome" name="nome" placeholder="Ex: João" />
                    </div>
                    <div>
                      <Label htmlFor="curso">Curso</Label>
                      <Input id="curso" name="curso" placeholder="Ex: Engenharia" />
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-base font-medium">Turnos Gerais</Label>
                    <p className="text-sm text-muted-foreground mb-3">Selecione os turnos que o camarada pode trabalhar</p>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <input type="checkbox" name="manha" id="manha" />
                        <Label htmlFor="manha">Manhã</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" name="tarde" id="tarde" />
                        <Label htmlFor="tarde">Tarde</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" name="noite" id="noite" />
                        <Label htmlFor="noite">Noite</Label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-base font-medium">Horários Específicos</Label>
                    <p className="text-sm text-muted-foreground mb-3">
                      Selecione os horários exatos de disponibilidade (dia + turno)
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      {dias.map(dia => (
                        <div key={dia} className="space-y-2">
                          <Label className="font-medium text-center block">{labelDia[dia]}</Label>
                          {(["manha", "tarde", "noite"] as Turno[]).map(turno => (
                            <div key={turno} className="flex items-center gap-2">
                              <input 
                                type="checkbox" 
                                name={`${dia}-${turno}`} 
                                id={`${dia}-${turno}`}
                                className="rounded"
                              />
                              <Label htmlFor={`${dia}-${turno}`} className="text-sm">
                                {labelTurno[turno]}
                              </Label>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      💡 Dica: Selecione apenas os horários que o camarada realmente pode trabalhar
                    </p>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button type="submit">Salvar Camarada</Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Lista de Camaradas</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Visualize todos os camaradas cadastrados e seus horários de disponibilidade
                </p>
              </CardHeader>
              <CardContent>
                <Table aria-labelledby="titulo-camaradas">
                  <TableCaption id="titulo-camaradas">Lista de camaradas cadastrados</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Curso</TableHead>
                      <TableHead>Turnos Gerais</TableHead>
                      <TableHead>Horários Específicos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {camaradas.map(c=> (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.nome}</TableCell>
                        <TableCell>{c.curso}</TableCell>
                        <TableCell className="space-x-1">
                          {c.turnos?.map(t=> <Badge key={t} variant="secondary" className="text-xs">{labelTurno[t]}</Badge>)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {c.horariosDisponiveis?.map((h, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {labelDia[h.dia]} {labelTurno[h.turno]}
                              </Badge>
                            ))}
                            {(!c.horariosDisponiveis || c.horariosDisponiveis.length === 0) && (
                              <Badge variant="secondary" className="text-xs">
                                Apenas turnos gerais
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="financeiro" className="mt-6 space-y-6">
            <div className="flex flex-col gap-8">
              <Card className="hover:shadow-md transition-shadow animate-fade-in">
                <CardHeader><CardTitle>Resumo do mês</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  <div>Receita: <strong>R$ {receitaMes.toFixed(2)}</strong></div>
                  <div>Custo variável: <strong>R$ {custoVariavelMes.toFixed(2)}</strong></div>
                  <div>Custos fixos: <strong>R$ {totalCustosFixos.toFixed(2)}</strong></div>
                  <div>Lucro bruto: <strong>R$ {lucroBrutoMes.toFixed(2)}</strong></div>
                  <div>Lucro líquido: <strong>R$ {lucroLiquidoMes.toFixed(2)}</strong></div>
                  <div>Custo fixo diluído/unid.: <strong>R$ {custoFixoDilPorUnid.toFixed(2)}</strong></div>
                </CardContent>
              </Card>

              <Card className="animate-fade-in">
                <CardHeader><CardTitle>Insumos (14 componentes)</CardTitle></CardHeader>
                <CardContent>
                  <InsumosTabela14 />
                </CardContent>
              </Card>

              <Card className="animate-fade-in">
                <CardHeader><CardTitle>Custos fixos (mensal)</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <form onSubmit={addCustoFixo} className="grid grid-cols-3 gap-2">
                    <Input name="nome" placeholder="Nome" />
                    <Input name="valor" type="number" step="0.01" placeholder="R$" />
                    <Button type="submit">Adicionar</Button>
                  </form>
                                      <Table aria-labelledby="titulo-custos">
                      <TableCaption id="titulo-custos">Lista de custos fixos mensais</TableCaption>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Valor mensal</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {custosFixos.map(c=> (
                          <TableRow key={c.id}>
                            <TableCell className="max-w-[200px]">
                              <Input value={c.nome} onChange={(e)=> setCustosFixos(prev=> prev.map(it=> it.id===c.id? {...it, nome:e.target.value}: it))} />
                            </TableCell>
                            <TableCell className="max-w-[160px]">
                              <Input type="number" step="0.01" value={c.valor_mensal}
                                onChange={(e)=> setCustosFixos(prev=> prev.map(it=> it.id===c.id? {...it, valor_mensal: Number(e.target.value||0)}: it))}
                              />
                            </TableCell>
                            <TableCell className="flex gap-2">
                              <Button variant="secondary" size="sm" onClick={()=> updateCustoFixo(c.id, { nome: c.nome, valor_mensal: c.valor_mensal })}>Salvar</Button>
                              <Button variant="destructive" size="sm" onClick={()=> deleteCustoFixo(c.id)}>Excluir</Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
</CardContent>
              </Card>

              <Card className="animate-fade-in">
                <CardHeader><CardTitle>Parâmetros e metas</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>Meta lucro bruto (mês)</Label>
                      <Input type="number" step="0.01" value={metaLucroBruto ?? ''} onChange={(e)=> setMetaLucroBruto(e.target.value===''? undefined : Number(e.target.value))} placeholder="R$" />
                    </div>
                    <div>
                      <Label>Meta lucro líquido (mês)</Label>
                      <Input type="number" step="0.01" value={metaLucroLiquido ?? ''} onChange={(e)=> setMetaLucroLiquido(e.target.value===''? undefined : Number(e.target.value))} placeholder="R$" />
                    </div>
                    <div className="col-span-2">
                      <Label>Override de custo variável por unidade (opcional)</Label>
                      <Input type="number" step="0.01" value={custoVariavelOverride ?? ''} onChange={(e)=> setCustoVariavelOverride(e.target.value===''? undefined : Number(e.target.value))} placeholder={`Atual: R$ ${custoVariavelPorUnidade.toFixed(2)}`} />
                    </div>
                  </div>
                  <Button type="button" variant="secondary" onClick={()=> notifyOk("Parâmetros aplicados.")}>Aplicar</Button>
                </CardContent>
              </Card>

              <Card className="animate-fade-in">
                <CardHeader><CardTitle>Balanço e compatibilidade</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between"><span>Entradas (receita)</span><strong>R$ {receitaMes.toFixed(2)}</strong></div>
                  <div className="flex justify-between"><span>Saídas variáveis</span><strong>R$ {custoVariavelMes.toFixed(2)}</strong></div>
                  <div className="flex justify-between"><span>Saídas fixas</span><strong>R$ {totalCustosFixos.toFixed(2)}</strong></div>
                  <div className="flex justify-between border-t pt-2"><span>Lucro bruto</span><strong>R$ {lucroBrutoMes.toFixed(2)}</strong></div>
                  <div className="flex justify-between"><span>Lucro líquido</span><strong>R$ {lucroLiquidoMes.toFixed(2)}</strong></div>
                  <div className="text-muted-foreground">Preço médio: R$ {precoMedio.toFixed(2)} • Unidades mês: {unidadesMes}</div>
                  <div className="mt-2">
                    {metaLucroBruto !== undefined || metaLucroLiquido !== undefined ? (
                      <Badge variant={(metaLucroBruto !== undefined && lucroBrutoMes < metaLucroBruto) || (metaLucroLiquido !== undefined && lucroLiquidoMes < metaLucroLiquido) ? 'destructive' : 'default'}>
                        { (metaLucroBruto !== undefined && lucroBrutoMes < metaLucroBruto) || (metaLucroLiquido !== undefined && lucroLiquidoMes < metaLucroLiquido)
                          ? 'Abaixo da meta'
                          : 'Dentro da meta' }
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">Defina metas para acompanhar compatibilidade.</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader><CardTitle>Registro diário de vendas</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={addVenda} className="grid md:grid-cols-5 gap-2">
                  <Input name="data" type="date" />
                  <Input name="unidades" type="number" placeholder="Unidades" />
                  <Input name="preco" type="number" step="0.01" placeholder="Preço/unid." />
                  <div className="md:col-span-2 flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Custos variáveis/unid.: R$ {custoVarUnidEfetivo.toFixed(2)}</span>
                    <span>Fixos/unid.: R$ {custoFixoDilPorUnid.toFixed(2)}</span>
                  </div>
                  <div className="md:col-span-5"><Button type="submit">Registrar</Button></div>
                </form>
                <Table aria-labelledby="titulo-vendas">
                  <TableCaption id="titulo-vendas">Vendas registradas</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Unidades</TableHead>
                      <TableHead>Preço/unid.</TableHead>
                      <TableHead>Receita</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendas.map(v=> (
                      <TableRow key={v.id}>
                        <TableCell>{v.data}</TableCell>
                        <TableCell>{v.unidades}</TableCell>
                        <TableCell>R$ {v.preco_unitario.toFixed(2)}</TableCell>
                        <TableCell>R$ {(v.unidades*v.preco_unitario).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vendas" className="mt-6 space-y-6">
            <Suspense fallback={
              <div className="flex items-center justify-center p-8">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  <div className="text-lg">Carregando Projeção de Vendas...</div>
                </div>
              </div>
            }>
              <ProjecaoVendas />
            </Suspense>
          </TabsContent>

          <TabsContent value="entradas" className="mt-6">
            <EntradasPanel />
          </TabsContent>

          <TabsContent value="integracao" className="mt-6 space-y-6">
            <Suspense fallback={
              <div className="flex items-center justify-center p-8">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  <div className="text-lg">Carregando Integração...</div>
                </div>
              </div>
            }>
              <IntegracaoVendas />
            </Suspense>
          </TabsContent>

          <TabsContent value="cas" className="mt-6 space-y-6">


            <Card>
              <CardHeader><CardTitle>Mapeamento dos CAs</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={addCA} className="grid md:grid-cols-6 gap-2">
                  <Input name="nome" placeholder="Nome do CA" className="md:col-span-2" />
                  <Select name="status" defaultValue="neutro" onValueChange={(v)=>{
                    const el = document.querySelector<HTMLInputElement>('input[name="status"]');
                    if(el) el.value = v;
                  }}>
                    <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aliado">Aliado</SelectItem>
                      <SelectItem value="neutro">Neutro</SelectItem>
                    </SelectContent>
                  </Select>
                  <input type="hidden" name="status" value="neutro" aria-hidden className="hidden" />
                  <Input name="relacao" placeholder="Relação comercial" />
                  <Input name="humor" placeholder="Humor político" />
                  <Input name="desafios" placeholder="Desafios" />
                  <Input name="oportunidades" placeholder="Oportunidades" />
                  <div className="md:col-span-6"><Button type="submit">Salvar</Button></div>
                </form>
                <Table aria-labelledby="titulo-cas">
                  <TableCaption id="titulo-cas">CAs mapeados</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Relação</TableHead>
                      <TableHead>Humor</TableHead>
                      <TableHead>Desafios</TableHead>
                      <TableHead>Oportunidades</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cas.map(ca=> (
                      <TableRow key={ca.id}>
                        <TableCell>
                          {editingCA === ca.id ? (
                            <Input
                              defaultValue={ca.nome}
                              onBlur={(e) => updateCA(ca.id, { nome: e.target.value })}
                              onKeyDown={(e) => e.key === 'Enter' && updateCA(ca.id, { nome: e.currentTarget.value })}
                              autoFocus
                            />
                          ) : (
                            ca.nome
                          )}
                        </TableCell>
                        <TableCell>
                          {editingCA === ca.id ? (
                            <Select defaultValue={ca.status} onValueChange={(value: "aliado" | "neutro") => updateCA(ca.id, { status: value })}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="aliado">Aliado</SelectItem>
                                <SelectItem value="neutro">Neutro</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge variant={ca.status === 'aliado' ? 'default' : 'secondary'}>{ca.status}</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {editingCA === ca.id ? (
                            <Input
                              defaultValue={ca.relacao}
                              onBlur={(e) => updateCA(ca.id, { relacao: e.target.value })}
                              onKeyDown={(e) => e.key === 'Enter' && updateCA(ca.id, { relacao: e.currentTarget.value })}
                            />
                          ) : (
                            ca.relacao
                          )}
                        </TableCell>
                        <TableCell>
                          {editingCA === ca.id ? (
                            <Input
                              defaultValue={ca.humor}
                              onBlur={(e) => updateCA(ca.id, { humor: e.target.value })}
                              onKeyDown={(e) => e.key === 'Enter' && updateCA(ca.id, { humor: e.currentTarget.value })}
                            />
                          ) : (
                            ca.humor
                          )}
                        </TableCell>
                        <TableCell>
                          {editingCA === ca.id ? (
                            <Input
                              defaultValue={ca.desafios}
                              onBlur={(e) => updateCA(ca.id, { desafios: e.target.value })}
                              onKeyDown={(e) => e.key === 'Enter' && updateCA(ca.id, { desafios: e.currentTarget.value })}
                            />
                          ) : (
                            ca.desafios
                          )}
                        </TableCell>
                        <TableCell>
                          {editingCA === ca.id ? (
                            <Input
                              defaultValue={ca.oportunidades}
                              onBlur={(e) => updateCA(ca.id, { oportunidades: e.target.value })}
                              onKeyDown={(e) => e.key === 'Enter' && updateCA(ca.id, { oportunidades: e.currentTarget.value })}
                            />
                          ) : (
                            ca.oportunidades
                          )}
                        </TableCell>
                        <TableCell className="flex gap-2">
                          {editingCA === ca.id ? (
                            <>
                              <Button size="sm" variant="secondary" onClick={() => setEditingCA(null)}>Cancelar</Button>
                            </>
                          ) : (
                            <>
                              <Button size="sm" variant="secondary" onClick={() => setEditingCA(ca.id)}>Editar</Button>
                              <Button size="sm" variant="destructive" onClick={() => deleteCA(ca.id)}>Excluir</Button>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="escala" className="mt-6 space-y-6">
            <div className="flex flex-col gap-6">
              <Card>
                <CardHeader><CardTitle>Institutos</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <form onSubmit={addInstituto} className="flex gap-2">
                    <Input name="instituto" placeholder="Nome do instituto" />
                    <Button type="submit">Adicionar</Button>
                  </form>
                  <div className="space-y-2">
                    {institutos.map(i => (
                      <div key={i.id} className="flex items-center justify-between p-3 border rounded-lg bg-card">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span className="font-medium">{i.nome}</span>
                          <Badge variant="secondary" className="text-xs">
                            {escala.filter(e => e.instituto_id === i.id).length} escala(s)
                          </Badge>
                        </div>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => deleteInstituto(i.id, i.nome)}
                          className="ml-2"
                        >
                          Excluir
                        </Button>
                      </div>
                    ))}
                    {institutos.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhum instituto cadastrado. Adicione um instituto para começar.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Designar camarada</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Atribua camaradas considerando sua disponibilidade específica
                  </p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={addEscala} className="grid md:grid-cols-5 gap-2">
                    <select name="inst" className="border rounded-md px-3 py-2 bg-background">
                      <option value="">Instituto</option>
                      {institutos.map(i=> <option key={i.id} value={i.id}>{i.nome}</option>)}
                    </select>
                    <select name="dia" className="border rounded-md px-3 py-2 bg-background">
                      <option value="">Dia</option>
                      <option value="seg">Segunda</option>
                      <option value="ter">Terça</option>
                      <option value="qua">Quarta</option>
                      <option value="qui">Quinta</option>
                      <option value="sex">Sexta</option>
                    </select>
                    <select name="turno" className="border rounded-md px-3 py-2 bg-background">
                      <option value="">Turno</option>
                      <option value="manha">Manhã</option>
                      <option value="tarde">Tarde</option>
                      <option value="noite">Noite</option>
                    </select>
                    <select name="camarada" className="border rounded-md px-3 py-2 bg-background">
                      <option value="">Camarada</option>
                      {camaradas.map(c=> <option key={c.id} value={c.id}>{c.nome} ({c.curso})</option>)}
                    </select>
                    <Button type="submit">Atribuir</Button>
                  </form>
                  <p className="text-xs text-muted-foreground mt-2">
                    💡 Dica: Os camaradas são filtrados automaticamente na escala baseado em sua disponibilidade específica
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              {institutos.map((i)=> (
                <Card key={i.id} className="animate-fade-in">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{i.nome} — Escala semanal</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Visualize e gerencie as escalas por turno e dia da semana
                        </p>
                      </div>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => deleteInstituto(i.id, i.nome)}
                        className="ml-4"
                      >
                        Excluir Instituto
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table aria-labelledby={`escala-${i.id}`}>
                      <TableCaption id={`escala-${i.id}`}>Escala semanal por turno e dia</TableCaption>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-24">Turno</TableHead>
                          {dias.map(d=> (<TableHead key={d} className="text-center">{labelDia[d]}</TableHead>))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(["manha","tarde","noite"] as Turno[]).map((t)=> (
                          <TableRow key={t}>
                            <TableCell className="font-medium">{labelTurno[t]}</TableCell>
                            {dias.map((d)=> (
                              <TableCell key={d} className="text-center">
                                <div className="flex flex-wrap gap-1 justify-center">
                                  {escalaSemanal[i.id]?.[d]?.[t]?.map((a)=> (
                                    <Badge key={a.id} variant="secondary" className="flex items-center gap-1 text-xs">
                                      {editingEscala === a.id ? (
                                        <div className="flex flex-col gap-1 text-xs">
                                          <select 
                                            defaultValue={a.camarada_id}
                                            className="bg-transparent border-none p-0 text-xs"
                                            onChange={(e) => updateEscalaCamarada(a.id, e.target.value)}
                                          >
                                            {camaradas.map(c => (
                                              <option key={c.id} value={c.id}>{c.nome}</option>
                                            ))}
                                          </select>
                                          <select 
                                            defaultValue={i.id}
                                            className="bg-transparent border-none p-0 text-xs"
                                            onChange={(e) => updateEscalaInstituto(a.id, e.target.value)}
                                          >
                                            {institutos.map(inst => (
                                              <option key={inst.id} value={inst.id}>{inst.nome}</option>
                                            ))}
                                          </select>
                                          <button onClick={() => setEditingEscala(null)} className="text-muted-foreground hover:text-foreground text-xs">✓</button>
                                        </div>
                                      ) : (
                                        <>
                                          <span className="truncate max-w-16">{a.nome}</span>
                                          <button onClick={() => setEditingEscala(a.id)} className="text-muted-foreground hover:text-foreground text-xs">✎</button>
                                          <button onClick={()=> removeEscala(a.id)} aria-label="Remover" className="text-muted-foreground hover:text-foreground text-xs">×</button>
                                        </>
                                      )}
                                    </Badge>
                                  ))}
                                </div>
                                <div className="mt-2">
                                  <label className="sr-only" htmlFor={`add-${i.id}-${d}-${t}`}>Adicionar camarada para {labelDia[d]} - {labelTurno[t]}</label>
                                  <select 
                                    id={`add-${i.id}-${d}-${t}`} 
                                    defaultValue="" 
                                    className="border rounded-md px-2 py-1 bg-background text-xs w-full" 
                                    onChange={(e)=>{ 
                                      const v=e.target.value; 
                                      if(v){
                                        assignEscala(i.id, d, t, v); 
                                        (e.target as HTMLSelectElement).value = ""; 
                                      } 
                                    }}
                                  >
                                    <option value="">Adicionar…</option>
                                    {getCamaradasDisponiveis(d, t).map(c=> (
                                      <option key={c.id} value={c.id}>
                                        {c.nome} ({c.curso})
                                      </option>
                                    ))}
                                  </select>
                                  {getCamaradasDisponiveis(d, t).length === 0 && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Nenhum camarada disponível
                                    </p>
                                  )}
                                </div>
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle>Escala — Visualização Avançada</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Diferentes formas de visualizar e analisar as escalas
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <section>
                  <h3 className="font-medium mb-2">Linha do tempo (simplificada)</h3>
                  <div className="space-y-1">
                    {camaradas.slice(0,10).map((c)=> (
                      <div key={c.id} className="flex items-center gap-2">
                        <div className="w-40 truncate text-sm">{c.nome}</div>
                        <div className="flex gap-1">
                          {(['seg','ter','qua','qui','sex'] as Dia[]).flatMap((d)=> (['manha','tarde','noite'] as Turno[]).map((t)=> {
                            const assigned = escala.some(e=> e.camarada_id===c.id && e.dia===d && e.turno===t);
                            return <div key={c.id+d+t} className={assigned ? 'h-3 w-3 rounded bg-primary/70' : 'h-3 w-3 rounded bg-muted'} title={`${d}-${t}`}></div>;
                          }))}
                        </div>
                      </div>
                    ))}
                    {camaradas.length === 0 && (<p className="text-sm text-muted-foreground">Cadastre camaradas e atribuições para visualizar.</p>)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Mostrando até 10 camaradas.</p>
                </section>

                <section>
                  <h3 className="font-medium mb-2">Resumo da Escala</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="border rounded-md p-3">
                      <div className="text-sm font-medium mb-2">Camaradas Ativos</div>
                      <div className="text-2xl font-bold text-blue-600">{camaradas.length}</div>
                      <div className="text-xs text-muted-foreground">Total de camaradas cadastrados</div>
                    </div>
                    <div className="border rounded-md p-3">
                      <div className="text-sm font-medium mb-2">Institutos</div>
                      <div className="text-2xl font-bold text-green-600">{institutos.length}</div>
                      <div className="text-xs text-muted-foreground">Total de institutos</div>
                    </div>
                    <div className="border rounded-md p-3">
                      <div className="text-sm font-medium mb-2">Atribuições</div>
                      <div className="text-2xl font-bold text-purple-600">{escala.length}</div>
                      <div className="text-xs text-muted-foreground">Total de escalas atribuídas</div>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="font-medium mb-2">Carga de Trabalho por Camarada</h3>
                  <div className="space-y-2">
                    {camaradas.slice(0, 5).map((c) => {
                      const totalEscalas = escala.filter(e => e.camarada_id === c.id).length;
                      const institutosAtribuidos = [...new Set(escala.filter(e => e.camarada_id === c.id).map(e => e.instituto_id))].length;
                      return (
                        <div key={c.id} className="flex items-center justify-between p-2 border rounded-md">
                          <div>
                            <div className="font-medium">{c.nome}</div>
                            <div className="text-xs text-muted-foreground">{c.curso}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{totalEscalas} escalas</div>
                            <div className="text-xs text-muted-foreground">{institutosAtribuidos} instituto(s)</div>
                          </div>
                        </div>
                      );
                    })}
                    {camaradas.length === 0 && (
                      <p className="text-sm text-muted-foreground">Nenhum camarada cadastrado.</p>
                    )}
                  </div>
                </section>

                <section>
                  <h3 className="font-medium mb-2">Heatmap de carga por instituto</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {institutos.map((i)=> (
                      <div key={i.id} className="border rounded-md p-3">
                        <div className="text-sm font-medium mb-2">{i.nome}</div>
                        <div className="grid" style={{ gridTemplateColumns: '80px repeat(5, 1fr)' }}>
                          <div></div>
                          {(['seg','ter','qua','qui','sex'] as Dia[]).map((d)=> (<div key={d} className="text-center text-xs">{labelDia[d]}</div>))}
                          {(['manha','tarde','noite'] as Turno[]).map((t)=> (
                            <div key={t} className="contents">
                              <div className="text-xs font-medium pr-2">{labelTurno[t]}</div>
                              {(['seg','ter','qua','qui','sex'] as Dia[]).map((d)=> {
                                const count = escala.filter(e=> e.instituto_id===i.id && e.dia===d && e.turno===t).length;
                                const cls = count>=3 ? 'bg-primary/70' : count===2 ? 'bg-primary/50' : count===1 ? 'bg-primary/30' : 'bg-muted';
                                return <div key={i.id+d+t} className={`h-6 rounded ${cls} flex items-center justify-center text-[10px]`}>{count||''}</div>;
                              })}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    {institutos.length === 0 && (<p className="text-sm text-muted-foreground">Cadastre institutos para visualizar.</p>)}
                  </div>
                </section>
              </CardContent>
            </Card>

            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle>Escala — Visualização Compacta</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Visualização completa da escala em formato de matriz para até 30 camaradas. Use as abas para alternar entre diferentes visualizações.
                </p>
                <div className="flex gap-2 mt-4">
                  <Button 
                    variant={activeView === 'camaradas' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setActiveView('camaradas')}
                  >
                    Por Camarada
                  </Button>
                  <Button 
                    variant={activeView === 'institutos' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setActiveView('institutos')}
                  >
                    Por Instituto
                  </Button>
                  <Button 
                    variant={activeView === 'turnos' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setActiveView('turnos')}
                  >
                    Por Turno
                  </Button>
                  <Button 
                    variant={activeView === 'estatisticas' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setActiveView('estatisticas')}
                  >
                    Estatísticas
                  </Button>
                </div>
              </CardHeader>
                              <CardContent>
                  {activeView === 'camaradas' && (
                    <div className="overflow-x-auto">
                      <div className="min-w-max">
                        <div className="grid grid-cols-8 gap-1 text-xs">
                          {/* Header */}
                          <div className="font-medium p-2 bg-muted rounded">Camarada</div>
                          {dias.map(d => (
                            <div key={d} className="font-medium p-2 bg-muted rounded text-center">
                              {labelDia[d]}
                            </div>
                          ))}
                          <div className="font-medium p-2 bg-muted rounded text-center">Total</div>
                          
                          {/* Linhas dos camaradas */}
                          {camaradas.slice(0, 30).map((c) => {
                            const escalasCamarada = escala.filter(e => e.camarada_id === c.id);
                            const totalEscalas = escalasCamarada.length;
                            
                            return (
                              <React.Fragment key={c.id}>
                                <div className="p-2 border-b text-xs font-medium truncate" title={c.nome}>
                                  {c.nome}
                                </div>
                                {dias.map((d) => {
                                  const escalasDia = escalasCamarada.filter(e => e.dia === d);
                                  const turnos = ['manha', 'tarde', 'noite'] as Turno[];
                                  
                                  return (
                                    <div key={d} className="p-1 border-b text-center">
                                      <div className="flex flex-col gap-0.5">
                                        {turnos.map((t) => {
                                          const escalaTurno = escalasDia.find(e => e.turno === t);
                                          if (!escalaTurno) return null;
                                          
                                          const instituto = institutos.find(i => i.id === escalaTurno.instituto_id);
                                          return (
                                            <div 
                                              key={t} 
                                              className="text-xs px-1 py-0.5 bg-blue-100 text-blue-800 rounded"
                                              title={`${instituto?.nome} - ${labelTurno[t]}`}
                                            >
                                              {instituto?.nome?.charAt(0) || '?'}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  );
                                })}
                                <div className="p-2 border-b text-center font-medium text-sm">
                                  {totalEscalas}
                                </div>
                              </React.Fragment>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeView === 'institutos' && (
                    <div className="overflow-x-auto">
                      <div className="min-w-max">
                        <div className="grid grid-cols-8 gap-1 text-xs">
                          {/* Header */}
                          <div className="font-medium p-2 bg-muted rounded">Instituto</div>
                          {dias.map(d => (
                            <div key={d} className="font-medium p-2 bg-muted rounded text-center">
                              {labelDia[d]}
                            </div>
                          ))}
                          <div className="font-medium p-2 bg-muted rounded text-center">Total</div>
                          
                          {/* Linhas dos institutos */}
                          {institutos.map((i) => {
                            const escalasInstituto = escala.filter(e => e.instituto_id === i.id);
                            const totalEscalas = escalasInstituto.length;
                            
                            return (
                              <React.Fragment key={i.id}>
                                <div className="p-2 border-b text-xs font-medium truncate" title={i.nome}>
                                  {i.nome}
                                </div>
                                {dias.map((d) => {
                                  const escalasDia = escalasInstituto.filter(e => e.dia === d);
                                  const turnos = ['manha', 'tarde', 'noite'] as Turno[];
                                  
                                  return (
                                    <div key={d} className="p-1 border-b text-center">
                                      <div className="flex flex-col gap-0.5">
                                        {turnos.map((t) => {
                                          const escalaTurno = escalasDia.find(e => e.turno === t);
                                          if (!escalaTurno) return null;
                                          
                                          const camarada = camaradas.find(c => c.id === escalaTurno.camarada_id);
                                          return (
                                            <div 
                                              key={t} 
                                              className="text-xs px-1 py-0.5 bg-green-100 text-green-800 rounded"
                                              title={`${camarada?.nome} - ${labelTurno[t]}`}
                                            >
                                              {camarada?.nome?.charAt(0) || '?'}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  );
                                })}
                                <div className="p-2 border-b text-center font-medium text-sm">
                                  {totalEscalas}
                                </div>
                              </React.Fragment>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeView === 'turnos' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {(['manha', 'tarde', 'noite'] as Turno[]).map((turno) => (
                        <div key={turno} className="border rounded-lg p-4">
                          <h4 className="font-medium mb-3 text-center">{labelTurno[turno]}</h4>
                          <div className="space-y-2">
                            {dias.map((dia) => {
                              const escalasDiaTurno = escala.filter(e => e.dia === dia && e.turno === turno);
                              
                              return (
                                <div key={dia} className="border rounded p-2">
                                  <div className="text-xs font-medium mb-1">{labelDia[dia]}</div>
                                  <div className="flex flex-wrap gap-1">
                                    {escalasDiaTurno.map((e) => {
                                      const camarada = camaradas.find(c => c.id === e.camarada_id);
                                      const instituto = institutos.find(i => i.id === e.instituto_id);
                                      
                                      return (
                                        <div 
                                          key={e.id}
                                          className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full"
                                          title={`${camarada?.nome} - ${instituto?.nome}`}
                                        >
                                          {camarada?.nome?.charAt(0) || '?'} → {instituto?.nome?.charAt(0) || '?'}
                                        </div>
                                      );
                                    })}
                                    {escalasDiaTurno.length === 0 && (
                                      <span className="text-xs text-muted-foreground">Vazio</span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeView === 'estatisticas' && (
                    <div className="space-y-6">
                      {/* Estatísticas Rápidas */}
                      <section>
                        <h3 className="font-medium mb-4">Estatísticas Rápidas</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="border rounded p-3 text-center">
                            <div className="text-2xl font-bold text-blue-600">{camaradas.length}</div>
                            <div className="text-xs text-muted-foreground">Camaradas</div>
                          </div>
                          <div className="border rounded p-3 text-center">
                            <div className="text-2xl font-bold text-green-600">{institutos.length}</div>
                            <div className="text-xs text-muted-foreground">Institutos</div>
                          </div>
                          <div className="border rounded p-3 text-center">
                            <div className="text-2xl font-bold text-purple-600">{escala.length}</div>
                            <div className="text-xs text-muted-foreground">Atribuições</div>
                          </div>
                          <div className="border rounded p-3 text-center">
                            <div className="text-2xl font-bold text-orange-600">
                              {escala.length > 0 ? Math.round(escala.length / (camaradas.length || 1)) : 0}
                            </div>
                            <div className="text-xs text-muted-foreground">Média/Camarada</div>
                          </div>
                        </div>
                      </section>

                      {/* Camaradas Mais Ativos */}
                      <section>
                        <h3 className="font-medium mb-4">Camaradas Mais Ativos</h3>
                        <div className="space-y-2">
                          {camaradas
                            .map(c => ({
                              ...c,
                              totalEscalas: escala.filter(e => e.camarada_id === c.id).length
                            }))
                            .sort((a, b) => b.totalEscalas - a.totalEscalas)
                            .slice(0, 10)
                            .map((c, index) => (
                              <div key={c.id} className="flex items-center justify-between p-2 border rounded">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-medium">
                                    {index + 1}
                                  </div>
                                  <div>
                                    <div className="font-medium text-sm">{c.nome}</div>
                                    <div className="text-xs text-muted-foreground">{c.curso}</div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-medium text-sm">{c.totalEscalas} escalas</div>
                                  <div className="text-xs text-muted-foreground">
                                    {c.totalEscalas > 0 ? Math.round((c.totalEscalas / escala.length) * 100) : 0}% do total
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </section>
                    </div>
                  )}
                </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="agenda" className="mt-6 space-y-6">
            <Card>
              <CardHeader><CardTitle>Agenda</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={addAgenda} className="grid md:grid-cols-4 gap-2">
                  <div className="md:col-span-2">
                    <Input name="titulo" placeholder="Título do compromisso" />
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="secondary" className={cn("justify-start font-normal", !dataAgenda && "text-muted-foreground")}> 
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dataAgenda ? format(dataAgenda, "dd/MM/yyyy") : <span>Escolher data</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={dataAgenda} onSelect={setDataAgenda} initialFocus className={cn("p-3 pointer-events-auto")} />
                    </PopoverContent>
                  </Popover>
                  <Input name="notas" placeholder="Notas (opcional)" />
                  <div className="md:col-span-4"><Button type="submit">Adicionar</Button></div>
                </form>

                <Table aria-labelledby="titulo-agenda">
                  <TableCaption id="titulo-agenda">Próximos compromissos</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Título</TableHead>
                      <TableHead>Notas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agenda.sort((a,b)=>a.data.localeCompare(b.data)).map(a=> {
                      const past = new Date(a.data) < new Date(new Date().toISOString().slice(0,10));
                      const soon = !past && ((new Date(a.data).getTime()-Date.now())/(1000*60*60*24) <= 2);
                      return (
                        <TableRow key={a.id} className={cn(past && "opacity-60", soon && "bg-secondary")}> 
                          <TableCell>{a.data}</TableCell>
                          <TableCell>{a.titulo}</TableCell>
                          <TableCell className="text-muted-foreground">{a.notas}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>
    </main>
  );
};

export default Index;
