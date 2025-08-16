import React, { useEffect, useState, useCallback, useMemo, useRef, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, TrendingUp, TrendingDown, Target, BarChart3, RefreshCw, Save, X } from "lucide-react";

type InstitutoVenda = {
  id: string;
  codigo: string;
  nome: string;
  turno: 'manha' | 'tarde' | 'noite';
};

type ProjecaoVenda = {
  id: string;
  instituto_id: string;
  dia: 'seg' | 'ter' | 'qua' | 'qui' | 'sex';
  turno: 'manha' | 'tarde' | 'noite';
  projecao_quantidade: number;
  vendas_reais: number;
  data_referencia: string;
};

type MatrizVenda = {
  codigo: string;
  nome: string;
  turno: 'manha' | 'tarde' | 'noite';
  dia: 'seg' | 'ter' | 'qua' | 'qui' | 'sex';
  projecao: number;
  vendas_reais: number;
  diferenca: number;
  percentual_acerto: number;
  projecao_id: string | null;
};

type AnaliseOfertaDemanda = {
  codigo: string;
  nome: string;
  turno: 'manha' | 'tarde' | 'noite';
  dia: 'seg' | 'ter' | 'qua' | 'qui' | 'sex';
  oferta_disponivel: number;
  demanda_esperada: number;
  deficit_superavit: number;
  status_oferta_demanda: string;
  percentual_cobertura: number;
};

type MetaVenda = {
  id: string;
  tipo_periodo: 'diaria' | 'semanal' | 'mensal' | 'semestral';
  instituto_id: string;
  quantidade_meta: number;
  periodo_inicio: string;
  periodo_fim: string;
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

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

// Debounce hook para otimizar inputs
const useDebounce = (value: any, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Hook para otimizar requisições
const useOptimizedRequest = () => {
  const [isPending, startTransition] = useTransition();
  const abortControllerRef = useRef<AbortController | null>(null);

  const makeRequest = useCallback(async (requestFn: () => Promise<any>) => {
    // Cancelar requisição anterior se existir
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    return new Promise((resolve, reject) => {
      startTransition(async () => {
        try {
          const result = await requestFn();
          resolve(result);
        } catch (error) {
          if (error.name !== 'AbortError') {
            reject(error);
          }
        }
      });
    });
  }, []);

  return { makeRequest, isPending };
};

// Componente otimizado para célula da matriz
const MatrizCell = React.memo(({ 
  instituto, 
  dia, 
  cell, 
  isEditing, 
  onEdit, 
  onSave, 
  onCancel, 
  isUpdating 
}: {
  instituto: InstitutoVenda;
  dia: string;
  cell: MatrizVenda | undefined;
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  isUpdating: boolean;
}) => {
  const [editProjecao, setEditProjecao] = useState(cell?.projecao || 0);
  const [editVendasReais, setEditVendasReais] = useState(cell?.vendas_reais || 0);

  useEffect(() => {
    setEditProjecao(cell?.projecao || 0);
    setEditVendasReais(cell?.vendas_reais || 0);
  }, [cell]);

  const getStatusColor = useCallback((percentual: number) => {
    if (percentual >= 90) return 'bg-green-100 text-green-800';
    if (percentual >= 70) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  }, []);

  if (isEditing) {
    return (
      <div className="space-y-3 p-3 border rounded bg-background shadow-sm">
        <div>
          <Label className="text-xs font-medium text-blue-600">Projeção:</Label>
          <Input
            type="number"
            value={editProjecao}
            onChange={(e) => setEditProjecao(Number(e.target.value))}
            className="h-8 text-xs mt-1"
            placeholder="0"
            autoFocus
          />
        </div>
        <div>
          <Label className="text-xs font-medium text-green-600">Vendeu:</Label>
          <Input
            type="number"
            value={editVendasReais}
            onChange={(e) => setEditVendasReais(Number(e.target.value))}
            className="h-8 text-xs mt-1"
            placeholder="0"
          />
        </div>
        <div className="flex gap-1">
          <Button
            size="sm"
            onClick={() => onSave()}
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
      className="cursor-pointer hover:bg-muted p-3 rounded border border-transparent hover:border-border transition-all min-h-24 flex flex-col justify-center group"
      onClick={onEdit}
    >
      <div className="space-y-2">
        <div className="text-sm font-medium text-blue-600 group-hover:text-blue-700">
          Proj: {cell?.projecao || 0}
        </div>
        <div className="text-sm font-medium text-green-600 group-hover:text-green-700">
          Vendeu: {cell?.vendas_reais || 0}
        </div>
        {cell && cell.projecao > 0 && (
          <Badge 
            variant="outline" 
            className={`text-xs ${getStatusColor(cell.percentual_acerto)}`}
          >
            {cell.percentual_acerto.toFixed(1)}%
          </Badge>
        )}
        {!cell && (
          <div className="text-xs text-muted-foreground group-hover:text-foreground">
            Clique para editar
          </div>
        )}
      </div>
    </div>
  );
});

MatrizCell.displayName = 'MatrizCell';

function ProjecaoVendas() {
  const [institutos, setInstitutos] = useState<InstitutoVenda[]>([]);
  const [matrizVendas, setMatrizVendas] = useState<MatrizVenda[]>([]);
  const [analiseOfertaDemanda, setAnaliseOfertaDemanda] = useState<AnaliseOfertaDemanda[]>([]);
  const [metas, setMetas] = useState<MetaVenda[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataReferencia, setDataReferencia] = useState(new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState('matriz');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Estados para edição inline
  const [editingCell, setEditingCell] = useState<{instituto: string, dia: string} | null>(null);

  // Hook para otimizar requisições
  const { makeRequest, isPending } = useOptimizedRequest();

  // Cache para otimizar renderização
  const cellCache = useRef(new Map<string, MatrizVenda>());

  // Estados para metas
  const [novaMeta, setNovaMeta] = useState({
    tipo_periodo: 'diaria' as const,
    instituto_id: '',
    quantidade_meta: 0,
    periodo_inicio: '',
    periodo_fim: ''
  });

  // Estados para análise de oferta e demanda
  const [novaAnalise, setNovaAnalise] = useState({
    instituto_id: '',
    dia: 'seg' as const,
    turno: 'manha' as const,
    oferta_disponivel: 0,
    demanda_esperada: 0
  });

  // Memoizar loadData para evitar recriações desnecessárias
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Carregar dados em paralelo para melhor performance
      const [institutosResult, matrizResult, analiseResult, metasResult] = await Promise.allSettled([
        supabase.from('institutos_vendas').select('*').order('codigo'),
        supabase.rpc('obter_matriz_vendas', { p_data_referencia: dataReferencia }),
        supabase.from('analise_oferta_demanda_view').select('*').eq('data_referencia', dataReferencia),
        supabase.from('metas_vendas').select('*').order('tipo_periodo, periodo_inicio')
      ]);

      // Processar resultados dos institutos
      if (institutosResult.status === 'fulfilled' && !institutosResult.value.error) {
        setInstitutos(institutosResult.value.data || []);
      } else {
        console.error('Erro ao carregar institutos:', institutosResult.status === 'rejected' ? institutosResult.reason : institutosResult.value?.error);
        toast({ title: "Aviso", description: "Erro ao carregar institutos. Execute o SQL de inserção primeiro." });
        setInstitutos([]);
      }

      // Processar resultados da matriz
      if (matrizResult.status === 'fulfilled' && !matrizResult.value.error) {
        const matrizData = matrizResult.value.data || [];
        setMatrizVendas(matrizData);
        
        // Atualizar cache
        cellCache.current.clear();
        matrizData.forEach(cell => {
          const key = `${cell.codigo}-${cell.dia}`;
          cellCache.current.set(key, cell);
        });
      } else {
        console.warn('Função obter_matriz_vendas não disponível:', matrizResult.status === 'rejected' ? matrizResult.reason : matrizResult.value?.error);
        setMatrizVendas([]);
      }

      // Processar resultados da análise
      if (analiseResult.status === 'fulfilled' && !analiseResult.value.error) {
        setAnaliseOfertaDemanda(analiseResult.value.data || []);
      } else {
        console.warn('View analise_oferta_demanda_view não disponível:', analiseResult.status === 'rejected' ? analiseResult.reason : analiseResult.value?.error);
        setAnaliseOfertaDemanda([]);
      }

      // Processar resultados das metas
      if (metasResult.status === 'fulfilled' && !metasResult.value.error) {
        setMetas(metasResult.value.data || []);
      } else {
        console.warn('Tabela metas_vendas não disponível:', metasResult.status === 'rejected' ? metasResult.reason : metasResult.value?.error);
        setMetas([]);
      }

    } catch (error: any) {
      console.error('Erro geral ao carregar dados:', error);
      toast({ title: "Erro ao carregar dados", description: error.message });
    } finally {
      setLoading(false);
    }
  }, [dataReferencia]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpdateProjecao = useCallback(async (institutoId: string, dia: string, turno: string, projecao: number, vendasReais: number) => {
    if (isUpdating) return; // Prevenir múltiplas atualizações simultâneas
    
    setIsUpdating(true);
    try {
      await makeRequest(async () => {
        // Primeiro, tentar usar a função RPC
        try {
          const { error } = await supabase.rpc('atualizar_projecao_vendas', {
            p_instituto_id: institutoId,
            p_dia: dia,
            p_turno: turno,
            p_projecao: projecao,
            p_vendas_reais: vendasReais,
            p_data_referencia: dataReferencia
          });

          if (error) throw error;
          return;
        } catch (rpcError: any) {
          console.warn('Função RPC não disponível, tentando inserção direta:', rpcError);
        }

        // Fallback: inserção/atualização direta na tabela
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
              projecao_quantidade: projecao,
              vendas_reais: vendasReais,
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
              projecao_quantidade: projecao,
              vendas_reais: vendasReais,
              data_referencia: dataReferencia
            }]);

          if (insertError) throw insertError;
        }
      });

      toast({ title: "Projeção atualizada", description: "Dados salvos com sucesso!" });
      setEditingCell(null);
      
      // Atualizar cache localmente para melhor performance
      const instituto = institutos.find(i => i.id === institutoId);
      if (instituto) {
        const key = `${instituto.codigo}-${dia}`;
        cellCache.current.set(key, {
          codigo: instituto.codigo,
          nome: instituto.nome,
          turno: instituto.turno,
          dia: dia as any,
          projecao,
          vendas_reais: vendasReais,
          diferenca: vendasReais - projecao,
          percentual_acerto: projecao > 0 ? (vendasReais / projecao) * 100 : 0,
          projecao_id: null
        });
      }
      
      // Recarregar dados em background
      loadData();
    } catch (error: any) {
      console.error('Erro ao atualizar projeção:', error);
      toast({ title: "Erro ao atualizar", description: error.message });
    } finally {
      setIsUpdating(false);
    }
  }, [isUpdating, dataReferencia, loadData, makeRequest, institutos]);

  const handleSaveMeta = useCallback(async () => {
    try {
      const { error } = await supabase
        .from('metas_vendas')
        .insert([novaMeta]);

      if (error) throw error;

      toast({ title: "Meta salva", description: "Meta de vendas criada com sucesso!" });
      setNovaMeta({
        tipo_periodo: 'diaria',
        instituto_id: '',
        quantidade_meta: 0,
        periodo_inicio: '',
        periodo_fim: ''
      });
      loadData();
    } catch (error: any) {
      console.error('Erro ao salvar meta:', error);
      toast({ title: "Erro ao salvar meta", description: error.message });
    }
  }, [novaMeta, loadData]);

  const handleSaveAnalise = useCallback(async () => {
    try {
      const { error } = await supabase.rpc('calcular_oferta_demanda', {
        p_instituto_id: novaAnalise.instituto_id,
        p_dia: novaAnalise.dia,
        p_turno: novaAnalise.turno,
        p_oferta: novaAnalise.oferta_disponivel,
        p_demanda: novaAnalise.demanda_esperada,
        p_data_referencia: dataReferencia
      });

      if (error) throw error;

      toast({ title: "Análise salva", description: "Análise de oferta e demanda criada com sucesso!" });
      setNovaAnalise({
        instituto_id: '',
        dia: 'seg',
        turno: 'manha',
        oferta_disponivel: 0,
        demanda_esperada: 0
      });
      loadData();
    } catch (error: any) {
      console.error('Erro ao salvar análise:', error);
      toast({ title: "Erro ao salvar análise", description: error.message });
    }
  }, [novaAnalise, dataReferencia, loadData]);

  // Memoizar funções utilitárias com cache
  const getMatrizCell = useCallback((institutoCodigo: string, dia: string) => {
    const key = `${institutoCodigo}-${dia}`;
    return cellCache.current.get(key) || matrizVendas.find(m => m.codigo === institutoCodigo && m.dia === dia);
  }, [matrizVendas]);

  const getStatusColor = useCallback((percentual: number) => {
    if (percentual >= 90) return 'bg-green-100 text-green-800';
    if (percentual >= 70) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  }, []);

  const getOfertaDemandaColor = useCallback((status: string) => {
    switch (status) {
      case 'Superávit': return 'bg-green-100 text-green-800';
      case 'Déficit': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  }, []);

  // Memoizar cálculos de dashboard
  const dashboardStats = useMemo(() => {
    const totalProjetado = matrizVendas.reduce((sum, m) => sum + m.projecao, 0);
    const totalVendido = matrizVendas.reduce((sum, m) => sum + m.vendas_reais, 0);
    const diferencaTotal = matrizVendas.reduce((sum, m) => sum + m.diferenca, 0);
    
    return { totalProjetado, totalVendido, diferencaTotal };
  }, [matrizVendas]);

  const performancePorTurno = useMemo(() => {
    return (['manha', 'tarde', 'noite'] as const).map(turno => {
      const vendasTurno = matrizVendas.filter(m => m.turno === turno);
      const totalProjetado = vendasTurno.reduce((sum, m) => sum + m.projecao, 0);
      const totalVendido = vendasTurno.reduce((sum, m) => sum + m.vendas_reais, 0);
      const percentual = totalProjetado > 0 ? (totalVendido / totalProjetado) * 100 : 0;

      return { turno, totalVendido, percentual };
    });
  }, [matrizVendas]);

  const topInstitutos = useMemo(() => {
    return institutos
      .map(instituto => {
        const vendasInstituto = matrizVendas.filter(m => m.codigo === instituto.codigo);
        const totalVendido = vendasInstituto.reduce((sum, m) => sum + m.vendas_reais, 0);
        return { ...instituto, totalVendido };
      })
      .sort((a, b) => b.totalVendido - a.totalVendido)
      .slice(0, 5);
  }, [institutos, matrizVendas]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <div className="text-lg">Carregando dados de vendas...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Projeção de Vendas</h1>
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
            disabled={loading || isRefreshing}
            className="flex items-center gap-2"
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Atualizar
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="matriz" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Matriz de Vendas
          </TabsTrigger>
          <TabsTrigger value="analise" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Análise Oferta/Demanda
          </TabsTrigger>
          <TabsTrigger value="metas" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Metas de Vendas
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
        </TabsList>

        <TabsContent value="matriz" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Matriz de Vendas - Institutos vs Dias da Semana</CardTitle>
              <p className="text-sm text-muted-foreground">
                Institutos na lateral esquerda, dias da semana no topo. Clique nas células para editar projeção e vendas reais. Total de {institutos.length} institutos.
              </p>
            </CardHeader>
            <CardContent>
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
                          const cell = getMatrizCell(instituto.codigo, dia);
                          const isEditing = editingCell?.instituto === instituto.codigo && editingCell?.dia === dia;

                          return (
                            <TableCell key={dia} className="text-center p-2 min-w-40">
                              <MatrizCell
                                instituto={instituto}
                                dia={dia}
                                cell={cell}
                                isEditing={isEditing}
                                onEdit={() => setEditingCell({ instituto: instituto.codigo, dia })}
                                onSave={() => {
                                  // Esta função será chamada pelo componente MatrizCell
                                  // com os valores internos do componente
                                }}
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analise" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Análise de Oferta e Demanda</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium">Nova Análise</h3>
                  <div className="space-y-2">
                    <Label>Instituto:</Label>
                    <Select value={novaAnalise.instituto_id} onValueChange={(value) => setNovaAnalise(prev => ({ ...prev, instituto_id: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o instituto" />
                      </SelectTrigger>
                      <SelectContent>
                        {institutos.map(instituto => (
                          <SelectItem key={instituto.id} value={instituto.id}>
                            {instituto.codigo} - {instituto.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>Dia:</Label>
                      <Select value={novaAnalise.dia} onValueChange={(value: any) => setNovaAnalise(prev => ({ ...prev, dia: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {diasSemana.map(dia => (
                            <SelectItem key={dia} value={dia}>{labelDia[dia]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Turno:</Label>
                      <Select value={novaAnalise.turno} onValueChange={(value: any) => setNovaAnalise(prev => ({ ...prev, turno: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manha">Manhã</SelectItem>
                          <SelectItem value="tarde">Tarde</SelectItem>
                          <SelectItem value="noite">Noite</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>Oferta Disponível:</Label>
                      <Input
                        type="number"
                        value={novaAnalise.oferta_disponivel}
                        onChange={(e) => setNovaAnalise(prev => ({ ...prev, oferta_disponivel: Number(e.target.value) }))}
                      />
                    </div>
                    <div>
                      <Label>Demanda Esperada:</Label>
                      <Input
                        type="number"
                        value={novaAnalise.demanda_esperada}
                        onChange={(e) => setNovaAnalise(prev => ({ ...prev, demanda_esperada: Number(e.target.value) }))}
                      />
                    </div>
                  </div>
                  <Button onClick={handleSaveAnalise} className="w-full">Salvar Análise</Button>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium">Análises Existentes</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {analiseOfertaDemanda.map((analise, index) => (
                      <div key={index} className="border rounded p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{analise.codigo}</div>
                            <div className="text-sm text-muted-foreground">
                              {labelDia[analise.dia]} - {labelTurno[analise.turno]}
                            </div>
                          </div>
                          <Badge className={getOfertaDemandaColor(analise.status_oferta_demanda)}>
                            {analise.status_oferta_demanda}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                          <div>Oferta: {analise.oferta_disponivel}</div>
                          <div>Demanda: {analise.demanda_esperada}</div>
                          <div>Déficit/Superávit: {analise.deficit_superavit}</div>
                          <div>Cobertura: {analise.percentual_cobertura.toFixed(1)}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Metas de Vendas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium">Nova Meta</h3>
                  <div className="space-y-2">
                    <Label>Tipo de Período:</Label>
                    <Select value={novaMeta.tipo_periodo} onValueChange={(value: any) => setNovaMeta(prev => ({ ...prev, tipo_periodo: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="diaria">Diária</SelectItem>
                        <SelectItem value="semanal">Semanal</SelectItem>
                        <SelectItem value="mensal">Mensal</SelectItem>
                        <SelectItem value="semestral">Semestral</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Instituto:</Label>
                    <Select value={novaMeta.instituto_id} onValueChange={(value) => setNovaMeta(prev => ({ ...prev, instituto_id: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o instituto" />
                      </SelectTrigger>
                      <SelectContent>
                        {institutos.map(instituto => (
                          <SelectItem key={instituto.id} value={instituto.id}>
                            {instituto.codigo} - {instituto.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Quantidade Meta:</Label>
                    <Input
                      type="number"
                      value={novaMeta.quantidade_meta}
                      onChange={(e) => setNovaMeta(prev => ({ ...prev, quantidade_meta: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>Início:</Label>
                      <Input
                        type="date"
                        value={novaMeta.periodo_inicio}
                        onChange={(e) => setNovaMeta(prev => ({ ...prev, periodo_inicio: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Fim:</Label>
                      <Input
                        type="date"
                        value={novaMeta.periodo_fim}
                        onChange={(e) => setNovaMeta(prev => ({ ...prev, periodo_fim: e.target.value }))}
                      />
                    </div>
                  </div>
                  <Button onClick={handleSaveMeta} className="w-full">Salvar Meta</Button>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium">Metas Existentes</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {metas.map((meta) => {
                      const instituto = institutos.find(i => i.id === meta.instituto_id);
                      return (
                        <div key={meta.id} className="border rounded p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{instituto?.codigo}</div>
                              <div className="text-sm text-muted-foreground">
                                {meta.tipo_periodo.charAt(0).toUpperCase() + meta.tipo_periodo.slice(1)}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">{meta.quantidade_meta}</div>
                              <div className="text-sm text-muted-foreground">
                                {new Date(meta.periodo_inicio).toLocaleDateString()} - {new Date(meta.periodo_fim).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
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
                    {dashboardStats.diferencaTotal}
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
      </Tabs>
    </div>
  );
}

export default ProjecaoVendas;