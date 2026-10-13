-- Authorization always uses database memberships, never user-editable JWT metadata.
create function private.current_portal_role() returns public.portal_role
language sql stable security definer set search_path = '' as $$
  select p.role from public.profiles p where p.id = (select auth.uid()) and p.active
$$;
create function private.can_access_unit(p_unit uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select (select auth.uid()) is not null and coalesce((select
    private.current_portal_role() = 'admin'
    or (private.current_portal_role() = 'naf' and exists (
      select 1 from public.naf_assignments a where a.unit_id = p_unit and a.naf_user_id = (select auth.uid())
    ))
    or (private.current_portal_role() = 'franchisee' and exists (
      select 1 from public.franchise_members m where m.unit_id = p_unit and m.user_id = (select auth.uid())
    ))
  ),false)
$$;
create function private.can_manage_unit(p_unit uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select (select auth.uid()) is not null and coalesce((select
    private.current_portal_role() = 'admin'
    or (private.current_portal_role() = 'naf' and exists (
      select 1 from public.naf_assignments a where a.unit_id = p_unit and a.naf_user_id = (select auth.uid())
    ))
  ),false)
$$;
create function private.can_access_ticket(p_ticket uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.support_tickets t where t.id = p_ticket and private.can_access_unit(t.unit_id))
$$;
create function private.can_manage_ticket(p_ticket uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.support_tickets t where t.id = p_ticket and private.can_manage_unit(t.unit_id))
$$;
revoke all on all functions in schema private from public, anon;
grant execute on function private.current_portal_role() to authenticated;
grant execute on function private.can_access_unit(uuid) to authenticated;
grant execute on function private.can_manage_unit(uuid) to authenticated;
grant execute on function private.can_access_ticket(uuid) to authenticated;
grant execute on function private.can_manage_ticket(uuid) to authenticated;

do $$ declare t text; begin
  foreach t in array array[
    'profiles','franchise_units','franchise_members','naf_assignments',
    'knowledge_categories','knowledge_articles','knowledge_attachments','products','product_documents',
    'journey_stages','journey_requirements','franchise_progress','progress_history',
    'training_modules','training_progress','achievements','franchise_achievements','coin_transactions',
    'announcements','events','support_tickets','support_ticket_messages','support_ticket_attachments',
    'notifications','audit_logs'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('create policy admin_all on public.%I for all to authenticated using (private.current_portal_role() = ''admin'') with check (private.current_portal_role() = ''admin'')', t);
  end loop;
end $$;
grant usage on type public.portal_role, public.content_status, public.progress_status,
  public.ticket_category, public.ticket_status, public.ticket_priority to authenticated;
grant usage on sequence public.support_protocol_seq to authenticated;

create policy profiles_self_read on public.profiles for select to authenticated
  using (id = (select auth.uid()));
create policy profiles_naf_read on public.profiles for select to authenticated
  using (private.current_portal_role() = 'naf' and (id = (select auth.uid()) or exists (
    select 1 from public.franchise_members m join public.naf_assignments a on a.unit_id = m.unit_id
    where m.user_id = profiles.id and a.naf_user_id = (select auth.uid())
  )));
create policy units_scope_read on public.franchise_units for select to authenticated
  using (private.can_access_unit(id));
create policy members_scope_read on public.franchise_members for select to authenticated
  using (private.can_access_unit(unit_id));
create policy assignments_self_read on public.naf_assignments for select to authenticated
  using (naf_user_id = (select auth.uid()));

create policy categories_published_read on public.knowledge_categories for select to authenticated
  using (status = 'published');
create policy articles_published_read on public.knowledge_articles for select to authenticated
  using (status = 'published');
create policy knowledge_files_published_read on public.knowledge_attachments for select to authenticated
  using (exists(select 1 from public.knowledge_articles a where a.id = article_id and a.status = 'published'));
create policy products_published_read on public.products for select to authenticated
  using (status = 'published');
create policy product_files_published_read on public.product_documents for select to authenticated
  using (exists(select 1 from public.products p where p.id = product_id and p.status = 'published'));

create policy stages_read on public.journey_stages for select to authenticated using (active);
create policy requirements_read on public.journey_requirements for select to authenticated using (active);
create policy progress_scope_read on public.franchise_progress for select to authenticated
  using (private.can_access_unit(unit_id));
create policy progress_naf_insert on public.franchise_progress for insert to authenticated
  with check (private.can_manage_unit(unit_id));
create policy progress_naf_update on public.franchise_progress for update to authenticated
  using (private.can_manage_unit(unit_id)) with check (private.can_manage_unit(unit_id));
create policy progress_history_scope_read on public.progress_history for select to authenticated
  using (private.can_access_unit(unit_id));
create policy modules_published_read on public.training_modules for select to authenticated
  using (status = 'published');
create policy training_scope_read on public.training_progress for select to authenticated
  using (private.can_access_unit(unit_id));
create policy training_naf_insert on public.training_progress for insert to authenticated
  with check (private.can_manage_unit(unit_id));
create policy training_naf_update on public.training_progress for update to authenticated
  using (private.can_manage_unit(unit_id)) with check (private.can_manage_unit(unit_id));

create policy achievements_published_read on public.achievements for select to authenticated
  using (status = 'published');
create policy grants_scope_read on public.franchise_achievements for select to authenticated
  using (private.can_access_unit(unit_id));
create policy grants_naf_insert on public.franchise_achievements for insert to authenticated
  with check (private.can_manage_unit(unit_id) and granted_by = (select auth.uid()));
create policy coins_scope_read on public.coin_transactions for select to authenticated
  using (private.can_access_unit(unit_id));

create policy announcements_published_read on public.announcements for select to authenticated
  using (status = 'published' and (published_at is null or published_at <= now()));
create policy events_published_read on public.events for select to authenticated
  using (status = 'published');

create policy tickets_scope_read on public.support_tickets for select to authenticated
  using (private.can_access_unit(unit_id));
create policy tickets_requester_insert on public.support_tickets for insert to authenticated
  with check (requester_id = (select auth.uid()) and private.can_access_unit(unit_id)
    and status = 'open' and assignee_id is null and resolved_at is null);
create policy tickets_naf_update on public.support_tickets for update to authenticated
  using (private.can_manage_unit(unit_id)) with check (private.can_manage_unit(unit_id));
create policy messages_scope_read on public.support_ticket_messages for select to authenticated
  using (private.can_access_ticket(ticket_id) and (not internal_note or private.can_manage_ticket(ticket_id)));
create policy messages_scope_insert on public.support_ticket_messages for insert to authenticated
  with check (author_id = (select auth.uid()) and private.can_access_ticket(ticket_id)
    and (not internal_note or private.can_manage_ticket(ticket_id)));
create policy ticket_files_scope_read on public.support_ticket_attachments for select to authenticated
  using (private.can_access_ticket(ticket_id) and (message_id is null or exists (
    select 1 from public.support_ticket_messages m where m.id = message_id and m.ticket_id = ticket_id
  )));
create policy ticket_files_scope_insert on public.support_ticket_attachments for insert to authenticated
  with check (uploaded_by = (select auth.uid()) and private.can_access_ticket(ticket_id)
    and storage_path like ticket_id::text || '/%');
create function private.guard_ticket_attachment() returns trigger language plpgsql set search_path = '' as $$
begin
  if new.message_id is not null and not exists (
    select 1 from public.support_ticket_messages m where m.id = new.message_id and m.ticket_id = new.ticket_id
  ) then raise exception 'Attachment message must belong to the same ticket'; end if;
  return new;
end $$;
create trigger guard_ticket_attachment before insert or update on public.support_ticket_attachments
  for each row execute function private.guard_ticket_attachment();
create policy notifications_self_read on public.notifications for select to authenticated
  using (user_id = (select auth.uid()));
create policy notifications_self_update on public.notifications for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create function private.guard_ticket_update() returns trigger language plpgsql set search_path = '' as $$
begin
  if new.id <> old.id or new.protocol <> old.protocol or new.unit_id <> old.unit_id
    or new.requester_id <> old.requester_id or new.category <> old.category
    or new.subject <> old.subject or new.description <> old.description
    or new.created_at <> old.created_at then
    raise exception 'Ticket identity and original request are immutable';
  end if;
  if new.assignee_id is not null and not exists (
    select 1 from public.naf_assignments a where a.unit_id = new.unit_id and a.naf_user_id = new.assignee_id
  ) then raise exception 'Assignee must be assigned to this unit'; end if;
  return new;
end $$;
create trigger guard_ticket_update before update on public.support_tickets
  for each row execute function private.guard_ticket_update();
create function private.guard_notification_update() returns trigger language plpgsql set search_path = '' as $$
begin
  if new.id <> old.id or new.user_id <> old.user_id or new.title <> old.title
    or new.body is distinct from old.body or new.kind <> old.kind
    or new.target_path is distinct from old.target_path or new.created_at <> old.created_at then
    raise exception 'Only notification read_at may change';
  end if;
  return new;
end $$;
create trigger guard_notification_update before update on public.notifications
  for each row execute function private.guard_notification_update();

create view public.franchise_journey_summary with (security_invoker = true) as
  select u.id as unit_id, count(r.id) as requirement_count,
    count(p.id) filter (where p.status = 'completed') as completed_count,
    coalesce(round(100 * sum(r.weight) filter (where p.status = 'completed') /
      nullif(sum(r.weight),0),1),0) as percent_complete
  from public.franchise_units u cross join public.journey_requirements r
  left join public.franchise_progress p on p.unit_id = u.id and p.requirement_id = r.id
  where r.active
  group by u.id;
create view public.franchise_coin_balances with (security_invoker = true) as
  select u.id as unit_id, coalesce(sum(c.amount),0)::bigint as balance
  from public.franchise_units u left join public.coin_transactions c on c.unit_id = u.id
  group by u.id;
grant select on public.franchise_journey_summary, public.franchise_coin_balances to authenticated;

create function private.set_updated_at() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;
do $$ declare t text; begin
  foreach t in array array['profiles','franchise_units','knowledge_categories','knowledge_articles','products',
    'training_modules','franchise_progress','training_progress','announcements','events','support_tickets'] loop
    execute format('create trigger set_updated_at before update on public.%I for each row execute function private.set_updated_at()',t);
  end loop;
end $$;

create function private.record_progress_history() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' or old.status is distinct from new.status then
    insert into public.progress_history(progress_id,unit_id,old_status,new_status,changed_by,note)
    values(new.id,new.unit_id,case when tg_op = 'INSERT' then null else old.status end,new.status,(select auth.uid()),new.notes);
  end if;
  return new;
end $$;
create trigger progress_history_after_write after insert or update on public.franchise_progress
  for each row execute function private.record_progress_history();

create function private.guard_progress_write() returns trigger language plpgsql set search_path = '' as $$
declare needs_validation boolean;
begin
  if tg_op = 'UPDATE' and (new.unit_id <> old.unit_id or new.requirement_id <> old.requirement_id) then
    raise exception 'Progress identity is immutable';
  end if;
  select r.requires_validation into needs_validation from public.journey_requirements r where r.id = new.requirement_id;
  if needs_validation and new.status = 'completed' then
    if new.validated_by is distinct from (select auth.uid()) then
      raise exception 'Validated progress requires the acting NAF or admin';
    end if;
    new.validated_at := coalesce(new.validated_at,now());
  end if;
  if new.status = 'completed' then new.completed_at := coalesce(new.completed_at,now()); end if;
  return new;
end $$;
create trigger guard_progress_before_write before insert or update on public.franchise_progress
  for each row execute function private.guard_progress_write();

create function private.award_achievement_coins() returns trigger language plpgsql security definer set search_path = '' as $$
declare reward int;
begin
  select a.reward_coins into reward from public.achievements a where a.id = new.achievement_id;
  if reward > 0 then
    insert into public.coin_transactions(unit_id,amount,reason,achievement_grant_id,created_by)
    values(new.unit_id,reward,'achievement',new.id,new.granted_by)
    on conflict (achievement_grant_id) do nothing;
  end if;
  return new;
end $$;
create trigger achievement_coins_after_grant after insert on public.franchise_achievements
  for each row execute function private.award_achievement_coins();

-- Simple automatic criteria: {"requirement_code":"..."}. Complex rules remain manual.
create function private.grant_requirement_achievements() returns trigger language plpgsql security definer set search_path = '' as $$
declare requirement_code text;
begin
  if new.status <> 'completed' or (tg_op = 'UPDATE' and old.status = 'completed') then return new; end if;
  select r.code into requirement_code from public.journey_requirements r where r.id = new.requirement_id;
  insert into public.franchise_achievements(unit_id,achievement_id,granted_by,evidence)
  select new.unit_id,a.id,(select auth.uid()),jsonb_build_object('progress_id',new.id)
  from public.achievements a
  where a.status = 'published' and a.grant_mode = 'automatic'
    and a.criteria->>'requirement_code' = requirement_code
  on conflict (unit_id,achievement_id) do nothing;
  return new;
end $$;
create trigger auto_achievement_after_progress after insert or update on public.franchise_progress
  for each row execute function private.grant_requirement_achievements();

create function private.audit_change() returns trigger language plpgsql security definer set search_path = '' as $$
declare row_data jsonb;
begin
  row_data := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  insert into public.audit_logs(table_name,record_id,action,actor_id,old_data,new_data)
  values(tg_table_name,coalesce(row_data->>'id',row_data->>'unit_id',row_data->>'user_id',''),tg_op,
    (select auth.uid()),case when tg_op = 'INSERT' then null else to_jsonb(old) end,
    case when tg_op = 'DELETE' then null else to_jsonb(new) end);
  return coalesce(new,old);
end $$;
do $$ declare t text; begin
  foreach t in array array['profiles','franchise_units','franchise_members','naf_assignments','knowledge_articles',
    'products','franchise_progress','franchise_achievements','coin_transactions','support_tickets',
    'support_ticket_messages','support_ticket_attachments'] loop
    execute format('create trigger audit_change after insert or update or delete on public.%I for each row execute function private.audit_change()',t);
  end loop;
end $$;
drop policy admin_all on public.audit_logs;
create policy audit_admin_read on public.audit_logs for select to authenticated
  using (private.current_portal_role() = 'admin');
drop policy admin_all on public.progress_history;
drop policy admin_all on public.franchise_progress;
drop policy admin_all on public.support_tickets;
drop policy admin_all on public.support_ticket_messages;
drop policy admin_all on public.support_ticket_attachments;
drop policy admin_all on public.coin_transactions;
create policy coin_admin_insert on public.coin_transactions for insert to authenticated
  with check (private.current_portal_role() = 'admin');
drop policy admin_all on public.franchise_achievements;
create policy grants_admin_insert on public.franchise_achievements for insert to authenticated
  with check (private.current_portal_role() = 'admin');
revoke all on all functions in schema private from public, anon, authenticated;
grant execute on function private.current_portal_role() to authenticated;
grant execute on function private.can_access_unit(uuid) to authenticated;
grant execute on function private.can_manage_unit(uuid) to authenticated;
grant execute on function private.can_access_ticket(uuid) to authenticated;
grant execute on function private.can_manage_ticket(uuid) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit) values
  ('portal-content','portal-content',false,52428800),
  ('portal-support','portal-support',false,10485760),
  ('portal-evidence','portal-evidence',false,10485760)
on conflict (id) do nothing;

create function private.content_object_readable(p_name text) returns boolean
language plpgsql stable security definer set search_path = '' as $$
declare parts text[] := storage.foldername(p_name);
begin
  if private.current_portal_role() = 'admin' then return true; end if;
  if array_length(parts,1) < 2 or parts[2] !~ '^[0-9a-fA-F-]{36}$' then return false; end if;
  if parts[1] = 'articles' then
    return exists(select 1 from public.knowledge_articles a where a.id = parts[2]::uuid and a.status = 'published');
  elsif parts[1] = 'products' then
    return exists(select 1 from public.products p where p.id = parts[2]::uuid and p.status = 'published');
  end if;
  return false;
end $$;
create function private.ticket_object_accessible(p_name text) returns boolean
language plpgsql stable security definer set search_path = '' as $$
declare parts text[] := storage.foldername(p_name);
begin
  if array_length(parts,1) < 1 or parts[1] !~ '^[0-9a-fA-F-]{36}$' then return false; end if;
  return private.can_access_ticket(parts[1]::uuid);
end $$;
create function private.ticket_object_readable(p_name text) returns boolean
language plpgsql stable security definer set search_path = '' as $$
begin
  return exists (
    select 1 from public.support_ticket_attachments a
    left join public.support_ticket_messages m on m.id = a.message_id
    where a.storage_path = p_name and private.can_access_ticket(a.ticket_id)
      and (a.message_id is null or (m.ticket_id = a.ticket_id and (not m.internal_note or private.can_manage_ticket(a.ticket_id))))
  );
end $$;
create function private.evidence_object_accessible(p_name text) returns boolean
language plpgsql stable security definer set search_path = '' as $$
declare parts text[] := storage.foldername(p_name);
begin
  if array_length(parts,1) < 1 or parts[1] !~ '^[0-9a-fA-F-]{36}$' then return false; end if;
  return private.can_access_unit(parts[1]::uuid);
end $$;
grant execute on function private.content_object_readable(text), private.ticket_object_accessible(text),
  private.ticket_object_readable(text), private.evidence_object_accessible(text) to authenticated;

create policy portal_content_read on storage.objects for select to authenticated
  using (bucket_id = 'portal-content' and private.content_object_readable(name));
create policy portal_content_admin_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'portal-content' and private.current_portal_role() = 'admin');
create policy portal_content_admin_update on storage.objects for update to authenticated
  using (bucket_id = 'portal-content' and private.current_portal_role() = 'admin')
  with check (bucket_id = 'portal-content' and private.current_portal_role() = 'admin');
create policy portal_content_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'portal-content' and private.current_portal_role() = 'admin');

create policy portal_support_read on storage.objects for select to authenticated
  using (bucket_id = 'portal-support' and private.ticket_object_readable(name));
create policy portal_support_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'portal-support' and private.ticket_object_accessible(name));
create policy portal_support_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'portal-support' and private.current_portal_role() = 'admin');

create policy portal_evidence_read on storage.objects for select to authenticated
  using (bucket_id = 'portal-evidence' and private.evidence_object_accessible(name));
create policy portal_evidence_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'portal-evidence' and private.evidence_object_accessible(name));
create policy portal_evidence_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'portal-evidence' and private.current_portal_role() = 'admin');
