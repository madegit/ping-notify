import type { NextApiRequest, NextApiResponse } from 'next'
import fetch from 'node-fetch'
import fs from 'fs'
import path from 'path'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { url } = req.query

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Invalid URL' })
  }

  const faviconUrl = new URL('/favicon.ico', url).href
  const cacheDir = path.join(process.cwd(), 'public', 'favicon-cache')
  const cacheFileName = `${Buffer.from(url).toString('base64')}.ico`
  const cachePath = path.join(cacheDir, cacheFileName)

  // Check if favicon is already cached
  if (fs.existsSync(cachePath)) {
    return res.status(200).json({ cachedPath: `/favicon-cache/${cacheFileName}` })
  }

  try {
    const response = await fetch(faviconUrl)
    if (!response.ok) throw new Error('Failed to fetch favicon')

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Ensure cache directory exists
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true })
    }

    // Write favicon to cache
    fs.writeFileSync(cachePath, buffer)

    res.status(200).json({ cachedPath: `/favicon-cache/${cacheFileName}` })
  } catch (error) {
    console.error('Error caching favicon:', error)
    res.status(500).json({ error: 'Failed to cache favicon' })
  }
}