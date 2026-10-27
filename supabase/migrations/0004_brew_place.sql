-- Lugar donde se probó la taza (casa, cafetería…). Opcional.
alter table public.bitacora_brews add column place text check (place is null or char_length(place) between 1 and 120);
