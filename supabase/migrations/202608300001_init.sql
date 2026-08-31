-- FDE Portal MVP schema. Apply with `supabase db reset` or paste into SQL editor.
create extension if not exists pgcrypto;

create type workspace_type as enum ('course','team','enterprise');
create type member_role as enum ('admin','project_lead','fde','business_reviewer');
create type project_type as enum ('course_training','enterprise_poc','internal_innovation');
create type stage_status as enum ('not_started','in_progress','at_risk','in_review','passed','failed');
create type review_status as enum ('pending','approved','changes_requested','conditionally_approved');

create table user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id)
);
create table workspaces (
  id uuid primary key default gen_random_uuid(), name text not null, type workspace_type not null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid not null references auth.users(id)
);
create table workspace_members (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade, role member_role not null, status text not null default 'active',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id), unique(workspace_id,user_id)
);
create table projects (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null, type project_type not null, industry text, organization text, goal text not null, owner_id uuid references auth.users(id), business_owner_id uuid references auth.users(id),
  current_stage text not null default 'P0', status text not null default 'active', start_date date, end_date date,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid not null references auth.users(id)
);
create table project_members (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references workspaces(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade, user_id uuid not null references auth.users(id) on delete cascade, role member_role not null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id), unique(project_id,user_id)
);
create table scenario_cards (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references workspaces(id) on delete cascade, project_id uuid not null references projects(id) on delete cascade,
  name text not null, department text, business_owner text, users_text text, frequency text, current_state jsonb not null default '{}', target_state jsonb not null default '{}', enterprise_context jsonb not null default '{}', agent_design jsonb not null default '{}', eval_acceptance jsonb not null default '{}', version integer not null default 1, status text not null default 'draft',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid not null references auth.users(id), unique(project_id)
);
create table scenario_card_versions (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references workspaces(id) on delete cascade, scenario_card_id uuid not null references scenario_cards(id) on delete cascade,
  version integer not null, snapshot jsonb not null, change_note text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid not null references auth.users(id), unique(scenario_card_id,version)
);
create table poc_stages (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references workspaces(id) on delete cascade, project_id uuid not null references projects(id) on delete cascade,
  code text not null check (code in ('P0','P1','P2','P3','P4','P5')), name text not null, objective text, entry_conditions jsonb not null default '[]', deliverables jsonb not null default '[]', owner_id uuid references auth.users(id), due_date date, status stage_status not null default 'not_started', review_conclusion text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid not null references auth.users(id), unique(project_id,code)
);
create table acceptance_criteria (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references workspaces(id) on delete cascade, project_id uuid not null references projects(id) on delete cascade, stage_id uuid not null references poc_stages(id) on delete cascade,
  title text not null, target_value text, required boolean not null default true, passed boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid not null references auth.users(id)
);
create table eval_suites (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references workspaces(id) on delete cascade, project_id uuid not null references projects(id) on delete cascade, scenario_card_id uuid references scenario_cards(id) on delete set null,
  name text not null, version text not null, description text, target_threshold numeric(5,2) not null, status text not null default 'draft',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid not null references auth.users(id)
);
create table eval_cases (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references workspaces(id) on delete cascade, eval_suite_id uuid not null references eval_suites(id) on delete cascade,
  input jsonb not null, expected_result jsonb not null, case_type text not null, dimensions jsonb not null default '[]', severity text not null, tags text[] not null default '{}', data_source text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid not null references auth.users(id)
);
create table eval_runs (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references workspaces(id) on delete cascade, eval_suite_id uuid not null references eval_suites(id) on delete cascade,
  tested_version text not null, model text not null, prompt_version text, skill_version text, tool_version text, total_cost numeric(12,4), average_latency_ms integer, started_at timestamptz, completed_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid not null references auth.users(id)
);
create table eval_results (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references workspaces(id) on delete cascade, eval_run_id uuid not null references eval_runs(id) on delete cascade, eval_case_id uuid not null references eval_cases(id) on delete cascade,
  rule_score numeric(5,2), ai_score numeric(5,2), human_score numeric(5,2), passed boolean not null, failure_type text, severity text, review_note text, in_regression_set boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid not null references auth.users(id), unique(eval_run_id,eval_case_id)
);
create table assets (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references workspaces(id) on delete cascade, project_id uuid references projects(id) on delete set null,
  name text not null, type text not null, current_version text not null, owner_id uuid references auth.users(id), use_case text, io_description text, external_url text, required_permission text, status text, latest_eval_score numeric(5,2), reusable boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid not null references auth.users(id)
);
create table evidence (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references workspaces(id) on delete cascade, project_id uuid not null references projects(id) on delete cascade, criterion_id uuid references acceptance_criteria(id) on delete cascade,
  title text not null, storage_path text, external_url text, checksum text, valid boolean not null default true, metadata jsonb not null default '{}',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid not null references auth.users(id)
);
create table risks (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references workspaces(id) on delete cascade, project_id uuid not null references projects(id) on delete cascade, stage_id uuid references poc_stages(id) on delete set null,
  title text not null, description text, level text not null, status text not null default 'open', owner_id uuid references auth.users(id), mitigation text, closed_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid not null references auth.users(id)
);
create table reviews (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references workspaces(id) on delete cascade, project_id uuid not null references projects(id) on delete cascade,
  type text not null, subject_type text not null, subject_id uuid not null, submitter_id uuid not null references auth.users(id), reviewer_id uuid references auth.users(id), submitted_version text, score numeric(5,2), comment text, requested_changes text, status review_status not null default 'pending', reviewed_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid not null references auth.users(id)
);
create table reports (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references workspaces(id) on delete cascade, project_id uuid not null references projects(id) on delete cascade,
  type text not null, version integer not null, title text not null, content jsonb not null, status text not null default 'draft', confirmed_by uuid references auth.users(id), confirmed_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid not null references auth.users(id), unique(project_id,type,version)
);
create table audit_logs (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references workspaces(id) on delete cascade, actor_id uuid references auth.users(id), action text not null, entity_type text not null, entity_id uuid, before_data jsonb, after_data jsonb, ip inet,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id)
);

create index projects_workspace_idx on projects(workspace_id,updated_at desc);
create index eval_cases_suite_idx on eval_cases(eval_suite_id,case_type,severity);
create index eval_results_run_idx on eval_results(eval_run_id,passed,severity);
create index evidence_criterion_idx on evidence(criterion_id) where valid;
create index risks_project_open_idx on risks(project_id,level) where status <> 'closed';
create index audit_workspace_created_idx on audit_logs(workspace_id,created_at desc);

create or replace function set_updated_at() returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end $$;
do $$ declare t text; begin foreach t in array array['user_profiles','workspaces','workspace_members','projects','project_members','scenario_cards','scenario_card_versions','poc_stages','acceptance_criteria','eval_suites','eval_cases','eval_runs','eval_results','assets','evidence','risks','reviews','reports','audit_logs'] loop execute format('create trigger %I_updated before update on %I for each row execute function set_updated_at()',t,t); end loop; end $$;

create or replace function is_workspace_member(target uuid) returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from workspace_members where workspace_id=target and user_id=auth.uid() and status='active') $$;
create or replace function has_workspace_role(target uuid, allowed member_role[]) returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from workspace_members where workspace_id=target and user_id=auth.uid() and role=any(allowed) and status='active') $$;

create or replace function write_audit_log() returns trigger language plpgsql security definer set search_path=public as $$
declare row_workspace uuid; row_id uuid;
begin
  row_workspace := case when tg_op='DELETE' then old.workspace_id else new.workspace_id end;
  row_id := case when tg_op='DELETE' then old.id else new.id end;
  insert into audit_logs(workspace_id,actor_id,action,entity_type,entity_id,before_data,after_data,created_by)
  values(row_workspace,auth.uid(),lower(tg_op),tg_table_name,row_id,case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) end,case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) end,auth.uid());
  if tg_op='DELETE' then return old; else return new; end if;
end $$;
do $$ declare t text; begin foreach t in array array['projects','scenario_cards','poc_stages','acceptance_criteria','eval_suites','eval_cases','eval_runs','eval_results','assets','evidence','risks','reviews','reports'] loop execute format('create trigger %I_audit after insert or update or delete on %I for each row execute function write_audit_log()',t,t); end loop; end $$;

alter table user_profiles enable row level security;
create policy profile_self_read on user_profiles for select using (id=auth.uid());
create policy profile_self_update on user_profiles for update using (id=auth.uid());
alter table workspaces enable row level security;
create policy workspace_member_read on workspaces for select using (is_workspace_member(id));
create policy workspace_create on workspaces for insert with check (created_by=auth.uid());
create policy workspace_admin_update on workspaces for update using (has_workspace_role(id,array['admin']::member_role[]));

do $$ declare t text; begin
  foreach t in array array['workspace_members','projects','project_members','scenario_cards','scenario_card_versions','poc_stages','acceptance_criteria','eval_suites','eval_cases','eval_runs','eval_results','assets','evidence','risks','reviews','reports','audit_logs'] loop
    execute format('alter table %I enable row level security',t);
    execute format('create policy %I_member_read on %I for select using (is_workspace_member(workspace_id))',t,t);
    execute format('create policy %I_team_write on %I for all using (has_workspace_role(workspace_id,array[''admin'',''project_lead'',''fde'']::member_role[])) with check (has_workspace_role(workspace_id,array[''admin'',''project_lead'',''fde'']::member_role[]))',t,t);
  end loop;
end $$;

-- Business reviewers can score reviews and confirm reports within their workspace.
create policy reviews_business_update on reviews for update using (has_workspace_role(workspace_id,array['business_reviewer']::member_role[]));
create policy reports_business_update on reports for update using (has_workspace_role(workspace_id,array['business_reviewer']::member_role[]));

insert into storage.buckets (id,name,public) values ('evidence','evidence',false) on conflict (id) do nothing;
create policy evidence_storage_read on storage.objects for select using (bucket_id='evidence' and is_workspace_member((storage.foldername(name))[1]::uuid));
create policy evidence_storage_write on storage.objects for insert with check (bucket_id='evidence' and has_workspace_role((storage.foldername(name))[1]::uuid,array['admin','project_lead','fde']::member_role[]));
