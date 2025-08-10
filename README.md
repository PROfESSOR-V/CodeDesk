# CodeDesk

CodeDesk is a full-stack web application designed to help developers and learners stay organized, track progress, and master coding platforms effectively. It brings together the best resources, educators, and structured question sheets in one clean and interactive interface.

🔮 Coming Soon: AI-Powered Performance Tracking!
An intelligent system to analyze user activity and visualize progress with interactive graphs.

This monorepo contains two workspaces:

| Directory | Description |
|-----------|-------------|
| `backend/` | Node.js + Express + SUPABASE REST API boilerplate |
| `client/`  | React + Vite + Tailwind CSS frontend skeleton |

## Prerequisites

- Node.js ≥ 18
- SUPABASE account with project name CodeDesk 

---
## Getting Started (Backend)

1. `cd backend`
2. Create `.env` and set at least:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - optional for local: `PORT=5000`
3. `npm install`
4. `npm run dev` – starts API on <http://localhost:5000>
5. Must run these below SQL commands to proper run this project. Good Luck !!

### Supabase setup (SQL to run in Supabase SQL Editor)

Run these in order to create and secure user profile storage used by the backend.

1) User profile table with Row Level Security (RLS)

```sql
-- (A) Profile data table
create table if not exists profiles (
  supabase_id uuid primary key,          -- matches auth.users.id
  first_name  text,
  last_name   text,
  bio         text,
  country     text,
  education         jsonb,
  achievements      jsonb,
  work_experience   jsonb,
  platforms         jsonb,
  avatar_url text,
  created_at timestamptz default now()
);

-- (B) Security: allow each user to read / update only their own row
alter table profiles enable row level security;

create policy "profiles owner can select"
  on profiles for select
  using (supabase_id = auth.uid());

create policy "profiles owner can update"
  on profiles for update
  using (supabase_id = auth.uid())
  with check (supabase_id = auth.uid());
```

2) Auto create user profiles on signup (basic)

```sql
-- Automatically create a blank profile row whenever a user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  -- Insert only if it doesn't exist (defensive)
  insert into profiles (supabase_id)
    values (new.id)
    on conflict (supabase_id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Attach the trigger to auth.users INSERT
drop trigger if exists on_signup on auth.users;

create trigger on_signup
after insert on auth.users
for each row execute procedure public.handle_new_user();
```

3) Auto create user profiles on signup (enhanced: split name into first/last)

```sql
-- Drop existing trigger and function
drop trigger if exists on_signup on auth.users;
drop function if exists public.handle_new_user();

-- Create updated function
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (
    supabase_id,
    first_name,
    last_name,
    created_at
  ) values (
    new.id,
    split_part(new.raw_user_meta_data->>'name', ' ', 1),
    split_part(new.raw_user_meta_data->>'name', ' ', 2),
    now()
  );
  return new;
end;
$$ language plpgsql security definer;

-- Recreate trigger
create trigger on_signup
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

4) Recreate profiles table and policies (if needed)

```sql
-- Drop existing table and recreate with correct structure
drop table if exists public.profiles;

create table public.profiles (
  supabase_id uuid primary key references auth.users(id),
  first_name text,
  last_name text,
  bio text,
  country text,
  education jsonb default '[]'::jsonb,
  achievements jsonb default '[]'::jsonb,
  work_experience jsonb default '[]'::jsonb,
  platforms jsonb default '{}'::jsonb,
  avatar_url text,
  created_at timestamptz default now()
);

-- Set up RLS policies
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = supabase_id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = supabase_id );
```

---
## Getting Started (Frontend)

1. `cd client`
2. make .env file with `VITE_SUPABASE_URL` & `VITE_SUPABASE_ANON_KEY` & `VITE_API_URL=http://localhost:3000`
3. `npm install`
4. `npm run dev` – opens Vite dev server on <http://localhost:3000>

---
## Contributing

Refer to the issues tab for new features/pages. Feel free to open PRs following contributor guidelines.

---
## License

MIT 
