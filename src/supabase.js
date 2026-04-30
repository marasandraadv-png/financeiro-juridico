// ════════════════════════════════════════════════════════════
// CONEXÃO COM O SUPABASE (banco de dados na nuvem)
// ════════════════════════════════════════════════════════════
// Este arquivo configura a conexão com o Supabase usando as
// variáveis de ambiente cadastradas no Vercel (VITE_SUPABASE_URL
// e VITE_SUPABASE_KEY). Não precisa mexer aqui.
// ════════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY

// Função pra verificar se está configurado
export const supabaseConfigurado = () => {
  return !!(SUPABASE_URL && SUPABASE_KEY)
}

// Cria o cliente Supabase (só se as variáveis estiverem configuradas)
export const supabase = supabaseConfigurado()
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null

// Função utilitária para testar a conexão
export async function testarConexao() {
  if (!supabase) return { ok: false, erro: 'Supabase não configurado' }
  try {
    const { error } = await supabase.from('clientes').select('id').limit(1)
    if (error) return { ok: false, erro: error.message }
    return { ok: true }
  } catch (e) {
    return { ok: false, erro: e.message }
  }
}
