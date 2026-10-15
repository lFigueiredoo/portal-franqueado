'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle, Archive, ArrowDownUp, CheckCircle2, Clock3, Filter, MessageSquare,
  Paperclip, Search, Send, SlidersHorizontal, Sparkles, UserRound, X
} from 'lucide-react'
import { useNafSession } from '../NafShell'

const statuses = [['open', 'Aberto'], ['in_progress', 'Em andamento'], ['waiting_customer', 'Aguardando resposta'], ['resolved', 'Resolvido'], ['closed', 'Fechado']]
const categories = [['operational', 'Operacional'], ['commercial', 'Comercial'], ['administrative', 'Administrativo']]
const priorities = [['urgent', 'Urgente'], ['high', 'Alta'], ['normal', 'Normal'], ['low', 'Baixa']]

const ticketValue = (ticket, key, fallback = '') => ticket?.[key] ?? ticket?.[{ createdAt: 'created_at', updatedAt: 'updated_at', createdBy: 'created_by', franchiseId: 'franchise_id' }[key]] ?? fallback
const statusLabel = status => statuses.find(([value]) => value === status)?.[1] || status
const categoryLabel = category => categories.find(([value]) => value === category)?.[1] || category
const priorityLabel = priority => priorities.find(([value]) => value === priority)?.[1] || priority
const dateLabel = value => value ? new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '') : '—'

function StatCard({ icon: Icon, label, value, tone }) {
  return <div className={`naf-stat-card ${tone}`}><div className="naf-stat-icon"><Icon size={18}/></div><div><span>{label}</span><strong>{value}</strong></div></div>
}

export default function NafTickets() {
  const session = useNafSession()
  const [tickets, setTickets] = useState([])
  const [selected, setSelected] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [reply, setReply] = useState('')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [category, setCategory] = useState('')
  const [priority, setPriority] = useState('')

  const loadTickets = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/tickets', { cache: 'no-store', credentials: 'same-origin' })
      if (!response.ok) throw new Error(response.status === 403 ? 'Você não possui acesso à fila de atendimento.' : 'Não foi possível carregar os chamados.')
      setTickets(await response.json())
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível carregar os chamados.') }
    finally { setLoading(false) }
  }

  useEffect(() => { loadTickets() }, [])

  const filteredTickets = useMemo(() => tickets.filter(ticket => {
    const text = `${ticket.protocol || ''} ${ticket.subject || ''} ${ticket.description || ''} ${ticketValue(ticket, 'franchiseId')}`.toLowerCase()
    return (!query || text.includes(query.toLowerCase())) && (!status || ticket.status === status) && (!category || ticket.category === category) && (!priority || ticket.priority === priority)
  }), [tickets, query, status, category, priority])

  const counts = useMemo(() => ({
    open: tickets.filter(ticket => ticket.status === 'open').length,
    progress: tickets.filter(ticket => ticket.status === 'in_progress').length,
    waiting: tickets.filter(ticket => ticket.status === 'waiting_customer').length,
    done: tickets.filter(ticket => ['resolved', 'closed'].includes(ticket.status)).length,
  }), [tickets])

  const openTicket = async ticket => {
    setSelected(ticket)
    setDetailLoading(true)
    setError('')
    try {
      const response = await fetch(`/api/tickets/messages?ticketId=${encodeURIComponent(ticket.$id)}`, { cache: 'no-store', credentials: 'same-origin' })
      if (!response.ok) throw new Error('Não foi possível carregar o histórico deste chamado.')
      setMessages(await response.json())
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível carregar o histórico.') }
    finally { setDetailLoading(false) }
  }

  const updateStatus = async nextStatus => {
    if (!selected) return
    setBusy(true)
    try {
      const response = await fetch('/api/tickets/status', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ ticketId: selected.$id, status: nextStatus }) })
      if (!response.ok) throw new Error('Não foi possível atualizar o status.')
      const updated = await response.json()
      setSelected(updated)
      setTickets(current => current.map(ticket => ticket.$id === updated.$id ? updated : ticket))
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível atualizar o status.') }
    finally { setBusy(false) }
  }

  const sendReply = async event => {
    event.preventDefault()
    if (!selected || !reply.trim()) return
    setBusy(true)
    try {
      const response = await fetch('/api/tickets/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ ticketId: selected.$id, message: reply.trim() }) })
      if (!response.ok) throw new Error('Não foi possível enviar a resposta.')
      setReply('')
      await openTicket(selected)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível enviar a resposta.') }
    finally { setBusy(false) }
  }

  return <div className="naf-screen">
    <div className="naf-breadcrumb"><span>Gestão NAF</span><span>/</span><strong>Chamados</strong></div>
    <div className="naf-heading"><div><div className="naf-eyebrow"><Sparkles size={13}/> Atendimento da rede</div><h1>Central de Atendimento</h1><p>Gerencie os chamados das franquias, acompanhe solicitações e centralize a comunicação com a rede.</p></div><button className="naf-refresh-btn" onClick={loadTickets}><ArrowDownUp size={16}/> Atualizar fila</button></div>
    <div className="naf-stats"><StatCard icon={MessageSquare} label="Chamados abertos" value={counts.open} tone="teal"/><StatCard icon={Clock3} label="Em andamento" value={counts.progress} tone="blue"/><StatCard icon={AlertCircle} label="Aguardando resposta" value={counts.waiting} tone="orange"/><StatCard icon={CheckCircle2} label="Concluídos" value={counts.done} tone="green"/></div>
    {error && <div className="naf-alert"><AlertCircle size={17}/><span>{error}</span><button onClick={() => setError('')} aria-label="Fechar"><X size={15}/></button></div>}
    <div className="naf-toolbar"><div className="naf-search"><Search size={17}/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar por protocolo, assunto ou franquia" /></div><div className="naf-filter-group"><select value={status} onChange={event => setStatus(event.target.value)}><option value="">Todos os status</option>{statuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><select value={category} onChange={event => setCategory(event.target.value)}><option value="">Todos os tipos</option>{categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><select value={priority} onChange={event => setPriority(event.target.value)}><option value="">Prioridades</option>{priorities.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div><button className="naf-filter-button"><SlidersHorizontal size={16}/> Filtros</button></div>
    <div className={`naf-workspace-grid ${selected ? 'has-detail' : ''}`}>
      <section className="naf-queue panel"><div className="naf-panel-heading"><div><span className="naf-panel-kicker">Fila de atendimento</span><h2>{filteredTickets.length} chamados <small>de {tickets.length}</small></h2></div><Filter size={17}/></div>
        {loading ? <div className="naf-skeleton-list">{[1, 2, 3, 4].map(item => <div className="naf-skeleton" key={item}/>)}</div> : filteredTickets.length ? <div className="naf-ticket-list">{filteredTickets.map(ticket => <button className={`naf-ticket-row ${selected?.$id === ticket.$id ? 'selected' : ''}`} key={ticket.$id} onClick={() => openTicket(ticket)}><div className={`naf-ticket-status-dot ${ticket.status}`}/><div className="naf-ticket-row-main"><div className="naf-ticket-row-top"><span>{ticket.protocol || 'Sem protocolo'}</span><time>{dateLabel(ticketValue(ticket, 'updatedAt') || ticketValue(ticket, 'createdAt'))}</time></div><strong>{ticket.subject || 'Chamado sem assunto'}</strong><p>{ticket.description || 'Sem descrição registrada.'}</p><div className="naf-ticket-tags"><span className={`naf-status ${ticket.status}`}>{statusLabel(ticket.status)}</span><span>{categoryLabel(ticket.category)}</span><span>{priorityLabel(ticket.priority)}</span></div></div></button>)}</div> : <div className="naf-empty"><div className="naf-empty-icon">{tickets.length ? <Search size={23}/> : <Archive size={23}/>}</div><h3>{tickets.length ? 'Nenhum resultado encontrado' : 'A fila está vazia'}</h3><p>{tickets.length ? 'Ajuste os filtros ou tente outra busca.' : 'Novos chamados das franquias aparecerão aqui quando forem registrados.'}</p>{tickets.length > 0 && <button className="naf-link-button" onClick={() => { setQuery(''); setStatus(''); setCategory(''); setPriority('') }}>Limpar filtros</button>}</div>}
      </section>
      {selected && <aside className="naf-detail panel"><div className="naf-detail-head"><div><span className="naf-panel-kicker">Detalhes do chamado</span><h2>{selected.subject}</h2><span className="naf-protocol">#{selected.protocol || selected.$id}</span></div><button className="naf-close-detail" onClick={() => setSelected(null)} aria-label="Fechar detalhes"><X size={18}/></button></div><div className="naf-detail-meta"><div><span>Categoria</span><strong>{categoryLabel(selected.category)}</strong></div><div><span>Prioridade</span><strong>{priorityLabel(selected.priority)}</strong></div><div><span>Atualizado</span><strong>{dateLabel(ticketValue(selected, 'updatedAt'))}</strong></div></div><div className="naf-status-select"><label>Status do atendimento<select value={selected.status} disabled={busy} onChange={event => updateStatus(event.target.value)}>{statuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div><div className="naf-description"><span>Solicitação original</span><p>{selected.description || 'Sem descrição registrada.'}</p></div><div className="naf-history"><div className="naf-history-title"><span>Histórico de mensagens</span><small>{messages.length} registros</small></div>{detailLoading ? <div className="naf-detail-loading">Carregando histórico...</div> : messages.length ? messages.map(message => <div className="naf-message" key={message.$id}><div className="naf-message-avatar"><UserRound size={14}/></div><div><div className="naf-message-top"><strong>{message.authorId === session?.userId ? 'Você' : 'Franquia'}</strong><time>{dateLabel(message.createdAt)}</time></div><p>{message.message || message.body}</p></div></div>) : <div className="naf-detail-empty"><MessageSquare size={18}/> Nenhuma mensagem neste chamado.</div>}</div><form className="naf-reply" onSubmit={sendReply}><textarea value={reply} onChange={event => setReply(event.target.value)} placeholder="Escreva uma resposta para a franquia..." rows={3}/><div><span><Paperclip size={14}/> Resposta visível para a franquia</span><button className="primary-btn" disabled={busy || !reply.trim()}>{busy ? 'Enviando...' : 'Enviar resposta'} <Send size={15}/></button></div></form></aside>}
    </div>
  </div>
}
