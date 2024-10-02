'use client'

import React, { useState, useEffect } from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

type StatusHistoryItem = {
  status: 'up' | 'down'
  timestamp: string
}

type HexGridProps = {
  url: string
}

const HexGrid: React.FC<HexGridProps> = ({ url }) => {
  const [statusHistory, setStatusHistory] = useState<StatusHistoryItem[]>([])

  useEffect(() => {
    const fetchStatusHistory = async () => {
      try {
        const response = await fetch(`/api/status-history?url=${encodeURIComponent(url)}`)
        if (response.ok) {
          const data = await response.json()
          setStatusHistory(data)
        }
      } catch (error) {
        console.error('Error fetching status history:', error)
      }
    }

    fetchStatusHistory()
  }, [url])

  const honeycombRows = [6, 7, 6]

  return (
    <div className="flex flex-col items-center">
      {honeycombRows.map((hexCount, rowIndex) => (
        <div key={rowIndex} className={`flex ${rowIndex % 2 === 0 ? '' : 'ml-1'}`}>
          {[...Array(hexCount)].map((_, index) => {
            const historyIndex = rowIndex * 6 + index
            const item = statusHistory[historyIndex]
            return (
              <TooltipProvider key={index}>
                <Tooltip>
                  <TooltipTrigger>
                    <div
                      className={`w-6 h-7 mx-1 ${
                        item ? (item.status === 'up' ? 'bg-green-500' : 'bg-red-500') : 'bg-gray-300'
                      }`}
                      style={{
                        clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
                      }}
                    />
                  </TooltipTrigger>
                  {item && (
                    <TooltipContent>
                      <p>{new Date(item.timestamp).toLocaleString()} - {item.status === 'up' ? 'Online' : 'Offline'}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            )
          })}
        </div>
      ))}
    </div>
  )
}

export default HexGrid