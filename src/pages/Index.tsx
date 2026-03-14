import { useEffect, useState, useCallback, Suspense, lazy } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { supabase as supabaseClient } from "@/integrations/supabase/client";
import ThemeToggle from "@/components/ThemeToggle";
import { Clock, ArrowRight } from "lucide-react";

// Types & Constants
import { Turno, dias } from "@/constants/dashboard";
import { Camarada, ItemEstoque, AgendaItem, Instituto, EscalaItem } from "@/types/dashboard";

// Dashboard Sections
import ProtocoloSection from "@/components/dashboard/ProtocoloSection";
import CamaradasSection from "@/components/dashboard/CamaradasSection";
import EstoqueSection from "@/components/dashboard/EstoqueSection";
import EscalaSection from "@/components/dashboard/EscalaSection";
import FinanceiroSection from "@/components/dashboard/FinanceiroSection";
import CASSection from "@/components/dashboard/CASSection";
import AgendaSection from "@/components/dashboard/AgendaSection";
import MuralEditais from "@/components/dashboard/MuralEditais";

// Validation
import { 
  CamaradaSchema, 
  ItemEstoqueSchema, 
  VendaSchema, 
  CASchema, 
  AgendaSchema 
} from "@/utils/validation";

// Lazy Loaded Legacy/External Components
const ProjecaoVendas = lazy(() => import("@/components/vendas/ProjecaoVendas"));
const IntegracaoVendas = lazy(() => import("@/components/integracao/IntegracaoVendas"));
const EntradasPanel = lazy(() => import("@/components/finance/EntradasPanel"));

const Index = () => {
  useEffect(() => {
    document.title = "Marx Gestão – Crônicas da Padaria";
  }, []);
  const todayLabel = format(new Date(), "dd/MM/yyyy");

  // Estados gerais
  const [camaradas, setCamaradas] = useState<Camarada[]>([]);
  const [institutos, setInstitutos] = useState<Instituto[]>([]);
  const [escala, setEscala] = useState<EscalaItem[]>([]);
  const [insumos, setInsumos] = useState<{ id: string; nome: string; custo_unitario: number }[]>([]);
  const [custosFixos, setCustosFixos] = useState<{ id: string; nome: string; valor_mensal: number }[]>([]);
  const [vendas, setVendas] = useState<{ id: string; data: string; unidades: number; preco_unitario: number }[]>([]);
  const [cas, setCas] = useState<any[]>([]);
  const [agenda, setAgenda] = useState<AgendaItem[]>([]);
  const [estoque, setEstoque] = useState<ItemEstoque[]>([
    { id: '1', produto: 'Farinha de Trigo', uso_semanal: 50, unidades: 120 },
    { id: '2', produto: 'Açúcar', uso_semanal: 20, unidades: 45 },
    { id: '3', produto: 'Manteiga', uso_semanal: 15, unidades: 30 },
  ]);

  const [metaLucroBruto, setMetaLucroBruto] = useState<number | undefined>(undefined);
  const [metaLucroLiquido, setMetaLucroLiquido] = useState<number | undefined>(undefined);
  const [custoVariavelOverride, setCustoVariavelOverride] = useState<number | undefined>(undefined);
  const [checklistItems, setChecklistItems] = useState<{ id: string; label: string; checked: boolean; category: 'rotina' | 'lenin' }[]>([
    { id: '1', label: 'Conferência de fundo de caixa', checked: false, category: 'rotina' },
    { id: '2', label: 'Verificação de validade dos insumos', checked: false, category: 'rotina' },
    { id: '3', label: 'Organização da área de vendas', checked: false, category: 'rotina' },
    { id: '4', label: 'Estoque de embalagens ok', checked: false, category: 'rotina' },
    { id: '5', label: 'Análise pragmática da conjuntura local', checked: false, category: 'lenin' },
  ]);

  const [editingCA, setEditingCA] = useState<string | null>(null);
  const [chartFilterType, setChartFilterType] = useState<'global' | 'turno' | 'instituto'>('global');
  const [selectedFilterId, setSelectedFilterId] = useState<string>('');
  
  const [editais, setEditais] = useState<any[]>([
    { id: '1', data: '14/03/2026', titulo: 'Nova Versão V5 Lançada', conteudo: 'Iniciamos hoje a transição para a V5. Operação em curso com foco em inteligência e escala coletiva.' },
    { id: '2', data: '14/03/2026', titulo: 'Protocolo de Higiene em Dobro', conteudo: 'Camaradas, atenção redobrada à limpeza das bancadas no turno da manhã.' },
  ]);

  const supabase: any = supabaseClient as any;

  const loadAll = useCallback(async () => {
    try {
      const tables = [
        supabase.from("camaradas").select("id,nome,curso,turnos"),
        supabase.from("institutos").select("id,nome"),
        supabase.from("escala").select("id,camarada_id,instituto_id,turno,dia"),
        supabase.from("insumos").select("id,nome,custo_unitario"),
        supabase.from("custos_fixos").select("id,nome,valor_mensal"),
        supabase.from("vendas_diarias").select("id,data,unidades,preco_unitario"),
        supabase.from("cas").select("id,nome,status,relacao,humor,desafios,oportunidades"),
        supabase.from("agenda").select("id,data,titulo,notas"),
      ];
      const results = await Promise.all(tables);
      
      const errors = results.filter(r => r.error);
      if (errors.length > 0) console.warn("Supabase partial failure:", errors);

      const [c1,c2,c3,c4,c5,c6,c7,c8] = results;
      if (!c1.error && c1.data) setCamaradas(c1.data as any);
      if (!c2.error && c2.data) setInstitutos(c2.data as any);
      if (!c3.error && c3.data) setEscala(c3.data as any);
      if (!c4.error && c4.data) setInsumos(c4.data as any);
      if (!c5.error && c5.data) setCustosFixos(c5.data as any);
      if (!c6.error && c6.data) setVendas(c6.data as any);
      if (!c7.error && c7.data) setCas(c7.data as any);
      if (!c8.error && c8.data) setAgenda(c8.data as any);
    } catch (e) {
      console.warn("Supabase connection issue.");
    }
  }, [supabase]);

  useEffect(() => {
    loadAll();

    // Realtime Subscriptions
    const channels = [
      supabase.channel('public:camaradas').on('postgres_changes', { event: '*', schema: 'public', table: 'camaradas' }, loadAll).subscribe(),
      supabase.channel('public:escala').on('postgres_changes', { event: '*', schema: 'public', table: 'escala' }, loadAll).subscribe(),
      supabase.channel('public:vendas_diarias').on('postgres_changes', { event: '*', schema: 'public', table: 'vendas_diarias' }, loadAll).subscribe(),
      supabase.channel('public:cas').on('postgres_changes', { event: '*', schema: 'public', table: 'cas' }, loadAll).subscribe(),
    ];

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [loadAll, supabase]);

  const notifyOk = (msg: string) => toast({ title: msg });
  const notifyErr = (msg: string) => toast({ title: "Erro", description: msg });

  // Submits (Mapped for sub-components)
  const handleAddCamarada = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const nome = String(fd.get("nome")||"").trim();
    const curso = String(fd.get("curso")||"").trim();
    const turnos = ["manha","tarde","noite"].filter(t=>fd.get(t)) as Turno[];
    
    // Validation
    const validation = CamaradaSchema.safeParse({ nome, curso, turnos });
    if(!validation.success) return notifyErr(validation.error.errors[0].message);

    const { data, error } = await supabase.from("camaradas").insert({ nome, curso, turnos }).select();
    if(error) return notifyErr(error.message);
    setCamaradas((p)=>[...(data as any), ...p]);
    e.currentTarget?.reset();
    notifyOk("Camarada cadastrado!");
  };

  const handleDeleteCamarada = async (id: string, nome: string) => {
    if(!window.confirm(`Excluir ${nome}?`)) return;
    const { error } = await supabase.from("camaradas").delete().eq("id", id);
    if(error) return notifyErr(error.message);
    setCamaradas(p=>p.filter(c=>c.id!==id));
    notifyOk("Excluído.");
  };

  const handleSaveScaleAssignment = async (instituto_id: string, dia: string, turno: string, camarada_id: string) => {
    if(!camarada_id||!instituto_id||!turno||!dia) return notifyErr("Dados incompletos.");
    const { data, error } = await supabase.from("escala").insert({ camarada_id, instituto_id, turno, dia }).select();
    if(error) return notifyErr(error.message);
    setEscala((p)=>[...(data as any), ...p]);
    notifyOk("Atribuído!");
  };

  const handleRemoveScaleAssignment = async (id: string) => {
    const { error } = await supabase.from("escala").delete().eq("id", id);
    if(error) return notifyErr(error.message);
    setEscala(p=>p.filter(e=>e.id!==id));
    notifyOk("Removido.");
  };

  const handleAddVenda = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = String(fd.get("data")||"");
    const unidades = Number(fd.get("unidades")||0);
    const preco_unitario = Number(fd.get("preco")||0);
    
    // Validation
    const validation = VendaSchema.safeParse({ data, unidades, preco_unitario });
    if(!validation.success) return notifyErr(validation.error.errors[0].message);

    const { data: d, error } = await supabase.from("vendas_diarias").insert({ data, unidades, preco_unitario }).select();
    if(error) return notifyErr(error.message);
    setVendas((p)=>[...(d as any), ...p]);
    e.currentTarget?.reset();
    notifyOk("Venda registrada!");
  };

  const handleAddCustoFixo = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const nome = String(fd.get("nome")||"").trim();
    const valor_mensal = Number(fd.get("valor")||0);
    const { data, error } = await supabase.from("custos_fixos").insert({ nome, valor_mensal }).select();
    if(error) return notifyErr(error.message);
    setCustosFixos(p=>[...(data as any), ...p]);
    e.currentTarget?.reset();
  };

  const handleDeleteCustoFixo = async (id: string) => {
    await supabase.from("custos_fixos").delete().eq("id", id);
    setCustosFixos(p=>p.filter(c=>c.id!==id));
  };

  const handleAddCA = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      nome: String(fd.get("nome")||""),
      status: String(fd.get("status")||"neutro") as any,
      relacao: String(fd.get("relacao")||""),
    };
    const { data, error } = await supabase.from("cas").insert(payload).select();
    if(error) return notifyErr(error.message);
    setCas(p=>[...(data as any), ...p]);
    e.currentTarget.reset();
  };

  const handleUpdateCA = async (id: string, patch: any) => {
    await supabase.from("cas").update(patch).eq("id", id);
    setCas(p=>p.map(ca=>ca.id===id? {...ca, ...patch}: ca));
  };

  const handleDeleteCA = async (id: string) => {
    await supabase.from("cas").delete().eq("id", id);
    setCas(p=>p.filter(ca=>ca.id!==id));
  };

  const handleAddAgendaItem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = String(fd.get("data")||"");
    const titulo = String(fd.get("titulo")||"");
    const notas = String(fd.get("notas")||"");
    
    // Validation
    const validation = AgendaSchema.safeParse({ data, titulo, notas });
    if(!validation.success) return notifyErr(validation.error.errors[0].message);

    const payload = { data, titulo, notas };
    const { data: d, error } = await supabase.from("agenda").insert(payload).select();
    if(error) return notifyErr(error.message);
    setAgenda(p=>[...(d as any), ...p]);
    e.currentTarget.reset();
    notifyOk("Evento registrado.");
  };

  const handleDeleteAgendaItem = async (id: string) => {
    await supabase.from("agenda").delete().eq("id", id);
    setAgenda(p=>p.filter(a=>a.id!==id));
  };

  return (
    <main className="min-h-screen bg-[#fdfcf0] text-foreground font-serif selection:bg-primary/20 paper-grain px-4 md:px-0">
      <header className="container py-12 border-b-8 border-double border-foreground mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center border-b-2 border-foreground pb-6 mb-6">
          <div className="lg:col-span-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="hidden md:block text-sm font-black uppercase tracking-[0.2em] border-2 border-foreground px-3 py-1">Vol. V • No. 050</div>
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
          <div className="lg:col-span-4 h-full">
            <MuralEditais editais={editais} />
          </div>
        </div>
        <div className="flex flex-col md:flex-row justify-between items-center text-xs font-black uppercase tracking-widest py-3 border-y-2 border-foreground mt-2 italic">
          <span className="flex items-center gap-2"><Clock size={14}/> Crônicas Diárias da Produção</span>
          <span className="hidden md:inline border-x-2 border-foreground px-8 mx-4">A Luta de Classes na Gestão da Panificação</span>
          <span className="flex items-center gap-2">Nova Versão V5 <ArrowRight size={14}/></span>
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
            <ProtocoloSection 
              checklistItems={checklistItems} 
              setChecklistItems={setChecklistItems} 
              notifyOk={notifyOk} 
            />
          </TabsContent>

          <TabsContent value="camaradas" className="mt-0 focus-visible:outline-none">
            <CamaradasSection 
              camaradas={camaradas} 
              addCamarada={handleAddCamarada} 
              deleteCamarada={handleDeleteCamarada} 
            />
          </TabsContent>

          <TabsContent value="estoque" className="mt-0 focus-visible:outline-none">
            <EstoqueSection 
              estoque={estoque} 
              setEstoque={setEstoque} 
              notifyOk={notifyOk} 
            />
          </TabsContent>

          <TabsContent value="financeiro" className="mt-0 focus-visible:outline-none">
            <FinanceiroSection 
              custosFixos={custosFixos}
              insumos={insumos}
              vendas={vendas}
              metaLucroBruto={metaLucroBruto}
              setMetaLucroBruto={setMetaLucroBruto}
              metaLucroLiquido={metaLucroLiquido}
              setMetaLucroLiquido={setMetaLucroLiquido}
              custoVariavelOverride={custoVariavelOverride}
              setCustoVariavelOverride={setCustoVariavelOverride}
              addCustoFixo={handleAddCustoFixo}
              deleteCustoFixo={handleDeleteCustoFixo}
              addVenda={handleAddVenda}
              notifyOk={notifyOk}
            />
          </TabsContent>

          <TabsContent value="vendas" className="mt-0 focus-visible:outline-none">
            <Suspense fallback={<div className="p-20 text-center font-black uppercase italic text-4xl animate-pulse">Consultando o Mercado...</div>}>
              <ProjecaoVendas />
            </Suspense>
          </TabsContent>

          <TabsContent value="entradas" className="mt-0 focus-visible:outline-none">
            <Suspense fallback={<div className="p-20 text-center font-black uppercase italic text-4xl animate-pulse">Carregando Fluxo...</div>}>
              <EntradasPanel />
            </Suspense>
          </TabsContent>

          <TabsContent value="integracao" className="mt-0 focus-visible:outline-none">
            <Suspense fallback={<div className="p-20 text-center font-black uppercase italic text-4xl animate-pulse">Sincronizando Sistemas...</div>}>
              <IntegracaoVendas />
            </Suspense>
          </TabsContent>

          <TabsContent value="cas" className="mt-0 focus-visible:outline-none">
            <CASSection 
              cas={cas}
              editingCA={editingCA}
              setEditingCA={setEditingCA}
              addCA={handleAddCA}
              updateCA={handleUpdateCA}
              deleteCA={handleDeleteCA}
            />
          </TabsContent>

          <TabsContent value="escala" className="mt-0 focus-visible:outline-none">
            <EscalaSection 
              institutos={institutos}
              escala={escala}
              chartFilterType={chartFilterType}
              setChartFilterType={setChartFilterType}
              selectedFilterId={selectedFilterId}
              setSelectedFilterId={setSelectedFilterId}
              setEscala={setEscala}
              saveScaleAssignment={handleSaveScaleAssignment}
              removeScaleAssignment={handleRemoveScaleAssignment}
              camaradas={camaradas}
            />
          </TabsContent>

          <TabsContent value="agenda" className="mt-0 focus-visible:outline-none">
            <AgendaSection 
              agenda={agenda}
              setAgenda={setAgenda}
              addAgendaItem={handleAddAgendaItem}
              deleteAgendaItem={handleDeleteAgendaItem}
            />
          </TabsContent>
        </Tabs>
      </section>
    </main>
  );
};

export default Index;
