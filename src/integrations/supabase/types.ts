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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      agent_logs: {
        Row: {
          created_at: string
          id: string
          intent: string
          payload: Json
          receiver_agent: string
          sender_agent: string
          session_id: string
          status: string
          turn_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          intent: string
          payload?: Json
          receiver_agent: string
          sender_agent: string
          session_id: string
          status?: string
          turn_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          intent?: string
          payload?: Json
          receiver_agent?: string
          sender_agent?: string
          session_id?: string
          status?: string
          turn_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_logs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          agent: string | null
          citations: Json
          content: string
          created_at: string
          id: string
          proactive: boolean
          role: string
          session_id: string
          student_id: string | null
        }
        Insert: {
          agent?: string | null
          citations?: Json
          content: string
          created_at?: string
          id?: string
          proactive?: boolean
          role?: string
          session_id: string
          student_id?: string | null
        }
        Update: {
          agent?: string | null
          citations?: Json
          content?: string
          created_at?: string
          id?: string
          proactive?: boolean
          role?: string
          session_id?: string
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          created_at: string
          id: string
          student_id: string
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          student_id: string
          title?: string
        }
        Update: {
          created_at?: string
          id?: string
          student_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          attendance_pct: number
          created_at: string
          faculty: string
          id: string
          name: string
          student_id: string | null
          timetable_slot: string
        }
        Insert: {
          attendance_pct?: number
          created_at?: string
          faculty: string
          id?: string
          name: string
          student_id?: string | null
          timetable_slot: string
        }
        Update: {
          attendance_pct?: number
          created_at?: string
          faculty?: string
          id?: string
          name?: string
          student_id?: string | null
          timetable_slot?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          capacity: number
          created_at: string
          date: string
          description: string | null
          id: string
          location: string | null
          registered_students: string[]
          title: string
        }
        Insert: {
          capacity?: number
          created_at?: string
          date: string
          description?: string | null
          id?: string
          location?: string | null
          registered_students?: string[]
          title: string
        }
        Update: {
          capacity?: number
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          location?: string | null
          registered_students?: string[]
          title?: string
        }
        Relationships: []
      }
      pending_approvals: {
        Row: {
          action_payload: Json
          action_type: string
          created_at: string
          id: string
          reason: string | null
          result: string | null
          session_id: string
          status: string
          student_id: string | null
          summary: string
        }
        Insert: {
          action_payload?: Json
          action_type: string
          created_at?: string
          id?: string
          reason?: string | null
          result?: string | null
          session_id: string
          status?: string
          student_id?: string | null
          summary: string
        }
        Update: {
          action_payload?: Json
          action_type?: string
          created_at?: string
          id?: string
          reason?: string | null
          result?: string | null
          session_id?: string
          status?: string
          student_id?: string | null
          summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "pending_approvals_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_approvals_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      placements: {
        Row: {
          company: string
          created_at: string
          drive_date: string | null
          eligibility_rules: Json
          id: string
          open_roles: string[]
        }
        Insert: {
          company: string
          created_at?: string
          drive_date?: string | null
          eligibility_rules?: Json
          id?: string
          open_roles?: string[]
        }
        Update: {
          company?: string
          created_at?: string
          drive_date?: string | null
          eligibility_rules?: Json
          id?: string
          open_roles?: string[]
        }
        Relationships: []
      }
      policies: {
        Row: {
          content: string
          created_at: string
          id: string
          title: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          title: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          title?: string
        }
        Relationships: []
      }
      student_memory: {
        Row: {
          created_at: string
          fact: string
          id: string
          student_id: string
        }
        Insert: {
          created_at?: string
          fact: string
          id?: string
          student_id: string
        }
        Update: {
          created_at?: string
          fact?: string
          id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_memory_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          attendance_pct: number
          backlogs: number
          branch: string
          cgpa: number
          created_at: string
          email: string | null
          id: string
          name: string
          year: number
        }
        Insert: {
          attendance_pct?: number
          backlogs?: number
          branch: string
          cgpa?: number
          created_at?: string
          email?: string | null
          id?: string
          name: string
          year?: number
        }
        Update: {
          attendance_pct?: number
          backlogs?: number
          branch?: string
          cgpa?: number
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          year?: number
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
    Enums: {},
  },
} as const
