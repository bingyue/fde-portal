-- FDE delivery operating system: outcomes, field discovery, experiments and operations.
begin;

create table outcome_contracts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  sponsor_name text,
  metric_name text not null,
  baseline_value text not null,
  target_value text not null,
  unit text,
  annual_value numeric(14,2) not null default 0 check (annual_value >= 0),
  annual_cost numeric(14,2) not null default 0 check (annual_cost >= 0),
  value_formula text not null,
  success_condition text not null,
  stop_condition text not null,
  risk_level text not null default 'medium' check (risk_level in ('low','medium','high')),
  status text not null default 'draft' check (status in ('draft','confirmed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id),
  unique (project_id)
);

create table stakeholders (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  role text not null,
  decision_level text not null check (decision_level in ('strategic','operational','execution')),
  stance text not null default 'neutral' check (stance in ('supporter','neutral','blocker')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id)
);

create table workflow_steps (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  step_order integer not null check (step_order > 0),
  name text not null,
  owner_name text,
  execution_mode text not null check (execution_mode in ('human','ai_suggests','human_confirms','automatic')),
  system_name text,
  observable_outcome text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id),
  unique (project_id, step_order)
);

create table hypotheses (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  title text not null,
  evidence_dimension text not null check (evidence_dimension in ('technical','business','adoption')),
  uncertainty text not null check (uncertainty in ('low','medium','high')),
  experiment text not null,
  threshold text not null,
  owner_name text,
  evidence text,
  status text not null default 'unverified' check (status in ('unverified','testing','validated','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id)
);

create table operating_profiles (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  champion_name text,
  target_users integer not null default 0 check (target_users >= 0),
  active_users integer not null default 0 check (active_users >= 0),
  automation_level text not null default 'ai_suggests' check (automation_level in ('ai_suggests','human_confirms','exception_only','automatic')),
  availability_target text not null default '99.5%',
  task_cost_budget numeric(12,4) check (task_cost_budget is null or task_cost_budget >= 0),
  rollback_owner text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id),
  unique (project_id)
);

create table operating_checklist_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  workstream text not null check (workstream in ('adoption','production')),
  title text not null,
  owner_name text,
  completed boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id)
);

create index outcome_contracts_workspace_idx on outcome_contracts(workspace_id);
create index outcome_contracts_created_by_idx on outcome_contracts(created_by);
create index stakeholders_workspace_project_idx on stakeholders(workspace_id, project_id);
create index stakeholders_project_idx on stakeholders(project_id);
create index stakeholders_created_by_idx on stakeholders(created_by);
create index workflow_steps_workspace_project_idx on workflow_steps(workspace_id, project_id, step_order);
create index workflow_steps_project_idx on workflow_steps(project_id);
create index workflow_steps_created_by_idx on workflow_steps(created_by);
create index hypotheses_workspace_project_idx on hypotheses(workspace_id, project_id, status);
create index hypotheses_project_idx on hypotheses(project_id);
create index hypotheses_created_by_idx on hypotheses(created_by);
create index operating_profiles_workspace_idx on operating_profiles(workspace_id);
create index operating_profiles_created_by_idx on operating_profiles(created_by);
create index operating_checklist_workspace_project_idx on operating_checklist_items(workspace_id, project_id, workstream);
create index operating_checklist_project_idx on operating_checklist_items(project_id);
create index operating_checklist_created_by_idx on operating_checklist_items(created_by);

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'outcome_contracts',
    'stakeholders',
    'workflow_steps',
    'hypotheses',
    'operating_profiles',
    'operating_checklist_items'
  ] loop
    execute format(
      'create trigger %I_updated before update on %I for each row execute function set_updated_at()',
      table_name,
      table_name
    );
    execute format(
      'create trigger %I_audit after insert or update or delete on %I for each row execute function write_audit_log()',
      table_name,
      table_name
    );
    execute format('alter table %I enable row level security', table_name);
    execute format(
      'create policy %I_member_read on %I for select using (is_workspace_member(workspace_id))',
      table_name,
      table_name
    );
    execute format(
      'create policy %I_team_write on %I for all using (has_workspace_role(workspace_id,array[''admin'',''project_lead'',''fde'']::member_role[])) with check (has_workspace_role(workspace_id,array[''admin'',''project_lead'',''fde'']::member_role[]))',
      table_name,
      table_name
    );
  end loop;
end $$;

commit;
