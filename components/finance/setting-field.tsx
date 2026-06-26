"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function SettingField({
  label,
  value,
  onChange,
  suffix,
  step,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  suffix?: string
  step?: number
}) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="relative">
        <Input
          type="number"
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="pr-10 tabular-nums"
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
    </div>
  )
}
