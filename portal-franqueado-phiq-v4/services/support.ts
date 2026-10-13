import { portalClient } from './supabase'
import type { SupportTicket, SupportTicketMessage, SupportTicketAttachment, TicketCategory, TicketPriority, TicketStatus } from '../types/portal'

export interface NewTicket { unitId: string; requesterId: string; category: TicketCategory; subject: string; description: string; priority?: TicketPriority }

export const supportRepository = {
  async listTickets(unitId?: string): Promise<SupportTicket[]> {
    let query = portalClient().from('support_tickets').select('*').order('created_at',{ascending:false})
    if (unitId) query = query.eq('unit_id',unitId)
    const { data, error } = await query
    if (error) throw error
    return data as SupportTicket[]
  },
  async createTicket(input: NewTicket): Promise<SupportTicket> {
    const { data, error } = await portalClient().from('support_tickets').insert({
      unit_id:input.unitId, requester_id:input.requesterId, category:input.category,
      subject:input.subject.trim(), description:input.description.trim(), priority:input.priority || 'normal',
    }).select().single()
    if (error) throw error
    return data as SupportTicket
  },
  async messages(ticketId: string): Promise<SupportTicketMessage[]> {
    const { data, error } = await portalClient().from('support_ticket_messages').select('*').eq('ticket_id',ticketId).order('created_at')
    if (error) throw error
    return data as SupportTicketMessage[]
  },
  async addMessage(ticketId: string, authorId: string, body: string, internalNote = false): Promise<SupportTicketMessage> {
    const { data, error } = await portalClient().from('support_ticket_messages').insert({ticket_id:ticketId,author_id:authorId,body:body.trim(),internal_note:internalNote}).select().single()
    if (error) throw error
    return data as SupportTicketMessage
  },
  async setStatus(ticketId: string, status: TicketStatus, assigneeId?: string): Promise<SupportTicket> {
    const { data, error } = await portalClient().from('support_tickets').update({
      status, assignee_id:assigneeId || null, resolved_at:status === 'resolved' ? new Date().toISOString() : null,
    }).eq('id',ticketId).select().single()
    if (error) throw error
    return data as SupportTicket
  },
  async uploadAttachment(ticketId: string, userId: string, file: File): Promise<SupportTicketAttachment> {
    if (file.size > 10 * 1024 * 1024) throw new Error('O anexo deve ter no máximo 10 MB.')
    const safeName = file.name.normalize('NFKD').replace(/[^a-zA-Z0-9._-]/g,'_').slice(-100)
    const path = `${ticketId}/${crypto.randomUUID()}-${safeName}`
    const client = portalClient()
    const uploaded = await client.storage.from('portal-support').upload(path,file,{upsert:false,contentType:file.type || 'application/octet-stream'})
    if (uploaded.error) throw uploaded.error
    const { data, error } = await client.from('support_ticket_attachments').insert({
      ticket_id:ticketId, uploaded_by:userId, file_name:file.name, storage_path:path,
      mime_type:file.type || null, size_bytes:file.size,
    }).select().single()
    if (error) throw error
    return data as SupportTicketAttachment
  },
  async attachments(ticketId: string): Promise<SupportTicketAttachment[]> {
    const { data, error } = await portalClient().from('support_ticket_attachments').select('*').eq('ticket_id',ticketId)
    if (error) throw error
    return data as SupportTicketAttachment[]
  },
  async downloadAttachment(path: string): Promise<Blob> {
    const { data, error } = await portalClient().storage.from('portal-support').download(path)
    if (error) throw error
    return data
  },
}
