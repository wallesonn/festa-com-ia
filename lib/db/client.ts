import postgres from 'postgres'

let _sql: ReturnType<typeof postgres> | undefined

export function getSql(): ReturnType<typeof postgres> {
  if (!_sql) {
    const connectionString = process.env.DATABASE_URL
    if (!connectionString) {
      throw new Error('DATABASE_URL não definida. Configure no .env.local ou nas variáveis de ambiente.')
    }
    _sql = postgres(connectionString, {
      max: 10,
      idle_timeout: 30,
      connect_timeout: 10,
    })
  }
  return _sql
}
