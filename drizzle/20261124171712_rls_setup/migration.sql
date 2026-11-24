-- role
do $$
begin
  if not exists (select from pg_roles where rolname = 'app_user') then
    create role app_user nologin;
  end if;
end $$;

do $$ begin
  execute format('grant app_user to %I', current_user);
exception when others then null;
end $$;

grant usage on schema public to app_user;
alter default privileges in schema public
  grant select, insert, update, delete on tables to app_user;
alter default privileges in schema public
  grant usage, select on sequences to app_user;

-- helper functions (only if you keep them; see below)
set check_function_bodies = off;
-- create or replace function app_owns_location(...) ...