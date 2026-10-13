import { createClient } from 'npm:@supabase/supabase-js@2.117.2'

type InvitePayload = {
  email: string
  fullName: string
  role: 'admin' | 'naf' | 'franchisee'
  unitIds?: string[]
}

const json = (body: unknown, status: number, origin: string) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin, Vary: 'Origin' },
})

Deno.serve(async request => {
  const allowedOrigin = Deno.env.get('PORTAL_ORIGIN') || ''
  const origin = request.headers.get('Origin') || ''
  if (!allowedOrigin || origin !== allowedOrigin) return new Response('Forbidden origin', { status: 403 })
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
    Vary: 'Origin',
  } })
  if (request.method !== 'POST') return json({ error: 'Method not allowed' },405,origin)
  const url = Deno.env.get('SUPABASE_URL')
  const secret = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !secret) return json({ error: 'Function is not configured' },500,origin)
  const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i,'')
  if (!token) return json({ error: 'Unauthorized' },401,origin)
  const admin = createClient(url,secret,{auth:{autoRefreshToken:false,persistSession:false}})
  const { data: caller, error: authError } = await admin.auth.getUser(token)
  if (authError || !caller.user) return json({ error: 'Unauthorized' },401,origin)
  const { data: profile, error: profileError } = await admin.from('profiles').select('role,active').eq('id',caller.user.id).single()
  if (profileError || profile?.role !== 'admin' || !profile.active) return json({ error: 'Forbidden' },403,origin)
  let payload: InvitePayload
  try { payload = await request.json() } catch { return json({ error: 'Invalid JSON' },400,origin) }
  if (!payload.email?.includes('@') || !payload.fullName?.trim() || !['admin','naf','franchisee'].includes(payload.role))
    return json({ error: 'Invalid invite data' },400,origin)
  if (payload.unitIds && (!Array.isArray(payload.unitIds) || payload.unitIds.some(id => !/^[0-9a-fA-F-]{36}$/.test(id))))
    return json({ error: 'Invalid unit IDs' },400,origin)
  const invited = await admin.auth.admin.inviteUserByEmail(payload.email.trim().toLowerCase())
  if (invited.error || !invited.data.user) return json({ error: invited.error?.message || 'Invite failed' },400,origin)
  const userId = invited.data.user.id
  try {
    const created = await admin.from('profiles').insert({ id:userId, email:payload.email.trim().toLowerCase(), full_name:payload.fullName.trim(), role:payload.role })
    if (created.error) throw created.error
    if (payload.unitIds?.length && payload.role !== 'admin') {
      const table = payload.role === 'naf' ? 'naf_assignments' : 'franchise_members'
      const rows = payload.unitIds.map(unitId => payload.role === 'naf'
        ? { unit_id:unitId, naf_user_id:userId }
        : { unit_id:unitId, user_id:userId })
      const linked = await admin.from(table).insert(rows)
      if (linked.error) throw linked.error
    }
  } catch (error) {
    await admin.auth.admin.deleteUser(userId)
    return json({ error: error instanceof Error ? error.message : 'Provisioning failed' },500,origin)
  }
  return json({ id:userId, email:payload.email.trim().toLowerCase() },201,origin)
})
