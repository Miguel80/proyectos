-- Paso 1.3: Bitácora Sensorial (café y té).
-- Modelo: productos (grano/hebras) -> preparaciones (variables de extracción) -> cata (1:1).
-- Todas las tablas son privadas por usuario mediante RLS.

create table if not exists public.bitacora_products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text not null check (kind in ('coffee', 'tea')),
  name text not null check (char_length(name) between 1 and 120),
  origin_country text check (char_length(origin_country) <= 80),
  region text check (char_length(region) <= 80),
  producer text check (char_length(producer) <= 120),
  variety text check (char_length(variety) <= 120),
  process text check (char_length(process) <= 120),
  tea_type text check (tea_type in ('green', 'black', 'oolong', 'white', 'puerh', 'yellow', 'herbal', 'other')),
  roast_level text check (roast_level in ('light', 'medium', 'dark')),
  roast_date date,
  purchased_on date,
  supplier text check (char_length(supplier) <= 120),
  notes text check (char_length(notes) <= 2000),
  created_at timestamptz not null default now()
);

create table if not exists public.bitacora_brews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  product_id uuid not null references public.bitacora_products (id) on delete cascade,
  brewed_at timestamptz not null default now(),
  method text not null check (char_length(method) between 1 and 60),
  dose_g numeric(6, 2) not null check (dose_g > 0),
  water_g numeric(7, 2) not null check (water_g > 0),
  ratio numeric(7, 2) generated always as (round(water_g / dose_g, 2)) stored,
  water_temp_c numeric(4, 1) check (water_temp_c between 0 and 100),
  grind_setting text check (char_length(grind_setting) <= 60),
  steep_seconds integer check (steep_seconds > 0),
  equipment text check (char_length(equipment) <= 200),
  water_notes text check (char_length(water_notes) <= 200),
  rating smallint check (rating between 1 and 5),
  notes text check (char_length(notes) <= 2000),
  created_at timestamptz not null default now()
);

create table if not exists public.bitacora_tastings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  brew_id uuid not null unique references public.bitacora_brews (id) on delete cascade,
  aroma smallint check (aroma between 1 and 5),
  acidity smallint check (acidity between 1 and 5),
  body smallint check (body between 1 and 5),
  sweetness smallint check (sweetness between 1 and 5),
  bitterness smallint check (bitterness between 1 and 5),
  aftertaste smallint check (aftertaste between 1 and 5),
  balance smallint check (balance between 1 and 5),
  descriptors text[] not null default '{}' check (cardinality(descriptors) <= 20),
  notes text check (char_length(notes) <= 2000),
  created_at timestamptz not null default now()
);

create index if not exists bitacora_products_user_created_idx
  on public.bitacora_products (user_id, created_at desc);
create index if not exists bitacora_brews_user_brewed_idx
  on public.bitacora_brews (user_id, brewed_at desc);
create index if not exists bitacora_brews_product_idx
  on public.bitacora_brews (product_id);
create index if not exists bitacora_tastings_user_idx
  on public.bitacora_tastings (user_id);

alter table public.bitacora_products enable row level security;
alter table public.bitacora_brews enable row level security;
alter table public.bitacora_tastings enable row level security;

create policy "bitacora_products_own" on public.bitacora_products
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Además de ser dueño de la fila, el producto referenciado debe ser del mismo usuario.
create policy "bitacora_brews_own" on public.bitacora_brews
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.bitacora_products p
      where p.id = product_id and p.user_id = (select auth.uid())
    )
  );

create policy "bitacora_tastings_own" on public.bitacora_tastings
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.bitacora_brews b
      where b.id = brew_id and b.user_id = (select auth.uid())
    )
  );
