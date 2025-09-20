-- Extensions (untuk gen_random_uuid)
create extension if not exists pgcrypto;

/******************************************************************
  PROFILES: role-based access (admin vs user) - CREATE FIRST
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

-- Backfill: ensure every existing auth user has a profile row
insert into public.profiles (id, email)
select u.id, u.email
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

-- MIGRATION: Fix foreign key constraints AFTER profiles table exists
DO $$
BEGIN
  -- Drop old foreign key constraints if they exist
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'daily_tasks_template_user_id_fkey') THEN
    ALTER TABLE public.daily_tasks_template DROP CONSTRAINT daily_tasks_template_user_id_fkey;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'daily_tasks_instance_user_id_fkey') THEN
    ALTER TABLE public.daily_tasks_instance DROP CONSTRAINT daily_tasks_instance_user_id_fkey;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'score_log_user_id_fkey') THEN
    ALTER TABLE public.score_log DROP CONSTRAINT score_log_user_id_fkey;
  END IF;
  
  -- Drop users table if it exists (no longer needed)
  DROP TABLE IF EXISTS public.users CASCADE;
END $$;

-- Note: We use profiles table (which references auth.users) instead of separate users table
-- This ensures consistency with Supabase auth system

-- 2) daily_tasks_template (template harian) - NOW with proper reference
create table if not exists public.daily_tasks_template (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null, -- Will add foreign key constraint later
  task_name text not null,
  priority text not null default 'sedang' check (priority in ('tinggi','sedang','rendah')),
  category text,
  jenis_task text not null default 'harian',
  deadline_date date,
  created_at timestamptz not null default now()
);

-- 3) daily_tasks_instance (salinan per tanggal)
create table if not exists public.daily_tasks_instance (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null, -- Will add foreign key constraint later
  task_id uuid references public.daily_tasks_template(id) on delete set null,
  task_name text not null,
  priority text not null default 'sedang' check (priority in ('tinggi','sedang','rendah')),
  category text,
  jenis_task text not null default 'harian',
  deadline_date date,
  date date not null,
  is_completed boolean not null default false,
  checked_at timestamptz,
  created_at timestamptz not null default now()
);

-- Ensure jenis_task allowed values
DO $$
BEGIN
  -- Ensure columns exist (safe for older DBs that lack these columns)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'daily_tasks_template' AND column_name = 'jenis_task'
  ) THEN
    ALTER TABLE public.daily_tasks_template ADD COLUMN jenis_task text not null default 'harian';
  ELSE
    -- enforce default and backfill NULLs if any
    ALTER TABLE public.daily_tasks_template ALTER COLUMN jenis_task SET DEFAULT 'harian';
    UPDATE public.daily_tasks_template SET jenis_task = 'harian' WHERE jenis_task IS NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'daily_tasks_template' AND column_name = 'deadline_date'
  ) THEN
    ALTER TABLE public.daily_tasks_template ADD COLUMN deadline_date date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'daily_tasks_instance' AND column_name = 'jenis_task'
  ) THEN
    ALTER TABLE public.daily_tasks_instance ADD COLUMN jenis_task text not null default 'harian';
  ELSE
    ALTER TABLE public.daily_tasks_instance ALTER COLUMN jenis_task SET DEFAULT 'harian';
    UPDATE public.daily_tasks_instance SET jenis_task = 'harian' WHERE jenis_task IS NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'daily_tasks_instance' AND column_name = 'deadline_date'
  ) THEN
    ALTER TABLE public.daily_tasks_instance ADD COLUMN deadline_date date;
  END IF;

  -- Add CHECK constraints idempotently
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'daily_tasks_template_jenis_check'
  ) THEN
    ALTER TABLE public.daily_tasks_template ADD CONSTRAINT daily_tasks_template_jenis_check CHECK (jenis_task IN ('harian','deadline'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'daily_tasks_instance_jenis_check'
  ) THEN
    ALTER TABLE public.daily_tasks_instance ADD CONSTRAINT daily_tasks_instance_jenis_check CHECK (jenis_task IN ('harian','deadline'));
  END IF;
END $$;

-- 4) score_log (pencatatan perubahan skor)
create table if not exists public.score_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null, -- Will add foreign key constraint later
  date date not null,
  score_delta integer not null,
  reason text not null,
  created_at timestamptz not null default now()
);

/******************************************************************
  PROFILES SETUP CONTINUED
******************************************************************/

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
alter table public.daily_tasks_template enable row level security;
alter table public.daily_tasks_instance enable row level security;
alter table public.score_log enable row level security;
alter table public.profiles enable row level security;

-- NOTE: No longer using separate users table - everything goes through profiles

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
drop policy if exists "profiles admin update" on public.profiles;

-- Helper: returns true when the current auth.uid() is an active admin
create or replace function public.is_current_user_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists(
    select 1 from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and is_active = true
  );
$$;

-- Grant execute so policy evaluation can call it (safe to allow execute)
grant execute on function public.is_current_user_admin() to public;

-- Admin policies that use the helper (no recursive SELECT from within policy)
create policy "profiles admin read" on public.profiles
  for select
  using ( public.is_current_user_admin() );

create policy "profiles admin update" on public.profiles
  for update
  using ( public.is_current_user_admin() )
  with check ( public.is_current_user_admin() );

-- Admin can delete profiles
create policy "profiles admin delete" on public.profiles
  for delete
  using ( public.is_current_user_admin() );

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

-- NOW ADD FOREIGN KEY CONSTRAINTS AFTER ALL TABLES ARE CREATED
-- This fixes any remaining foreign key issues
DO $$
BEGIN
  -- Add correct foreign key constraints to profiles table (idempotent)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'daily_tasks_template_user_id_fkey' 
    AND confrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.daily_tasks_template 
    ADD CONSTRAINT daily_tasks_template_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'daily_tasks_instance_user_id_fkey' 
    AND confrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.daily_tasks_instance 
    ADD CONSTRAINT daily_tasks_instance_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'score_log_user_id_fkey' 
    AND confrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.score_log 
    ADD CONSTRAINT score_log_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================
-- Licenses: table, RLS, dan fungsi RPC untuk validasi/assign
-- ============================================================

-- Enum status lisensi (idempoten)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'license_status') THEN
    CREATE TYPE public.license_status AS ENUM ('valid','used','revoked','expired');
  END IF;
END $$;

-- Tabel licenses
create table if not exists public.licenses (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  status public.license_status not null default 'valid',
  assigned_email text,
  created_at timestamptz not null default now(),
  used_at timestamptz
);

-- Index tambahan
create index if not exists idx_licenses_status on public.licenses(status);
create index if not exists idx_licenses_created on public.licenses(created_at desc);

-- RLS dan kebijakan (hanya admin)
alter table public.licenses enable row level security;

drop policy if exists "licenses admin read" on public.licenses;
create policy "licenses admin read" on public.licenses
  for select
  using ( public.is_current_user_admin() );

drop policy if exists "licenses admin write" on public.licenses;
create policy "licenses admin write" on public.licenses
  for all
  using ( public.is_current_user_admin() )
  with check ( public.is_current_user_admin() );

-- RPC: Validasi lisensi (boolean) - aman untuk anon (SECURITY DEFINER)
create or replace function public.validate_license(p_code text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  c int;
begin
  select count(*) into c
  from public.licenses
  where code = upper(p_code) and status = 'valid';
  return c > 0;
end
$$;

grant execute on function public.validate_license(text) to public;

-- RPC: Tandai lisensi sebagai used + catat email (boolean keberhasilan)
create or replace function public.use_license(p_code text, p_email text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_count int;
begin
  update public.licenses
     set status = 'used',
         assigned_email = p_email,
         used_at = now()
   where code = upper(p_code)
     and status = 'valid';
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  return updated_count = 1;
end
$$;

grant execute on function public.use_license(text, text) to public;

-- RPC: Generate lisensi baru (hanya admin, SECURITY DEFINER)
-- Kode 6-karakter alfanumerik uppercase berbasis UUID (lebih kompatibel)
create or replace function public.admin_generate_license()
returns public.licenses
language plpgsql
security definer
set search_path = public
as $$
declare
  new_code text;
  rec public.licenses;
  random_uuid text;
begin
  -- Pastikan hanya admin dapat mengeksekusi
  if not public.is_current_user_admin() then
    raise exception 'Only admins can generate licenses';
  end if;

  -- Coba generate unik (loop jika bentrok)
  loop
    -- Generate 6 karakter dari UUID (lebih kompatibel)
    random_uuid := replace(gen_random_uuid()::text, '-', '');
    new_code := upper(substr(random_uuid, 1, 6));

    begin
      insert into public.licenses(code, status)
      values (new_code, 'valid')
      returning * into rec;
      return rec;
    exception
      when unique_violation then
        -- Ulangi jika bentrok
        continue;
    end;
  end loop;

  -- Tidak akan sampai sini
  return rec;
end
$$;

grant execute on function public.admin_generate_license() to authenticated;

-- FINAL CLEANUP: Ensure users table is completely removed
DO $$
BEGIN
  -- Force drop users table if it still exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    DROP TABLE public.users CASCADE;
    RAISE NOTICE 'Removed obsolete users table';
  END IF;
END $$;