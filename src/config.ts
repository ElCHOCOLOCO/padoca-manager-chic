export const APP_SINGLE_USER = true;

// Em single-user, usamos IDs fixos e seguros no front
export const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000001";
// Para tabelas que usam texto para instituto, um id simples é suficiente
export const DEFAULT_INSTITUTE_ID = "default";

// Vite client-side envs
// Ensure values are read at build-time and present at runtime
// Vercel injects VITE_* at build; locally use .env.*
// Avoid optional chaining to prevent undefined in some bundling contexts
const viteEnv: any = (import.meta as any).env || {};
export const SUPABASE_URL = String(viteEnv.VITE_SUPABASE_URL || "");
export const SUPABASE_ANON_KEY = String(viteEnv.VITE_SUPABASE_ANON_KEY || "");