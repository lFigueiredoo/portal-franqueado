export type UUID = string
export type PortalRole = 'admin' | 'naf' | 'franchisee'
export type ContentStatus = 'draft' | 'published' | 'archived'
export type ProgressStatus = 'not_started' | 'in_progress' | 'pending_validation' | 'completed'
export type TicketCategory = 'operational' | 'commercial' | 'administrative'
export type TicketStatus = 'open' | 'in_progress' | 'waiting_customer' | 'resolved' | 'closed'
export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent'

export interface Profile { id: UUID; full_name: string; email: string | null; role: PortalRole; active: boolean }
export interface FranchiseUnit { id: UUID; code: string; name: string; city: string | null; state_code: string | null; status: 'active' | 'inactive' }
export interface FranchiseMember { unit_id: UUID; user_id: UUID; is_primary: boolean }
export interface NafAssignment { unit_id: UUID; naf_user_id: UUID }
export interface KnowledgeCategory { id: UUID; parent_id: UUID | null; slug: string; title: string; description: string | null; sort_order: number; status: ContentStatus }
export interface ContentBlock { type: 'paragraph' | 'heading' | 'list' | 'quote' | 'embed'; text?: string; items?: string[]; url?: string }
export interface KnowledgeArticle { id: UUID; category_id: UUID; slug: string; title: string; summary: string | null; blocks: ContentBlock[]; tags: string[]; links: { label: string; url: string }[]; sort_order: number; status: ContentStatus }
export interface KnowledgeAttachment { id: UUID; article_id: UUID; title: string; kind: 'document' | 'video' | 'link' | 'image'; storage_path: string | null; external_url: string | null }
export interface Product { id: UUID; sku: string | null; name: string; product_type: string | null; segment: string | null; application: string | null; dilution_guidance: string | null; description: string | null; tags: string[]; status: ContentStatus }
export interface ProductDocument { id: UUID; product_id: UUID; title: string; document_type: string; storage_path: string | null; external_url: string | null }
export interface JourneyStage { id: UUID; code: string; title: string; description: string | null; sort_order: number; active: boolean }
export interface JourneyRequirement { id: UUID; stage_id: UUID; code: string; title: string; description: string | null; kind: 'activity' | 'training' | 'milestone' | 'evidence'; training_module_id: UUID | null; weight: number; requires_validation: boolean; sort_order: number; active: boolean }
export interface FranchiseProgress { id: UUID; unit_id: UUID; requirement_id: UUID; status: ProgressStatus; evidence_path: string | null; notes: string | null; submitted_by: UUID | null; validated_by: UUID | null; completed_at: string | null }
export interface ProgressHistory { id: number; progress_id: UUID; unit_id: UUID; old_status: ProgressStatus | null; new_status: ProgressStatus; changed_by: UUID | null; changed_at: string }
export interface TrainingModule { id: UUID; title: string; description: string | null; article_id: UUID | null; content: ContentBlock[]; status: ContentStatus }
export interface TrainingProgress { id: UUID; unit_id: UUID; user_id: UUID; module_id: UUID; status: ProgressStatus; score: number | null; completed_at: string | null }
export interface Achievement { id: UUID; code: string; title: string; description: string | null; image_path: string | null; criteria: { requirement_code?: string; [key: string]: unknown }; reward_coins: number; grant_mode: 'manual' | 'automatic'; status: ContentStatus }
export interface FranchiseAchievement { id: UUID; unit_id: UUID; achievement_id: UUID; granted_by: UUID | null; granted_at: string }
export interface CoinTransaction { id: UUID; unit_id: UUID; amount: number; reason: string; achievement_grant_id: UUID | null; created_at: string }
export interface Announcement { id: UUID; title: string; summary: string | null; body: ContentBlock[]; category: string | null; status: ContentStatus; published_at: string | null }
export interface PortalEvent { id: UUID; title: string; description: string | null; starts_at: string; ends_at: string | null; location: string | null; meeting_url: string | null; status: ContentStatus }
export interface SupportTicket { id: UUID; protocol: string; unit_id: UUID; requester_id: UUID; category: TicketCategory; subject: string; description: string; priority: TicketPriority; status: TicketStatus; assignee_id: UUID | null; created_at: string; updated_at: string; resolved_at: string | null }
export interface SupportTicketMessage { id: UUID; ticket_id: UUID; author_id: UUID; body: string; internal_note: boolean; created_at: string }
export interface SupportTicketAttachment { id: UUID; ticket_id: UUID; message_id: UUID | null; uploaded_by: UUID; file_name: string; storage_path: string; mime_type: string | null; size_bytes: number | null; created_at: string }
export interface Notification { id: UUID; user_id: UUID; title: string; body: string | null; kind: string; target_path: string | null; read_at: string | null; created_at: string }
export interface AuditLog { id: number; table_name: string; record_id: string; action: string; actor_id: UUID | null; old_data: Record<string, unknown> | null; new_data: Record<string, unknown> | null; created_at: string }
export interface JourneySummary { unit_id: UUID; requirement_count: number; completed_count: number; percent_complete: number }
export interface CoinBalance { unit_id: UUID; balance: number }
