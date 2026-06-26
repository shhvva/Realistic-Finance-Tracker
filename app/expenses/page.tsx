"use client"

import { useMemo, useState } from "react"
import { Plus, Pencil, Trash2, Receipt, PiggyBank, ShoppingBag, TrendingDown } from "lucide-react"
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"
import { db, type Purchase, DEFAULT_EXPENSE_CATEGORIES, normCategory, canonicalizeCategory } from "@/lib/db"
import { usePurchases, useSettings, updateSettings } from "@/lib/hooks"
import { formatINR, formatPercent } from "@/lib/format"
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

const empty: Omit<Purchase, "id"> = {
  label: "",
  category: "",
  amount: 0,
  date: new Date().toISOString().slice(0, 10),
}

export default function ExpensesPage() {
  const expenses = usePurchases()
  const settings = useSettings()

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Purchase | null>(null)
  const [form, setForm] = useState<Omit<Purchase, "id">>(empty)

  // month selector for breakdown + table filter
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7))

  // derive category options from logged expenses + defaults
  const categoryOptions = useMemo(() => {
    const seen = new Map<string, string>()
    for (const c of DEFAULT_EXPENSE_CATEGORIES) seen.set(normCategory(c), c)
    for (const e of expenses) if (!seen.has(normCategory(e.category))) seen.set(normCategory(e.category), e.category)
    return Array.from(seen.values())
  }, [expenses])

  // expenses for the selected month
  const monthExpenses = useMemo(
    () => expenses.filter((e) => e.date.slice(0, 7) === selectedMonth),
    [expenses, selectedMonth],
  )

  const monthTotal = monthExpenses.reduce((a, e) => a + e.amount, 0)
  const monthlySavings = settings.monthlyIncome - monthTotal
  const savingsRate = settings.monthlyIncome > 0 ? (monthlySavings / settings.monthlyIncome) * 100 : 0

  // category breakdown for pie
  const categoryBreakdown = useMemo(() => {
    const totals = new Map<string, { name: string; value: number }>()
    for (const e of monthExpenses) {
      const key = normCategory(e.category)
      const cur = totals.get(key) ?? { name: e.category, value: 0 }
      cur.value += e.amount
      totals.set(key, cur)
    }
    return Array.from(totals.values())
      .filter((t) => t.value > 0)
      .sort((a, b) => b.value - a.value)
  }, [monthExpenses])

  // --- CRUD ---
  function openAdd() {
    setEditing(null)
    setForm({ ...empty, date: new Date().toISOString().slice(0, 10) })
    setOpen(true)
  }

  function openEdit(e: Purchase) {
    setEditing(e)
    const { id, ...rest } = e
    setForm(rest)
    setOpen(true)
  }

  async function save() {
    if (!form.label.trim()) return toast.error("Name is required")
    if (!form.category.trim()) return toast.error("Category is required")
    if (!form.amount || form.amount <= 0) return toast.error("Enter a valid amount")
    const payload = { ...form, category: canonicalizeCategory(form.category, categoryOptions) }
    if (editing?.id) {
      await db.purchases.update(editing.id, payload)
      toast.success("Expense updated")
    } else {
      await db.purchases.add(payload)
      toast.success("Expense added")
    }
    setOpen(false)
  }

  async function remove(e: Purchase) {
    if (e.id) {
      await db.purchases.delete(e.id)
      toast.success("Expense deleted")
    }
  }

  return (
    <div>
      <datalist id="expense-categories">
        {categoryOptions.map((c) => <option key={c} value={c} />)}
      </datalist>

      <PageHeader title="Expenses" description="Log and review every expense.">
        <Button onClick={openAdd}>
          <Plus className="size-4" /> Add Expense
        </Button>
      </PageHeader>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Spent This Month"
          value={formatINR(monthTotal, { compact: true })}
          icon={Receipt}
        />
        <StatCard
          label="Entries This Month"
          value={`${monthExpenses.length}`}
          icon={ShoppingBag}
          accent="text-chart-3"
        />
        <StatCard
          label="Monthly Savings"
          value={formatINR(monthlySavings, { compact: true })}
          icon={PiggyBank}
          accent={monthlySavings >= 0 ? "text-chart-1" : "text-destructive"}
        />
        <StatCard
          label="Savings Rate"
          value={formatPercent(savingsRate)}
          icon={TrendingDown}
          accent="text-chart-4"
        />
      </div>

      {/* ── Month selector + breakdown + table share the same month ── */}
      <SectionCard
        title="Category Breakdown"
        description="Spending by category for the selected month"
        className="mt-6"
        action={
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-accent px-3 py-1.5 text-right">
              <p className="text-xs text-accent-foreground">Monthly Income</p>
              <Input
                type="number"
                value={settings.monthlyIncome}
                onChange={(e) => updateSettings({ monthlyIncome: Number(e.target.value) })}
                className="h-7 w-32 border-0 bg-transparent p-0 text-right text-sm font-semibold focus-visible:ring-0"
              />
            </div>
            <Input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="h-8 w-40"
            />
          </div>
        }
      >
        {categoryBreakdown.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No expenses logged for this month.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={categoryBreakdown}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={95}
                  paddingAngle={2}
                >
                  {categoryBreakdown.map((_, i) => (
                    <Cell
                      key={i}
                      fill={CHART_COLORS[i % CHART_COLORS.length]}
                      stroke="var(--background)"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip content={<MoneyTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            <div className="flex flex-col justify-center gap-2">
              {categoryBreakdown.map((c, i) => (
                <div key={c.name} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                    />
                    {c.name}
                  </span>
                  <span className="tabular-nums text-muted-foreground">
                    {formatINR(c.value, { compact: true })} ·{" "}
                    {monthTotal ? ((c.value / monthTotal) * 100).toFixed(0) : 0}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </SectionCard>

      {/* ── Expenses log ── */}
      <SectionCard
        title="Expenses"
        description={`${monthExpenses.length} entries for this month`}
        className="mt-6"
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monthExpenses.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="text-muted-foreground">{e.date}</TableCell>
                  <TableCell className="font-medium">{e.label}</TableCell>
                  <TableCell>{e.category}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatINR(e.amount)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(e)} aria-label="Edit">
                        <Pencil className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => remove(e)} aria-label="Delete">
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {monthExpenses.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    No expenses for this month yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </SectionCard>

      {/* ── Add / Edit dialog ── */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Expense" : "Add Expense"}</DialogTitle>
            <DialogDescription>
              Log an expense with a name, category, amount, and date.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="label">Name</Label>
              <Input
                id="label"
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="e.g. California burrito"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cat">Category</Label>
              <Input
                id="cat"
                list="expense-categories"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="e.g. Food"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={form.amount || ""}
                  onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editing ? "Save Changes" : "Add Expense"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}