"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useCustomToast } from "@/hooks/use-toast"
import { Loader2, Trash2, Globe, CheckCircle, XCircle, ExternalLink, LogOut, ArrowDownRight } from "lucide-react"
import { useSession, signOut } from "next-auth/react"
import { Session } from "next-auth"
import Image from "next/image"
import Link from "next/link"
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

type Website = {
  _id: string
  url: string
  domain: string
  status: "up" | "down" | "checking"
  lastChecked?: string
  responseTime?: number
  favicon?: string
  ip?: string
  dns?: {
    a?: string[]
    cname?: string[]
    mx?: { exchange: string; priority: number }[]
  }
  siteName?: string
  siteDescription?: string
}

interface CustomSession extends Session {
  user: {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

function truncateUrl(url: string, maxLength: number = 30): string {
  const cleanUrl = url.replace(/^(https?:\/\/)/, '');
  if (cleanUrl.length <= maxLength) return cleanUrl;
  const start = cleanUrl.substring(0, Math.floor(maxLength / 2) - 2);
  const end = cleanUrl.substring(cleanUrl.length - Math.floor(maxLength / 2) + 1);
  return `${start}...${end}`;
}

export default function Dashboard() {
  const [websites, setWebsites] = useState<Website[]>([])
  const [newUrl, setNewUrl] = useState("")
  const toast = useCustomToast()
  const { data: session } = useSession() as { data: CustomSession | null }
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
        await checkStatus(website, false)
      }
    }

    checkAllWebsites()

    const interval = setInterval(checkAllWebsites, 300000)
    return () => clearInterval(interval)
  }, [])

  const fetchWebsites = async () => {
    try {
      const response = await fetch("/api/websites")
      if (response.ok) {
        const data = await response.json()
        setWebsites(
          data.map((site: Website) => ({ ...site, status: "checking" }))
        )
        data.forEach((site: Website) => checkStatus(site, false))
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
      const domain = new URL(newUrl).hostname
      if (websites.some(site => site.domain === domain)) {
        toast.error("Website already exists", "This website is already being monitored.")
        return
      }

      const response = await fetch("/api/websites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: newUrl }),
      })
      if (response.ok) {
        const newWebsite = await response.json()
        setWebsites((prevWebsites) => [
          ...prevWebsites,
          { ...newWebsite, status: "checking" },
        ])
        setNewUrl("")
        toast.success("Website added", "Checking status...")
        checkStatus(newWebsite, true)
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
        method: "DELETE",
      })
      if (response.ok) {
        setWebsites((prevWebsites) =>
          prevWebsites.filter((site) => site._id !== id)
        )
        toast.success(
          "Website removed",
          "The website has been successfully removed."
        )
      } else {
        toast.error("Failed to remove website", "Please try again.")
      }
    } catch (error) {
      console.error("Error removing website:", error)
      toast.error("An error occurred", "Please try again later.")
    }
  }

  const checkStatus = useCallback(
    async (website: Website, isInitialCheck: boolean) => {
      try {
        const response = await fetch("/api/check-status", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            url: website.url, 
            isPublic: false, 
            userId: session?.user?.id,
            isInitialCheck: isInitialCheck
          }),
        })

        if (!response.ok) {
          throw new Error("Network response was not ok")
        }

        const data: Website = await response.json()
        updateWebsiteStatus(website._id, data)

        if (data.status === "down") {
          toast.error(
            "Website is down!",
            `${website.url} is currently unreachable.`
          )
        } else {
          toast.success(
            "Website is up!",
            `${website.url} is currently reachable.`
          )
        }

        // Cache favicon
        if (data.favicon) {
          const faviconResponse = await fetch(`/api/cache-favicon?url=${encodeURIComponent(website.url)}`)
          const faviconData = await faviconResponse.json()
          if (faviconData.cachedPath) {
            updateWebsiteStatus(website._id, { favicon: faviconData.cachedPath })
          }
        }

        if (isInitialCheck) {
          // Update recently checked websites
          await fetch('/api/recent-websites', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: website.url,
              domain: website.domain,
              status: data.status,
              lastChecked: new Date().toISOString(),
              favicon: data.favicon
            }),
          })

          // Update status history
          await fetch('/api/status-history', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: website.url,
              domain: website.domain,
              status: data.status,
              timestamp: new Date().toISOString()
            }),
          })
        }

      } catch (err) {
        console.error("Error checking website status:", err)
        updateWebsiteStatus(website._id, { status: "down" })
        toast.error(
          "Error checking website",
          `Unable to check status for ${website.url}.`
        )
      }
    },
    [toast, session]
  )

  const updateWebsiteStatus = useCallback(
    (id: string, data: Partial<Website>) => {
      setWebsites((prevWebsites) =>
        prevWebsites.map((site) =>
          site._id === id ? { ...site, ...data } : site
        )
      )
    },
    []
  )

  const handleLogout = () => {
    signOut({ callbackUrl: "/" })
  }

  const websitesUp = websites.filter((site) => site.status === "up").length
  const websitesDown = websites.filter((site) => site.status === "down").length
  const websitesChecking = websites.filter(
    (site) => site.status === "checking"
  ).length

  const pieChartData = [
    { name: "Up", value: websitesUp, color: "#10B981" },
    { name: "Down", value: websitesDown, color: "#EF4444" },
    { name: "Checking", value: websitesChecking, color: "#FFC922" },
  ]

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex justify-between w-full items-center px-2 lg:px-10 space-x-4">
        <Avatar className="bg-blue-50 p-4">
          <AvatarImage src={session?.user?.image || ""} alt="User" />
          <AvatarFallback>{getInitials(session?.user?.name || "User")}</AvatarFallback>
        </Avatar>
        <Button onClick={handleLogout} variant="outline" className="bg-transparent shadow-none rounded-lg">
          <LogOut className="w-4 h-4 text-[#0500FF]" />
          <span className="hidden sm:inline ml-2">Logout</span>
        </Button>
      </div>

      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <h1 className="text-4xl font-semibold tracking-tighter text-gray-900 mb-5">
          Welcome, {session?.user?.name}!
        </h1>
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="bg-[#0500FF] text-white">
              <CardHeader>
                <CardTitle className="text-lg font-semibold tracking-tighter text-gray-200">Total Websites</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-semibold tracking-tight">{websites.length}</p>
                <p className="text-sm text-gray-400 tracking-tight">Monitored websites</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold tracking-tighter">Websites Online</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-green-500 tracking-tight">{websitesUp}</p>
                <p className="text-sm text-gray-500 tracking-tight">Currently up and running</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold tracking-tighter">Websites Offline</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-red-500 tracking-tight">{websitesDown}</p>
                <p className="text-sm text-gray-500 tracking-tight">Need attention</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-semibold tracking-tighter">Website Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="font-semibold tracking-tighter">Response Times</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={websites}>
                      <XAxis dataKey="url" tickFormatter={truncateUrl} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="responseTime" fill="#4ade80" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-blue-50 rounded-xl overflow-hidden lg:py-10">
            <CardContent className="p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
              <div className="space-y-4 lg:w-1/2">
                <p className="text-[#0500FF] text-sm font-semibold">ADD WEBSITE</p>
                <h2 className="text-2xl text-gray-900 lg:text-4xl font-semibold tracking-tighter">Monitor New Website</h2>
                <p className="text-gray-700">
                  Enter a URL to add a new website to your monitoring list. We'll check its status regularly.
                </p>
              </div>
              <div className="w-full lg:w-1/2 space-y-4">
                <p className="font-semibold text-[#0500FF]">Add it here <ArrowDownRight className="inline-block h-5 w-5"/></p>
                <form onSubmit={addWebsite} className="space-y-4">
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
                  <Button type="submit" className="w-full bg-[#0500FF] text-white hover:bg-blue-600 transition-colors">
                    Add Website
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-semibold tracking-tighter">Your Websites</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-1/3">Website</TableHead>
                      <TableHead className="w-1/6">Status</TableHead>
                      <TableHead className="w-1/6 hidden md:table-cell">Last Checked</TableHead>
                      <TableHead className="w-1/6 hidden md:table-cell">Response Time</TableHead>
                      <TableHead className="w-1/6">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {websites.map((site) => (
                      <TableRow key={site._id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">
                          <Link
                            href={`/website/${encodeURIComponent(site.url)}`}
                            className="flex items-center space-x-2 text-gray-900 hover:text-blue-800"
                          >
                            {site.favicon && (
                              <Image
                                src={site.favicon}
                                alt={`${site.url} favicon`}
                                width={16}
                                height={16}
                                className="rounded-sm"
                              />
                            )}
                            <span className="tracking-tight truncate max-w-[200px]">{truncateUrl(site.url)}</span>
                          </Link>
                        </TableCell>
                        <TableCell>
                          {site.status === "checking" ? (
                            <div className="flex items-center text-yellow-500">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span className="tracking-tight hidden sm:inline ml-2">Checking</span>
                            </div>
                          ) : site.status === "up" ? (
                            <div className="flex items-center text-green-500">
                              <CheckCircle className="h-4 w-4" />
                              <span className="tracking-tight hidden sm:inline ml-2">Online</span>
                            </div>
                          ) : (
                            <div className="flex items-center text-red-500">
                              <XCircle className="h-4 w-4 " />
                              <span className="tracking-tight hidden sm:inline ml-2">Offline</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell tracking-tight">
                          {site.lastChecked ? new Date(site.lastChecked).toLocaleString() : "N/A"}
                        </TableCell>
                        <TableCell className="hidden md:table-cell tracking-tight">
                          {site.responseTime ? `${site.responseTime}ms` : "N/A"}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Link href={`/website/${encodeURIComponent(site.url)}`} passHref>
                              <Button variant="outline" size="sm" className="hidden sm:flex">
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Details
                              </Button>
                            </Link>
                            <Button variant="outline" size="sm" onClick={() => removeWebsite(site._id)}>
                              <Trash2 className="h-4 w-4 sm:mr-2" />
                              <span className="hidden sm:inline">Remove</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}