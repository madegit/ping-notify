import UptimeMonitor from '@/components/uptime-monitor'

export default function Home() {
  return (
    <main className="container mx-auto p-4">
      <h1 className="text-4xl mt-2 tracking-tight font-bold text-center mb-8">PingNotify</h1>
      <UptimeMonitor />
    </main>
  )
}