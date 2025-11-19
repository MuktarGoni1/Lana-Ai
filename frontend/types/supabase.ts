// Supabase database types
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      guardians: {
        Row: {
          id: string
          email: string
          child_uid: string | null
          weekly_report: boolean | null
          monthly_report: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          email: string
          child_uid?: string | null
          weekly_report?: boolean | null
          monthly_report?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          child_uid?: string | null
          weekly_report?: boolean | null
          monthly_report?: boolean | null
          created_at?: string | null
        }
      }
      "Guest searches": {
        Row: {
          id: string
          created_at: string | null
          seession_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string | null
          seession_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string | null
          seession_id?: string | null
        }
      }
      searches: {
        Row: {
          id: string
          uid: string
          title: string
          created_at: string | null
        }
        Insert: {
          id?: string
          uid: string
          title: string
          created_at?: string | null
        }
        Update: {
          id?: string
          uid?: string
          title?: string
          created_at?: string | null
        }
      }
      users: {
        Row: {
          id: string
          email: string
          user_metadata: Json | null
          created_at: string | null
        }
        Insert: {
          id?: string
          email: string
          user_metadata?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          user_metadata?: Json | null
          created_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type Guardians = Database['public']['Tables']['guardians']['Row']
export type InsertGuardian = Database['public']['Tables']['guardians']['Insert']
export type UpdateGuardian = Database['public']['Tables']['guardians']['Update']

export type GuestSearches = Database['public']['Tables']['Guest searches']['Row']
export type InsertGuestSearch = Database['public']['Tables']['Guest searches']['Insert']
export type UpdateGuestSearch = Database['public']['Tables']['Guest searches']['Update']

export type Searches = Database['public']['Tables']['searches']['Row']
export type InsertSearch = Database['public']['Tables']['searches']['Insert']
export type UpdateSearch = Database['public']['Tables']['searches']['Update']

export type Users = Database['public']['Tables']['users']['Row']
export type InsertUser = Database['public']['Tables']['users']['Insert']
export type UpdateUser = Database['public']['Tables']['users']['Update']