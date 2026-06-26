// reports/page.tsx

"use client"

import { useMemo, useState } from "react"
import { CameraIcon, Trash2, TrendingUp, Wallet, PiggyBank, CalendarPlus } from "lucide-react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { db, normCategory } from "@/lib/db"
import { useInvestments, usePurchases, useSettings, useSnapshots } from "@/lib/hooks"
import { formatINR, formatMonth } from "@/lib/format"
import { PageHeader, SectionCard, StatCard, CHART_COLORS } from "@/components/finance/primitives"
import { MoneyTooltip } from "@/components/finance/chart-tooltip"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"

export default function ReportsPage() {
  const snapshots = useSnapshots()
  const investments = useInvestments()
  const purchases = usePurchases()
  const settings = useSettings()

  const investmentsTotal = investments.reduce((a, i) => a + i.current, 0)
  const monthlyExpenses = purchases.reduce((a, p) => a + p.amount, 0)
  const netWorth = investmentsTotal + settings.pfBalance + settings.emergencyFund
  const monthlySavings = settings.monthlyIncome - monthlyExpenses

  const chartData = useMemo(
    () =>
      snapshots.map((s) => ({
        month: formatMonth(s.month),
        "Net Worth": s.netWorth,
        Investments: s.investments,
        Savings: s.savings,
        Expenses: s.expenses,
      })),
    [snapshots],
  )

  const latest = snapshots[snapshots.length - 1]
  const first = snapshots[0]
  const nwGrowth = first && latest ? ((latest.netWorth - first.netWorth) / first.netWorth) * 100 : 0

  const [breakdownMonth, setBreakdownMonth] = useState(() => new Date().toISOString().slice(0, 7))

  const categoryBreakdown = useMemo(() => {
    const totals = new Map<string, { name: string; value: number }>()
    for (const p of purchases) {
      if (p.date.slice(0, 7) !== breakdownMonth) continue
      const key = normCategory(p.category)
      const cur = totals.get(key) ?? { name: p.category, value: 0 }
      cur.value += p.amount
      totals.set(key, cur)
    }
    return Array.from(totals.values())
      .filter((t) => t.value > 0)
      .sort((a, b) => b.value - a.value)
  }, [purchases, breakdownMonth])

  const breakdownTotal = categoryBreakdown.reduce((a, c) => a + c.value, 0)

  async function captureSnapshot() {
    const month = new Date().toISOString().slice(0, 7)
    const existing = await db.snapshots.where("month").equals(month).first()
    const payload = {
      month,
      netWorth,
      investments: investmentsTotal,
      savings: Math.max(0, monthlySavings),
      expenses: monthlyExpenses,
    }
    if (existing?.id) {
      await db.snapshots.update(existing.id, payload)
      toast.success(`Snapshot for ${formatMonth(month)} updated`)
    } else {
      await db.snapshots.add(payload)
      toast.success(`Snapshot for ${formatMonth(month)} captured`)
    }
  }

  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    month: new Date().toISOString().slice(0, 7),
    netWorth: 0,
    investments: 0,
    savings: 0,
    expenses: 0,
  })

  function openSnapshotDialog() {
    const month = new Date().toISOString().slice(0, 7)
    const existing = snapshots.find((s) => s.month === month)
    setForm(
      existing ?? {
        month,
        netWorth,
        investments: investmentsTotal,
        savings: Math.max(0, monthlySavings),
        expenses: monthlyExpenses,
      },
    )
    setOpen(true)
  }

  function onMonthChange(month: string) {
    const existing = snapshots.find((s) => s.month === month)
    setForm(existing ?? { month, netWorth: 0, investments: 0, savings: 0, expenses: 0 })
  }

  async function saveSnapshotForm() {
    if (!form.month) return toast.error("Pick a month")
    const existing = await db.snapshots.where("month").equals(form.month).first()
    const payload = { month: form.month, netWorth: form.netWorth, investments: form.investments, savings: form.savings, expenses: form.expenses }
    if (existing?.id) {
      await db.snapshots.update(existing.id, payload)
      toast.success(`Snapshot for ${formatMonth(form.month)} updated`)
    } else {
      await db.snapshots.add(payload)
      toast.success(`Snapshot for ${formatMonth(form.month)} added`)
    }
    setOpen(false)
  }

  async function removeSnapshot(id?: number) {
    if (id) {
      await db.snapshots.delete(id)
      toast.success("Snapshot deleted")
    }
  }

  return (
    <div>
      <PageHeader title="Reports" description="Monthly snapshots and historical trends.">
        <Button variant="outline" onClick={openSnapshotDialog}>
          <CalendarPlus className="size-4" /> Add / Edit Month
        </Button>
        <Button onClick={captureSnapshot}>
          <CameraIcon className="size-4" /> Quick Capture (this month)
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Current Net Worth" value={formatINR(netWorth, { compact: true })} icon={Wallet} />
        <StatCard label="Net Worth Growth" value={`${nwGrowth >= 0 ? "+" : ""}${nwGrowth.toFixed(1)}%`} icon={TrendingUp} accent={nwGrowth >= 0 ? "text-chart-1" : "text-destructive"} hint="since first snapshot" />
        <StatCard label="Snapshots Logged" value={`${snapshots.length}`} icon={CameraIcon} accent="text-chart-3" />
        <StatCard label="Avg Monthly Savings" value={formatINR(snapshots.length ? snapshots.reduce((a, s) => a + s.savings, 0) / snapshots.length : 0, { compact: true })} icon={PiggyBank} accent="text-chart-4" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard title="Net Worth History" description="Net worth and investments over time">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData} margin={{ left: -4, right: 8, top: 8 }}>
              <defs>
                <linearGradient id="rnw" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" />
              <YAxis tickFormatter={(v) => formatINR(v, { compact: true })} tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" width={56} />
              <Tooltip content={<MoneyTooltip />} />
              <Legend iconType="circle" formatter={(v) => <span className="text-xs text-muted-foreground">{v}</span>} />
              <Area type="monotone" dataKey="Net Worth" stroke="var(--chart-1)" strokeWidth={2} fill="url(#rnw)" />
              <Line type="monotone" dataKey="Investments" stroke="var(--chart-3)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard title="Savings History" description="Monthly savings vs expenses">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ left: -4, right: 8, top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" />
              <YAxis tickFormatter={(v) => formatINR(v, { compact: true })} tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" width={56} />
              <Tooltip content={<MoneyTooltip />} cursor={{ fill: "var(--accent)", opacity: 0.4 }} />
              <Legend iconType="circle" formatter={(v) => <span className="text-xs text-muted-foreground">{v}</span>} />
              <Bar dataKey="Savings" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Expenses" fill="var(--chart-5)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>
      </div>

      <SectionCard
        title="Category Breakdown"
        description="Spending by category for the selected month"
        className="mt-6"
        action={
          <Input
            type="month"
            value={breakdownMonth}
            onChange={(e) => setBreakdownMonth(e.target.value)}
            className="h-8 w-40"
          />
        }
      >
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={categoryBreakdown} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={2}>
                {categoryBreakdown.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="var(--background)" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip content={<MoneyTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col justify-center gap-2">
            {categoryBreakdown.map((c, i) => (
              <div key={c.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                  {c.name}
                </span>
                <span className="tabular-nums text-muted-foreground">
                  {formatINR(c.value, { compact: true })} · {breakdownTotal ? ((c.value / breakdownTotal) * 100).toFixed(0) : 0}%
                </span>
              </div>
            ))}
            {categoryBreakdown.length === 0 && (
              <p className="text-sm text-muted-foreground">No spend recorded for this month.</p>
            )}
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Monthly Snapshots" description={`${snapshots.length} records`} className="mt-6">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead className="text-right">Net Worth</TableHead>
                <TableHead className="text-right">Investments</TableHead>
                <TableHead className="text-right">Savings</TableHead>
                <TableHead className="text-right">Expenses</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...snapshots].reverse().map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{formatMonth(s.month)}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">{formatINR(s.netWorth)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatINR(s.investments)}</TableCell>
                  <TableCell className="text-right tabular-nums text-chart-1">{formatINR(s.savings)}</TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">{formatINR(s.expenses)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => removeSnapshot(s.id)} aria-label="Delete">
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {snapshots.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    No snapshots yet. Capture one to start tracking history.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </SectionCard>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add / Edit Month</DialogTitle>
            <DialogDescription>
              Manually set a snapshot for any month — useful for backfilling past months. Picking a month with an existing snapshot loads it for editing.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="snap-month">Month</Label>
              <Input id="snap-month" type="month" value={form.month} onChange={(e) => onMonthChange(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="snap-nw">Net Worth (₹)</Label>
                <Input id="snap-nw" type="number" value={form.netWorth} onChange={(e) => setForm({ ...form, netWorth: Number(e.target.value) })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="snap-inv">Investments (₹)</Label>
                <Input id="snap-inv" type="number" value={form.investments} onChange={(e) => setForm({ ...form, investments: Number(e.target.value) })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="snap-sav">Savings (₹)</Label>
                <Input id="snap-sav" type="number" value={form.savings} onChange={(e) => setForm({ ...form, savings: Number(e.target.value) })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="snap-exp">Expenses (₹)</Label>
                <Input id="snap-exp" type="number" value={form.expenses} onChange={(e) => setForm({ ...form, expenses: Number(e.target.value) })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveSnapshotForm}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}