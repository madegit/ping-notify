"use client"

import { useState, useCallback, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, XCircle, Loader2, ArrowDownRight, ChevronDown, ChevronUp } from "lucide-react"
import { useCustomToast } from "@/hooks/use-toast"
import Image from 'next/image'

type SiteInfo = {
  status: 'up' | 'down';
  ip?: string;
  dns?: {
    a?: string[];
    cname?: string[];
    mx?: { exchange: string; priority: number }[];
  };
  responseTime?: number;
  favicon?: string;
}

function truncateUrl(url: string, maxLength: number = 30): string {
  const cleanUrl = url.replace(/^(https?:\/\/)/, '');
  if (cleanUrl.length <= maxLength) return cleanUrl;
  const start = cleanUrl.substring(0, Math.floor(maxLength / 2) - 2);
  const end = cleanUrl.substring(cleanUrl.length - Math.floor(maxLength / 2) + 1);
  return `${start}...${end}`;
}

export function UptimeChecker() {
  const [url, setUrl] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'up' | 'down'>('idle')
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [cachedFavicon, setCachedFavicon] = useState<string | null>(null)
  const toast = useCustomToast()

  const checkStatus = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setSiteInfo(null)
    setShowDetails(false)
    setCachedFavicon(null)

    try {
      const response = await fetch('/api/check-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      })

      if (!response.ok) {
        throw new Error('Failed to check status')
      }

      const data: SiteInfo = await response.json()
      setStatus(data.status)
      setSiteInfo(data)

      if (data.status === 'up') {
        toast.success("Website is online!", `${url} is currently reachable.`)
      } else {
        toast.error("Website is down!", `${url} is currently unreachable.`)
      }

      // Cache favicon
      if (data.favicon) {
        const faviconResponse = await fetch(`/api/cache-favicon?url=${encodeURIComponent(url)}`)
        const faviconData = await faviconResponse.json()
        if (faviconData.cachedPath) {
          setCachedFavicon(faviconData.cachedPath)
        }
      }
    } catch (err) {
      setStatus('down')
      toast.error("Error checking website", `Unable to check status for ${url}.`)
    }
  }, [url, toast])

  return (
    <Card className="w-full max-w-4xl mx-auto bg-blue-50 rounded-xl overflow-hidden lg:py-10">
      <CardContent className="p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
        <div className="space-y-4 lg:w-1/2">
          <p className="text-[#0500FF] text-sm font-semibold">OUR TOOL</p>
          <h2 className="text-2xl text-gray-900 lg:text-4xl font-semibold tracking-tighter">Website Uptime Checker</h2>
          <p className="text-gray-700">
            Enter a URL to check if the website is Offline or Online. It's quick, easy, and free.
          </p>
        </div>
        <div className="w-full lg:w-1/2 space-y-4">
          <p className="font-semibold text-[#0500FF]">Try it here  <ArrowDownRight className="inline-block h-5 w-5"/></p>
          <form onSubmit={checkStatus} className="space-y-4">
            <Input
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              className="w-full"
            />
            <Button 
              type="submit" 
              disabled={status === 'loading'} 
              className="w-full bg-[#0500FF] text-white hover:bg-blue-600 transition-colors"
            >
              {status === 'loading' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking...
                </>
              ) : (
                'Check Status'
              )}
            </Button>
          </form>
          {status !== 'idle' && status !== 'loading' && (
            <div className="text-center p-4 rounded-xl bg-white">
              <div className={`flex items-center justify-center ${status === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                {status === 'up' ? (
                  <CheckCircle className="mr-2 h-5 w-5" />
                ) : (
                  <XCircle className="mr-2 h-5 w-5" />
                )}
                Website is {status === 'up' ? 'Online' : 'Offline'}!
              </div>
              {siteInfo && (
                <div className="mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDetails(!showDetails)}
                    className="text-sm"
                  >
                    {showDetails ? 'Hide Details' : 'Show Details'}
                    {showDetails ? (
                      <ChevronUp className="ml-2 h-4 w-4" />
                    ) : (
                      <ChevronDown className="ml-2 h-4 w-4" />
                    )}
                  </Button>
                  {showDetails && (
                    <div className="mt-4 text-left text-sm">
                      <div className="flex items-center mb-2">
                        {cachedFavicon && (
                          <Image
                            src={cachedFavicon}
                            alt="Website favicon"
                            width={16}
                            height={16}
                            className="mr-2"
                          />
                        )}
                        <span>{truncateUrl(url)}</span>
                      </div>
                      {siteInfo.dns?.mx && siteInfo.dns.mx.length > 0 && (
                        <div className="mt-2">
                          <strong>MX Records:</strong>
                          <ul className="list-disc list-inside">
                            {siteInfo.dns.mx.map((record, index) => (
                              <li key={index}>
                                {record.exchange} (Priority: {record.priority})
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}