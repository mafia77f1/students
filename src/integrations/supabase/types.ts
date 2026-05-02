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
      challenges: {
        Row: {
          challenged_id: string
          challenged_xp: number | null
          challenger_id: string
          challenger_xp: number | null
          created_at: string | null
          duration_days: number | null
          duration_minutes: number
          end_date: string | null
          ended_at: string | null
          id: string
          started_at: string | null
          status: string
          subject: string
          title: string | null
          winner_id: string | null
        }
        Insert: {
          challenged_id: string
          challenged_xp?: number | null
          challenger_id: string
          challenger_xp?: number | null
          created_at?: string | null
          duration_days?: number | null
          duration_minutes?: number
          end_date?: string | null
          ended_at?: string | null
          id?: string
          started_at?: string | null
          status?: string
          subject: string
          title?: string | null
          winner_id?: string | null
        }
        Update: {
          challenged_id?: string
          challenged_xp?: number | null
          challenger_id?: string
          challenger_xp?: number | null
          created_at?: string | null
          duration_days?: number | null
          duration_minutes?: number
          end_date?: string | null
          ended_at?: string | null
          id?: string
          started_at?: string | null
          status?: string
          subject?: string
          title?: string | null
          winner_id?: string | null
        }
        Relationships: []
      }
      daily_goals: {
        Row: {
          created_at: string | null
          date: string | null
          description: string
          id: string
          is_completed: boolean | null
          subject: string
          target_chapters: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date?: string | null
          description: string
          id?: string
          is_completed?: boolean | null
          subject: string
          target_chapters?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          date?: string | null
          description?: string
          id?: string
          is_completed?: boolean | null
          subject?: string
          target_chapters?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      direct_messages: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          receiver_id: string
          sender_id: string
          text: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          receiver_id: string
          sender_id: string
          text: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          receiver_id?: string
          sender_id?: string
          text?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          avatar_url: string | null
          country: string | null
          created_at: string | null
          grade: string | null
          id: string
          is_premium: boolean
          last_book: string | null
          level: number | null
          name: string
          onboarding_completed: boolean | null
          onboarding_tour_completed: boolean | null
          premium_seen: boolean
          premium_until: string | null
          rank: string | null
          role: string | null
          subjects: string[] | null
          total_hours: number | null
          total_xp: number | null
          updated_at: string | null
          username: string | null
          weekly_xp: number | null
        }
        Insert: {
          age?: number | null
          avatar_url?: string | null
          country?: string | null
          created_at?: string | null
          grade?: string | null
          id: string
          is_premium?: boolean
          last_book?: string | null
          level?: number | null
          name?: string
          onboarding_completed?: boolean | null
          onboarding_tour_completed?: boolean | null
          premium_seen?: boolean
          premium_until?: string | null
          rank?: string | null
          role?: string | null
          subjects?: string[] | null
          total_hours?: number | null
          total_xp?: number | null
          updated_at?: string | null
          username?: string | null
          weekly_xp?: number | null
        }
        Update: {
          age?: number | null
          avatar_url?: string | null
          country?: string | null
          created_at?: string | null
          grade?: string | null
          id?: string
          is_premium?: boolean
          last_book?: string | null
          level?: number | null
          name?: string
          onboarding_completed?: boolean | null
          onboarding_tour_completed?: boolean | null
          premium_seen?: boolean
          premium_until?: string | null
          rank?: string | null
          role?: string | null
          subjects?: string[] | null
          total_hours?: number | null
          total_xp?: number | null
          updated_at?: string | null
          username?: string | null
          weekly_xp?: number | null
        }
        Relationships: []
      }
      room_messages: {
        Row: {
          created_at: string | null
          id: string
          room_id: string
          text: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          room_id: string
          text: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          room_id?: string
          text?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "study_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      room_participants: {
        Row: {
          id: string
          joined_at: string | null
          room_id: string
          status: string | null
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string | null
          room_id: string
          status?: string | null
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string | null
          room_id?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_participants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "study_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_grades: {
        Row: {
          academic_year: string | null
          created_at: string | null
          exam_type: string | null
          grade_value: number | null
          id: string
          max_grade: number | null
          notes: string | null
          semester: string | null
          subject: string
          term: string | null
          user_id: string
        }
        Insert: {
          academic_year?: string | null
          created_at?: string | null
          exam_type?: string | null
          grade_value?: number | null
          id?: string
          max_grade?: number | null
          notes?: string | null
          semester?: string | null
          subject: string
          term?: string | null
          user_id: string
        }
        Update: {
          academic_year?: string | null
          created_at?: string | null
          exam_type?: string | null
          grade_value?: number | null
          id?: string
          max_grade?: number | null
          notes?: string | null
          semester?: string | null
          subject?: string
          term?: string | null
          user_id?: string
        }
        Relationships: []
      }
      study_plans: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          plan_content: string
          progress: number | null
          subject: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          plan_content: string
          progress?: number | null
          subject: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          plan_content?: string
          progress?: number | null
          subject?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      study_resume: {
        Row: {
          break_seconds: number
          id: string
          is_break: boolean
          round: number
          round_seconds: number
          saved_at: string
          session_id: string | null
          studied_seconds: number
          subject: string
          time_left: number
          user_id: string
        }
        Insert: {
          break_seconds?: number
          id?: string
          is_break?: boolean
          round?: number
          round_seconds?: number
          saved_at?: string
          session_id?: string | null
          studied_seconds?: number
          subject: string
          time_left?: number
          user_id: string
        }
        Update: {
          break_seconds?: number
          id?: string
          is_break?: boolean
          round?: number
          round_seconds?: number
          saved_at?: string
          session_id?: string | null
          studied_seconds?: number
          subject?: string
          time_left?: number
          user_id?: string
        }
        Relationships: []
      }
      study_rooms: {
        Row: {
          created_at: string | null
          creator_id: string
          id: string
          is_active: boolean | null
          max_participants: number | null
          name: string
          subject: string
        }
        Insert: {
          created_at?: string | null
          creator_id: string
          id?: string
          is_active?: boolean | null
          max_participants?: number | null
          name: string
          subject: string
        }
        Update: {
          created_at?: string | null
          creator_id?: string
          id?: string
          is_active?: boolean | null
          max_participants?: number | null
          name?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_rooms_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      study_sessions: {
        Row: {
          chapters: string | null
          duration_minutes: number
          ended_at: string | null
          id: string
          started_at: string | null
          subject: string
          user_id: string
          xp_earned: number | null
        }
        Insert: {
          chapters?: string | null
          duration_minutes: number
          ended_at?: string | null
          id?: string
          started_at?: string | null
          subject: string
          user_id: string
          xp_earned?: number | null
        }
        Update: {
          chapters?: string | null
          duration_minutes?: number
          ended_at?: string | null
          id?: string
          started_at?: string | null
          subject?: string
          user_id?: string
          xp_earned?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "study_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      study_targets: {
        Row: {
          created_at: string
          id: string
          last_session_id: string | null
          subject: string
          target_minutes: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_session_id?: string | null
          subject: string
          target_minutes?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_session_id?: string | null
          subject?: string
          target_minutes?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscription_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          duration_days: number
          id: string
          is_used: boolean
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          duration_days?: number
          id?: string
          is_used?: boolean
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          duration_days?: number
          id?: string
          is_used?: boolean
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_codes_used_by_fkey"
            columns: ["used_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_profiles: {
        Row: {
          average_rating: number | null
          bio: string | null
          created_at: string | null
          id: string
          instagram_url: string | null
          specialization: string | null
          telegram_url: string | null
          total_ratings: number | null
          twitter_url: string | null
          updated_at: string | null
          user_id: string
          website_url: string | null
          youtube_url: string | null
        }
        Insert: {
          average_rating?: number | null
          bio?: string | null
          created_at?: string | null
          id?: string
          instagram_url?: string | null
          specialization?: string | null
          telegram_url?: string | null
          total_ratings?: number | null
          twitter_url?: string | null
          updated_at?: string | null
          user_id: string
          website_url?: string | null
          youtube_url?: string | null
        }
        Update: {
          average_rating?: number | null
          bio?: string | null
          created_at?: string | null
          id?: string
          instagram_url?: string | null
          specialization?: string | null
          telegram_url?: string | null
          total_ratings?: number | null
          twitter_url?: string | null
          updated_at?: string | null
          user_id?: string
          website_url?: string | null
          youtube_url?: string | null
        }
        Relationships: []
      }
      teacher_ratings: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          rating: number
          student_id: string
          teacher_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          rating: number
          student_id: string
          teacher_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          rating?: number
          student_id?: string
          teacher_id?: string
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
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
