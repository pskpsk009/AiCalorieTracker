-- Dated weight history. One row per user per Asia/Bangkok day: saving again the same day
-- replaces that day's value. Rows are only created when the user saves a weight, so there
-- is no backfill of past measurements.
create table public.weight_measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  measured_on date not null,
  weight_kg numeric(6,2) not null check (weight_kg > 0),
  recorded_at timestamptz not null default now(),
  unique (user_id, measured_on)
);

alter table public.weight_measurements enable row level security;

create policy "Users manage own weight measurements"
on public.weight_measurements for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Record a measurement whenever the profile weight is saved, in the same transaction as the
-- profile update. Runs as the calling user, so the RLS policy above still applies.
create or replace function public.record_weight_measurement()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.weight_kg is not null and new.weight_kg > 0 then
    insert into public.weight_measurements (user_id, measured_on, weight_kg)
    values (new.id, (now() at time zone 'Asia/Bangkok')::date, new.weight_kg)
    on conflict (user_id, measured_on)
    do update set weight_kg = excluded.weight_kg, recorded_at = now();
  end if;
  return new;
end;
$$;

create trigger on_profile_weight_saved
  after insert or update of weight_kg on public.profiles
  for each row execute function public.record_weight_measurement();
