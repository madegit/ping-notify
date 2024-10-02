import { Metadata } from 'next'
import clientPromise from '@/lib/mongodb'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import WebsiteStatusDisplay from '@/components/WebsiteStatusDisplay'

type WebsiteProps = {
  params: { url: string }
}

function truncateUrl(url: string, maxLength: number = 30): string {
  const cleanUrl = url.replace(/^(https?:\/\/)/, '');

  if (cleanUrl.length <= maxLength) return cleanUrl;
  const start = cleanUrl.substring(0, Math.floor(maxLength / 2) - 2);
  const end = cleanUrl.substring(cleanUrl.length - Math.floor(maxLength / 2) + 1);
  return `${start}...${end}`;
}

export async function generateMetadata({ params }: WebsiteProps): Promise<Metadata> {
  const decodedUrl = decodeURIComponent(params.url)
  return {
    title: `${truncateUrl(decodedUrl)} - Website Status | PingNotify`,
    description: `Current status and information for ${truncateUrl(decodedUrl)}`,
  }
}

async function getWebsiteData(url: string) {
  const client = await clientPromise
  const db = client.db()
  const website = await db.collection('checkedWebsites').findOne({ url })

  if (!website) return null

  const statusHistory = await db.collection('statusHistory')
    .find({ url })
    .sort({ timestamp: -1 })
    .limit(30)
    .toArray()

  return {
    ...JSON.parse(JSON.stringify(website)),
    statusHistory: JSON.parse(JSON.stringify(statusHistory))
  }
}

export default async function WebsitePage({ params }: WebsiteProps) {
  const decodedUrl = decodeURIComponent(params.url)
  const website = await getWebsiteData(decodedUrl)

  if (!website) {
    return <div>Website not found</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 transition-colors duration-300 overflow-x-hidden">
      <header className="container px-4 pt-5 lg:px-8 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Link href="/">
            <img className="h-auto w-40 mx-auto mr-2" src="/pnlogo.png" alt="PingNotify Logo" />
          </Link>
        </div> 
        <Link href="/app">
          <Button className="primary px-4 bg-[#0500FF] color-white ml-auto rounded-lg tracking-tight shadow-none">Get Started</Button>
        </Link>
      </header>

      <main className="container mx-auto px-4 py-8">
        <WebsiteStatusDisplay website={website} />
      </main>

      <footer>
        <div className="mt-8 py-5 border-t bg-gray-900 text-sm border-gray-200 text-center text-gray-400 px-5 tracking-tight">
          <p>
            © 2024 PingNotify. All rights reserved.
            <br />
            <Link href="https://x.com/madethecreator" target="_blank" rel="noopener noreferrer">
              @madethecreator
            </Link>
          </p> 
        </div>
      </footer>
    </div>
  )
}