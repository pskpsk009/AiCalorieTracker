drop policy if exists "Users upload own meal images" on storage.objects;
drop policy if exists "Users read own meal images" on storage.objects;
drop policy if exists "Users delete own meal images" on storage.objects;

create policy "Users upload own meal images"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'meal-images'
  and split_part(name, '/', 1) = auth.uid()::text
);

create policy "Users read own meal images"
on storage.objects for select to authenticated
using (
  bucket_id = 'meal-images'
  and split_part(name, '/', 1) = auth.uid()::text
);

create policy "Users delete own meal images"
on storage.objects for delete to authenticated
using (
  bucket_id = 'meal-images'
  and split_part(name, '/', 1) = auth.uid()::text
);
