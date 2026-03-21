"use client"

import { fmtTimeShort } from '@/lib/utils'
import { generateSuggestions } from '@/lib/mockData'
import { Button } from '@/components/ui/button'

export function ConversationCard({
  clientName,
  lastMessage,
  timestamp,
}: {
  clientName: string
  lastMessage: string
  timestamp: string
}) {
  const suggestions = generateSuggestions(lastMessage)

  return (
    <div className="card p-3">
      <div className="flex items-center justify-between mb-1">
        <div className="font-medium text-sm">{clientName}</div>
        <div className="text-xs text-gray-500">{fmtTimeShort(timestamp)}</div>
      </div>
      <div className="text-sm text-gray-700 truncate">
        {lastMessage}
      </div>
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
        {suggestions.map((sug, i) => (
          <Button key={i} variant="outline" size="sm" className="truncate" onClick={() => {}}>
            {sug}
          </Button>
        ))}
      </div>
      <div className="mt-3">
        <input
          type="text"
          placeholder="Responder..."
          className="w-full h-9 rounded-md border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  )
}
