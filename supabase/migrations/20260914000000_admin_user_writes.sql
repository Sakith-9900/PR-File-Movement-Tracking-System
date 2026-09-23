-- Restrictive policies also constrain any existing permissive write policies.
create or replace function public.can_manage_users()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.users
    where id = (select auth.uid()) and role = 'leader' and is_active = true
  );
$$;
revoke all on function public.can_manage_users() from public;
grant execute on function public.can_manage_users() to authenticated, anon;
alter table public.users enable row level security;
create policy users_admin_insert_guard on public.users as restrictive
for insert to anon, authenticated with check (public.can_manage_users());
create policy users_admin_update_guard on public.users as restrictive
for update to anon, authenticated using (public.can_manage_users()) with check (public.can_manage_users());
create policy users_admin_delete_guard on public.users as restrictive
for delete to anon, authenticated using (public.can_manage_users());