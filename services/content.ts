import { portalClient } from './supabase'
import type { KnowledgeArticle, KnowledgeCategory, Product, Announcement, PortalEvent } from '../types/portal'

export const contentRepository = {
  async categories(): Promise<KnowledgeCategory[]> {
    const { data, error } = await portalClient().from('knowledge_categories').select('*').eq('status','published').order('sort_order')
    if (error) throw error
    return data as KnowledgeCategory[]
  },
  async articles(categoryId?: string): Promise<KnowledgeArticle[]> {
    let query = portalClient().from('knowledge_articles').select('*').eq('status','published').order('sort_order')
    if (categoryId) query = query.eq('category_id',categoryId)
    const { data, error } = await query
    if (error) throw error
    return data as KnowledgeArticle[]
  },
  async products(): Promise<Product[]> {
    const { data, error } = await portalClient().from('products').select('*').eq('status','published').order('sort_order')
    if (error) throw error
    return data as Product[]
  },
  async announcements(): Promise<Announcement[]> {
    const { data, error } = await portalClient().from('announcements').select('*').eq('status','published').order('published_at',{ascending:false})
    if (error) throw error
    return data as Announcement[]
  },
  async events(): Promise<PortalEvent[]> {
    const { data, error } = await portalClient().from('events').select('*').eq('status','published').gte('starts_at',new Date().toISOString()).order('starts_at')
    if (error) throw error
    return data as PortalEvent[]
  },
  async downloadDocument(bucket: 'portal-content' | 'portal-evidence', path: string): Promise<Blob> {
    const { data, error } = await portalClient().storage.from(bucket).download(path)
    if (error) throw error
    return data
  },
}
