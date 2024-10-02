'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Zap, CheckCircle, XCircle, Clock, Globe, Server, Info, ChevronDown, ChevronUp } from 'lucide-react'
import HexGrid from './HexGrid'
import Image from 'next/image'

type WebsiteData = {
  url: string;
  status: 'up' | 'down';
  lastChecked: string;
  ip?: string;
  responseTime?: number;
  dns?: {
    a?: string[];
    cname?: string[];
    mx?: { exchange: string; priority: number }[];
  };
  favicon?: string;
  siteName?: string;
  siteDescription?: string;
}

type WebsiteStatusDisplayProps = {
  website: WebsiteData;
}

function truncateUrl(url: string, maxLength: number = 30): string {
  const cleanUrl = url.replace(/^(https?:\/\/)/, '');

  if (cleanUrl.length <= maxLength) return cleanUrl;
  const start = cleanUrl.substring(0, Math.floor(maxLength / 2) - 2);
  const end = cleanUrl.substring(cleanUrl.length - Math.floor(maxLength / 2) + 1);
  return `${start}...${end}`;
}

export default function WebsiteStatusDisplay({ website }: WebsiteStatusDisplayProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [showMx, setShowMx] = useState(false);
  const [formattedDate, setFormattedDate] = useState<string>('');

  useEffect(() => {
    setFormattedDate(new Date(website.lastChecked).toLocaleString());
  }, [website.lastChecked]);

  const toggleTooltip = () => {
    setShowTooltip(!showTooltip);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto mt-8 bg-white dark:bg-gray-800">
      <CardContent className="p-6">
        <h1 className="text-3xl md:text-4xl text-gray-900 dark:text-gray-200 mb-4 font-medium tracking-tighter">
          Website Status <Zap className="inline-block h-7 w-7"/>
        </h1>
        <div className="relative flex items-center mb-6">
          {website.favicon && (
            <Image
              src={website.favicon}
              alt={`${website.siteName || website.url} favicon`}
              width={24}
              height={24}
              className="mr-2 rounded-sm"
            />
          )}
          <h2 className="text-xl text-gray-900 dark:text-gray-300">
            {truncateUrl(website.url)}  
            <Button
              onClick={toggleTooltip}
              variant="ghost"
              size="sm"
              className="ml-2 p-0 h-auto"
              aria-label="Show full URL"
            >
              <Info className="h-4 w-4" />
            </Button> 
          </h2>
          {showTooltip && (
            <div className="absolute z-10 p-2 mt-1 text-sm text-white bg-gray-800 rounded-md shadow-lg top-full left-0">
              {website.url}
            </div>
          )}
        </div>
        {website.siteName && (
          <p className="text-lg text-gray-700 dark:text-gray-400 mb-2">{website.siteName}</p>
        )}
        {website.siteDescription && (
          <p className="text-sm text-gray-600 dark:text-gray-500 mb-4">{website.siteDescription}</p>
        )}
        <div className="space-y-4">
          <div className="flex items-center">
            {website.status === 'up' ? (
              <CheckCircle className="text-green-500 h-4 w-4 mr-2" />
            ) : (
              <XCircle className="text-red-500 h-4 w-4 mr-2" />
            )}
            <p className="text-xl tracking-tight">
              <span className='font-semibold'>Status:</span> {website.status === 'up' ? 'Online' : 'Offline'}
            </p>
          </div>
          <div className="flex items-center tracking-tight">
            <p><Clock className="text-gray-500 h-5 w-5 mr-2 inline-block" />
              <span className='font-semibold'>Last Checked:</span> {formattedDate}</p>
          </div>
          {website.ip && (
            <div className="flex items-center tracking-tight">
              <p><Globe className="text-gray-500 h-5 w-5 mr-1 inline-block" /> <span className='font-semibold'>IP Address:</span> {website.ip}</p>
            </div>
          )}
          {website.responseTime && (
            <div className="flex items-center tracking-tight">
              <p><Server className="text-gray-500 h-5 w-5 mr-2 inline-block" />
                <span className='font-semibold'>Response Time:</span> {website.responseTime}ms</p>
            </div>
          )}
          {website.dns && (
            <div>
              <span className="font-semibold text-xl text-gray-900 dark:text-gray-200 tracking-tight">DNS Records:</span>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-2 tracking-tight">
                {website.dns.a && <li>A: {website.dns.a.join(', ')}</li>}
                {website.dns.cname && <li>CNAME: {website.dns.cname.join(', ')}</li>}
                {website.dns.mx && website.dns.mx.length > 0 && (
                  <li>
                    <Button
                      onClick={() => setShowMx(!showMx)}
                      variant="link"
                      className="h-auto p-0 text-gray-900 hover:text-blue-600"
                    >
                      MX Records {showMx ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
                    </Button>
                    {showMx && (
                      <ul className="mt-1 ml-4 list-disc">
                        {website.dns.mx.map((record, index) => (
                          <li key={index}>
                            {record.exchange} (Priority: {record.priority})
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4">Status History:</h3>
          <HexGrid url={website.url} />
        </div>
      </CardContent>
    </Card>
  )
}