-- ============================================================================
-- Buddi — full database schema, RLS policies, triggers, and storage setup.
-- Run this once against a fresh Supabase project (SQL Editor -> New query).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  username text unique not null,
  bio text,
  avatar_url text,
  created_at timestamptz default now()
);

create table if not exists groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  owner_id uuid references profiles(id),
  invite_code text unique default substring(md5(random()::text), 1, 8),
  created_at timestamptz default now()
);

create table if not exists group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references groups(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  role text default 'member', -- owner, admin, member
  joined_at timestamptz default now(),
  unique (group_id, user_id)
);

create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references profiles(id) on delete cascade,
  group_id uuid references groups(id) on delete cascade,
  type text default 'update', -- update, achievement, help_request, reflection, milestone
  content text not null,
  media_url text,
  media_type text, -- image or video
  help_status text, -- open, offered, resolved (help_request only)
  created_at timestamptz default now()
);

create table if not exists reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references posts(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  emoji text not null,
  created_at timestamptz default now(),
  unique (post_id, user_id, emoji)
);

create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references posts(id) on delete cascade,
  author_id uuid references profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);

create table if not exists goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  group_id uuid references groups(id) on delete cascade,
  title text not null,
  description text,
  status text default 'active', -- active, completed, abandoned
  priority text default 'medium', -- high, medium, low
  progress integer default 0,
  deadline date,
  completed_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists streaks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade unique,
  current_streak integer default 0,
  longest_streak integer default 0,
  last_activity_date date,
  updated_at timestamptz default now()
);

create table if not exists reflections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  group_id uuid references groups(id),
  week text not null,
  wins text,
  struggles text,
  next_goals text,
  help_needed text,
  created_at timestamptz default now()
);

create table if not exists focus_sessions (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references profiles(id),
  group_id uuid references groups(id),
  title text not null,
  duration_minutes integer default 25,
  status text default 'active', -- active, completed
  started_at timestamptz default now(),
  ended_at timestamptz
);

create table if not exists focus_participants (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references focus_sessions(id) on delete cascade,
  user_id uuid references profiles(id),
  goal text,
  joined_at timestamptz default now(),
  unique (session_id, user_id)
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  type text not null, -- new_post, reaction, comment, help_accepted, new_member
  message text not null,
  link text,
  read boolean default false,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- Auto-create a profile row whenever a new auth user signs up.
-- Username is seeded from signup metadata (see signup form) or the email.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'username',
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;

  insert into public.streaks (user_id) values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Helper: is the current user a member of a given group?
-- (security definer avoids RLS recursion between groups <-> group_members)
-- ---------------------------------------------------------------------------
create or replace function public.is_group_member(_group_id uuid)
returns boolean as $$
  select exists (
    select 1 from group_members
    where group_id = _group_id and user_id = auth.uid()
  );
$$ language sql security definer stable set search_path = public;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table profiles enable row level security;
alter table groups enable row level security;
alter table group_members enable row level security;
alter table posts enable row level security;
alter table reactions enable row level security;
alter table comments enable row level security;
alter table goals enable row level security;
alter table streaks enable row level security;
alter table reflections enable row level security;
alter table focus_sessions enable row level security;
alter table focus_participants enable row level security;
alter table notifications enable row level security;

-- profiles: publicly readable (usernames/avatars are shown across groups),
-- but only the owner can modify their own row.
create policy "profiles are viewable by everyone" on profiles
  for select using (true);
create policy "users can update own profile" on profiles
  for update using (auth.uid() = id);
create policy "users can insert own profile" on profiles
  for insert with check (auth.uid() = id);

-- groups: members can view their groups; anyone (any authenticated user)
-- can look a group up by invite code in order to join it.
create policy "members can view their groups" on groups
  for select using (public.is_group_member(id) or auth.uid() = owner_id);
create policy "authenticated users can look up groups to join" on groups
  for select using (auth.role() = 'authenticated');
create policy "authenticated users can create groups" on groups
  for insert with check (auth.uid() = owner_id);
create policy "owners can update their groups" on groups
  for update using (auth.uid() = owner_id);
create policy "owners can delete their groups" on groups
  for delete using (auth.uid() = owner_id);

-- group_members
create policy "members can view membership of their groups" on group_members
  for select using (public.is_group_member(group_id));
create policy "users can join groups" on group_members
  for insert with check (auth.uid() = user_id);
create policy "users can leave groups" on group_members
  for delete using (auth.uid() = user_id);

-- posts: only visible to members of the post's group
create policy "members can view posts in their groups" on posts
  for select using (public.is_group_member(group_id));
create policy "members can create posts in their groups" on posts
  for insert with check (
    public.is_group_member(group_id) and auth.uid() = author_id
  );
create policy "authors can update their own posts" on posts
  for update using (auth.uid() = author_id);
create policy "authors can delete their own posts" on posts
  for delete using (auth.uid() = author_id);

-- reactions
create policy "members can view reactions on visible posts" on reactions
  for select using (
    exists (
      select 1 from posts
      where posts.id = reactions.post_id
        and public.is_group_member(posts.group_id)
    )
  );
create policy "members can react to visible posts" on reactions
  for insert with check (
    auth.uid() = user_id and exists (
      select 1 from posts
      where posts.id = reactions.post_id
        and public.is_group_member(posts.group_id)
    )
  );
create policy "users can remove their own reactions" on reactions
  for delete using (auth.uid() = user_id);

-- comments
create policy "members can view comments on visible posts" on comments
  for select using (
    exists (
      select 1 from posts
      where posts.id = comments.post_id
        and public.is_group_member(posts.group_id)
    )
  );
create policy "members can comment on visible posts" on comments
  for insert with check (
    auth.uid() = author_id and exists (
      select 1 from posts
      where posts.id = comments.post_id
        and public.is_group_member(posts.group_id)
    )
  );
create policy "authors can delete their own comments" on comments
  for delete using (auth.uid() = author_id);

-- goals: owner always; group members can view goals shared with the group
create policy "users can view own goals" on goals
  for select using (auth.uid() = user_id);
create policy "group members can view shared goals" on goals
  for select using (group_id is not null and public.is_group_member(group_id));
create policy "users can create own goals" on goals
  for insert with check (auth.uid() = user_id);
create policy "users can update own goals" on goals
  for update using (auth.uid() = user_id);
create policy "users can delete own goals" on goals
  for delete using (auth.uid() = user_id);

-- streaks
create policy "users can view own streak" on streaks
  for select using (auth.uid() = user_id);
create policy "users can upsert own streak" on streaks
  for insert with check (auth.uid() = user_id);
create policy "users can update own streak" on streaks
  for update using (auth.uid() = user_id);

-- reflections: owner always; group members can view if shared
create policy "users can view own reflections" on reflections
  for select using (auth.uid() = user_id);
create policy "group members can view shared reflections" on reflections
  for select using (group_id is not null and public.is_group_member(group_id));
create policy "users can create own reflections" on reflections
  for insert with check (auth.uid() = user_id);
create policy "users can delete own reflections" on reflections
  for delete using (auth.uid() = user_id);

-- focus sessions: visible to the creator and members of the target group
create policy "members can view group focus sessions" on focus_sessions
  for select using (
    auth.uid() = creator_id
    or (group_id is not null and public.is_group_member(group_id))
  );
create policy "users can create focus sessions" on focus_sessions
  for insert with check (auth.uid() = creator_id);
create policy "creators can update their focus sessions" on focus_sessions
  for update using (auth.uid() = creator_id);

-- focus participants
create policy "participants can view session rosters" on focus_participants
  for select using (
    exists (
      select 1 from focus_sessions fs
      where fs.id = focus_participants.session_id
        and (
          auth.uid() = fs.creator_id
          or (fs.group_id is not null and public.is_group_member(fs.group_id))
        )
    )
  );
create policy "users can join focus sessions" on focus_participants
  for insert with check (auth.uid() = user_id);
create policy "users can update own participation" on focus_participants
  for update using (auth.uid() = user_id);

-- notifications: strictly private to the recipient
create policy "users can view own notifications" on notifications
  for select using (auth.uid() = user_id);
create policy "users can update own notifications" on notifications
  for update using (auth.uid() = user_id);
create policy "system can insert notifications" on notifications
  for insert with check (true);

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table posts;
alter publication supabase_realtime add table comments;
alter publication supabase_realtime add table reactions;
alter publication supabase_realtime add table notifications;
alter publication supabase_realtime add table focus_sessions;
alter publication supabase_realtime add table focus_participants;

-- ---------------------------------------------------------------------------
-- Storage buckets (public read; writes limited to the owning user's folder,
-- i.e. files must be uploaded to a path prefixed with the user's auth uid).
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('post-media', 'post-media', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "public read post-media" on storage.objects
  for select using (bucket_id = 'post-media');
create policy "authenticated upload post-media" on storage.objects
  for insert with check (
    bucket_id = 'post-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
create policy "owners delete post-media" on storage.objects
  for delete using (
    bucket_id = 'post-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "public read avatars" on storage.objects
  for select using (bucket_id = 'avatars');
create policy "authenticated upload avatars" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
create policy "owners update avatars" on storage.objects
  for update using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
