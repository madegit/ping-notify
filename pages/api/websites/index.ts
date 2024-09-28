import type { NextApiRequest, NextApiResponse } from 'next'
import { getSession } from 'next-auth/react'
import dbConnect from '@/lib/mongodb'
import mongoose from 'mongoose'

const WebsiteSchema = new mongoose.Schema({
  url: String,
  status: String,
  userId: String,
  createdAt: Date
})

const Website = mongoose.models.Website || mongoose.model('Website', WebsiteSchema)

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSession({ req })

  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  await dbConnect()

  if (req.method === 'GET') {
    const websites = await Website.find({ userId: session.user.id })
    return res.status(200).json(websites)
  } else if (req.method === 'POST') {
    const { url } = req.body
    const newWebsite = new Website({
      url,
      status: 'checking',
      userId: session.user.id,
      createdAt: new Date()
    })
    await newWebsite.save()
    return res.status(201).json(newWebsite)
  }

  res.status(405).json({ message: 'Method not allowed' })
}