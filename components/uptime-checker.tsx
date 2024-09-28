"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"

export function UptimeCheckerComponent() {
  const [url, setUrl] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'up' | 'down'>('idle')
  const [error, setError] = useState<string | null>(null)

  const checkStatus = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setError(null)

    try {
      const response = await fetch(url, { mode: 'no-cors' })
      setStatus(response.status === 0 ? 'up' : 'down')
    } catch (err) {
      setStatus('down')
      setError('Unable to reach the website')
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Website Uptime Checker</CardTitle>
        <CardDescription>Enter a URL to check if the website is up or down</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={checkStatus} className="space-y-4">
          <Input
            type="url"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
          <Button type="submit" disabled={status === 'loading'} className="w-full">
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
          <div className="mt-4 text-center">
            {status === 'up' ? (
              <div className="flex items-center justify-center text-green-500">
                <CheckCircle className="mr-2 h-5 w-5" />
                Website is up!
              </div>
            ) : (
              <div className="flex items-center justify-center text-red-500">
                <XCircle className="mr-2 h-5 w-5" />
                Website is down
                {error && <p className="text-sm mt-2">{error}</p>}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}