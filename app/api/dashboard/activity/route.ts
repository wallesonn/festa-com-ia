import { NextResponse } from 'next/server'
import { getFirstProfessional, getRecentActivity } from '@/lib/db/queries'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const hoursParam = Number(url.searchParams.get('hours') ?? '2')
    const limitParam = Number(url.searchParams.get('limit') ?? '30')
    const hours = Number.isFinite(hoursParam) && hoursParam > 0 ? Math.min(hoursParam, 168) : 2
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 100) : 30

    const professional = await getFirstProfessional()
    if (!professional) {
      return NextResponse.json({ items: [] })
    }

    const items = await getRecentActivity(professional.id, hours, limit)
    return NextResponse.json({ items })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error'
    return NextResponse.json({ items: [], error: message }, { status: 500 })
  }
}
