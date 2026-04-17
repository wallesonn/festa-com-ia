import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { getFirstProfessional, getArchivedOrders } from '@/lib/db/queries'

function fmtDate(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function fmtCurrency(v: number | null): string {
  if (v == null) return ''
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

const STATUS_LABEL: Record<string, string> = {
  entregue: 'Entregue',
  cancelado: 'Cancelado',
}

const PAYMENT_STATUS_LABEL: Record<string, string> = {
  pending:  'Pendente',
  partial:  'Parcial',
  paid:     'Pago',
}

export async function GET() {
  try {
    const professional = await getFirstProfessional()
    if (!professional) {
      return NextResponse.json({ error: 'Profissional não encontrado.' }, { status: 404 })
    }

    const rows = await getArchivedOrders(professional.id)

    const data = rows.map((r) => ({
      'Cliente':         r.client_name,
      'Telefone':        r.client_phone,
      'Produto':         r.product_type,
      'Subtipo':         r.product_subtype,
      'Entrega':         fmtDate(r.delivery_datetime),
      'Tipo entrega':    r.delivery_type === 'entrega' ? 'Entrega' : 'Retirada',
      'Pessoas':         r.people_count,
      'Valor total':     fmtCurrency(r.total_price),
      'Status':          STATUS_LABEL[r.painel_status] ?? r.painel_status,
      'Pagamento':       PAYMENT_STATUS_LABEL[r.payment_status ?? ''] ?? (r.payment_status ?? ''),
      'Método pgto':     r.payment_method ?? '',
      'Valor pago':      fmtCurrency(r.paid_amount),
      'Observações':     r.observations ?? '',
      'Notas internas':  r.internal_notes ?? '',
      'Criado em':       fmtDate(r.created_at),
      'Atualizado em':   fmtDate(r.updated_at),
    }))

    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Arquivados')

    // Ajusta largura das colunas automaticamente
    const colWidths = Object.keys(data[0] ?? {}).map((key) => ({
      wch: Math.max(key.length, ...data.map((r) => String(r[key as keyof typeof r] ?? '').length)) + 2,
    }))
    ws['!cols'] = colWidths

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    const today = new Date().toISOString().slice(0, 10)
    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="pedidos-arquivados-${today}.xlsx"`,
      },
    })
  } catch (err) {
    console.error('[export] erro:', err)
    return NextResponse.json({ error: 'Erro ao gerar exportação.' }, { status: 500 })
  }
}
