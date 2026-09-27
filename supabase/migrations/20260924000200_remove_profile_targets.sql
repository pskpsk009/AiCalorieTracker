alter table public.profiles
  drop column if exists calorie_target,
  drop column if exists avatar_url;