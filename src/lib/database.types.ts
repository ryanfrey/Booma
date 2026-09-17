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
      auctions: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          live_at: string
          location: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          live_at: string
          location: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          live_at?: string
          location?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "auctions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bids: {
        Row: {
          amount: number
          bidder_id: string
          created_at: string | null
          id: string
          is_winning: boolean | null
          listing_id: string
          paystack_authorization_code: string | null
          paystack_reference: string | null
        }
        Insert: {
          amount: number
          bidder_id: string
          created_at?: string | null
          id?: string
          is_winning?: boolean | null
          listing_id: string
          paystack_authorization_code?: string | null
          paystack_reference?: string | null
        }
        Update: {
          amount?: number
          bidder_id?: string
          created_at?: string | null
          id?: string
          is_winning?: boolean | null
          listing_id?: string
          paystack_authorization_code?: string | null
          paystack_reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bids_bidder_id_fkey"
            columns: ["bidder_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bids_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          id: number
          name: string
          slug: string
        }
        Insert: {
          id?: number
          name: string
          slug: string
        }
        Update: {
          id?: number
          name?: string
          slug?: string
        }
        Relationships: []
      }
      listing_images: {
        Row: {
          created_at: string | null
          height: number | null
          id: string
          listing_id: string
          position: number
          storage_path: string
          thumbnail_path: string | null
          width: number | null
        }
        Insert: {
          created_at?: string | null
          height?: number | null
          id?: string
          listing_id: string
          position?: number
          storage_path: string
          thumbnail_path?: string | null
          width?: number | null
        }
        Update: {
          created_at?: string | null
          height?: number | null
          id?: string
          listing_id?: string
          position?: number
          storage_path?: string
          thumbnail_path?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "listing_images_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          bid_increment: number
          category_id: number | null
          condition: string | null
          created_at: string | null
          current_high_bidder_id: string | null
          current_price: number
          description: string | null
          ends_at: string
          id: string
          reserve_price: number | null
          seller_id: string
          starting_price: number
          starts_at: string | null
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          bid_increment?: number
          category_id?: number | null
          condition?: string | null
          created_at?: string | null
          current_high_bidder_id?: string | null
          current_price: number
          description?: string | null
          ends_at: string
          id?: string
          reserve_price?: number | null
          seller_id: string
          starting_price: number
          starts_at?: string | null
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          bid_increment?: number
          category_id?: number | null
          condition?: string | null
          created_at?: string | null
          current_high_bidder_id?: string | null
          current_price?: number
          description?: string | null
          ends_at?: string
          id?: string
          reserve_price?: number | null
          seller_id?: string
          starting_price?: number
          starts_at?: string | null
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_current_high_bidder_id_fkey"
            columns: ["current_high_bidder_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lots: {
        Row: {
          auction_id: string
          category: string
          collection_details: string
          condition: string
          condition_notes: string
          created_at: string
          description: string
          dimensions: string
          estimate_high: number
          estimate_low: number
          id: string
          location: string
          lot_number: number
          reserve_met: boolean | null
          sold_at: string | null
          sold_price: number | null
          starting_price: number
          title: string
          updated_at: string
        }
        Insert: {
          auction_id: string
          category?: string
          collection_details?: string
          condition?: string
          condition_notes?: string
          created_at?: string
          description?: string
          dimensions?: string
          estimate_high?: number
          estimate_low?: number
          id?: string
          location?: string
          lot_number: number
          reserve_met?: boolean | null
          sold_at?: string | null
          sold_price?: number | null
          starting_price?: number
          title: string
          updated_at?: string
        }
        Update: {
          auction_id?: string
          category?: string
          collection_details?: string
          condition?: string
          condition_notes?: string
          created_at?: string
          description?: string
          dimensions?: string
          estimate_high?: number
          estimate_low?: number
          id?: string
          location?: string
          lot_number?: number
          reserve_met?: boolean | null
          sold_at?: string | null
          sold_price?: number | null
          starting_price?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lots_auction_id_fkey"
            columns: ["auction_id"]
            isOneToOne: false
            referencedRelation: "auctions"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          buyer_id: string
          buyer_premium: number
          created_at: string | null
          id: string
          listing_id: string
          paystack_reference: string | null
          platform_fee: number
          seller_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          buyer_id: string
          buyer_premium?: number
          created_at?: string | null
          id?: string
          listing_id: string
          paystack_reference?: string | null
          platform_fee?: number
          seller_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          buyer_id?: string
          buyer_premium?: number
          created_at?: string | null
          id?: string
          listing_id?: string
          paystack_reference?: string | null
          platform_fee?: number
          seller_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          display_name: string
          id: string
          is_admin: boolean
          is_seller: boolean | null
          payment_method_card_last4: string | null
          payment_method_card_type: string | null
          payment_method_verified_at: string | null
          paystack_customer_code: string | null
          paystack_subaccount_code: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          display_name: string
          id: string
          is_admin?: boolean
          is_seller?: boolean | null
          payment_method_card_last4?: string | null
          payment_method_card_type?: string | null
          payment_method_verified_at?: string | null
          paystack_customer_code?: string | null
          paystack_subaccount_code?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string
          id?: string
          is_admin?: boolean
          is_seller?: boolean | null
          payment_method_card_last4?: string | null
          payment_method_card_type?: string | null
          payment_method_verified_at?: string | null
          paystack_customer_code?: string | null
          paystack_subaccount_code?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      close_ended_auctions: { Args: never; Returns: undefined }
      place_bid: {
        Args: {
          p_amount: number
          p_bidder_id: string
          p_listing_id: string
          p_paystack_authorization_code: string
          p_paystack_reference: string
        }
        Returns: {
          amount: number
          bidder_id: string
          created_at: string | null
          id: string
          is_winning: boolean | null
          listing_id: string
          paystack_authorization_code: string | null
          paystack_reference: string | null
        }
        SetofOptions: {
          from: "*"
          to: "bids"
          isOneToOne: true
          isSetofReturn: false
        }
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
    Enums: {},
  },
} as const
