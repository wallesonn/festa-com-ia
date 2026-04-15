-- Schema final do Supabase
-- Este arquivo descreve apenas o lado Supabase: Auth, perfil do profissional e Storage.
-- Não deve ser aplicado no Postgres operacional local.

create extension if not exists "uuid-ossp";

create table if not exists public."festa-com-ia-professionals" (
  id uuid primary key default uuid_generate_v4(),
  auth_user_id uuid,
  display_name text not null,
  business_name text not null,
  phone text,
  email text,
  photo_path text,
  products_produced text,
  product_subgroups jsonb,
  product_variations jsonb,
  conversation_samples text,
  onboarding_completed boolean not null default false,
  slug text,
  service_rules text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists festa_com_ia_professionals_auth_user_id_key
  on public."festa-com-ia-professionals" (auth_user_id);

create table if not exists public.regras_criacao_tabelas (
  nome_projeto text,
  descricao text
);

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

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'festa-com-ia',
  'festa-com-ia',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "festa_com_ia_profile_photos_insert" on storage.objects;
drop policy if exists "festa_com_ia_profile_photos_update" on storage.objects;
drop policy if exists "festa_com_ia_profile_photos_delete" on storage.objects;

create policy "festa_com_ia_profile_photos_insert"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'festa-com-ia');

create policy "festa_com_ia_profile_photos_update"
on storage.objects
for update
to authenticated
using (bucket_id = 'festa-com-ia')
with check (bucket_id = 'festa-com-ia');

create policy "festa_com_ia_profile_photos_delete"
on storage.objects
for delete
to authenticated
using (bucket_id = 'festa-com-ia');
