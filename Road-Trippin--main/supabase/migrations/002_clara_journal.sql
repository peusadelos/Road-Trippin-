-- Clara's Journal feature migration
-- Run this in your Supabase project's SQL Editor (Dashboard -> SQL Editor -> New Query)

-- 1. Mark when a trip was explicitly "ended" by the user (unlocks the journal)
alter table trips
  add column if not exists ended_at timestamptz;

-- 2. Photos attached to a stop
create table if not exists trip_photos (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  stop_id uuid not null references stops(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null,
  caption text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists trip_photos_stop_id_idx on trip_photos(stop_id);
create index if not exists trip_photos_trip_id_idx on trip_photos(trip_id);

alter table trip_photos enable row level security;

drop policy if exists "Users can view their own trip photos" on trip_photos;
create policy "Users can view their own trip photos"
  on trip_photos for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own trip photos" on trip_photos;
create policy "Users can insert their own trip photos"
  on trip_photos for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own trip photos" on trip_photos;
create policy "Users can update their own trip photos"
  on trip_photos for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete their own trip photos" on trip_photos;
create policy "Users can delete their own trip photos"
  on trip_photos for delete
  using (auth.uid() = user_id);

-- 3. Optional "cover photo" per day (chosen manually from that day's photos)
alter table trip_days
  add column if not exists cover_photo_id uuid references trip_photos(id) on delete set null;

-- 4. Storage bucket for the actual image files
insert into storage.buckets (id, name, public)
values ('trip-photos', 'trip-photos', true)
on conflict (id) do nothing;

-- Files are stored as: {user_id}/{trip_id}/{stop_id}/{filename}
-- so folder[1] = the owner's auth uid, used to scope read/write access.

drop policy if exists "Users can upload their own trip photos" on storage.objects;
create policy "Users can upload their own trip photos"
  on storage.objects for insert
  with check (
    bucket_id = 'trip-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can view their own trip photos in storage" on storage.objects;
create policy "Users can view their own trip photos in storage"
  on storage.objects for select
  using (
    bucket_id = 'trip-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can delete their own trip photos in storage" on storage.objects;
create policy "Users can delete their own trip photos in storage"
  on storage.objects for delete
  using (
    bucket_id = 'trip-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
