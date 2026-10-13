import { portalClient } from './supabase'
import type { Notification } from '../types/portal'

export const notificationRepository = {
  async list(userId: string): Promise<Notification[]> {
    const { data, error } = await portalClient().from('notifications').select('*').eq('user_id',userId).order('created_at',{ascending:false}).limit(50)
    if (error) throw error
    return data as Notification[]
  },
  async markRead(notificationId: string): Promise<void> {
    const { error } = await portalClient().from('notifications').update({read_at:new Date().toISOString()}).eq('id',notificationId)
    if (error) throw error
  },
}
