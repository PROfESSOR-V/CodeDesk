# CodeChef Integration Database Schema

This document describes the database changes required for the CodeChef integration feature.

## Overview

The CodeChef integration adds 7 new tables to store comprehensive user data including profiles, contest history, activity heatmaps, badges, and problem-solving statistics.

## New Tables

### 1. `codechef_profiles` (Main Profile Table)
Stores basic CodeChef user profile information.

**Key Columns:**
- `supabase_id` (UUID, PK) - Links to auth.users
- `username` (TEXT, UNIQUE) - CodeChef username
- `profile_name` (TEXT) - Display name
- `rating` (INTEGER) - Current rating (0-5000)
- `total_questions` (INTEGER) - Total problems attempted
- `total_contests` (INTEGER) - Contests participated
- `badges` (JSONB) - User badges array
- `heatmap` (JSONB) - Activity heatmap data
- `raw_stats` (JSONB) - Additional profile metadata
- `updated_at` (TIMESTAMP) - Last update time for 5-hour refresh logic

**Purpose:** Central profile data and metadata storage

### 2. `codechef_rating_history`
Tracks rating progression through contests.

**Key Columns:**
- `contest_code` (VARCHAR) - Unique contest identifier
- `contest_name` (VARCHAR) - Human-readable contest name
- `old_rating/new_rating` (INTEGER) - Rating before/after contest
- `rating_change` (INTEGER) - Net rating change
- `global_rank/country_rank` (INTEGER) - Contest placement

**Purpose:** Contest performance tracking and rating graphs

### 3. `codechef_contests`
Stores contest participation details.

**Key Columns:**
- `contest_name` (VARCHAR) - Contest identifier
- `problems_solved` (INTEGER) - Problems solved in contest
- `contest_date` (TIMESTAMP) - Contest date
- `difficulty` (TEXT) - Contest difficulty level

**Purpose:** Contest history and participation statistics

### 4. `codechef_heatmap`
Daily activity data for contribution visualization.

**Key Columns:**
- `date` (DATE) - Activity date
- `count` (INTEGER) - Number of submissions
- `level` (INTEGER) - Activity intensity (0-4)

**Purpose:** Activity heatmap generation for portfolio display

### 5. `codechef_badges`
User achievements and badges.

**Key Columns:**
- `badge_name` (VARCHAR) - Badge title
- `badge_value` (VARCHAR) - Badge metadata/value

**Purpose:** Achievement tracking and gamification

### 6. `codechef_total_problems`
Individual problem submission records.

**Key Columns:**
- `problem_code` (VARCHAR) - Problem identifier
- `submission_time` (TIMESTAMP) - When submitted
- `result` (NUMERIC) - Score/result (0-100)
- `language` (VARCHAR) - Programming language used
- `difficulty_rating` (BIGINT) - Problem difficulty from API

**Purpose:** Detailed submission tracking and analytics

### 7. `codechef_scraping_logs`
Operational logs for monitoring and debugging.

**Key Columns:**
- `username` (VARCHAR) - Target username
- `status` (VARCHAR) - Operation status
- `execution_time_ms` (INTEGER) - Performance metrics
- `data_points_collected` (JSONB) - Data collection summary
- `error_message` (TEXT) - Error details if failed

**Purpose:** System monitoring and debugging

## Relationships

```
auth.users (1) ←→ (1) codechef_profiles
    ↓
    ├── (1:N) codechef_rating_history
    ├── (1:N) codechef_contests  
    ├── (1:N) codechef_heatmap
    ├── (1:N) codechef_badges
    └── (1:N) codechef_total_problems
```

## Indexes

Performance-optimized indexes for common query patterns:
- `idx_codechef_profiles_username` - Username lookups
- `idx_codechef_profiles_updated_at` - Refresh time checks
- `idx_codechef_heatmap_date` - Heatmap date ranges
- `idx_codechef_rating_history_date` - Rating history queries
- `idx_codechef_total_problems_time` - Recent activity queries

## Security

**Row Level Security (RLS):** All tables have RLS enabled with policies ensuring users can only access their own data.

**Policies Applied:**
- SELECT: `auth.uid() = supabase_id`
- INSERT: `auth.uid() = supabase_id`  
- UPDATE: `auth.uid() = supabase_id`

## Data Flow

1. **Scraping Trigger:** Frontend checks `updated_at` for 5-hour refresh
2. **Data Collection:** Selenium scraper extracts profile, contests, heatmap, badges
3. **API Integration:** Problem difficulty fetched from CodeChef API
4. **Batch Storage:** Data stored in batches (50 records) for efficiency
5. **Portfolio Display:** Aggregated data shown in user dashboard

## Integration Points

### With Existing Tables:
- `total_stats` - Aggregated statistics across all platforms
- `profiles` - User profile information and platform connections
- `auth.users` - User authentication and identification

### With External APIs:
- CodeChef Profile API - User profile data
- CodeChef Problems API - Problem difficulty ratings
- Internal scraper endpoints - Data collection orchestration

## Performance Considerations

**Optimization Strategies:**
- Batch inserts (50 records per transaction)
- Conditional updates (5-hour refresh intervals)
- Efficient indexing on query columns
- JSONB for flexible metadata storage
- Cascading deletes for data consistency

**Monitoring:**
- Scraping logs table for performance tracking
- Execution time metrics in logs
- Error rate monitoring through status fields

## Migration Notes

**Pre-Migration:**
- Ensure UUID extension is available
- Verify auth.users table exists
- Check RLS is supported

**Post-Migration:**
- Verify foreign key constraints
- Test RLS policies with sample data
- Confirm index creation
- Validate permissions for authenticated users

## Rollback

To rollback this migration:

```sql
DROP TABLE IF EXISTS public.codechef_scraping_logs;
DROP TABLE IF EXISTS public.codechef_total_problems;
DROP TABLE IF EXISTS public.codechef_badges;
DROP TABLE IF EXISTS public.codechef_heatmap;
DROP TABLE IF EXISTS public.codechef_contests;
DROP TABLE IF EXISTS public.codechef_rating_history;
DROP TABLE IF EXISTS public.codechef_profiles;
```

**⚠️ Warning:** This will permanently delete all CodeChef user data.