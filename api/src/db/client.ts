import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { env } from '../env.ts'
import * as schema from './schema/index.ts'

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 10_000, // let go of idle connections before the database sleeps
  connectionTimeoutMillis: 20_000, // enough time for a sleeping database to wake up
})

// A connection dropped while the database sleeps must not crash the API
pool.on('error', (error) => {
  console.error('Database connection error:', error.message)
})

export const db = drizzle({ client: pool, schema, casing: 'snake_case' })