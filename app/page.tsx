// dashboard/page.tsx
"use client"

import { useMemo, useState } from "react"
import {
  Wallet,
  TrendingUp,
  ShieldCheck,
  PiggyBank,
  PercentCircle,
  Pencil,
  Check,
  X,
  Landmark,
} from "lucide-react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts"
import { CATEGORY_LABELS, type InvestmentCategory } from "@/lib/db"
import { useGoals, useInvestments, usePurchases, useSettings, useSnapshots, updateSettings } from "@/lib/hooks"
import { formatINR, formatMonth, formatPercent } from "@/lib/format"
import { PageHeader, StatCard, SectionCard, CHART_COLORS } from "@/components/finance/primitives"
import { MoneyTooltip } from "@/components/finance/chart-tooltip"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

// ── Inline-editable stat card ─────────────────────────────────────────────────
function EditableStatCard({
  label,
  value,
  savedValue,
  icon: Icon,
  accent,
  hint,
  onSave,
}: {
  label: string
  value: string
  savedValue: number
  icon: React.ElementType
  accent?: string
  hint?: string
  onSave: (v: number) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(0)

  function startEdit() {
    setDraft(savedValue)
    setEditing(true)
  }

  function confirm() {
    onSave(draft)
    setEditing(false)
  }

  function cancel() {
    setEditing(false)
  }

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="flex items-center gap-1">
          {editing ? (
            <>
              <Button variant="ghost" size="icon" className="size-6" onClick={confirm}>
                <Check className="size-3.5 text-chart-1" />
              </Button>
              <Button variant="ghost" size="icon" className="size-6" onClick={cancel}>
                <X className="size-3.5 text-destructive" />
              </Button>
            </>
          ) : (
            <Button variant="ghost" size="icon" className="size-6" onClick={startEdit}>
              <Pencil className="size-3.5 text-muted-foreground" />
            </Button>
          )}
          <div className="rounded-md bg-accent p-1.5">
            <Icon className={`size-4 ${accent ?? "text-muted-foreground"}`} />
          </div>
        </div>
      </div>
      {editing ? (
        <Input
          type="number"
          value={draft}
          onChange={(e) => setDraft(Number(e.target.value))}
          onKeyDown={(e) => { if (e.key === "Enter") confirm(); if (e.key === "Escape") cancel() }}
          className="mt-2 h-8 text-lg font-bold"
          autoFocus
        />
      ) : (
        <p className={`mt-1 text-2xl font-bold tabular-nums ${accent ?? ""}`}>{value}</p>
      )}
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const investments = useInvestments()
  const goals = useGoals()
  const purchases = usePurchases()          // ← unified purchases table
  const snapshots = useSnapshots()
  const settings = useSettings()

  // ── Core numbers ────────────────────────────────────────────────────────────
  const currentMonth = new Date().toISOString().slice(0, 7)

  const investmentsTotal = investments.reduce((a, i) => a + i.current, 0)

  // expenses = current month's purchases only
  const monthlyExpenses = useMemo(
    () => purchases
      .filter((p) => p.date.slice(0, 7) === currentMonth)
      .reduce((a, p) => a + p.amount, 0),
    [purchases, currentMonth],
  )

  const bankBalance = settings.bankBalance ?? 0
  const netWorth = investmentsTotal + settings.pfBalance + settings.emergencyFund + bankBalance
  const monthlySavings = settings.monthlyIncome - monthlyExpenses
  const savingsRate = settings.monthlyIncome > 0 ? (monthlySavings / settings.monthlyIncome) * 100 : 0

  // ── Charts ───────────────────────────────────────────────────────────────────
  const allocation = useMemo(() => {
    const map = new Map<InvestmentCategory, number>()
    for (const inv of investments) map.set(inv.category, (map.get(inv.category) ?? 0) + inv.current)
    return Array.from(map.entries())
      .map(([cat, value]) => ({ name: CATEGORY_LABELS[cat], value }))
      .filter((d) => d.value > 0)
  }, [investments])

  const marketCap = useMemo(() => {
    const order: InvestmentCategory[] = ["large", "flexi", "mid", "small", "gold", "debt"]
    return order.map((cat) => ({
      name: CATEGORY_LABELS[cat],
      value: investments.filter((i) => i.category === cat).reduce((a, i) => a + i.current, 0),
    })).filter((d) => d.value > 0)
  }, [investments])

  const goalProgress = useMemo(
    () => goals.map((g) => ({
      name: g.name,
      current: g.current,
      remaining: Math.max(0, g.target - g.current),
    })),
    [goals],
  )

  const cashFlow = [
    { name: "Income",   value: settings.monthlyIncome },
    { name: "Expenses", value: monthlyExpenses },
    { name: "Savings",  value: Math.max(0, monthlySavings) },
  ]

  const netWorthHistory = snapshots.map((s) => ({
    month: formatMonth(s.month),
    netWorth: s.netWorth,
    investments: s.investments,
  }))

  // ── Net Worth breakdown for pie ──────────────────────────────────────────────
  const nwBreakdown = [
    { name: "Investments",     value: investmentsTotal },
    { name: "PF",              value: settings.pfBalance },
    { name: "Emergency Fund",  value: settings.emergencyFund },
    { name: "Bank Balance",    value: bankBalance },
  ].filter((d) => d.value > 0)

  return (
    <div>
      <PageHeader title="Dashboard" description="A complete snapshot of your financial health." />

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {/* Net Worth — read-only, computed */}
        <div className="rounded-xl border bg-card p-4 shadow-sm sm:col-span-2 lg:col-span-1 xl:col-span-2">
          <p className="text-sm text-muted-foreground">Net Worth</p>
          <p className="mt-1 text-3xl font-bold tabular-nums">  ₹{(netWorth ?? 0).toLocaleString("en-IN")}</p>
          <p className="mt-1 text-xs text-muted-foreground">Investments + PF + Emergency + Bank</p>
        </div>

        {/* Investments — read-only */}
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <p className="text-sm text-muted-foreground">Investments</p>
            <div className="rounded-md bg-accent p-1.5">
              <TrendingUp className="size-4 text-chart-1" />
            </div>
          </div>
          <p className="mt-1 text-2xl font-bold tabular-nums text-chart-1">{formatINR(investmentsTotal, { compact: true })}</p>
          <p className="mt-1 text-xs text-muted-foreground">{investments.length} funds</p>
        </div>

        {/* PF — read-only */}
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <p className="text-sm text-muted-foreground">PF Balance</p>
            <div className="rounded-md bg-accent p-1.5">
              <PiggyBank className="size-4 text-chart-3" />
            </div>
          </div>
          <p className="mt-1 text-2xl font-bold tabular-nums text-chart-3">{formatINR(settings.pfBalance, { compact: true })}</p>
          <p className="mt-1 text-xs text-muted-foreground">+{formatINR(settings.pfMonthly, { compact: true })}/mo</p>
        </div>

        {/* Emergency Fund — editable */}
        <EditableStatCard
          label="Emergency Fund"
          value={formatINR(settings.emergencyFund, { compact: true })}
          savedValue={settings.emergencyFund}
          icon={ShieldCheck}
          accent="text-chart-2"
          hint={`${(settings.emergencyFund / (monthlyExpenses || 1)).toFixed(1)} months cover`}
          onSave={(v) => updateSettings({ emergencyFund: v })}
        />

        {/* Bank Balance — editable */}
        <EditableStatCard
          label="Bank Balance"
          value={formatINR(bankBalance, { compact: true })}
          savedValue={bankBalance}
          icon={Landmark}
          accent="text-chart-4"
          hint="Savings / current accounts"
          onSave={(v) => updateSettings({ bankBalance: v })}
        />

        {/* Savings Rate */}
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <p className="text-sm text-muted-foreground">Savings Rate</p>
            <div className="rounded-md bg-accent p-1.5">
              <PercentCircle className="size-4 text-chart-5" />
            </div>
          </div>
          <p className="mt-1 text-2xl font-bold tabular-nums text-chart-5">{formatPercent(savingsRate)}</p>
          <p className="mt-1 text-xs text-muted-foreground">{formatINR(monthlySavings, { compact: true })}/mo saved · {currentMonth}</p>
        </div>
      </div>

      {/* ── Charts ── */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard title="Net Worth History" description="Trend across recent months">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={netWorthHistory} margin={{ left: -10, right: 8, top: 8 }}>
              <defs>
                <linearGradient id="nw" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="inv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-3)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="var(--chart-3)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} stroke="var(--muted-foreground)" />
              <YAxis tickFormatter={(v) => formatINR(v, { compact: true })} tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" width={60} />
              <Tooltip content={<MoneyTooltip />} />
              <Area type="monotone" dataKey="netWorth" name="Net Worth" stroke="var(--chart-1)" strokeWidth={2} fill="url(#nw)" />
              <Area type="monotone" dataKey="investments" name="Investments" stroke="var(--chart-3)" strokeWidth={2} fill="url(#inv)" />
            </AreaChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard title="Net Worth Breakdown" description="What makes up your net worth today">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={nwBreakdown} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={2}>
                {nwBreakdown.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="var(--background)" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip content={<MoneyTooltip />} />
              <Legend iconType="circle" formatter={(v) => <span className="text-xs text-muted-foreground">{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard title="Monthly Cash Flow" description={`Income vs expenses vs savings · ${currentMonth}`}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={cashFlow} margin={{ left: -10, right: 8, top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} stroke="var(--muted-foreground)" />
              <YAxis tickFormatter={(v) => formatINR(v, { compact: true })} tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" width={60} />
              <Tooltip content={<MoneyTooltip />} cursor={{ fill: "var(--accent)", opacity: 0.4 }} />
              <Bar dataKey="value" name="Amount" radius={[6, 6, 0, 0]}>
                {cashFlow.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard title="Asset Allocation" description="Mutual fund current value by category">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={allocation} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={2}>
                {allocation.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="var(--background)" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip content={<MoneyTooltip />} />
              <Legend iconType="circle" formatter={(v) => <span className="text-xs text-muted-foreground">{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard title="Market Cap Allocation" description="Equity exposure by cap size">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={marketCap} layout="vertical" margin={{ left: 10, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" tickFormatter={(v) => formatINR(v, { compact: true })} tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" />
              <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} fontSize={12} stroke="var(--muted-foreground)" width={70} />
              <Tooltip content={<MoneyTooltip />} cursor={{ fill: "var(--accent)", opacity: 0.4 }} />
              <Bar dataKey="value" name="Value" radius={[0, 6, 6, 0]}>
                {marketCap.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard title="Goal Progress" description="Saved vs remaining per goal" 
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={goalProgress} margin={{ left: -10, right: 8, top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} stroke="var(--muted-foreground)" />
              <YAxis tickFormatter={(v) => formatINR(v, { compact: true })} tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" width={60} />
              <Tooltip content={<MoneyTooltip />} cursor={{ fill: "var(--accent)", opacity: 0.4 }} />
              <Legend iconType="circle" formatter={(v) => <span className="text-xs text-muted-foreground">{v}</span>} />
              <Bar dataKey="current" name="Saved" stackId="g" fill="var(--chart-1)" />
              <Bar dataKey="remaining" name="Remaining" stackId="g" fill="var(--muted)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>
      </div>

      {/*
      ══════════════════════════════════════════════════════════════════
      OLD DASHBOARD (pre-refactor) — uncomment to revert
      ══════════════════════════════════════════════════════════════════

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Net Worth" value={formatINR(netWorth, { compact: true })} icon={Wallet} hint="Investments + PF + Emergency" />
        <StatCard label="Investments" value={formatINR(investmentsTotal, { compact: true })} icon={TrendingUp} accent="text-chart-1" hint={`${investments.length} funds`} />
        <StatCard label="Emergency Fund" value={formatINR(settings.emergencyFund, { compact: true })} icon={ShieldCheck} accent="text-chart-2" hint={`${(settings.emergencyFund / (monthlyExpenses || 1)).toFixed(1)} months cover`} />
        <StatCard label="PF Balance" value={formatINR(settings.pfBalance, { compact: true })} icon={PiggyBank} accent="text-chart-3" hint={`+${formatINR(settings.pfMonthly, { compact: true })}/mo`} />
        <StatCard label="Savings Rate" value={formatPercent(savingsRate)} icon={PercentCircle} accent="text-chart-4" hint={`${formatINR(monthlySavings, { compact: true })}/mo saved`} />
      </div>

      ══════════════════════════════════════════════════════════════════
      */}
    </div>
  )
}