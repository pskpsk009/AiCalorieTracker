-- Each user's time zone (IANA name, e.g. 'Asia/Bangkok'). It decides where "today" and each
-- week begin and end. Earlier migrations assumed Asia/Bangkok; that stays the fallback when a
-- profile has no zone yet. food_day_confirmations.day and weight_measurements.measured_on are
-- calendar dates in the user's own zone from now on.
alter table public.profiles
  add column if not exists timezone text
  check (timezone is null or timezone ~ '^[A-Za-z]+(/[A-Za-z0-9_+-]+)*$');

-- Date weight measurements in the user's zone instead of always Bangkok.
create or replace function public.record_weight_measurement()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.weight_kg is not null and new.weight_kg > 0 then
    insert into public.weight_measurements (user_id, measured_on, weight_kg)
    values (
      new.id,
      (now() at time zone coalesce(new.timezone, 'Asia/Bangkok'))::date,
      new.weight_kg
    )
    on conflict (user_id, measured_on)
    do update set weight_kg = excluded.weight_kg, recorded_at = now();
  end if;
  return new;
end;
$$;
