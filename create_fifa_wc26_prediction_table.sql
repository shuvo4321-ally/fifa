-- Run this in your Supabase SQL Editor to create the table

CREATE TABLE IF NOT EXISTS public.fifa_wc26_prediction (
    id SERIAL PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    country TEXT NOT NULL,
    metrics JSONB,
    players JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Optional: If you want to insert from the client securely using the Anon key without restrictions, 
-- you might want to disable Row Level Security (RLS) temporarily, or create a policy:
-- ALTER TABLE public.fifa_wc26_prediction DISABLE ROW LEVEL SECURITY;
