import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSql } from '@/lib/db/client'
import type { SupabaseDatabase } from '@/lib/supabase/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

type SyncProfessionalPayload = {
  id: string
  auth_user_id: string | null
  business_name: string
  phone: string | null
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
      .select('id, auth_user_id, business_name, phone')
      .eq('auth_user_id', user.id)
      .maybeSingle<SyncProfessionalPayload>()

    if (profileError) {
      return NextResponse.json({ error: 'Não foi possível carregar o perfil do profissional.' }, { status: 500 })
    }

    if (!profile) {
      return NextResponse.json({ error: 'Perfil do profissional não encontrado no Supabase.' }, { status: 404 })
    }

    if (!profile.phone) {
      return NextResponse.json({ error: 'Perfil sem telefone cadastrado; não é possível sincronizar.' }, { status: 400 })
    }

    const sql = getSql()

    const upsertedRows = await sql<{ id: string }[]>`
      INSERT INTO professionals (phone, business_name, created_at, updated_at)
      VALUES (${profile.phone}, ${profile.business_name}, now(), now())
      ON CONFLICT (phone) DO UPDATE
      SET business_name = EXCLUDED.business_name,
          updated_at = now()
      RETURNING id
    `

    const localProfessionalId = upsertedRows[0]?.id ?? null

    return NextResponse.json({
      ok: true,
      professionalId: localProfessionalId,
    })
  } catch (error) {
    console.error('[account/sync-professional] erro:', error)
    return NextResponse.json({ error: 'Não foi possível sincronizar o perfil com o Postgres local agora.' }, { status: 500 })
  }
}
