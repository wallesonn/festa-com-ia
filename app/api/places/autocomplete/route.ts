import { NextRequest, NextResponse } from 'next/server'

function getGoogleMapsApiKey() {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    throw new Error('GOOGLE_MAPS_API_KEY não configurada no servidor.')
  }

  return apiKey
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')?.trim()

    if (!q) {
      return NextResponse.json({ error: 'Parâmetro de busca "q" é obrigatório.' }, { status: 400 })
    }

    const apiKey = getGoogleMapsApiKey()
    console.info(`[api/places/autocomplete] buscando sugestões via Google Places: "${q}"`)

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(q)}&key=${encodeURIComponent(apiKey)}&language=pt-BR&components=country:br`,
      {
        cache: 'no-store',
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[api/places/autocomplete] Google Places erro (${response.status}):`, errorText)
      return NextResponse.json({ error: 'Erro ao se conectar ao serviço de endereços.' }, { status: 502 })
    }

    const data = (await response.json()) as {
      status?: string
      error_message?: string
      predictions?: Array<{
        description: string
        place_id: string
        structured_formatting?: {
          main_text?: string
          secondary_text?: string
        }
      }>
    }

    if (data.status !== 'OK' || !data.predictions?.length) {
      const message = data.error_message || 'Nenhuma sugestão encontrada para o endereço digitado.'
      return NextResponse.json({ suggestions: [], message }, { status: 200 })
    }

    return NextResponse.json({
      suggestions: data.predictions.map((prediction) => ({
        description: prediction.description,
        placeId: prediction.place_id,
        mainText: prediction.structured_formatting?.main_text ?? prediction.description,
        secondaryText: prediction.structured_formatting?.secondary_text ?? '',
      })),
    })
  } catch (error) {
    console.error('[api/places/autocomplete] erro interno:', error)
    return NextResponse.json({ error: 'Ocorreu um erro interno ao buscar sugestões de endereço.' }, { status: 500 })
  }
}
