-- Retire legacy training-oriented records and remove their enum values.
begin;

alter type workspace_type rename to workspace_type_legacy;
create type workspace_type as enum ('team','enterprise');
alter table workspaces
  alter column type type workspace_type
  using (
    case type::text
      when 'enterprise' then 'enterprise'
      else 'team'
    end
  )::workspace_type;
drop type workspace_type_legacy;

alter type project_type rename to project_type_legacy;
create type project_type as enum ('enterprise_poc','internal_innovation');
alter table projects
  alter column type type project_type
  using (
    case type::text
      when 'enterprise_poc' then 'enterprise_poc'
      else 'internal_innovation'
    end
  )::project_type;
drop type project_type_legacy;

commit;
