import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSql } from '@/lib/db/client'
import type { SupabaseDatabase } from '@/lib/supabase/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const storageBucket = 'festa-com-ia'

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

function createSupabaseAdminClient() {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return null
  }

  return createClient<SupabaseDatabase>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    const accessToken = getBearerToken(request)
    if (!accessToken) {
      return NextResponse.json({ error: 'Sessão inválida.' }, { status: 401 })
    }

    if (!supabaseServiceRoleKey) {
      return NextResponse.json(
        { error: 'A exclusão total da conta exige SUPABASE_SERVICE_ROLE_KEY configurada no servidor.' },
        { status: 500 },
      )
    }

    const userClient = createSupabaseUserClient(accessToken)
    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Não foi possível validar sua sessão.' }, { status: 401 })
    }

    const adminClient = createSupabaseAdminClient()
    if (!adminClient) {
      return NextResponse.json(
        { error: 'A exclusão total da conta exige SUPABASE_SERVICE_ROLE_KEY configurada no servidor.' },
        { status: 500 },
      )
    }

    const sql = getSql()

    const { data: profile, error: profileError } = await userClient
      .from('festa-com-ia-professionals')
      .select('id, photo_path')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    if (profileError) {
      return NextResponse.json({ error: 'Não foi possível localizar o perfil do profissional.' }, { status: 500 })
    }

    await sql`
      DELETE FROM professionals
      WHERE auth_user_id = ${user.id}
    `

    if (profile?.photo_path) {
      await adminClient.storage.from(storageBucket).remove([profile.photo_path])
    }

    const { error: profileDeleteError } = await adminClient
      .from('festa-com-ia-professionals')
      .delete()
      .eq('auth_user_id', user.id)

    if (profileDeleteError) {
      return NextResponse.json({ error: 'Os dados operacionais foram removidos, mas não foi possível apagar o perfil do Supabase.' }, { status: 500 })
    }

    const { error: deleteUserError } = await adminClient.auth.admin.deleteUser(user.id)
    if (deleteUserError) {
      return NextResponse.json({ error: 'Os dados foram removidos, mas não foi possível excluir o acesso do usuário no Supabase Auth.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[account/delete] erro:', error)
    return NextResponse.json({ error: 'Não foi possível excluir a conta agora.' }, { status: 500 })
  }
}
