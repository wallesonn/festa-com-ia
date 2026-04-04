-- Cria suporte para foto do profissional/empresa no perfil

alter table if exists public."festa-com-ia-professionals"
  add column if not exists photo_path text;

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
