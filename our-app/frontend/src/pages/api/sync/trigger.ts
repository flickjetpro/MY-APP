import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const secret = req.query.secret as string
  const expectedSecret = process.env.SYNC_SECRET

  if (expectedSecret && secret !== expectedSecret) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  return res.status(200).json({
    success: true,
    message: 'Sync is handled by GitHub Actions. Use the GitHub workflow to trigger a sync.',
    workflow_url: 'https://github.com/flickjetpro/MY-APP/actions/workflows/sync.yml'
  })
}
