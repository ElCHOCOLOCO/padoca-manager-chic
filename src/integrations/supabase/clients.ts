import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { 
  SUPABASE_URL, 
  SUPABASE_ANON_KEY,
  SUPABASE_URL_MARX, 
  SUPABASE_ANON_KEY_MARX,
  SUPABASE_URL_PADARIA, 
  SUPABASE_ANON_KEY_PADARIA 
} from "@/config";

// Cliente principal (Marx Vendas)
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error("Supabase envs missing: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel (Project Settings > Environment Variables) and redeploy.");
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Cliente Marx Vendas (específico)
export const supabaseMarx = createClient<Database>(SUPABASE_URL_MARX, SUPABASE_ANON_KEY_MARX, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Cliente Padaria Chic
export const supabasePadaria = createClient<Database>(SUPABASE_URL_PADARIA, SUPABASE_ANON_KEY_PADARIA, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Função helper para obter o cliente correto baseado no contexto
export const getSupabaseClient = (context: 'marx' | 'padaria' | 'default' = 'default') => {
  switch (context) {
    case 'marx':
      return supabaseMarx;
    case 'padaria':
      return supabasePadaria;
    default:
      return supabase;
  }
};