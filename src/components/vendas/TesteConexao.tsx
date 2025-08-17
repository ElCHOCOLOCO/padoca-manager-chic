import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle, Database } from "lucide-react";

export default function TesteConexao() {
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<any>({});

  const runTests = async () => {
    setLoading(true);
    setTestResults({});
    
    const results: any = {};

    try {
      // Teste 1: Verificar autenticação
      console.log("🔐 Teste 1: Verificando autenticação...");
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      results.auth = {
        success: !authError,
        user: user ? "Autenticado" : "Não autenticado",
        userId: user?.id,
        error: authError?.message
      };
      console.log("✅ Teste 1 resultado:", results.auth);

      // Teste 2: Verificar se a tabela existe
      console.log("🔍 Teste 2: Verificando se a tabela institutos_vendas existe...");
      const { data: testData, error: testError, count } = await supabase
        .from('institutos_vendas')
        .select('*', { count: 'exact', head: true });
      
      results.tableAccess = {
        success: !testError,
        count: count,
        error: testError?.message,
        errorCode: testError?.code
      };
      console.log("✅ Teste 2 resultado:", results.tableAccess);

      // Teste 3: Tentar carregar dados
      console.log("📊 Teste 3: Tentando carregar dados...");
      const { data: institutosData, error: institutosError } = await supabase
        .from('institutos_vendas')
        .select('*')
        .limit(5);
      
      results.dataLoad = {
        success: !institutosError,
        count: institutosData?.length || 0,
        data: institutosData,
        error: institutosError?.message,
        errorCode: institutosError?.code
      };
      console.log("✅ Teste 3 resultado:", results.dataLoad);

      // Teste 4: Verificar políticas RLS
      console.log("🔒 Teste 4: Verificando políticas RLS...");
      const { data: rlsData, error: rlsError } = await supabase
        .from('institutos_vendas')
        .select('id')
        .limit(1);
      
      results.rls = {
        success: !rlsError,
        error: rlsError?.message,
        errorCode: rlsError?.code
      };
      console.log("✅ Teste 4 resultado:", results.rls);

    } catch (error: any) {
      console.error("❌ Erro geral nos testes:", error);
      results.generalError = error.message;
    }

    setTestResults(results);
    setLoading(false);
    
    if (results.auth?.success && results.tableAccess?.success && results.dataLoad?.success) {
      toast({ title: "✅ Testes passaram!", description: "Conexão funcionando corretamente" });
    } else {
      toast({ title: "❌ Testes falharam", description: "Verifique os resultados abaixo" });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Teste de Conexão com Supabase
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runTests} 
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Executando Testes...
            </>
          ) : (
            "Executar Testes de Conexão"
          )}
        </Button>

        {Object.keys(testResults).length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold">Resultados dos Testes:</h3>
            
            {/* Teste de Autenticação */}
            {testResults.auth && (
              <div className="p-3 border rounded">
                <div className="flex items-center gap-2 mb-2">
                  {testResults.auth.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className="font-medium">1. Autenticação</span>
                </div>
                <div className="text-sm space-y-1">
                  <div>Status: {testResults.auth.user}</div>
                  {testResults.auth.userId && <div>ID: {testResults.auth.userId}</div>}
                  {testResults.auth.error && (
                    <div className="text-red-600">Erro: {testResults.auth.error}</div>
                  )}
                </div>
              </div>
            )}

            {/* Teste de Acesso à Tabela */}
            {testResults.tableAccess && (
              <div className="p-3 border rounded">
                <div className="flex items-center gap-2 mb-2">
                  {testResults.tableAccess.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className="font-medium">2. Acesso à Tabela</span>
                </div>
                <div className="text-sm space-y-1">
                  <div>Registros: {testResults.tableAccess.count || 0}</div>
                  {testResults.tableAccess.error && (
                    <div className="text-red-600">
                      Erro: {testResults.tableAccess.error}
                      {testResults.tableAccess.errorCode && (
                        <span className="ml-2">(Código: {testResults.tableAccess.errorCode})</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Teste de Carregamento de Dados */}
            {testResults.dataLoad && (
              <div className="p-3 border rounded">
                <div className="flex items-center gap-2 mb-2">
                  {testResults.dataLoad.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className="font-medium">3. Carregamento de Dados</span>
                </div>
                <div className="text-sm space-y-1">
                  <div>Registros carregados: {testResults.dataLoad.count}</div>
                  {testResults.dataLoad.data && testResults.dataLoad.data.length > 0 && (
                    <div className="mt-2">
                      <div className="font-medium">Primeiros registros:</div>
                      <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto">
                        {JSON.stringify(testResults.dataLoad.data.slice(0, 3), null, 2)}
                      </pre>
                    </div>
                  )}
                  {testResults.dataLoad.error && (
                    <div className="text-red-600">
                      Erro: {testResults.dataLoad.error}
                      {testResults.dataLoad.errorCode && (
                        <span className="ml-2">(Código: {testResults.dataLoad.errorCode})</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Teste de RLS */}
            {testResults.rls && (
              <div className="p-3 border rounded">
                <div className="flex items-center gap-2 mb-2">
                  {testResults.rls.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className="font-medium">4. Políticas RLS</span>
                </div>
                <div className="text-sm space-y-1">
                  {testResults.rls.error && (
                    <div className="text-red-600">
                      Erro: {testResults.rls.error}
                      {testResults.rls.errorCode && (
                        <span className="ml-2">(Código: {testResults.rls.errorCode})</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Erro Geral */}
            {testResults.generalError && (
              <div className="p-3 border rounded bg-red-50">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span className="font-medium text-red-600">Erro Geral</span>
                </div>
                <div className="text-sm text-red-600">
                  {testResults.generalError}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}