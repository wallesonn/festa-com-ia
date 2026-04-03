-- Migration: festa_com_ia_professionals_rls_policies
-- Criada em: 2026-04-06

alter table if exists public."festa-com-ia-professionals" enable row level security;

drop policy if exists "professionals_select_own" on public."festa-com-ia-professionals";
drop policy if exists "professionals_insert_own" on public."festa-com-ia-professionals";
drop policy if exists "professionals_update_own" on public."festa-com-ia-professionals";

create policy "professionals_select_own"
on public."festa-com-ia-professionals"
for select
to authenticated
using (auth.uid() = auth_user_id);

create policy "professionals_insert_own"
on public."festa-com-ia-professionals"
for insert
to authenticated
with check (auth.uid() = auth_user_id);

create policy "professionals_update_own"
on public."festa-com-ia-professionals"
for update
to authenticated
using (auth.uid() = auth_user_id)
with check (auth.uid() = auth_user_id);
