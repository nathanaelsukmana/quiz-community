-- ============================================
-- Quiz Community - Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================

-- 1. Profiles (extends Supabase Auth)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  display_name text not null,
  avatar_url text,
  created_at timestamptz default now() not null
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    new.raw_user_meta_data ->> 'username',
    coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'username')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. Modules (e.g. "ARBKVS", "Mathe 2", "Betriebssysteme")
create table public.modules (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now() not null
);

-- 3. Topics (e.g. "Vorlesung 1: Einführung", "Menti 3")
create table public.topics (
  id uuid default gen_random_uuid() primary key,
  module_id uuid references public.modules(id) on delete cascade not null,
  name text not null,
  description text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now() not null
);

-- 4. Questions
create table public.questions (
  id uuid default gen_random_uuid() primary key,
  topic_id uuid references public.topics(id) on delete cascade not null,
  question_text text not null,
  question_image_url text,  -- optional image for the question
  explanation text,          -- optional explanation shown after answering
  created_by uuid references public.profiles(id) on delete set null not null,
  created_at timestamptz default now() not null
);

-- 5. Answer Options (supports multiple correct answers)
create table public.options (
  id uuid default gen_random_uuid() primary key,
  question_id uuid references public.questions(id) on delete cascade not null,
  option_text text not null,
  option_image_url text,    -- optional image for this option
  is_correct boolean default false not null,
  sort_order int default 0 not null
);

-- 6. Quiz Attempts (track who answered what)
create table public.quiz_attempts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  question_id uuid references public.questions(id) on delete cascade not null,
  selected_option_ids uuid[] not null,
  is_correct boolean not null,
  answered_at timestamptz default now() not null
);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

alter table public.profiles enable row level security;
alter table public.modules enable row level security;
alter table public.topics enable row level security;
alter table public.questions enable row level security;
alter table public.options enable row level security;
alter table public.quiz_attempts enable row level security;

-- Profiles: everyone can read, only owner can update
create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Modules: everyone can read, authenticated can create
create policy "Modules are viewable by everyone"
  on public.modules for select using (true);

create policy "Authenticated users can create modules"
  on public.modules for insert with check (auth.role() = 'authenticated');

create policy "Creators can update their modules"
  on public.modules for update using (auth.uid() = created_by);

-- Topics: everyone can read, authenticated can create
create policy "Topics are viewable by everyone"
  on public.topics for select using (true);

create policy "Authenticated users can create topics"
  on public.topics for insert with check (auth.role() = 'authenticated');

create policy "Creators can update their topics"
  on public.topics for update using (auth.uid() = created_by);

-- Questions: everyone can read, authenticated can create
create policy "Questions are viewable by everyone"
  on public.questions for select using (true);

create policy "Authenticated users can create questions"
  on public.questions for insert with check (auth.role() = 'authenticated');

create policy "Creators can update their questions"
  on public.questions for update using (auth.uid() = created_by);

create policy "Creators can delete their questions"
  on public.questions for delete using (auth.uid() = created_by);

-- Options: everyone can read, question creator can manage
create policy "Options are viewable by everyone"
  on public.options for select using (true);

create policy "Authenticated users can create options"
  on public.options for insert with check (auth.role() = 'authenticated');

create policy "Option creators can update"
  on public.options for update using (
    exists (
      select 1 from public.questions q
      where q.id = question_id and q.created_by = auth.uid()
    )
  );

create policy "Option creators can delete"
  on public.options for delete using (
    exists (
      select 1 from public.questions q
      where q.id = question_id and q.created_by = auth.uid()
    )
  );

-- Quiz attempts: users can see own + create own
create policy "Users can view own attempts"
  on public.quiz_attempts for select using (auth.uid() = user_id);

create policy "Users can create own attempts"
  on public.quiz_attempts for insert with check (auth.uid() = user_id);

-- ============================================
-- Storage Bucket for question images
-- ============================================

insert into storage.buckets (id, name, public)
values ('question-images', 'question-images', true);

create policy "Anyone can view question images"
  on storage.objects for select
  using (bucket_id = 'question-images');

create policy "Authenticated users can upload images"
  on storage.objects for insert
  with check (bucket_id = 'question-images' and auth.role() = 'authenticated');

create policy "Users can delete own images"
  on storage.objects for delete
  using (bucket_id = 'question-images' and auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================
-- Useful Views
-- ============================================

-- Question count per topic
create or replace view public.topic_stats as
select
  t.id as topic_id,
  t.module_id,
  count(q.id) as question_count,
  count(distinct q.created_by) as contributor_count
from public.topics t
left join public.questions q on q.topic_id = t.id
group by t.id, t.module_id;

-- Leaderboard: who contributed the most questions per module
create or replace view public.module_leaderboard as
select
  m.id as module_id,
  p.id as user_id,
  p.username,
  p.display_name,
  count(q.id) as question_count
from public.modules m
join public.topics t on t.module_id = m.id
join public.questions q on q.topic_id = t.id
join public.profiles p on p.id = q.created_by
group by m.id, p.id, p.username, p.display_name
order by question_count desc;
