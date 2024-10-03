import type { NextApiRequest, NextApiResponse } from 'next'
import clientPromise from '@/lib/mongodb'
import dns from 'dns'
import { promisify } from 'util'
import fetch from 'node-fetch'
import { JSDOM } from 'jsdom'
import { cacheFavicon } from './cache-favicon'

const resolveDns = promisify(dns.resolve)
const lookup = promisify(dns.lookup)

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { url, isPublic = true, userId } = req.body

  if (!url) {
    return res.status(400).json({ message: 'URL is required' })
  }

  try {
    const client = await clientPromise
    const db = client.db()

    // Extract domain from URL
    const domain = new URL(url).hostname

    // Perform DNS lookup
    let dnsRecords = {}
    let ip = null
    try {
      const [aRecords, cnameRecords, mxRecords] = await Promise.all([
        resolveDns(domain, 'A').catch(() => []),
        resolveDns(domain, 'CNAME').catch(() => []),
        resolveDns(domain, 'MX').catch(() => [])
      ])
      dnsRecords = { a: aRecords, cname: cnameRecords, mx: mxRecords }
      const { address } = await lookup(domain)
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

        try {
          favicon = await cacheFavicon(url)
        } catch (error) {
          console.error('Error caching favicon:', error)
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
      domain,
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
      await Promise.all([
        db.collection('checkedWebsites').updateOne(
          { domain },
          { $set: websiteData },
          { upsert: true }
        ),
        db.collection('statusHistory').insertOne({
          domain,
          status,
          timestamp: new Date()
        }),
        db.collection('recentlyCheckedWebsites').insertOne({
          domain,
          status,
          timestamp: new Date()
        })
      ])
    } else {
      // For dashboard websites
      await Promise.all([
        db.collection('dashboardWebsites').updateOne(
          { domain, userId },
          { $set: websiteData },
          { upsert: true }
        ),
        db.collection('dashboardStatusHistory').insertOne({
          domain,
          userId,
          status,
          timestamp: new Date()
        })
      ])
    }

    res.status(200).json(websiteData)
  } catch (error) {
    console.error('Error checking website status:', error)
    res.status(500).json({ message: 'Internal server error', status: 'down' })
  }
}