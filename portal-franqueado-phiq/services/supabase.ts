import { createBrowserClient } from '@supabase/ssr'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

export const supabaseConfigured = Boolean(url && key)

export function portalClient() {
  if (!url || !key) throw new Error('O projeto Supabase do Portal ainda não foi configurado.')
  return createBrowserClient(url, key)
}
