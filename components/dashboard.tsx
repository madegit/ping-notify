'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Trash2, Globe, CheckCircle, XCircle } from "lucide-react"

type Website = {
  id: string;
  url: string;
  status: 'up' | 'down' | 'checking';
}

export default function Dashboard() {
  const [websites, setWebsites] = useState<Website[]>([])
  const [newUrl, setNewUrl] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    fetchWebsites()
  }, [])

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
        toast({
          title: "Failed to fetch websites",
          description: "Please try again later.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "An error occurred",
        description: "Please try again later.",
        variant: "destructive",
      })
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
        toast({
          title: "Failed to add website",
          description: "Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "An error occurred",
        description: "Please try again later.",
        variant: "destructive",
      })
    }
  }

  const removeWebsite = async (id: string) => {
    try {
      const response = await fetch(`/api/websites/${id}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        setWebsites(websites.filter(site => site.id !== id))
      } else {
        toast({
          title: "Failed to remove website",
          description: "Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "An error occurred",
        description: "Please try again later.",
        variant: "destructive",
      })
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
      updateWebsiteStatus(website.id, data.status)

      if (data.status === 'down') {
        toast({
          title: "Website is down!",
          description: `${website.url} is currently unreachable.`,
          variant: "destructive",
        })
      }
    } catch (err) {
      console.error('Error checking website status:', err)
      updateWebsiteStatus(website.id, 'down')
      toast({
        title: "Error checking website",
        description: `Unable to check status for ${website.url}.`,
        variant: "destructive",
      })
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
          site.id === id ? { ...site, status } : site
        ))
      } else {
        toast({
          title: "Failed to update website status",
          description: "Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "An error occurred",
        description: "Please try again later.",
        variant: "destructive",
      })
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
              <TableRow key={site.id}>
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
                  <Button variant="ghost" size="sm" onClick={() => removeWebsite(site.id)}>
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