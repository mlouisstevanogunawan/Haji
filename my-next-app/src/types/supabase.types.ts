export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      agents: {
        Row: {
          commission_rate: number
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          phone: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          commission_rate?: number
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          phone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          commission_rate?: number
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          content: string
          created_at: string
          id: string
          is_published: boolean
          published_at: string | null
          target_audience: Database["public"]["Enums"]["announcement_audience"]
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_published?: boolean
          published_at?: string | null
          target_audience?: Database["public"]["Enums"]["announcement_audience"]
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_published?: boolean
          published_at?: string | null
          target_audience?: Database["public"]["Enums"]["announcement_audience"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          booking_date: string
          created_at: string
          departure_date: string | null
          id: string
          package_id: string
          pilgrim_id: string
          return_date: string | null
          status: Database["public"]["Enums"]["booking_status"]
          total_price: number
          updated_at: string
        }
        Insert: {
          booking_date?: string
          created_at?: string
          departure_date?: string | null
          id?: string
          package_id: string
          pilgrim_id: string
          return_date?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          total_price: number
          updated_at?: string
        }
        Update: {
          booking_date?: string
          created_at?: string
          departure_date?: string | null
          id?: string
          package_id?: string
          pilgrim_id?: string
          return_date?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          total_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_pilgrim_id_fkey"
            columns: ["pilgrim_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      commissions: {
        Row: {
          agent_id: string
          amount: number
          booking_id: string
          created_at: string
          id: string
          paid_at: string | null
          status: Database["public"]["Enums"]["commission_status"]
          updated_at: string
        }
        Insert: {
          agent_id: string
          amount: number
          booking_id: string
          created_at?: string
          id?: string
          paid_at?: string | null
          status?: Database["public"]["Enums"]["commission_status"]
          updated_at?: string
        }
        Update: {
          agent_id?: string
          amount?: number
          booking_id?: string
          created_at?: string
          id?: string
          paid_at?: string | null
          status?: Database["public"]["Enums"]["commission_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commissions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          document_number: string | null
          document_type: Database["public"]["Enums"]["document_type"]
          expiry_date: string | null
          file_url: string | null
          id: string
          issue_date: string | null
          pilgrim_id: string
          status: Database["public"]["Enums"]["document_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          document_number?: string | null
          document_type: Database["public"]["Enums"]["document_type"]
          expiry_date?: string | null
          file_url?: string | null
          id?: string
          issue_date?: string | null
          pilgrim_id: string
          status?: Database["public"]["Enums"]["document_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          document_number?: string | null
          document_type?: Database["public"]["Enums"]["document_type"]
          expiry_date?: string | null
          file_url?: string | null
          id?: string
          issue_date?: string | null
          pilgrim_id?: string
          status?: Database["public"]["Enums"]["document_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_pilgrim_id_fkey"
            columns: ["pilgrim_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment: {
        Row: {
          category: string | null
          condition: Database["public"]["Enums"]["equipment_condition"]
          created_at: string
          id: string
          name: string
          quantity: number
          updated_at: string
        }
        Insert: {
          category?: string | null
          condition?: Database["public"]["Enums"]["equipment_condition"]
          created_at?: string
          id?: string
          name: string
          quantity?: number
          updated_at?: string
        }
        Update: {
          category?: string | null
          condition?: Database["public"]["Enums"]["equipment_condition"]
          created_at?: string
          id?: string
          name?: string
          quantity?: number
          updated_at?: string
        }
        Relationships: []
      }
      flights: {
        Row: {
          airline_code: string
          airline_name: string
          created_at: string
          id: string
          route: string | null
          updated_at: string
        }
        Insert: {
          airline_code: string
          airline_name: string
          created_at?: string
          id?: string
          route?: string | null
          updated_at?: string
        }
        Update: {
          airline_code?: string
          airline_name?: string
          created_at?: string
          id?: string
          route?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      guides: {
        Row: {
          created_at: string
          email: string | null
          experience_years: number
          id: string
          is_active: boolean
          language_skills: string[] | null
          name: string
          phone: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          experience_years?: number
          id?: string
          is_active?: boolean
          language_skills?: string[] | null
          name: string
          phone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          experience_years?: number
          id?: string
          is_active?: boolean
          language_skills?: string[] | null
          name?: string
          phone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guides_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hotels: {
        Row: {
          address: string | null
          city: Database["public"]["Enums"]["hotel_city"]
          created_at: string
          id: string
          name: string
          photo_url: string | null
          price_per_night: number | null
          rating: number | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city: Database["public"]["Enums"]["hotel_city"]
          created_at?: string
          id?: string
          name: string
          photo_url?: string | null
          price_per_night?: number | null
          rating?: number | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: Database["public"]["Enums"]["hotel_city"]
          created_at?: string
          id?: string
          name?: string
          photo_url?: string | null
          price_per_night?: number | null
          rating?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount: number
          booking_id: string | null
          created_at: string
          due_date: string
          id: string
          invoice_number: string
          jamaah_id: string | null
          midtrans_order_id: string | null
          midtrans_transaction_id: string | null
          paid_amount: number
          payment_date: string | null
          payment_method: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          type: Database["public"]["Enums"]["invoice_type"]
          updated_at: string
        }
        Insert: {
          amount: number
          booking_id?: string | null
          created_at?: string
          due_date: string
          id?: string
          invoice_number: string
          jamaah_id?: string | null
          midtrans_order_id?: string | null
          midtrans_transaction_id?: string | null
          paid_amount?: number
          payment_date?: string | null
          payment_method?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          type?: Database["public"]["Enums"]["invoice_type"]
          updated_at?: string
        }
        Update: {
          amount?: number
          booking_id?: string | null
          created_at?: string
          due_date?: string
          id?: string
          invoice_number?: string
          jamaah_id?: string | null
          midtrans_order_id?: string | null
          midtrans_transaction_id?: string | null
          paid_amount?: number
          payment_date?: string | null
          payment_method?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          type?: Database["public"]["Enums"]["invoice_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_invoices_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_jamaah_id_fkey"
            columns: ["jamaah_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      packages: {
        Row: {
          created_at: string
          description: string | null
          duration_days: number
          facilities: string[] | null
          id: string
          is_active: boolean
          name: string
          price: number
          quota: number
          type: Database["public"]["Enums"]["package_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_days: number
          facilities?: string[] | null
          id?: string
          is_active?: boolean
          name: string
          price: number
          quota?: number
          type?: Database["public"]["Enums"]["package_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_days?: number
          facilities?: string[] | null
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          quota?: number
          type?: Database["public"]["Enums"]["package_type"]
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          created_at: string
          fraud_status: string | null
          gross_amount: number
          id: string
          invoice_id: string | null
          order_id: string
          payment_type: string
          raw_response: Json | null
          settlement_time: string | null
          transaction_id: string | null
          transaction_status: string
        }
        Insert: {
          created_at?: string
          fraud_status?: string | null
          gross_amount: number
          id?: string
          invoice_id?: string | null
          order_id: string
          payment_type: string
          raw_response?: Json | null
          settlement_time?: string | null
          transaction_id?: string | null
          transaction_status: string
        }
        Update: {
          created_at?: string
          fraud_status?: string | null
          gross_amount?: number
          id?: string
          invoice_id?: string | null
          order_id: string
          payment_type: string
          raw_response?: Json | null
          settlement_time?: string | null
          transaction_id?: string | null
          transaction_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          role: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          role?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_user_role: { Args: never; Returns: string }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      announcement_audience: "all" | "jamaah" | "agents" | "guides"
      booking_status: "pending" | "confirmed" | "cancelled" | "completed"
      commission_status: "pending" | "paid" | "cancelled"
      document_status: "pending" | "approved" | "rejected"
      document_type: "passport" | "visa" | "vaccine_certificate" | "other"
      equipment_condition: "good" | "damaged" | "lost"
      hotel_city: "makkah" | "madinah"
      invoice_status: "unpaid" | "partial" | "paid" | "expired" | "cancelled"
      invoice_type: "dp" | "cicilan" | "pelunasan"
      package_type: "umroh" | "haji"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      announcement_audience: ["all", "jamaah", "agents", "guides"],
      booking_status: ["pending", "confirmed", "cancelled", "completed"],
      commission_status: ["pending", "paid", "cancelled"],
      document_status: ["pending", "approved", "rejected"],
      document_type: ["passport", "visa", "vaccine_certificate", "other"],
      equipment_condition: ["good", "damaged", "lost"],
      hotel_city: ["makkah", "madinah"],
      invoice_status: ["unpaid", "partial", "paid", "expired", "cancelled"],
      invoice_type: ["dp", "cicilan", "pelunasan"],
      package_type: ["umroh", "haji"],
    },
  },
} as const;
