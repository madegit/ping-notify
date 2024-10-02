import type { NextApiRequest, NextApiResponse } from 'next'
import clientPromise from '@/lib/mongodb'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const client = await clientPromise
    const db = client.db()
    const recentWebsites = await db.collection('checkedWebsites')
      .find({})
      .sort({ lastChecked: -1 })
      .limit(10)
      .toArray()

    res.status(200).json(recentWebsites)
  } catch (error) {
    console.error('Error fetching recent websites:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}