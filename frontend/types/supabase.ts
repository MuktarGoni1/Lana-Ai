export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          id: string
          operation: string
          details: Json | null
          user_id: string | null
          ip_address: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          operation: string
          details?: Json | null
          user_id?: string | null
          ip_address?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          operation?: string
          details?: Json | null
          user_id?: string | null
          ip_address?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          id: string
          name: string | null
          email: string
          subject: string | null
          message: string
          source: string | null
          status: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name?: string | null
          email: string
          subject?: string | null
          message: string
          source?: string | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string | null
          email?: string
          subject?: string | null
          message?: string
          source?: string | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      demo_requests: {
        Row: {
          id: string
          name: string
          email: string
          role: string | null
          company: string | null
          message: string | null
          source: string | null
          status: string | null
          scheduled_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          email: string
          role?: string | null
          company?: string | null
          message?: string | null
          source?: string | null
          status?: string | null
          scheduled_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          email?: string
          role?: string | null
          company?: string | null
          message?: string | null
          source?: string | null
          status?: string | null
          scheduled_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      guardian_reports: {
        Row: {
          id: string
          user_id: string
          guardian_email: string
          report_type: string | null
          report_payload: Json
          period_start: string
          period_end: string
          created_at: string | null
          sent: boolean | null
        }
        Insert: {
          id?: string
          user_id: string
          guardian_email: string
          report_type?: string | null
          report_payload: Json
          period_start: string
          period_end: string
          created_at?: string | null
          sent?: boolean | null
        }
        Update: {
          id?: string
          user_id?: string
          guardian_email?: string
          report_type?: string | null
          report_payload?: Json
          period_start?: string
          period_end?: string
          created_at?: string | null
          sent?: boolean | null
        }
        Relationships: []
      }
      guardian_settings: {
        Row: {
          id: string
          email: string
          weekly_report: boolean | null
          monthly_report: boolean | null
          created_at: string | null
          user_id: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          email: string
          weekly_report?: boolean | null
          monthly_report?: boolean | null
          created_at?: string | null
          user_id?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          weekly_report?: boolean | null
          monthly_report?: boolean | null
          created_at?: string | null
          user_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      lesson_chat_messages: {
        Row: {
          id: string
          topic_id: string
          user_id: string
          role: string
          content: string
          created_at: string | null
        }
        Insert: {
          id?: string
          topic_id: string
          user_id: string
          role: string
          content: string
          created_at?: string | null
        }
        Update: {
          id?: string
          topic_id?: string
          user_id?: string
          role?: string
          content?: string
          created_at?: string | null
        }
        Relationships: []
      }
      lesson_units: {
        Row: {
          id: string
          topic_id: string
          lesson_content: Json | null
          video_url: string | null
          video_ready: boolean | null
          audio_url: string | null
          audio_ready: boolean | null
          is_ready: boolean | null
          generated_at: string | null
          refreshed_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          topic_id: string
          lesson_content?: Json | null
          video_url?: string | null
          video_ready?: boolean | null
          audio_url?: string | null
          audio_ready?: boolean | null
          is_ready?: boolean | null
          generated_at?: string | null
          refreshed_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          topic_id?: string
          lesson_content?: Json | null
          video_url?: string | null
          video_ready?: boolean | null
          audio_url?: string | null
          audio_ready?: boolean | null
          is_ready?: boolean | null
          generated_at?: string | null
          refreshed_at?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          id: string
          email: string
          source: string | null
          tags: string[] | null
          status: string | null
          subscribed_at: string | null
          unsubscribed_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          email: string
          source?: string | null
          tags?: string[] | null
          status?: string | null
          subscribed_at?: string | null
          unsubscribed_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          source?: string | null
          tags?: string[] | null
          status?: string | null
          subscribed_at?: string | null
          unsubscribed_at?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          full_name: string | null
          role: string | null
          parent_id: string | null
          created_at: string | null
          diagnostic_completed: boolean | null
          is_active: boolean | null
          age: number | null
          grade: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          full_name?: string | null
          role?: string | null
          parent_id?: string | null
          created_at?: string | null
          diagnostic_completed?: boolean | null
          is_active?: boolean | null
          age?: number | null
          grade?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          full_name?: string | null
          role?: string | null
          parent_id?: string | null
          created_at?: string | null
          diagnostic_completed?: boolean | null
          is_active?: boolean | null
          age?: number | null
          grade?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      quiz_attempts: {
        Row: {
          id: string
          topic_id: string
          user_id: string
          score: number
          total: number
          answers: Json | null
          attempted_at: string | null
        }
        Insert: {
          id?: string
          topic_id: string
          user_id: string
          score: number
          total: number
          answers?: Json | null
          attempted_at?: string | null
        }
        Update: {
          id?: string
          topic_id?: string
          user_id?: string
          score?: number
          total?: number
          answers?: Json | null
          attempted_at?: string | null
        }
        Relationships: []
      }
      quiz_questions: {
        Row: {
          id: string
          topic_id: string
          questions: Json
          generated_at: string | null
        }
        Insert: {
          id?: string
          topic_id: string
          questions: Json
          generated_at?: string | null
        }
        Update: {
          id?: string
          topic_id?: string
          questions?: Json
          generated_at?: string | null
        }
        Relationships: []
      }
      searches: {
        Row: {
          id: string
          user_id: string
          title: string
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          created_at?: string | null
        }
        Relationships: []
      }
      term_plans: {
        Row: {
          id: string
          user_id: string
          subject: string
          grade: string | null
          term: string | null
          raw_syllabus: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          subject: string
          grade?: string | null
          term?: string | null
          raw_syllabus?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          subject?: string
          grade?: string | null
          term?: string | null
          raw_syllabus?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      topics: {
        Row: {
          id: string
          user_id: string
          term_plan_id: string | null
          subject_name: string
          title: string
          week_number: number | null
          order_index: number | null
          status: string | null
          unlocked_at: string | null
          completed_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          term_plan_id?: string | null
          subject_name: string
          title: string
          week_number?: number | null
          order_index?: number | null
          status?: string | null
          unlocked_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          term_plan_id?: string | null
          subject_name?: string
          title?: string
          week_number?: number | null
          order_index?: number | null
          status?: string | null
          unlocked_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_events: {
        Row: {
          id: string
          user_id: string
          session_id: string | null
          event_type: string
          metadata: Json | null
          user_agent: string | null
          url: string | null
          ip_address: string | null
          timestamp: string
        }
        Insert: {
          id?: string
          user_id?: string
          session_id?: string | null
          event_type: string
          metadata?: Json | null
          user_agent?: string | null
          url?: string | null
          ip_address?: string | null
          timestamp?: string
        }
        Update: {
          id?: string
          user_id?: string
          session_id?: string | null
          event_type?: string
          metadata?: Json | null
          user_agent?: string | null
          url?: string | null
          ip_address?: string | null
          timestamp?: string
        }
        Relationships: []
      }
      user_learning_profiles: {
        Row: {
          user_id: string
          learning_profile: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          user_id: string
          learning_profile?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          user_id?: string
          learning_profile?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          id: string
          email: string
          user_metadata: Json | null
          study_plan: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          email: string
          user_metadata?: Json | null
          study_plan?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          user_metadata?: Json | null
          study_plan?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export type InsertGuardianSettings = TablesInsert<'guardian_settings'>

export const Constants = {
  public: {
    Enums: {},
  },
} as const
