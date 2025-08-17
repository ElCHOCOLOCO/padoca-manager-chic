import React, { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, BarChart3, History, TrendingUp, RefreshCw } from "lucide-react";
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

function ProjecaoVendasDebug() {
  console.log("🚀 ProjecaoVendasDebug: Componente iniciado");
  
  const [institutos, setInstitutos] = useState<InstitutoVenda[]>([]);
  const [historico, setHistorico] = useState<VendaHistorico[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [dataReferencia, setDataReferencia] = useState(new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState('matriz');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Estados para edição inline
  const [editingCell, setEditingCell] = useState<{instituto: string, dia: string} | null>(null);

  // Carregar dados
  const loadData = useCallback(async () => {
    console.log("📊 ProjecaoVendasDebug: Iniciando carregamento de dados");
    setLoading(true);
    try {
      // Carregar institutos
      console.log("🔍 ProjecaoVendasDebug: Carregando institutos...");
      const { data: institutosData, error: institutosError } = await supabase
        .from('institutos_vendas')
        .select('*')
        .order('codigo');

      if (institutosError) {
        console.error('❌ ProjecaoVendasDebug: Erro ao carregar institutos:', institutosError);
        toast({ title: "Erro", description: "Erro ao carregar institutos" });
        setInstitutos([]);
      } else {
        console.log('✅ ProjecaoVendasDebug: Institutos carregados:', institutosData?.length || 0);
        setInstitutos(institutosData || []);
      }

      // Carregar histórico
      console.log("🔍 ProjecaoVendasDebug: Carregando histórico...");
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
        console.error('❌ ProjecaoVendasDebug: Erro ao carregar histórico:', historicoError);
        setHistorico([]);
      } else {
        console.log('✅ ProjecaoVendasDebug: Histórico carregado:', historicoData?.length || 0);
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
      console.error('❌ ProjecaoVendasDebug: Erro geral ao carregar dados:', error);
      toast({ title: "Erro ao carregar dados", description: error.message });
    } finally {
      setLoading(false);
      console.log("✅ ProjecaoVendasDebug: Carregamento finalizado - loading:", false);
    }
  }, [dataReferencia]);

  // Verificar autenticação
  useEffect(() => {
    const checkAuth = async () => {
      console.log("🔐 ProjecaoVendasDebug: Verificando autenticação...");
      const { data: { user } } = await supabase.auth.getUser();
      const isAuth = !!user;
      setIsAuthenticated(isAuth);
      console.log("🔐 ProjecaoVendasDebug: Status de autenticação:", isAuth);
    };
    
    checkAuth();
  }, []);

  useEffect(() => {
    console.log("🔄 ProjecaoVendasDebug: useEffect loadData - isAuthenticated:", isAuthenticated);
    if (isAuthenticated) {
      console.log("🔄 ProjecaoVendasDebug: useEffect executado (usuário autenticado)");
      loadData();
    }
  }, [loadData, isAuthenticated]);

  // Função para obter dados da célula
  const getCelulaData = useCallback((institutoCodigo: string, dia: string) => {
    const item = historico.find(h => h.instituto_codigo === institutoCodigo && h.dia === dia);
    return {
      projetado: item?.projetado || 0,
      vendeu: item?.vendeu || 0
    };
  }, [historico]);

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
          <h1 className="text-3xl font-bold mb-2">Vendas (Debug)</h1>
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
        <h1 className="text-3xl font-bold">Vendas (Debug)</h1>
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

      {loading ? (
        <div className="flex items-center justify-center p-8">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <div className="text-lg">Carregando dados...</div>
          </div>
        </div>
      ) : (
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
            <TabsTrigger value="debug" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Debug
            </TabsTrigger>
          </TabsList>

          <TabsContent value="matriz" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Matriz de Vendas - Institutos vs Dias da Semana</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Total de {institutos.length} institutos carregados.
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

                              return (
                                <TableCell key={dia} className="text-center p-2 min-w-40">
                                  <div className="space-y-1">
                                    <div className="text-xs font-medium text-blue-600">
                                      Proj: {projetado || 0}
                                    </div>
                                    <div className="text-xs font-medium text-green-600">
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
                                  </div>
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
                  Total de {historico.length} registros encontrados.
                </p>
              </CardHeader>
              <CardContent>
                {historico.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum histórico encontrado para a data selecionada.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
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

          <TabsContent value="debug" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Informações de Debug</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Status do Componente:</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Autenticado:</span> {isAuthenticated ? 'Sim' : 'Não'}
                      </div>
                      <div>
                        <span className="font-medium">Loading:</span> {loading ? 'Sim' : 'Não'}
                      </div>
                      <div>
                        <span className="font-medium">Institutos:</span> {institutos.length}
                      </div>
                      <div>
                        <span className="font-medium">Histórico:</span> {historico.length}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">Dados dos Institutos:</h3>
                    <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-40">
                      {JSON.stringify(institutos, null, 2)}
                    </pre>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">Dados do Histórico:</h3>
                    <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-40">
                      {JSON.stringify(historico.slice(0, 5), null, 2)}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

export default ProjecaoVendasDebug;