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
      profiles: {
        Row: {
          id: string
          display_name: string | null
          business_name: string | null
          phone: string | null
          email: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          business_name?: string | null
          phone?: string | null
          email?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_name?: string | null
          business_name?: string | null
          phone?: string | null
          email?: string | null
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
