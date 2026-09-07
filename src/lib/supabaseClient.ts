import { createClient } from '@supabase/supabase-js'

// This is a static site with no server, so the anon key ships in the JS bundle
// by design — that's how Supabase's client-side model works. Data protection
// comes from the Row Level Security policies on the project itself, not from
// hiding this key. See db/schema.sql for the policies applied to this project.
const SUPABASE_URL = 'https://bkgelxjmfccnlxyfjeux.supabase.co'
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrZ2VseGptZmNjbmx4eWZqZXV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4MDU1NzksImV4cCI6MjEwNDM4MTU3OX0.DHgh1zXhktfsHopwmr3qarQ9YBWSrp9VhPGBhpZtg3Y'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
