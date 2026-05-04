import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { getSql } from '@/lib/db/client'
import type { SupabaseDatabase } from '@/lib/supabase/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const uazapiBaseUrl = process.env.UAZAPI_BASE_URL?.replace(/\/$/, '') ?? ''
const uazapiAdminToken = process.env.UAZAPI_ADMIN_TOKEN ?? ''
const uazapiSystemName = process.env.UAZAPI_SYSTEM_NAME?.trim() || 'festa-com-ia'

type SyncProfessionalPayload = {
  id: string
  auth_user_id: string | null
  business_name: string
  phone: string | null
}

type ProfessionalContext = {
  professionalId: string
  supabaseProfessionalId: string
  businessName: string
  phone: string
}

type UazapiRemoteInstance = {
  id?: string
  name?: string
  token?: string
  status?: string
  paircode?: string
  qrcode?: string
  adminField01?: string | null
  adminField02?: string | null
  number?: string | null
  phone?: string | null
  profileName?: string | null
  profilePicUrl?: string | null
  lastDisconnect?: string | null
  lastDisconnectReason?: string | null
}

type UazapiLocalInstanceRow = {
  id: string
  professional_id: string
  instance_id: string
  instance_name: string
  instance_token: string
  linked_phone: string
  connection_status: string
  pair_code: string | null
  qr_code: string | null
  last_disconnect_reason: string | null
  last_checked_at: string | null
  last_connected_at: string | null
}

type UazapiPublicInstance = {
  id: string
  name: string
  linkedPhone: string
  status: string
  pairCode: string | null
  qrCode: string | null
  lastDisconnectReason: string | null
  lastCheckedAt: string | null
  lastConnectedAt: string | null
}

type UazapiConnectionResponse = {
  ok: true
  action: 'status' | 'created' | 'connected' | 'reused'
  exists: boolean
  instance: UazapiPublicInstance | null
}

type UazapiErrorResponse = {
  error: string
}

type UazapiConnectionStatus = 'disconnected' | 'connecting' | 'connected'

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

function sanitizeDigits(value: string) {
  return value.replace(/\D/g, '')
}

function normalizeIdentifier(value: string | null | undefined) {
  return sanitizeDigits(String(value ?? '').trim())
}

function normalizeBrazilPhoneForMatch(value: string | null | undefined) {
  const digits = normalizeIdentifier(value)
  if (!digits) {
    return ''
  }

  const nationalDigits = digits.startsWith('55') ? digits.slice(2) : digits
  if (nationalDigits.length === 11 && nationalDigits.startsWith('9')) {
    return nationalDigits.slice(1)
  }

  return nationalDigits
}

function normalizeNameTokens(value: string | null | undefined) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length >= 4)
}

function matchesBusinessNameCandidate(instance: UazapiRemoteInstance, context: ProfessionalContext) {
  const instanceNameTokens = normalizeNameTokens(instance.name)
  const businessNameTokens = normalizeNameTokens(context.businessName)

  if (instanceNameTokens.length === 0 || businessNameTokens.length === 0) {
    return false
  }

  return instanceNameTokens.some((token) => businessNameTokens.includes(token))
}

function summarizeRemoteInstance(instance: UazapiRemoteInstance) {
  return {
    id: instance.id ?? null,
    name: instance.name ?? null,
    status: instance.status ?? null,
    number: instance.number ?? null,
    phone: instance.phone ?? null,
    adminField01: instance.adminField01 ?? null,
    adminField02: instance.adminField02 ?? null,
  }
}

function normalizeConnectionStatus(value: unknown): UazapiConnectionStatus | undefined {
  if (typeof value !== 'string') {
    return undefined
  }

  const normalized = value.trim().toLowerCase()
  if (normalized === 'connected' || normalized === 'connecting' || normalized === 'disconnected') {
    return normalized
  }

  if (normalized === 'online' || normalized === 'open' || normalized === 'authenticated' || normalized === 'ready') {
    return 'connected'
  }

  if (
    normalized === 'offline' ||
    normalized === 'closed' ||
    normalized === 'logout' ||
    normalized === 'logged_out' ||
    normalized === 'loggedout' ||
    normalized === 'disconnected'
  ) {
    return 'disconnected'
  }

  return undefined
}

function inferConnectionStatus(source: Record<string, unknown>, fallback?: UazapiConnectionStatus): UazapiConnectionStatus | undefined {
  const explicitStatus = normalizeConnectionStatus(
    source.status ??
      source.connectionStatus ??
      source.connection_status ??
      source.state ??
      source.instanceStatus ??
      source.whatsappStatus,
  )

  if (explicitStatus) {
    return explicitStatus
  }

  if (source.paircode || source.pairCode || source.qrcode || source.qrCode) {
    return 'connecting'
  }

  if (
    source.lastDisconnect ||
    source.lastDisconnectReason ||
    source.disconnectedAt ||
    source.logoutAt ||
    source.loggedOutAt ||
    source.closedAt ||
    source.disconnectReason
  ) {
    return 'disconnected'
  }

  if (
    source.connected === true ||
    source.open === true ||
    source.online === true ||
    source.authenticated === true
  ) {
    return 'connected'
  }

  if (
    source.connected === false ||
    source.open === false ||
    source.online === false ||
    source.authenticated === false
  ) {
    return 'disconnected'
  }

  return fallback
}

function buildInstanceName(phone: string) {
  return `fcia-${sanitizeDigits(phone)}`
}

function ensureConfig() {
  if (!uazapiBaseUrl) {
    throw new Error('UAZAPI_BASE_URL não configurada.')
  }

  if (!uazapiAdminToken) {
    throw new Error('UAZAPI_ADMIN_TOKEN não configurado.')
  }
}

async function readResponseBody(response: Response) {
  const raw = await response.text()
  if (!raw) return null

  try {
    return JSON.parse(raw) as unknown
  } catch {
    return raw
  }
}

function extractErrorMessage(payload: unknown, fallback: string) {
  if (!payload) return fallback

  if (typeof payload === 'string') {
    return payload.trim() || fallback
  }

  if (typeof payload === 'object' && payload !== null) {
    const candidate = (payload as Record<string, unknown>).error ?? (payload as Record<string, unknown>).message
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim()
    }
  }

  return fallback
}

function normalizeRemoteInstance(payload: unknown): UazapiRemoteInstance {
  if (!payload || typeof payload !== 'object') {
    return {}
  }

  const source = payload as Record<string, unknown>

  return {
    id: typeof source.id === 'string' ? source.id : undefined,
    name: typeof source.name === 'string' ? source.name : undefined,
    token: typeof source.token === 'string' ? source.token : undefined,
    status: typeof source.status === 'string' ? source.status : undefined,
    paircode: typeof source.paircode === 'string' ? source.paircode : typeof source.pairCode === 'string' ? source.pairCode : undefined,
    qrcode: typeof source.qrcode === 'string' ? source.qrcode : typeof source.qrCode === 'string' ? source.qrCode : undefined,
    adminField01: typeof source.adminField01 === 'string' ? source.adminField01 : null,
    adminField02: typeof source.adminField02 === 'string' ? source.adminField02 : null,
    number: typeof source.number === 'string' ? source.number : typeof source.whatsappNumber === 'string' ? source.whatsappNumber : typeof source.owner === 'string' ? source.owner : null,
    phone: typeof source.phone === 'string' ? source.phone : typeof source.linkedPhone === 'string' ? source.linkedPhone : typeof source.number === 'string' ? source.number : typeof source.whatsappNumber === 'string' ? source.whatsappNumber : typeof source.owner === 'string' ? source.owner : null,
    profileName: typeof source.profileName === 'string' ? source.profileName : undefined,
    profilePicUrl: typeof source.profilePicUrl === 'string' ? source.profilePicUrl : undefined,
    lastDisconnect: typeof source.lastDisconnect === 'string' ? source.lastDisconnect : undefined,
    lastDisconnectReason: typeof source.lastDisconnectReason === 'string' ? source.lastDisconnectReason : undefined,
  }
}

function normalizeRemoteInstances(payload: unknown): UazapiRemoteInstance[] {
  if (Array.isArray(payload)) {
    return payload.map((item) => normalizeRemoteInstance(item)).filter((item) => Boolean(item.id || item.name || item.token))
  }

  if (payload && typeof payload === 'object') {
    const source = payload as Record<string, unknown>
    const candidates = [source.instances, source.data, source.items, source.results]
    for (const candidate of candidates) {
      if (Array.isArray(candidate)) {
        return candidate.map((item) => normalizeRemoteInstance(item)).filter((item) => Boolean(item.id || item.name || item.token))
      }
    }
  }

  return []
}

function matchesProfessionalInstance(instance: UazapiRemoteInstance, context: ProfessionalContext, instanceName: string) {
  const instanceId = normalizeIdentifier(instance.id)
  const instanceToken = normalizeIdentifier(instance.token)
  const instanceNameNormalized = normalizeIdentifier(instance.name)
  const adminField01 = normalizeIdentifier(instance.adminField01)
  const adminField02 = normalizeIdentifier(instance.adminField02)
  const linkedPhone = normalizeBrazilPhoneForMatch(instance.phone)
  const contextProfessionalId = normalizeIdentifier(context.professionalId)
  const contextPhone = normalizeBrazilPhoneForMatch(context.phone)
  const contextPhoneRaw = normalizeIdentifier(context.phone)
  const expectedName = normalizeIdentifier(instanceName)

  return [instanceId, instanceToken, instanceNameNormalized].includes(expectedName) || adminField01 === contextPhone || adminField01 === contextPhoneRaw || adminField01 === contextProfessionalId || adminField02 === contextPhone || adminField02 === contextPhoneRaw || adminField02 === contextProfessionalId || linkedPhone === contextPhone || linkedPhone === contextPhoneRaw
}

function extractConnectionState(payload: unknown): UazapiRemoteInstance {
  if (!payload || typeof payload !== 'object') {
    return {}
  }

  const source = payload as Record<string, unknown>
  const candidates = [source.instance, source.data, source.result, source.response, source]

  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
      continue
    }

    const candidateSource = candidate as Record<string, unknown>
    const normalized = normalizeRemoteInstance(candidateSource)
    const inferredStatus = inferConnectionStatus(candidateSource, normalizeConnectionStatus(source.status))

    if (inferredStatus) {
      normalized.status = inferredStatus
    }

    if (
      normalized.id ||
      normalized.name ||
      normalized.token ||
      normalized.status ||
      normalized.paircode ||
      normalized.qrcode ||
      normalized.phone ||
      normalized.lastDisconnectReason
    ) {
      return normalized
    }
  }

  const normalized = normalizeRemoteInstance(payload)
  const fallbackStatus = inferConnectionStatus(source, normalizeConnectionStatus(source.status))

  if (fallbackStatus) {
    normalized.status = fallbackStatus
  }

  return normalized
}

async function callUazapi<T>(path: string, options: { method?: 'GET' | 'POST'; admin?: boolean; token?: string; body?: unknown } = {}): Promise<T> {
  ensureConfig()

  const { method = 'GET', admin = false, token, body } = options
  const authToken = admin ? uazapiAdminToken : token

  if (!authToken) {
    throw new Error(admin ? 'Token de administrador da Uazapi não configurado.' : 'Token da instância da Uazapi não configurado.')
  }

  const response = await fetch(`${uazapiBaseUrl}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(admin ? { admintoken: authToken } : { token: authToken }),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  })

  const parsedBody = await readResponseBody(response)

  if (!response.ok) {
    throw new Error(extractErrorMessage(parsedBody, `A Uazapi respondeu com status ${response.status}.`))
  }

  return parsedBody as T
}

async function ensureUazapiInstancesTable(sql: ReturnType<typeof getSql>) {
  await sql`
    CREATE TABLE IF NOT EXISTS uazapi_instances (
      id uuid primary key default uuid_generate_v4(),
      professional_id uuid not null unique references professionals(id) on delete cascade,
      instance_id text not null unique,
      instance_name text not null,
      instance_token text not null,
      linked_phone text not null,
      connection_status text not null default 'disconnected',
      pair_code text,
      qr_code text,
      last_disconnect_reason text,
      last_checked_at timestamptz,
      last_connected_at timestamptz,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `
}

async function syncLocalProfessional(profile: SyncProfessionalPayload) {
  if (!profile.phone) {
    throw new Error('Perfil sem telefone cadastrado; não é possível sincronizar o profissional local.')
  }

  const sql = getSql()
  const rows = await sql<{ id: string }[]>`
    INSERT INTO professionals (phone, business_name, created_at, updated_at)
    VALUES (${profile.phone}, ${profile.business_name}, now(), now())
    ON CONFLICT (phone) DO UPDATE
    SET business_name = EXCLUDED.business_name,
        updated_at = now()
    RETURNING id
  `

  const localProfessionalId = rows[0]?.id
  if (!localProfessionalId) {
    throw new Error('Não foi possível sincronizar o profissional no Postgres local.')
  }

  return localProfessionalId
}

async function getProfessionalContext(request: NextRequest) {
  const accessToken = getBearerToken(request)
  if (!accessToken) {
    return { error: 'Sessão inválida.' as const }
  }

  const userClient = createSupabaseUserClient(accessToken)
  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser()

  if (userError || !user) {
    return { error: 'Não foi possível validar sua sessão.' as const }
  }

  const { data: profile, error: profileError } = await userClient
    .from('festa-com-ia-professionals')
    .select('id, auth_user_id, business_name, phone')
    .eq('auth_user_id', user.id)
    .maybeSingle<SyncProfessionalPayload>()

  if (profileError) {
    return { error: 'Não foi possível carregar o perfil do profissional.' as const }
  }

  if (!profile) {
    return { error: 'Perfil do profissional não encontrado no Supabase.' as const }
  }

  if (!profile.phone) {
    return { error: 'Perfil sem telefone cadastrado; não é possível consultar a conexão.' as const }
  }

  const localProfessionalId = await syncLocalProfessional(profile)

  return {
    accessToken,
    professional: {
      professionalId: localProfessionalId,
      supabaseProfessionalId: profile.id,
      businessName: profile.business_name,
      phone: sanitizeDigits(profile.phone),
    },
  }
}

async function getStoredInstance(sql: ReturnType<typeof getSql>, professionalId: string) {
  const rows = await sql<UazapiLocalInstanceRow[]>`
    SELECT
      id,
      professional_id,
      instance_id,
      instance_name,
      instance_token,
      linked_phone,
      connection_status,
      pair_code,
      qr_code,
      last_disconnect_reason,
      last_checked_at,
      last_connected_at
    FROM uazapi_instances
    WHERE professional_id = ${professionalId}
    LIMIT 1
  `

  return rows[0] ?? null
}

async function upsertLocalInstance(
  sql: ReturnType<typeof getSql>,
  context: ProfessionalContext,
  remoteInstance: UazapiRemoteInstance,
  overrides?: Partial<Pick<UazapiLocalInstanceRow, 'connection_status' | 'pair_code' | 'qr_code' | 'last_disconnect_reason' | 'last_checked_at' | 'last_connected_at'>>,
) {
  const instanceId = remoteInstance.id ?? ''
  const instanceName = remoteInstance.name ?? buildInstanceName(context.phone)
  const instanceToken = remoteInstance.token ?? ''
  const linkedPhone = sanitizeDigits(remoteInstance.phone ?? context.phone)

  if (!instanceId || !instanceToken) {
    throw new Error('Não foi possível recuperar o token da instância Uazapi.')
  }

  const rows = await sql<UazapiLocalInstanceRow[]>`
    INSERT INTO uazapi_instances (
      professional_id,
      instance_id,
      instance_name,
      instance_token,
      linked_phone,
      connection_status,
      pair_code,
      qr_code,
      last_disconnect_reason,
      last_checked_at,
      last_connected_at,
      updated_at
    ) VALUES (
      ${context.professionalId},
      ${instanceId},
      ${instanceName},
      ${instanceToken},
      ${linkedPhone},
      ${overrides?.connection_status ?? remoteInstance.status ?? 'disconnected'},
      ${overrides?.pair_code ?? remoteInstance.paircode ?? null},
      ${overrides?.qr_code ?? remoteInstance.qrcode ?? null},
      ${overrides?.last_disconnect_reason ?? remoteInstance.lastDisconnectReason ?? null},
      ${overrides?.last_checked_at ?? new Date().toISOString()},
      ${overrides?.last_connected_at ?? (remoteInstance.status === 'connected' ? new Date().toISOString() : null)},
      now()
    )
    ON CONFLICT (professional_id) DO UPDATE
    SET
      instance_id = EXCLUDED.instance_id,
      instance_name = EXCLUDED.instance_name,
      instance_token = EXCLUDED.instance_token,
      linked_phone = EXCLUDED.linked_phone,
      connection_status = EXCLUDED.connection_status,
      pair_code = EXCLUDED.pair_code,
      qr_code = EXCLUDED.qr_code,
      last_disconnect_reason = EXCLUDED.last_disconnect_reason,
      last_checked_at = EXCLUDED.last_checked_at,
      last_connected_at = COALESCE(EXCLUDED.last_connected_at, uazapi_instances.last_connected_at),
      updated_at = now()
    RETURNING
      id,
      professional_id,
      instance_id,
      instance_name,
      instance_token,
      linked_phone,
      connection_status,
      pair_code,
      qr_code,
      last_disconnect_reason,
      last_checked_at,
      last_connected_at
  `

  return rows[0] ?? null
}

function toPublicInstance(instance: UazapiLocalInstanceRow): UazapiPublicInstance {
  return {
    id: instance.instance_id,
    name: instance.instance_name,
    linkedPhone: instance.linked_phone,
    status: instance.connection_status,
    pairCode: instance.pair_code,
    qrCode: instance.qr_code,
    lastDisconnectReason: instance.last_disconnect_reason,
    lastCheckedAt: instance.last_checked_at,
    lastConnectedAt: instance.last_connected_at,
  }
}

async function listRemoteInstances() {
  const payload = await callUazapi<unknown>('/instance/all', {
    admin: true,
    method: 'GET',
  })

  return normalizeRemoteInstances(payload)
}

async function findRemoteInstanceByContext(context: ProfessionalContext) {
  const instanceName = buildInstanceName(context.phone)
  const remoteInstances = await listRemoteInstances()
  const directMatch = remoteInstances.find((instance) => matchesProfessionalInstance(instance, context, instanceName)) ?? null
  const businessNameMatches = directMatch
    ? []
    : remoteInstances.filter((instance) => matchesBusinessNameCandidate(instance, context))
  const matchingRemote = directMatch ?? (businessNameMatches.length === 1 ? businessNameMatches[0] : null)

  console.info('[uazapi/connection][match]', {
    professionalId: context.professionalId,
    phone: context.phone,
    businessName: context.businessName,
    instanceName,
    remoteCount: remoteInstances.length,
    strategy: directMatch ? 'direct' : matchingRemote ? 'business_name' : 'none',
    matched: matchingRemote ? summarizeRemoteInstance(matchingRemote) : null,
  })

  if (!matchingRemote) {
    console.info('[uazapi/connection][match-candidates]', {
      professionalId: context.professionalId,
      phone: context.phone,
      businessName: context.businessName,
      businessNameMatchCount: businessNameMatches.length,
      candidates: remoteInstances.map((instance) => summarizeRemoteInstance(instance)),
    })
  }

  return matchingRemote
}

async function findRemoteInstanceForStored(context: ProfessionalContext, storedInstance: UazapiLocalInstanceRow) {
  const remoteInstances = await listRemoteInstances()
  const expectedName = buildInstanceName(context.phone)
  const storedInstanceId = normalizeIdentifier(storedInstance.instance_id)
  const storedInstanceToken = normalizeIdentifier(storedInstance.instance_token)
  const storedInstanceName = normalizeIdentifier(storedInstance.instance_name)
  const storedLinkedPhone = normalizeBrazilPhoneForMatch(storedInstance.linked_phone)

  const matchingRemote =
    remoteInstances.find((instance) => {
      const remoteId = normalizeIdentifier(instance.id)
      const remoteToken = normalizeIdentifier(instance.token)
      const remoteName = normalizeIdentifier(instance.name)
      const remotePhone = normalizeBrazilPhoneForMatch(instance.phone)

      return (
        (storedInstanceId && remoteId === storedInstanceId) ||
        (storedInstanceToken && remoteToken === storedInstanceToken) ||
        (storedInstanceName && remoteName === storedInstanceName) ||
        (storedLinkedPhone && remotePhone === storedLinkedPhone) ||
        matchesProfessionalInstance(instance, context, expectedName)
      )
    }) ?? null

  console.info('[uazapi/connection][status-all]', {
    professionalId: context.professionalId,
    instanceId: storedInstance.instance_id,
    instanceName: storedInstance.instance_name,
    remoteCount: remoteInstances.length,
    matched: matchingRemote ? summarizeRemoteInstance(matchingRemote) : null,
  })

  return matchingRemote
}

async function getOrImportStoredInstance(sql: ReturnType<typeof getSql>, context: ProfessionalContext) {
  const storedInstance = await getStoredInstance(sql, context.professionalId)
  if (storedInstance) {
    console.info('[uazapi/connection][local]', {
      professionalId: context.professionalId,
      phone: context.phone,
      instanceId: storedInstance.instance_id,
      instanceName: storedInstance.instance_name,
      status: storedInstance.connection_status,
      linkedPhone: storedInstance.linked_phone,
    })

    return storedInstance
  }

  const remoteInstance = await findRemoteInstanceByContext(context)
  if (!remoteInstance) {
    console.info('[uazapi/connection][local]', {
      professionalId: context.professionalId,
      phone: context.phone,
      imported: false,
      reason: 'no_remote_match',
    })

    return null
  }

  const imported = await upsertLocalInstance(sql, context, remoteInstance, {
    connection_status: remoteInstance.status ?? 'disconnected',
    pair_code: remoteInstance.paircode ?? null,
    qr_code: remoteInstance.qrcode ?? null,
    last_disconnect_reason: remoteInstance.lastDisconnectReason ?? null,
    last_checked_at: new Date().toISOString(),
    last_connected_at: remoteInstance.status === 'connected' ? new Date().toISOString() : null,
  })

  console.info('[uazapi/connection][local]', {
    professionalId: context.professionalId,
    phone: context.phone,
    imported: true,
    instanceId: imported?.instance_id ?? remoteInstance.id ?? null,
    instanceName: imported?.instance_name ?? remoteInstance.name ?? null,
    status: imported?.connection_status ?? remoteInstance.status ?? null,
    linkedPhone: imported?.linked_phone ?? remoteInstance.phone ?? null,
  })

  return imported
}

export async function GET(request: NextRequest) {
  try {
    const professionalContextResult = await getProfessionalContext(request)
    if ('error' in professionalContextResult) {
      return NextResponse.json<UazapiErrorResponse>({ error: professionalContextResult.error ?? 'Não foi possível consultar a conexão do WhatsApp agora.' }, { status: 400 })
    }

    console.info('[uazapi/connection][GET] start', {
      professionalId: professionalContextResult.professional.professionalId,
      phone: professionalContextResult.professional.phone,
      businessName: professionalContextResult.professional.businessName,
    })

    const sql = getSql()
    await ensureUazapiInstancesTable(sql)

    const storedInstance = await getOrImportStoredInstance(sql, professionalContextResult.professional)
    if (!storedInstance) {
      console.info('[uazapi/connection][GET] no instance found')

      return NextResponse.json<UazapiConnectionResponse>({
        ok: true,
        action: 'status',
        exists: false,
        instance: null,
      })
    }

    const remoteInstanceFromAll = await findRemoteInstanceForStored(professionalContextResult.professional, storedInstance)
    const remoteStatus = remoteInstanceFromAll ?? extractConnectionState(
      await callUazapi<unknown>('/instance/status', {
        method: 'GET',
        token: storedInstance.instance_token,
      }),
    )
    const normalizedRemoteStatus = normalizeConnectionStatus(remoteStatus.status) ?? 'disconnected'

    console.info('[uazapi/connection][GET] remote status', {
      professionalId: professionalContextResult.professional.professionalId,
      instanceId: storedInstance.instance_id,
      status: normalizedRemoteStatus,
      source: remoteInstanceFromAll ? 'instance/all' : 'instance/status',
      linkedPhone: storedInstance.linked_phone,
      pairCode: remoteStatus.paircode ?? storedInstance.pair_code ? 'present' : 'absent',
      qrCode: remoteStatus.qrcode ?? storedInstance.qr_code ? 'present' : 'absent',
      lastDisconnectReason: remoteStatus.lastDisconnectReason ?? null,
    })

    const syncedInstance = await upsertLocalInstance(sql, professionalContextResult.professional, {
      ...remoteStatus,
      id: storedInstance.instance_id,
      name: storedInstance.instance_name,
      token: storedInstance.instance_token,
      phone: storedInstance.linked_phone,
    }, {
      connection_status: normalizedRemoteStatus,
      pair_code: remoteStatus.paircode ?? storedInstance.pair_code,
      qr_code: remoteStatus.qrcode ?? storedInstance.qr_code,
      last_disconnect_reason: remoteStatus.lastDisconnectReason ?? storedInstance.last_disconnect_reason,
      last_checked_at: new Date().toISOString(),
      last_connected_at: normalizedRemoteStatus === 'connected' ? new Date().toISOString() : storedInstance.last_connected_at,
    })

    return NextResponse.json<UazapiConnectionResponse>({
      ok: true,
      action: 'status',
      exists: true,
      instance: syncedInstance ? toPublicInstance(syncedInstance) : null,
    })
  } catch (error) {
    console.error('[uazapi/connection][GET]', error)
    return NextResponse.json<UazapiErrorResponse>({
      error: error instanceof Error ? error.message : 'Não foi possível consultar a conexão do WhatsApp agora.',
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const professionalContextResult = await getProfessionalContext(request)
    if ('error' in professionalContextResult) {
      return NextResponse.json<UazapiErrorResponse>({ error: professionalContextResult.error ?? 'Não foi possível conectar o WhatsApp agora.' }, { status: 400 })
    }

    console.info('[uazapi/connection][POST] start', {
      professionalId: professionalContextResult.professional.professionalId,
      phone: professionalContextResult.professional.phone,
      businessName: professionalContextResult.professional.businessName,
    })

    const sql = getSql()
    await ensureUazapiInstancesTable(sql)

    const context = professionalContextResult.professional
    let storedInstance = await getOrImportStoredInstance(sql, context)

    if (!storedInstance) {
      const remoteInstances = await listRemoteInstances()
      console.info('[uazapi/connection][POST] remote list', {
        professionalId: context.professionalId,
        phone: context.phone,
        remoteCount: remoteInstances.length,
      })

      const matchingRemote = remoteInstances.find((instance) => matchesProfessionalInstance(instance, context, buildInstanceName(context.phone)))

      console.info('[uazapi/connection][POST] matching remote', {
        professionalId: context.professionalId,
        phone: context.phone,
        matched: matchingRemote ? summarizeRemoteInstance(matchingRemote) : null,
      })

      if (matchingRemote?.token && matchingRemote.id) {
        storedInstance = await upsertLocalInstance(sql, context, matchingRemote, {
          connection_status: matchingRemote.status ?? 'disconnected',
          pair_code: matchingRemote.paircode ?? null,
          qr_code: matchingRemote.qrcode ?? null,
          last_disconnect_reason: matchingRemote.lastDisconnectReason ?? null,
          last_checked_at: new Date().toISOString(),
          last_connected_at: matchingRemote.status === 'connected' ? new Date().toISOString() : null,
        })
      }
    }

    if (!storedInstance) {
      const instanceName = buildInstanceName(context.phone)
      console.info('[uazapi/connection][POST] creating instance', {
        professionalId: context.professionalId,
        phone: context.phone,
        instanceName,
      })

      const created = normalizeRemoteInstance(
        await callUazapi<unknown>('/instance/create', {
          admin: true,
          method: 'POST',
          body: {
            name: instanceName,
            systemName: uazapiSystemName,
            adminField01: context.phone,
            adminField02: context.professionalId,
          },
        }),
      )

      const createdInstance = await upsertLocalInstance(sql, context, {
        ...created,
        name: created.name ?? instanceName,
        phone: context.phone,
      }, {
        connection_status: created.status ?? 'disconnected',
        pair_code: created.paircode ?? null,
        qr_code: created.qrcode ?? null,
        last_disconnect_reason: created.lastDisconnectReason ?? null,
        last_checked_at: new Date().toISOString(),
        last_connected_at: created.status === 'connected' ? new Date().toISOString() : null,
      })

      if (!createdInstance) {
        throw new Error('A Uazapi não retornou dados suficientes ao criar a instância.')
      }

      storedInstance = createdInstance
    }

    console.info('[uazapi/connection][POST] stored instance ready', {
      professionalId: context.professionalId,
      phone: context.phone,
      instanceId: storedInstance.instance_id,
      instanceName: storedInstance.instance_name,
      status: storedInstance.connection_status,
      linkedPhone: storedInstance.linked_phone,
    })

    const currentStatus = storedInstance.connection_status
    if (currentStatus === 'connected') {
      const statusPayload = extractConnectionState(
        await callUazapi<unknown>('/instance/status', {
          method: 'GET',
          token: storedInstance.instance_token,
        }),
      )

      console.info('[uazapi/connection][POST] reuse connected instance', {
        professionalId: context.professionalId,
        instanceId: storedInstance.instance_id,
        status: statusPayload.status ?? currentStatus,
      })

      const refreshed = await upsertLocalInstance(sql, context, {
        ...statusPayload,
        id: storedInstance.instance_id,
        name: storedInstance.instance_name,
        token: storedInstance.instance_token,
        phone: storedInstance.linked_phone,
      }, {
        connection_status: statusPayload.status ?? currentStatus,
        pair_code: statusPayload.paircode ?? storedInstance.pair_code,
        qr_code: statusPayload.qrcode ?? storedInstance.qr_code,
        last_disconnect_reason: statusPayload.lastDisconnectReason ?? storedInstance.last_disconnect_reason,
        last_checked_at: new Date().toISOString(),
        last_connected_at: statusPayload.status === 'connected' ? new Date().toISOString() : storedInstance.last_connected_at,
      })

      return NextResponse.json<UazapiConnectionResponse>({
        ok: true,
        action: 'reused',
        exists: true,
        instance: refreshed ? toPublicInstance(refreshed) : null,
      })
    }

    const connectPayload = extractConnectionState(
      await callUazapi<unknown>('/instance/connect', {
        method: 'POST',
        token: storedInstance.instance_token,
        body: {
          phone: context.phone,
        },
      }),
    )

    console.info('[uazapi/connection][POST] connect response', {
      professionalId: context.professionalId,
      instanceId: storedInstance.instance_id,
      status: connectPayload.status ?? 'connecting',
      pairCode: connectPayload.paircode ? 'present' : 'absent',
      qrCode: connectPayload.qrcode ? 'present' : 'absent',
    })

    const refreshedStatus = await upsertLocalInstance(sql, context, {
      ...connectPayload,
      id: storedInstance.instance_id,
      name: storedInstance.instance_name,
      token: storedInstance.instance_token,
      phone: storedInstance.linked_phone,
    }, {
      connection_status: connectPayload.status ?? 'connecting',
      pair_code: connectPayload.paircode ?? storedInstance.pair_code,
      qr_code: connectPayload.qrcode ?? storedInstance.qr_code,
      last_disconnect_reason: connectPayload.lastDisconnectReason ?? storedInstance.last_disconnect_reason,
      last_checked_at: new Date().toISOString(),
      last_connected_at: connectPayload.status === 'connected' ? new Date().toISOString() : storedInstance.last_connected_at,
    })

    const confirmStatus = refreshedStatus
      ? toPublicInstance(refreshedStatus)
      : {
          id: storedInstance.instance_id,
          name: storedInstance.instance_name,
          linkedPhone: storedInstance.linked_phone,
          status: connectPayload.status ?? 'connecting',
          pairCode: connectPayload.paircode ?? storedInstance.pair_code,
          qrCode: connectPayload.qrcode ?? storedInstance.qr_code,
          lastDisconnectReason: connectPayload.lastDisconnectReason ?? storedInstance.last_disconnect_reason,
          lastCheckedAt: new Date().toISOString(),
          lastConnectedAt: connectPayload.status === 'connected' ? new Date().toISOString() : storedInstance.last_connected_at,
        }

    return NextResponse.json<UazapiConnectionResponse>({
      ok: true,
      action: currentStatus === 'connected' ? 'reused' : storedInstance.connection_status === 'disconnected' ? 'created' : 'connected',
      exists: true,
      instance: confirmStatus,
    })
  } catch (error) {
    console.error('[uazapi/connection][POST]', error)
    return NextResponse.json<UazapiErrorResponse>({
      error: error instanceof Error ? error.message : 'Não foi possível conectar o WhatsApp agora.',
    }, { status: 500 })
  }
}
