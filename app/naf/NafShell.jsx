'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  ArrowLeft, ChevronRight, ClipboardList, FileText, LayoutDashboard,
  LogOut, Menu, ShieldCheck, X
} from 'lucide-react'

const NafSessionContext = createContext(null)

export function useNafSession() {
  return useContext(NafSessionContext)
}

const navigation = [
  { href: '/naf/chamados', label: 'Chamados', icon: ClipboardList },
  { href: '/naf/conteudos', label: 'Comunicados e conteúdos', icon: FileText },
]

export default function NafShell({ children }) {
  const [session, setSession] = useState(null)
  const [state, setState] = useState('loading')
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  const loadSession = async () => {
    try {
      const response = await fetch('/api/auth/session', { cache: 'no-store', credentials: 'same-origin' })
      if (response.status === 401) {
        setState('unauthenticated')
        return
      }
      if (!response.ok) {
        setState(response.status === 403 ? 'forbidden' : 'error')
        return
      }
      setSession(await response.json())
      setState('ready')
    } catch {
      setState('error')
    }
  }

  useEffect(() => { loadSession() }, [])

  const initials = useMemo(() => {
    const name = session?.profile?.full_name || 'PHIQ'
    return name.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase()
  }, [session])

  const logout = async () => {
    await fetch('/api/auth/session', { method: 'DELETE', credentials: 'same-origin' })
    window.location.href = '/'
  }

  if (state === 'loading') return <div className="naf-auth-state"><div className="naf-loading-mark"><ShieldCheck size={22}/></div><strong>Validando seu acesso...</strong></div>
  if (state === 'unauthenticated') return <div className="naf-auth-state"><ShieldCheck size={28}/><h1>Sessão necessária</h1><p>Entre no Portal PHIQ para acessar a central administrativa.</p><Link className="primary-btn" href="/">Voltar ao login</Link></div>
  if (state === 'forbidden') return <div className="naf-auth-state"><ShieldCheck size={28}/><h1>Acesso restrito</h1><p>Seu perfil não possui permissão para esta área.</p><Link className="primary-btn" href="/">Voltar ao Portal</Link></div>
  if (state === 'error') return <div className="naf-auth-state"><ShieldCheck size={28}/><h1>Não foi possível carregar a área</h1><p>Verifique sua conexão e tente novamente.</p><button className="primary-btn" onClick={loadSession}>Tentar novamente</button></div>

  return (
    <NafSessionContext.Provider value={session}>
      <div className="naf-shell">
        {mobileOpen && <button className="naf-backdrop" aria-label="Fechar menu" onClick={() => setMobileOpen(false)}/>}
        <aside className={`naf-sidebar ${mobileOpen ? 'is-open' : ''}`}>
          <div className="naf-brand">
            <Image src="/logo-phiq.png" alt="PHIQ" width={148} height={56}/>
            <span>Operações da rede</span>
            <button className="naf-close-menu" onClick={() => setMobileOpen(false)} aria-label="Fechar menu"><X size={18}/></button>
          </div>
          <div className="naf-workspace"><div className="naf-workspace-icon"><LayoutDashboard size={16}/></div><div><small>Workspace</small><strong>Gestão NAF</strong></div><ChevronRight size={14}/></div>
          <nav className="naf-nav">
            <span className="naf-nav-label">Operação</span>
            {navigation.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={() => setMobileOpen(false)} className={`naf-nav-item ${pathname === href ? 'active' : ''}`}><Icon size={17}/><span>{label}</span></Link>)}
            <span className="naf-nav-label">Portal</span>
            <Link href="/" className="naf-nav-item" onClick={() => setMobileOpen(false)}><ArrowLeft size={17}/><span>Voltar ao Portal</span></Link>
          </nav>
          <div className="naf-sidebar-foot"><div className="naf-user"><div className="naf-avatar">{initials}</div><div><strong>{session.profile.full_name}</strong><span>{session.profile.role === 'admin' ? 'Administrador' : 'NAF'}</span></div></div><button className="naf-logout" onClick={logout}><LogOut size={15}/> Sair</button></div>
        </aside>
        <main className="naf-main">
          <header className="naf-topbar"><button className="naf-menu-toggle" onClick={() => setMobileOpen(true)} aria-label="Abrir menu"><Menu size={21}/></button><div className="naf-topbar-title"><small>Portal PHIQ / Gestão NAF</small><strong>Operações e atendimento</strong></div><div className="naf-topbar-actions"><span className="naf-secure"><ShieldCheck size={15}/> Ambiente protegido</span><div className="naf-top-avatar">{initials}</div></div></header>
          <div className="naf-page">{children}</div>
        </main>
      </div>
    </NafSessionContext.Provider>
  )
}
