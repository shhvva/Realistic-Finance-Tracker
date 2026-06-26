"use client"

import { formatINR } from "@/lib/format"

export function MoneyTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
      {label != null && <p className="mb-1 font-medium text-popover-foreground">{label}</p>}
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-muted-foreground">
          <span className="size-2 rounded-full" style={{ background: entry.color || entry.payload?.fill }} />
          <span>{entry.name}:</span>
          <span className="font-medium text-popover-foreground">{formatINR(entry.value, { compact: true })}</span>
        </div>
      ))}
    </div>
  )
}

export function PercentTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
      {label != null && <p className="mb-1 font-medium text-popover-foreground">{label}</p>}
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-muted-foreground">
          <span className="size-2 rounded-full" style={{ background: entry.color || entry.payload?.fill }} />
          <span>{entry.name}:</span>
          <span className="font-medium text-popover-foreground">{entry.value.toFixed(1)}%</span>
        </div>
      ))}
    </div>
  )
}
