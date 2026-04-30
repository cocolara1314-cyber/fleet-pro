import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xzohwivilfwkvemkkfqo.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6b2h3aXZpbGZ3a3ZlbWtrZnFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1MzExMzQsImV4cCI6MjA5MzEwNzEzNH0.hAFz83283vvp9KcNb4sCCBRpfRnfusi9afBmM7GQZ3E'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
