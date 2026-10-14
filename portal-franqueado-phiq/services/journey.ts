import { portalClient } from './supabase'
import type { JourneyStage, JourneyRequirement, FranchiseProgress, JourneySummary, ProgressHistory } from '../types/portal'

export const journeyRepository = {
  async stages(): Promise<JourneyStage[]> {
    const { data, error } = await portalClient().from('journey_stages').select('*').eq('active',true).order('sort_order')
    if (error) throw error
    return data as JourneyStage[]
  },
  async requirements(): Promise<JourneyRequirement[]> {
    const { data, error } = await portalClient().from('journey_requirements').select('*').eq('active',true).order('sort_order')
    if (error) throw error
    return data as JourneyRequirement[]
  },
  async unitProgress(unitId: string): Promise<{summary: JourneySummary | null; progress: FranchiseProgress[]; history: ProgressHistory[]}> {
    const client = portalClient()
    const [summary, progress, history] = await Promise.all([
      client.from('franchise_journey_summary').select('*').eq('unit_id',unitId).maybeSingle(),
      client.from('franchise_progress').select('*').eq('unit_id',unitId),
      client.from('progress_history').select('*').eq('unit_id',unitId).order('changed_at',{ascending:false}).limit(50),
    ])
    for (const result of [summary,progress,history]) if (result.error) throw result.error
    return {summary: summary.data as JourneySummary | null, progress: progress.data as FranchiseProgress[], history: history.data as ProgressHistory[]}
  },
  async validateRequirement(unitId: string, requirementId: string, validatorId: string, notes?: string) {
    const { data, error } = await portalClient().from('franchise_progress').upsert({
      unit_id:unitId, requirement_id:requirementId, status:'completed', validated_by:validatorId,
      validated_at:new Date().toISOString(), notes:notes || null,
    },{onConflict:'unit_id,requirement_id'}).select().single()
    if (error) throw error
    return data as FranchiseProgress
  },
}
