import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { setDefaultResultOrder } from 'node:dns'
import pg from 'pg'

setDefaultResultOrder('ipv4first')

const { Client } = pg

// Load .env from parent sync-engine directory
function loadEnv() {
  const envPath = resolve(__dirname, '../.env')
  if (existsSync(envPath)) {
    const content = readFileSync(envPath, 'utf-8')
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eqIdx = trimmed.indexOf('=')
      if (eqIdx === -1) continue
      const key = trimmed.slice(0, eqIdx).trim()
      const val = trimmed.slice(eqIdx + 1).trim()
      if (!process.env[key]) process.env[key] = val
    }
  }
}

async function migrate() {
  loadEnv()
  const supabaseUrl = process.env.SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_KEY!

  if (!supabaseUrl || !serviceKey) {
    console.error('SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env')
    process.exit(1)
  }

  // Extract project ref from URL
  const ref = supabaseUrl.match(/https:\/\/(.+)\.supabase\.co/)?.[1]
  if (!ref) {
    console.error('Could not parse Supabase project ref from URL')
    process.exit(1)
  }

  // Build direct DB connection string with URL-encoded password
  const dbPassword = process.env.SUPABASE_DB_PASSWORD
  if (!dbPassword) {
    console.error('SUPABASE_DB_PASSWORD must be set in .env')
    process.exit(1)
  }
  const password = encodeURIComponent(dbPassword)

  // Try multiple connection methods
  const hosts = [
    { host: `db.${ref}.supabase.co`, port: 5432, label: 'Direct' },
    { host: `aws-0-us-west-1.pooler.supabase.com`, port: 6543, label: 'Pooler (us-west-1)', user: `postgres.${ref}` },
    { host: `aws-0-us-east-1.pooler.supabase.com`, port: 6543, label: 'Pooler (us-east-1)', user: `postgres.${ref}` },
    { host: `${ref}.pooler.supabase.com`, port: 6543, label: 'Pooler (ref subdomain)', user: 'postgres' },
    { host: `${ref}.pooler.supabase.com`, port: 5432, label: 'Pooler (ref subdomain, 5432)', user: 'postgres' },
  ]
  const rawPassword = decodeURIComponent(password)

  let lastError: Error | null = null
  for (const h of hosts) {
    try {
      console.log(`Trying ${h.label}: ${h.host}:${h.port}...`)
      const client = new Client({
        host: h.host,
        port: h.port,
        database: 'postgres',
        user: h.user || 'postgres',
        password: rawPassword,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 8000
      })
      await client.connect()
      console.log(`Connected via ${h.label}`)

      // Read and execute schema SQL
      const schemaPath = resolve(__dirname, '../../supabase-schema.sql')
      console.log(`Reading schema from: ${schemaPath}`)
      const sql = readFileSync(schemaPath, 'utf-8')

      console.log('Running schema migration...')
      await client.query(sql)
      console.log('Schema migration completed successfully')

      // Verify tables
      const { rows } = await client.query(`
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name
      `)
      console.log('Tables created:')
      for (const row of rows) {
        console.log(`  - ${row.table_name}`)
      }

      await client.end()
      return // Success!
    } catch (err) {
      lastError = err as Error
      console.log(`  ${h.label} failed: ${(err as Error).message}`)
    }
  }

  // If all failed, provide manual instructions
  console.error('\nCould not connect to database automatically.')
  console.error('Please run the schema SQL manually in your Supabase dashboard:')
  console.error(`  1. Go to https://supabase.com/dashboard/project/${ref}/sql/new`)
  console.error(`  2. Copy and paste the contents of: supabase-schema.sql`)
  console.error(`  3. Click "Run"\n`)
  console.error('Last error:', lastError?.message)
  process.exit(1)
}

migrate()
