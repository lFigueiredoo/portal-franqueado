-- Portal do Franqueado PHIQ. Apply only to a dedicated Supabase project.
create extension if not exists pgcrypto;
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create type public.portal_role as enum ('admin','naf','franchisee');
create type public.content_status as enum ('draft','published','archived');
create type public.progress_status as enum ('not_started','in_progress','pending_validation','completed');
create type public.ticket_category as enum ('operational','commercial','administrative');
create type public.ticket_status as enum ('open','in_progress','waiting_customer','resolved','closed');
create type public.ticket_priority as enum ('low','normal','high','urgent');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role public.portal_role not null default 'franchisee',
  email text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.franchise_units (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  city text,
  state_code char(2),
  status text not null default 'active' check (status in ('active','inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.franchise_members (
  unit_id uuid not null references public.franchise_units(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  is_primary boolean not null default false,
  joined_at timestamptz not null default now(),
  primary key (unit_id,user_id)
);
create table public.naf_assignments (
  unit_id uuid not null references public.franchise_units(id) on delete cascade,
  naf_user_id uuid not null references public.profiles(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  primary key (unit_id,naf_user_id)
);

create table public.knowledge_categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.knowledge_categories(id),
  slug text not null unique,
  title text not null,
  description text,
  sort_order int not null default 0,
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.knowledge_articles (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.knowledge_categories(id),
  slug text not null unique,
  title text not null,
  summary text,
  blocks jsonb not null default '[]'::jsonb check (jsonb_typeof(blocks) = 'array'),
  tags text[] not null default '{}',
  links jsonb not null default '[]'::jsonb check (jsonb_typeof(links) = 'array'),
  sort_order int not null default 0,
  status public.content_status not null default 'draft',
  published_at timestamptz,
  author_id uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.knowledge_attachments (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.knowledge_articles(id) on delete cascade,
  title text not null,
  kind text not null check (kind in ('document','video','link','image')),
  storage_path text,
  external_url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  check ((storage_path is not null) <> (external_url is not null))
);
create table public.products (
  id uuid primary key default gen_random_uuid(),
  sku text unique,
  name text not null,
  product_type text,
  segment text,
  application text,
  dilution_guidance text,
  description text,
  tags text[] not null default '{}',
  status public.content_status not null default 'draft',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.product_documents (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  title text not null,
  document_type text not null,
  storage_path text,
  external_url text,
  created_at timestamptz not null default now(),
  check ((storage_path is not null) <> (external_url is not null))
);

create table public.journey_stages (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null,
  description text,
  sort_order int not null unique,
  active boolean not null default true
);
create table public.training_modules (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  article_id uuid references public.knowledge_articles(id),
  content jsonb not null default '[]'::jsonb check (jsonb_typeof(content) = 'array'),
  status public.content_status not null default 'draft',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.journey_requirements (
  id uuid primary key default gen_random_uuid(),
  stage_id uuid not null references public.journey_stages(id),
  code text not null unique,
  title text not null,
  description text,
  kind text not null check (kind in ('activity','training','milestone','evidence')),
  training_module_id uuid references public.training_modules(id),
  weight numeric(8,2) not null default 1 check (weight > 0),
  requires_validation boolean not null default false,
  sort_order int not null default 0,
  active boolean not null default true
);
create table public.franchise_progress (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.franchise_units(id) on delete cascade,
  requirement_id uuid not null references public.journey_requirements(id),
  status public.progress_status not null default 'not_started',
  evidence_path text,
  notes text,
  submitted_by uuid references public.profiles(id),
  submitted_at timestamptz,
  validated_by uuid references public.profiles(id),
  validated_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique(unit_id,requirement_id)
);
create table public.progress_history (
  id bigint generated always as identity primary key,
  progress_id uuid not null references public.franchise_progress(id) on delete cascade,
  unit_id uuid not null references public.franchise_units(id),
  old_status public.progress_status,
  new_status public.progress_status not null,
  changed_by uuid references public.profiles(id),
  changed_at timestamptz not null default now(),
  note text
);
create table public.training_progress (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.franchise_units(id) on delete cascade,
  user_id uuid not null references public.profiles(id),
  module_id uuid not null references public.training_modules(id),
  status public.progress_status not null default 'not_started',
  score numeric(5,2) check (score between 0 and 100),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique(unit_id,user_id,module_id)
);

create table public.achievements (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null,
  description text,
  image_path text,
  criteria jsonb not null default '{}'::jsonb check (jsonb_typeof(criteria) = 'object'),
  reward_coins int not null default 0 check (reward_coins >= 0),
  grant_mode text not null default 'manual' check (grant_mode in ('manual','automatic')),
  status public.content_status not null default 'draft',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create table public.franchise_achievements (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.franchise_units(id) on delete cascade,
  achievement_id uuid not null references public.achievements(id),
  granted_by uuid references public.profiles(id),
  granted_at timestamptz not null default now(),
  evidence jsonb not null default '{}'::jsonb,
  unique(unit_id,achievement_id)
);
create table public.coin_transactions (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.franchise_units(id) on delete cascade,
  amount int not null check (amount <> 0),
  reason text not null,
  achievement_grant_id uuid unique references public.franchise_achievements(id),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text,
  body jsonb not null default '[]'::jsonb check (jsonb_typeof(body) = 'array'),
  category text,
  status public.content_status not null default 'draft',
  published_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  location text,
  meeting_url text,
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or ends_at >= starts_at)
);

create sequence public.support_protocol_seq start 1000;
create table public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  protocol text not null unique default ('PHIQ-' || lpad(nextval('public.support_protocol_seq')::text,6,'0')),
  unit_id uuid not null references public.franchise_units(id),
  requester_id uuid not null references public.profiles(id),
  category public.ticket_category not null,
  subject text not null check (length(trim(subject)) between 3 and 160),
  description text not null check (length(trim(description)) >= 10),
  priority public.ticket_priority not null default 'normal',
  status public.ticket_status not null default 'open',
  assignee_id uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);
create table public.support_ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  author_id uuid not null references public.profiles(id),
  body text not null check (length(trim(body)) >= 1),
  internal_note boolean not null default false,
  created_at timestamptz not null default now()
);
create table public.support_ticket_attachments (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  message_id uuid references public.support_ticket_messages(id) on delete cascade,
  uploaded_by uuid not null references public.profiles(id),
  file_name text not null,
  storage_path text not null unique,
  mime_type text,
  size_bytes bigint check (size_bytes >= 0),
  created_at timestamptz not null default now()
);
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text,
  kind text not null,
  target_path text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create table public.audit_logs (
  id bigint generated always as identity primary key,
  table_name text not null,
  record_id text not null,
  action text not null,
  actor_id uuid,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

create index on public.franchise_members(user_id,unit_id);
create index on public.naf_assignments(naf_user_id,unit_id);
create index on public.knowledge_articles(category_id,status,sort_order);
create index on public.products(status,sort_order);
create index on public.journey_requirements(stage_id,sort_order) where active;
create index on public.franchise_progress(unit_id,status);
create index on public.progress_history(unit_id,changed_at desc);
create index on public.training_progress(unit_id,module_id);
create index on public.franchise_achievements(unit_id,granted_at desc);
create index on public.coin_transactions(unit_id,created_at desc);
create index on public.announcements(status,published_at desc);
create index on public.events(status,starts_at);
create index on public.support_tickets(unit_id,created_at desc);
create index on public.support_tickets(assignee_id,status);
create index on public.support_ticket_messages(ticket_id,created_at);
create index on public.support_ticket_attachments(ticket_id);
create index on public.notifications(user_id,read_at,created_at desc);
create index on public.audit_logs(table_name,record_id,created_at desc);

insert into public.journey_stages(code,title,sort_order) values
 ('enlistment','Alistamento',1),('formation','Formação',2),('operation','Operação',3),
 ('autonomy','Autonomia',4),('excellence','Excelência',5);
