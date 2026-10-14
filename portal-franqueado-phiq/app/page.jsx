'use client'

import Image from 'next/image'
import SupportWorkspace from './SupportWorkspace'
import PortalAuth from './PortalAuth'
import ConnectedPortal from './ConnectedPortal'
import { authRepository } from '../services/auth'
import { useEffect, useMemo, useState } from 'react'
import {
  Home, BookOpen, Rocket, Users, Megaphone, Headphones, Search, Bell,
  ChevronRight, ChevronLeft, ChevronDown, Check, Lock, ArrowRight, MapPin,
  Play, FileText, PackageOpen, BarChart3, Handshake, CalendarDays, Settings,
  Award, Trophy, GraduationCap, Building2, MessageSquareText, Menu, X, Clock,
  ExternalLink, Sparkles, ShieldCheck, FlaskConical, ClipboardCheck, ScrollText,
  PhoneCall, Send, Paperclip, CircleHelp, UserRound, Filter, Newspaper, Video,
  CalendarCheck, Target, BookMarked, BadgeCheck, Layers3, Lightbulb, Eye,
  CircleDot, SlidersHorizontal, CheckCircle2, AlertCircle, Mail, BriefcaseBusiness,
  UserCheck, Wrench, Waypoints, Leaf, Network, PanelTopOpen, BookCopy, FileSearch,
  MessagesSquare, Download, Share2
} from 'lucide-react'

const NAV = [
  ['inicio','Início',Home],
  ['base','Base de Conhecimento',BookOpen],
  ['jornada','Onboarding & Jornada',Rocket],
  ['franqueados','Nossos Franqueados',Users],
  ['comunicados','Comunicados Oficiais',Megaphone],
  ['suporte','Suporte & CS',Headphones],
]

const SHORTCUTS = [
  ['Produtos PHIQ', PackageOpen],
  ['Biblioteca PHIQ', FileText],
  ['Infraestrutura & Wiki', Settings],
  ['Comercial & Crescimento', BarChart3],
  ['Treinamentos', Building2],
]

const ACHIEVEMENTS = [
  {img:'/coins/boas-vindas.png', title:'Boas-vindas', desc:'Cadastro realizado', date:'15/01/2026', points:20, unlocked:true},
  {img:'/coins/treinamento.png', title:'Treinamento Institucional', desc:'Módulo concluído', date:'18/01/2026', points:40, unlocked:true},
  {img:'/coins/produtos.png', title:'Conhecimento de Produtos', desc:'Módulo concluído', date:'25/01/2026', points:50, unlocked:true},
  {img:'/coins/primeira-visita.png', title:'Primeira Visita', desc:'Visita realizada', date:'02/02/2026', points:60, unlocked:true},
  {img:'/coins/primeiro-orcamento.png', title:'Primeiro Orçamento', desc:'Orçamento enviado', date:'10/02/2026', points:70, unlocked:true},
  {img:'/coins/primeira-venda.png', title:'Primeira Venda', desc:'Venda realizada', date:'15/02/2026', points:80, unlocked:true},
  {img:'/coins/equipe-formada.png', title:'Equipe Formada', desc:'Conclua as etapas anteriores', date:'Bloqueado', points:100, unlocked:false},
  {img:'/coins/excelencia.png', title:'Excelência', desc:'Alcance o nível 5', date:'Bloqueado', points:150, unlocked:false},
]

const STAGES = [
  {title:'Alistamento', subtitle:'100% concluído', icon:Check, state:'done'},
  {title:'Formação', subtitle:'80% concluído', icon:GraduationCap, state:'done'},
  {title:'Operação', subtitle:'Em andamento', icon:Settings, state:'active'},
  {title:'Autonomia', subtitle:'Bloqueado', icon:Users, state:'locked'},
  {title:'Excelência', subtitle:'Bloqueado', icon:Trophy, state:'locked'},
]

const KNOWLEDGE = [
  {id:'comecando', title:'Começando na PHIQ', desc:'Cultura, estrutura da rede, papel do franqueado e primeiros passos.', icon:GraduationCap, tag:'Comece aqui'},
  {id:'operacao', title:'Operação & Padrões', desc:'Manuais, POPs, limpeza, segurança química e referências operacionais.', icon:Settings, tag:'Operação'},
  {id:'comercial', title:'Comercial & Crescimento', desc:'Abordagem consultiva, scripts, segmentos e desenvolvimento comercial.', icon:BarChart3, tag:'Comercial'},
  {id:'produtos', title:'Produtos PHIQ', desc:'Catálogo interno, aplicações, documentos e materiais técnicos.', icon:PackageOpen, tag:'Portfólio'},
  {id:'biblioteca', title:'Biblioteca PHIQ', desc:'Treinamentos, apresentações, vídeos e conteúdos de apoio.', icon:BookMarked, tag:'Biblioteca'},
  {id:'wiki', title:'Infraestrutura & Wiki', desc:'Políticas, cultura, ferramentas de gestão e processos internos.', icon:Building2, tag:'Processos'},
]

const PRODUCTS = [
  {name:'CLORAL-Q 7000', type:'Desinfetante', segment:'Alimentos', use:'Pisos, paredes e superfícies', dilution:'1:30'},
  {name:'ACIDOX-Q 320', type:'Ácido', segment:'Indústria', use:'Remoção de incrustações minerais', dilution:'Conforme aplicação'},
  {name:'MULT-Q 150', type:'Multifuncional', segment:'Institucional', use:'Limpeza de superfícies', dilution:'Conforme aplicação'},
  {name:'DET-Q 550', type:'Detergente', segment:'Alimentos', use:'Limpeza de equipamentos', dilution:'Conforme aplicação'},
  {name:'PERACE-Q 150', type:'Sanitizante', segment:'Alimentos', use:'Sanitização de processo', dilution:'Conforme validação'},
  {name:'ALCALIN-Q PLUS', type:'Alcalino', segment:'Indústria', use:'Limpeza pesada', dilution:'Conforme aplicação'},
]

const UNITS = [
  {id:'ce', uf:'CE', city:'Fortaleza', stage:'Operação', progress:63, level:3, responsible:'Franquia PHIQ Ceará', x:343, y:125},
  {id:'pb', uf:'PB', city:'João Pessoa', stage:'Excelência', progress:91, level:5, responsible:'Franquia PHIQ Paraíba', x:382, y:170},
  {id:'ba', uf:'BA', city:'Salvador', stage:'Formação', progress:44, level:2, responsible:'Franquia PHIQ Bahia', x:314, y:258},
  {id:'se', uf:'SE', city:'Aracaju', stage:'Operação', progress:58, level:3, responsible:'Franquia PHIQ Sergipe', x:373, y:231},
]

const COMMUNICATIONS = [
  {title:'Atualização comercial', date:'Hoje', category:'Comercial', body:'Novo material de abordagem para indústrias de alimentos.', icon:BarChart3},
  {title:'Podcast CDQ', date:'Ontem', category:'Podcast', body:'Novo episódio disponível no portal.', icon:Play},
  {title:'Treinamento da rede', date:'25 Set', category:'Treinamento', body:'Agenda do próximo encontro técnico.', icon:GraduationCap},
  {title:'Atualização de POP', date:'23 Set', category:'Técnico', body:'Revisão de procedimento operacional disponível.', icon:FileText},
  {title:'Jornal PHIQ — Setembro', date:'20 Set', category:'Institucional', body:'Confira as principais novidades da rede.', icon:Newspaper},
]

const EVENTS = [
  {day:'30', month:'SET', title:'Encontro técnico da rede', meta:'15:00 · Online'},
  {day:'02', month:'OUT', title:'Plantão comercial NAF', meta:'10:00 · Online'},
  {day:'08', month:'OUT', title:'Treinamento de produtos', meta:'14:00 · Online'},
]

const JOURNEY_INFO = [
  {title:'Como funciona a Jornada PHIQ?', icon:Waypoints, content:'A Jornada PHIQ organiza o desenvolvimento do franqueado de forma progressiva. Cada etapa combina capacitação, aplicação prática, acompanhamento do Customer Success e critérios de evolução.'},
  {title:'Onboarding', icon:GraduationCap, content:'Fase de integração e formação. O objetivo é garantir alinhamento técnico, institucional, comercial e operacional antes do avanço para uma atuação mais autônoma.'},
  {title:'Ongoing', icon:Target, content:'Depois da integração, o acompanhamento continua por meio de metas, reuniões, suporte, evolução comercial e monitoramento dos padrões da rede.'},
  {title:'Autonomia', icon:UserCheck, content:'A unidade passa a operar com menor necessidade de intervenção, mantendo aderência aos padrões PHIQ, consistência operacional e domínio dos processos principais.'},
  {title:'Excelência', icon:Trophy, content:'Etapa de maturidade. A unidade consolida boas práticas, desempenho e cultura PHIQ, tornando-se referência dentro da rede.'},
  {title:'Como funciona a gamificação?', icon:Award, content:'Marcos da jornada liberam moedas e conquistas. A gamificação reconhece evolução real — treinamentos concluídos, primeira visita, primeiro orçamento, primeira venda e outros resultados relevantes.'},
  {title:'Critérios de evolução', icon:ClipboardCheck, content:'A progressão considera formação concluída, participação, qualidade de execução, aderência a padrões, evolução comercial, registro das atividades e validação do Customer Success.'},
]

const SEARCH_INDEX = [
  {label:'Começando na PHIQ', type:'Base de conhecimento', page:'base', topic:'comecando', keywords:'missão visão valores papel franqueado primeiros passos naf'},
  {label:'Operação & Padrões', type:'Base de conhecimento', page:'base', topic:'operacao', keywords:'pop manual smart agil max limpeza segurança fds epi'},
  {label:'Comercial & Crescimento', type:'Base de conhecimento', page:'base', topic:'comercial', keywords:'abordagem whatsapp telefone visita teste script venda'},
  {label:'Produtos PHIQ', type:'Base de conhecimento', page:'base', topic:'produtos', keywords:'cloral acido det detergente sanitizante produto ficha técnica'},
  {label:'Infraestrutura & Wiki', type:'Base de conhecimento', page:'base', topic:'wiki', keywords:'ishikawa 5 porques 5w2h gut checklist fluxograma cultura política'},
  {label:'Minha jornada', type:'Onboarding & Jornada', page:'jornada', keywords:'progresso nível moeda conquista onboarding ongoing autonomia excelência'},
  {label:'Nossos franqueados', type:'Rede PHIQ', page:'franqueados', keywords:'fortaleza joao pessoa salvador aracaju rede unidades mapa'},
  {label:'Comunicados oficiais', type:'Comunicação', page:'comunicados', keywords:'comunicado podcast jornal video campanha atualização'},
  {label:'Suporte & Customer Success', type:'Suporte', page:'suporte', keywords:'chamado naf cs operacional comercial administrativo faq sla'},
]

function useCountUp(target, duration=950) {
  const [value,setValue] = useState(0)
  useEffect(()=>{
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce) { setValue(target); return }
    const start = performance.now(); let raf
    const tick = now => {
      const t = Math.min(1,(now-start)/duration)
      const eased = 1-Math.pow(1-t,3)
      setValue(Math.round(target*eased))
      if(t<1) raf=requestAnimationFrame(tick)
    }
    raf=requestAnimationFrame(tick)
    return ()=>cancelAnimationFrame(raf)
  },[target,duration])
  return value
}

function safeTransition(fn) {
  if (typeof document !== 'undefined' && document.startViewTransition) document.startViewTransition(fn)
  else fn()
}

export default function Page(){
  return <PortalAuth>{session=>session.preview?<PortalPage session={session}/>:<ConnectedPortal session={session}/>}</PortalAuth>
}

function PortalPage({session}){
  const [page,setPage]=useState('inicio')
  const [mobileOpen,setMobileOpen]=useState(false)
  const [knowledgeTopic,setKnowledgeTopic]=useState(null)
  const [achievement,setAchievement]=useState(null)
  const [unit,setUnit]=useState(null)
  const [query,setQuery]=useState('')
  const [toast,setToast]=useState('')
  const [supportTab,setSupportTab]=useState('novo')

  useEffect(()=>{
    const restore=()=>{
      const [nextPage,nextTopic]=window.location.hash.slice(1).split('/')
      if(NAV.some(([id])=>id===nextPage)){
        setPage(nextPage)
        setKnowledgeTopic(nextPage==='base'&&KNOWLEDGE.some(item=>item.id===nextTopic)?nextTopic:null)
      }
    }
    restore()
    window.addEventListener('hashchange',restore)
    return ()=>window.removeEventListener('hashchange',restore)
  },[])

  const navigate = (id, opts={}) => safeTransition(()=>{
    setPage(id)
    if(id!=='base' || !opts.keepTopic) setKnowledgeTopic(opts.topic || null)
    window.location.hash = id==='base'&&opts.topic ? `${id}/${opts.topic}` : id
    setMobileOpen(false)
    setQuery('')
    window.scrollTo({top:0,behavior:'smooth'})
  })

  const openSearchResult = item => {
    navigate(item.page,{topic:item.topic})
  }

  const showToast = text => {
    setToast(text)
    window.clearTimeout(window.__phiqToast)
    window.__phiqToast=window.setTimeout(()=>setToast(''),2600)
  }

  return <div className="portal-shell">
    <Sidebar page={page} onNavigate={navigate} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen}/>
    {mobileOpen&&<button className="mobile-scrim" onClick={()=>setMobileOpen(false)} aria-label="Fechar menu"/>}
    <main className="main-shell">
      <Topbar page={page} onMenu={()=>setMobileOpen(true)} query={query} setQuery={setQuery} onResult={openSearchResult} onNavigate={navigate} session={session}/>
      <div className="page-stage" key={`${page}-${knowledgeTopic||''}`}>
        {page==='inicio'&&<HomePage onNavigate={navigate} onAchievement={setAchievement}/>} 
        {page==='base'&&<KnowledgePage topic={knowledgeTopic} setTopic={topic=>{setKnowledgeTopic(topic);window.location.hash=topic?`base/${topic}`:'base'}} showToast={showToast}/>} 
        {page==='jornada'&&<JourneyPage onAchievement={setAchievement}/>} 
        {page==='franqueados'&&<FranchisePage onUnit={setUnit}/>} 
        {page==='comunicados'&&<CommsPage showToast={showToast}/>} 
        {page==='suporte'&&<SupportWorkspace tab={supportTab} setTab={setSupportTab} session={session}/>} 
      </div>
    </main>
    {achievement&&<AchievementModal item={achievement} onClose={()=>setAchievement(null)}/>} 
    {unit&&<UnitModal unit={unit} onClose={()=>setUnit(null)}/>} 
    {toast&&<div className="toast"><CheckCircle2 size={17}/>{toast}</div>}
  </div>
}

function Logo(){ return <div className="logo-wrap"><Image src="/logo-phiq.png" alt="PHIQ" width={164} height={62} priority/><span>Portal do Franqueado</span></div> }

function Sidebar({page,onNavigate,mobileOpen,setMobileOpen}){
  const shortcutTargets = [['base','produtos'],['base','biblioteca'],['base','wiki'],['base','comercial'],['base','biblioteca']]
  return <aside className={`sidebar ${mobileOpen?'mobile-open':''}`}>
    <div className="sidebar-head"><Logo/><button className="sidebar-close" onClick={()=>setMobileOpen(false)}><X size={18}/></button></div>
    <nav className="primary-nav">
      {NAV.map(([id,label,Icon])=><button key={id} onClick={()=>onNavigate(id)} className={`nav-item ${page===id?'active':''}`}><Icon size={19}/><span>{label}</span>{page===id&&<i/>}</button>)}
    </nav>
    <div className="side-section-title">ATALHOS</div>
    <div className="shortcut-list">
      {SHORTCUTS.map(([label,Icon],i)=><button key={label} className="shortcut" onClick={()=>onNavigate(shortcutTargets[i][0],{topic:shortcutTargets[i][1]})}><span className={`shortcut-icon s${i}`}><Icon size={16}/></span>{label}</button>)}
    </div>
    <div className="help-card">
      <div className="help-avatar">CS</div>
      <div><strong>Precisa de ajuda?</strong><span>Fale com o CS</span></div>
      <button onClick={()=>onNavigate('suporte')}>Abrir chamado <ArrowRight size={14}/></button>
    </div>
  </aside>
}

function Topbar({page,onMenu,query,setQuery,onResult,onNavigate,session}){
  const results=useMemo(()=>{
    const q=query.trim().toLowerCase(); if(!q) return []
    return SEARCH_INDEX.filter(x=>(`${x.label} ${x.type} ${x.keywords}`).toLowerCase().includes(q)).slice(0,6)
  },[query])
  return <header className="topbar">
    <button className="mobile-menu" onClick={onMenu}><Menu size={20}/></button>
    <div className="search-shell">
      <label className={`global-search ${query?'is-open':''}`}><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar conteúdos, documentos, treinamentos..."/>{query&&<button onClick={()=>setQuery('')}><X size={15}/></button>}</label>
      {query&&<div className="search-results">
        <div className="search-results-head"><span>Resultados</span><small>{results.length} encontrados</small></div>
        {results.length?results.map((r,i)=><button key={`${r.label}-${i}`} onClick={()=>onResult(r)}><Search size={15}/><span><strong>{r.label}</strong><small>{r.type}</small></span><ArrowRight size={14}/></button>):<div className="empty-search"><FileSearch size={22}/><span>Nenhum conteúdo encontrado</span></div>}
      </div>}
    </div>
    <div className="top-actions"><button className="bell" onClick={()=>onNavigate('comunicados')} aria-label="Abrir comunicados"><Bell size={19}/><i/></button><div className="divider"/><div className="profile"><div className="profile-avatar">{session.profile?.full_name?.slice(0,2).toUpperCase() || 'PH'}</div><div><strong>{session.profile?.full_name || 'Prévia PHIQ'}</strong><span>{session.preview?'Dados demonstrativos':session.profile?.role}</span></div>{!session.preview&&<button onClick={()=>authRepository.signOut()}>Sair</button>}</div></div>
  </header>
}

function Breadcrumb({children,onBack}){return <div className="breadcrumb">{onBack?<button onClick={onBack}><ChevronLeft size={14}/> Voltar</button>:<><Home size={14}/><ChevronRight size={13}/></>}<span>{children}</span></div>}
function Pill({children,tone='teal'}){return <span className={`pill pill-${tone}`}>{children}</span>}
function PrimaryButton({children,onClick,ghost=false,type='button'}){return <button type={type} onClick={onClick} className={`primary-btn ${ghost?'ghost':''}`}>{children}</button>}
function Panel({children,className=''}){return <article className={`panel ${className}`}>{children}</article>}

function HomePage({onNavigate,onAchievement}){
  const progress=useCountUp(58)
  return <section className="screen screen-home">
    <div className="welcome-grid reveal-group">
      <div className="welcome-copy reveal"><Pill>PORTAL DO FRANQUEADO PHIQ</Pill><h1>Bem-vindo ao seu <span>escritório PHIQ.</span></h1><p>Acompanhe sua jornada, encontre materiais estratégicos e fale com o NAF em um ambiente único.</p><div className="hero-buttons"><PrimaryButton onClick={()=>onNavigate('jornada')}>Ver minha jornada <ArrowRight size={16}/></PrimaryButton><PrimaryButton ghost onClick={()=>onNavigate('base')}>Explorar base de conhecimento</PrimaryButton></div></div>
      <div className="journey-banner reveal delay-1"><Image src="/journey-banner.jpg" fill alt="Jornada PHIQ" sizes="(max-width: 900px) 100vw, 500px"/></div>
    </div>

    <div className="home-overview reveal-group">
      <Panel className="home-progress reveal delay-1"><div className="panel-head"><div><span>SEU PROGRESSO</span><h3>Jornada PHIQ</h3></div><button onClick={()=>onNavigate('jornada')}>Ver jornada <ChevronRight size={15}/></button></div><div className="home-progress-body"><ProgressRing value={progress}/><div className="progress-copy"><div className="stage-badge"><GraduationCap size={18}/></div><span>Você está na etapa</span><strong>Formação</strong><p>Fortaleça seus conhecimentos sobre produtos, processos e gestão comercial.</p></div></div></Panel>
      <Panel className="next-step reveal delay-2"><span className="eyebrow">PRÓXIMO MARCO</span><div className="target-icon"><Award size={27}/></div><h3>Concluir treinamento comercial</h3><p>Assista ao módulo e responda o quiz.</p><div className="linear-progress"><i style={{width:'70%'}}/></div><div className="progress-line"><span>70%</span><PrimaryButton ghost onClick={()=>onNavigate('base',{topic:'comercial'})}>Continuar <ArrowRight size={14}/></PrimaryButton></div></Panel>
      <Panel className="level-card reveal delay-3"><span className="eyebrow">SEU NÍVEL ATUAL</span><div className="level-row"><div className="level-medal"><Award size={34}/></div><div><strong>Nível 2</strong><span>Franqueado em Formação</span></div></div><div className="coins-earned"><Image src="/coins/boas-vindas.png" alt="Moeda PHIQ" width={54} height={54}/><div><strong>320</strong><span>moedas conquistadas</span></div></div><PrimaryButton ghost onClick={()=>onNavigate('jornada')}>Ver detalhes <ArrowRight size={14}/></PrimaryButton></Panel>
    </div>

    <AchievementStrip onSelect={onAchievement} compact/>

    <div className="home-section-title"><div><Pill>REDE EM MOVIMENTO</Pill><h2>O que está acontecendo na PHIQ</h2><p>Atualizações, compromissos e conteúdos para você continuar evoluindo.</p></div></div>
    <div className="home-live-grid">
      <Panel className="updates-card"><div className="section-row"><div><span className="eyebrow">ÚLTIMOS COMUNICADOS</span><h3>Atualizações da rede</h3></div><button onClick={()=>onNavigate('comunicados')}>Ver todos <ArrowRight size={14}/></button></div>{COMMUNICATIONS.slice(0,3).map((c,i)=>{const Icon=c.icon;return <div className="mini-feed" key={c.title}><div className="mini-feed-icon"><Icon size={17}/></div><div><strong>{c.title}</strong><span>{c.body}</span></div><time>{c.date}</time></div>})}</Panel>
      <Panel className="events-card"><div className="section-row"><div><span className="eyebrow">AGENDA</span><h3>Próximos eventos</h3></div><CalendarDays size={19}/></div>{EVENTS.map(e=><div className="event-row" key={`${e.day}-${e.title}`}><div className="event-date"><strong>{e.day}</strong><span>{e.month}</span></div><div><strong>{e.title}</strong><span>{e.meta}</span></div><ChevronRight size={15}/></div>)}</Panel>
    </div>

    <div className="home-section-title compact"><div><Pill>CONTINUE APRENDENDO</Pill><h2>Conteúdo recomendado para sua etapa</h2></div><button onClick={()=>onNavigate('base')}>Explorar biblioteca <ArrowRight size={14}/></button></div>
    <div className="learning-grid">
      {[['Treinamento comercial','Comercial & Crescimento','18 min',BarChart3],['Segurança química','Operação & Padrões','12 min',ShieldCheck],['Produtos PHIQ','Catálogo técnico','Guia',PackageOpen]].map(([t,s,m,Icon],i)=><button className="learning-card" onClick={()=>onNavigate('base',{topic:i===0?'comercial':i===1?'operacao':'produtos'})} key={t}><div className="learning-icon"><Icon size={20}/></div><div><span>{s}</span><strong>{t}</strong><small>{m}</small></div><ArrowRight size={16}/></button>)}
    </div>

    <div className="home-network-grid">
      <Panel className="mini-map-card"><div className="section-row"><div><span className="eyebrow">SUA REDE</span><h3>Franqueados pelo Brasil</h3></div><button onClick={()=>onNavigate('franqueados')}>Explorar rede <ArrowRight size={14}/></button></div><div className="mini-map"><BrazilMap small onUnit={()=>onNavigate('franqueados')}/></div></Panel>
      <Panel className="cs-overview"><div className="cs-overview-head"><div className="cs-big">GB</div><div><span className="eyebrow">SEU ACOMPANHAMENTO</span><h3>Gustavo Borba</h3><p>Núcleo de Apoio ao Franqueado · NAF</p></div></div><div className="cs-actions"><div><Clock size={16}/><span><strong>Próximo acompanhamento</strong>02/10 · 10:00</span></div><div><MessageSquareText size={16}/><span><strong>Canal oficial</strong>Suporte pelo Portal</span></div></div><PrimaryButton onClick={()=>onNavigate('suporte')}>Falar com o CS <ArrowRight size={14}/></PrimaryButton></Panel>
    </div>
  </section>
}

function ProgressRing({value}){
  const radius=66, circumference=2*Math.PI*radius, offset=circumference-(value/100)*circumference
  return <div className="progress-ring-wrap"><svg viewBox="0 0 160 160" className="progress-ring"><circle cx="80" cy="80" r={radius} className="ring-track"/><circle cx="80" cy="80" r={radius} className="ring-value" style={{strokeDasharray:circumference,strokeDashoffset:offset}}/></svg><div className="progress-ring-label"><strong>{value}%</strong><span>Concluído</span></div></div>
}

function AchievementStrip({onSelect,compact=false}){
  const [expanded,setExpanded]=useState(false)
  return <Panel className={`achievement-panel ${compact&&!expanded?'compact':''}`}><div className="section-row"><div><h3>Suas conquistas</h3><p>Cada conquista representa um passo importante na sua evolução como franqueado.</p></div><button onClick={()=>setExpanded(value=>!value)}>{expanded?'Recolher conquistas':'Ver todas as conquistas'} <ArrowRight size={14}/></button></div><div className="achievement-scroll">{ACHIEVEMENTS.map((a,i)=><button className={`achievement-item ${a.unlocked?'unlocked':'locked'}`} key={a.title} style={{'--i':i}} onClick={()=>onSelect?.(a)}><div className="coin-stage"><Image className="achievement-coin" src={a.img} alt={a.title} width={130} height={130}/>{!a.unlocked&&<div className="coin-lock"><Lock size={15}/></div>}<span className="coin-shine"/></div><strong>{a.title}</strong>{(!compact||expanded)&&<><span>{a.desc}</span><small>{a.date}</small></>}</button>)}</div></Panel>
}

function KnowledgePage({topic,setTopic,showToast}){
  if(topic) return <KnowledgeDetail topic={topic} onBack={()=>setTopic(null)} showToast={showToast}/>
  return <section className="screen"><Breadcrumb>Base de Conhecimento</Breadcrumb><div className="section-intro"><Pill>BASE DE CONHECIMENTO</Pill><h1>Encontre o conteúdo certo, <span>sem procurar demais.</span></h1><p>A mesma lógica do Notion, agora em uma biblioteca estruturada, pesquisável e preparada para crescer.</p></div><KnowledgeHub setTopic={setTopic}/></section>
}

function KnowledgeHub({setTopic}){
  const [filter,setFilter]=useState('')
  const items=KNOWLEDGE.filter(x=>(x.title+x.desc+x.tag).toLowerCase().includes(filter.toLowerCase()))
  return <><label className="knowledge-search panel"><Search size={18}/><input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Pesquisar por produto, POP, aplicação, treinamento..."/><SlidersHorizontal size={17}/></label><div className="knowledge-grid">{items.map((k,i)=><button className="knowledge-card panel" key={k.id} onClick={()=>setTopic(k.id)}><div className="knowledge-top"><span className="knowledge-number">0{i+1}</span><div className="knowledge-icon"><k.icon size={21}/></div></div><span className="eyebrow">{k.tag}</span><h3>{k.title}</h3><p>{k.desc}</p><span className="knowledge-link">Explorar conteúdo <ArrowRight size={14}/></span></button>)}</div></>
}

function KnowledgeDetail({topic,onBack,showToast}){
  const item=KNOWLEDGE.find(x=>x.id===topic)
  return <section className="screen"><Breadcrumb onBack={onBack}>{item?.title}</Breadcrumb>{topic==='comecando'&&<StartingPage/>}{topic==='operacao'&&<OperationsPage showToast={showToast}/>}{topic==='comercial'&&<CommercialPage/>}{topic==='produtos'&&<ProductsPage showToast={showToast}/>}{topic==='biblioteca'&&<LibraryPage showToast={showToast}/>}{topic==='wiki'&&<WikiPage/>}</section>
}

function DetailHeader({tag,title,description,icon:Icon}){return <div className="detail-header"><div><Pill>{tag}</Pill><h1>{title}</h1><p>{description}</p></div><div className="detail-hero-icon"><Icon size={34}/></div></div>}

function Accordion({title,icon:Icon,children,defaultOpen=false}){
  return <details className="content-accordion panel" open={defaultOpen}><summary><span className="accordion-icon"><Icon size={18}/></span><strong>{title}</strong><ChevronDown size={17}/></summary><div className="accordion-content">{children}</div></details>
}

function StartingPage(){
  const [steps,setSteps]=useState([true,true,false,false,false])
  useEffect(()=>{try{const saved=JSON.parse(localStorage.getItem('phiq-first-steps-v1'));if(Array.isArray(saved)&&saved.length===5)setSteps(saved)}catch{}},[])
  const updateStep=index=>{const next=steps.map((value,i)=>i===index?!value:value);setSteps(next);localStorage.setItem('phiq-first-steps-v1',JSON.stringify(next))}
  return <><DetailHeader tag="COMECE AQUI" title="Começando na PHIQ" description="O ponto de partida da jornada: visão da empresa, papel do franqueado, estrutura da jornada, padrões iniciais e primeiros passos." icon={GraduationCap}/><div className="callout"><Lightbulb size={20}/><p><strong>Produto sem método não gera resultado.</strong> O Portal organiza estrutura, conhecimento e acompanhamento para apoiar a evolução da unidade.</p></div><div className="detail-stack"><Accordion title="Visão geral da PHIQ" icon={Building2} defaultOpen><div className="two-col"><div><p>A PHIQ — Philipéia Indústria Química — combina inovação, conhecimento técnico e respeito ao meio ambiente para entregar soluções profissionais com qualidade e método.</p><div className="mission-grid"><div><strong>Missão</strong><span>Promover uma experiência de qualidade no atendimento, aquisição, uso e rendimento das soluções.</span></div><div><strong>Visão</strong><span>Atender clientes por meio do conhecimento técnico e de uma rede de franqueados capacitados.</span></div><div><strong>Valores</strong><span>Inovação, sustentabilidade, conhecimento técnico, excelência, compromisso e respeito.</span></div></div></div><div className="pillar-list"><div><PackageOpen size={18}/><span><strong>Produtos</strong>Uso profissional, eficiência e segurança.</span></div><div><GraduationCap size={18}/><span><strong>Conhecimento</strong>Treinamentos e padronização.</span></div><div><Handshake size={18}/><span><strong>Acompanhamento</strong>Suporte contínuo da PHIQ.</span></div></div></div></Accordion><Accordion title="Papel do Franqueado" icon={UserRound}><div className="responsibility-grid">{[['Responsabilidades técnicas','Aplicar produtos corretamente, seguir procedimentos e orientações técnicas.'],['Responsabilidades comerciais','Atuar de forma ética, consultiva e alinhada à proposta de valor PHIQ.'],['Responsabilidades institucionais','Representar a marca e utilizar corretamente seus ativos e padrões.'],['Limites de atuação','Não alterar formulações, métodos ou decisões técnicas sem validação PHIQ.']].map(([t,d])=><div key={t}><CheckCircle2 size={17}/><span><strong>{t}</strong>{d}</span></div>)}</div></Accordion><Accordion title="Estrutura da jornada" icon={Waypoints}><div className="journey-mini-steps">{['Formação','Operação Assistida','Autonomia','Excelência'].map((s,i)=><div key={s}><span>{i+1}</span><strong>{s}</strong></div>)}</div><p>A evolução entre etapas é orientada por critérios técnicos, operacionais e de alinhamento com os padrões PHIQ. O Customer Success atua como facilitador e ponto de apoio durante toda a jornada.</p></Accordion><Accordion title="Padrões iniciais" icon={BadgeCheck}><ul className="check-list"><li>O NAF é o ponto central de orientação e acompanhamento.</li><li>Todo suporte segue processos definidos e documentados.</li><li>A comunicação ocorre pelos canais oficiais.</li><li>As etapas da jornada possuem registros e acompanhamento.</li><li>Espera-se participação ativa e aderência aos padrões.</li></ul></Accordion><Accordion title="Primeiros passos" icon={ClipboardCheck}><div className="first-steps">{['Concluir cadastro da unidade','Assistir ao treinamento institucional','Conhecer o portfólio principal','Validar canais oficiais de suporte','Agendar acompanhamento inicial com o NAF'].map((s,i)=><label key={s}><input type="checkbox" checked={steps[i]} onChange={()=>updateStep(i)}/><span>{s}</span></label>)}</div></Accordion></div></>
}

function OperationsPage({showToast}){
  return <><DetailHeader tag="OPERAÇÃO" title="Operação & Padrões" description="Procedimentos, manuais e materiais que ajudam a manter consistência, segurança e alinhamento com a forma de atuar da PHIQ." icon={Settings}/><div className="manual-grid">{['SMART','ÁGIL','MAX'].map((m,i)=><button className="manual-card panel" key={m} onClick={()=>showToast(`Manual ${m}: link preparado para o documento oficial.`)}><div className="manual-icon"><ScrollText size={24}/></div><div><span>MANUAL DO FRANQUEADO</span><strong>{m}</strong><small>Abrir material <ExternalLink size={12}/></small></div></button>)}</div><Accordion title="POPs operacionais" icon={ClipboardCheck} defaultOpen><div className="table-toolbar"><label><Search size={16}/><input placeholder="Buscar POP..."/></label><button><Filter size={15}/> Filtrar</button></div><div className="pop-table"><div className="pop-row head"><span>Documento</span><span>Categoria</span><span>Status</span><span/></div>{[['POP — Limpeza de pisos','Limpeza'],['POP — Higienização de equipamentos','Processo'],['POP — Armazenamento de químicos','Segurança']].map(([n,c])=><div className="pop-row" key={n}><span><FileText size={15}/>{n}</span><span>{c}</span><span><i/>Atualizado</span><button onClick={()=>showToast('Documento preparado para abrir na versão conectada.')}>Abrir</button></div>)}</div></Accordion><Accordion title="Procedimentos de limpeza" icon={FlaskConical}><div className="two-col"><div><h4>Princípios técnicos fundamentais</h4><ul className="check-list"><li>Identificação do tipo de sujidade.</li><li>Seleção adequada do produto.</li><li>Preparação correta da solução.</li><li>Definição do método de aplicação.</li><li>Respeito ao tempo de contato.</li><li>Uso de EPIs adequados.</li></ul></div><div><h4>Todo procedimento deve responder</h4><ul className="check-list"><li>O que deve ser limpo?</li><li>Qual produto utilizar?</li><li>Como preparar e aplicar?</li><li>Qual o tempo de contato?</li><li>Qual a frequência?</li><li>Quais EPIs são obrigatórios?</li></ul></div></div></Accordion><div className="video-grid">{['Limpeza profissional','Aplicação segura','Boas práticas'].map((v,i)=><button className="video-card" key={v} onClick={()=>showToast('Vídeo preparado para incorporar o conteúdo oficial do Notion.') }><div><Play size={22}/></div><span>{v}</span><small>Vídeo técnico</small></button>)}</div><Accordion title="Segurança química" icon={ShieldCheck}><div className="two-col"><div><h4>Princípios fundamentais</h4><ul className="check-list"><li>Leitura e compreensão da FDS.</li><li>Identificação de riscos.</li><li>Uso correto de EPIs.</li><li>Armazenamento adequado.</li><li>Proibição de misturas não autorizadas.</li><li>Ação imediata em acidentes.</li></ul></div><div><h4>Temas necessários</h4><ul className="check-list"><li>Perigos e riscos.</li><li>EPIs por atividade.</li><li>Segregação de produtos.</li><li>Transporte e manuseio.</li><li>Primeiros socorros.</li><li>Procedimentos de emergência.</li></ul></div></div></Accordion></>
}

function CommercialPage(){
  const [script,setScript]=useState('whatsapp')
  const [copied,setCopied]=useState(false)
  return <><DetailHeader tag="COMERCIAL" title="Comercial & Crescimento" description="Orientações e materiais para abrir conversas técnicas, gerar oportunidades e fortalecer o posicionamento consultivo da unidade." icon={BarChart3}/><div className="commercial-flow">{[['01','Entenda o cenário','Mostre que você compreende a operação do cliente.'],['02','Identifique o conflito','Explore gargalos e oportunidades sem acusar ou presumir erros.'],['03','Apresente a solução','Posicione a PHIQ como inteligência do processo de higienização.'],['04','Leve ao teste','Convide para visita ou teste técnico controlado.'],['05','Acompanhe','Mantenha cadência e registre próximos passos.']].map(([n,t,d],i)=><div className="flow-step" key={n}><span>{n}</span><strong>{t}</strong><p>{d}</p>{i<4&&<ArrowRight size={16}/>}</div>)}</div><div className="commercial-layout"><Panel className="commercial-principles"><span className="eyebrow">LÓGICA DA ABORDAGEM</span><h3>Venda eficiência, segurança e confiança técnica.</h3><p>O cliente é o protagonista. A PHIQ entra como parceira técnica para diagnosticar, ajustar, padronizar, testar e acompanhar o processo.</p><div className="principle-tags">{['Diagnóstico técnico','Padronização','Teste controlado','Dados reais','Acompanhamento'].map(x=><span key={x}>{x}</span>)}</div></Panel><Panel className="script-panel"><div className="section-row"><div><span className="eyebrow">SCRIPTS RÁPIDOS</span><h3>Escolha o canal</h3></div></div><div className="script-tabs">{['whatsapp','telefone','visita','follow-up'].map(x=><button key={x} className={script===x?'active':''} onClick={()=>setScript(x)}>{x==='follow-up'?'Follow-up':x[0].toUpperCase()+x.slice(1)}</button>)}</div><div className="script-box"><p>{script==='whatsapp'&&'“Olá, [Nome], tudo bem? Aqui é [Nome], da PHIQ. Trabalhamos com eficiência sanitária e otimização de processos. Gostaria de entender melhor a sua operação e verificar se existe espaço para ganho de eficiência, segurança e padronização.”'}{script==='telefone'&&'“Bom dia, [Nome]. A PHIQ atua em operações com alto nível de exigência técnica. A proposta não é simplesmente apresentar produto, mas entender o processo atual e verificar oportunidades reais de melhoria.”'}{script==='visita'&&'“Minha proposta é conhecer melhor a operação e, se fizer sentido, realizar um teste técnico controlado em um ponto específico, gerando dados reais sem interferir na rotina.”'}{script==='follow-up'&&'“Passando para retomar nosso contato e entender se faz sentido avançarmos para uma avaliação técnica. Posso sugerir dois horários para alinharmos?”'}</p><button onClick={async e=>{await navigator.clipboard.writeText(e.currentTarget.previousElementSibling.innerText);setCopied(true);setTimeout(()=>setCopied(false),2000)}}>{copied?"Copiado!":"Copiar script"} <Share2 size={14}/></button></div></Panel></div><Accordion title="Segmentos onde a abordagem se aplica" icon={Layers3}><div className="segment-grid">{['Laticínios','Bebidas','Alimentos processados','Avicultura','Hospitalar','Food Service','Indústria em geral'].map(s=><span key={s}>{s}</span>)}</div></Accordion></>
}

function ProductsPage({showToast}){
  const [q,setQ]=useState('')
  const [selected,setSelected]=useState(null)
  const filtered=PRODUCTS.filter(p=>(p.name+p.type+p.segment+p.use).toLowerCase().includes(q.toLowerCase()))
  return <><DetailHeader tag="PORTFÓLIO" title="Produtos PHIQ" description="Catálogo interno para consulta rápida de aplicação, segmento, diluição e documentos relacionados." icon={PackageOpen}/><div className="catalog-toolbar panel"><label><Search size={17}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar produto, aplicação ou segmento..."/></label><button><Filter size={15}/> Filtros</button></div><div className="product-grid">{filtered.map((p,i)=><button className="product-card panel" key={p.name} onClick={()=>setSelected(p)}><div className="product-icon"><FlaskConical size={24}/></div><Pill tone={i%2?'soft':'teal'}>{p.type}</Pill><h3>{p.name}</h3><p>{p.use}</p><dl><div><dt>Segmento</dt><dd>{p.segment}</dd></div><div><dt>Diluição</dt><dd>{p.dilution}</dd></div></dl><span>Ver produto <ArrowRight size={14}/></span></button>)}</div>{selected&&<ProductModal product={selected} onClose={()=>setSelected(null)}/>}</>
}

function ProductModal({product,onClose}){
  return <div className="modal-scrim" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><div className="modal-card product-detail" role="dialog" aria-modal="true" aria-label={product.name}><button className="modal-close" onClick={onClose} aria-label="Fechar"><X size={18}/></button><Pill>{product.type}</Pill><h2>{product.name}</h2><p>{product.use}</p><dl><div><dt>Segmento</dt><dd>{product.segment}</dd></div><div><dt>Diluição informada</dt><dd>{product.dilution}</dd></div></dl><p>Consulte a ficha técnica e a FDS oficial antes de aplicar o produto.</p></div></div>
}

function LibraryPage({showToast}){
  return <><DetailHeader tag="BIBLIOTECA" title="Biblioteca PHIQ" description="Treinamentos, apresentações, vídeos e conteúdos para apoiar a rotina da unidade." icon={BookMarked}/><div className="library-grid">{[['Treinamentos','12 conteúdos',GraduationCap],['Apresentações','18 materiais',PanelTopOpen],['Vídeos técnicos','24 vídeos',Video],['Materiais comerciais','15 arquivos',BriefcaseBusiness],['Documentos institucionais','8 arquivos',FileText],['Mais acessados','Conteúdos da rede',Sparkles]].map(([t,m,Icon])=><button className="library-card panel" key={t} onClick={()=>showToast(`${t}: coleção preparada para conexão com os arquivos oficiais.`)}><div><Icon size={23}/></div><strong>{t}</strong><span>{m}</span><ArrowRight size={15}/></button>)}</div></>
}

function WikiPage(){
  const tools=[['Diagrama de Ishikawa','Identificar causas raiz de um problema.'],['5 Porquês','Aprofundar até chegar à causa estrutural.'],['5W2H','Estruturar planos de ação.'],['Checklist','Garantir execução padronizada.'],['Matriz GUT','Priorizar problemas e ações.'],['Fluxograma','Visualizar processos e gargalos.']]
  return <><DetailHeader tag="PROCESSOS" title="Infraestrutura & Wiki" description="Fundamentos que sustentam a forma de pensar, agir e operar na PHIQ: cultura, políticas e ferramentas de gestão." icon={Building2}/><Panel className="culture-panel"><div><span className="eyebrow">POLÍTICA, CULTURA E CÓDIGOS</span><h3>Uma rede alinhada cresce com consistência.</h3><p>Diretrizes institucionais, cultura PHIQUERS e materiais que orientam decisões e comportamento.</p></div><div className="culture-tags"><span>Política</span><span>Cultura PHIQUERS</span><span>Diretrizes</span></div></Panel><div className="wiki-grid">{tools.map(([t,d],i)=><Accordion key={t} title={t} icon={[Waypoints,CircleHelp,ClipboardCheck,CheckCircle2,Target,Network][i]}><p>{d}</p><div className="tool-example"><strong>Exemplo PHIQ</strong><span>{i===0?'Resultado microbiológico fora do padrão após limpeza.':i===1?'Por que houve contaminação? Repetir o “por quê” até chegar à causa.':i===2?'What, Why, Where, When, Who, How e How much para uma ação corretiva.':i===3?'Produto correto? Diluição correta? Tempo de contato respeitado?':i===4?'Avaliar Gravidade, Urgência e Tendência para priorizar ações.':'Preparação → Diluição → Aplicação → Tempo de contato → Enxágue → Verificação.'}</span></div></Accordion>)}</div></>
}

function JourneyPage({onAchievement}){
  const progress=useCountUp(58)
  return <section className="screen"><Breadcrumb>Onboarding & Jornada</Breadcrumb><div className="journey-head"><div className="journey-title"><h1>Onboarding & Jornada</h1><p>Uma trilha completa para o desenvolvimento da sua franquia, com conteúdos, missões e conquistas que levam da implementação à excelência.</p></div><div className="journey-banner journey-small"><Image src="/journey-banner.jpg" fill alt="Jornada PHIQ" sizes="480px"/></div></div><StageRail/><div className="journey-cards"><Panel className="journey-progress-card"><span className="eyebrow">SEU PROGRESSO NA JORNADA</span><div className="journey-progress-body"><ProgressRing value={progress}/><div className="progress-copy"><div className="stage-badge"><GraduationCap size={18}/></div><span>Você está na etapa</span><strong>Formação</strong><p>Hora de fortalecer conhecimentos sobre produtos, processos e gestão comercial.</p><PrimaryButton ghost>Ver minha jornada <ArrowRight size={14}/></PrimaryButton></div></div></Panel><Panel className="next-step"><span className="eyebrow">PRÓXIMO MARCO</span><div className="target-icon"><Award size={27}/></div><h3>Concluir treinamento comercial</h3><p>Assista ao módulo e responda o quiz.</p><div className="linear-progress"><i style={{width:'70%'}}/></div><div className="progress-line"><PrimaryButton ghost>Continuar <ArrowRight size={14}/></PrimaryButton><span>70%</span></div></Panel><Panel className="level-card"><span className="eyebrow">SEU NÍVEL ATUAL</span><div className="level-row"><div className="level-medal"><Award size={34}/></div><div><strong>Nível 2</strong><span>Franqueado em Formação</span></div></div><div className="coins-earned"><Image src="/coins/boas-vindas.png" alt="Moeda PHIQ" width={54} height={54}/><div><strong>320</strong><span>moedas conquistadas</span></div></div><PrimaryButton ghost>Ver detalhes <ArrowRight size={14}/></PrimaryButton></Panel></div><AchievementStrip onSelect={onAchievement}/><div className="journey-understand"><div className="home-section-title compact"><div><Pill>ENTENDA SUA JORNADA</Pill><h2>Regras claras para cada etapa</h2><p>O dashboard mostra onde você está. Esta área explica como avançar.</p></div></div><div className="journey-info-grid">{JOURNEY_INFO.map((x,i)=><Accordion key={x.title} title={x.title} icon={x.icon} defaultOpen={i===0}><p>{x.content}</p>{i===1&&<div className="mini-deliverables"><span>Formação técnica</span><span>Produtos</span><span>Comercial</span><span>Cultura PHIQ</span></div>}{i===6&&<div className="criteria-grid">{['Formação concluída','Participação ativa','Aderência aos padrões','Evolução comercial','Registros atualizados','Validação do CS'].map(c=><div key={c}><Check size={14}/>{c}</div>)}</div>}</Accordion>)}</div></div></section>
}

function StageRail(){return <div className="stage-rail"><div className="stage-line"><i/></div>{STAGES.map((s,i)=><div className={`stage-step ${s.state}`} key={s.title}><div className="stage-node"><s.icon size={20}/></div><strong>{s.title}</strong><span>{s.subtitle}</span></div>)}</div>}

function FranchisePage({onUnit}){
  const [filter,setFilter]=useState('')
  const list=UNITS.filter(u=>(u.city+u.uf+u.stage).toLowerCase().includes(filter.toLowerCase()))
  return <section className="screen"><Breadcrumb>Nossos Franqueados</Breadcrumb><div className="section-intro"><Pill>REDE PHIQ</Pill><h1>Uma rede conectada e <span>em evolução.</span></h1><p>Veja onde estão as unidades, acompanhe a etapa e conheça os franqueados que fazem parte da PHIQ.</p></div><div className="franchise-grid"><Panel className="map-panel"><div className="section-row"><div><h3>Franqueados pelo Brasil</h3><p>Mapa da rede PHIQ</p></div><Pill>{UNITS.length} unidades ativas</Pill></div><div className="brazil-map-real"><BrazilMap onUnit={onUnit}/></div></Panel><Panel className="units-panel"><div className="section-row"><div><h3>Unidades</h3><p>Etapa e evolução da rede</p></div></div><label className="unit-search"><Search size={15}/><input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Buscar unidade..."/></label><div className="unit-list">{list.map(u=><button className="unit-row" key={u.id} onClick={()=>onUnit(u)}><span className="uf">{u.uf}</span><span><strong>{u.city}</strong><small>{u.responsible}</small></span><span className="unit-progress"><i><b style={{width:`${u.progress}%`}}/></i><em>{u.progress}%</em></span><Pill tone={u.stage==='Excelência'?'gold':'soft'}>{u.stage}</Pill></button>)}</div></Panel></div><div className="network-insights"><Panel><Network size={19}/><div><span>Progresso médio da rede</span><strong>64%</strong></div></Panel><Panel><GraduationCap size={19}/><div><span>Unidades em formação</span><strong>1</strong></div></Panel><Panel><Settings size={19}/><div><span>Unidades em operação</span><strong>2</strong></div></Panel><Panel><Trophy size={19}/><div><span>Em excelência</span><strong>1</strong></div></Panel></div></section>
}

function BrazilMap({small=false,onUnit}){
  return <svg viewBox="0 0 520 540" className={`brazil-svg ${small?'small':''}`} role="img" aria-label="Mapa estilizado do Brasil com unidades PHIQ"><defs><linearGradient id="brFill" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#dff1ee"/><stop offset="1" stopColor="#b8ddd7"/></linearGradient><filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="12" stdDeviation="12" floodColor="#145f5c" floodOpacity=".08"/></filter></defs><path className="brazil-shape" filter="url(#softShadow)" d="M193 34 L252 50 L288 77 L333 91 L362 120 L408 135 L430 170 L420 205 L447 236 L433 270 L409 291 L401 331 L369 351 L356 388 L324 412 L301 455 L267 485 L245 518 L215 493 L198 459 L174 436 L166 402 L145 375 L139 336 L107 311 L88 276 L96 245 L76 211 L91 179 L111 156 L113 119 L151 102 L161 71 Z" fill="url(#brFill)" stroke="#7dbbb5" strokeWidth="2"/>{UNITS.map(u=><g className="svg-pin" key={u.id} transform={`translate(${u.x} ${u.y})`} onClick={()=>onUnit?.(u)} role="button"><circle r="17" className="pin-halo"/><circle r="7" className="pin-dot"/><text x="15" y="4">{u.uf}</text><title>{u.city} · {u.stage} · {u.progress}%</title></g>)}<text x="255" y="285" className="br-label">BR</text></svg>
}

function CommsPage({showToast}){
  const [cat,setCat]=useState('Todos')
  const cats=['Todos','Comercial','Técnico','Treinamento','Podcast','Institucional']
  const filtered=cat==='Todos'?COMMUNICATIONS:COMMUNICATIONS.filter(c=>c.category===cat)
  return <section className="screen"><Breadcrumb>Comunicados Oficiais</Breadcrumb><div className="section-intro"><Pill>COMUNICAÇÃO OFICIAL</Pill><h1>Fique por dentro do que <span>move a rede.</span></h1><p>Comunicados, atualizações, campanhas, Jornal PHIQ, podcast e conteúdos compartilhados pela franqueadora.</p></div><div className="comms-feature-grid"><Panel className="featured-comm"><span className="eyebrow">DESTAQUE</span><Pill tone="gold">NOVO</Pill><h2>Treinamento técnico da rede — próxima edição</h2><p>Confira a agenda, os temas e os materiais de preparação para o próximo encontro.</p><PrimaryButton onClick={()=>showToast('Comunicado de destaque aberto em modo demonstração.')}>Abrir comunicado <ArrowRight size={14}/></PrimaryButton></Panel><Panel className="podcast-feature"><div className="podcast-art"><span>PHIQ PODCAST</span><h3>Conhecimento para quem faz a rede acontecer.</h3><button onClick={()=>showToast('Player de podcast preparado para integração com os episódios reais.')}><Play size={15}/> Ouvir agora</button><div className="podcast-rings"/></div></Panel></div><div className="comms-toolbar"><div className="filter-tabs">{cats.map(c=><button className={cat===c?'active':''} key={c} onClick={()=>setCat(c)}>{c}</button>)}</div><button className="archive-link">Ver arquivo <ArrowRight size={14}/></button></div><Panel className="feed-panel"><div className="section-row"><div><h3>Últimos comunicados</h3><p>Atualizações publicadas pela franqueadora</p></div></div>{filtered.map(c=>{const Icon=c.icon;return <button className="feed-item" key={c.title} onClick={()=>showToast(`${c.title}: abertura do conteúdo preparada.`)}><div className="feed-icon"><Icon size={18}/></div><div><strong>{c.title}</strong><p>{c.body}</p><span className="comm-category">{c.category}</span></div><time>{c.date}</time><ChevronRight size={15}/></button>})}</Panel><div className="media-hub"><Panel><div className="section-row"><div><span className="eyebrow">JORNAL PHIQ</span><h3>Últimas edições</h3></div><Newspaper size={20}/></div><div className="journal-grid">{['Setembro 2026','Agosto 2026','Julho 2026'].map((x,i)=><button key={x}><span>EDIÇÃO {9-i}</span><strong>{x}</strong><small>Abrir jornal <ArrowRight size={12}/></small></button>)}</div></Panel><Panel><div className="section-row"><div><span className="eyebrow">VÍDEOS & PODCAST</span><h3>Conteúdo multimídia</h3></div><Video size={20}/></div><div className="media-grid">{['Podcast CDQ — episódio recente','Treinamento técnico','Atualização comercial'].map((x,i)=><button key={x} onClick={()=>showToast('Mídia preparada para incorporar o conteúdo oficial do Notion.')}><div className="media-thumb"><Play size={20}/></div><strong>{x}</strong><span>{i===0?'Podcast':'Vídeo'}</span></button>)}</div></Panel></div></section>
}

function AchievementModal({item,onClose}){
  return <div className="modal-scrim" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><div className="modal-card achievement-modal"><button className="modal-close" onClick={onClose}><X size={18}/></button><div className={`modal-coin ${item.unlocked?'':'locked'}`}><Image src={item.img} alt={item.title} width={180} height={180}/>{!item.unlocked&&<div><Lock size={25}/></div>}<span/></div><Pill tone={item.unlocked?'gold':'soft'}>{item.unlocked?'CONQUISTA DESBLOQUEADA':'CONQUISTA BLOQUEADA'}</Pill><h2>{item.title}</h2><p>{item.unlocked?item.desc:'Conclua os critérios anteriores para desbloquear esta conquista.'}</p><div className="modal-meta"><div><span>Data</span><strong>{item.date}</strong></div><div><span>Recompensa</span><strong>+{item.points} moedas</strong></div></div>{!item.unlocked&&<div className="unlock-hint"><Lock size={15}/>Complete sua etapa atual para avançar.</div>}</div></div>
}

function UnitModal({unit,onClose}){
  return <div className="modal-scrim" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><div className="modal-card unit-modal"><button className="modal-close" onClick={onClose}><X size={18}/></button><div className="unit-modal-head"><span className="uf big">{unit.uf}</span><div><Pill>UNIDADE PHIQ</Pill><h2>PHIQ {unit.uf} — {unit.city}</h2><p>{unit.responsible}</p></div></div><div className="unit-modal-stats"><div><span>Jornada</span><strong>{unit.progress}%</strong><i><b style={{width:`${unit.progress}%`}}/></i></div><div><span>Nível</span><strong>{unit.level}</strong></div><div><span>Etapa</span><strong>{unit.stage}</strong></div></div><div className="unit-modal-section"><h3>Conquistas</h3><div className="unit-coins">{ACHIEVEMENTS.slice(0,5).map((a,i)=><Image key={a.title} src={a.img} alt={a.title} width={62} height={62} className={i<Math.ceil(unit.progress/20)?'':'muted'}/>)}</div></div><div className="unit-modal-section"><h3>Últimos marcos</h3><div className="milestone-list"><span><CheckCircle2 size={15}/>Treinamento institucional concluído</span><span><CheckCircle2 size={15}/>Cadastro e primeiros passos validados</span><span><CircleDot size={15}/>Próximo marco: evolução comercial</span></div></div><PrimaryButton>Ver perfil completo <ArrowRight size={14}/></PrimaryButton></div></div>
}
