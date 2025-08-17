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
  const [institutos, setInstitutos] = useState<InstitutoVenda[]>([]);
  const [historico, setHistorico] = useState<VendaHistorico[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [dataReferencia, setDataReferencia] = useState(new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState('matriz');

  // Estados para edição inline
  const [editingCell, setEditingCell] = useState<{instituto: string, dia: string} | null>(null);

  // Carregar dados
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Carregar institutos
      const { data: institutosData, error: institutosError } = await supabase
        .from('institutos_vendas')
        .select('*')
        .order('codigo');

      if (institutosError) {
        console.error('Erro ao carregar institutos:', institutosError);
        toast({ title: "Erro", description: "Erro ao carregar institutos" });
        setInstitutos([]);
      } else {
        setInstitutos(institutosData || []);
        console.log('Institutos carregados:', institutosData?.length || 0);
      }

      // Carregar histórico
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
        console.error('Erro ao carregar histórico:', historicoError);
        setHistorico([]);
      } else {
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
      console.error('Erro geral ao carregar dados:', error);
      toast({ title: "Erro ao carregar dados", description: error.message });
    } finally {
      setLoading(false);
    }
  }, [dataReferencia]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveVenda = useCallback(async (institutoId: string, dia: string, turno: string, projetado: number, vendeu: number) => {
    if (isUpdating) return;
    
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
      console.error('Erro ao salvar venda:', error);
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
        <TabsList className="grid w-full grid-cols-3">
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
      </Tabs>
    </div>
  );
}

export default ProjecaoVendas;