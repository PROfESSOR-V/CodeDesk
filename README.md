# CodeDesk

CodeDesk is a full-stack web application designed to help developers and learners stay organized, track progress, and master coding platforms effectively. It brings together the best resources, educators, and structured question sheets in one clean and interactive interface.

[![Open Source](https://badges.frapsoft.com/os/v1/open-source.svg?v=103)](https://github.com/PROfESSOR-V/CodeDesk)

<div align="center">
  <img src="https://user-images.githubusercontent.com/74038190/212284115-f47cd8ff-2ffb-4b04-b5bf-4d1c14c0247f.gif" width="1000">
</div>

**📊 Project Insights**

<table align="center">
    <thead align="center">
        <tr>
            <td><b>🌟 Stars</b></td>
            <td><b>🍴 Forks</b></td>
            <td><b>🐛 Issues</b></td>
            <td><b>🔔 Open PRs</b></td>
            <td><b>🔕 Closed PRs</b></td>
            <td><b>🛠️ Languages</b></td>
            <td><b>👥 Contributors</b></td>
        </tr>
     </thead>
    <tbody>
         <tr>
            <td><img alt="Stars" src="https://img.shields.io/github/stars/PROfESSOR-V/CodeDesk?style=flat&logo=github"/></td>
            <td><img alt="Forks" src="https://img.shields.io/github/forks/PROfESSOR-V/CodeDesk?style=flat&logo=github"/></td>
            <td><img alt="Issues" src="https://img.shields.io/github/issues/PROfESSOR-V/CodeDesk?style=flat&logo=github"/></td>
            <td><img alt="Open PRs" src="https://img.shields.io/github/issues-pr/PROfESSOR-V/CodeDesk?style=flat&logo=github"/></td>
            <td><img alt="Closed PRs" src="https://img.shields.io/github/issues-pr-closed/PROfESSOR-V/CodeDesk?style=flat&color=critical&logo=github"/></td>
            <td><img alt="Languages Count" src="https://img.shields.io/github/languages/count/PROfESSOR-V/CodeDesk?style=flat&color=green&logo=github"></td>
            <td><img alt="Contributors Count" src="https://img.shields.io/github/contributors/PROfESSOR-V/CodeDesk?style=flat&color=blue&logo=github"/></td>
        </tr>
    </tbody>
</table>

<div align="center">
  <img src="https://user-images.githubusercontent.com/74038190/212284115-f47cd8ff-2ffb-4b04-b5bf-4d1c14c0247f.gif" width="1000">
</div>


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

5) Create table for workspace simply run this query in SQL editor

```sql
-- Create the table for sheets (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.sheets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create the table for notes
CREATE TABLE public.notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Security: Enable Row Level Security (RLS) for notes
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Security: Define policies so users can only access their own notes
CREATE POLICY "Users can manage their own notes."
  ON public.notes FOR ALL
  USING ( auth.uid() = user_id )
  WITH CHECK ( auth.uid() = user_id );

-- Create a join table for saved sheets
CREATE TABLE public.user_saved_sheets (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sheet_id UUID REFERENCES public.sheets(id) ON DELETE CASCADE NOT NULL,
  saved_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  PRIMARY KEY (user_id, sheet_id)
);

-- Security: Enable RLS for the join table
ALTER TABLE public.user_saved_sheets ENABLE ROW LEVEL SECURITY;

-- Security: Define policies for the join table
CREATE POLICY "Users can manage their own saved sheets."
  ON public.user_saved_sheets FOR ALL
  USING ( auth.uid() = user_id )
  WITH CHECK ( auth.uid() = user_id );
```

<div align="center">
  <img src="https://user-images.githubusercontent.com/74038190/212284115-f47cd8ff-2ffb-4b04-b5bf-4d1c14c0247f.gif" width="1000">
</div>

## Getting Started (Frontend)

1. `cd client`
2. make .env file with `VITE_SUPABASE_URL` & `VITE_SUPABASE_ANON_KEY` & `VITE_API_URL=http://localhost:3000`
3. `npm install`
4. `npm run dev` – opens Vite dev server on <http://localhost:3000>

<div align="center">
  <img src="https://user-images.githubusercontent.com/74038190/212284115-f47cd8ff-2ffb-4b04-b5bf-4d1c14c0247f.gif" width="1000">
</div>

### 🙌 **Thank You, Contributors!**

Thanks to these amazing people who have contributed to the **CodeDesk** project:

  We love our contributors! If you'd like to help, please check out our [`CONTRIBUTE.md`](https://github.com/PROfESSOR-V/CodeDesk/blob/main/CONTRIBUTING%20.md) file for guidelines.

<!-- readme: contributors -start -->
<p align="center">
  <img src="https://contrib.rocks/image?repo=PROfESSOR-V/CodeDesk" width="200" />
</p>
<!-- readme: contributors -end -->

<p style="font-family:var(--ff-philosopher);font-size:3rem;"><b> Show some <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Red%20Heart.png" alt="Red Heart" width="40" height="40" /> by starring this awesome repository!
</p>

<div align="center">
  <img src="https://user-images.githubusercontent.com/74038190/212284115-f47cd8ff-2ffb-4b04-b5bf-4d1c14c0247f.gif" width="1000">
</div>

## 📬 Contact

For questions, suggestions, or collaboration, reach out via [LinkedIn](https://www.linkedin.com/in/vipul-agarwal-76571728b/) or [open an issue](https://github.com/PROfESSOR-V/CodeDesk/issues)!

<div align="center">
  <img src="https://user-images.githubusercontent.com/74038190/212284115-f47cd8ff-2ffb-4b04-b5bf-4d1c14c0247f.gif" width="1000">
</div>

## 💡 Suggestions & Feedback
Feel free to open issues or discussions if you have any feedback, feature suggestions, or want to collaborate!

<div align="center">
  <img src="https://user-images.githubusercontent.com/74038190/212284115-f47cd8ff-2ffb-4b04-b5bf-4d1c14c0247f.gif" width="1000">
</div>

## 📄 License

This project is licensed under the [MIT License](https://github.com/PROfESSOR-V/CodeDesk/blob/main/LICENSE).

<div align="center">
  <img src="https://user-images.githubusercontent.com/74038190/212284115-f47cd8ff-2ffb-4b04-b5bf-4d1c14c0247f.gif" width="1000">
</div>

<h1 align="center"><img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Glowing%20Star.png" alt="Glowing Star" width="25" height="25" /> Give us a Star and let's make magic! <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Glowing%20Star.png" alt="Glowing Star" width="25" height="25" /></h1>
<div align="center">
    <a href="#top">
        <img src="https://img.shields.io/badge/Back%20to%20Top-000000?style=for-the-badge&logo=github&logoColor=white" alt="Back to Top">
    </a><br>
     <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Mirror%20Ball.png" alt="Mirror Ball" width="150" height="150" />
</div>

<div align="center">
  <img src="https://user-images.githubusercontent.com/74038190/212284115-f47cd8ff-2ffb-4b04-b5bf-4d1c14c0247f.gif" width="1000">
</div>

<h2>Project Admin:</h2>
<table>
<tr>
<td align="center">
<a href="https://github.com/PROfESSOR-V"><img src="https://avatars.githubusercontent.com/u/172966114?v=4" height="140px" width="140px" alt="Vipul Agarwal"></a><br><sub><b>Vipul Agarwal</b><br><a href="https://www.linkedin.com/in/vipul-agarwal-76571728b/"><img src="https://github-production-user-asset-6210df.s3.amazonaws.com/73993775/278833250-adb040ea-e3ef-446e-bcd4-3e8d7d4c0176.png" width="45px" height="45px"></a></sub>
</td>
</tr>
</table>

<div align="center">
  <img src="https://user-images.githubusercontent.com/74038190/212284115-f47cd8ff-2ffb-4b04-b5bf-4d1c14c0247f.gif" width="500">
</div>

<p align="center">

  **👨‍💻 Developed By**  **❤️Vipul Agarwal and contributors❤️** 
[GitHub](https://github.com/PROfESSOR-V) | [LinkedIn](https://www.linkedin.com/in/vipul-agarwal-76571728b/)
</p>

<div align="center">
  <img src="https://user-images.githubusercontent.com/74038190/212284115-f47cd8ff-2ffb-4b04-b5bf-4d1c14c0247f.gif" width="1000">
</div>

> [🔝 Back to Top](#top)
