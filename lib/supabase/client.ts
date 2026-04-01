import { createClient } from '@supabase/supabase-js'
import type { SupabaseDatabase } from '@/lib/supabase/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<SupabaseDatabase>(supabaseUrl, supabaseAnonKey)
