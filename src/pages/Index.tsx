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

type Camarada = { id: string; nome: string; curso: string; turnos: Turno[] };

const Index = () => {
  useEffect(() => {
    document.title = "Gestão de Padaria – Painel";
  }, []);

  // Estados gerais
  const [camaradas, setCamaradas] = useState<Camarada[]>([]);
  const [institutos, setInstitutos] = useState<{ id: string; nome: string }[]>([]);
  const [escala, setEscala] = useState<{ id: string; camarada_id: string; instituto_id: string; turno: Turno }[]>([]);
  const [insumos, setInsumos] = useState<{ id: string; nome: string; custo_unitario: number }[]>([]);
  const [custosFixos, setCustosFixos] = useState<{ id: string; nome: string; valor_mensal: number }[]>([]);
  const [vendas, setVendas] = useState<{ id: string; data: string; unidades: number; preco_unitario: number }[]>([]);
  const [cas, setCas] = useState<{ id: string; nome: string; status: "aliado" | "neutro"; relacao: string; humor: string; desafios: string; oportunidades: string }[]>([]);
  const [agenda, setAgenda] = useState<{ id: string; data: string; titulo: string; notas?: string }[]>([]);
  const [sb, setSb] = useState<any>(null);
  // Alias seguro: evita erros quando Supabase não está conectado
  const supabase: any = sb ?? { from: () => ({
    select: async () => ({ data: [], error: null }),
    insert: async () => ({ data: null, error: { message: 'Conecte o Supabase e recarregue.' } })
  }) };

  // Inicializar Supabase dinamicamente
  useEffect(()=>{
    // @ts-ignore - caminho válido após conectar o Supabase na Lovable
    import(/* @vite-ignore */ "@/integrations/supabase/client").then(m=>setSb(m.supabase)).catch(()=>{});
  },[]);

  // Carregar dados
  useEffect(() => {
    const loadAll = async () => {
      try {
        const tables = [
          supabase.from("camaradas").select("id,nome,curso,turnos"),
          supabase.from("institutos").select("id,nome"),
          supabase.from("escala").select("id,camarada_id,instituto_id,turno"),
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
  const custoVariavelMes = useMemo(()=> unidadesMes * custoVariavelPorUnidade, [unidadesMes,custoVariavelPorUnidade]);
  const custoFixoDilPorUnid = useMemo(()=> unidadesMes>0 ? totalCustosFixos / unidadesMes : 0, [totalCustosFixos, unidadesMes]);
  const lucroBrutoMes = useMemo(()=> receitaMes - custoVariavelMes, [receitaMes,custoVariavelMes]);
  const lucroLiquidoMes = useMemo(()=> receitaMes - custoVariavelMes - totalCustosFixos, [receitaMes,custoVariavelMes,totalCustosFixos]);

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
    if(!camarada_id||!instituto_id||!turno) return notifyErr("Preencha todos os campos.");
    const { data, error } = await supabase.from("escala").insert({ camarada_id, instituto_id, turno }).select();
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

  // Visualização da escala por instituto e turno
  const escalaMap = useMemo(()=>{
    const map: Record<string, Record<Turno, string[]>> = {};
    institutos.forEach(i=>{ map[i.id] = { manha:[], tarde:[], noite:[] }; });
    escala.forEach(e=>{
      const nome = camaradas.find(c=>c.id===e.camarada_id)?.nome || "—";
      if(map[e.instituto_id]) map[e.instituto_id][e.turno].push(nome);
    });
    return map;
  }, [escala, institutos, camaradas]);

  return (
    <main className="min-h-screen bg-background">
      <header className="container py-10">
        <h1 className="text-4xl font-bold font-playfair tracking-tight">
          Gestão de Padaria
        </h1>
        <p className="text-muted-foreground mt-2">Cadastro, financeiro, CAs, escala e agenda – rápido e simples.</p>
      </header>

      <section className="container pb-20">
        <Tabs defaultValue="camaradas" className="w-full">
          <TabsList className="grid grid-cols-5">
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
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="hover:shadow-md transition-shadow">
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

              <Card>
                <CardHeader><CardTitle>Insumos (custo por unidade)</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <form onSubmit={addInsumo} className="grid grid-cols-3 gap-2">
                    <Input name="nome" placeholder="Nome" />
                    <Input name="custo" type="number" step="0.01" placeholder="R$" />
                    <Button type="submit">Adicionar</Button>
                  </form>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {insumos.map(i=> <li key={i.id}>{i.nome} • R$ {i.custo_unitario.toFixed(2)}</li>)}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Custos fixos (mensal)</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <form onSubmit={addCustoFixo} className="grid grid-cols-3 gap-2">
                    <Input name="nome" placeholder="Nome" />
                    <Input name="valor" type="number" step="0.01" placeholder="R$" />
                    <Button type="submit">Adicionar</Button>
                  </form>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {custosFixos.map(c=> <li key={c.id}>{c.nome} • R$ {c.valor_mensal.toFixed(2)}/mês</li>)}
                  </ul>
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
                    <span>Custos variáveis/unid.: R$ {custoVariavelPorUnidade.toFixed(2)}</span>
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
                    const el = document.querySelector<HTMLInputElement>('input[name="status-hidden"]');
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
                  <form onSubmit={addEscala} className="grid md:grid-cols-4 gap-2">
                    <select name="camarada" className="border rounded-md px-3 py-2 bg-background">
                      <option value="">Camarada</option>
                      {camaradas.map(c=> <option key={c.id} value={c.id}>{c.nome}</option>)}
                    </select>
                    <select name="inst" className="border rounded-md px-3 py-2 bg-background">
                      <option value="">Instituto</option>
                      {institutos.map(i=> <option key={i.id} value={i.id}>{i.nome}</option>)}
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

            <Card>
              <CardHeader><CardTitle>Visualização da escala</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Instituto</TableHead>
                      <TableHead>Manhã</TableHead>
                      <TableHead>Tarde</TableHead>
                      <TableHead>Noite</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {institutos.map(i=> (
                      <TableRow key={i.id}>
                        <TableCell>{i.nome}</TableCell>
                        <TableCell>{escalaMap[i.id]?.manha?.join(', ') || '—'}</TableCell>
                        <TableCell>{escalaMap[i.id]?.tarde?.join(', ') || '—'}</TableCell>
                        <TableCell>{escalaMap[i.id]?.noite?.join(', ') || '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
