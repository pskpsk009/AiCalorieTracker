-- A row means the user confirmed their food log for that day is complete,
-- which is what lets the app tell "ate nothing" apart from "didn't log".
-- `day` is the Asia/Bangkok calendar date the app uses everywhere.
create table public.food_day_confirmations (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  confirmed_at timestamptz not null default now(),
  primary key (user_id, day)
);

alter table public.food_day_confirmations enable row level security;

create policy "Users manage own food day confirmations"
on public.food_day_confirmations for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
