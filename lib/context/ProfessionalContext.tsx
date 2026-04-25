"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { ProductType, PRODUCT_GROUPS } from '@/lib/types'

type ProfessionalTags = {
  groups: ProductType[]
  subgroups: Record<string, string[]>
  variations: Record<string, string[]>
}

interface ProfessionalContextType {
  tags: ProfessionalTags
  loading: boolean
  refreshTags: () => Promise<void>
}

const ProfessionalContext = createContext<ProfessionalContextType | undefined>(undefined)

export function ProfessionalProvider({ children }: { children: React.ReactNode }) {
  const [tags, setTags] = useState<ProfessionalTags>({
    groups: PRODUCT_GROUPS,
    subgroups: {},
    variations: {},
  })
  const [loading, setLoading] = useState(true)

  async function loadTags() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data: profile } = await supabase
        .from('festa-com-ia-professionals')
        .select('products_produced, product_subgroups, product_variations')
        .eq('auth_user_id', session.user.id)
        .maybeSingle()

      if (profile) {
        let selectedGroups: ProductType[] = []
        const value = profile.products_produced
        
        if (value) {
          try {
            const parsed = JSON.parse(value)
            if (Array.isArray(parsed)) {
              selectedGroups = parsed.filter((item): item is ProductType => PRODUCT_GROUPS.includes(item as ProductType))
            }
          } catch {
            selectedGroups = value.split(',').map((item: string) => item.trim()).filter((item: string): item is ProductType => PRODUCT_GROUPS.includes(item as ProductType))
          }
        }

        setTags({
          groups: selectedGroups.length > 0 ? selectedGroups : PRODUCT_GROUPS,
          subgroups: (profile.product_subgroups as Record<string, string[]> | null) ?? {},
          variations: (profile.product_variations as Record<string, string[]> | null) ?? {},
        })
      }
    } catch (err) {
      console.error('Erro ao carregar tags do profissional:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadTags()
  }, [])

  return (
    <ProfessionalContext.Provider value={{ tags, loading, refreshTags: loadTags }}>
      {children}
    </ProfessionalContext.Provider>
  )
}

export function useProfessional() {
  const context = useContext(ProfessionalContext)
  if (context === undefined) {
    throw new Error('useProfessional deve ser usado dentro de um ProfessionalProvider')
  }
  return context
}
