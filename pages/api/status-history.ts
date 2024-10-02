import type { NextApiRequest, NextApiResponse } from 'next'
import clientPromise from '@/lib/mongodb'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { url } = req.query

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ message: 'URL is required' })
  }

  try {
    const client = await clientPromise
    const db = client.db()

    const statusHistory = await db.collection('statusHistory')
      .find({ url })
      .sort({ timestamp: -1 })
      .limit(30)
      .toArray()

    res.status(200).json(statusHistory)
  } catch (error) {
    console.error('Error fetching status history:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}