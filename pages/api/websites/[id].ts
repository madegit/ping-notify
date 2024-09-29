import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]"
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions)

  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid ID' })
  }

  try {
    const client = await clientPromise
    const db = client.db()
    const websitesCollection = db.collection('websites')

    let objectId: ObjectId
    try {
      objectId = new ObjectId(id)
    } catch (error) {
      return res.status(400).json({ message: 'Invalid ID format' })
    }

    if (req.method === 'PATCH') {
      const { status } = req.body
      if (!status) {
        return res.status(400).json({ message: 'Status is required' })
      }
      const result = await websitesCollection.updateOne(
        { _id: objectId, userId: session.user.id },
        { $set: { status } }
      )
      if (result.matchedCount === 0) {
        return res.status(404).json({ message: 'Website not found' })
      }
      return res.status(200).json({ message: 'Website updated' })
    } else if (req.method === 'DELETE') {
      const result = await websitesCollection.deleteOne({ _id: objectId, userId: session.user.id })
      if (result.deletedCount === 0) {
        return res.status(404).json({ message: 'Website not found' })
      }
      return res.status(200).json({ message: 'Website deleted' })
    }

    res.status(405).json({ message: 'Method not allowed' })
  } catch (error) {
    console.error('Error in /api/websites/[id]:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}