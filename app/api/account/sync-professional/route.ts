import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSql } from '@/lib/db/client'
import type { SupabaseDatabase } from '@/lib/supabase/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

type SyncProfessionalPayload = {
  id: string
  auth_user_id: string | null
  display_name: string
  business_name: string
  phone: string | null
  slug: string | null
  service_rules: string | null
  products_produced: string | null
  product_subgroups: string[] | null
  product_variations: string[] | null
  conversation_samples: string | null
}

function getBearerToken(request: NextRequest) {
  const header = request.headers.get('authorization')
  if (!header?.startsWith('Bearer ')) return null
  return header.slice('Bearer '.length).trim()
}

function createSupabaseUserClient(accessToken: string) {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Variáveis públicas do Supabase não configuradas no servidor.')
  }

  return createClient<SupabaseDatabase>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    const accessToken = getBearerToken(request)
    if (!accessToken) {
      return NextResponse.json({ error: 'Sessão inválida.' }, { status: 401 })
    }

    const userClient = createSupabaseUserClient(accessToken)
    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Não foi possível validar sua sessão.' }, { status: 401 })
    }

    const { data: profile, error: profileError } = await userClient
      .from('festa-com-ia-professionals')
      .select('id, auth_user_id, display_name, business_name, phone, slug, service_rules, products_produced, product_subgroups, product_variations, conversation_samples')
      .eq('auth_user_id', user.id)
      .maybeSingle<SyncProfessionalPayload>()

    if (profileError) {
      return NextResponse.json({ error: 'Não foi possível carregar o perfil do profissional.' }, { status: 500 })
    }

    if (!profile) {
      return NextResponse.json({ error: 'Perfil do profissional não encontrado no Supabase.' }, { status: 404 })
    }

    const sql = getSql()

    const subgroups = profile.product_subgroups ?? []
    const variations = profile.product_variations ?? []

    const updatedRows = await sql<{ id: string }[]>`
      UPDATE professionals
      SET
        display_name = ${profile.display_name},
        business_name = ${profile.business_name},
        phone = ${profile.phone},
        slug = ${profile.slug},
        service_rules = ${profile.service_rules},
        products_produced = ${profile.products_produced},
        product_subgroups = ${subgroups},
        product_variations = ${variations},
        conversation_samples = ${profile.conversation_samples},
        updated_at = now()
      WHERE auth_user_id = ${user.id}
      RETURNING id
    `

    let localProfessionalId = updatedRows[0]?.id ?? null

    if (!localProfessionalId) {
      const insertedRows = await sql<{ id: string }[]>`
        INSERT INTO professionals (
          auth_user_id,
          display_name,
          business_name,
          phone,
          slug,
          service_rules,
          products_produced,
          product_subgroups,
          product_variations,
          conversation_samples,
          status,
          created_at,
          updated_at
        ) VALUES (
          ${user.id},
          ${profile.display_name},
          ${profile.business_name},
          ${profile.phone},
          ${profile.slug},
          ${profile.service_rules},
          ${profile.products_produced},
          ${subgroups},
          ${variations},
          ${profile.conversation_samples},
          'active',
          now(),
          now()
        )
        RETURNING id
      `

      localProfessionalId = insertedRows[0]?.id ?? null
    }

    return NextResponse.json({
      ok: true,
      professionalId: localProfessionalId,
    })
  } catch (error) {
    console.error('[account/sync-professional] erro:', error)
    return NextResponse.json({ error: 'Não foi possível sincronizar o perfil com o Postgres local agora.' }, { status: 500 })
  }
}
