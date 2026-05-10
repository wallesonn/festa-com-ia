/**
 * Tipos do schema operacional — Postgres local (DATABASE_URL)
 * NÃO usar com o cliente Supabase. Para tipos do Supabase, veja lib/supabase/types.ts
 */
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
      addresses: {
        Row: {
          city: string
          client_id: string | null
          complement: string | null
          id: string
          neighborhood: string | null
          professional_id: string
          reference: string | null
          state: string
          street: string
          zip_code: string | null
        }
        Insert: {
          city: string
          client_id?: string | null
          complement?: string | null
          id?: string
          neighborhood?: string | null
          professional_id: string
          reference?: string | null
          state: string
          street: string
          zip_code?: string | null
        }
        Update: {
          city?: string
          client_id?: string | null
          complement?: string | null
          id?: string
          neighborhood?: string | null
          professional_id?: string
          reference?: string | null
          state?: string
          street?: string
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'addresses_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'addresses_professional_id_fkey'
            columns: ['professional_id']
            isOneToOne: false
            referencedRelation: 'professionals'
            referencedColumns: ['id']
          },
        ]
      }
      appointments: {
        Row: {
          client_id: string | null
          client_name: string | null
          color: string | null
          confirmed: boolean
          description: string | null
          duration_minutes: number | null
          id: string
          order_id: string | null
          professional_id: string
          scheduled_at: string
          title: string
          type: string
        }
        Insert: {
          client_id?: string | null
          client_name?: string | null
          color?: string | null
          confirmed?: boolean
          description?: string | null
          duration_minutes?: number | null
          id?: string
          order_id?: string | null
          professional_id: string
          scheduled_at: string
          title: string
          type: string
        }
        Update: {
          client_id?: string | null
          client_name?: string | null
          color?: string | null
          confirmed?: boolean
          description?: string | null
          duration_minutes?: number | null
          id?: string
          order_id?: string | null
          professional_id?: string
          scheduled_at?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: 'appointments_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'appointments_order_id_fkey'
            columns: ['order_id']
            isOneToOne: false
            referencedRelation: 'orders'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'appointments_professional_id_fkey'
            columns: ['professional_id']
            isOneToOne: false
            referencedRelation: 'professionals'
            referencedColumns: ['id']
          },
        ]
      }
      business_config: {
        Row: {
          address_id: string | null
          default_deposit_percent: number | null
          delivery_fee_per_km: number | null
          delivery_radius_km: number | null
          email: string | null
          id: string
          instagram: string | null
          min_advance_hours: number | null
          min_order_value: number | null
          name: string
          phone: string | null
          professional_id: string
          welcome_message: string | null
        }
        Insert: {
          address_id?: string | null
          default_deposit_percent?: number | null
          delivery_fee_per_km?: number | null
          delivery_radius_km?: number | null
          email?: string | null
          id?: string
          instagram?: string | null
          min_advance_hours?: number | null
          min_order_value?: number | null
          name: string
          phone?: string | null
          professional_id: string
          welcome_message?: string | null
        }
        Update: {
          address_id?: string | null
          default_deposit_percent?: number | null
          delivery_fee_per_km?: number | null
          delivery_radius_km?: number | null
          email?: string | null
          id?: string
          instagram?: string | null
          min_advance_hours?: number | null
          min_order_value?: number | null
          name?: string
          phone?: string | null
          professional_id?: string
          welcome_message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'business_config_address_id_fkey'
            columns: ['address_id']
            isOneToOne: false
            referencedRelation: 'addresses'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'business_config_professional_id_fkey'
            columns: ['professional_id']
            isOneToOne: true
            referencedRelation: 'professionals'
            referencedColumns: ['id']
          },
        ]
      }
      business_hours: {
        Row: {
          business_config_id: string
          close: string | null
          closed: boolean
          day: string
          id: string
          open: string | null
          professional_id: string
        }
        Insert: {
          business_config_id: string
          close?: string | null
          closed?: boolean
          day: string
          id?: string
          open?: string | null
          professional_id: string
        }
        Update: {
          business_config_id?: string
          close?: string | null
          closed?: boolean
          day?: string
          id?: string
          open?: string | null
          professional_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'business_hours_business_config_id_fkey'
            columns: ['business_config_id']
            isOneToOne: false
            referencedRelation: 'business_config'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'business_hours_professional_id_fkey'
            columns: ['professional_id']
            isOneToOne: false
            referencedRelation: 'professionals'
            referencedColumns: ['id']
          },
        ]
      }
      clients: {
        Row: {
          created_at: string
          email: string | null
          id: string
          last_order_at: string | null
          name: string
          notes: string | null
          phone: string
          professional_id: string
          profile_photo_url: string | null
          source: string | null
          tags: string[] | null
          total_orders: number
          total_spent: number
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          last_order_at?: string | null
          name: string
          notes?: string | null
          phone: string
          professional_id: string
          profile_photo_url?: string | null
          source?: string | null
          tags?: string[] | null
          total_orders?: number
          total_spent?: number
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          last_order_at?: string | null
          name?: string
          notes?: string | null
          phone?: string
          professional_id?: string
          profile_photo_url?: string | null
          source?: string | null
          tags?: string[] | null
          total_orders?: number
          total_spent?: number
        }
        Relationships: [
          {
            foreignKeyName: 'clients_professional_id_fkey'
            columns: ['professional_id']
            isOneToOne: false
            referencedRelation: 'professionals'
            referencedColumns: ['id']
          },
        ]
      }
      conversations: {
        Row: {
          archived_at: string | null
          channel: string
          client_id: string
          created_at: string
          id: string
          last_message: string | null
          last_message_at: string | null
          professional_id: string
          status: string
          unread_count: number
        }
        Insert: {
          archived_at?: string | null
          channel?: string
          client_id: string
          created_at?: string
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          professional_id: string
          status?: string
          unread_count?: number
        }
        Update: {
          archived_at?: string | null
          channel?: string
          client_id?: string
          created_at?: string
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          professional_id?: string
          status?: string
          unread_count?: number
        }
        Relationships: [
          {
            foreignKeyName: 'conversations_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'conversations_professional_id_fkey'
            columns: ['professional_id']
            isOneToOne: false
            referencedRelation: 'professionals'
            referencedColumns: ['id']
          },
        ]
      }
      ingredients: {
        Row: {
          cost_per_unit: number | null
          id: string
          name: string
          product_id: string
          professional_id: string
          quantity: string | null
          unit: string | null
        }
        Insert: {
          cost_per_unit?: number | null
          id?: string
          name: string
          product_id: string
          professional_id: string
          quantity?: string | null
          unit?: string | null
        }
        Update: {
          cost_per_unit?: number | null
          id?: string
          name?: string
          product_id?: string
          professional_id?: string
          quantity?: string | null
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'ingredients_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'ingredients_professional_id_fkey'
            columns: ['professional_id']
            isOneToOne: false
            referencedRelation: 'professionals'
            referencedColumns: ['id']
          },
        ]
      }
      messages: {
        Row: {
          conversation_id: string
          direction: string
          error_message: string | null
          id: string
          metadata: Json | null
          order_id: string | null
          professional_id: string
          provider_message_id: string | null
          sender: string
          sent_at: string
          status: string
          suggestions: Json | null
          text: string
        }
        Insert: {
          conversation_id: string
          direction?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          order_id?: string | null
          professional_id: string
          provider_message_id?: string | null
          sender: string
          sent_at?: string
          status?: string
          suggestions?: Json | null
          text: string
        }
        Update: {
          conversation_id?: string
          direction?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          order_id?: string | null
          professional_id?: string
          provider_message_id?: string | null
          sender?: string
          sent_at?: string
          status?: string
          suggestions?: Json | null
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: 'messages_conversation_id_fkey'
            columns: ['conversation_id']
            isOneToOne: false
            referencedRelation: 'conversations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'messages_order_id_fkey'
            columns: ['order_id']
            isOneToOne: false
            referencedRelation: 'orders'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'messages_professional_id_fkey'
            columns: ['professional_id']
            isOneToOne: false
            referencedRelation: 'professionals'
            referencedColumns: ['id']
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          client_id: string | null
          created_at: string
          id: string
          order_id: string | null
          professional_id: string
          read: boolean
          title: string
          type: string
        }
        Insert: {
          body?: string | null
          client_id?: string | null
          created_at?: string
          id?: string
          order_id?: string | null
          professional_id: string
          read?: boolean
          title: string
          type: string
        }
        Update: {
          body?: string | null
          client_id?: string | null
          created_at?: string
          id?: string
          order_id?: string | null
          professional_id?: string
          read?: boolean
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: 'notifications_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'notifications_order_id_fkey'
            columns: ['order_id']
            isOneToOne: false
            referencedRelation: 'orders'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'notifications_professional_id_fkey'
            columns: ['professional_id']
            isOneToOne: false
            referencedRelation: 'professionals'
            referencedColumns: ['id']
          },
        ]
      }
      orders: {
        Row: {
          archived_at: string | null
          client_id: string
          conversation_id: string | null
          created_at: string
          delivery_address_id: string | null
          delivery_datetime: string | null
          delivery_type: string
          event_date: string | null
          id: string
          internal_notes: string | null
          last_message: string | null
          last_message_at: string | null
          observations: string | null
          painel_status: string
          people_count: number | null
          product_id: string | null
          product_subtype: string | null
          product_type: string
          professional_id: string
          silenced_until: string | null
          status: string
          total_price: number
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          client_id: string
          conversation_id?: string | null
          created_at?: string
          delivery_address_id?: string | null
          delivery_datetime?: string | null
          delivery_type?: string
          event_date?: string | null
          id?: string
          internal_notes?: string | null
          last_message?: string | null
          last_message_at?: string | null
          observations?: string | null
          painel_status?: string
          people_count?: number | null
          product_id?: string | null
          product_subtype?: string | null
          product_type: string
          professional_id: string
          silenced_until?: string | null
          status?: string
          total_price?: number
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          client_id?: string
          conversation_id?: string | null
          created_at?: string
          delivery_address_id?: string | null
          delivery_datetime?: string | null
          delivery_type?: string
          event_date?: string | null
          id?: string
          internal_notes?: string | null
          last_message?: string | null
          last_message_at?: string | null
          observations?: string | null
          painel_status?: string
          people_count?: number | null
          product_id?: string | null
          product_subtype?: string | null
          product_type?: string
          professional_id?: string
          silenced_until?: string | null
          status?: string
          total_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'orders_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'orders_conversation_id_fkey'
            columns: ['conversation_id']
            isOneToOne: false
            referencedRelation: 'conversations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'orders_delivery_address_id_fkey'
            columns: ['delivery_address_id']
            isOneToOne: false
            referencedRelation: 'addresses'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'orders_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'orders_professional_id_fkey'
            columns: ['professional_id']
            isOneToOne: false
            referencedRelation: 'professionals'
            referencedColumns: ['id']
          },
        ]
      }
      payments: {
        Row: {
          deposit_paid_at: string | null
          deposit_percent: number | null
          due_amount: number
          full_paid_at: string | null
          id: string
          method: string | null
          notes: string | null
          order_id: string
          paid_amount: number
          professional_id: string
          status: string
          total_amount: number
        }
        Insert: {
          deposit_paid_at?: string | null
          deposit_percent?: number | null
          due_amount?: number
          full_paid_at?: string | null
          id?: string
          method?: string | null
          notes?: string | null
          order_id: string
          paid_amount?: number
          professional_id: string
          status?: string
          total_amount?: number
        }
        Update: {
          deposit_paid_at?: string | null
          deposit_percent?: number | null
          due_amount?: number
          full_paid_at?: string | null
          id?: string
          method?: string | null
          notes?: string | null
          order_id?: string
          paid_amount?: number
          professional_id?: string
          status?: string
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: 'payments_order_id_fkey'
            columns: ['order_id']
            isOneToOne: false
            referencedRelation: 'orders'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'payments_professional_id_fkey'
            columns: ['professional_id']
            isOneToOne: false
            referencedRelation: 'professionals'
            referencedColumns: ['id']
          },
        ]
      }
      products: {
        Row: {
          available: boolean
          base_price: number | null
          description: string | null
          id: string
          image_emoji: string | null
          max_people: number | null
          min_people: number | null
          name: string
          prep_time_hours: number | null
          price_per_person: number | null
          professional_id: string
          shelf_life_days: number | null
          subtype: string | null
          type: string
        }
        Insert: {
          available?: boolean
          base_price?: number | null
          description?: string | null
          id?: string
          image_emoji?: string | null
          max_people?: number | null
          min_people?: number | null
          name: string
          prep_time_hours?: number | null
          price_per_person?: number | null
          professional_id: string
          shelf_life_days?: number | null
          subtype?: string | null
          type: string
        }
        Update: {
          available?: boolean
          base_price?: number | null
          description?: string | null
          id?: string
          image_emoji?: string | null
          max_people?: number | null
          min_people?: number | null
          name?: string
          prep_time_hours?: number | null
          price_per_person?: number | null
          professional_id?: string
          shelf_life_days?: number | null
          subtype?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: 'products_professional_id_fkey'
            columns: ['professional_id']
            isOneToOne: false
            referencedRelation: 'professionals'
            referencedColumns: ['id']
          },
        ]
      }
      product_taxonomy_reference: {
        Row: {
          created_at: string
          id: string
          product_group: string
          subgroups: string[]
          updated_at: string
          variations: string[]
        }
        Insert: {
          created_at?: string
          id?: string
          product_group: string
          subgroups?: string[]
          updated_at?: string
          variations?: string[]
        }
        Update: {
          created_at?: string
          id?: string
          product_group?: string
          subgroups?: string[]
          updated_at?: string
          variations?: string[]
        }
        Relationships: []
      }
      professionals: {
        Row: {
          auth_user_id: string | null
          business_name: string
          created_at: string
          display_name: string
          id: string
          phone: string | null
          service_rules: string | null
          slug: string | null
          status: string
          updated_at: string
          products_produced: string | null
          product_subgroups: string[]
          product_variations: string[]
          conversation_samples: string | null
        }
        Insert: {
          auth_user_id?: string | null
          business_name: string
          created_at?: string
          display_name: string
          id?: string
          phone?: string | null
          service_rules?: string | null
          slug?: string | null
          status?: string
          updated_at?: string
          products_produced?: string | null
          product_subgroups?: string[]
          product_variations?: string[]
          conversation_samples?: string | null
        }
        Update: {
          auth_user_id?: string | null
          business_name?: string
          created_at?: string
          display_name?: string
          id?: string
          phone?: string | null
          service_rules?: string | null
          slug?: string | null
          status?: string
          updated_at?: string
          products_produced?: string | null
          product_subgroups?: string[]
          product_variations?: string[]
          conversation_samples?: string | null
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

type DefaultSchema = Database['public']

export type Tables<T extends keyof DefaultSchema['Tables']> =
  DefaultSchema['Tables'][T]['Row']

export type TablesInsert<T extends keyof DefaultSchema['Tables']> =
  DefaultSchema['Tables'][T]['Insert']

export type TablesUpdate<T extends keyof DefaultSchema['Tables']> =
  DefaultSchema['Tables'][T]['Update']
