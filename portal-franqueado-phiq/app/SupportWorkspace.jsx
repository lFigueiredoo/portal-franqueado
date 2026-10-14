'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, ArrowRight, CheckCircle2, ChevronRight, CircleHelp, Paperclip, Send } from 'lucide-react'
import { ticketsService } from '../services/tickets/service'

const categories = [['operational','Operacional'],['commercial','Comercial'],['administrative','Administrativo']]
const statuses = [['open','Aberto'],['in_progress','Em andamento'],['waiting_customer','Aguardando franqueado'],['resolved','Resolvido'],['closed','Fechado']]

export default function SupportWorkspace({ tab, setTab, session }) {
  const [units,setUnits] = useState([])
  const [unitId,setUnitId] = useState('')
  const [tickets,setTickets] = useState([])
  const [selected,setSelected] = useState(null)
  const [messages,setMessages] = useState([])
  const [attachments,setAttachments] = useState([])
  const [category,setCategory] = useState('operational')
  const [subject,setSubject] = useState('')
  const [description,setDescription] = useState('')
  const [attachment,setAttachment] = useState(null)
  const [message,setMessage] = useState('')
  const [filter,setFilter] = useState('all')
  const [busy,setBusy] = useState(false)
  const [error,setError] = useState('')
  const [success,setSuccess] = useState('')

  const refresh = async () => {
    if (session.preview || !session.user || !session.profile) return;
    try {
      const history = await ticketsService.listMyTickets(session.profile.franchiseId, session.profile.role);
      setTickets(history);
    } catch (cause) { setError(cause.message) }
  }

  useEffect(() => {
    if (session.preview) return
    refresh().catch(cause => setError(cause.message))
  }, [session.preview])

  const openTicket = async ticket => {
    setSelected(ticket)
    setError('')
    try {
      const [history,files] = await Promise.all([
        ticketsService.listMessages(ticket.$id),
        Promise.resolve([])
      ])
      setMessages(history)
      setAttachments(files)
    } catch (cause) { setError(cause.message) }
  }

  const createTicket = async event => {
    event.preventDefault()
    if (!session.user || !session.profile) return
    setBusy(true); setError(''); setSuccess('')
    try {
      const ticketData = {
        category,
        subject,
        description,
        franchiseId: session.profile.franchiseId
      };

      const ticket = await ticketsService.createTicket(ticketData, session.user.$id, session.profile);

      let note = `Chamado ${ticket.protocol} registrado.`
      if (attachment) {
        try {
          await ticketsService.uploadAttachment(ticket.$id, attachment, session.user.$id);
        } catch (cause) {
          note += ` O chamado foi salvo, mas o anexo falhou: ${cause.message}`
        }
      }

      setSuccess(note); setSubject(''); setDescription(''); setAttachment(null)
      await refresh()
    } catch (cause) { setError(cause.message) }
    finally { setBusy(false) }
  }

  const sendMessage = async event => {
    event.preventDefault()
    if (!selected || !session.user || !message.trim()) return
    setBusy(true); setError('')
    try {
      await ticketsService.addMessage(selected.$id, session.user.$id, message)
      setMessage('')
      setMessages(await ticketsService.listMessages(selected.$id))
    } catch (cause) { setError(cause.message) }
    finally { setBusy(false) }
  }

  const changeStatus = async status => {
    if (!selected) return
    setBusy(true); setError('')
    try {
      const updated = await ticketsService.updateStatus(selected.$id, status)
      setSelected(updated)
      await refresh()
    } catch (cause) { setError(cause.message) }
    finally { setBusy(false) }
  }

  const download = async file => {
    try {
      const blob = await ticketsService.downloadAttachment(file.fileId)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url; link.download = file.fileName; link.click()
      setTimeout(() => URL.revokeObjectURL(url),1000)
    } catch (cause) { setError(cause.message) }
  }

  const visible = filter === 'all' ? tickets : tickets.filter(ticket => ticket.category === filter)

  return <section className="screen"><div className="breadcrumb"><span>Suporte & Customer Success</span></div><div className="section-intro"><span className="pill pill-teal">NAF · CUSTOMER SUCCESS</span><h1>Suporte organizado, <span>histórico preservado.</span></h1><p>Abra solicitações, acompanhe o status e converse com a equipe responsável.</p></div>
    {session.preview && <article className="panel support-setup"><AlertCircle size={22}/><div><h3>Conexão pendente</h3><p>Configure o projeto Supabase exclusivo do Portal para ativar login, chamados e anexos. Nenhuma solicitação é simulada ou armazenada localmente.</p></div></article>}
    {!session.preview && <><div className="support-tabs">{[['novo','Abrir chamado'],['chamados','Meus chamados'],['faq','FAQ']].map(([id,label]) => <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>{label}</button>)}</div>
      {error && <div className="support-alert" role="alert">{error}</div>}{success && <div className="support-success" role="status"><CheckCircle2 size={17}/>{success}</div>}
      {tab === 'novo' && <article className="panel ticket-panel"><div className="ticket-intro"><span className="eyebrow">NOVA SOLICITAÇÃO</span><h3>Como podemos ajudar?</h3><p>O chamado será salvo no portal e visível à equipe autorizada para sua unidade.</p></div><form className="ticket-form" onSubmit={createTicket}><label><span>Unidade</span><span className="read-only-input">{session.profile?.franchiseName || 'Carregando...'}</span></label><label><span>Tipo de suporte</span><select value={category} onChange={event => setCategory(event.target.value)}>{categories.map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="wide"><span>Assunto</span><input required minLength={3} maxLength={160} value={subject} onChange={event => setSubject(event.target.value)}/></label><label className="wide"><span>Descrição</span><textarea required minLength={10} rows="5" value={description} onChange={event => setDescription(event.target.value)}/></label><label className="attachment wide"><Paperclip size={17}/><span>{attachment?.name || 'Selecionar anexo (até 10 MB)'}</span><input type="file" onChange={event => setAttachment(event.target.files?.[0] || null)}/></label><div className="ticket-actions wide"><small>O anexo será guardado em bucket privado.</small><button className="primary-btn" type="submit" disabled={busy || !session.profile}>{busy?'Salvando…':'Enviar solicitação'} <Send size={14}/></button></div></form></article>}
      {tab === 'chamados' && <article className="panel tickets-list"><div className="section-row"><div><h3>Meus chamados</h3><p>Histórico persistido no Portal</p></div><label className="ticket-filter">Categoria <select value={filter} onChange={event => setFilter(event.target.value)}><option value="all">Todas</option>{categories.map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label></div>{visible.length ? visible.map(ticket => <button className="ticket-row" key={ticket.$id} onClick={() => openTicket(ticket)}><span className="ticket-id">{ticket.protocol}</span><span><strong>{ticket.subject}</strong><small>{categories.find(([value]) => value === ticket.category)?.[1]}</small></span><span className="pill pill-gold">{statuses.find(([value]) => value === ticket.status)?.[1] || ticket.status}</span><time>{new Date(ticket.createdAt).toLocaleDateString('pt-BR')}</time><ChevronRight size={15}/></button>) : <div className="ticket-empty">Nenhum chamado encontrado.</div>}</article>}
      {tab === 'faq' && <div className="faq-list">{[['Como solicitar suporte?', 'Abra um chamado, selecione sua unidade, escolha a categoria e descreva o contexto.'],['Quem pode ver meu chamado?', 'Você, os membros autorizados da sua unidade, o NAF atribuído e administradores.'],['Onde acompanho a resposta?', 'Em Meus chamados, abra o protocolo para ver o histórico e enviar mensagens.']].map(([question,answer]) => <details className="panel content-accordion" key={question}><summary><span className="accordion-icon"><CircleHelp size={17}/></span><strong>{question}</strong><ChevronRight size={16}/></summary><div className="accordion-content"><p>{answer}</p></div></details>)}</div>}
      {selected && <div className="modal-scrim" onMouseDown={event => { if (event.target === event.currentTarget) setSelected(null) }}><div className="modal-card ticket-detail" role="dialog" aria-modal="true" aria-label={`Chamado ${selected.protocol}`}><button className="modal-close" onClick={() => setSelected(null)} aria-label="Fechar">×</button><span className="eyebrow">{selected.protocol}</span><h2>{selected.subject}</h2><p>{selected.description}</p><p><strong>Status:</strong> {statuses.find(([value]) => value === selected.status)?.[1] || selected.status}</p>{session.profile?.role !== 'FRANQUEADO' && <label className="ticket-filter">Atualizar status <select value={selected.status} disabled={busy} onChange={event => changeStatus(event.target.value)}>{statuses.map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>}<h3>Mensagens</h3><div className="ticket-messages">{messages.length ? messages.map(item => <p key={item.$id}><small>{new Date(item.createdAt).toLocaleString('pt-BR')}</small><br/>{item.message}</p>) : <p>Nenhuma mensagem ainda.</p>}</div><form className="ticket-reply" onSubmit={sendMessage}><textarea value={message} onChange={event => setMessage(event.target.value)} placeholder="Escreva uma resposta" required/><button className="primary-btn" disabled={busy} type="submit">Responder <ArrowRight size={14}/></button></form>{attachments.length > 0 && <><h3>Anexos</h3>{attachments.map(file => <button className="ticket-file" key={file.$id} onClick={() => download(file)}>{file.fileName}</button>)}</>}</div></div>}
    </>}
  </section>
}
