import { NextApiRequest, NextApiResponse } from 'next'
import { checkAllWebsites } from '../../lib/backgroundTasks'
 
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const authHeader = req.headers.authorization
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    try {
      await checkAllWebsites()
      res.status(200).json({ message: 'Websites checked successfully' })
    } catch (error) {
      console.error('Error checking websites:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  } else {
    res.setHeader('Allow', ['POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}