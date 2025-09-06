-- migrations/001_add_codechef_tables.sql
-- CodeChef Integration Database Migration
-- Created: [DATE]
-- Description: Adds tables for CodeChef user data, contest history, and activity tracking

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Main CodeChef profiles table
CREATE TABLE IF NOT EXISTS public.codechef_profiles (
  supabase_id uuid NOT NULL,
  profile_name text,
  username text UNIQUE,
  total_questions integer DEFAULT 0 CHECK (total_questions >= 0),
  rating integer DEFAULT 0 CHECK (rating >= 0 AND rating <= 5000),
  total_contests integer DEFAULT 0 CHECK (total_contests >= 0),
  badges jsonb DEFAULT '[]'::jsonb,
  heatmap jsonb DEFAULT '[]'::jsonb,
  today_count integer DEFAULT 0 CHECK (today_count >= 0),
  raw_stats jsonb DEFAULT '{}'::jsonb,
  created_at date,
  updated_at timestamp with time zone DEFAULT now(),
  last_scraped_at date,
  
  CONSTRAINT codechef_profiles_pkey PRIMARY KEY (supabase_id),
  CONSTRAINT codechef_profiles_supabase_id_fkey FOREIGN KEY (supabase_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Contest rating history table
CREATE TABLE IF NOT EXISTS public.codechef_rating_history (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  supabase_id uuid NOT NULL,
  contest_code character varying,
  contest_name character varying,
  contest_date timestamp with time zone,
  old_rating integer DEFAULT 0,
  new_rating integer DEFAULT 0,
  rating_change integer DEFAULT 0,
  global_rank integer,
  country_rank integer,
  created_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT codechef_rating_history_pkey PRIMARY KEY (id),
  CONSTRAINT codechef_rating_history_supabase_id_fkey FOREIGN KEY (supabase_id) REFERENCES public.codechef_profiles(supabase_id) ON DELETE CASCADE
);

-- Contest participation table
CREATE TABLE IF NOT EXISTS public.codechef_contests (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  supabase_id uuid NOT NULL,
  contest_name character varying,
  problems_solved integer DEFAULT 0 CHECK (problems_solved >= 0),
  contest_date timestamp with time zone,
  difficulty text,
  created_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT codechef_contests_pkey PRIMARY KEY (id),
  CONSTRAINT codechef_contests_supabase_id_fkey FOREIGN KEY (supabase_id) REFERENCES public.codechef_profiles(supabase_id) ON DELETE CASCADE
);

-- Activity heatmap table
CREATE TABLE IF NOT EXISTS public.codechef_heatmap (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  supabase_id uuid NOT NULL,
  date date,
  count integer DEFAULT 0,
  level integer DEFAULT 0 CHECK (level >= 0 AND level <= 4),
  created_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT codechef_heatmap_pkey PRIMARY KEY (id),
  CONSTRAINT codechef_heatmap_supabase_id_fkey FOREIGN KEY (supabase_id) REFERENCES public.codechef_profiles(supabase_id) ON DELETE CASCADE
);

-- User badges table
CREATE TABLE IF NOT EXISTS public.codechef_badges (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  supabase_id uuid NOT NULL,
  badge_name character varying,
  badge_value character varying,
  created_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT codechef_badges_pkey PRIMARY KEY (id),
  CONSTRAINT codechef_badges_supabase_id_fkey FOREIGN KEY (supabase_id) REFERENCES public.codechef_profiles(supabase_id) ON DELETE CASCADE
);

-- Problem submissions table
CREATE TABLE IF NOT EXISTS public.codechef_total_problems (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  supabase_id uuid NOT NULL,
  submission_time timestamp with time zone,
  problem_code character varying NOT NULL,
  result numeric DEFAULT 0,
  language character varying,
  difficulty_rating bigint,
  created_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT codechef_total_problems_pkey PRIMARY KEY (id),
  CONSTRAINT codechef_total_problems_supabase_id_fkey FOREIGN KEY (supabase_id) REFERENCES public.codechef_profiles(supabase_id) ON DELETE CASCADE
);

-- Scraping logs table for monitoring and debugging
CREATE TABLE IF NOT EXISTS public.codechef_scraping_logs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  username character varying NOT NULL,
  profile_id uuid,
  scraping_started_at timestamp with time zone NOT NULL,
  scraping_completed_at timestamp with time zone,
  status character varying NOT NULL DEFAULT 'started'::character varying,
  error_message text,
  data_points_collected jsonb DEFAULT '{}'::jsonb,
  scraper_version character varying,
  strategy_used integer,
  execution_time_ms integer,
  is_refresh boolean DEFAULT false,
  data_changes jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT codechef_scraping_logs_pkey PRIMARY KEY (id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_codechef_profiles_username ON public.codechef_profiles(username);
CREATE INDEX IF NOT EXISTS idx_codechef_profiles_updated_at ON public.codechef_profiles(updated_at);
CREATE INDEX IF NOT EXISTS idx_codechef_heatmap_date ON public.codechef_heatmap(supabase_id, date);
CREATE INDEX IF NOT EXISTS idx_codechef_rating_history_date ON public.codechef_rating_history(supabase_id, contest_date);
CREATE INDEX IF NOT EXISTS idx_codechef_total_problems_time ON public.codechef_total_problems(supabase_id, submission_time);
CREATE INDEX IF NOT EXISTS idx_codechef_scraping_logs_status ON public.codechef_scraping_logs(status, scraping_started_at);

-- Add RLS (Row Level Security) policies
ALTER TABLE public.codechef_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.codechef_rating_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.codechef_contests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.codechef_heatmap ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.codechef_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.codechef_total_problems ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (users can only access their own data)
CREATE POLICY "Users can view own codechef profile" ON public.codechef_profiles
  FOR SELECT USING (auth.uid() = supabase_id);

CREATE POLICY "Users can insert own codechef profile" ON public.codechef_profiles
  FOR INSERT WITH CHECK (auth.uid() = supabase_id);

CREATE POLICY "Users can update own codechef profile" ON public.codechef_profiles
  FOR UPDATE USING (auth.uid() = supabase_id);

CREATE POLICY "Users can view own codechef data" ON public.codechef_rating_history
  FOR SELECT USING (auth.uid() = supabase_id);

CREATE POLICY "Users can insert own codechef rating history" ON public.codechef_rating_history
  FOR INSERT WITH CHECK (auth.uid() = supabase_id);

CREATE POLICY "Users can view own codechef contests" ON public.codechef_contests
  FOR SELECT USING (auth.uid() = supabase_id);

CREATE POLICY "Users can insert own codechef contests" ON public.codechef_contests
  FOR INSERT WITH CHECK (auth.uid() = supabase_id);

CREATE POLICY "Users can view own codechef heatmap" ON public.codechef_heatmap
  FOR SELECT USING (auth.uid() = supabase_id);

CREATE POLICY "Users can insert own codechef heatmap" ON public.codechef_heatmap
  FOR INSERT WITH CHECK (auth.uid() = supabase_id);

CREATE POLICY "Users can view own codechef badges" ON public.codechef_badges
  FOR SELECT USING (auth.uid() = supabase_id);

CREATE POLICY "Users can insert own codechef badges" ON public.codechef_badges
  FOR INSERT WITH CHECK (auth.uid() = supabase_id);

CREATE POLICY "Users can view own codechef problems" ON public.codechef_total_problems
  FOR SELECT USING (auth.uid() = supabase_id);

CREATE POLICY "Users can insert own codechef problems" ON public.codechef_total_problems
  FOR INSERT WITH CHECK (auth.uid() = supabase_id);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.codechef_profiles TO authenticated;
GRANT ALL ON public.codechef_rating_history TO authenticated;
GRANT ALL ON public.codechef_contests TO authenticated;
GRANT ALL ON public.codechef_heatmap TO authenticated;
GRANT ALL ON public.codechef_badges TO authenticated;
GRANT ALL ON public.codechef_total_problems TO authenticated;