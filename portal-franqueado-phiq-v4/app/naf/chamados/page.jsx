'use client'

import { useEffect, useState } from 'react'
import { ChevronRight, Filter, Search, User, CheckCircle2, MessageSquare } from 'lucide-react'
import { ticketsService } from '@/services/tickets/service'

const categories = [['operational','Operacional'],['commercial','Comercial'],['administrative','Administrativo']]
const statuses = [['open','Aberto'],['in_progress','Em andamento'],['waiting_customer','Aguardando franqueado'],['resolved','Resolvido'],['closed','Fechado']]

export default function NafTickets() {
  const [tickets, setTickets] = useState([])
  const [selected, setSelected] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [reply, setReply] = useState('')

  // Mock session for NAF since we are in a protected route
  const session = {
    user: { $id: 'naf_user_id' },
    profile: { role: 'NAF', franchiseId: 'all' }
  }

  useEffect(() => {
    loadTickets()
  }, [])

  const loadTickets = async () => {
    setLoading(true)
    try {
      const data = await ticketsService.listMyTickets('all', 'NAF')
      setTickets(data)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  const openTicket = async ticket => {
    setSelected(ticket)
    setError('')
    try {
      const history = await ticketsService.listMessages(ticket.$id)
      setMessages(history)
    } catch (e) { setError(e.message) }
  }

  const sendReply = async e => {
    e.preventDefault()
    if (!reply.trim()) return
    setBusy(true)
    try {
      await ticketsService.addMessage(selected.$id, session.user.$id, reply)
      setReply('')
      setMessages(await ticketsService.listMessages(selected.$id))
    } catch (e) { setError(e.message) }
    finally { setBusy(false) }
  }

  const updateStatus = async status => {
    setBusy(true)
    try {
      const updated = await ticketsService.updateStatus(selected.$id, status)
      setSelected(updated)
      await loadTickets()
    } catch (e) { setError(e.message) }
    finally { setBusy(false) }
  }

  return (
    <section className="screen">
      <div className="breadcrumb"><span>Gestão NAF · Chamados</span></div>
      <div className="section-intro">
        <h1>Painel de Atendimento, <span>Suporte Técnico.</span></h1>
        <p>Gerencie as solicitações das franquias e coordene as respostas.</p>
      </div>

      {loading ? <div className="loading-state">Carregando chamados...</div> : (
        <div className="naf-container">
          <div className="naf-list-panel">
            <div className="panel-header">
              <h3>Fila de Atendimento</h3>
              <div className="naf-filters">
                <Search size={16}/>
                <input type="text" placeholder="Buscar protocolo ou assunto..." />
              </div>
            </div>
            <div className="naf-tickets-grid">
              {tickets.length ? tickets.map(t => (
                <button key={t.$id} className={`naf-ticket-card ${selected?.$id === t.$id ? 'active' : ''}`} onClick={() => openTicket(t)}>
                  <div className="ticket-meta">
                    <span className="protocol">{t.protocol}</span>
                    <span className="status-pill">{t.status}</span>
                  </div>
                  <div className="ticket-main">
                    <strong>{t.subject}</strong>
                    <p>{t.description.substring(0, 60)}...</p>
                  </div>
                  <div className="ticket-footer">
                    <span className="user-id">{t.createdBy}</span>
                    <time>{new Date(t.createdAt).toLocaleDateString()}</time>
                  </div>
                </button>
              )) : <div className="empty-state">Nenhum chamado pendente.</div>}
            </div>
          </div>

          {selected && (
            <div className="naf-detail-panel">
              <div className="detail-header">
                <div>
                  <h2>{selected.subject}</h2>
                  <p className="protocol-label">Protocolo: {selected.protocol}</p>
                </div>
                <div className="status-actions">
                  <select value={selected.status} onChange={e => updateStatus(e.target.value)}>
                    {statuses.map(([val, lab]) => <option key={val} value={val}>{lab}</option>)}
                  </select>
                </div>
              </div>

              <div className="chat-area">
                {messages.map(m => (
                  <div key={m.$id} className={`msg-bubble ${m.authorId === session.user.$id ? 'naf' : 'client'}`}>
                    <div className="msg-content">
                      <p>{m.message}</p>
                      <small>{new Date(m.createdAt).toLocaleString()}</small>
                    </div>
                  </div>
                ))}
              </div>

              <form className="chat-input" onSubmit={sendReply}>
                <textarea value={reply} onChange={e => setReply(e.target.value)} placeholder="Resposta do NAF..." required />
                <button type="submit" className="primary-btn" disabled={busy}><Send size={16}/></button>
              </form>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
