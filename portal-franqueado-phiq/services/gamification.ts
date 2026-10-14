import { portalClient } from './supabase'
import type { Achievement, FranchiseAchievement, CoinBalance, CoinTransaction } from '../types/portal'

export const gamificationRepository = {
  async achievements(): Promise<Achievement[]> {
    const { data, error } = await portalClient().from('achievements').select('*').eq('status','published').order('sort_order')
    if (error) throw error
    return data as Achievement[]
  },
  async unitRewards(unitId: string): Promise<{grants: FranchiseAchievement[]; transactions: CoinTransaction[]; balance: number}> {
    const client = portalClient()
    const [grants,transactions,balance] = await Promise.all([
      client.from('franchise_achievements').select('*').eq('unit_id',unitId),
      client.from('coin_transactions').select('*').eq('unit_id',unitId).order('created_at',{ascending:false}),
      client.from('franchise_coin_balances').select('*').eq('unit_id',unitId).maybeSingle(),
    ])
    for (const result of [grants,transactions,balance]) if (result.error) throw result.error
    return {grants:grants.data as FranchiseAchievement[], transactions:transactions.data as CoinTransaction[], balance:(balance.data as CoinBalance | null)?.balance ?? 0}
  },
  async grant(unitId: string, achievementId: string, grantedBy: string) {
    const { data, error } = await portalClient().from('franchise_achievements').insert({unit_id:unitId,achievement_id:achievementId,granted_by:grantedBy}).select().single()
    if (error) throw error
    return data as FranchiseAchievement
  },
}
