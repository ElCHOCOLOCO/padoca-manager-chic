export const APP_SINGLE_USER = true;

// Em single-user, usamos IDs fixos e seguros no front
export const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000001";
// Para tabelas que usam texto para instituto, um id simples é suficiente
export const DEFAULT_INSTITUTE_ID = "default";

// Opcional: URL/key do Supabase podem ser substituídas por envs Vite
export const SUPABASE_URL = import.meta?.env?.VITE_SUPABASE_URL as string | undefined;
export const SUPABASE_ANON_KEY = import.meta?.env?.VITE_SUPABASE_ANON_KEY as string | undefined;