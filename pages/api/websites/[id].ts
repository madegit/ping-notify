import type { NextApiRequest, NextApiResponse } from 'next'
import { getSession } from 'next-auth/react'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSession({ req })

  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const client = await clientPromise
  const db = client.db()
  const websitesCollection = db.collection('websites')

  const { id } = req.query

  if (req.method === 'PATCH') {
    const { status } = req.body
    await websitesCollection.updateOne(
      { _id: new ObjectId(id as string), userId: session?.user?.id },
      { $set: { status } }
    )
    return res.status(200).json({ message: 'Website updated' })
  } else if (req.method === 'DELETE') {
    await websitesCollection.deleteOne({ _id: new ObjectId(id as string), userId: session.user.id })
    return res.status(200).json({ message: 'Website deleted' })
  }

  res.status(405).json({ message: 'Method not allowed' })
}