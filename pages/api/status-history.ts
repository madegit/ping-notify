import type { NextApiRequest, NextApiResponse } from 'next'
import clientPromise from '@/lib/mongodb'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    const { url } = req.query

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ message: 'URL is required' })
    }

    try {
      const client = await clientPromise
      const db = client.db()

      const domain = new URL(url).hostname

      const statusHistory = await db.collection('statusHistory')
        .find({ domain })
        .sort({ timestamp: -1 })
        .limit(30)
        .toArray()

      res.status(200).json(statusHistory)
    } catch (error) {
      console.error('Error fetching status history:', error)
      res.status(500).json({ message: 'Internal server error' })
    }
  } else if (req.method === 'POST') {
    try {
      const { url, domain, status, timestamp } = req.body

      if (!url || !domain || !status || !timestamp) {
        return res.status(400).json({ message: 'Missing required fields', receivedData: req.body })
      }

      const client = await clientPromise
      const db = client.db()

      await db.collection('statusHistory').insertOne({
        url,
        domain,
        status,
        timestamp: new Date(timestamp)
      })

      res.status(200).json({ message: 'Status history recorded successfully' })
    } catch (error) {
      console.error('Error recording status history:', error)
      res.status(500).json({ message: 'Internal server error' })
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' })
  }
}