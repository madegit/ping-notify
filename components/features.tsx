import Link from "next/link"
import { Rocket, Activity, BellDot } from 'lucide-react'

export function Features() {
  return (

    <section id="features" className="w-[90] rounded-xl py-8 md:py-14 mb-10 bg-muted my-10 pb-18">
      <div className="container space-y-12 px-6">
        <div className="flex flex-col items-center justify-center space-y-2 text-center">
          <div className="space-y-2">
            <h2 className="text-4xl font-semibold tracking-tighter md:text-5xl">Features</h2>
           
          </div>
        </div>
        <div className="mx-auto grid max-w-sm items-start gap-8 sm:max-w-4xl sm:grid-cols-2 md:gap-12 lg:max-w-5xl lg:grid-cols-3">
          <div className="grid gap-1">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary p-2 text-primary-foreground">
                <Activity className="h-6 w-6" />
              </div>
              <h3 className="text-3xl font-semibold tracking-tighter">
                Track </h3>
            </div>
            <p className="text-sm text-gray-700 lg:text-xl tracking-tight">
               Monitor your website's reachability in real-time.
            </p>
          </div>

          <div className="grid gap-1">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary p-2 text-primary-foreground">
                <BellDot className="h-6 w-6" />
              </div>
              <h3 className="text-3xl font-semibold tracking-tighter">
                Notify</h3>
            </div>
            <p className="text-sm text-gray-700 lg:text-xl tracking-tight">
              Get instant alerts via mail on critical issues and  analytics.
            </p>
          </div>

          <div className="grid gap-1">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary p-2 text-primary-foreground">
                <Rocket className="h-6 w-6" />
              </div>
              <h3 className="text-3xl font-semibold tracking-tighter">
                Optimize </h3>
            </div>
            <p className="text-sm text-gray-700 lg:text-xl tracking-tight">
              Continuously improve your website based on uptime reports.
            </p>
          </div>
          
        </div>
      </div>
    </section>
    
    )
}
