import { NextRequest, NextResponse } from 'next/server'

function getGoogleMapsApiKey() {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    throw new Error('GOOGLE_MAPS_API_KEY não configurada no servidor.')
  }

  return apiKey
}

function getAddressComponent(components: Array<{ long_name: string; short_name: string; types: string[] }>, type: string) {
  return components.find((component) => component.types.includes(type))
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')

    if (!q) {
      return NextResponse.json({ error: 'Parâmetro de busca "q" é obrigatório.' }, { status: 400 })
    }

    const apiKey = getGoogleMapsApiKey()
    console.info(`[api/geocode] convertendo endereço via Google Maps: "${q}"`)

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(q)}&key=${encodeURIComponent(apiKey)}&language=pt-BR&region=br`,
      {
        cache: 'no-store',
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[api/geocode] Google Maps erro (${response.status}):`, errorText)
      return NextResponse.json({ error: 'Erro ao se conectar com o serviço de mapas.' }, { status: 502 })
    }

    const data = (await response.json()) as {
      status?: string
      error_message?: string
      results?: Array<{
        formatted_address: string
        geometry?: { location?: { lat: number; lng: number } }
        address_components?: Array<{ long_name: string; short_name: string; types: string[] }>
      }>
    }

    if (data.status !== 'OK' || !data.results?.length) {
      const message = data.error_message || 'Nenhum resultado encontrado para o endereço fornecido.'
      return NextResponse.json({ error: message }, { status: 404 })
    }

    const first = data.results[0]
    const components = first.address_components ?? []
    const cityComponent =
      getAddressComponent(components, 'locality') ||
      getAddressComponent(components, 'administrative_area_level_2') ||
      getAddressComponent(components, 'sublocality') ||
      getAddressComponent(components, 'neighborhood')
    const stateComponent = getAddressComponent(components, 'administrative_area_level_1')

    return NextResponse.json({
      latitude: first.geometry?.location?.lat ?? null,
      longitude: first.geometry?.location?.lng ?? null,
      display_name: first.formatted_address,
      city: cityComponent?.long_name ?? '',
      state: stateComponent?.short_name || stateComponent?.long_name || '',
    })
  } catch (error) {
    console.error('[api/geocode] erro interno:', error)
    return NextResponse.json({ error: 'Ocorreu um erro interno no servidor ao processar a geolocalização.' }, { status: 500 })
  }
}
