-- Foto opcional por taza (café, paquete o lugar). Bucket privado; se sirve con URLs firmadas.
-- Ruta del objeto: <user_id>/<brew_id>.<ext>. Lectura también para quien tenga el cuaderno compartido.
alter table public.bitacora_brews add column photo_path text check (photo_path is null or char_length(photo_path) between 1 and 200);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('bitacora-photos', 'bitacora-photos', false, 4194304, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "bitacora_photos_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'bitacora-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "bitacora_photos_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'bitacora-photos'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or public.bitacora_can_view(((storage.foldername(name))[1])::uuid)
    )
  );

create policy "bitacora_photos_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'bitacora-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
