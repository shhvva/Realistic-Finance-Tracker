"use client"

import { useMemo, useState } from "react"
import { Plus, Trash2, Target, TrendingUp, Landmark, Wallet } from "lucide-react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
  ReferenceLine,
} from "recharts"
import { useSettings, updateSettings } from "@/lib/hooks"
import type { WithdrawalEvent } from "@/lib/db"
import { projectRetirement, retirementCorpusTarget } from "@/lib/finance"
import { formatINR } from "@/lib/format"
import { PageHeader, SectionCard, StatCard } from "@/components/finance/primitives"
import { MoneyTooltip } from "@/components/finance/chart-tooltip"
import { SettingField } from "@/components/finance/setting-field"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function ProjectionsPage() {
  const settings = useSettings()
  const [draft, setDraft] = useState<{ age: number; amount: number; label: string }>({
    age: settings.currentAge + 5,
    amount: 1000000,
    label: "",
  })

  const projection = useMemo(() => projectRetirement(settings), [settings])
  
  const final = projection[projection.length - 1]
  const yearsToRetire = Math.max(0, settings.retirementAge - settings.currentAge)
  const corpusTarget = retirementCorpusTarget(settings.annualExpenses, settings.inflation, yearsToRetire)

  const chartData = projection.map((p) => ({
    age: p.age,
    Corpus: p.corpus,
    "Real (today's ₹)": p.realCorpus,
    Contributions: p.contributions,
    Returns: p.returns,
  }))

  function addWithdrawal() {
    const w: WithdrawalEvent = {
      id: `w${Date.now()}`,
      age: draft.age,
      amount: draft.amount,
      label: draft.label || "Withdrawal",
    }
    updateSettings({ withdrawals: [...settings.withdrawals, w].sort((a, b) => a.age - b.age) })
    setDraft({ age: settings.currentAge + 5, amount: 1000000, label: "" })
  }

  function removeWithdrawal(id: string) {
    updateSettings({ withdrawals: settings.withdrawals.filter((w) => w.id !== id) })
  }

  const corpusReached = (final?.corpus ?? 0) >= corpusTarget

  return (
    <div>
      <PageHeader title="Projections" description="Model your path to retirement with step-ups and withdrawals." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label={`Corpus at ${settings.retirementAge}`} value={formatINR(final?.corpus ?? 0, { compact: true })} icon={Wallet} accent="text-chart-1" />
        <StatCard label="Inflation-adjusted" value={formatINR(final?.realCorpus ?? 0, { compact: true })} icon={TrendingUp} accent="text-chart-2" hint="in today's rupees" />
        <StatCard label="Target Corpus (25x)" value={formatINR(corpusTarget, { compact: true })} icon={Target} accent="text-chart-4" hint={corpusReached ? "On track" : "Shortfall"} />
        <StatCard label="Years to Retire" value={`${yearsToRetire}`} icon={Landmark} accent="text-chart-3" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* <SectionCard title="Assumptions" description="Tune your retirement plan" className="lg:col-span-1">
          <div className="grid grid-cols-2 gap-4">
            <SettingField label="Current Age" value={settings.currentAge} onChange={(v) => updateSettings({ currentAge: v })} />
            <SettingField label="Retirement Age" value={settings.retirementAge} onChange={(v) => updateSettings({ retirementAge: v })} />
            <SettingField label="Expected Return" suffix="%" step={0.5} value={settings.expectedReturn} onChange={(v) => updateSettings({ expectedReturn: v })} />
            <SettingField label="Inflation" suffix="%" step={0.5} value={settings.inflation} onChange={(v) => updateSettings({ inflation: v })} />
            <SettingField label="Annual Investment" suffix="₹" value={settings.annualInvestment} onChange={(v) => updateSettings({ annualInvestment: v })} />
            <SettingField label="Step-up" suffix="%" step={1} value={settings.stepUp} onChange={(v) => updateSettings({ stepUp: v })} />
            <div className="col-span-2">
              <SettingField label="Annual Expenses (today)" suffix="₹" value={settings.annualExpenses} onChange={(v) => updateSettings({ annualExpenses: v })} />
            </div>
          </div>
        </SectionCard> */}
        <div className="flex flex-col gap-6 lg:col-span-1">
          <SectionCard title="Assumptions" description="Tune your retirement plan">
            <div className="grid grid-cols-2 gap-4">
              <SettingField label="Current Age" value={settings.currentAge} onChange={(v) => updateSettings({ currentAge: v })} />
              <SettingField label="Retirement Age" value={settings.retirementAge} onChange={(v) => updateSettings({ retirementAge: v })} />
              <SettingField label="Expected Return" suffix="%" step={0.5} value={settings.expectedReturn} onChange={(v) => updateSettings({ expectedReturn: v })} />
              <SettingField label="Inflation" suffix="%" step={0.5} value={settings.inflation} onChange={(v) => updateSettings({ inflation: v })} />
              <SettingField label="Annual Investment" suffix="₹" value={settings.annualInvestment} onChange={(v) => updateSettings({ annualInvestment: v })} />
              <div />
              <SettingField label="Job-change Years" suffix="yrs" step={0.5} value={settings.jobChangeYears} onChange={(v) => updateSettings({ jobChangeYears: v })} />
              <SettingField label="Raise on Switch" suffix="%" step={1} value={settings.raiseOnSwitch} onChange={(v) => updateSettings({ raiseOnSwitch: v })} />
              <SettingField label="Annual Increment (staying)" suffix="%" step={0.5} value={settings.annualIncrement} onChange={(v) => updateSettings({ annualIncrement: v })} />
              <div className="col-span-2">
                <SettingField label="Annual Expenses (today)" suffix="₹" value={settings.annualExpenses} onChange={(v) => updateSettings({ annualExpenses: v })} />
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Marriage & Partner"
            description={
              settings.marriageAge > 0
                ? `Household income merges from age ${settings.marriageAge}`
                : "Set an age to model a partner's income joining the corpus"
            }
          >
            <div className="grid grid-cols-2 gap-4">
              <SettingField label="Marriage Age" value={settings.marriageAge} onChange={(v) => updateSettings({ marriageAge: v })} />
              <SettingField label="Partner Annual Investment" suffix="₹" value={settings.partnerAnnualInvestment} onChange={(v) => updateSettings({ partnerAnnualInvestment: v })} />
              <SettingField label="Partner Job-change Years" suffix="yrs" step={0.5} value={settings.partnerJobChangeYears} onChange={(v) => updateSettings({ partnerJobChangeYears: v })} />
              <SettingField label="Partner Raise on Switch" suffix="%" step={1} value={settings.partnerRaiseOnSwitch} onChange={(v) => updateSettings({ partnerRaiseOnSwitch: v })} />
              <SettingField label="Partner Annual Increment" suffix="%" step={0.5} value={settings.partnerAnnualIncrement} onChange={(v) => updateSettings({ partnerAnnualIncrement: v })} />
            </div>
          </SectionCard>
        </div>
        <SectionCard title="Retirement Corpus Projection" description="Nominal vs inflation-adjusted" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={chartData} margin={{ left: -4, right: 8, top: 8 }}>
              <defs>
                <linearGradient id="corpus" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="real" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="age" tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" />
              <YAxis tickFormatter={(v) => formatINR(v, { compact: true })} tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" width={56} />
              <Tooltip content={<MoneyTooltip />} labelFormatter={(l) => `Age ${l}`} />
              <Legend iconType="circle" formatter={(v) => <span className="text-xs text-muted-foreground">{v}</span>} />
              <ReferenceLine y={corpusTarget} stroke="var(--chart-4)" strokeDasharray="4 4" label={{ value: "Target", fontSize: 10, fill: "var(--muted-foreground)", position: "insideTopRight" }} />
              <Area type="monotone" dataKey="Corpus" stroke="var(--chart-1)" strokeWidth={2} fill="url(#corpus)" />
              <Area type="monotone" dataKey="Real (today's ₹)" stroke="var(--chart-2)" strokeWidth={2} fill="url(#real)" />
            </AreaChart>
          </ResponsiveContainer>
        </SectionCard>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <SectionCard title="Contributions vs Returns" description="What builds your corpus" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ left: -4, right: 8, top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="age" tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" />
              <YAxis tickFormatter={(v) => formatINR(v, { compact: true })} tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" width={56} />
              <Tooltip content={<MoneyTooltip />} labelFormatter={(l) => `Age ${l}`} cursor={{ fill: "var(--accent)", opacity: 0.4 }} />
              <Legend iconType="circle" formatter={(v) => <span className="text-xs text-muted-foreground">{v}</span>} />
              <Bar dataKey="Contributions" stackId="a" fill="var(--chart-3)" />
              <Bar dataKey="Returns" stackId="a" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard title="Withdrawal Events" description="One-time corpus reductions" className="lg:col-span-1">
          <div className="grid gap-2">
            {settings.withdrawals.map((w) => (
              <div key={w.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="text-sm font-medium">{w.label}</p>
                  <p className="text-xs text-muted-foreground">Age {w.age}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium tabular-nums">{formatINR(w.amount, { compact: true })}</span>
                  <Button variant="ghost" size="icon" onClick={() => removeWithdrawal(w.id)} aria-label="Remove">
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
            {settings.withdrawals.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">No withdrawal events.</p>
            )}
          </div>

          <div className="mt-4 grid gap-2 border-t border-border pt-4">
            <Input
              placeholder="Label (e.g. Home purchase)"
              value={draft.label}
              onChange={(e) => setDraft({ ...draft, label: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input type="number" placeholder="Age" value={draft.age} onChange={(e) => setDraft({ ...draft, age: Number(e.target.value) })} />
              <Input type="number" placeholder="Amount" value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: Number(e.target.value) })} />
            </div>
            <Button onClick={addWithdrawal} variant="secondary" className="w-full">
              <Plus className="size-4" /> Add Withdrawal
            </Button>
          </div>
        </SectionCard>
      </div>
    </div>
  )
}
