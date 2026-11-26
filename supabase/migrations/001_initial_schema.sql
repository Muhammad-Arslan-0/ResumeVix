-- ResumeVix Initial Supabase Schema & RLS Policies
create extension if not exists "pgcrypto";

-- 1. Public Users Profile (mirrors auth.users)
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Templates Catalog
create table if not exists public.templates (
  id text primary key,
  name text not null,
  category text not null check (category in ('ats', 'academic', 'executive', 'creative')),
  layout text not null,
  ats_score text not null,
  default_style jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 3. Resumes (multi-resume cloud storage per user)
create table if not exists public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null default 'Untitled Resume',
  template_id text not null default 'ats-minimal',
  resume_data jsonb not null,
  template_config jsonb not null,
  is_archived boolean not null default false,
  last_synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_resumes_user_updated on public.resumes(user_id, updated_at desc);

-- 4. User Settings (syncs non-secret preferences; BYOK keys remain client-side)
create table if not exists public.user_settings (
  user_id uuid primary key references public.users(id) on delete cascade,
  editor_theme text not null default 'light' check (editor_theme in ('light', 'dark')),
  default_page_size text not null default 'A4' check (default_page_size in ('A4', 'LETTER')),
  preferred_ai_provider text not null default 'gemini',
  preferred_ai_model text not null default 'gemini-3.8-flash',
  updated_at timestamptz not null default now()
);

-- Row Level Security (RLS)
alter table public.users enable row level security;
alter table public.templates enable row level security;
alter table public.resumes enable row level security;
alter table public.user_settings enable row level security;

create policy "Users can view own profile"
  on public.users for select using (auth.uid() = id);

create policy "Users can update own profile"
  on public.users for update using (auth.uid() = id);

create policy "Templates are readable by all"
  on public.templates for select using (true);

create policy "Users can CRUD own resumes"
  on public.resumes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can CRUD own settings"
  on public.user_settings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Auto-create public.users & user_settings on auth.users signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', '')
  )
  on conflict (id) do nothing;

  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
