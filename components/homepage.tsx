'use client'

import { useState, useEffect } from 'react'
import { UptimeChecker} from '@/components/uptime-checker'
import { Features } from '@/components/features'
import { Button } from "@/components/ui/button"
import Link from 'next/link'
import Image from 'next/image'
import { useTheme } from 'next-themes'
import { Zap, MessagesSquare, LogIn } from 'lucide-react'
import dynamic from 'next/dynamic'

const RecentlyCheckedWebsites = dynamic(() => import('@/components/RecentlyCheckedWebsites'), {
  ssr: false,
  loading: () => <p>Loading recently checked websites...</p>
})

export default function HomePage() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => setMounted(true), [])

  if (!mounted) return null

  return (
    <div className="min-h-screen">
      <div className="lg:px-10 lg:py-5 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 transition-colors duration-300 overflow-x-hidden">
        {/* Header */}
        <header className="container px-4 pt-5 lg:px-8 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <h1><img className="h-auto w-40 mx-auto" src="/pnlogo.png" alt="PingNotify Logo" /></h1>
          </div> 
          <Link href="/app">
            <Button className="primary px-4 bg-[#0500FF] color-white ml-auto rounded-lg tracking-tight shadow-none">Get Started</Button>
          </Link>
        </header>

        {/* Main Content */}
        <div className="lg:grid md:grid-cols-2  justify-between items-center space-x-2 min-h-[400px] mx-auto">
          <div className="flex flex-col pt-10 justify-center min-h-full px-4">
            <h2 className="text-5xl md:text-6xl text-gray-900 dark:text-gray-200 my-4 mx-auto font-medium tracking-tighter">
              Stay Ahead with Instant Downtime Alerts. <Zap className="inline-block h-7 w-7"/>
            </h2>
            <p className="text-gray-700 lg:text-xl tracking-tight">
              Get notified when your website is Unreachable.
            </p>
          </div>

          <div className="flex justify-center min-h-full w-full lg:order-last lg:justify-end">
            <Image
              src="/images/PingNotify Illustration.png"
              alt="PingNotify Illustration"
              width={500}
              height={500}
              className="mt-4 mx-auto"
            />
          </div>
        </div>

        <Features />

        <div className="flex flex-col items-center justify-center space-y-2 text-center">
          <div className="space-y-2">
            <h2 className="text-4xl mt-5 font-semibold tracking-tighter md:text-5xl">Try it Out</h2>
          </div>
        </div>
        <div className="py-10 px-5">
          <UptimeChecker />
          <div className='max-w-[50] lg:text-right lg:ml-auto'>
            <Link href="/app">
              <Button className="px-1 py-1 text-md pt-4 pb-2 my-4 font-semibold text-[#0500FF] hover:bg-transparent hover:text-gray-900 hover:no-underline bg-transparent flex items-center justify-center rounded-none shadow-none m-auto tracking-tight">
                Get Started <LogIn className="ml-2 inline-block h-4 w-4"/>
              </Button>
            </Link>
          </div>
        </div>

        <div className="py-10 px-5">
          <div className="flex flex-col items-center justify-center space-y-2 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl my-5 font-semibold tracking-tighter md:text-5xl">Recently Checked Websites</h2>
            </div>
          </div>
          <RecentlyCheckedWebsites />
        </div>
      </div>

      <footer>
        <div className="mt-8 py-5 border-t bg-gray-900 text-sm border-gray-200  text-center text-gray-400 px-5 tracking-tight ">
          <p>
            © 2024 PingNotify. All rights reserved.
            <br />
           <MessagesSquare className="inline-block h-4 w-4"/> Feedback <Link href="https://x.com/madethecreator" target="_blank" rel="noopener noreferrer">
              @madethecreator
            </Link>
          </p> 
        </div>
      </footer>
    </div>
  )
}