import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Check if Supabase is configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey)

// Create Supabase client only if configured
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        redirectTo: typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined,
      },
    })
  : null

export type Database = {
  public: {
    Tables: {
      portfolios: {
        Row: {
          id: string
          user_id: string
          name: string
          positions: any[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          positions?: any[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          positions?: any[]
          created_at?: string
          updated_at?: string
        }
      }
      alerts: {
        Row: {
          id: string
          user_id: string
          position_id: string
          token_symbol: string
          token_name: string
          contract_address: string
          target_price: number
          is_one_time: boolean
          sound_enabled: boolean
          sound_file: string | null
          volume: number
          browser_notification: boolean
          email_notification: boolean
          email_address: string | null
          triggered: boolean
          created_at: string
          last_triggered: string | null
        }
        Insert: {
          id?: string
          user_id: string
          position_id: string
          token_symbol: string
          token_name: string
          contract_address: string
          target_price: number
          is_one_time?: boolean
          sound_enabled?: boolean
          sound_file?: string | null
          volume?: number
          browser_notification?: boolean
          email_notification?: boolean
          email_address?: string | null
          triggered?: boolean
          created_at?: string
          last_triggered?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          position_id?: string
          token_symbol?: string
          token_name?: string
          contract_address?: string
          target_price?: number
          is_one_time?: boolean
          sound_enabled?: boolean
          sound_file?: string | null
          volume?: number
          browser_notification?: boolean
          email_notification?: boolean
          email_address?: string | null
          triggered?: boolean
          created_at?: string
          last_triggered?: string | null
        }
      }
      email_settings: {
        Row: {
          id: string
          user_id: string
          enabled: boolean
          email_address: string
          verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          enabled?: boolean
          email_address: string
          verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          enabled?: boolean
          email_address?: string
          verified?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
