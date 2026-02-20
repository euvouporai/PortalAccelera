
import { createClient } from '@supabase/supabase-js';

// URL e Key do seu projeto Supabase
const supabaseUrl = 'https://reigzsdemyzpcnqlceya.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlaWd6c2RlbXl6cGNucWxjZXlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5MDY3MTQsImV4cCI6MjA4MTQ4MjcxNH0.v_ZkWJNYtH6fpmsU_U_qyuse_TxHwdnXStlZaWdfQ7s';

console.log("[SUPABASE] Inicializando cliente em:", supabaseUrl);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Verifica se as credenciais do Supabase foram preenchidas corretamente.
 */
export const isSupabaseConfigured = () => {
  const isConfigured = (
    supabaseUrl && 
    (supabaseUrl as string).startsWith('https://') && 
    supabaseAnonKey && 
    supabaseAnonKey.length > 50
  );
  
  if (!isConfigured) {
    console.error("[SUPABASE] Erro: Credenciais inválidas ou incompletas.");
  }
  
  return isConfigured;
};
