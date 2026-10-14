import { portalClient } from './supabase'
import type { PortalRole, TicketStatus } from '../types/portal'

export const adminRepository = {
  async inviteUser(input: {email:string;fullName:string;role:PortalRole;unitIds?:string[]}) {
    const { data, error } = await portalClient().functions.invoke('invite-portal-user',{body:input})
    if (error) throw error
    return data as {id:string;email:string}
  },
  async listProfiles() {
    const { data, error } = await portalClient().from('profiles').select('id,full_name,email,role,active').order('full_name')
    if (error) throw error
    return data
  },
  async setProfileRole(userId:string, role:PortalRole) {
    const { error } = await portalClient().from('profiles').update({role}).eq('id',userId)
    if (error) throw error
  },
  async setProfileActive(userId:string, active:boolean) {
    const { error } = await portalClient().from('profiles').update({active}).eq('id',userId)
    if (error) throw error
  },
  async upsertUnit(unit:{id?:string;code:string;name:string;city?:string;state_code?:string}) {
    const { data, error } = await portalClient().from('franchise_units').upsert(unit).select().single()
    if (error) throw error
    return data
  },
  async assignNaf(unitId:string, userId:string) {
    const { error } = await portalClient().from('naf_assignments').upsert({unit_id:unitId,naf_user_id:userId})
    if (error) throw error
  },
  async addMember(unitId:string, userId:string, isPrimary=false) {
    const { error } = await portalClient().from('franchise_members').upsert({unit_id:unitId,user_id:userId,is_primary:isPrimary})
    if (error) throw error
  },
  async saveCategory(input:{id?:string;slug:string;title:string;description?:string;status:'draft'|'published'|'archived';sort_order?:number}) {
    const { data, error } = await portalClient().from('knowledge_categories').upsert(input).select().single()
    if (error) throw error
    return data
  },
  async saveArticle(input:{id?:string;category_id:string;slug:string;title:string;summary?:string;blocks:unknown[];tags?:string[];status:'draft'|'published'|'archived'}) {
    const { data, error } = await portalClient().from('knowledge_articles').upsert(input).select().single()
    if (error) throw error
    return data
  },
  async saveProduct(input:{id?:string;sku?:string;name:string;description?:string;product_type?:string;segment?:string;application?:string;dilution_guidance?:string;status:'draft'|'published'|'archived'}) {
    const { data, error } = await portalClient().from('products').upsert(input).select().single()
    if (error) throw error
    return data
  },
  async saveAnnouncement(input:{id?:string;title:string;summary?:string;body:unknown[];category?:string;status:'draft'|'published'|'archived';published_at?:string}) {
    const { data, error } = await portalClient().from('announcements').upsert(input).select().single()
    if (error) throw error
    return data
  },
  async saveEvent(input:{id?:string;title:string;description?:string;starts_at:string;ends_at?:string;location?:string;meeting_url?:string;status:'draft'|'published'|'archived'}) {
    const { data, error } = await portalClient().from('events').upsert(input).select().single()
    if (error) throw error
    return data
  },
  async setTicketStatus(ticketId:string,status:TicketStatus,assigneeId?:string) {
    const { data, error } = await portalClient().from('support_tickets').update({status,assignee_id:assigneeId || null}).eq('id',ticketId).select().single()
    if (error) throw error
    return data
  },
}
