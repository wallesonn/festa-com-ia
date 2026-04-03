export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type SupabaseDatabase = {
  public: {
    Tables: {
      'festa-com-ia-professionals': {
        Row: {
          id: string
          auth_user_id: string | null
          display_name: string
          business_name: string
          phone: string | null
          email: string | null
          products_produced: string | null
          product_subgroups: string[] | null
          product_variations: string[] | null
          onboarding_completed: boolean
          slug: string | null
          style_prompt: string | null
          tone_of_voice: string | null
          service_rules: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          auth_user_id?: string | null
          display_name: string
          business_name: string
          phone?: string | null
          email?: string | null
          products_produced?: string | null
          product_subgroups?: string[] | null
          product_variations?: string[] | null
          onboarding_completed?: boolean
          slug?: string | null
          style_prompt?: string | null
          tone_of_voice?: string | null
          service_rules?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          auth_user_id?: string | null
          display_name?: string
          business_name?: string
          phone?: string | null
          email?: string | null
          products_produced?: string | null
          product_subgroups?: string[] | null
          product_variations?: string[] | null
          onboarding_completed?: boolean
          slug?: string | null
          style_prompt?: string | null
          tone_of_voice?: string | null
          service_rules?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      regras_criacao_tabelas: {
        Row: {
          nome_projeto: string | null
          descricao: string | null
        }
        Insert: {
          nome_projeto?: string | null
          descricao?: string | null
        }
        Update: {
          nome_projeto?: string | null
          descricao?: string | null
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

export type SupabaseTables<T extends keyof SupabaseDatabase['public']['Tables']> =
  SupabaseDatabase['public']['Tables'][T]['Row']
