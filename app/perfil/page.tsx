"use client"

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'
import { PRODUCT_GROUPS } from '@/lib/types'

const STORAGE_BUCKET = 'festa-com-ia'

const PROFILE_FIELD_LIMITS = {
  businessName: 80,
  phoneNumber: 9,
  conversationSamples: 10000,
  serviceRules: 2500,
  rulesCustomNotes: 500,
  deleteConfirmation: 7,
} as const

type RulesBuilderState = {
  hours: 'horario_comercial' | 'manha' | 'tarde' | 'noite' | 'sob_consulta'
  delivery: 'sim' | 'nao' | 'depende' | 'somente_retirada'
  cakes: boolean
  sweets: boolean
  meals: boolean
  savory: boolean
  lactoseFree: boolean
  glutenFree: boolean
  sugarFree: boolean
  veganOptions: boolean
  customNotes: string
}

const RULES_HOURS_OPTIONS = [
  {
    value: 'horario_comercial',
    label: 'Horário comercial',
    hint: 'Atende em horário comercial',
  },
  {
    value: 'manha',
    label: 'Manhã',
    hint: 'Atende pela manhã',
  },
  {
    value: 'tarde',
    label: 'Tarde',
    hint: 'Atende à tarde',
  },
  {
    value: 'noite',
    label: 'Noite',
    hint: 'Atende à noite',
  },
  {
    value: 'sob_consulta',
    label: 'Sob consulta',
    hint: 'Horário flexível, conforme combinado',
  },
] as const

const RULES_DELIVERY_OPTIONS = [
  { value: 'sim', label: 'Sim', hint: 'Faz delivery' },
  { value: 'nao', label: 'Não', hint: 'Não faz delivery' },
  { value: 'depende', label: 'Depende', hint: 'Depende do produto ou da região' },
  { value: 'somente_retirada', label: 'Somente retirada', hint: 'Funciona apenas por retirada' },
] as const

const RULES_PRODUCT_OPTIONS = [
  { key: 'cakes' as const, label: 'Bolos e tortas', hint: 'Bolos de festa, bolos caseiros e tortas' },
  { key: 'sweets' as const, label: 'Doces e sobremesas', hint: 'Brigadeiros, brownies, pudins e afins' },
  { key: 'meals' as const, label: 'Refeições', hint: 'Marmitas, pratos feitos e refeições completas' },
  { key: 'savory' as const, label: 'Salgados', hint: 'Lanches, salgadinhos e itens de festa' },
] as const

const RULES_DIETARY_OPTIONS = [
  { key: 'lactoseFree' as const, label: 'Sem lactose', hint: 'Opções sem leite ou derivados' },
  { key: 'glutenFree' as const, label: 'Sem glúten', hint: 'Opções sem trigo ou glúten' },
  { key: 'sugarFree' as const, label: 'Sem açúcar', hint: 'Opções diet ou sem açúcar' },
  { key: 'veganOptions' as const, label: 'Veganas', hint: 'Opções sem ingredientes de origem animal' },
] as const

const DEFAULT_RULES_BUILDER: RulesBuilderState = {
  hours: 'horario_comercial',
  delivery: 'depende',
  cakes: true,
  sweets: true,
  meals: false,
  savory: false,
  lactoseFree: false,
  glutenFree: false,
  sugarFree: false,
  veganOptions: false,
  customNotes: '',
}

const BRAZIL_COUNTRY_CODE = '55' as const

const BRAZIL_DDD_OPTIONS = [
  { value: '11', label: '11 - SP' },
  { value: '12', label: '12 - SP' },
  { value: '13', label: '13 - SP' },
  { value: '14', label: '14 - SP' },
  { value: '15', label: '15 - SP' },
  { value: '16', label: '16 - SP' },
  { value: '17', label: '17 - SP' },
  { value: '18', label: '18 - SP' },
  { value: '19', label: '19 - SP' },
  { value: '21', label: '21 - RJ' },
  { value: '22', label: '22 - RJ' },
  { value: '24', label: '24 - RJ' },
  { value: '27', label: '27 - ES' },
  { value: '28', label: '28 - ES' },
  { value: '31', label: '31 - MG' },
  { value: '32', label: '32 - MG' },
  { value: '33', label: '33 - MG' },
  { value: '34', label: '34 - MG' },
  { value: '35', label: '35 - MG' },
  { value: '37', label: '37 - MG' },
  { value: '38', label: '38 - MG' },
  { value: '41', label: '41 - PR' },
  { value: '42', label: '42 - PR' },
  { value: '43', label: '43 - PR' },
  { value: '44', label: '44 - PR' },
  { value: '45', label: '45 - PR' },
  { value: '46', label: '46 - PR' },
  { value: '47', label: '47 - SC' },
  { value: '48', label: '48 - SC' },
  { value: '49', label: '49 - SC' },
  { value: '51', label: '51 - RS' },
  { value: '53', label: '53 - RS' },
  { value: '54', label: '54 - RS' },
  { value: '55', label: '55 - RS' },
  { value: '61', label: '61 - DF' },
  { value: '62', label: '62 - GO' },
  { value: '63', label: '63 - TO' },
  { value: '64', label: '64 - GO' },
  { value: '65', label: '65 - MT' },
  { value: '66', label: '66 - MT' },
  { value: '67', label: '67 - MS' },
  { value: '68', label: '68 - AC' },
  { value: '69', label: '69 - RO' },
  { value: '71', label: '71 - BA' },
  { value: '73', label: '73 - BA' },
  { value: '74', label: '74 - BA' },
  { value: '75', label: '75 - BA' },
  { value: '77', label: '77 - BA' },
  { value: '79', label: '79 - SE' },
  { value: '81', label: '81 - PE' },
  { value: '82', label: '82 - AL' },
  { value: '83', label: '83 - PB' },
  { value: '84', label: '84 - RN' },
  { value: '85', label: '85 - CE' },
  { value: '86', label: '86 - PI' },
  { value: '87', label: '87 - PE' },
  { value: '88', label: '88 - CE' },
  { value: '89', label: '89 - PI' },
  { value: '91', label: '91 - PA' },
  { value: '92', label: '92 - AM' },
  { value: '93', label: '93 - PA' },
  { value: '94', label: '94 - PA' },
  { value: '95', label: '95 - RR' },
  { value: '96', label: '96 - AP' },
  { value: '97', label: '97 - AM' },
  { value: '98', label: '98 - MA' },
  { value: '99', label: '99 - MA' },
] as const

function sanitizeDigits(value: string) {
  return value.replace(/\D/g, '')
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

function sanitizeSingleLineText(value: string, maxLength: number) {
  return normalizeWhitespace(value.replace(/[\u0000-\u001F\u007F]/g, '')).slice(0, maxLength)
}

function sanitizeMultilineText(value: string, maxLength: number) {
  return value
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, maxLength)
}

function parseBrazilPhone(value: string | null | undefined) {
  const digits = sanitizeDigits(value ?? '')

  if (!digits) {
    return {
      countryCode: BRAZIL_COUNTRY_CODE,
      ddd: '',
      localNumber: '',
    }
  }

  if (digits.startsWith(BRAZIL_COUNTRY_CODE) && digits.length >= 12) {
    return {
      countryCode: BRAZIL_COUNTRY_CODE,
      ddd: digits.slice(2, 4),
      localNumber: digits.slice(4),
    }
  }

  if (digits.length >= 10) {
    return {
      countryCode: BRAZIL_COUNTRY_CODE,
      ddd: digits.slice(0, 2),
      localNumber: digits.slice(2),
    }
  }

  return {
    countryCode: BRAZIL_COUNTRY_CODE,
    ddd: '',
    localNumber: digits,
  }
}

function normalizeBrazilLocalNumber(value: string) {
  const digits = sanitizeDigits(value)

  if (digits.length === 8) {
    return `9${digits}`
  }

  return digits
}

function buildBrazilPhoneNumber(countryCode: string, ddd: string, localNumber: string) {
  const sanitizedCountryCode = sanitizeDigits(countryCode)
  const sanitizedDdd = sanitizeDigits(ddd)
  const sanitizedLocalNumber = sanitizeDigits(localNumber)
  const normalizedLocalNumber = normalizeBrazilLocalNumber(sanitizedLocalNumber)

  if (sanitizedCountryCode !== BRAZIL_COUNTRY_CODE) {
    throw new Error('O cadastro aceita apenas números do Brasil.')
  }

  if (sanitizedDdd.length !== 2) {
    throw new Error('Selecione um DDD válido.')
  }

  if (normalizedLocalNumber.length !== 9) {
    throw new Error('Informe um número com 8 ou 9 dígitos.')
  }

  return `${BRAZIL_COUNTRY_CODE}${sanitizedDdd}${normalizedLocalNumber}`
}

function joinPortugueseList(items: string[]) {
  if (items.length <= 1) return items[0] ?? ''
  if (items.length === 2) return `${items[0]} e ${items[1]}`

  return `${items.slice(0, -1).join(', ')} e ${items[items.length - 1]}`
}

function buildServiceRulesText(builder: RulesBuilderState) {
  const hoursLabel = RULES_HOURS_OPTIONS.find((option) => option.value === builder.hours)?.label ?? 'Horário comercial'
  const deliveryLabel = RULES_DELIVERY_OPTIONS.find((option) => option.value === builder.delivery)?.label ?? 'Depende'
  const sanitizedCustomNotes = sanitizeMultilineText(builder.customNotes, PROFILE_FIELD_LIMITS.rulesCustomNotes)

  const products = [
    builder.cakes ? 'bolos e tortas' : null,
    builder.sweets ? 'doces e sobremesas' : null,
    builder.meals ? 'refeições' : null,
    builder.savory ? 'salgados' : null,
  ].filter((item): item is string => Boolean(item))

  const dietaryOptions = [
    builder.lactoseFree ? 'sem lactose' : null,
    builder.glutenFree ? 'sem glúten' : null,
    builder.sugarFree ? 'sem açúcar' : null,
    builder.veganOptions ? 'opções veganas' : null,
  ].filter((item): item is string => Boolean(item))

  const lines = [
    'Regras de atendimento:',
    `- Horário de atendimento: ${hoursLabel.toLowerCase()}.`,
    `- Delivery: ${deliveryLabel.toLowerCase()}.`,
    products.length ? `- Trabalha com ${joinPortugueseList(products)}.` : '- Tipos de produto a confirmar conforme o pedido.',
    dietaryOptions.length
      ? `- Oferece ${joinPortugueseList(dietaryOptions)}.`
      : '- Restrições alimentares e versões especiais a confirmar conforme o item.',
    sanitizedCustomNotes ? `- Observações extras: ${sanitizedCustomNotes}.` : null,
  ]

  return lines.filter((line): line is string => Boolean(line)).join('\n')
}

type ProfileForm = {
  phoneCountryCode: string
  phoneDdd: string
  phoneNumber: string
  businessName: string
  productsProduced: string[]
  conversationSamples: string
  serviceRules: string
}

type UazapiConnectionState = {
  status: 'unknown' | 'not_created' | 'disconnected' | 'connecting' | 'connected'
  instanceId: string | null
  instanceName: string | null
  linkedPhone: string | null
  pairCode: string | null
  qrCode: string | null
  lastDisconnectReason: string | null
  lastCheckedAt: string | null
  lastConnectedAt: string | null
  loading: boolean
  actionLoading: boolean
  message: string | null
}

type UazapiConnectionApiResponse = {
  ok: true
  action: 'status' | 'created' | 'connected' | 'reused'
  exists: boolean
  instance: {
    id: string
    name: string
    linkedPhone: string
    status: string
    pairCode: string | null
    qrCode: string | null
    lastDisconnectReason: string | null
    lastCheckedAt: string | null
    lastConnectedAt: string | null
  } | null
}

type UazapiConnectionErrorResponse = {
  error: string
}

function parseProductsProduced(value: string | null | undefined) {
  if (!value) return []

  try {
    const parsed = JSON.parse(value)
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    }
  } catch {
    // fallback para legado em texto livre
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export default function PerfilPage() {
  const [email, setEmail] = useState('')
  const [userId, setUserId] = useState('')
  const [professionalId, setProfessionalId] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isFirstAccess, setIsFirstAccess] = useState(false)
  const [photoPath, setPhotoPath] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [isStyleModalOpen, setIsStyleModalOpen] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [rulesBuilder, setRulesBuilder] = useState<RulesBuilderState>(DEFAULT_RULES_BUILDER)
  const [uazapiConnection, setUazapiConnection] = useState<UazapiConnectionState>({
    status: 'unknown',
    instanceId: null,
    instanceName: null,
    linkedPhone: null,
    pairCode: null,
    qrCode: null,
    lastDisconnectReason: null,
    lastCheckedAt: null,
    lastConnectedAt: null,
    loading: false,
    actionLoading: false,
    message: null,
  })
  const [form, setForm] = useState<ProfileForm>({
    phoneCountryCode: BRAZIL_COUNTRY_CODE,
    phoneDdd: '',
    phoneNumber: '',
    businessName: '',
    productsProduced: [],
    conversationSamples: '',
    serviceRules: '',
  })
  const router = useRouter()

  const normalizedEmail = useMemo(() => email.trim().toLowerCase().replace(/@/g, '-').replace(/\./g, '-'), [email])
  const professionalWhatsAppNumber = useMemo(() => {
    try {
      return buildBrazilPhoneNumber(form.phoneCountryCode, form.phoneDdd, form.phoneNumber)
    } catch {
      return ''
    }
  }, [form.phoneCountryCode, form.phoneDdd, form.phoneNumber])
  const currentPhotoUrl = useMemo(() => {
    if (!photoPath) return ''
    return supabase.storage.from(STORAGE_BUCKET).getPublicUrl(photoPath).data.publicUrl
  }, [photoPath])
  const businessNameLength = form.businessName.length
  const conversationSamplesLength = form.conversationSamples.length
  const serviceRulesLength = form.serviceRules.length
  const rulesCustomNotesLength = rulesBuilder.customNotes.length
  const uazapiStatusLabelMap: Record<UazapiConnectionState['status'], string> = {
    unknown: 'Verificando',
    not_created: 'Não criado',
    disconnected: 'Desconectado',
    connecting: 'Aguardando pareamento',
    connected: 'Conectado',
  }
  const uazapiStatusLabel = uazapiStatusLabelMap[uazapiConnection.status]

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreview(null)
      return
    }

    const objectUrl = URL.createObjectURL(photoFile)
    setPhotoPreview(objectUrl)

    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [photoFile])

  function buildPhotoPath(filename: string) {
    const safeFileName = filename.replace(/\s+/g, '-').toLowerCase()
    return `${normalizedEmail}/profile-${Date.now()}-${safeFileName}`
  }

  const applyUazapiConnectionState = useCallback((payload: UazapiConnectionApiResponse, fallbackMessage: string) => {
    const instance = payload.instance
    const status = instance?.status === 'connected' || instance?.status === 'connecting' || instance?.status === 'disconnected'
      ? instance.status
      : payload.exists
        ? 'disconnected'
        : 'not_created'

    setUazapiConnection({
      status,
      instanceId: instance?.id ?? null,
      instanceName: instance?.name ?? null,
      linkedPhone: instance?.linkedPhone ?? null,
      pairCode: instance?.pairCode ?? null,
      qrCode: instance?.qrCode ?? null,
      lastDisconnectReason: instance?.lastDisconnectReason ?? null,
      lastCheckedAt: instance?.lastCheckedAt ?? null,
      lastConnectedAt: instance?.lastConnectedAt ?? null,
      loading: false,
      actionLoading: false,
      message:
        status === 'connected'
          ? 'WhatsApp conectado.'
          : status === 'connecting' && instance?.pairCode
            ? 'WhatsApp aguardando pareamento.'
            : fallbackMessage,
    })
  }, [])

  const refreshUazapiConnection = useCallback(async (token = accessToken, phone = professionalWhatsAppNumber, silent = false) => {
    if (!token || !phone) {
      console.info('[perfil/uazapi] refresh skipped', {
        hasToken: Boolean(token),
        hasPhone: Boolean(phone),
      })

      setUazapiConnection((prev) => ({
        ...prev,
        status: 'not_created',
        loading: false,
        actionLoading: false,
        message: 'Complete o cadastro do WhatsApp para habilitar a conexão.',
      }))
      return
    }

    console.info('[perfil/uazapi] refresh start', {
      phone,
      silent,
      currentStatus: uazapiConnection.status,
    })

    setUazapiConnection((prev) => ({
      ...prev,
      loading: true,
      message: silent ? prev.message : 'Verificando a conexão do WhatsApp...',
    }))

    try {
      const response = await fetch('/api/uazapi/connection', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const result = (await response.json().catch(() => null)) as UazapiConnectionApiResponse | UazapiConnectionErrorResponse | null

      if (!response.ok || !result || !('ok' in result)) {
        throw new Error((result && 'error' in result ? result.error : null) ?? 'Não foi possível consultar a conexão do WhatsApp agora.')
      }

      console.info('[perfil/uazapi] refresh result', {
        action: result.action,
        exists: result.exists,
        instanceId: result.instance?.id ?? null,
        instanceName: result.instance?.name ?? null,
        status: result.instance?.status ?? null,
        linkedPhone: result.instance?.linkedPhone ?? null,
        pairCode: result.instance?.pairCode ? 'present' : 'absent',
        qrCode: result.instance?.qrCode ? 'present' : 'absent',
      })

      applyUazapiConnectionState(result, 'Conexão do WhatsApp atualizada.')
    } catch (connectionError) {
      const message = connectionError instanceof Error ? connectionError.message : 'Não foi possível consultar a conexão do WhatsApp agora.'
      console.error('[perfil/uazapi] refresh error', {
        phone,
        message,
      })

      setUazapiConnection((prev) => ({
        ...prev,
        loading: false,
        actionLoading: false,
        message,
        status: prev.status === 'unknown' ? 'unknown' : prev.status,
      }))
    }
  }, [accessToken, applyUazapiConnectionState, professionalWhatsAppNumber])

  const handleConnectWhatsApp = useCallback(async () => {
    setFeedback(null)
    setError(null)

    if (!accessToken) {
      setError('Sessão inválida. Faça login novamente para conectar o WhatsApp.')
      return
    }

    if (!professionalWhatsAppNumber) {
      setError('Informe o DDD e o número do WhatsApp antes de conectar.')
      return
    }

    console.info('[perfil/uazapi] connect start', {
      phone: professionalWhatsAppNumber,
    })

    setUazapiConnection((prev) => ({
      ...prev,
      actionLoading: true,
      message: 'Criando ou reutilizando a instância da Uazapi...',
    }))

    try {
      const response = await fetch('/api/uazapi/connection', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      const result = (await response.json().catch(() => null)) as UazapiConnectionApiResponse | UazapiConnectionErrorResponse | null

      if (!response.ok || !result || !('ok' in result)) {
        throw new Error((result && 'error' in result ? result.error : null) ?? 'Não foi possível conectar o WhatsApp agora.')
      }

      console.info('[perfil/uazapi] connect result', {
        action: result.action,
        exists: result.exists,
        instanceId: result.instance?.id ?? null,
        instanceName: result.instance?.name ?? null,
        status: result.instance?.status ?? null,
        linkedPhone: result.instance?.linkedPhone ?? null,
        pairCode: result.instance?.pairCode ? 'present' : 'absent',
        qrCode: result.instance?.qrCode ? 'present' : 'absent',
      })

      applyUazapiConnectionState(result, 'WhatsApp pronto para pareamento.')

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('uazapi-connection-updated'))
      }
    } catch (connectionError) {
      const message = connectionError instanceof Error ? connectionError.message : 'Não foi possível conectar o WhatsApp agora.'
      console.error('[perfil/uazapi] connect error', {
        phone: professionalWhatsAppNumber,
        message,
      })

      setUazapiConnection((prev) => ({
        ...prev,
        actionLoading: false,
        loading: false,
        message,
      }))
      setError(message)
    }
  }, [accessToken, applyUazapiConnectionState, professionalWhatsAppNumber, refreshUazapiConnection])

  useEffect(() => {
    let active = true

    async function loadUser() {
      setLoading(true)
      setError(null)

      const { data: authData, error: authError } = await supabase.auth.getUser()
      if (!active) return

      if (authError || !authData.user) {
        console.warn('[perfil/uazapi] auth invalid while loading profile', {
          hasUser: Boolean(authData.user),
          error: authError?.message ?? null,
        })

        router.replace('/login')
        return
      }

      const user = authData.user
      setUserId(user.id)

      const { data: profile, error: profileError } = await supabase
        .from('festa-com-ia-professionals')
        .select('id,business_name,phone,email,photo_path,products_produced,conversation_samples,service_rules,onboarding_completed')
        .eq('auth_user_id', user.id)
        .maybeSingle()

      if (!active) return

      if (profileError) {
        setError(profileError.message)
      }

      const selectedProducts = parseProductsProduced(profile?.products_produced)
      const parsedPhone = parseBrazilPhone(profile?.phone)
      const firstAccess =
        !profile ||
        !profile.onboarding_completed

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      if (!active) return

      console.info('[perfil/uazapi] profile loaded', {
        userId: user.id,
        hasProfile: Boolean(profile),
        businessName: profile?.business_name ?? null,
        phone: profile?.phone ?? null,
        sessionReady: Boolean(sessionData.session?.access_token),
      })

      setIsFirstAccess(firstAccess)
      setProfessionalId(profile?.id ?? '')
      setEmail(profile?.email ?? user.email ?? '')
      setPhotoPath(profile?.photo_path ?? null)
      const sessionAccessToken = sessionData.session?.access_token ?? ''
      setAccessToken(sessionAccessToken)
      setForm({
        phoneCountryCode: parsedPhone.countryCode,
        phoneDdd: parsedPhone.ddd,
        phoneNumber: parsedPhone.localNumber,
        businessName: profile?.business_name ?? '',
        productsProduced: selectedProducts,
        conversationSamples: profile?.conversation_samples ?? '',
        serviceRules: profile?.service_rules ?? '',
      })

      if (sessionError || !sessionAccessToken) {
        console.warn('[perfil/uazapi] session unavailable for connection check', {
          error: sessionError?.message ?? null,
        })

        setUazapiConnection((prev) => ({
          ...prev,
          loading: false,
          actionLoading: false,
          status: 'unknown',
          message: 'Faça login novamente para consultar a conexão do WhatsApp.',
        }))
      } else if (profile?.phone) {
        console.info('[perfil/uazapi] triggering initial refresh', {
          phone: sanitizeDigits(profile.phone),
        })

        void refreshUazapiConnection(sessionAccessToken, sanitizeDigits(profile.phone), true)
      }

      setLoading(false)
    }

    loadUser()

    return () => {
      active = false
    }
  }, [refreshUazapiConnection, router])

  useEffect(() => {
    if (uazapiConnection.status !== 'connecting' || !accessToken || !professionalWhatsAppNumber) {
      return undefined
    }

    const intervalId = window.setInterval(() => {
      void refreshUazapiConnection(accessToken, professionalWhatsAppNumber, true)
    }, 10000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [accessToken, professionalWhatsAppNumber, refreshUazapiConnection, uazapiConnection.status])

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!userId) return

    if (form.productsProduced.length === 0) {
      setError('Selecione ao menos um grupo de produto.')
      return
    }

    setSaving(true)
    setFeedback(null)
    setError(null)

    if (!normalizedEmail) {
      setError('Não foi possível identificar o email do profissional para salvar a foto.')
      setSaving(false)
      return
    }

    let phone: string

    try {
      phone = buildBrazilPhoneNumber(form.phoneCountryCode, form.phoneDdd, form.phoneNumber)
    } catch (phoneError) {
      setError(phoneError instanceof Error ? phoneError.message : 'Não foi possível validar o WhatsApp.')
      setSaving(false)
      return
    }

    let nextPhotoPath = photoPath
    let uploadedPhotoPath: string | null = null

    if (photoFile) {
      const extension = photoFile.name.split('.').pop()?.toLowerCase() || 'jpg'
      nextPhotoPath = buildPhotoPath(`photo.${extension}`)

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(nextPhotoPath, photoFile, {
          upsert: true,
          contentType: photoFile.type || 'image/jpeg',
          cacheControl: '3600',
        })

      if (uploadError) {
        setError(uploadError.message)
        setSaving(false)
        return
      }

      uploadedPhotoPath = nextPhotoPath
    }

    const now = new Date().toISOString()
    const sanitizedBusinessName = sanitizeSingleLineText(form.businessName, PROFILE_FIELD_LIMITS.businessName)
    const sanitizedConversationSamples = sanitizeMultilineText(
      form.conversationSamples,
      PROFILE_FIELD_LIMITS.conversationSamples,
    )
    const sanitizedServiceRules = sanitizeMultilineText(form.serviceRules, PROFILE_FIELD_LIMITS.serviceRules)

    if (!sanitizedBusinessName) {
      setError('Informe o nome da empresa.')
      setSaving(false)
      return
    }

    setForm((prev) => ({
      ...prev,
      businessName: sanitizedBusinessName,
      conversationSamples: sanitizedConversationSamples,
      serviceRules: sanitizedServiceRules,
    }))

    const payload = {
      auth_user_id: userId,
      display_name: sanitizedBusinessName,
      business_name: sanitizedBusinessName,
      phone,
      email: email.trim() || null,
      photo_path: nextPhotoPath,
      products_produced: JSON.stringify(form.productsProduced),
      conversation_samples: sanitizedConversationSamples || null,
      service_rules: sanitizedServiceRules || null,
      onboarding_completed: true,
      status: 'active',
      updated_at: now,
    }

    if (professionalId) {
      const { error: updateError } = await supabase
        .from('festa-com-ia-professionals')
        .update(payload)
        .eq('id', professionalId)

      if (updateError) {
        setError(updateError.message)
        if (uploadedPhotoPath) {
          await supabase.storage.from(STORAGE_BUCKET).remove([uploadedPhotoPath])
        }
        setSaving(false)
        return
      }
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from('festa-com-ia-professionals')
        .insert(payload)
        .select('id')
        .single()

      if (insertError) {
        setError(insertError.message)
        if (uploadedPhotoPath) {
          await supabase.storage.from(STORAGE_BUCKET).remove([uploadedPhotoPath])
        }
        setSaving(false)
        return
      }

      setProfessionalId(inserted.id)
    }

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    const accessToken = sessionData.session?.access_token

    if (sessionError || !accessToken) {
      if (uploadedPhotoPath) {
        await supabase.storage.from(STORAGE_BUCKET).remove([uploadedPhotoPath])
      }
      setError('Não foi possível validar sua sessão para sincronizar o perfil local.')
      setSaving(false)
      return
    }

    const syncResponse = await fetch('/api/account/sync-professional', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    const syncResult = await syncResponse.json().catch(() => null)

    if (!syncResponse.ok) {
      if (uploadedPhotoPath) {
        await supabase.storage.from(STORAGE_BUCKET).remove([uploadedPhotoPath])
      }
      setError(syncResult?.error ?? 'Não foi possível sincronizar o perfil com o Postgres local.')
      setSaving(false)
      return
    }

    if (photoFile && photoPath && photoPath !== nextPhotoPath) {
      await supabase.storage.from(STORAGE_BUCKET).remove([photoPath])
    }

    if (nextPhotoPath) {
      setPhotoPath(nextPhotoPath)
    }
    setPhotoFile(null)
    setPhotoPreview(null)

    void refreshUazapiConnection(accessToken, phone, true)

    // Sinaliza ao AppShell para recarregar a foto no header
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('profile-photo-updated'))
    }

    if (isFirstAccess) {
      router.replace('/')
      router.refresh()
      return
    }

    setFeedback('Perfil atualizado com sucesso.')
    setSaving(false)
  }

  function handlePhoneNumberChange(value: string) {
    setForm((prev) => ({
      ...prev,
      phoneNumber: sanitizeDigits(value).slice(0, PROFILE_FIELD_LIMITS.phoneNumber),
    }))
  }

  function handlePhoneNumberBlur() {
    setForm((prev) => {
      const digits = sanitizeDigits(prev.phoneNumber)

      if (digits.length === 8) {
        return {
          ...prev,
          phoneNumber: `9${digits}`,
        }
      }

      return {
        ...prev,
        phoneNumber: digits.slice(0, PROFILE_FIELD_LIMITS.phoneNumber),
      }
    })
  }

  function handleApplyStyleBuilder() {
    setForm((prev) => ({
      ...prev,
      serviceRules: buildServiceRulesText(rulesBuilder),
    }))
    setIsStyleModalOpen(false)
  }

  async function handleDeleteAccount() {
    setFeedback(null)
    setError(null)

    if (deleteConfirmation.trim().toUpperCase() !== 'EXCLUIR') {
      setError('Digite EXCLUIR para confirmar a remoção total dos seus dados.')
      return
    }

    setDeletingAccount(true)

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    const accessToken = sessionData.session?.access_token

    if (sessionError || !accessToken) {
      setError('Não foi possível validar sua sessão para excluir a conta.')
      setDeletingAccount(false)
      return
    }

    try {
      const response = await fetch('/api/account/delete', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      const result = await response.json().catch(() => null)

      if (!response.ok) {
        setError(result?.error ?? 'Não foi possível excluir sua conta agora.')
        setDeletingAccount(false)
        return
      }

      await supabase.auth.signOut()
      router.replace('/login')
      router.refresh()
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Não foi possível excluir sua conta agora.')
      setDeletingAccount(false)
    }
  }

  if (loading) {
    return <div className="text-sm text-gray-400">Carregando seu perfil...</div>
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-[0_24px_100px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative overflow-hidden bg-gradient-to-br from-fuchsia-500/20 via-white/5 to-violet-500/15 p-6 sm:p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.18),_transparent_42%)]" />
            <div className="relative space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-4 py-2 text-xs uppercase tracking-[0.28em] text-gray-200">
                Perfil do profissional
              </div>



              <div className="space-y-3">
                <h1 className="text-3xl font-semibold text-white sm:text-4xl">
                  {isFirstAccess ? 'Complete seu perfil para começar' : 'Seu perfil'}
                </h1>
                <p className="max-w-xl text-sm leading-6 text-gray-200/80 sm:text-base">
                  Use esta área para informar os dados básicos do seu negócio. Isso ajuda a personalizar
                  o app e preparar o primeiro acesso.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center gap-4">
                  <div className="relative h-20 w-20 overflow-hidden rounded-2xl border border-white/10 bg-white/5 shrink-0">
                    {photoPreview || currentPhotoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={photoPreview || currentPhotoUrl}
                        alt="Foto do profissional ou da empresa"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                        Sem foto
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-medium text-white">Foto do profissional / empresa</p>
                      <p className="text-xs text-gray-400">
                        A imagem será salva em <code className="rounded bg-white/10 px-1 py-0.5 text-[11px]">{STORAGE_BUCKET}/{normalizedEmail || '...'}</code>
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(event) => setPhotoFile(event.target.files?.[0] ?? null)}
                      className="block w-full max-w-sm text-xs text-gray-300 file:mr-4 file:rounded-xl file:border-0 file:bg-fuchsia-500 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-fuchsia-600"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  'Nome da empresa',
                  'WhatsApp',
                  'Grupos de produtos',
                ].map((item) => (
                  <div key={item} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-gray-200">
                    {item}
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-gray-300">
                <p className="font-medium text-white">Grupos selecionados</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {form.productsProduced.length > 0 ? (
                    form.productsProduced.map((group) => (
                      <span key={group} className="rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 px-3 py-1 text-xs text-fuchsia-100">
                        {group}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-400">Nenhum grupo selecionado</span>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-gray-300">
                <p className="font-medium text-white">Email de acesso</p>
                <p className="mt-1 break-all text-gray-300">{email}</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-gray-300">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-white">WhatsApp Uazapi</p>
                    <p className="mt-1 text-xs text-gray-400">
                      O app consulta a instância do seu número e cria o pareamento quando necessário.
                    </p>
                  </div>
                  <span
                    className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${
                      uazapiConnection.status === 'connected'
                        ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100'
                        : uazapiConnection.status === 'connecting'
                          ? 'border-amber-400/30 bg-amber-500/10 text-amber-100'
                          : 'border-white/10 bg-white/5 text-gray-200'
                    }`}
                  >
                    {uazapiStatusLabel}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Instância</p>
                    <p className="mt-1 break-all text-sm text-white">
                      {uazapiConnection.instanceName ?? 'Ainda não criada'}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Número vinculado</p>
                    <p className="mt-1 break-all text-sm text-white">
                      {uazapiConnection.linkedPhone || professionalWhatsAppNumber || 'Informe o telefone'}
                    </p>
                  </div>
                </div>

                {uazapiConnection.status === 'connecting' && uazapiConnection.pairCode ? (
                  <div className="mt-4 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-amber-100/70">Código de pareamento</p>
                    <p className="mt-2 font-mono text-3xl font-semibold tracking-[0.28em] text-amber-50">
                      {uazapiConnection.pairCode}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-amber-100/80">
                      Abra o WhatsApp no celular, selecione a opção de parear por código e informe este valor.
                    </p>
                  </div>
                ) : null}

                {uazapiConnection.message ? (
                  <p className="mt-4 text-xs leading-5 text-gray-400">{uazapiConnection.message}</p>
                ) : null}

                <div className="mt-4 flex flex-wrap gap-3">
                  {uazapiConnection.status === 'connected' ? (
                    <Button type="button" disabled className="h-11 rounded-2xl bg-emerald-500/20 px-4 text-sm font-semibold text-emerald-100">
                      WhatsApp conectado
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={() => void handleConnectWhatsApp()}
                      disabled={uazapiConnection.loading || uazapiConnection.actionLoading || !professionalWhatsAppNumber}
                      className="h-11 rounded-2xl border border-fuchsia-400/30 bg-gradient-to-r from-fuchsia-500 to-violet-500 px-4 text-sm font-semibold text-white shadow-[0_18px_50px_rgba(168,85,247,0.28)] transition hover:scale-[1.01]"
                    >
                      {uazapiConnection.actionLoading
                        ? 'Conectando...'
                        : uazapiConnection.status === 'connecting'
                          ? 'Gerar novo código'
                          : uazapiConnection.status === 'not_created'
                            ? 'Criar e conectar WhatsApp'
                            : 'Conectar WhatsApp'}
                    </Button>
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void refreshUazapiConnection()}
                    disabled={uazapiConnection.loading || uazapiConnection.actionLoading || !professionalWhatsAppNumber}
                    className="h-11 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-gray-100 hover:bg-white/10"
                  >
                    {uazapiConnection.loading ? 'Atualizando...' : 'Atualizar status'}
                  </Button>
                </div>

                {uazapiConnection.lastDisconnectReason ? (
                  <p className="mt-3 text-xs text-gray-500">
                    Última desconexão: {uazapiConnection.lastDisconnectReason}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="businessName" className="text-sm font-medium text-gray-200">
                  Nome da empresa
                </label>
                <input
                  id="businessName"
                  value={form.businessName}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      businessName: event.target.value.slice(0, PROFILE_FIELD_LIMITS.businessName),
                    }))
                  }
                  maxLength={PROFILE_FIELD_LIMITS.businessName}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-fuchsia-400/60 focus:ring-2 focus:ring-fuchsia-500/30"
                  placeholder="Doceria da Maria"
                  required
                />
                <p className="text-xs text-gray-400">
                  Máximo de {PROFILE_FIELD_LIMITS.businessName} caracteres. {businessNameLength}/{PROFILE_FIELD_LIMITS.businessName}
                </p>
              </div>

              <div className="space-y-2">
                <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
                  <div className="space-y-2">
                    <label htmlFor="phoneCountryCode" className="text-sm font-medium text-gray-200">
                      País
                    </label>
                    <select
                      id="phoneCountryCode"
                      value={form.phoneCountryCode}
                      disabled
                      className="w-full cursor-not-allowed rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-300 outline-none transition placeholder:text-gray-500"
                    >
                      <option value={BRAZIL_COUNTRY_CODE}>Brasil (+55)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="phoneDdd" className="text-sm font-medium text-gray-200">
                      DDD
                    </label>
                    <select
                      id="phoneDdd"
                      value={form.phoneDdd}
                      onChange={(event) => setForm((prev) => ({ ...prev, phoneDdd: event.target.value }))}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-fuchsia-400/60 focus:ring-2 focus:ring-fuchsia-500/30"
                      required
                    >
                      <option value="" disabled className="bg-slate-950">
                        Selecione o DDD
                      </option>
                      {BRAZIL_DDD_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value} className="bg-slate-950">
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="phoneNumber" className="text-sm font-medium text-gray-200">
                    Número do WhatsApp
                  </label>
                  <input
                    id="phoneNumber"
                    value={form.phoneNumber}
                    onChange={(event) => handlePhoneNumberChange(event.target.value)}
                    onBlur={handlePhoneNumberBlur}
                    inputMode="numeric"
                    maxLength={PROFILE_FIELD_LIMITS.phoneNumber}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-fuchsia-400/60 focus:ring-2 focus:ring-fuchsia-500/30"
                    placeholder="99999-0000"
                    required
                  />
                  <p className="text-xs text-gray-400">
                    Digite apenas 8 ou 9 dígitos. Se informar 8, o sistema adiciona o 9 automaticamente ao salvar.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-200">
                  Grupos de produtos
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {PRODUCT_GROUPS.map((group) => {
                    const selected = form.productsProduced.includes(group)
                    return (
                      <button
                        key={group}
                        type="button"
                        onClick={() => {
                          setForm((prev) => ({
                            ...prev,
                            productsProduced: selected
                              ? prev.productsProduced.filter((item) => item !== group)
                              : [...prev.productsProduced, group],
                          }))
                        }}
                        className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition focus:outline-none focus:ring-2 focus:ring-fuchsia-500/30 ${
                          selected
                            ? 'border-fuchsia-400/50 bg-fuchsia-500/15 text-white shadow-[0_0_0_1px_rgba(217,70,239,0.25)]'
                            : 'border-white/10 bg-white/5 text-gray-200 hover:border-white/20 hover:bg-white/10'
                        }`}
                      >
                        <span>{group}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[11px] ${selected ? 'bg-fuchsia-400/20 text-fuchsia-100' : 'bg-white/10 text-gray-400'}`}>
                          {selected ? 'Selecionado' : 'Selecionar'}
                        </span>
                      </button>
                    )
                  })}
                </div>
                <p className="text-xs text-gray-400">
                  Selecione apenas os grupos que você produz. As linhas e variações serão usadas depois como tags nos pedidos.
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="conversationSamples" className="text-sm font-medium text-gray-200">
                  Exemplo de conversa (cole o texto de pelo menos três conversas)
                </label>
                <textarea
                  id="conversationSamples"
                  value={form.conversationSamples}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      conversationSamples: event.target.value.slice(0, PROFILE_FIELD_LIMITS.conversationSamples),
                    }))
                  }
                  maxLength={PROFILE_FIELD_LIMITS.conversationSamples}
                  rows={5}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-200 outline-none transition placeholder:text-gray-500 focus:border-fuchsia-400/60 focus:ring-2 focus:ring-fuchsia-500/30"
                  placeholder="Cole aqui o texto completo de três ou mais conversas estilo WhatsApp"
                />
                <p className="text-xs text-gray-400">
                  Use este campo para colar o conteúdo real das conversas. Emojis, gírias e o ritmo de atendimento ajudam a IA a imitar seu jeito.
                </p>
                <p className="text-xs text-gray-500">
                  {conversationSamplesLength}/{PROFILE_FIELD_LIMITS.conversationSamples} caracteres
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <label htmlFor="serviceRules" className="text-sm font-medium text-gray-200">
                    Regras de atendimento
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsStyleModalOpen(true)}
                    className="rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 px-3 py-1.5 text-xs font-medium text-fuchsia-100 transition hover:border-fuchsia-300 hover:bg-fuchsia-500/20"
                  >
                    Montar regras
                  </button>
                </div>
                <textarea
                  id="serviceRules"
                  value={form.serviceRules}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      serviceRules: event.target.value.slice(0, PROFILE_FIELD_LIMITS.serviceRules),
                    }))
                  }
                  maxLength={PROFILE_FIELD_LIMITS.serviceRules}
                  rows={4}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-200 outline-none transition placeholder:text-gray-500 focus:border-fuchsia-400/60 focus:ring-2 focus:ring-fuchsia-500/30"
                  placeholder="Clique em 'Montar regras' para gerar regras simples do negócio, ou edite manualmente aqui."
                />
                <p className="text-xs text-gray-400">
                  Essas regras podem orientar a IA no atendimento e evitar respostas fora da política do negócio.
                </p>
                <p className="text-xs text-gray-500">
                  {serviceRulesLength}/{PROFILE_FIELD_LIMITS.serviceRules} caracteres
                </p>
              </div>

              <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-100">
                <div className="space-y-2">
                  <p className="font-medium text-white">Excluir conta e todos os dados</p>
                  <p>
                    Esta ação apaga sua conta e todos os seus dados. Não é possível desfazer.
                  </p>
                </div>

                <div className="mt-4 space-y-2">
                  <label htmlFor="deleteConfirmation" className="text-sm font-medium text-rose-100">
                    Digite EXCLUIR para confirmar
                  </label>
                  <input
                    id="deleteConfirmation"
                    value={deleteConfirmation}
                    onChange={(event) =>
                      setDeleteConfirmation(event.target.value.slice(0, PROFILE_FIELD_LIMITS.deleteConfirmation))
                    }
                    maxLength={PROFILE_FIELD_LIMITS.deleteConfirmation}
                    className="w-full rounded-2xl border border-rose-300/30 bg-black/20 px-4 py-3 text-sm text-white outline-none transition placeholder:text-rose-100/50 focus:border-rose-300/60 focus:ring-2 focus:ring-rose-500/20"
                    placeholder="EXCLUIR"
                  />
                </div>

                <div className="mt-4">
                  <Button
                    type="button"
                    onClick={handleDeleteAccount}
                    className="h-11 rounded-2xl border border-rose-300/30 bg-gradient-to-r from-rose-600 to-red-600 px-4 text-sm font-semibold text-white shadow-[0_18px_50px_rgba(225,29,72,0.28)] transition hover:scale-[1.01]"
                    disabled={deletingAccount || deleteConfirmation.trim().toUpperCase() !== 'EXCLUIR'}
                  >
                    {deletingAccount ? 'Excluindo conta...' : 'Excluir minha conta e meus dados'}
                  </Button>
                </div>
              </div>

              {feedback && (
                <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                  {feedback}
                </div>
              )}

              {error && (
                <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  {error}
                </div>
              )}

              <div className="flex flex-wrap gap-3 pt-2">
                <Button
                  type="submit"
                  className="h-12 rounded-2xl border border-white/10 bg-gradient-to-r from-fuchsia-500 via-fuchsia-500 to-violet-500 px-5 text-base shadow-[0_18px_50px_rgba(168,85,247,0.35)] transition-transform duration-300 hover:scale-[1.01]"
                  disabled={saving || form.productsProduced.length === 0}
                >
                  {saving ? 'Salvando...' : isFirstAccess ? 'Concluir perfil' : 'Salvar alterações'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {isStyleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[1.75rem] border border-white/10 bg-slate-950 p-6 shadow-2xl shadow-black/40">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-fuchsia-300/80">Regras de atendimento</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Monte as regras do seu negócio</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-300">
                  Selecione horários, delivery, tipos de produtos e restrições alimentares para gerar um texto pronto
                  com as regras do seu atendimento.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsStyleModalOpen(false)}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-gray-200 transition hover:border-white/20 hover:bg-white/10"
              >
                Fechar
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm text-gray-200">
                <span className="font-medium">Horário de atendimento</span>
                <select
                  value={rulesBuilder.hours}
                  onChange={(event) =>
                    setRulesBuilder((prev) => ({ ...prev, hours: event.target.value as RulesBuilderState['hours'] }))
                  }
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-fuchsia-400/60 focus:ring-2 focus:ring-fuchsia-500/30"
                >
                  {RULES_HOURS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value} className="bg-slate-950">
                      {option.label} — {option.hint}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2 text-sm text-gray-200">
                <span className="font-medium">Delivery</span>
                <select
                  value={rulesBuilder.delivery}
                  onChange={(event) =>
                    setRulesBuilder((prev) => ({ ...prev, delivery: event.target.value as RulesBuilderState['delivery'] }))
                  }
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-fuchsia-400/60 focus:ring-2 focus:ring-fuchsia-500/30"
                >
                  {RULES_DELIVERY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value} className="bg-slate-950">
                      {option.label} — {option.hint}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-5 space-y-3">
              <p className="text-sm font-medium text-white">Tipos de produtos</p>
              <div className="grid gap-3 md:grid-cols-2">
                {RULES_PRODUCT_OPTIONS.map((item) => (
                  <label
                    key={item.key}
                    className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-gray-200 transition hover:border-white/20 hover:bg-white/10"
                  >
                    <input
                      type="checkbox"
                      checked={rulesBuilder[item.key]}
                      onChange={(event) =>
                        setRulesBuilder((prev) => ({ ...prev, [item.key]: event.target.checked }))
                      }
                      className="mt-1 h-4 w-4 rounded border-white/20 bg-white/10 text-fuchsia-500 focus:ring-fuchsia-500/40"
                    />
                    <span>
                      <span className="block font-medium text-white">{item.label}</span>
                      <span className="mt-1 block text-xs text-gray-400">{item.hint}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <p className="text-sm font-medium text-white">Restrições e versões especiais</p>
              <div className="grid gap-3 md:grid-cols-2">
                {RULES_DIETARY_OPTIONS.map((item) => (
                  <label
                    key={item.key}
                    className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-gray-200 transition hover:border-white/20 hover:bg-white/10"
                  >
                    <input
                      type="checkbox"
                      checked={rulesBuilder[item.key]}
                      onChange={(event) =>
                        setRulesBuilder((prev) => ({ ...prev, [item.key]: event.target.checked }))
                      }
                      className="mt-1 h-4 w-4 rounded border-white/20 bg-white/10 text-fuchsia-500 focus:ring-fuchsia-500/40"
                    />
                    <span>
                      <span className="block font-medium text-white">{item.label}</span>
                      <span className="mt-1 block text-xs text-gray-400">{item.hint}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-5 space-y-2">
              <label htmlFor="rulesCustomNotes" className="text-sm font-medium text-gray-200">
                Observações extras
              </label>
              <textarea
                id="rulesCustomNotes"
                value={rulesBuilder.customNotes}
                onChange={(event) =>
                  setRulesBuilder((prev) => ({
                    ...prev,
                    customNotes: event.target.value.slice(0, PROFILE_FIELD_LIMITS.rulesCustomNotes),
                  }))
                }
                maxLength={PROFILE_FIELD_LIMITS.rulesCustomNotes}
                rows={4}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-200 outline-none transition placeholder:text-gray-500 focus:border-fuchsia-400/60 focus:ring-2 focus:ring-fuchsia-500/30"
                placeholder="Ex.: atende apenas sob encomenda, prazo mínimo de 2 dias, entrega em bairros específicos..."
              />
              <p className="text-xs text-gray-400">
                Use este campo para regras adicionais específicas do seu negócio.
              </p>
              <p className="text-xs text-gray-500">
                {rulesCustomNotesLength}/{PROFILE_FIELD_LIMITS.rulesCustomNotes} caracteres
              </p>
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-white">Prévia das regras geradas</p>
                <span className="rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-fuchsia-100">
                  Preview
                </span>
              </div>
              <pre className="mt-3 whitespace-pre-wrap rounded-xl border border-white/5 bg-white/5 p-4 text-sm leading-6 text-gray-200">
{buildServiceRulesText(rulesBuilder)}
              </pre>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setIsStyleModalOpen(false)}
                className="h-11 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-medium text-gray-200 transition hover:border-white/20 hover:bg-white/10"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleApplyStyleBuilder}
                className="h-11 rounded-2xl border border-fuchsia-400/30 bg-gradient-to-r from-fuchsia-500 via-fuchsia-500 to-violet-500 px-4 text-sm font-semibold text-white shadow-[0_18px_50px_rgba(168,85,247,0.3)] transition hover:scale-[1.01]"
              >
                OK, usar este texto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
