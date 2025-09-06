# Database Testing Guide

## Verify Migration Success:
```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE 'codechef_%';

-- Verify relationships
SELECT * FROM information_schema.table_constraints 
WHERE table_name LIKE 'codechef_%';