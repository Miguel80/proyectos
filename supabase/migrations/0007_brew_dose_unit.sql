-- La dosis se guarda tal como se midió (gramos, cucharaditas o cucharadas soperas).
-- dose_g sigue siendo la dosis en gramos (exacta o estimada) y alimenta la proporción.
alter table public.bitacora_brews
  add column dose_amount numeric(6, 2) check (dose_amount is null or dose_amount > 0),
  add column dose_unit text check (dose_unit is null or dose_unit in ('g', 'tsp', 'tbsp'));
