import { portalClient } from './supabase'
import type { FranchiseUnit } from '../types/portal'

export const networkRepository = {
  async accessibleUnits(): Promise<FranchiseUnit[]> {
    const { data, error } = await portalClient().from('franchise_units').select('*').eq('status','active').order('name')
    if (error) throw error
    return data as FranchiseUnit[]
  },
  async myUnitIds(userId: string): Promise<string[]> {
    const { data, error } = await portalClient().from('franchise_members').select('unit_id').eq('user_id',userId)
    if (error) throw error
    return data.map(row => row.unit_id as string)
  },
}
