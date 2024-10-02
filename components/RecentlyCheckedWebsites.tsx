'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
import Image from 'next/image'

type Website = {
  url: string
  status: 'up' | 'down'
  lastChecked: string
  favicon?: string
}

function truncateUrl(url: string, maxLength: number = 30): string {
  const cleanUrl = url.replace(/^https?:\/\//, '').replace(/\/$/, '')
  if (cleanUrl.length <= maxLength) return cleanUrl
  const start = cleanUrl.substring(0, Math.floor(maxLength / 2) - 2)
  const end = cleanUrl.substring(cleanUrl.length - Math.floor(maxLength / 2) + 1)
  return `${start}...${end}`
}

export default function RecentlyCheckedWebsites() {
  const [websites, setWebsites] = useState<Website[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRecentWebsites = async () => {
      try {
        const res = await fetch('/api/recent-websites?limit=5')
        if (!res.ok) {
          throw new Error('Failed to fetch recent websites')
        }
        const data = await res.json()
        setWebsites(data.slice(0, 5)) // Limit to 5 items
        setLoading(false)
      } catch (err) {
        console.error('Error fetching recent websites:', err)
        setError('Failed to load recent websites. Please try again later.')
        setLoading(false)
      }
    }

    fetchRecentWebsites()
  }, [])

  if (loading) {
    return (
      <Card className="w-full max-w-4xl mx-auto bg-muted">
        <CardContent className="p-6 flex justify-center items-center">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading recently checked websites...</span>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="w-full max-w-4xl mx-auto bg-muted">
        <CardContent className="p-6 text-center text-red-500">
          {error}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-4xl bg-muted mx-auto">
      <CardContent className="p-6">
        {websites.length === 0 ? (
          <p className="text-center text-gray-500">No websites have been checked yet.</p>
        ) : (
          <ul className="space-y-4">
            {websites.map((website) => (
              <li key={website.url} className="flex flex-col pb-3 border-b">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center space-x-2 min-w-0 flex-1">
                    {website.favicon && (
                      <Image
                        src={website.favicon}
                        alt={`${website.url} favicon`}
                        width={16}
                        height={16}
                        className="rounded-sm"
                      />
                    )}
                    <Link 
                      href={`/website/${encodeURIComponent(website.url)}`}
                      className="text-gray-900 font-medium truncate text-lg hover:underline"
                    >
                      {truncateUrl(website.url)}
                    </Link>
                    {website.status === 'up' ? (
                      <CheckCircle className="text-green-500 h-4 w-4 flex-shrink-0" />
                    ) : (
                      <XCircle className="text-red-500 h-4 w-4 flex-shrink-0" />
                    )}
                  </div>
                  <span className="text-gray-800 text-sm py-0 px-2 rounded-lg border border-[#0500FF] hover:text-[#0500FF] ml-2 flex-shrink-0">
                    <Link href={`/website/${encodeURIComponent(website.url)}`}>
                      Details
                    </Link>
                  </span>
                </div>
                <span className="text-xs text-gray-500 mt-1 ml-0">
                  {new Date(website.lastChecked).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}