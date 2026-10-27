-- Migración inicial de ejemplo: tabla `notes` con RLS por usuario.
-- Sirve como patrón para las tablas de la Bitácora Sensorial (Paso 1.3).

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  body text check (body is null or char_length(body) <= 5000),
  created_at timestamptz not null default now()
);

create index if not exists notes_user_id_created_at_idx
  on public.notes (user_id, created_at desc);

alter table public.notes enable row level security;

-- (select auth.uid()) evita reevaluar la función por fila.
create policy "notes_select_own" on public.notes
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "notes_insert_own" on public.notes
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "notes_update_own" on public.notes
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "notes_delete_own" on public.notes
  for delete to authenticated
  using ((select auth.uid()) = user_id);
