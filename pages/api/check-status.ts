import type { NextApiRequest, NextApiResponse } from 'next'
import clientPromise from '@/lib/mongodb'
import dns from 'dns'
import { promisify } from 'util'
import fetch from 'node-fetch'
import { JSDOM } from 'jsdom'
import fs from 'fs'
import path from 'path'

const resolveDns = promisify(dns.resolve)
const lookup = promisify(dns.lookup)

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { url, isPublic = true } = req.body

  if (!url) {
    return res.status(400).json({ message: 'URL is required' })
  }

  try {
    const client = await clientPromise
    const db = client.db()

    // Perform DNS lookup
    let dnsRecords = {}
    let ip = null
    try {
      const hostname = new URL(url).hostname
      const [aRecords, cnameRecords, mxRecords] = await Promise.all([
        resolveDns(hostname, 'A').catch(() => []),
        resolveDns(hostname, 'CNAME').catch(() => []),
        resolveDns(hostname, 'MX').catch(() => [])
      ])
      dnsRecords = { a: aRecords, cname: cnameRecords, mx: mxRecords }
      const { address } = await lookup(hostname)
      ip = address
    } catch (error) {
      console.error('DNS lookup error:', error)
    }

    let status = 'down'
    let responseTime = null
    let favicon = null
    let siteName = null
    let siteDescription = null

    try {
      const startTime = Date.now()
      const response = await fetch(url)
      responseTime = Date.now() - startTime
      status = response.ok ? 'up' : 'down'

      if (response.ok) {
        const html = await response.text()
        const dom = new JSDOM(html)
        const doc = dom.window.document

        const faviconLink = doc.querySelector('link[rel="icon"]') || 
                            doc.querySelector('link[rel="shortcut icon"]')

        if (faviconLink) {
          const faviconHref = faviconLink.getAttribute('href')
          if (faviconHref) {
            const faviconUrl = new URL(faviconHref, url).href
            const faviconResponse = await fetch(faviconUrl)
            if (faviconResponse.ok) {
              const buffer = await faviconResponse.buffer()
              const faviconDir = path.join(process.cwd(), 'public', 'favicons')
              if (!fs.existsSync(faviconDir)) {
                fs.mkdirSync(faviconDir, { recursive: true })
              }
              const faviconFilename = `${Buffer.from(url).toString('base64')}.ico`
              const faviconPath = path.join(faviconDir, faviconFilename)
              fs.writeFileSync(faviconPath, buffer)
              favicon = `/favicons/${faviconFilename}`
            }
          }
        }

        siteName = doc.querySelector('meta[property="og:site_name"]')?.getAttribute('content') || 
                   doc.querySelector('title')?.textContent || null
        siteDescription = doc.querySelector('meta[name="description"]')?.getAttribute('content') || 
                          doc.querySelector('meta[property="og:description"]')?.getAttribute('content') || null
      }
    } catch (error) {
      console.error('Error fetching website:', error)
    }

    const websiteData = {
      url,
      status,
      lastChecked: new Date(),
      ip,
      responseTime,
      dns: dnsRecords,
      favicon,
      siteName,
      siteDescription
    }

    if (isPublic) {
      await db.collection('checkedWebsites').updateOne(
        { url },
        { $set: websiteData },
        { upsert: true }
      )

      // Add entry to statusHistory collection
      await db.collection('statusHistory').insertOne({
        url,
        status,
        timestamp: new Date()
      })

      // Log to recentlyCheckedWebsites
      await db.collection('recentlyCheckedWebsites').insertOne({
        url,
        status,
        timestamp: new Date()
      })
    } else {
      // For dashboard websites
      await db.collection('dashboardWebsites').updateOne(
        { url, userId: req.body.userId },
        { $set: websiteData },
        { upsert: true }
      )

      // Add entry to dashboardStatusHistory collection
      await db.collection('dashboardStatusHistory').insertOne({
        url,
        userId: req.body.userId,
        status,
        timestamp: new Date()
      })
    }

    res.status(200).json(websiteData)
  } catch (error) {
    console.error('Error checking website status:', error)
    res.status(500).json({ message: 'Internal server error', status: 'down' })
  }
}