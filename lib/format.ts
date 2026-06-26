export function formatINR(value: number, opts?: { compact?: boolean }): string {
  if (!isFinite(value)) return "₹0"
  if (opts?.compact) {
    const abs = Math.abs(value)
    if (abs >= 1_00_00_000) return `₹${(value / 1_00_00_000).toFixed(2)} Cr`
    if (abs >= 1_00_000) return `₹${(value / 1_00_000).toFixed(2)} L`
    if (abs >= 1_000) return `₹${(value / 1_000).toFixed(1)}K`
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatPercent(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`
}

export function formatMonth(month: string): string {
  const [y, m] = month.split("-")
  const date = new Date(Number(y), Number(m) - 1, 1)
  return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" })
}
