import UptimeMonitor from '@/components/uptime-monitor'

export default function Home() {
  return (
    <main className="container mx-auto p-4 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 transition-colors duration-300 overflow-x-hidden">
      <h1 className="mt-5 mb-8"><img className="h-auto w-40 mx-auto" src="/pnlogo.png" alt="PingNotify Logo" /></h1>
      <UptimeMonitor />
    </main>
  )
}