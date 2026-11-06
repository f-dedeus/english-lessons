import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { env } from '../env.ts'
import { db, pool } from './client.ts'

console.log('Database host:', new URL(env.DATABASE_URL).hostname)

await migrate(db, { migrationsFolder: './src/db/migrations' })
console.log('Database migrations are up to date.')
await pool.end()