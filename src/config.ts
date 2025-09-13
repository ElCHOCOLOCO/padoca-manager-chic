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

// Supabase Marx Vendas (Primary)
export const SUPABASE_URL = String(viteEnv.VITE_SUPABASE_URL || "");
export const SUPABASE_ANON_KEY = String(viteEnv.VITE_SUPABASE_ANON_KEY || "");

// Supabase Marx Vendas (Specific)
export const SUPABASE_URL_MARX = String(viteEnv.VITE_SUPABASE_URL_MARX || "");
export const SUPABASE_ANON_KEY_MARX = String(viteEnv.VITE_SUPABASE_ANON_KEY_MARX || "");

// Supabase Padaria Chic
export const SUPABASE_URL_PADARIA = String(viteEnv.VITE_SUPABASE_URL_PADARIA || "");
export const SUPABASE_ANON_KEY_PADARIA = String(viteEnv.VITE_SUPABASE_ANON_KEY_PADARIA || "");

// GitHub Integration
export const GITHUB_TOKEN = String(viteEnv.GITHUB_TOKEN || "");

// Vercel Integration
export const VERCEL_TOKEN = String(viteEnv.VERCEL_TOKEN || "");
export const VERCEL_ORG_ID = String(viteEnv.VERCEL_ORG_ID || "");
export const VERCEL_PROJECT_NAME = String(viteEnv.VERCEL_PROJECT_NAME || "");