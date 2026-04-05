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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      birthday_offer_settings: {
        Row: {
          created_at: string
          days_before: number
          days_valid: number
          enabled: boolean
          id: string
          merchant_id: string
          message: string | null
          reward_type: string
          reward_value: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          days_before?: number
          days_valid?: number
          enabled?: boolean
          id?: string
          merchant_id: string
          message?: string | null
          reward_type?: string
          reward_value?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          days_before?: number
          days_valid?: number
          enabled?: boolean
          id?: string
          merchant_id?: string
          message?: string | null
          reward_type?: string
          reward_value?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "birthday_offer_settings_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: true
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      blogs: {
        Row: {
          author_name: string | null
          content: string
          created_at: string
          excerpt: string | null
          featured_image_url: string | null
          id: string
          is_published: boolean
          published_at: string | null
          slug: string
          title: string
        }
        Insert: {
          author_name?: string | null
          content: string
          created_at?: string
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          is_published?: boolean
          published_at?: string | null
          slug: string
          title: string
        }
        Update: {
          author_name?: string | null
          content?: string
          created_at?: string
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          is_published?: boolean
          published_at?: string | null
          slug?: string
          title?: string
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          active: boolean
          ai_generated: boolean | null
          confidence_score: number | null
          created_at: string
          description: string | null
          expected_impact: string | null
          id: string
          image_url: string | null
          merchant_id: string
          target_segment: string | null
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          ai_generated?: boolean | null
          confidence_score?: number | null
          created_at?: string
          description?: string | null
          expected_impact?: string | null
          id?: string
          image_url?: string | null
          merchant_id: string
          target_segment?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          ai_generated?: boolean | null
          confidence_score?: number | null
          created_at?: string
          description?: string | null
          expected_impact?: string | null
          id?: string
          image_url?: string | null
          merchant_id?: string
          target_segment?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          business_name: string | null
          created_at: string
          email: string
          id: string
          message: string
          name: string
        }
        Insert: {
          business_name?: string | null
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
        }
        Update: {
          business_name?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          card_issued_at: string | null
          created_at: string
          crn: string | null
          date_of_birth: string | null
          full_name: string | null
          id: string
          loyalty_card_number: string | null
          phone: string | null
          points_balance: number
          updated_at: string
          user_id: string
        }
        Insert: {
          card_issued_at?: string | null
          created_at?: string
          crn?: string | null
          date_of_birth?: string | null
          full_name?: string | null
          id?: string
          loyalty_card_number?: string | null
          phone?: string | null
          points_balance?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          card_issued_at?: string | null
          created_at?: string
          crn?: string | null
          date_of_birth?: string | null
          full_name?: string | null
          id?: string
          loyalty_card_number?: string | null
          phone?: string | null
          points_balance?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      external_customer_mappings: {
        Row: {
          created_at: string
          customer_id: string
          external_customer_id: string
          id: string
          match_method: string | null
          merchant_id: string
          provider: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          external_customer_id: string
          id?: string
          match_method?: string | null
          merchant_id: string
          provider?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          external_customer_id?: string
          id?: string
          match_method?: string | null
          merchant_id?: string
          provider?: string
        }
        Relationships: [
          {
            foreignKeyName: "external_customer_mappings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "external_customer_mappings_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      gamification_settings: {
        Row: {
          created_at: string
          id: string
          levels_enabled: boolean
          merchant_id: string
          stamp_card_enabled: boolean
          stamp_reward: string | null
          stamps_required: number
          streak_reward: string | null
          streak_threshold: number
          updated_at: string
          visit_streak_enabled: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          levels_enabled?: boolean
          merchant_id: string
          stamp_card_enabled?: boolean
          stamp_reward?: string | null
          stamps_required?: number
          streak_reward?: string | null
          streak_threshold?: number
          updated_at?: string
          visit_streak_enabled?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          levels_enabled?: boolean
          merchant_id?: string
          stamp_card_enabled?: boolean
          stamp_reward?: string | null
          stamps_required?: number
          streak_reward?: string | null
          streak_threshold?: number
          updated_at?: string
          visit_streak_enabled?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "gamification_settings_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: true
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_events: {
        Row: {
          created_at: string
          error_message: string | null
          event_type: string
          external_event_id: string | null
          id: string
          merchant_id: string | null
          payload: Json | null
          processed_at: string | null
          provider: string
          status: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_type: string
          external_event_id?: string | null
          id?: string
          merchant_id?: string | null
          payload?: Json | null
          processed_at?: string | null
          provider?: string
          status?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_type?: string
          external_event_id?: string | null
          id?: string
          merchant_id?: string | null
          payload?: Json | null
          processed_at?: string | null
          provider?: string
          status?: string
        }
        Relationships: []
      }
      merchant_feature_overrides: {
        Row: {
          allow_advanced_reports: boolean
          allow_ai_suggestions: boolean
          allow_analytics: boolean
          allow_birthday_offers: boolean
          allow_campaigns: boolean
          allow_gamification: boolean
          allow_monthly_offers: boolean
          allow_pos_integration: boolean
          allow_priority_support: boolean
          allow_rewards: boolean
          created_at: string
          id: string
          merchant_id: string
          updated_at: string
        }
        Insert: {
          allow_advanced_reports?: boolean
          allow_ai_suggestions?: boolean
          allow_analytics?: boolean
          allow_birthday_offers?: boolean
          allow_campaigns?: boolean
          allow_gamification?: boolean
          allow_monthly_offers?: boolean
          allow_pos_integration?: boolean
          allow_priority_support?: boolean
          allow_rewards?: boolean
          created_at?: string
          id?: string
          merchant_id: string
          updated_at?: string
        }
        Update: {
          allow_advanced_reports?: boolean
          allow_ai_suggestions?: boolean
          allow_analytics?: boolean
          allow_birthday_offers?: boolean
          allow_campaigns?: boolean
          allow_gamification?: boolean
          allow_monthly_offers?: boolean
          allow_pos_integration?: boolean
          allow_priority_support?: boolean
          allow_rewards?: boolean
          created_at?: string
          id?: string
          merchant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "merchant_feature_overrides_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: true
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_subscriptions: {
        Row: {
          billing_cycle: string | null
          created_at: string
          current_plan: string
          end_date: string | null
          id: string
          merchant_id: string
          start_date: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_end_date: string | null
          trial_start_date: string | null
          updated_at: string
        }
        Insert: {
          billing_cycle?: string | null
          created_at?: string
          current_plan?: string
          end_date?: string | null
          id?: string
          merchant_id: string
          start_date?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end_date?: string | null
          trial_start_date?: string | null
          updated_at?: string
        }
        Update: {
          billing_cycle?: string | null
          created_at?: string
          current_plan?: string
          end_date?: string | null
          id?: string
          merchant_id?: string
          start_date?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end_date?: string | null
          trial_start_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "merchant_subscriptions_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: true
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      merchants: {
        Row: {
          address: string | null
          contact_number: string | null
          created_at: string
          id: string
          industry_type: string | null
          logo_url: string | null
          profile_image_url: string | null
          store_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          contact_number?: string | null
          created_at?: string
          id?: string
          industry_type?: string | null
          logo_url?: string | null
          profile_image_url?: string | null
          store_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          contact_number?: string | null
          created_at?: string
          id?: string
          industry_type?: string | null
          logo_url?: string | null
          profile_image_url?: string | null
          store_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      monthly_offers: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          merchant_id: string
          title: string
          updated_at: string
          valid_from: string | null
          valid_to: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          merchant_id: string
          title: string
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          merchant_id?: string
          title?: string
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "monthly_offers_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_connections: {
        Row: {
          access_token: string | null
          connected_at: string | null
          connection_status: string
          created_at: string
          id: string
          is_active: boolean
          location_id: string | null
          merchant_id: string
          provider: string
          provider_account_id: string | null
          refresh_token: string | null
          token_expires_at: string | null
          token_refreshed_at: string | null
          updated_at: string
          webhook_signature_key: string | null
        }
        Insert: {
          access_token?: string | null
          connected_at?: string | null
          connection_status?: string
          created_at?: string
          id?: string
          is_active?: boolean
          location_id?: string | null
          merchant_id: string
          provider?: string
          provider_account_id?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          token_refreshed_at?: string | null
          updated_at?: string
          webhook_signature_key?: string | null
        }
        Update: {
          access_token?: string | null
          connected_at?: string | null
          connection_status?: string
          created_at?: string
          id?: string
          is_active?: boolean
          location_id?: string | null
          merchant_id?: string
          provider?: string
          provider_account_id?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          token_refreshed_at?: string | null
          updated_at?: string
          webhook_signature_key?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pos_connections_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      redemptions: {
        Row: {
          created_at: string
          customer_id: string
          expires_at: string
          id: string
          merchant_id: string
          points_spent: number
          redeemed_at: string | null
          redemption_code: string
          reward_id: string
          reward_title: string
          status: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          customer_id: string
          expires_at: string
          id?: string
          merchant_id: string
          points_spent: number
          redeemed_at?: string | null
          redemption_code: string
          reward_id: string
          reward_title: string
          status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string
          expires_at?: string
          id?: string
          merchant_id?: string
          points_spent?: number
          redeemed_at?: string | null
          redemption_code?: string
          reward_id?: string
          reward_title?: string
          status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "redemptions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "redemptions_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "redemptions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          expires_at: string | null
          id: string
          image_url: string | null
          is_limited_time: boolean
          merchant_id: string
          points_required: number
          reward_type: string
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          image_url?: string | null
          is_limited_time?: boolean
          merchant_id: string
          points_required?: number
          reward_type?: string
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          image_url?: string | null
          is_limited_time?: boolean
          merchant_id?: string
          points_required?: number
          reward_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rewards_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          business_name: string | null
          created_at: string
          id: string
          is_published: boolean
          message: string
          name: string
          profile_image_url: string | null
          rating: number | null
          role: string | null
        }
        Insert: {
          business_name?: string | null
          created_at?: string
          id?: string
          is_published?: boolean
          message: string
          name: string
          profile_image_url?: string | null
          rating?: number | null
          role?: string | null
        }
        Update: {
          business_name?: string | null
          created_at?: string
          id?: string
          is_published?: boolean
          message?: string
          name?: string
          profile_image_url?: string | null
          rating?: number | null
          role?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          created_at: string
          customer_id: string
          external_payment_id: string | null
          id: string
          merchant_id: string | null
          merchant_name: string
          points_awarded: number
          purchase_amount: number
          source: string | null
          transaction_date: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          external_payment_id?: string | null
          id?: string
          merchant_id?: string | null
          merchant_name: string
          points_awarded?: number
          purchase_amount: number
          source?: string | null
          transaction_date?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          external_payment_id?: string | null
          id?: string
          merchant_id?: string | null
          merchant_name?: string
          points_awarded?: number
          purchase_amount?: number
          source?: string | null
          transaction_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      unmatched_transactions: {
        Row: {
          created_at: string
          external_customer_id: string | null
          external_payment_id: string | null
          id: string
          match_attempted: Json | null
          merchant_id: string
          provider: string
          purchase_amount: number
          resolved_at: string | null
          status: string
        }
        Insert: {
          created_at?: string
          external_customer_id?: string | null
          external_payment_id?: string | null
          id?: string
          match_attempted?: Json | null
          merchant_id: string
          provider?: string
          purchase_amount: number
          resolved_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          external_customer_id?: string | null
          external_payment_id?: string | null
          id?: string
          match_attempted?: Json | null
          merchant_id?: string
          provider?: string
          purchase_amount?: number
          resolved_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "unmatched_transactions_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      add_points_to_customer: {
        Args: {
          _loyalty_card_number: string
          _merchant_id: string
          _purchase_amount: number
        }
        Returns: Json
      }
      admin_get_all_merchants_with_plans: {
        Args: never
        Returns: {
          created_at: string
          current_plan: string
          customer_count: number
          email: string
          merchant_id: string
          plan_status: string
          store_name: string
          trial_end_date: string
          updated_at: string
        }[]
      }
      admin_set_user_role: {
        Args: {
          _action: string
          _role: Database["public"]["Enums"]["app_role"]
          _target_user_id: string
        }
        Returns: undefined
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_all_users_for_admin: {
        Args: never
        Returns: {
          email: string
          full_name: string
          roles: string[]
          user_id: string
        }[]
      }
      get_customers_by_ids: {
        Args: { _ids: string[] }
        Returns: {
          full_name: string
          id: string
          loyalty_card_number: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      redeem_reward: {
        Args: { _customer_id: string; _reward_id: string }
        Returns: Json
      }
      verify_redemption: {
        Args: { _merchant_id: string; _redemption_code: string }
        Returns: Json
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
