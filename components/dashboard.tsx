"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useCustomToast } from "@/hooks/use-toast"
import { Loader2, Trash2, Globe, CheckCircle, XCircle } from "lucide-react"
import { useSession } from "next-auth/react"

type Website = {
  _id: string;
  url: string;
  status: 'up' | 'down' | 'checking';
}

export default function Dashboard() {
  const [websites, setWebsites] = useState<Website[]>([])
  const [newUrl, setNewUrl] = useState('')
  const toast = useCustomToast()
  const { data: session } = useSession()
  const websitesRef = useRef<Website[]>([])

  useEffect(() => {
    if (session?.user?.id) {
      fetchWebsites()
    }
  }, [session])

  useEffect(() => {
    websitesRef.current = websites
  }, [websites])

  useEffect(() => {
    const checkAllWebsites = async () => {
      for (const website of websitesRef.current) {
        await checkStatus(website)
      }
    }

    checkAllWebsites() // Check immediately on mount

    const interval = setInterval(checkAllWebsites, 300000) // Check every 5 minutes
    return () => clearInterval(interval)
  }, [])

  const fetchWebsites = async () => {
    try {
      const response = await fetch('/api/websites')
      if (response.ok) {
        const data = await response.json()
        setWebsites(data.map((site: Website) => ({ ...site, status: 'checking' })))
        // Check status for each website immediately after fetching
        data.forEach((site: Website) => checkStatus(site))
      } else {
        toast.error("Failed to fetch websites", "Please try again later.", <XCircle className="h-4 w-4" />)
      }
    } catch (error) {
      toast.error("An error occurred", "Please try again later.", <XCircle className="h-4 w-4" />)
    }
  }

  const addWebsite = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/websites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url: newUrl })
      })
      if (response.ok) {
        const newWebsite = await response.json()
        setWebsites(prevWebsites => [...prevWebsites, { ...newWebsite, status: 'checking' }])
        setNewUrl('')
        toast.success("Website added", "Checking status...", <CheckCircle className="h-4 w-4" />)
        checkStatus(newWebsite)
      } else {
        toast.error("Failed to add website", "Please try again.", <XCircle className="h-4 w-4" />)
      }
    } catch (error) {
      toast.error("An error occurred", "Please try again later.", <XCircle className="h-4 w-4" />)
    }
  }

  const removeWebsite = async (id: string) => {
    try {
      const response = await fetch(`/api/websites/${id}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        setWebsites(prevWebsites => prevWebsites.filter(site => site._id !== id))
        toast.success("Website removed", "The website has been successfully removed.", <CheckCircle className="h-4 w-4" />)
      } else {
        toast.error("Failed to remove website", "Please try again.", <XCircle className="h-4 w-4" />)
      }
    } catch (error) {
      console.error('Error removing website:', error)
      toast.error("An error occurred", "Please try again later.", <XCircle className="h-4 w-4" />)
    }
  }

  const checkStatus = useCallback(async (website: Website) => {
    try {
      const response = await fetch('/api/check-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: website.url }),
      })

      if (!response.ok) {
        throw new Error('Network response was not ok')
      }

      const data = await response.json()
      updateWebsiteStatus(website._id, data.status)

      if (data.status === 'down') {
        toast.error("Website is down!", `${website.url} is currently unreachable.`, <XCircle className="h-4 w-4" />)
      }
    } catch (err) {
      console.error('Error checking website status:', err)
      updateWebsiteStatus(website._id, 'down')
      toast.error("Error checking website", `Unable to check status for ${website.url}.`, <XCircle className="h-4 w-4" />)
    }
  }, [toast])

  const updateWebsiteStatus = useCallback((id: string, status: 'up' | 'down') => {
    setWebsites(prevWebsites => prevWebsites.map(site => 
      site._id === id ? { ...site, status } : site
    ))
  }, [])

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Website Monitoring Dashboard</CardTitle>
        <CardDescription>Add and monitor your websites</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={addWebsite} className="flex space-x-2 mb-4">
          <div className="relative flex-grow">
            <Globe className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="url"
              placeholder="https://example.com"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              className="pl-8"
              required
            />
          </div>
          <Button type="submit">Add Website</Button>
        </form>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Website</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {websites.map((site) => (
              <TableRow key={site._id}>
                <TableCell>{site.url}</TableCell>
                <TableCell>
                  {site.status === 'checking' ? (
                    <div className="flex items-center">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mr-2" />
                      Checking
                    </div>
                  ) : site.status === 'up' ? (
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      Online
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <XCircle className="h-4 w-4 text-red-500 mr-2" />
                      Offline
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" onClick={() => removeWebsite(site._id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}