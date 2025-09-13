// Teste das integrações
import { createClient } from '@supabase/supabase-js';

// Configurações
const SUPABASE_URL_MARX = 'https://xkmxhhorpcnmdkmaedap.supabase.co';
const SUPABASE_ANON_KEY_MARX = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbXhoaG9ycGNubWRrbWFlZGFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0MzMzNzcsImV4cCI6MjA2ODAwOTM3N30.A1VtJGcgEn5aLEsrhwEyVSddQ2QY6Tt_lwp6YS_IvmE';

const SUPABASE_URL_PADARIA = 'https://pvexerjrbqzrkbzqswxf.supabase.co';
const SUPABASE_ANON_KEY_PADARIA = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2ZXhlcmpyYnF6cmtienFzd3hmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0MzQ5OTcsImV4cCI6MjA2ODAxMDk5N30.JU2Fs8eluZddU1iSdCz5v3uhZglGkfuDawTu23iFsYc';

async function testSupabaseConnections() {
  console.log('🔍 Testando conexões Supabase...\n');

  // Teste Marx Vendas
  try {
    const supabaseMarx = createClient(SUPABASE_URL_MARX, SUPABASE_ANON_KEY_MARX);
    const { data, error } = await supabaseMarx.from('institutes').select('*').limit(1);
    
    if (error) {
      console.log('❌ Marx Vendas - Erro:', error.message);
    } else {
      console.log('✅ Marx Vendas - Conexão OK');
      console.log('   Dados encontrados:', data?.length || 0, 'registros');
    }
  } catch (err) {
    console.log('❌ Marx Vendas - Erro de conexão:', err.message);
  }

  // Teste Padaria Chic
  try {
    const supabasePadaria = createClient(SUPABASE_URL_PADARIA, SUPABASE_ANON_KEY_PADARIA);
    const { data, error } = await supabasePadaria.from('institutes').select('*').limit(1);
    
    if (error) {
      console.log('❌ Padaria Chic - Erro:', error.message);
    } else {
      console.log('✅ Padaria Chic - Conexão OK');
      console.log('   Dados encontrados:', data?.length || 0, 'registros');
    }
  } catch (err) {
    console.log('❌ Padaria Chic - Erro de conexão:', err.message);
  }
}

// Executar testes
testSupabaseConnections().then(() => {
  console.log('\n🎉 Testes de integração concluídos!');
}).catch(console.error);