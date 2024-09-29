"use client"

import { useState, useEffect } from 'react'
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

  useEffect(() => {
    // If session.user exists and has an id, fetch the websites
    if (session?.user?.id) {
      fetchWebsites()
    }
  }, [session])

  useEffect(() => {
    const interval = setInterval(() => {
      websites.forEach(checkStatus)
    }, 300000) // Check every 5 minutes
    return () => clearInterval(interval)
  }, [websites])

  const fetchWebsites = async () => {
    try {
      const response = await fetch('/api/websites')
      if (response.ok) {
        const data = await response.json()
        setWebsites(data)
      } else {
        toast.error("Failed to fetch websites", "Please try again later.")
      }
    } catch (error) {
      toast.error("An error occurred", "Please try again later.")
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
        setWebsites([...websites, newWebsite])
        setNewUrl('')
        checkStatus(newWebsite)
      } else {
        toast.error("Failed to add website", "Please try again.")
      }
    } catch (error) {
      toast.error("An error occurred", "Please try again later.")
    }
  }

  const removeWebsite = async (id: string) => {
    try {
      const response = await fetch(`/api/websites/${id}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        setWebsites(websites.filter(site => site._id !== id))
        toast.success("Website removed", "The website has been successfully removed.")
      } else {
        toast.error("Failed to remove website", "Please try again.")
      }
    } catch (error) {
      console.error('Error removing website:', error)
      toast.error("An error occurred", "Please try again later.")
    }
  }

  const checkStatus = async (website: Website) => {
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
        toast.error("Website is down!", `${website.url} is currently unreachable.`)
      }
    } catch (err) {
      console.error('Error checking website status:', err)
      updateWebsiteStatus(website._id, 'down')
      toast.error("Error checking website", `Unable to check status for ${website.url}.`)
    }
  }

  const updateWebsiteStatus = async (id: string, status: 'up' | 'down') => {
    try {
      const response = await fetch(`/api/websites/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      })
      if (response.ok) {
        setWebsites(websites.map(site => 
          site._id === id ? { ...site, status } : site
        ))
      } else {
        toast.error("Failed to update website status", "Please try again.")
      }
    } catch (error) {
      console.error('Error updating website status:', error)
      toast.error("An error occurred", "Please try again later.")
    }
  }

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
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : site.status === 'up' ? (
                    <CheckCircle className="h-4 w-4 text-green-500" /> 
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
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