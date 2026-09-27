alter table public.profiles
  add column if not exists weight_kg numeric(6,2),
  add column if not exists height_cm numeric(6,2);
