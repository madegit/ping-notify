import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]"
import clientPromise from '@/lib/mongodb'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions)

  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  try {
    const client = await clientPromise
    const db = client.db()
    const websitesCollection = db.collection('websites')

    if (req.method === 'GET') {
      const websites = await websitesCollection.find({ userId: session.user.id }).toArray()
      return res.status(200).json(websites)
    } else if (req.method === 'POST') {
      const { url } = req.body
      const newWebsite = {
        url,
        status: 'checking',
        userId: session.user.id,
        createdAt: new Date()
      }
      const result = await websitesCollection.insertOne(newWebsite)
      return res.status(201).json({ ...newWebsite, _id: result.insertedId })
    }

    res.status(405).json({ message: 'Method not allowed' })
  } catch (error) {
    console.error('Error in /api/websites:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}