'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
export default function PortalAuth({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [status, setStatus] = useState('loading')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const mounted = useRef(true)
  const requestGeneration = useRef(0)

  const loadSession = async () => {
    const generation = ++requestGeneration.current
    setStatus('loading')
    setError('')
    try {
      const response = await fetch('/api/auth/session', {
        cache: 'no-store',
        credentials: 'same-origin',
      })
      if (!mounted.current || generation !== requestGeneration.current) return
      if (response.status === 401) {
        setUser(null)
        setProfile(null)
        setStatus('unauthenticated')
        return
      }
      if (!response.ok) {
        setError(response.status === 403
          ? 'Sua conta não possui um perfil ativo autorizado.'
          : 'Não foi possível carregar sua sessão. Tente novamente.')
        setStatus(response.status === 403 ? 'forbidden' : 'error')
        return
      }
      const current = await response.json()
      if (!mounted.current || generation !== requestGeneration.current) return
      setUser({ $id: current.userId })
      setProfile(current.profile)
      setStatus('authenticated')
    } catch (cause) {
      if (!mounted.current || generation !== requestGeneration.current) return
      setUser(null)
      setProfile(null)
      setError(cause instanceof Error ? cause.message : 'Não foi possível carregar sua sessão.')
      setStatus('error')
    }
  }

  useEffect(() => {
    mounted.current = true
    loadSession().catch(() => undefined)
    return () => { mounted.current = false }
  }, [])

  const signIn = async event => {
    event.preventDefault()
    requestGeneration.current += 1
    setStatus('loading')
    setError('')
    try {
      const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
        credentials: 'same-origin',
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(typeof payload?.error === 'string'
          ? payload.error
          : response.status >= 500
            ? 'O serviço de autenticação está indisponível. Tente novamente.'
            : 'Não foi possível entrar com essas credenciais.')
      }
      await loadSession()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível entrar.')
      setStatus('unauthenticated')
    }
  }

  if (status === 'loading') return <div className="auth-shell"><div className="auth-card">Carregando sua sessão…</div></div>
  if (status === 'error' || status === 'forbidden') return <div className="auth-shell"><div className="auth-card"><h1>Não foi possível carregar o Portal</h1><p className="auth-error" role="alert">{error}</p><button className="primary-btn" onClick={loadSession}>Tentar novamente</button></div></div>
  if (status === 'profile_missing' || status === 'inactive') return <div className="auth-shell"><div className="auth-card"><h1>Acesso pendente</h1><p>Sua conta existe, mas ainda não possui um perfil ativo no Portal. Solicite ao administrador o vínculo correto.</p><button className="primary-btn" onClick={() => fetch('/api/auth/session', { method: 'DELETE' }).then(loadSession)}>Sair</button></div></div>
  if (status === 'unauthenticated') return <div className="auth-shell"><form className="auth-card" onSubmit={signIn}><Image src="/logo-phiq.png" alt="PHIQ" width={165} height={62}/><h1>Portal do Franqueado</h1><p>Acesse com a conta cadastrada pela PHIQ.</p><label>E-mail<input type="email" required value={email} onChange={event => setEmail(event.target.value)} autoComplete="email"/></label><label>Senha<input type="password" required value={password} onChange={event => setPassword(event.target.value)} autoComplete="current-password"/></label>{error && <p className="auth-error" role="alert">{error}</p>}<button className="primary-btn" type="submit">Entrar</button></form></div>
  return children({ user, profile, preview: false })
}
