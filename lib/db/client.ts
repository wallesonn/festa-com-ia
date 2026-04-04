import postgres from 'postgres'

declare global {
  // eslint-disable-next-line no-var
  var _pgSql: ReturnType<typeof postgres> | undefined
}

export function getSql(): ReturnType<typeof postgres> {
  if (!globalThis._pgSql) {
    const connectionString = process.env.DATABASE_URL
    if (!connectionString) {
      throw new Error('DATABASE_URL não definida. Configure no .env.local ou nas variáveis de ambiente.')
    }
    globalThis._pgSql = postgres(connectionString, {
      max: 10,
      idle_timeout: 600,
      connect_timeout: 10,
      keep_alive: 60,
    })
  }
  return globalThis._pgSql
}
