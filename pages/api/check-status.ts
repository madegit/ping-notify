import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from "next-auth/next"
import { authOptions } from "./auth/[...nextauth]"
import fetch from 'node-fetch'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions)

  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { url } = req.body

  if (!url) {
    return res.status(400).json({ message: 'URL is required' })
  }

  try {
    const response = await fetch(url, { 
      method: 'HEAD', 
      timeout: 5000,
      headers: {
        'User-Agent': 'UptimeMonitor/1.0'
      }
    })
    const status = response.ok ? 'up' : 'down'
    res.status(200).json({ status })
  } catch (error) {
    console.error('Error checking website status:', error)
    res.status(200).json({ status: 'down' })
  }
}