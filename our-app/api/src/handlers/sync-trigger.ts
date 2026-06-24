import type { VercelRequest, VercelResponse } from '@vercel/node'
import { execSync } from 'node:child_process'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const secret = req.query.secret as string
  const expectedSecret = process.env.SYNC_SECRET

  if (expectedSecret && secret !== expectedSecret) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const result = execSync('npx tsx ../sync-engine/src/index.ts', {
      cwd: process.cwd(),
      env: {
        ...process.env,
        SUPABASE_URL: process.env.SUPABASE_URL!,
        SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY!,
        DATA_DIR: '../sync-engine/data',
        IPTV_MASTER_PATH: '../../iptv-master'
      },
      timeout: 240_000,
      maxBuffer: 10 * 1024 * 1024
    })

    return res.status(200).json({
      success: true,
      message: 'Sync completed',
      output: result.stdout.toString().split('\n').slice(-10).join('\n')
    })
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.stderr?.toString() || err.message
    })
  }
}
