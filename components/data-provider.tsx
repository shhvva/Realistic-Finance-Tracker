"use client"

import { useEffect, useState } from "react"
import { ensureSeed } from "@/lib/db"

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    ensureSeed().finally(() => setReady(true))
  }, [])

  if (!ready) {
    return (
      <div className="flex h-svh items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
          <p className="text-sm text-muted-foreground">Loading your finances…</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
