-- Permite registrar tazas probadas fuera de casa, donde no se conocen las cantidades.
alter table public.bitacora_brews alter column dose_g drop not null;
alter table public.bitacora_brews alter column water_g drop not null;
