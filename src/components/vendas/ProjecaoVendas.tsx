import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, TrendingUp, TrendingDown, Target, BarChart3, RefreshCw, Save, X, History, Calendar } from "lucide-react";
import TesteConexao from "./TesteConexao";
import LoginForm from "../auth/LoginForm";

type InstitutoVenda = {
  id: string;
  codigo: string;
  nome: string;
  turno: 'manha' | 'tarde' | 'noite';
};

type VendaHistorico = {
  id: string;
  instituto_id: string;
  instituto_codigo: string;
  instituto_nome: string;
  dia: string;
  turno: string;
  projetado: number;
  vendeu: number;
  data_referencia: string;
  created_at: string;
};

type ProjecaoVenda = {
  instituto_codigo: string;
  instituto_nome: string;
  turno: string;
  dia: string;
  projecao: number;
  vendas_reais: number;
  diferenca: number;
  percentual_atingimento: number;
};

type AnaliseOfertaDemanda = {
  instituto_codigo: string;
  instituto_nome: string;
  turno: string;
  demanda_media: number;
  oferta_atual: number;
  deficit: number;
  recomendacao: string;
  prioridade: 'alta' | 'media' | 'baixa';
};

type MetaVenda = {
  id: string;
  instituto_id: string;
  instituto_codigo: string;
  instituto_nome: string;
  periodo: string;
  meta_quantidade: number;
  meta_valor: number;
  vendas_atuais: number;
  percentual_atingimento: number;
  status: 'acima' | 'dentro' | 'abaixo';
};

const diasSemana = ['seg', 'ter', 'qua', 'qui', 'sex'] as const;
const labelDia: Record<string, string> = {
  seg: 'Segunda',
  ter: 'Terça',
  qua: 'Quarta',
  qui: 'Quinta',
  sex: 'Sexta'
};

const labelTurno: Record<string, string> = {
  manha: 'Manhã',
  tarde: 'Tarde',
  noite: 'Noite'
};

// Componente para célula editável
const CelulaVenda = React.memo(({ 
  instituto, 
  dia, 
  projetado, 
  vendeu, 
  isEditing, 
  onEdit, 
  onSave, 
  onCancel, 
  isUpdating 
}: {
  instituto: InstitutoVenda;
  dia: string;
  projetado: number;
  vendeu: number;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (projetado: number, vendeu: number) => void;
  onCancel: () => void;
  isUpdating: boolean;
}) => {
  const [editProjetado, setEditProjetado] = useState(projetado);
  const [editVendeu, setEditVendeu] = useState(vendeu);

  useEffect(() => {
    setEditProjetado(projetado);
    setEditVendeu(vendeu);
  }, [projetado, vendeu]);

  if (isEditing) {
    return (
      <div className="space-y-2 p-2 border rounded bg-background shadow-sm">
        <div>
          <Label className="text-xs font-medium text-blue-600">Projetado:</Label>
          <Input
            type="number"
            value={editProjetado}
            onChange={(e) => setEditProjetado(Number(e.target.value))}
            className="h-7 text-xs mt-1"
            placeholder="0"
            autoFocus
          />
        </div>
        <div>
          <Label className="text-xs font-medium text-green-600">Vendeu:</Label>
          <Input
            type="number"
            value={editVendeu}
            onChange={(e) => setEditVendeu(Number(e.target.value))}
            className="h-7 text-xs mt-1"
            placeholder="0"
          />
        </div>
        <div className="flex gap-1">
          <Button
            size="sm"
            onClick={() => onSave(editProjetado, editVendeu)}
            className="text-xs px-2 h-6"
            disabled={isUpdating}
          >
            {isUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onCancel}
            className="text-xs px-2 h-6"
            disabled={isUpdating}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="cursor-pointer hover:bg-muted p-2 rounded border border-transparent hover:border-border transition-all min-h-20 flex flex-col justify-center group"
      onClick={onEdit}
    >
      <div className="space-y-1">
        <div className="text-xs font-medium text-blue-600 group-hover:text-blue-700">
          Proj: {projetado || 0}
        </div>
        <div className="text-xs font-medium text-green-600 group-hover:text-green-700">
          Vendeu: {vendeu || 0}
        </div>
        {projetado > 0 && vendeu > 0 && (
          <Badge 
            variant="outline" 
            className={`text-xs ${vendeu >= projetado ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
          >
            {((vendeu / projetado) * 100).toFixed(1)}%
          </Badge>
        )}
        {projetado === 0 && vendeu === 0 && (
          <div className="text-xs text-muted-foreground group-hover:text-foreground">
            Clique para editar
          </div>
        )}
      </div>
    </div>
  );
});

CelulaVenda.displayName = 'CelulaVenda';

function ProjecaoVendas() {
  console.log("🚀 ProjecaoVendas: Componente iniciado");
  
  const [institutos, setInstitutos] = useState<InstitutoVenda[]>([]);
  const [historico, setHistorico] = useState<VendaHistorico[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [dataReferencia, setDataReferencia] = useState(new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState('matriz');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Estados para funcionalidades de análise
  const [analiseOfertaDemanda, setAnaliseOfertaDemanda] = useState<AnaliseOfertaDemanda[]>([]);
  const [metasVendas, setMetasVendas] = useState<MetaVenda[]>([]);
  const [loadingAnalise, setLoadingAnalise] = useState(false);

  // Estados para edição inline
  const [editingCell, setEditingCell] = useState<{instituto: string, dia: string} | null>(null);

  // Carregar dados
  const loadData = useCallback(async () => {
    console.log("📊 ProjecaoVendas: Iniciando carregamento de dados");
    setLoading(true);
    try {
      // TESTE DE CONEXÃO - Verificar se o usuário está autenticado
      console.log("🔐 ProjecaoVendas: Verificando autenticação...");
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log("👤 ProjecaoVendas: Usuário atual:", user ? "Autenticado" : "Não autenticado", user?.id);
      if (authError) {
        console.error('❌ ProjecaoVendas: Erro de autenticação:', authError);
      }

      // TESTE DE CONEXÃO - Verificar se conseguimos acessar a tabela
      console.log("🔍 ProjecaoVendas: Testando acesso à tabela institutos_vendas...");
      const { data: testData, error: testError, count } = await supabase
        .from('institutos_vendas')
        .select('*', { count: 'exact', head: true });

      console.log("📊 ProjecaoVendas: Teste de acesso - count:", count, "error:", testError);
      
      if (testError) {
        console.error('❌ ProjecaoVendas: Erro no teste de acesso:', testError);
        toast({ 
          title: "Erro de Acesso", 
          description: `Não foi possível acessar a tabela: ${testError.message}` 
        });
        return;
      }

      // Carregar institutos
      console.log("🔍 ProjecaoVendas: Carregando institutos...");
      const { data: institutosData, error: institutosError } = await supabase
        .from('institutos_vendas')
        .select('*')
        .order('codigo');

      if (institutosError) {
        console.error('❌ ProjecaoVendas: Erro ao carregar institutos:', institutosError);
        toast({ title: "Erro", description: "Erro ao carregar institutos" });
        setInstitutos([]);
      } else {
        console.log('✅ ProjecaoVendas: Institutos carregados:', institutosData?.length || 0);
        console.log('📋 ProjecaoVendas: Dados dos institutos:', institutosData);
        setInstitutos(institutosData || []);
      }

      // Carregar histórico
      console.log("🔍 ProjecaoVendas: Carregando histórico...");
      const { data: historicoData, error: historicoError } = await supabase
        .from('projecoes_vendas')
        .select(`
          id,
          instituto_id,
          dia,
          turno,
          projecao_quantidade,
          vendas_reais,
          data_referencia,
          created_at,
          institutos_vendas!inner(codigo, nome)
        `)
        .eq('data_referencia', dataReferencia)
        .order('created_at', { ascending: false });

      if (historicoError) {
        console.error('❌ ProjecaoVendas: Erro ao carregar histórico:', historicoError);
        setHistorico([]);
      } else {
        console.log('✅ ProjecaoVendas: Histórico carregado:', historicoData?.length || 0);
        const historicoFormatado = (historicoData || []).map(item => ({
          id: item.id,
          instituto_id: item.instituto_id,
          instituto_codigo: item.institutos_vendas.codigo,
          instituto_nome: item.institutos_vendas.nome,
          dia: item.dia,
          turno: item.turno,
          projetado: item.projecao_quantidade,
          vendeu: item.vendas_reais,
          data_referencia: item.data_referencia,
          created_at: item.created_at
        }));
        setHistorico(historicoFormatado);
      }

    } catch (error: any) {
      console.error('❌ ProjecaoVendas: Erro geral ao carregar dados:', error);
      toast({ title: "Erro ao carregar dados", description: error.message });
    } finally {
      setLoading(false);
      console.log("✅ ProjecaoVendas: Carregamento finalizado - loading:", false);
    }
  }, [dataReferencia]);

  // Verificar autenticação
  useEffect(() => {
    const checkAuth = async () => {
      console.log("🔐 ProjecaoVendas: Verificando autenticação...");
      const { data: { user } } = await supabase.auth.getUser();
      const isAuth = !!user;
      setIsAuthenticated(isAuth);
      console.log("🔐 ProjecaoVendas: Status de autenticação:", isAuth);
    };
    
    checkAuth();
  }, []);

  useEffect(() => {
    console.log("🔄 ProjecaoVendas: useEffect loadData - isAuthenticated:", isAuthenticated);
    if (isAuthenticated) {
      console.log("🔄 ProjecaoVendas: useEffect executado (usuário autenticado)");
      loadData();
    }
  }, [loadData, isAuthenticated]);

  // Carregar análise de oferta e demanda
  const loadAnaliseOfertaDemanda = useCallback(async () => {
    console.log("📊 ProjecaoVendas: Carregando análise de oferta e demanda");
    setLoadingAnalise(true);
    try {
      // Calcular demanda média baseada no histórico
      const demandaPorInstituto = new Map<string, number>();
      
      historico.forEach(item => {
        const key = `${item.instituto_codigo}_${item.turno}`;
        const atual = demandaPorInstituto.get(key) || 0;
        demandaPorInstituto.set(key, atual + item.vendeu);
      });

      // Calcular oferta atual (projeções)
      const ofertaPorInstituto = new Map<string, number>();
      
      historico.forEach(item => {
        const key = `${item.instituto_codigo}_${item.turno}`;
        const atual = ofertaPorInstituto.get(key) || 0;
        ofertaPorInstituto.set(key, atual + item.projetado);
      });

      // Gerar análise
      const analise: AnaliseOfertaDemanda[] = institutos.map(instituto => {
        const key = `${instituto.codigo}_${instituto.turno}`;
        const demandaMedia = demandaPorInstituto.get(key) || 0;
        const ofertaAtual = ofertaPorInstituto.get(key) || 0;
        const deficit = Math.max(0, demandaMedia - ofertaAtual);
        
        let recomendacao = "Manter oferta atual";
        let prioridade: 'alta' | 'media' | 'baixa' = 'baixa';
        
        if (deficit > demandaMedia * 0.3) {
          recomendacao = "Aumentar oferta significativamente";
          prioridade = 'alta';
        } else if (deficit > demandaMedia * 0.1) {
          recomendacao = "Aumentar oferta moderadamente";
          prioridade = 'media';
        } else if (ofertaAtual > demandaMedia * 1.5) {
          recomendacao = "Reduzir oferta - excesso de estoque";
          prioridade = 'media';
        }

        return {
          instituto_codigo: instituto.codigo,
          instituto_nome: instituto.nome,
          turno: instituto.turno,
          demanda_media: demandaMedia,
          oferta_atual: ofertaAtual,
          deficit: deficit,
          recomendacao: recomendacao,
          prioridade: prioridade
        };
      });

      setAnaliseOfertaDemanda(analise);
      console.log("✅ ProjecaoVendas: Análise de oferta e demanda carregada:", analise.length);
    } catch (error: any) {
      console.error("❌ ProjecaoVendas: Erro ao carregar análise:", error);
      toast({ title: "Erro", description: "Erro ao carregar análise de oferta e demanda" });
    } finally {
      setLoadingAnalise(false);
    }
  }, [historico, institutos]);

  // Carregar metas de vendas
  const loadMetasVendas = useCallback(async () => {
    console.log("📊 ProjecaoVendas: Carregando metas de vendas");
    setLoadingAnalise(true);
    try {
      // Calcular vendas atuais por instituto
      const vendasPorInstituto = new Map<string, number>();
      
      historico.forEach(item => {
        const atual = vendasPorInstituto.get(item.instituto_codigo) || 0;
        vendasPorInstituto.set(item.instituto_codigo, atual + item.vendeu);
      });

      // Gerar metas baseadas em vendas históricas
      const metas: MetaVenda[] = institutos.map(instituto => {
        const vendasAtuais = vendasPorInstituto.get(instituto.codigo) || 0;
        const metaQuantidade = Math.max(10, vendasAtuais * 1.2); // Meta 20% acima do atual
        const metaValor = metaQuantidade * 5; // Valor médio por item
        const percentualAtingimento = vendasAtuais > 0 ? (vendasAtuais / metaQuantidade) * 100 : 0;
        
        let status: 'acima' | 'dentro' | 'abaixo' = 'abaixo';
        if (percentualAtingimento >= 100) {
          status = 'acima';
        } else if (percentualAtingimento >= 80) {
          status = 'dentro';
        }

        return {
          id: instituto.id,
          instituto_id: instituto.id,
          instituto_codigo: instituto.codigo,
          instituto_nome: instituto.nome,
          periodo: 'Semana Atual',
          meta_quantidade: metaQuantidade,
          meta_valor: metaValor,
          vendas_atuais: vendasAtuais,
          percentual_atingimento: percentualAtingimento,
          status: status
        };
      });

      setMetasVendas(metas);
      console.log("✅ ProjecaoVendas: Metas de vendas carregadas:", metas.length);
    } catch (error: any) {
      console.error("❌ ProjecaoVendas: Erro ao carregar metas:", error);
      toast({ title: "Erro", description: "Erro ao carregar metas de vendas" });
    } finally {
      setLoadingAnalise(false);
    }
  }, [historico, institutos]);

  // Carregar análises quando mudar a aba
  useEffect(() => {
    if (activeTab === 'analise' && institutos.length > 0 && historico.length >= 0) {
      loadAnaliseOfertaDemanda();
    }
  }, [activeTab, institutos.length, historico.length]);

  useEffect(() => {
    if (activeTab === 'metas' && institutos.length > 0 && historico.length >= 0) {
      loadMetasVendas();
    }
  }, [activeTab, institutos.length, historico.length]);

  const handleSaveVenda = useCallback(async (institutoId: string, dia: string, turno: string, projetado: number, vendeu: number) => {
    if (isUpdating) return;
    
    console.log("💾 ProjecaoVendas: Salvando venda", { institutoId, dia, turno, projetado, vendeu });
    setIsUpdating(true);
    try {
      // Verificar se já existe registro para este instituto/dia/turno/data
      const { data: existingData, error: selectError } = await supabase
        .from('projecoes_vendas')
        .select('id')
        .eq('instituto_id', institutoId)
        .eq('dia', dia)
        .eq('turno', turno)
        .eq('data_referencia', dataReferencia)
        .single();

      if (selectError && selectError.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw selectError;
      }

      if (existingData) {
        // Atualizar registro existente
        const { error: updateError } = await supabase
          .from('projecoes_vendas')
          .update({
            projecao_quantidade: projetado,
            vendas_reais: vendeu,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingData.id);

        if (updateError) throw updateError;
      } else {
        // Inserir novo registro
        const { error: insertError } = await supabase
          .from('projecoes_vendas')
          .insert([{
            instituto_id: institutoId,
            dia: dia,
            turno: turno,
            projecao_quantidade: projetado,
            vendas_reais: vendeu,
            data_referencia: dataReferencia
          }]);

        if (insertError) throw insertError;
      }

      toast({ title: "Venda salva", description: "Dados salvos com sucesso!" });
      setEditingCell(null);
      
      // Recarregar dados
      loadData();
    } catch (error: any) {
      console.error('❌ ProjecaoVendas: Erro ao salvar venda:', error);
      toast({ title: "Erro ao salvar", description: error.message });
    } finally {
      setIsUpdating(false);
    }
  }, [isUpdating, dataReferencia, loadData]);

  // Função para obter dados de uma célula específica
  const getCelulaData = useCallback((institutoCodigo: string, dia: string) => {
    const instituto = institutos.find(i => i.codigo === institutoCodigo);
    if (!instituto) return { projetado: 0, vendeu: 0 };

    const historicoItem = historico.find(h => 
      h.instituto_codigo === institutoCodigo && 
      h.dia === dia && 
      h.turno === instituto.turno
    );

    return {
      projetado: historicoItem?.projetado || 0,
      vendeu: historicoItem?.vendeu || 0
    };
  }, [institutos, historico]);

  // Estatísticas do dashboard
  const dashboardStats = useMemo(() => {
    const totalProjetado = historico.reduce((sum, h) => sum + h.projetado, 0);
    const totalVendido = historico.reduce((sum, h) => sum + h.vendeu, 0);
    const diferenca = totalVendido - totalProjetado;
    
    return { totalProjetado, totalVendido, diferenca };
  }, [historico]);

  const performancePorTurno = useMemo(() => {
    return (['manha', 'tarde', 'noite'] as const).map(turno => {
      const vendasTurno = historico.filter(h => h.turno === turno);
      const totalProjetado = vendasTurno.reduce((sum, h) => sum + h.projetado, 0);
      const totalVendido = vendasTurno.reduce((sum, h) => sum + h.vendeu, 0);
      const percentual = totalProjetado > 0 ? (totalVendido / totalProjetado) * 100 : 0;

      return { turno, totalVendido, percentual };
    });
  }, [historico]);

  const topInstitutos = useMemo(() => {
    const institutosComVendas = institutos.map(instituto => {
      const vendasInstituto = historico.filter(h => h.instituto_codigo === instituto.codigo);
      const totalVendido = vendasInstituto.reduce((sum, h) => sum + h.vendeu, 0);
      return { ...instituto, totalVendido };
    });

    return institutosComVendas
      .sort((a, b) => b.totalVendido - a.totalVendido)
      .slice(0, 5);
  }, [institutos, historico]);

  console.log("🎯 ProjecaoVendas: Renderizando com", { 
    institutos: institutos.length, 
    historico: historico.length, 
    loading, 
    dataReferencia 
  });

  if (loading) {
    console.log("⏳ ProjecaoVendas: Mostrando loading");
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <div className="text-lg">Carregando dados de vendas...</div>
        </div>
      </div>
    );
  }

  console.log("✅ ProjecaoVendas: Renderizando componente principal");

  // Se ainda não verificou a autenticação, mostrar loading
  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <div className="text-lg">Verificando autenticação...</div>
        </div>
      </div>
    );
  }

  // Se não está autenticado, mostrar formulário de login
  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Vendas</h1>
          <p className="text-muted-foreground">Faça login para acessar o sistema de vendas</p>
        </div>
        <LoginForm />
      </div>
    );
  }

  // Se está autenticado, mostrar o conteúdo normal
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Vendas</h1>
        <div className="flex items-center gap-4">
          <Label htmlFor="data-referencia">Data de Referência:</Label>
          <Input
            id="data-referencia"
            type="date"
            value={dataReferencia}
            onChange={(e) => setDataReferencia(e.target.value)}
            className="w-auto"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="matriz" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Matriz de Vendas
          </TabsTrigger>
          <TabsTrigger value="historico" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Histórico
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="analise" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Análise Oferta/Demanda
          </TabsTrigger>
          <TabsTrigger value="metas" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Metas de Vendas
          </TabsTrigger>
          <TabsTrigger value="teste" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Teste
          </TabsTrigger>
        </TabsList>

        <TabsContent value="matriz" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Matriz de Vendas - Institutos vs Dias da Semana</CardTitle>
              <p className="text-sm text-muted-foreground">
                Clique nas células para editar projeção e vendas reais. Total de {institutos.length} institutos.
              </p>
            </CardHeader>
            <CardContent>
              {institutos.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum instituto encontrado. Verifique se a tabela institutos_vendas foi criada.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-56 bg-muted/50 sticky left-0 z-10">
                          <div className="font-bold text-center">Instituto</div>
                        </TableHead>
                        {diasSemana.map(dia => (
                          <TableHead key={dia} className="text-center min-w-40 bg-muted/30">
                            <div className="font-medium text-lg">{labelDia[dia]}</div>
                            <div className="text-xs text-muted-foreground">Proj | Vendeu</div>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {institutos.map(instituto => (
                        <TableRow key={instituto.id} className="hover:bg-muted/30">
                          <TableCell className="font-medium bg-muted/20 sticky left-0 z-10 border-r">
                            <div className="space-y-2">
                              <div className="font-bold text-xl text-center">{instituto.codigo}</div>
                              <div className="text-sm text-muted-foreground leading-tight text-center">{instituto.nome}</div>
                              <div className="flex justify-center">
                                <Badge variant="outline" className="text-xs">
                                  {labelTurno[instituto.turno]}
                                </Badge>
                              </div>
                            </div>
                          </TableCell>
                          {diasSemana.map(dia => {
                            const { projetado, vendeu } = getCelulaData(instituto.codigo, dia);
                            const isEditing = editingCell?.instituto === instituto.codigo && editingCell?.dia === dia;

                            return (
                              <TableCell key={dia} className="text-center p-2 min-w-40">
                                <CelulaVenda
                                  instituto={instituto}
                                  dia={dia}
                                  projetado={projetado}
                                  vendeu={vendeu}
                                  isEditing={isEditing}
                                  onEdit={() => setEditingCell({ instituto: instituto.codigo, dia })}
                                  onSave={(projetado, vendeu) => handleSaveVenda(instituto.id, dia, instituto.turno, projetado, vendeu)}
                                  onCancel={() => setEditingCell(null)}
                                  isUpdating={isUpdating}
                                />
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historico" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Vendas</CardTitle>
              <p className="text-sm text-muted-foreground">
                Histórico completo de todas as vendas registradas para {dataReferencia}
              </p>
            </CardHeader>
            <CardContent>
              {historico.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum registro de venda encontrado para esta data.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {historico.map((item) => (
                    <div key={item.id} className="border rounded p-3 hover:bg-muted/30">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{item.instituto_codigo} - {item.instituto_nome}</div>
                          <div className="text-sm text-muted-foreground">
                            {labelDia[item.dia]} - {labelTurno[item.turno]}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            <span className="text-blue-600">Proj: {item.projetado}</span> | 
                            <span className="text-green-600"> Vendeu: {item.vendeu}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(item.created_at).toLocaleString('pt-BR')}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dashboard de Vendas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border rounded p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {dashboardStats.totalProjetado}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Projetado</div>
                </div>
                <div className="border rounded p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {dashboardStats.totalVendido}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Vendido</div>
                </div>
                <div className="border rounded p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {dashboardStats.diferenca}
                  </div>
                  <div className="text-sm text-muted-foreground">Diferença Total</div>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="font-medium mb-4">Performance por Turno</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {performancePorTurno.map(({ turno, totalVendido, percentual }) => (
                    <div key={turno} className="border rounded p-4">
                      <div className="font-medium">{labelTurno[turno]}</div>
                      <div className="text-2xl font-bold">{totalVendido}</div>
                      <div className="text-sm text-muted-foreground">
                        {percentual.toFixed(1)}% da meta
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <h3 className="font-medium mb-4">Top 5 Institutos</h3>
                <div className="space-y-2">
                  {topInstitutos.map((instituto, index) => (
                    <div key={instituto.id} className="flex items-center justify-between border rounded p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{instituto.codigo}</div>
                          <div className="text-sm text-muted-foreground">{instituto.nome}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{instituto.totalVendido}</div>
                        <div className="text-sm text-muted-foreground">vendas</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analise" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Análise de Oferta e Demanda
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Análise comparativa entre demanda média e oferta atual por instituto
              </p>
            </CardHeader>
            <CardContent>
              {loadingAnalise ? (
                <div className="flex items-center justify-center p-8">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <div className="text-lg">Carregando análise...</div>
                  </div>
                </div>
              ) : analiseOfertaDemanda.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma análise disponível. Adicione dados de vendas primeiro.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {analiseOfertaDemanda.map((item, index) => (
                      <Card key={index} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-lg">{item.instituto_codigo}</CardTitle>
                              <p className="text-sm text-muted-foreground">{item.instituto_nome}</p>
                            </div>
                            <Badge 
                              variant={item.prioridade === 'alta' ? 'destructive' : item.prioridade === 'media' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {item.prioridade.toUpperCase()}
                            </Badge>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {labelTurno[item.turno]}
                          </Badge>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <div className="font-medium text-blue-600">Demanda Média</div>
                              <div className="text-lg font-bold">{item.demanda_media}</div>
                            </div>
                            <div>
                              <div className="font-medium text-green-600">Oferta Atual</div>
                              <div className="text-lg font-bold">{item.oferta_atual}</div>
                            </div>
                          </div>
                          
                          {item.deficit > 0 && (
                            <div className="bg-red-50 border border-red-200 rounded p-2">
                              <div className="text-sm font-medium text-red-800">Déficit: {item.deficit}</div>
                            </div>
                          )}
                          
                          <div className="text-sm">
                            <div className="font-medium mb-1">Recomendação:</div>
                            <div className="text-muted-foreground">{item.recomendacao}</div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Metas de Vendas
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Acompanhamento de metas por instituto e período
              </p>
            </CardHeader>
            <CardContent>
              {loadingAnalise ? (
                <div className="flex items-center justify-center p-8">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <div className="text-lg">Carregando metas...</div>
                  </div>
                </div>
              ) : metasVendas.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma meta disponível. Adicione dados de vendas primeiro.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {metasVendas.map((meta) => (
                      <Card key={meta.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-lg">{meta.instituto_codigo}</CardTitle>
                              <p className="text-sm text-muted-foreground">{meta.instituto_nome}</p>
                            </div>
                            <Badge 
                              variant={meta.status === 'acima' ? 'default' : meta.status === 'dentro' ? 'secondary' : 'destructive'}
                              className="text-xs"
                            >
                              {meta.status === 'acima' ? 'ACIMA' : meta.status === 'dentro' ? 'DENTRO' : 'ABAIXO'}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">{meta.periodo}</div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <div className="font-medium text-blue-600">Meta</div>
                              <div className="text-lg font-bold">{meta.meta_quantidade}</div>
                            </div>
                            <div>
                              <div className="font-medium text-green-600">Vendido</div>
                              <div className="text-lg font-bold">{meta.vendas_atuais}</div>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Atingimento:</span>
                              <span className="font-medium">{meta.percentual_atingimento.toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  meta.percentual_atingimento >= 100 ? 'bg-green-500' : 
                                  meta.percentual_atingimento >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${Math.min(100, meta.percentual_atingimento)}%` }}
                              ></div>
                            </div>
                          </div>
                          
                          <div className="text-sm">
                            <div className="font-medium">Meta de Valor:</div>
                            <div className="text-muted-foreground">R$ {meta.meta_valor.toFixed(2)}</div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teste" className="space-y-4">
          <TesteConexao />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default ProjecaoVendas;