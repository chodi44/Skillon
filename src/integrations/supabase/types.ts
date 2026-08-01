export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      coding_profiles: {
        Row: {
          created_at: string
          handle: string
          id: string
          platform: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          handle: string
          id?: string
          platform: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          handle?: string
          id?: string
          platform?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      coding_stats: {
        Row: {
          created_at: string
          easy: number
          error: string | null
          extra: Json
          fetched_at: string
          handle: string
          hard: number
          id: string
          medium: number
          platform: string
          streak: number
          total_solved: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          easy?: number
          error?: string | null
          extra?: Json
          fetched_at?: string
          handle: string
          hard?: number
          id?: string
          medium?: number
          platform: string
          streak?: number
          total_solved?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          easy?: number
          error?: string | null
          extra?: Json
          fetched_at?: string
          handle?: string
          hard?: number
          id?: string
          medium?: number
          platform?: string
          streak?: number
          total_solved?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_reads: {
        Row: {
          notification_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          notification_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          notification_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_reads_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          audience: string
          channel: string
          created_at: string
          created_by: string | null
          id: string
          links: Json
          message: string
          priority: string
          title: string
        }
        Insert: {
          audience?: string
          channel?: string
          created_at?: string
          created_by?: string | null
          id?: string
          links?: Json
          message: string
          priority?: string
          title: string
        }
        Update: {
          audience?: string
          channel?: string
          created_at?: string
          created_by?: string | null
          id?: string
          links?: Json
          message?: string
          priority?: string
          title?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          learning_track: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          learning_track?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          learning_track?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      personal_tracks: {
        Row: {
          id: string
          user_id: string
          name: string
          color: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          color: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          color?: string
          created_at?: string
        }
        Relationships: []
      }
      personal_items: {
        Row: {
          id: string
          track_id: string
          title: string
          description: string | null
          link: string | null
          done: boolean
          created_at: string
        }
        Insert: {
          id?: string
          track_id: string
          title: string
          description?: string | null
          link?: string | null
          done?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          track_id?: string
          title?: string
          description?: string | null
          link?: string | null
          done?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "personal_items_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "personal_tracks"
            referencedColumns: ["id"]
          }
        ]
      }
      personal_notes: {
        Row: {
          id: string
          user_id: string
          title: string
          body: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          body: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          body?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      personal_alarms: {
        Row: {
          id: string
          user_id: string
          time: string
          label: string
          enabled: boolean
          days: number[] | null
          last_fired: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          time: string
          label: string
          enabled?: boolean
          days?: number[] | null
          last_fired?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          time?: string
          label?: string
          enabled?: boolean
          days?: number[] | null
          last_fired?: string | null
          created_at?: string
        }
        Relationships: []
      }
      timetable_slots: {
        Row: {
          id: string
          user_id: string
          day: number
          start_time: string
          end_time: string
          title: string
          notes: string | null
          notify: boolean
          last_notified: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          day: number
          start_time: string
          end_time: string
          title: string
          notes?: string | null
          notify?: boolean
          last_notified?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          day?: number
          start_time?: string
          end_time?: string
          title?: string
          notes?: string | null
          notify?: boolean
          last_notified?: string | null
          created_at?: string
        }
        Relationships: []
      }
      mock_tests: {
        Row: {
          id: string
          title: string
          description: string | null
          duration_minutes: number
          total_marks: number
          is_published: boolean
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          duration_minutes: number
          total_marks: number
          is_published?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          duration_minutes?: number
          total_marks?: number
          is_published?: boolean
          created_at?: string
        }
        Relationships: []
      }
      mock_questions: {
        Row: {
          id: string
          test_id: string
          question_text: string
          question_type: string
          options: Json | null
          correct_answer: string
          positive_marks: number
          negative_marks: number
          created_at: string
        }
        Insert: {
          id?: string
          test_id: string
          question_text: string
          question_type?: string
          options?: Json | null
          correct_answer: string
          positive_marks?: number
          negative_marks?: number
          created_at?: string
        }
        Update: {
          id?: string
          test_id?: string
          question_text?: string
          question_type?: string
          options?: Json | null
          correct_answer?: string
          positive_marks?: number
          negative_marks?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mock_questions_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "mock_tests"
            referencedColumns: ["id"]
          }
        ]
      }
      mock_attempts: {
        Row: {
          id: string
          test_id: string
          user_id: string
          start_time: string
          end_time: string | null
          score: number | null
          responses: Json | null
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          test_id: string
          user_id: string
          start_time?: string
          end_time?: string | null
          score?: number | null
          responses?: Json | null
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          test_id?: string
          user_id?: string
          start_time?: string
          end_time?: string | null
          score?: number | null
          responses?: Json | null
          status?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mock_attempts_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "mock_tests"
            referencedColumns: ["id"]
          }
        ]
      }
      push_subscriptions: {
        Row: {
          id: string
          user_id: string
          endpoint: string
          p256dh: string
          auth: string
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          endpoint: string
          p256dh: string
          auth: string
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          endpoint?: string
          p256dh?: string
          auth?: string
          user_agent?: string | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "super_admin" | "student"
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
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
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

export const Constants = {
  public: {
    Enums: {
      app_role: ["super_admin", "student"],
    },
  },
} as const
