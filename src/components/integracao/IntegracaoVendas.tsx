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
  Zap,
  Circle,
  Square,
  Star,
  DollarSign
} from "lucide-react";

type VendaDetalhada = {
  id: string;
  data: string;
  paes: number;
  salgados: number;
  chocolates: number;
  refrigerantes: number;
  lucro_dia: number;
  total_vendas: number;
  observacoes: string;
  created_at: string;
  updated_at: string;
};

type ResumoVendas = {
  data: string;
  total_paes: number;
  total_salgados: number;
  total_chocolates: number;
  total_refrigerantes: number;
  total_lucro: number;
  total_vendas: number;
  media_por_item: number;
};

function IntegracaoVendas() {
  const [loading, setLoading] = useState(false);
  const [loadingSync, setLoadingSync] = useState(false);
  const [dataSelecionada, setDataSelecionada] = useState(new Date().toISOString().split('T')[0]);
  const [vendasDetalhadas, setVendasDetalhadas] = useState<VendaDetalhada[]>([]);
  const [resumoVendas, setResumoVendas] = useState<ResumoVendas | null>(null);

  // Estados para status de conexão
  const [statusConexao, setStatusConexao] = useState<'conectado' | 'desconectado' | 'conectando'>('desconectado');
  const [ultimaSincronizacao, setUltimaSincronizacao] = useState<string>('');

  // Carregar dados de vendas detalhadas
  const loadVendasData = useCallback(async () => {
    console.log("📊 IntegracaoVendas: Carregando dados de vendas detalhadas");
    setLoading(true);
    try {
      // Carregar vendas da data selecionada
      const { data: vendasData, error: vendasError } = await supabase
        .from('vendas_detalhadas')
        .select('*')
        .eq('data', dataSelecionada)
        .order('created_at', { ascending: false });

      if (vendasError) {
        console.error('❌ IntegracaoVendas: Erro ao carregar vendas:', vendasError);
        toast({ title: "Erro", description: "Erro ao carregar dados de vendas" });
        setVendasDetalhadas([]);
      } else {
        console.log('✅ IntegracaoVendas: Vendas carregadas:', vendasData?.length || 0);
        setVendasDetalhadas(vendasData || []);
      }

      // Calcular resumo das vendas
      if (vendasData && vendasData.length > 0) {
        const resumo: ResumoVendas = {
          data: dataSelecionada,
          total_paes: vendasData.reduce((sum, v) => sum + (v.paes || 0), 0),
          total_salgados: vendasData.reduce((sum, v) => sum + (v.salgados || 0), 0),
          total_chocolates: vendasData.reduce((sum, v) => sum + (v.chocolates || 0), 0),
          total_refrigerantes: vendasData.reduce((sum, v) => sum + (v.refrigerantes || 0), 0),
          total_lucro: vendasData.reduce((sum, v) => sum + (v.lucro_dia || 0), 0),
          total_vendas: vendasData.reduce((sum, v) => sum + (v.total_vendas || 0), 0),
          media_por_item: 0
        };

        const totalItens = resumo.total_paes + resumo.total_salgados + resumo.total_chocolates + resumo.total_refrigerantes;
        resumo.media_por_item = totalItens > 0 ? resumo.total_vendas / totalItens : 0;

        setResumoVendas(resumo);
      } else {
        setResumoVendas(null);
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
    loadVendasData();
  }, [loadVendasData]);

  // Testar conexão com Marx Vendas
  const testarConexaoMarxVendas = async () => {
    setStatusConexao('conectando');
    try {
      console.log("🔍 IntegracaoVendas: Testando conexão com Marx Vendas");
      
      // Testar se conseguimos acessar os dados do Marx Vendas
      const { data: vendasMarxData, error: vendasMarxError } = await supabase
        .from('projecoes_vendas')
        .select('count')
        .limit(1);

      if (vendasMarxError) {
        throw vendasMarxError;
      }

      setStatusConexao('conectado');
      toast({ 
        title: "Conexão OK!", 
        description: "Marx Vendas está conectado e acessível" 
      });

    } catch (error: any) {
      console.error('❌ IntegracaoVendas: Erro na conexão:', error);
      setStatusConexao('desconectado');
      toast({ 
        title: "Erro de Conexão", 
        description: "Não foi possível conectar com Marx Vendas",
        variant: "destructive"
      });
    }
  };

  // Receber dados do Marx Vendas
  const receberDadosMarxVendas = async () => {
    setLoadingSync(true);
    try {
      console.log("📥 IntegracaoVendas: Recebendo dados do Marx Vendas");
      
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

      // Calcular totais
      const totalVendas = (vendasMarxData || []).reduce((total, item) => total + (item.vendas_reais || 0), 0);
      
      // Distribuir vendas por tipo de produto (simulação)
      const paesVendidos = Math.floor(totalVendas * 0.4); // 40% pães
      const salgadosVendidos = Math.floor(totalVendas * 0.3); // 30% salgados
      const chocolatesVendidos = Math.floor(totalVendas * 0.2); // 20% chocolates
      const refrigerantesVendidos = Math.floor(totalVendas * 0.1); // 10% refrigerantes
      
      // Calcular lucro estimado (R$ 2 por item em média)
      const lucroEstimado = totalVendas * 2;

      console.log("📊 IntegracaoVendas: Dados recebidos do Marx Vendas:", {
        totalVendas, paesVendidos, salgadosVendidos, chocolatesVendidos, refrigerantesVendidos, lucroEstimado
      });

      // Salvar dados recebidos
      const { error: integracaoError } = await supabase
        .from('vendas_detalhadas')
        .insert([{
          data: dataSelecionada,
          paes: paesVendidos,
          salgados: salgadosVendidos,
          chocolates: chocolatesVendidos,
          refrigerantes: refrigerantesVendidos,
          lucro_dia: lucroEstimado,
          total_vendas: totalVendas,
          observacoes: `Dados recebidos do Marx Vendas - ${vendasMarxData?.length || 0} registros`
        }]);

      if (integracaoError) {
        throw integracaoError;
      }

      setUltimaSincronizacao(new Date().toLocaleString('pt-BR'));
      toast({ 
        title: "Dados Recebidos!", 
        description: `Marx Vendas: ${totalVendas} vendas totais, R$ ${lucroEstimado.toFixed(2)} lucro` 
      });

      // Recarregar dados
      loadVendasData();

    } catch (error: any) {
      console.error('❌ IntegracaoVendas: Erro ao receber dados:', error);
      toast({ 
        title: "Erro ao receber dados", 
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
        <h1 className="text-3xl font-bold">Integração Marx Vendas</h1>
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
            onClick={loadVendasData}
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
            <div className="text-lg">Carregando dados de vendas...</div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Painel de Conexão */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Status da Conexão
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Status da conexão com Marx Vendas
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      statusConexao === 'conectado' ? 'bg-green-500' : 
                      statusConexao === 'conectando' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></div>
                    <span className="font-medium">
                      {statusConexao === 'conectado' ? 'Conectado' : 
                       statusConexao === 'conectando' ? 'Conectando...' : 'Desconectado'}
                    </span>
                  </div>
                  <Button
                    onClick={testarConexaoMarxVendas}
                    disabled={statusConexao === 'conectando'}
                    size="sm"
                    variant="outline"
                  >
                    Testar Conexão
                  </Button>
                </div>

                {ultimaSincronizacao && (
                  <div className="text-sm text-muted-foreground">
                    Última sincronização: {ultimaSincronizacao}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Receber Dados do Marx Vendas
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Receba dados de vendas do Marx Vendas para esta data
                </p>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={receberDadosMarxVendas}
                  disabled={loadingSync || statusConexao !== 'conectado'}
                  className="w-full flex items-center gap-2"
                >
                  {loadingSync ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Receber Dados do Marx Vendas
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
                  Resumo de Vendas
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Resumo para {new Date(dataSelecionada).toLocaleDateString('pt-BR')}
                </p>
              </CardHeader>
              <CardContent>
                {resumoVendas ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 border rounded">
                        <div className="text-2xl font-bold text-blue-600">
                          {resumoVendas.total_paes}
                        </div>
                                                 <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                           <Circle className="h-3 w-3" />
                           Pães
                         </div>
                      </div>
                      <div className="text-center p-3 border rounded">
                        <div className="text-2xl font-bold text-green-600">
                          {resumoVendas.total_salgados}
                        </div>
                                                 <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                           <Square className="h-3 w-3" />
                           Salgados
                         </div>
                      </div>
                      <div className="text-center p-3 border rounded">
                        <div className="text-2xl font-bold text-purple-600">
                          {resumoVendas.total_chocolates}
                        </div>
                                                 <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                           <Star className="h-3 w-3" />
                           Chocolates
                         </div>
                      </div>
                      <div className="text-center p-3 border rounded">
                        <div className="text-2xl font-bold text-orange-600">
                          {resumoVendas.total_refrigerantes}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          Refrigerantes
                        </div>
                      </div>
                    </div>

                    <div className="text-center p-4 border rounded bg-gradient-to-r from-green-50 to-blue-50">
                      <div className="text-3xl font-bold text-green-600">
                        R$ {resumoVendas.total_lucro.toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">Lucro Total</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Média: R$ {resumoVendas.media_por_item.toFixed(2)} por item
                      </div>
                    </div>

                    <div className="text-center p-3 border rounded">
                      <div className="text-xl font-bold text-gray-600">
                        {resumoVendas.total_paes + resumoVendas.total_salgados + resumoVendas.total_chocolates + resumoVendas.total_refrigerantes}
                      </div>
                      <div className="text-sm text-muted-foreground">Total de Itens Vendidos</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma venda registrada para esta data.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Histórico de Vendas</CardTitle>
              </CardHeader>
              <CardContent>
                {vendasDetalhadas.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    <p>Nenhuma venda registrada.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {vendasDetalhadas.map((venda) => (
                      <div key={venda.id} className="border rounded p-3 hover:bg-muted/30">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium">
                            {new Date(venda.created_at).toLocaleString('pt-BR')}
                          </div>
                          <div className="font-bold text-lg text-green-600">
                            R$ {venda.lucro_dia.toFixed(2)}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-4 gap-2 text-sm">
                          <div className="text-center">
                            <div className="font-medium text-blue-600">{venda.paes}</div>
                            <div className="text-xs text-muted-foreground">Pães</div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium text-green-600">{venda.salgados}</div>
                            <div className="text-xs text-muted-foreground">Salgados</div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium text-purple-600">{venda.chocolates}</div>
                            <div className="text-xs text-muted-foreground">Chocolates</div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium text-orange-600">{venda.refrigerantes}</div>
                            <div className="text-xs text-muted-foreground">Refrigerantes</div>
                          </div>
                        </div>

                        {venda.observacoes && (
                          <div className="text-xs text-muted-foreground mt-2">
                            {venda.observacoes}
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