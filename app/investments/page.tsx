"use client"

import { useMemo, useState } from "react"
import { Plus, Pencil, Trash2, TrendingUp, TrendingDown, Wallet, Banknote } from "lucide-react"
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts"
import { db, CATEGORY_LABELS, type Investment, type InvestmentCategory } from "@/lib/db"
import { useInvestments } from "@/lib/hooks"
import { formatINR, formatPercent } from "@/lib/format"
import { PageHeader, SectionCard, StatCard, CHART_COLORS } from "@/components/finance/primitives"
import { MoneyTooltip } from "@/components/finance/chart-tooltip"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"

const CATEGORIES = Object.keys(CATEGORY_LABELS) as InvestmentCategory[]

const empty: Omit<Investment, "id"> = {
  name: "",
  category: "large",
  sip: 0,
  invested: 0,
  current: 0,
  xirr: 0,
}

export default function InvestmentsPage() {
  const investments = useInvestments()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Investment | null>(null)
  const [form, setForm] = useState<Omit<Investment, "id">>(empty)

  const totals = useMemo(() => {
    const invested = investments.reduce((a, i) => a + i.invested, 0)
    const current = investments.reduce((a, i) => a + i.current, 0)
    const sip = investments.reduce((a, i) => a + i.sip, 0)
    return { invested, current, sip, gain: current - invested }
  }, [investments])

  const allocation = useMemo(() => {
    const map = new Map<InvestmentCategory, number>()
    for (const inv of investments) map.set(inv.category, (map.get(inv.category) ?? 0) + inv.current)
    return Array.from(map.entries()).map(([cat, value]) => ({ name: CATEGORY_LABELS[cat], value }))
  }, [investments])

  const sipAllocation = useMemo(
    () =>
      investments
        .filter((i) => i.sip > 0)
        .map((i) => ({ name: i.name, value: i.sip }))
        .sort((a, b) => b.value - a.value),
    [investments],
  )

  // Custom sort for the table
  const sortedInvestments = useMemo(() => {
    const sortOrder: Record<string, number> = {
      large: 1,
      flexi: 2,
      mid: 3,
      small: 4,
      gold: 5,
    }

    return [...investments].sort((a, b) => {
      // If a category isn't in the sortOrder map, give it a high number so it falls into "Rest" at the bottom
      const orderA = sortOrder[a.category] || 99
      const orderB = sortOrder[b.category] || 99
      return orderA - orderB
    })
  }, [investments])

  function openAdd() {
    setEditing(null)
    setForm(empty)
    setOpen(true)
  }

  function openEdit(inv: Investment) {
    setEditing(inv)
    const { id, ...rest } = inv
    setForm(rest)
    setOpen(true)
  }

  async function save() {
    if (!form.name.trim()) {
      toast.error("Name is required")
      return
    }
    if (editing?.id) {
      await db.investments.update(editing.id, form)
      toast.success("Investment updated")
    } else {
      await db.investments.add(form)
      toast.success("Investment added")
    }
    setOpen(false)
  }

  async function remove(inv: Investment) {
    if (inv.id) {
      await db.investments.delete(inv.id)
      toast.success("Investment deleted")
    }
  }

  return (
    <div>
      <PageHeader title="Investments" description="Manage your mutual fund and asset portfolio.">
        <Button onClick={openAdd}>
          <Plus className="size-4" /> Add Investment
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Current Value" value={formatINR(totals.current, { compact: true })} icon={Wallet} />
        <StatCard label="Invested" value={formatINR(totals.invested, { compact: true })} icon={Banknote} accent="text-chart-3" />
        <StatCard
          label="Total Gain"
          value={formatINR(totals.gain, { compact: true })}
          icon={totals.gain >= 0 ? TrendingUp : TrendingDown}
          accent={totals.gain >= 0 ? "text-chart-1" : "text-destructive"}
          hint={totals.invested ? formatPercent((totals.gain / totals.invested) * 100) + " return" : undefined}
        />
        <StatCard label="Monthly SIP" value={formatINR(totals.sip, { compact: true })} icon={TrendingUp} accent="text-chart-4" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard title="Portfolio Allocation" description="Current value by category">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={allocation} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={2}>
                {allocation.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="var(--background)" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip content={<MoneyTooltip />} />
              <Legend iconType="circle" formatter={(v) => <span className="text-xs text-muted-foreground">{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard title="SIP Allocation" description="Monthly contribution per fund">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={sipAllocation} layout="vertical" margin={{ left: 10, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" tickFormatter={(v) => formatINR(v, { compact: true })} tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" />
              <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" width={120} />
              <Tooltip content={<MoneyTooltip />} cursor={{ fill: "var(--accent)", opacity: 0.4 }} />
              <Bar dataKey="value" name="SIP" radius={[0, 6, 6, 0]}>
                {sipAllocation.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>
      </div>

      <SectionCard title="Holdings" description={`${investments.length} investments`} className="mt-6">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">SIP</TableHead>
                <TableHead className="text-right">Invested</TableHead>
                <TableHead className="text-right">Current</TableHead>
                <TableHead className="text-right">Portfolio %</TableHead>
                <TableHead className="text-right">Gain</TableHead>
                <TableHead className="text-right">XIRR</TableHead>
                <TableHead className="text-right">SIP %</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedInvestments.map((inv) => {
                const gain = inv.current - inv.invested

                const currentPercent =
                  totals.current > 0
                    ? (inv.current / totals.current) * 100
                    : 0

                const sipPercent =
                  totals.sip > 0
                    ? (inv.sip / totals.sip) * 100
                    : 0

                return (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">{inv.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{CATEGORY_LABELS[inv.category]}</Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatINR(inv.sip)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatINR(inv.invested)}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{formatINR(inv.current)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {currentPercent.toFixed(1)}%
                    </TableCell>
                    <TableCell className={`text-right tabular-nums ${gain >= 0 ? "text-chart-1" : "text-destructive"}`}>
                      {formatINR(gain)}
                    </TableCell>
                    <TableCell className={`text-right tabular-nums ${inv.xirr >= 0 ? "text-chart-1" : "text-destructive"}`}>
                      {formatPercent(inv.xirr)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {inv.sip > 0 ? `${sipPercent.toFixed(1)}%` : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(inv)} aria-label="Edit">
                          <Pencil className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => remove(inv)} aria-label="Delete">
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
              {sortedInvestments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="py-8 text-center text-muted-foreground">
                    No investments yet. Add your first holding.
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
            <DialogTitle>{editing ? "Edit Investment" : "Add Investment"}</DialogTitle>
            <DialogDescription>Enter the details of your investment holding.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Axis Bluechip Fund" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as InvestmentCategory })}>
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {CATEGORY_LABELS[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="sip">Monthly SIP (₹)</Label>
                <Input id="sip" type="number" value={form.sip || ""} onChange={(e) => setForm({ ...form, sip: Number(e.target.value) })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="xirr">XIRR (%)</Label>
                <Input id="xirr" type="number" value={form.xirr || ""} onChange={(e) => setForm({ ...form, xirr: Number(e.target.value) })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="invested">Invested (₹)</Label>
                <Input id="invested" type="number" value={form.invested || ""} onChange={(e) => setForm({ ...form, invested: Number(e.target.value) })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="current">Current Value (₹)</Label>
                <Input id="current" type="number" value={form.current || ""} onChange={(e) => setForm({ ...form, current: Number(e.target.value) })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save}>{editing ? "Save Changes" : "Add Investment"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}