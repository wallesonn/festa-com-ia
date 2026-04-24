import postgres from 'postgres'
import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const CHANNEL = 'festa_realtime_operational'

function createListenerClient() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL não definida. Configure no ambiente do servidor.')
  }

  return postgres(connectionString, {
    max: 1,
    idle_timeout: 0,
    connect_timeout: 10,
    keep_alive: 60,
    prepare: false,
  })
}

export async function GET(request: NextRequest) {
  const sql = createListenerClient()
  const encoder = new TextEncoder()
  let closed = false
  let keepAliveTimer: ReturnType<typeof globalThis.setInterval> | null = null

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (event: string, data: unknown) => {
        if (closed) return
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
      }

      const cleanup = async () => {
        if (closed) return
        closed = true

        if (keepAliveTimer) {
          clearInterval(keepAliveTimer)
          keepAliveTimer = null
        }

        try {
          await sql.end({ timeout: 1 })
        } catch {
          // Best-effort cleanup for the dedicated listener connection.
        }

        try {
          controller.close()
        } catch {
          // Stream might already be closed.
        }
      }

      request.signal.addEventListener('abort', () => {
        void cleanup()
      }, { once: true })

      void (async () => {
        try {
          send('ready', { ok: true })

          keepAliveTimer = globalThis.setInterval(() => {
            if (!closed) {
              controller.enqueue(encoder.encode(`: keep-alive ${Date.now()}\n\n`))
            }
          }, 15000)

          await sql.listen(
            CHANNEL,
            (payload) => {
              try {
                send('change', JSON.parse(String(payload)))
              } catch {
                send('change', { raw: String(payload) })
              }
            },
            () => {
              send('ready', { ok: true, reconnected: true })
            }
          )
        } catch (error) {
          send('error', {
            message: error instanceof Error ? error.message : 'Erro ao iniciar a conexão realtime.',
          })
        }
      })()
    },
    cancel() {
      void sql.end({ timeout: 1 }).catch(() => {})
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
