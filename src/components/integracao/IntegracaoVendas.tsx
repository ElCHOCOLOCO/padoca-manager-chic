import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Loader2, 
  RefreshCw, 
  Upload, 
  Download, 
  Database, 
  Calendar,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Clock,
  Zap
} from "lucide-react";

type IntegracaoVenda = {
  id: string;
  data: string;
  vendas_total: number;
  fonte: 'pdv_central' | 'marx_vendas';
  status: 'pendente' | 'processado' | 'erro';
  detalhes: string;
  created_at: string;
  updated_at: string;
};

type ResumoIntegracao = {
  data: string;
  vendas_pdv: number;
  vendas_marx: number;
  diferenca: number;
  status: 'sincronizado' | 'diferenca' | 'pendente';
};

function IntegracaoVendas() {
  const [loading, setLoading] = useState(false);
  const [loadingSync, setLoadingSync] = useState(false);
  const [dataSelecionada, setDataSelecionada] = useState(new Date().toISOString().split('T')[0]);
  const [vendasTotal, setVendasTotal] = useState<number>(0);
  const [observacoes, setObservacoes] = useState<string>('');
  const [integracaoVendas, setIntegracaoVendas] = useState<IntegracaoVenda[]>([]);
  const [resumoIntegracao, setResumoIntegracao] = useState<ResumoIntegracao | null>(null);

  // Carregar dados de integração
  const loadIntegracaoData = useCallback(async () => {
    console.log("📊 IntegracaoVendas: Carregando dados de integração");
    setLoading(true);
    try {
      // Carregar integrações da data selecionada
      const { data: integracaoData, error: integracaoError } = await supabase
        .from('integracao_vendas')
        .select('*')
        .eq('data', dataSelecionada)
        .order('created_at', { ascending: false });

      if (integracaoError) {
        console.error('❌ IntegracaoVendas: Erro ao carregar integrações:', integracaoError);
        toast({ title: "Erro", description: "Erro ao carregar dados de integração" });
        setIntegracaoVendas([]);
      } else {
        console.log('✅ IntegracaoVendas: Integrações carregadas:', integracaoData?.length || 0);
        setIntegracaoVendas(integracaoData || []);
      }

      // Calcular resumo da integração
      if (integracaoData && integracaoData.length > 0) {
        const vendasPDV = integracaoData.find(i => i.fonte === 'pdv_central')?.vendas_total || 0;
        const vendasMarx = integracaoData.find(i => i.fonte === 'marx_vendas')?.vendas_total || 0;
        const diferenca = Math.abs(vendasPDV - vendasMarx);
        
        let status: 'sincronizado' | 'diferenca' | 'pendente' = 'pendente';
        if (vendasPDV > 0 && vendasMarx > 0) {
          status = diferenca === 0 ? 'sincronizado' : 'diferenca';
        }

        setResumoIntegracao({
          data: dataSelecionada,
          vendas_pdv: vendasPDV,
          vendas_marx: vendasMarx,
          diferenca: diferenca,
          status: status
        });
      } else {
        setResumoIntegracao(null);
      }

    } catch (error: any) {
      console.error('❌ IntegracaoVendas: Erro geral ao carregar dados:', error);
      toast({ title: "Erro ao carregar dados", description: error.message });
    } finally {
      setLoading(false);
    }
  }, [dataSelecionada]);

  // Carregar dados ao montar componente
  useEffect(() => {
    loadIntegracaoData();
  }, [loadIntegracaoData]);

  // Enviar vendas do PDV+Central
  const enviarVendasPDV = async () => {
    if (!vendasTotal || vendasTotal <= 0) {
      toast({ 
        title: "Erro", 
        description: "Digite um valor válido para as vendas totais",
        variant: "destructive"
      });
      return;
    }

    setLoadingSync(true);
    try {
      console.log("📤 IntegracaoVendas: Enviando vendas do PDV+Central:", vendasTotal);
      
      const { data, error } = await supabase
        .from('integracao_vendas')
        .insert([{
          data: dataSelecionada,
          vendas_total: vendasTotal,
          fonte: 'pdv_central',
          status: 'processado',
          detalhes: observacoes || 'Vendas enviadas do PDV+Central'
        }]);

      if (error) {
        throw error;
      }

      toast({ 
        title: "Sucesso!", 
        description: `Vendas do PDV+Central (${vendasTotal}) enviadas com sucesso!` 
      });

      // Limpar formulário
      setVendasTotal(0);
      setObservacoes('');
      
      // Recarregar dados
      loadIntegracaoData();

    } catch (error: any) {
      console.error('❌ IntegracaoVendas: Erro ao enviar vendas PDV:', error);
      toast({ 
        title: "Erro ao enviar vendas", 
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoadingSync(false);
    }
  };

  // Enviar vendas do Marx Vendas
  const enviarVendasMarx = async () => {
    if (!vendasTotal || vendasTotal <= 0) {
      toast({ 
        title: "Erro", 
        description: "Digite um valor válido para as vendas totais",
        variant: "destructive"
      });
      return;
    }

    setLoadingSync(true);
    try {
      console.log("📤 IntegracaoVendas: Enviando vendas do Marx Vendas:", vendasTotal);
      
      const { data, error } = await supabase
        .from('integracao_vendas')
        .insert([{
          data: dataSelecionada,
          vendas_total: vendasTotal,
          fonte: 'marx_vendas',
          status: 'processado',
          detalhes: observacoes || 'Vendas enviadas do Marx Vendas'
        }]);

      if (error) {
        throw error;
      }

      toast({ 
        title: "Sucesso!", 
        description: `Vendas do Marx Vendas (${vendasTotal}) enviadas com sucesso!` 
      });

      // Limpar formulário
      setVendasTotal(0);
      setObservacoes('');
      
      // Recarregar dados
      loadIntegracaoData();

    } catch (error: any) {
      console.error('❌ IntegracaoVendas: Erro ao enviar vendas Marx:', error);
      toast({ 
        title: "Erro ao enviar vendas", 
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoadingSync(false);
    }
  };

  // Sincronizar automaticamente
  const sincronizarAutomaticamente = async () => {
    setLoadingSync(true);
    try {
      console.log("🔄 IntegracaoVendas: Iniciando sincronização automática");
      
      // Buscar vendas do Marx Vendas da data selecionada
      const { data: vendasMarxData, error: vendasMarxError } = await supabase
        .from('projecoes_vendas')
        .select(`
          vendas_reais,
          institutos_vendas!inner(codigo)
        `)
        .eq('data_referencia', dataSelecionada);

      if (vendasMarxError) {
        throw vendasMarxError;
      }

      // Calcular total de vendas do Marx Vendas
      const totalVendasMarx = (vendasMarxData || []).reduce((total, item) => total + (item.vendas_reais || 0), 0);

      console.log("📊 IntegracaoVendas: Total vendas Marx Vendas:", totalVendasMarx);

      // Enviar para integração
      const { error: integracaoError } = await supabase
        .from('integracao_vendas')
        .insert([{
          data: dataSelecionada,
          vendas_total: totalVendasMarx,
          fonte: 'marx_vendas',
          status: 'processado',
          detalhes: `Sincronização automática - ${vendasMarxData?.length || 0} registros processados`
        }]);

      if (integracaoError) {
        throw integracaoError;
      }

      toast({ 
        title: "Sincronização Concluída!", 
        description: `Marx Vendas sincronizado: ${totalVendasMarx} vendas totais` 
      });

      // Recarregar dados
      loadIntegracaoData();

    } catch (error: any) {
      console.error('❌ IntegracaoVendas: Erro na sincronização:', error);
      toast({ 
        title: "Erro na sincronização", 
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoadingSync(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Integração de Vendas</h1>
        <div className="flex items-center gap-4">
          <Label htmlFor="data-integracao">Data:</Label>
          <Input
            id="data-integracao"
            type="date"
            value={dataSelecionada}
            onChange={(e) => setDataSelecionada(e.target.value)}
            className="w-auto"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={loadIntegracaoData}
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
            <div className="text-lg">Carregando dados de integração...</div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Painel de Envio */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Enviar Vendas
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Envie as vendas totais do dia de cada sistema
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="vendas-total">Vendas Totais do Dia</Label>
                  <Input
                    id="vendas-total"
                    type="number"
                    value={vendasTotal}
                    onChange={(e) => setVendasTotal(Number(e.target.value))}
                    placeholder="0"
                    className="text-lg font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observacoes">Observações (opcional)</Label>
                  <Textarea
                    id="observacoes"
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    placeholder="Detalhes sobre as vendas..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={enviarVendasPDV}
                    disabled={loadingSync || !vendasTotal}
                    className="flex items-center gap-2"
                  >
                    {loadingSync ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Database className="h-4 w-4" />
                    )}
                    PDV+Central
                  </Button>

                  <Button
                    onClick={enviarVendasMarx}
                    disabled={loadingSync || !vendasTotal}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    {loadingSync ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <TrendingUp className="h-4 w-4" />
                    )}
                    Marx Vendas
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Sincronização Automática
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Sincronize automaticamente as vendas do Marx Vendas
                </p>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={sincronizarAutomaticamente}
                  disabled={loadingSync}
                  className="w-full flex items-center gap-2"
                >
                  {loadingSync ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Sincronizar Marx Vendas
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Painel de Resumo */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Resumo da Integração
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Status da integração para {new Date(dataSelecionada).toLocaleDateString('pt-BR')}
                </p>
              </CardHeader>
              <CardContent>
                {resumoIntegracao ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 border rounded">
                        <div className="text-2xl font-bold text-blue-600">
                          {resumoIntegracao.vendas_pdv}
                        </div>
                        <div className="text-sm text-muted-foreground">PDV+Central</div>
                      </div>
                      <div className="text-center p-3 border rounded">
                        <div className="text-2xl font-bold text-green-600">
                          {resumoIntegracao.vendas_marx}
                        </div>
                        <div className="text-sm text-muted-foreground">Marx Vendas</div>
                      </div>
                    </div>

                    <div className="text-center p-3 border rounded">
                      <div className="text-lg font-bold text-purple-600">
                        {resumoIntegracao.diferenca}
                      </div>
                      <div className="text-sm text-muted-foreground">Diferença</div>
                    </div>

                    <div className="flex justify-center">
                      <Badge 
                        variant={resumoIntegracao.status === 'sincronizado' ? 'default' : 
                                resumoIntegracao.status === 'diferenca' ? 'destructive' : 'secondary'}
                        className="text-sm"
                      >
                        {resumoIntegracao.status === 'sincronizado' ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Sincronizado
                          </>
                        ) : resumoIntegracao.status === 'diferenca' ? (
                          <>
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Diferença Detectada
                          </>
                        ) : (
                          <>
                            <Clock className="h-3 w-3 mr-1" />
                            Pendente
                          </>
                        )}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma integração encontrada para esta data.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Histórico de Integrações</CardTitle>
              </CardHeader>
              <CardContent>
                {integracaoVendas.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    <p>Nenhuma integração registrada.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {integracaoVendas.map((integracao) => (
                      <div key={integracao.id} className="border rounded p-3 hover:bg-muted/30">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">
                              {integracao.fonte === 'pdv_central' ? 'PDV+Central' : 'Marx Vendas'}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(integracao.created_at).toLocaleString('pt-BR')}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-lg">
                              {integracao.vendas_total}
                            </div>
                            <Badge 
                              variant={integracao.status === 'processado' ? 'default' : 
                                      integracao.status === 'erro' ? 'destructive' : 'secondary'}
                              className="text-xs"
                            >
                              {integracao.status}
                            </Badge>
                          </div>
                        </div>
                        {integracao.detalhes && (
                          <div className="text-xs text-muted-foreground mt-2">
                            {integracao.detalhes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

export default IntegracaoVendas;