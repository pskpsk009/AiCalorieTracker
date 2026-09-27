create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  created_at timestamptz not null default now()
);

create table public.meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  meal_type text not null,
  name text not null,
  image_path text,
  calories integer not null default 0,
  protein integer not null default 0,
  carbs integer not null default 0,
  fat integer not null default 0,
  eaten_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.meal_items (
  id uuid primary key default gen_random_uuid(),
  meal_id uuid not null references public.meals(id) on delete cascade,
  name text not null,
  grams integer not null default 0,
  calories integer not null default 0,
  protein integer not null default 0,
  carbs integer not null default 0,
  fat integer not null default 0
);

create table public.walking_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  duration_seconds integer not null default 0,
  calories_burned integer not null default 0,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.meals enable row level security;
alter table public.meal_items enable row level security;
alter table public.walking_sessions enable row level security;

create policy "Users manage own profile"
on public.profiles for all to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Users manage own meals"
on public.meals for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users manage own meal items"
on public.meal_items for all to authenticated
using (
  exists (
    select 1 from public.meals
    where meals.id = meal_items.meal_id
    and meals.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.meals
    where meals.id = meal_items.meal_id
    and meals.user_id = auth.uid()
  )
);

create policy "Users manage own walking sessions"
on public.walking_sessions for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, new.raw_user_meta_data ->> 'name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

insert into storage.buckets (id, name, public)
values ('meal-images', 'meal-images', false)
on conflict (id) do nothing;

create policy "Users upload own meal images"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'meal-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users read own meal images"
on storage.objects for select to authenticated
using (
  bucket_id = 'meal-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users delete own meal images"
on storage.objects for delete to authenticated
using (
  bucket_id = 'meal-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);
