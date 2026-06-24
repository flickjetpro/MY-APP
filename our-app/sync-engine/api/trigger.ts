import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Simple auth check using secret query param
  const secret = req.query.secret as string
  const expectedSecret = process.env.SYNC_SECRET

  if (expectedSecret && secret !== expectedSecret) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    // Dynamic import to run the sync
    const { execSync } = await import('node:child_process')
    const result = execSync('npx tsx src/index.ts', {
      cwd: process.cwd(),
      env: {
        ...process.env,
        SUPABASE_URL: process.env.SUPABASE_URL,
        SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY,
        DATA_DIR: process.env.DATA_DIR || './data',
        IPTV_MASTER_PATH: process.env.IPTV_MASTER_PATH || '../../iptv-master'
      },
      timeout: 240_000,
      maxBuffer: 10 * 1024 * 1024
    })

    const output = result.stdout.toString()
    console.log(output)

    return res.status(200).json({
      success: true,
      message: 'Sync completed',
      output: output.split('\n').slice(-10).join('\n')
    })
  } catch (err: any) {
    console.error('Sync failed:', err)
    return res.status(500).json({
      success: false,
      error: 'Sync failed',
      details: err.stderr?.toString() || err.message
    })
  }
}
