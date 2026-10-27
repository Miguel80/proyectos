-- Compartir cuadernos: el dueño invita por correo; el invitado acepta y obtiene SOLO LECTURA.

create table public.bitacora_shares (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  owner_email text not null check (char_length(owner_email) between 3 and 254),
  recipient_email text not null
    check (recipient_email = lower(recipient_email) and char_length(recipient_email) between 3 and 254),
  recipient_id uuid references auth.users (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  unique (owner_id, recipient_email),
  check (recipient_email <> lower(owner_email))
);

create index bitacora_shares_recipient_id_idx on public.bitacora_shares (recipient_id);
create index bitacora_shares_recipient_email_idx on public.bitacora_shares (recipient_email);

alter table public.bitacora_shares enable row level security;

create policy "bitacora_shares_select" on public.bitacora_shares
  for select to authenticated
  using (
    (select auth.uid()) = owner_id
    or (select auth.uid()) = recipient_id
    or recipient_email = lower((select auth.jwt() ->> 'email'))
  );

-- Solo se puede crear como pendiente y a nombre propio. No hay política de UPDATE:
-- aceptar se hace únicamente con la función bitacora_accept_share.
create policy "bitacora_shares_insert" on public.bitacora_shares
  for insert to authenticated
  with check (
    (select auth.uid()) = owner_id
    and status = 'pending'
    and recipient_id is null
    and lower(owner_email) = lower((select auth.jwt() ->> 'email'))
  );

-- Dueño (revocar), invitado (rechazar o salir) pueden eliminar.
create policy "bitacora_shares_delete" on public.bitacora_shares
  for delete to authenticated
  using (
    (select auth.uid()) = owner_id
    or (select auth.uid()) = recipient_id
    or recipient_email = lower((select auth.jwt() ->> 'email'))
  );

create function public.bitacora_accept_share(share_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.bitacora_shares
     set status = 'accepted',
         recipient_id = (select auth.uid()),
         accepted_at = now()
   where id = share_id
     and status = 'pending'
     and recipient_email = lower((select auth.jwt() ->> 'email'));

  if not found then
    raise exception 'Invitación no encontrada' using errcode = 'P0002';
  end if;
end;
$$;

create function public.bitacora_can_view(owner uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.bitacora_shares s
     where s.owner_id = owner
       and s.recipient_id = (select auth.uid())
       and s.status = 'accepted'
  );
$$;

revoke execute on function public.bitacora_accept_share(uuid) from public, anon;
revoke execute on function public.bitacora_can_view(uuid) from public, anon;
grant execute on function public.bitacora_accept_share(uuid) to authenticated;
grant execute on function public.bitacora_can_view(uuid) to authenticated;

-- Lectura (solo SELECT) para quienes aceptaron la invitación.
create policy "bitacora_products_shared_read" on public.bitacora_products
  for select to authenticated using (public.bitacora_can_view(user_id));
create policy "bitacora_brews_shared_read" on public.bitacora_brews
  for select to authenticated using (public.bitacora_can_view(user_id));
create policy "bitacora_tastings_shared_read" on public.bitacora_tastings
  for select to authenticated using (public.bitacora_can_view(user_id));
