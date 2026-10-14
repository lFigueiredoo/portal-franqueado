'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { authRepository } from '../services/auth'

export default function PortalAuth({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const current = await authRepository.currentUser()
        if (!active) return
        setUser(current)
        setProfile(current ? await authRepository.currentProfile(current.$id) : null)
        setError('')
      } catch {
        if (active) { setUser(null); setProfile(null) }
      } finally { if (active) setLoading(false) }
    }
    load()
    return () => { active = false }
  }, [])

  const signIn = async event => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try { await authRepository.signIn(email.trim(), password) }
    catch (cause) { setError(cause.message || 'Não foi possível entrar.'); setLoading(false) }
  }

  if (loading) return <div className="auth-shell"><div className="auth-card">Carregando sua sessão…</div></div>
  if (!user) return <div className="auth-shell"><form className="auth-card" onSubmit={signIn}><Image src="/logo-phiq.png" alt="PHIQ" width={165} height={62}/><h1>Portal do Franqueado</h1><p>Acesse com a conta cadastrada pela PHIQ.</p><label>E-mail<input type="email" required value={email} onChange={event => setEmail(event.target.value)} autoComplete="email"/></label><label>Senha<input type="password" required value={password} onChange={event => setPassword(event.target.value)} autoComplete="current-password"/></label>{error && <p className="auth-error" role="alert">{error}</p>}<button className="primary-btn" type="submit">Entrar</button></form></div>
  if (!profile?.active) return <div className="auth-shell"><div className="auth-card"><h1>Acesso pendente</h1><p>Sua conta existe, mas ainda não possui um perfil ativo no Portal. Solicite ao administrador o vínculo correto.</p><button className="primary-btn" onClick={() => authRepository.signOut()}>Sair</button></div></div>
  return children({ user, profile, preview: false })
}
