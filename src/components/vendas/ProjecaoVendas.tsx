import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
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
  onSave: (projecao: number, vendasReais: number) => void;
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
            onClick={() => onSave(editProjecao, editVendasReais)}
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
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [dataReferencia, setDataReferencia] = useState(new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState('matriz');

  // Estados para edição inline
  const [editingCell, setEditingCell] = useState<{instituto: string, dia: string} | null>(null);

  // Cache para otimizar renderização
  const cellCache = useRef(new Map<string, MatrizVenda>());

  // Carregar dados
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Carregar apenas institutos (funcionalidade principal)
      const { data: institutosData, error: institutosError } = await supabase
        .from('institutos_vendas')
        .select('*')
        .order('codigo');

      if (institutosError) {
        console.error('Erro ao carregar institutos:', institutosError);
        toast({ title: "Aviso", description: "Erro ao carregar institutos. Execute o SQL de inserção primeiro." });
        setInstitutos([]);
      } else {
        setInstitutos(institutosData || []);
        console.log('Institutos carregados:', institutosData?.length || 0);
      }

      // Carregar projeções existentes (se a tabela existir)
      try {
        const { data: projecoesData, error: projecoesError } = await supabase
          .from('projecoes_vendas')
          .select('*')
          .eq('data_referencia', dataReferencia);

        if (!projecoesError && projecoesData) {
          // Converter para formato da matriz
          const matrizData = projecoesData.map(proj => ({
            codigo: institutosData?.find(i => i.id === proj.instituto_id)?.codigo || '',
            nome: institutosData?.find(i => i.id === proj.instituto_id)?.nome || '',
            turno: proj.turno,
            dia: proj.dia,
            projecao: proj.projecao_quantidade,
            vendas_reais: proj.vendas_reais,
            diferenca: proj.vendas_reais - proj.projecao_quantidade,
            percentual_acerto: proj.projecao_quantidade > 0 ? (proj.vendas_reais / proj.projecao_quantidade) * 100 : 0,
            projecao_id: proj.id
          }));
          
          setMatrizVendas(matrizData);
          
          // Atualizar cache
          cellCache.current.clear();
          matrizData.forEach(cell => {
            const key = `${cell.codigo}-${cell.dia}`;
            cellCache.current.set(key, cell);
          });
        } else {
          setMatrizVendas([]);
        }
      } catch (error) {
        console.warn('Tabela projecoes_vendas não disponível:', error);
        setMatrizVendas([]);
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
    if (isUpdating) return;
    
    setIsUpdating(true);
    try {
      // Inserção/atualização direta na tabela
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
  }, [isUpdating, dataReferencia, loadData, institutos]);

  // Memoizar funções utilitárias com cache
  const getMatrizCell = useCallback((institutoCodigo: string, dia: string) => {
    const key = `${institutoCodigo}-${dia}`;
    return cellCache.current.get(key) || matrizVendas.find(m => m.codigo === institutoCodigo && m.dia === dia);
  }, [matrizVendas]);

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
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
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
                                onSave={(projecao, vendasReais) => handleUpdateProjecao(instituto.id, dia, instituto.turno, projecao, vendasReais)}
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

        <TabsContent value="analise" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Análise de Oferta e Demanda</CardTitle>
              <p className="text-sm text-muted-foreground">
                Funcionalidade em desenvolvimento. Execute o SQL completo para habilitar.
              </p>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Análise de oferta e demanda será implementada em breve.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Metas de Vendas</CardTitle>
              <p className="text-sm text-muted-foreground">
                Funcionalidade em desenvolvimento. Execute o SQL completo para habilitar.
              </p>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Metas de vendas será implementada em breve.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default ProjecaoVendas;