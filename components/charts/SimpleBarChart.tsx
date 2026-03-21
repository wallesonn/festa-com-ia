"use client"

export function SimpleBarChart({ labels, values, max }: { labels: string[]; values: number[]; max?: number }) {
  const computedMax = max ?? Math.max(1, ...values)
  return (
    <div className="w-full">
      <div className="flex items-end gap-2 h-40">
        {values.map((v, i) => {
          const pct = Math.round((v / computedMax) * 100)
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full bg-primary/30 rounded-t-md" style={{ height: `${pct}%` }}>
                <div className="w-full h-full bg-primary rounded-t-md" style={{ height: '100%' }} />
              </div>
              <div className="text-xs text-gray-300 truncate w-full text-center">{labels[i]}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
