'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { Award, BookOpen, CalendarDays, CheckCircle2, ChevronRight, Coins, Headphones, Home, LogOut, Megaphone, PackageOpen, Rocket, Search, Users } from 'lucide-react'
import { authRepository } from '../services/auth'
import { contentRepository } from '../services/content'
import { gamificationRepository } from '../services/gamification'
import { journeyRepository } from '../services/journey'
import { networkRepository } from '../services/network'
import { notificationRepository } from '../services/notifications'
import SupportWorkspace from './SupportWorkspace'

const nav = [['inicio','Início',Home],['base','Base de Conhecimento',BookOpen],['jornada','Onboarding & Jornada',Rocket],['franqueados','Nossos Franqueados',Users],['comunicados','Comunicados Oficiais',Megaphone],['suporte','Suporte & CS',Headphones]]

export default function ConnectedPortal({ session }) {
  const [page,setPage] = useState('inicio')
  const [supportTab,setSupportTab] = useState('novo')
  const [units,setUnits] = useState([])
  const [unitId,setUnitId] = useState('')
  const [categories,setCategories] = useState([])
  const [articles,setArticles] = useState([])
  const [products,setProducts] = useState([])
  const [announcements,setAnnouncements] = useState([])
  const [events,setEvents] = useState([])
  const [stages,setStages] = useState([])
  const [requirements,setRequirements] = useState([])
  const [achievements,setAchievements] = useState([])
  const [notifications,setNotifications] = useState([])
  const [summary,setSummary] = useState(null)
  const [progress,setProgress] = useState([])
  const [rewards,setRewards] = useState({grants:[],transactions:[],balance:0})
  const [query,setQuery] = useState('')
  const [selectedArticle,setSelectedArticle] = useState(null)
  const [busy,setBusy] = useState(false)
  const [error,setError] = useState('')

  useEffect(() => {
    const fromHash = () => {
      const target = location.hash.slice(1).split('/')[0]
      if (nav.some(([id]) => id === target)) setPage(target)
    }
    fromHash()
    addEventListener('hashchange',fromHash)
    return () => removeEventListener('hashchange',fromHash)
  }, [])
  useEffect(() => {
    let active = true
    Promise.all([
      networkRepository.accessibleUnits(),contentRepository.categories(),contentRepository.articles(),
      contentRepository.products(),contentRepository.announcements(),contentRepository.events(),
      journeyRepository.stages(),journeyRepository.requirements(),gamificationRepository.achievements(),
      notificationRepository.list(session.user.id),
    ]).then(([u,c,a,p,n,e,s,r,g,notes]) => {
      if (!active) return
      setUnits(u);setUnitId(u[0]?.id || '');setCategories(c);setArticles(a);setProducts(p)
      setAnnouncements(n);setEvents(e);setStages(s);setRequirements(r);setAchievements(g);setNotifications(notes)
    }).catch(cause => { if (active) setError(cause.message) })
    return () => { active = false }
  }, [session.user.id])
  const loadUnit = useCallback(async () => {
    if (!unitId) return
    const [journey,reward] = await Promise.all([journeyRepository.unitProgress(unitId),gamificationRepository.unitRewards(unitId)])
    setSummary(journey.summary);setProgress(journey.progress);setRewards(reward)
  }, [unitId])
  useEffect(() => { loadUnit().catch(cause => setError(cause.message)) }, [loadUnit])

  const go = target => { setPage(target);location.hash=target;window.scrollTo(0,0) }
  const validate = async requirement => {
    if (!unitId || busy) return
    setBusy(true);setError('')
    try { await journeyRepository.validateRequirement(unitId,requirement.id,session.user.id);await loadUnit() }
    catch (cause) { setError(cause.message) }
    finally { setBusy(false) }
  }
  const currentUnit = units.find(unit => unit.id === unitId)
  const foundArticles = articles.filter(article => `${article.title} ${article.summary || ''} ${article.tags.join(' ')}`.toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR')))
  const foundProducts = products.filter(product => `${product.name} ${product.segment || ''} ${product.application || ''}`.toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR')))
  const awarded = new Set(rewards.grants.map(grant => grant.achievement_id))

  return <div className="portal-shell connected-shell"><aside className="sidebar"><div className="sidebar-head"><div className="logo-wrap"><Image src="/logo-phiq.png" alt="PHIQ" width={164} height={62}/><span>Portal do Franqueado</span></div></div><nav className="primary-nav">{nav.map(([id,label,Icon]) => <button key={id} className={`nav-item ${page === id ? 'active' : ''}`} onClick={() => go(id)}><Icon size={19}/><span>{label}</span></button>)}</nav><div className="connected-user"><strong>{session.profile.full_name}</strong><small>{session.profile.role}</small><button onClick={() => authRepository.signOut()}><LogOut size={15}/> Sair</button></div></aside><main className="main-shell"><header className="topbar connected-topbar"><strong>{nav.find(([id]) => id === page)?.[1]}</strong><div><select value={unitId} onChange={event => setUnitId(event.target.value)} aria-label="Unidade selecionada"><option value="">Selecione uma unidade</option>{units.map(unit => <option key={unit.id} value={unit.id}>{unit.name}</option>)}</select><span>{notifications.filter(item => !item.read_at).length} notificações</span></div></header><nav className="connected-mobile-nav">{nav.map(([id,label,Icon]) => <button key={id} className={page===id?"active":""} onClick={() => go(id)}><Icon size={16}/>{label}</button>)}</nav><div className="page-stage"><div className="screen">{error && <p className="support-alert" role="alert">{error}</p>}
    {page === 'inicio' && <><div className="section-intro"><span className="pill pill-teal">PORTAL DO FRANQUEADO PHIQ</span><h1>Bem-vindo, <span>{session.profile.full_name.split(' ')[0]}.</span></h1><p>{currentUnit ? `Acompanhe os dados da unidade ${currentUnit.name}.` : 'Nenhuma unidade vinculada à sua conta.'}</p></div><div className="connected-grid"><article className="panel connected-stat"><Rocket size={23}/><span>Jornada</span><strong>{summary?.percent_complete ?? 0}%</strong><small>{summary?.completed_count ?? 0} de {summary?.requirement_count ?? 0} requisitos</small><button onClick={() => go('jornada')}>Ver jornada <ChevronRight size={14}/></button></article><article className="panel connected-stat"><Coins size={23}/><span>Moedas</span><strong>{rewards.balance}</strong><small>Saldo de transações persistidas</small><button onClick={() => go('jornada')}>Ver conquistas <ChevronRight size={14}/></button></article><article className="panel connected-stat"><Megaphone size={23}/><span>Comunicados</span><strong>{announcements.length}</strong><small>Publicações disponíveis</small><button onClick={() => go('comunicados')}>Abrir comunicados <ChevronRight size={14}/></button></article></div><div className="connected-columns"><article className="panel"><h3>Próximos eventos</h3>{events.length ? events.slice(0,4).map(event => <div className="connected-row" key={event.id}><CalendarDays size={18}/><div><strong>{event.title}</strong><small>{new Date(event.starts_at).toLocaleString('pt-BR')}</small></div></div>) : <p className="connected-empty">Nenhum evento publicado.</p>}</article><article className="panel"><h3>Comunicados recentes</h3>{announcements.length ? announcements.slice(0,4).map(item => <div className="connected-row" key={item.id}><Megaphone size={18}/><div><strong>{item.title}</strong><small>{item.summary}</small></div></div>) : <p className="connected-empty">Nenhum comunicado publicado.</p>}</article></div></>}
    {page === 'base' && <><div className="section-intro"><span className="pill pill-teal">CONTEÚDO OFICIAL</span><h1>Base de Conhecimento</h1><p>Artigos e produtos publicados para a rede.</p></div><label className="connected-search"><Search size={17}/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar conteúdo ou produto"/></label><div className="connected-columns"><article className="panel"><h3>Artigos</h3>{foundArticles.length ? foundArticles.map(article => <button className="connected-row" key={article.id} onClick={() => setSelectedArticle(article)}><BookOpen size={18}/><div><strong>{article.title}</strong><small>{categories.find(category => category.id === article.category_id)?.title}</small></div><ChevronRight size={14}/></button>) : <p className="connected-empty">Nenhum artigo publicado.</p>}</article><article className="panel"><h3>Produtos</h3>{foundProducts.length ? foundProducts.map(product => <div className="connected-row" key={product.id}><PackageOpen size={18}/><div><strong>{product.name}</strong><small>{product.application || product.segment}</small><small>Diluição: {product.dilution_guidance || 'Consulte a ficha técnica'}</small></div></div>) : <p className="connected-empty">Nenhum produto publicado.</p>}</article></div></>}
    {page === 'jornada' && <><div className="section-intro"><span className="pill pill-teal">EVOLUÇÃO DA UNIDADE</span><h1>Onboarding & Jornada</h1><p>Progresso calculado pelos requisitos concluídos.</p></div><article className="panel connected-progress"><strong>{summary?.percent_complete ?? 0}%</strong><span>{summary?.completed_count ?? 0} de {summary?.requirement_count ?? 0} requisitos concluídos</span></article>{stages.map(stage => <article className="panel connected-stage" key={stage.id}><h3>{stage.sort_order}. {stage.title}</h3>{requirements.filter(requirement => requirement.stage_id === stage.id).length ? requirements.filter(requirement => requirement.stage_id === stage.id).map(requirement => { const item = progress.find(row => row.requirement_id === requirement.id);return <div className="connected-row" key={requirement.id}><span>{item?.status === 'completed' ? <CheckCircle2 size={18}/> : <Award size={18}/>}</span><div><strong>{requirement.title}</strong><small>{requirement.kind} · {item?.status || 'Não iniciado'}{requirement.requires_validation ? ' · requer validação' : ''}</small></div>{session.profile.role !== 'franchisee' && item?.status !== 'completed' && <button disabled={busy} onClick={() => validate(requirement)}>Validar</button>}</div>}) : <p className="connected-empty">Requisitos ainda não cadastrados.</p>}</article>)}<article className="panel connected-stage"><h3>Conquistas e moedas</h3>{achievements.length ? achievements.map(achievement => <div className="connected-row" key={achievement.id}><Award size={19}/><div><strong>{achievement.title}</strong><small>{achievement.description} · {achievement.reward_coins} moedas</small></div><span>{awarded.has(achievement.id) ? 'Conquistada' : 'Pendente'}</span></div>) : <p className="connected-empty">Nenhuma conquista publicada.</p>}</article></>}
    {page === 'franqueados' && <><div className="section-intro"><span className="pill pill-teal">REDE PHIQ</span><h1>Unidades autorizadas</h1><p>Você visualiza apenas as unidades permitidas ao seu perfil.</p></div><article className="panel">{units.length ? units.map(unit => <button className="connected-row" key={unit.id} onClick={() => setUnitId(unit.id)}><Users size={19}/><div><strong>{unit.name}</strong><small>{unit.city}{unit.state_code ? ` · ${unit.state_code}` : ''}</small></div>{unitId === unit.id && <CheckCircle2 size={17}/>}</button>) : <p className="connected-empty">Nenhuma unidade autorizada.</p>}</article></>}
    {page === 'comunicados' && <><div className="section-intro"><span className="pill pill-teal">COMUNICAÇÃO OFICIAL</span><h1>Comunicados e agenda</h1></div><div className="connected-columns"><article className="panel"><h3>Comunicados</h3>{announcements.length ? announcements.map(item => <div className="connected-row" key={item.id}><Megaphone size={18}/><div><strong>{item.title}</strong><small>{item.summary}</small></div></div>) : <p className="connected-empty">Nenhum comunicado publicado.</p>}</article><article className="panel"><h3>Eventos</h3>{events.length ? events.map(item => <div className="connected-row" key={item.id}><CalendarDays size={18}/><div><strong>{item.title}</strong><small>{new Date(item.starts_at).toLocaleString('pt-BR')}</small></div></div>) : <p className="connected-empty">Nenhum evento publicado.</p>}</article></div></>}
    {page === 'suporte' && <SupportWorkspace tab={supportTab} setTab={setSupportTab} session={session}/>}
    {selectedArticle && <div className="modal-scrim" onMouseDown={event => { if (event.target === event.currentTarget) setSelectedArticle(null) }}><article className="modal-card connected-article" role="dialog" aria-modal="true" aria-label={selectedArticle.title}><button className="modal-close" onClick={() => setSelectedArticle(null)}>×</button><h2>{selectedArticle.title}</h2><p>{selectedArticle.summary}</p>{selectedArticle.blocks.map((block,index) => block.type === 'heading' ? <h3 key={index}>{block.text}</h3> : block.type === 'list' ? <ul key={index}>{block.items?.map((text,i) => <li key={i}>{text}</li>)}</ul> : block.type === 'embed' && block.url ? <a key={index} href={block.url} target="_blank" rel="noreferrer">Abrir conteúdo relacionado</a> : <p key={index}>{block.text}</p>)}</article></div>}
  </div></div></main></div>
}
