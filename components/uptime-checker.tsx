"use client"

import { useState, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
import { useCustomToast } from "@/hooks/use-toast"

export function UptimeCheckerComponent() {
  const [url, setUrl] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'up' | 'down'>('idle')
  const toast = useCustomToast()

  const checkStatus = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')

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

      const data = await response.json()
      setStatus(data.status)

      if (data.status === 'up') {
        toast.success(`${url} is up!`)
      } else {
        toast.error(`${url} is down`)
      }
    } catch (err) {
      setStatus('down')
      toast.error('Unable to check the website status')
    }
  }, [url, toast])

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
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}