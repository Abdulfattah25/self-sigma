-- Productivity Tracker Schema for Supabase
-- Jalankan di Supabase SQL Editor

-- Extensions (untuk gen_random_uuid)
create extension if not exists pgcrypto;

-- 1) users
create table if not exists public.users (
  id uuid primary key,
  email text not null,
  created_at timestamptz not null default now()
);

-- 2) daily_tasks_template (template harian)
create table if not exists public.daily_tasks_template (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  task_name text not null,
  priority text not null default 'sedang' check (priority in ('tinggi','sedang','rendah')),
  category text,
  created_at timestamptz not null default now()
);

-- 3) daily_tasks_instance (salinan per tanggal)
create table if not exists public.daily_tasks_instance (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  task_id uuid references public.daily_tasks_template(id) on delete set null,
  task_name text not null,
  priority text not null default 'sedang' check (priority in ('tinggi','sedang','rendah')),
  category text,
  date date not null,
  is_completed boolean not null default false,
  checked_at timestamptz,
  created_at timestamptz not null default now()
);

-- 4) score_log (pencatatan perubahan skor)
create table if not exists public.score_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  date date not null,
  score_delta integer not null,
  reason text not null,
  created_at timestamptz not null default now()
);

/******************************************************************
  PROFILES: role-based access (admin vs user)
******************************************************************/
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null default 'user' check (role in ('user','admin')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ensure required columns exist even if table already existed earlier
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists role text;
-- Backfill and enforce defaults/constraint for role
update public.profiles set role = 'user' where role is null;
alter table public.profiles alter column role set default 'user';
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_role_check'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role in ('user','admin'));
  END IF;
END $$;

alter table public.profiles add column if not exists is_active boolean;
update public.profiles set is_active = true where is_active is null;
alter table public.profiles alter column is_active set default true;
alter table public.profiles alter column is_active set not null;

alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

-- Keep updated_at fresh
create or replace function public.set_profiles_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_profiles_updated_at();

-- Auto-create profile row when a new auth user is created
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- (Optional) keep email in sync if auth.users.email changes
create or replace function public.sync_profile_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
     set email = new.email,
         updated_at = now()
   where id = new.id;
  return new;
end $$;

drop trigger if exists trg_sync_profile_email on auth.users;
create trigger trg_sync_profile_email
after update of email on auth.users
for each row execute function public.sync_profile_email();

-- Helpful index for ordering/filtering
create index if not exists idx_profiles_email on public.profiles (email);

-- Indeks penting
create index if not exists idx_template_user_created on public.daily_tasks_template(user_id, created_at desc);
create index if not exists idx_instance_user_date on public.daily_tasks_instance(user_id, date);
create index if not exists idx_instance_user_created on public.daily_tasks_instance(user_id, created_at desc);
create index if not exists idx_score_user_date on public.score_log(user_id, date);

-- Cegah duplikasi materialisasi untuk task yang sama pada hari yang sama
create unique index if not exists ux_instance_user_date_task
  on public.daily_tasks_instance(user_id, date, task_id)
  where task_id is not null;

-- Cegah duplikasi ad-hoc task (berdasarkan nama) pada hari yang sama
create unique index if not exists ux_instance_user_date_taskname_adhoc
  on public.daily_tasks_instance(user_id, date, task_name)
  where task_id is null;

-- RLS: aktifkan dan kebijakan per tabel
alter table public.users enable row level security;
alter table public.daily_tasks_template enable row level security;
alter table public.daily_tasks_instance enable row level security;
alter table public.score_log enable row level security;
alter table public.profiles enable row level security;

-- USERS policies
drop policy if exists users_select_own on public.users;
create policy users_select_own on public.users
  for select using (id = auth.uid());

drop policy if exists users_insert_self on public.users;
create policy users_insert_self on public.users
  for insert with check (id = auth.uid());

drop policy if exists users_update_self on public.users;
create policy users_update_self on public.users
  for update using (id = auth.uid()) with check (id = auth.uid());

-- (Opsional) hapus sendiri
drop policy if exists users_delete_self on public.users;
create policy users_delete_self on public.users
  for delete using (id = auth.uid());

-- DAILY_TASKS_TEMPLATE policies
drop policy if exists dtt_select_own on public.daily_tasks_template;
create policy dtt_select_own on public.daily_tasks_template
  for select using (user_id = auth.uid());

drop policy if exists dtt_insert_own on public.daily_tasks_template;
create policy dtt_insert_own on public.daily_tasks_template
  for insert with check (user_id = auth.uid());

drop policy if exists dtt_update_own on public.daily_tasks_template;
create policy dtt_update_own on public.daily_tasks_template
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists dtt_delete_own on public.daily_tasks_template;
create policy dtt_delete_own on public.daily_tasks_template
  for delete using (user_id = auth.uid());

-- DAILY_TASKS_INSTANCE policies
drop policy if exists dti_select_own on public.daily_tasks_instance;
create policy dti_select_own on public.daily_tasks_instance
  for select using (user_id = auth.uid());

drop policy if exists dti_insert_own on public.daily_tasks_instance;
create policy dti_insert_own on public.daily_tasks_instance
  for insert with check (user_id = auth.uid());

drop policy if exists dti_update_own on public.daily_tasks_instance;
create policy dti_update_own on public.daily_tasks_instance
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists dti_delete_own on public.daily_tasks_instance;
create policy dti_delete_own on public.daily_tasks_instance
  for delete using (user_id = auth.uid());

-- SCORE_LOG policies
drop policy if exists sl_select_own on public.score_log;
create policy sl_select_own on public.score_log
  for select using (user_id = auth.uid());

drop policy if exists sl_insert_own on public.score_log;
create policy sl_insert_own on public.score_log
  for insert with check (user_id = auth.uid());

drop policy if exists sl_update_own on public.score_log;
create policy sl_update_own on public.score_log
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists sl_delete_own on public.score_log;
create policy sl_delete_own on public.score_log
  for delete using (user_id = auth.uid());

-- Admin can SELECT all rows
drop policy if exists "profiles admin read" on public.profiles;
create policy "profiles admin read" on public.profiles
for select
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
      and p.is_active = true
  )
);

-- Admin can UPDATE all rows
drop policy if exists "profiles admin update" on public.profiles;
create policy "profiles admin update" on public.profiles
for update
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
      and p.is_active = true
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
      and p.is_active = true
  )
);

-- Users can read their own profile
drop policy if exists "profiles self read" on public.profiles;
create policy "profiles self read" on public.profiles
for select
using (id = auth.uid());

-- Users can update their own profile (if needed)
drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self update" on public.profiles
for update
using (id = auth.uid())
with check (id = auth.uid());

-- Backfill: ensure every existing auth user has a profile row
insert into public.profiles (id, email)
select u.id, u.email
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

-- Promote your account to admin (replace with your values)
-- select id, email from auth.users order by created_at desc;
-- then:
-- insert into public.profiles (id, email, role, is_active)
-- values ('<YOUR-USER-ID>', '<you@example.com>', 'admin', true)
-- on conflict (id) do update
-- set email = excluded.email,
--     role = excluded.role,
--     is_active = excluded.is_active;

-- Catatan:
-- - Kolom users.id tidak auto default ke auth.uid(), klien harus mengirim id=auth.uid() saat upsert (sudah dilakukan di app.js)
-- - score_delta dibiarkan integer agar fleksibel (mendukung -3 penalti, -1 uncheck, +1 selesai)
-- - Partial unique index mencegah duplikasi materialisasi dan ad-hoc per hari
