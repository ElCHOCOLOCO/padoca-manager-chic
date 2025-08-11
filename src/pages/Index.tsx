import { useEffect, useMemo, useState } from "react";
// Supabase: carregado dinamicamente para evitar erro quando não conectado
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

// Tipos
type Turno = "manha" | "tarde" | "noite";
type Dia = "seg" | "ter" | "qua" | "qui" | "sex";

type Camarada = { id: string; nome: string; curso: string; turnos: Turno[] };

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

  // Stub seguro do Supabase para compilar sem integração ativa
  const supabase: any = {
    from: () => ({
      select: async () => ({ data: [], error: null }),
      insert: async () => ({ data: null, error: { message: 'Conecte o Supabase (botão verde) e recarregue.' } })
    })
  };
const [metaLucroBruto, setMetaLucroBruto] = useState<number | undefined>(undefined);
const [metaLucroLiquido, setMetaLucroLiquido] = useState<number | undefined>(undefined);
const [custoVariavelOverride, setCustoVariavelOverride] = useState<number | undefined>(undefined);

  // Carregar dados
  useEffect(() => {
    const loadAll = async () => {
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
    };
    loadAll();
  }, []);

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
    if(!nome) return notifyErr("Informe o nome.");
    const { data, error } = await supabase.from("camaradas").insert({ nome, curso, turnos }).select();
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

  const addEscala = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const camarada_id = String(fd.get("camarada")||"");
    const instituto_id = String(fd.get("inst")||"");
    const turno = String(fd.get("turno")||"") as Turno;
    const dia = String(fd.get("dia")||"") as Dia;
    if(!camarada_id||!instituto_id||!turno) return notifyErr("Preencha todos os campos.");
    const { data, error } = await supabase.from("escala").insert({ camarada_id, instituto_id, turno, dia: dia || null }).select();
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

  const assignEscala = async (instituto_id: string, dia: Dia, turno: Turno, camarada_id: string) => {
    if (!camarada_id) return;
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
    <main className="min-h-screen bg-background">
      <header className="container py-10 border-y">
        <div className="flex items-end justify-between">
          <h1 className="text-5xl font-bold font-playfair tracking-tight">Gestão de Padaria</h1>
          <span className="text-sm text-muted-foreground">{todayLabel}</span>
        </div>
        <p className="text-muted-foreground mt-2">Cadastro, financeiro, CAs, escala e agenda — rápido e simples.</p>
      </header>

      <section className="container pb-20">
        <Tabs defaultValue="camaradas" className="w-full">
          <TabsList className="grid grid-cols-5 sticky top-0 z-20 bg-background/80 backdrop-blur border-b rounded-none">
            <TabsTrigger value="camaradas">Camaradas</TabsTrigger>
            <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
            <TabsTrigger value="cas">CAs</TabsTrigger>
            <TabsTrigger value="escala">Escala</TabsTrigger>
            <TabsTrigger value="agenda">Agenda</TabsTrigger>
          </TabsList>

          <TabsContent value="camaradas" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Cadastro de camaradas</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={addCamarada} className="grid md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="nome">Nome</Label>
                    <Input id="nome" name="nome" placeholder="Ex: João" />
                  </div>
                  <div>
                    <Label htmlFor="curso">Curso</Label>
                    <Input id="curso" name="curso" placeholder="Ex: Engenharia" />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2"><input type="checkbox" name="manha" id="manha" /><Label htmlFor="manha">Manhã</Label></div>
                    <div className="flex items-center gap-2"><input type="checkbox" name="tarde" id="tarde" /><Label htmlFor="tarde">Tarde</Label></div>
                    <div className="flex items-center gap-2"><input type="checkbox" name="noite" id="noite" /><Label htmlFor="noite">Noite</Label></div>
                  </div>
                  <div className="flex items-end"><Button type="submit">Salvar</Button></div>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Lista</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Curso</TableHead>
                      <TableHead>Turnos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {camaradas.map(c=> (
                      <TableRow key={c.id}>
                        <TableCell>{c.nome}</TableCell>
                        <TableCell>{c.curso}</TableCell>
                        <TableCell className="space-x-2">
                          {c.turnos?.map(t=> <Badge key={t} variant="secondary">{t}</Badge>)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="financeiro" className="mt-6 space-y-6">
            <div className="grid md:grid-cols-4 gap-4">
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
                <CardHeader><CardTitle>Insumos (custo por unidade)</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <form onSubmit={addInsumo} className="grid grid-cols-3 gap-2">
                    <Input name="nome" placeholder="Nome" />
                    <Input name="custo" type="number" step="0.01" placeholder="R$" />
                    <Button type="submit">Adicionar</Button>
                  </form>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Insumo</TableHead>
                        <TableHead>Custo/unid.</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {insumos.map(i=> (
                        <TableRow key={i.id}>
                          <TableCell className="max-w-[200px]">
                            <Input value={i.nome} onChange={(e)=> setInsumos(prev=> prev.map(it=> it.id===i.id? {...it, nome:e.target.value}: it))} />
                          </TableCell>
                          <TableCell className="max-w-[160px]">
                            <Input type="number" step="0.01" value={i.custo_unitario}
                              onChange={(e)=> setInsumos(prev=> prev.map(it=> it.id===i.id? {...it, custo_unitario: Number(e.target.value||0)}: it))}
                            />
                          </TableCell>
                          <TableCell className="flex gap-2">
                            <Button variant="secondary" size="sm" onClick={()=> updateInsumo(i.id, { nome: i.nome, custo_unitario: i.custo_unitario })}>Salvar</Button>
                            <Button variant="destructive" size="sm" onClick={()=> deleteInsumo(i.id)}>Excluir</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
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
                  <Table>
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
                <Table>
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Relação</TableHead>
                      <TableHead>Humor</TableHead>
                      <TableHead>Desafios</TableHead>
                      <TableHead>Oportunidades</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cas.map(ca=> (
                      <TableRow key={ca.id}>
                        <TableCell>{ca.nome}</TableCell>
                        <TableCell>
                          <Badge variant={ca.status === 'aliado' ? 'default' : 'secondary'}>{ca.status}</Badge>
                        </TableCell>
                        <TableCell>{ca.relacao}</TableCell>
                        <TableCell>{ca.humor}</TableCell>
                        <TableCell>{ca.desafios}</TableCell>
                        <TableCell>{ca.oportunidades}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="escala" className="mt-6 space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader><CardTitle>Institutos</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <form onSubmit={addInstituto} className="flex gap-2">
                    <Input name="instituto" placeholder="Nome do instituto" />
                    <Button type="submit">Adicionar</Button>
                  </form>
                  <ul className="text-sm text-muted-foreground columns-2">
                    {institutos.map(i=> <li key={i.id}>• {i.nome}</li>)}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Designar camarada</CardTitle></CardHeader>
                <CardContent>
                  <form onSubmit={addEscala} className="grid md:grid-cols-5 gap-2">
                    <select name="camarada" className="border rounded-md px-3 py-2 bg-background">
                      <option value="">Camarada</option>
                      {camaradas.map(c=> <option key={c.id} value={c.id}>{c.nome}</option>)}
                    </select>
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
                    <Button type="submit">Atribuir</Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              {institutos.map((i)=> (
                <Card key={i.id} className="animate-fade-in">
                  <CardHeader><CardTitle>{i.nome} — Escala semanal</CardTitle></CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Turno</TableHead>
                          {dias.map(d=> (<TableHead key={d}>{labelDia[d]}</TableHead>))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(["manha","tarde","noite"] as Turno[]).map((t)=> (
                          <TableRow key={t}>
                            <TableCell className="font-medium">{labelTurno[t]}</TableCell>
                            {dias.map((d)=> (
                              <TableCell key={d}>
                                <div className="flex flex-wrap gap-2">
                                  {escalaSemanal[i.id]?.[d]?.[t]?.map((a)=> (
                                    <Badge key={a.id} variant="secondary" className="flex items-center gap-1">
                                      {a.nome}
                                      <button onClick={()=> removeEscala(a.id)} aria-label="Remover" className="text-muted-foreground hover:text-foreground">×</button>
                                    </Badge>
                                  ))}
                                </div>
                                <div className="mt-2">
                                  <select defaultValue="" className="border rounded-md px-2 py-1 bg-background text-sm" onChange={(e)=>{ const v=e.target.value; if(v){ assignEscala(i.id, d, t, v); (e.target as HTMLSelectElement).value = ""; } }}>
                                    <option value="">Adicionar…</option>
                                    {camaradas.map(c=> (<option key={c.id} value={c.id}>{c.nome}</option>))}
                                  </select>
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

                <Table>
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
