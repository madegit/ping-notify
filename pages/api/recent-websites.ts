import type { NextApiRequest, NextApiResponse } from 'next'
import clientPromise from '@/lib/mongodb'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      const client = await clientPromise
      const db = client.db()
      const recentWebsites = await db.collection('checkedWebsites')
        .find({})
        .sort({ lastChecked: -1 })
        .limit(10)
        .toArray()

      const uniqueDomains = new Map()
      recentWebsites.forEach(website => {
        if (!uniqueDomains.has(website.domain) || website.lastChecked > uniqueDomains.get(website.domain).lastChecked) {
          uniqueDomains.set(website.domain, website)
        }
      })

      const uniqueRecentWebsites = Array.from(uniqueDomains.values())

      res.status(200).json(uniqueRecentWebsites)
    } catch (error) {
      console.error('Error fetching recent websites:', error)
      res.status(500).json({ message: 'Internal server error' })
    }
  } else if (req.method === 'POST') {
    try {
      const { url, domain, status, lastChecked, favicon } = req.body

      if (!url || !domain || !status || !lastChecked) {
        return res.status(400).json({ message: 'Missing required fields', receivedData: req.body })
      }

      const client = await clientPromise
      const db = client.db()

      await db.collection('checkedWebsites').updateOne(
        { domain },
        { 
          $set: { 
            url, 
            domain, 
            status, 
            lastChecked: new Date(lastChecked), 
            favicon 
          } 
        },
        { upsert: true }
      )

      res.status(200).json({ message: 'Website check recorded successfully' })
    } catch (error) {
      console.error('Error recording website check:', error)
      res.status(500).json({ message: 'Internal server error' })
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' })
  }
}