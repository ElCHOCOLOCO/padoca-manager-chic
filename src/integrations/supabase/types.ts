export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      app_users: {
        Row: {
          active: boolean
          auth_user_id: string
          created_at: string
          institutes: Json
          role: string
          username: string
        }
        Insert: {
          active?: boolean
          auth_user_id: string
          created_at?: string
          institutes?: Json
          role: string
          username: string
        }
        Update: {
          active?: boolean
          auth_user_id?: string
          created_at?: string
          institutes?: Json
          role?: string
          username?: string
        }
        Relationships: []
      }
      cargo: {
        Row: {
          id: string
          institute_id: string
          product_id: string
          quantity: number
          received_at: string
          transferred_to_stock: boolean
          updated_at: string
        }
        Insert: {
          id?: string
          institute_id: string
          product_id: string
          quantity?: number
          received_at?: string
          transferred_to_stock?: boolean
          updated_at?: string
        }
        Update: {
          id?: string
          institute_id?: string
          product_id?: string
          quantity?: number
          received_at?: string
          transferred_to_stock?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cargo_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "institutes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cargo_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      cargo_suggestions: {
        Row: {
          applied_at: string | null
          created_at: string
          id: string
          institute_id: string
          product_id: string
          quantity: number
          status: string
          updated_at: string
        }
        Insert: {
          applied_at?: string | null
          created_at?: string
          id?: string
          institute_id: string
          product_id: string
          quantity: number
          status?: string
          updated_at?: string
        }
        Update: {
          applied_at?: string | null
          created_at?: string
          id?: string
          institute_id?: string
          product_id?: string
          quantity?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cargo_suggestions_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "institutes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cargo_suggestions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      entradas: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          entry_date: string
          id: string
          institute_id: string
          period: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          entry_date?: string
          id?: string
          institute_id: string
          period?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          entry_date?: string
          id?: string
          institute_id?: string
          period?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      institutes: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id: string
          name: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      insumo_recipe_items: {
        Row: {
          cost: number
          created_at: string
          id: string
          idx: number
          name: string
          recipe_id: string
          updated_at: string
        }
        Insert: {
          cost?: number
          created_at?: string
          id?: string
          idx: number
          name?: string
          recipe_id: string
          updated_at?: string
        }
        Update: {
          cost?: number
          created_at?: string
          id?: string
          idx?: number
          name?: string
          recipe_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "insumo_recipe_items_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "insumo_recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      insumo_recipes: {
        Row: {
          created_at: string
          id: string
          name: string
          units_per_batch: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          units_per_batch?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          units_per_batch?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      kitchen_orders: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          institute_id: string
          notes: string | null
          product_id: string
          quantity: number
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          institute_id: string
          notes?: string | null
          product_id: string
          quantity: number
          status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          institute_id?: string
          notes?: string | null
          product_id?: string
          quantity?: number
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kitchen_orders_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "institutes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kitchen_orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean
          category: string
          created_at: string
          id: string
          name: string
          price: number
          transfer_value: number | null
        }
        Insert: {
          active?: boolean
          category: string
          created_at?: string
          id: string
          name: string
          price?: number
          transfer_value?: number | null
        }
        Update: {
          active?: boolean
          category?: string
          created_at?: string
          id?: string
          name?: string
          price?: number
          transfer_value?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          active: boolean
          created_at: string
          id: string
          institute_id: string | null
          institutes: string[] | null
          last_login: string | null
          name: string
          role: string
          updated_at: string
          user_id: string
          user_type: string
          username: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          institute_id?: string | null
          institutes?: string[] | null
          last_login?: string | null
          name: string
          role?: string
          updated_at?: string
          user_id: string
          user_type?: string
          username?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          institute_id?: string | null
          institutes?: string[] | null
          last_login?: string | null
          name?: string
          role?: string
          updated_at?: string
          user_id?: string
          user_type?: string
          username?: string | null
        }
        Relationships: []
      }
      sales: {
        Row: {
          cancelled: boolean
          cancelled_at: string | null
          id: string
          institute_id: string
          product_id: string
          quantity: number
          sale_date: string
          total_price: number
          unit_price: number
          user_id: string
        }
        Insert: {
          cancelled?: boolean
          cancelled_at?: string | null
          id?: string
          institute_id: string
          product_id: string
          quantity: number
          sale_date?: string
          total_price: number
          unit_price: number
          user_id: string
        }
        Update: {
          cancelled?: boolean
          cancelled_at?: string | null
          id?: string
          institute_id?: string
          product_id?: string
          quantity?: number
          sale_date?: string
          total_price?: number
          unit_price?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "institutes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_marx: {
        Row: {
          cancelled: boolean
          created_at: string
          id: string
          institute_id: string
          product_id: string
          profit_amount: number
          quantity: number
          sale_date: string
          session_id: string | null
          settled: boolean | null
          shift_type: string | null
          total_amount: number
          transfer_amount: number
          transfer_id: string | null
          unit_price: number
          user_id: string
        }
        Insert: {
          cancelled?: boolean
          created_at?: string
          id?: string
          institute_id: string
          product_id: string
          profit_amount: number
          quantity: number
          sale_date?: string
          session_id?: string | null
          settled?: boolean | null
          shift_type?: string | null
          total_amount: number
          transfer_amount: number
          transfer_id?: string | null
          unit_price: number
          user_id: string
        }
        Update: {
          cancelled?: boolean
          created_at?: string
          id?: string
          institute_id?: string
          product_id?: string
          profit_amount?: number
          quantity?: number
          sale_date?: string
          session_id?: string | null
          settled?: boolean | null
          shift_type?: string | null
          total_amount?: number
          transfer_amount?: number
          transfer_id?: string | null
          unit_price?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_marx_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sales_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_sessions: {
        Row: {
          ended_at: string | null
          id: string
          institute_id: string
          started_at: string
          transfer_id: string | null
          user_id: string
        }
        Insert: {
          ended_at?: string | null
          id?: string
          institute_id: string
          started_at?: string
          transfer_id?: string | null
          user_id: string
        }
        Update: {
          ended_at?: string | null
          id?: string
          institute_id?: string
          started_at?: string
          transfer_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_sessions_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "institutes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_sessions_transfer_id_fkey"
            columns: ["transfer_id"]
            isOneToOne: false
            referencedRelation: "transfers_marx"
            referencedColumns: ["id"]
          },
        ]
      }
      stock: {
        Row: {
          id: string
          institute_id: string
          product_id: string
          quantity: number
          updated_at: string
        }
        Insert: {
          id?: string
          institute_id: string
          product_id: string
          quantity?: number
          updated_at?: string
        }
        Update: {
          id?: string
          institute_id?: string
          product_id?: string
          quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "institutes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_marx: {
        Row: {
          institute_id: string
          product_id: string
          quantity: number
        }
        Insert: {
          institute_id: string
          product_id: string
          quantity?: number
        }
        Update: {
          institute_id?: string
          product_id?: string
          quantity?: number
        }
        Relationships: []
      }
      transfers: {
        Row: {
          amount: number
          created_at: string
          id: string
          institute_id: string
          processed_at: string | null
          status: string
          transfer_type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          institute_id: string
          processed_at?: string | null
          status?: string
          transfer_type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          institute_id?: string
          processed_at?: string | null
          status?: string
          transfer_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transfers_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      transfers_marx: {
        Row: {
          amount: number
          created_at: string
          id: string
          institute_id: string
          processed_at: string | null
          status: string
          transfer_type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          institute_id: string
          processed_at?: string | null
          status?: string
          transfer_type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          institute_id?: string
          processed_at?: string | null
          status?: string
          transfer_type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_institutes: {
        Row: {
          created_at: string
          institute_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          institute_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          institute_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_institutes_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "institutes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_institute: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      update_stock_atomic: {
        Args:
          | { iid: string; pid: string; qty: number; mode: string }
          | { iid: string; pid: string; qty: number; mode: string }
        Returns: undefined
      }
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
