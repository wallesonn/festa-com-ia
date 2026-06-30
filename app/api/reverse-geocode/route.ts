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
    const lat = searchParams.get('lat')
    const lon = searchParams.get('lon')

    if (!lat || !lon) {
      return NextResponse.json({ error: 'Parâmetros "lat" e "lon" são obrigatórios.' }, { status: 400 })
    }

    const apiKey = getGoogleMapsApiKey()
    console.info(`[api/reverse-geocode] convertendo coordenadas via Google Maps: lat=${lat}, lon=${lon}`)

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${encodeURIComponent(`${lat},${lon}`)}&key=${encodeURIComponent(apiKey)}&language=pt-BR&region=br`,
      {
        cache: 'no-store',
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[api/reverse-geocode] Google Maps erro (${response.status}):`, errorText)
      return NextResponse.json({ error: 'Erro ao se conectar com o serviço de mapas.' }, { status: 502 })
    }

    const data = (await response.json()) as {
      status?: string
      error_message?: string
      results?: Array<{
        formatted_address: string
        address_components?: Array<{ long_name: string; short_name: string; types: string[] }>
      }>
    }

    if (data.status !== 'OK' || !data.results?.length) {
      const message = data.error_message || 'Nenhum resultado para estas coordenadas.'
      return NextResponse.json({ error: message }, { status: 404 })
    }

    const first = data.results[0]
    const components = first.address_components ?? []

    const road = getAddressComponent(components, 'route')?.long_name || ''
    const houseNumber = getAddressComponent(components, 'street_number')?.long_name || ''
    const neighbourhood =
      getAddressComponent(components, 'neighborhood')?.long_name ||
      getAddressComponent(components, 'sublocality')?.long_name ||
      getAddressComponent(components, 'sublocality_level_1')?.long_name ||
      ''
    const city =
      getAddressComponent(components, 'locality')?.long_name ||
      getAddressComponent(components, 'administrative_area_level_2')?.long_name ||
      getAddressComponent(components, 'postal_town')?.long_name ||
      ''
    const stateComponent = getAddressComponent(components, 'administrative_area_level_1')
    const postcode = getAddressComponent(components, 'postal_code')?.long_name || ''

    let street = road
    if (houseNumber) {
      street += `, ${houseNumber}`
    }
    if (neighbourhood) {
      street += street ? ` - ${neighbourhood}` : neighbourhood
    }
    if (postcode) {
      street += street ? ` (${postcode})` : `CEP: ${postcode}`
    }

    return NextResponse.json({
      street,
      city,
      state: stateComponent?.short_name || stateComponent?.long_name || '',
      display_name: first.formatted_address,
    })
  } catch (error) {
    console.error('[api/reverse-geocode] erro interno:', error)
    return NextResponse.json({ error: 'Ocorreu um erro interno no servidor ao processar a geolocalização reversa.' }, { status: 500 })
  }
}
