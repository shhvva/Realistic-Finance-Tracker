"use client"

import { useMemo } from "react"
import { PiggyBank, TrendingUp, Percent, CalendarRange } from "lucide-react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts"
import { useSettings, updateSettings } from "@/lib/hooks"
import { projectPF } from "@/lib/finance"
import { formatINR, formatPercent } from "@/lib/format"
import { PageHeader, SectionCard, StatCard } from "@/components/finance/primitives"
import { MoneyTooltip } from "@/components/finance/chart-tooltip"
import { SettingField } from "@/components/finance/setting-field"

export default function PFPage() {
  const settings = useSettings()
  const yearsToRetire = Math.max(1, settings.retirementAge - settings.currentAge)

  // const projection = useMemo(
  //   () => projectPF(settings.pfBalance, settings.pfMonthly, settings.epfRate, yearsToRetire),
  //   [settings.pfBalance, settings.pfMonthly, settings.epfRate, yearsToRetire],
  // )
  const projection = useMemo(
    () => projectPF(settings, yearsToRetire),
    [settings, yearsToRetire],
  )

  const final = projection[projection.length - 1]
  const annualContribution = settings.pfMonthly * 12

  const chartData = projection.map((p) => ({
    year: String(p.year),
    Balance: p.balance,
    Contributed: p.contributed,
    Interest: p.interest,
  }))

  return (
    <div>
      <PageHeader title="Provident Fund" description="Track your EPF balance and project long-term growth." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Current Balance" value={formatINR(settings.pfBalance, { compact: true })} icon={PiggyBank} />
        <StatCard label="Annual Contribution" value={formatINR(annualContribution, { compact: true })} icon={CalendarRange} accent="text-chart-3" hint={`${formatINR(settings.pfMonthly, { compact: true })}/mo`} />
        <StatCard label="EPF Interest Rate" value={formatPercent(settings.epfRate, 2)} icon={Percent} accent="text-chart-4" />
        <StatCard label={`Balance at ${settings.retirementAge}`} value={formatINR(final?.balance ?? 0, { compact: true })} icon={TrendingUp} accent="text-chart-1" hint={`in ${yearsToRetire} years`} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* <SectionCard title="PF Settings" description="Adjust your contribution details" className="lg:col-span-1">
          <div className="grid gap-4">
            <SettingField label="Current PF Balance" suffix="₹" value={settings.pfBalance} onChange={(v) => updateSettings({ pfBalance: v })} />
            <SettingField label="Monthly Contribution" suffix="₹" value={settings.pfMonthly} onChange={(v) => updateSettings({ pfMonthly: v })} />
            <SettingField label="EPF Interest Rate" suffix="%" step={0.05} value={settings.epfRate} onChange={(v) => updateSettings({ epfRate: v })} />
            <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total interest earned</span>
                <span className="font-semibold text-chart-1">{formatINR(final?.interest ?? 0, { compact: true })}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-muted-foreground">Total contributed</span>
                <span className="font-semibold">{formatINR(final?.contributed ?? 0, { compact: true })}</span>
              </div>
            </div>
          </div>
        </SectionCard> */}
        <SectionCard title="PF Settings" description="Adjust your contribution details" className="lg:col-span-1">
          <div className="grid gap-4">
            <SettingField label="Current PF Balance" suffix="₹" value={settings.pfBalance} onChange={(v) => updateSettings({ pfBalance: v })} />
            <SettingField label="Monthly Contribution" suffix="₹" value={settings.pfMonthly} onChange={(v) => updateSettings({ pfMonthly: v })} />
            <SettingField label="EPF Interest Rate" suffix="%" step={0.05} value={settings.epfRate} onChange={(v) => updateSettings({ epfRate: v })} />

            {settings.marriageAge > 0 && (
              <>
                <div className="mt-2 border-t border-border pt-4 text-xs font-medium text-muted-foreground">
                  Partner — joins at age {settings.marriageAge}
                </div>
                <SettingField label="Partner PF Balance" suffix="₹" value={settings.partnerPfBalance} onChange={(v) => updateSettings({ partnerPfBalance: v })} />
                <SettingField label="Partner Monthly Contribution" suffix="₹" value={settings.partnerPfMonthly} onChange={(v) => updateSettings({ partnerPfMonthly: v })} />
              </>
            )}

            <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total interest earned</span>
                <span className="font-semibold text-chart-1">{formatINR(final?.interest ?? 0, { compact: true })}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-muted-foreground">Total contributed</span>
                <span className="font-semibold">{formatINR(final?.contributed ?? 0, { compact: true })}</span>
              </div>
            </div>
          </div>
        </SectionCard>
        <SectionCard title="PF Growth Projection" description={`Compounded over ${yearsToRetire} years`} className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={340}>
            <AreaChart data={chartData} margin={{ left: -4, right: 8, top: 8 }}>
              <defs>
                <linearGradient id="pfbal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="pfcontrib" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-3)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="var(--chart-3)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="year" tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" interval="preserveStartEnd" />
              <YAxis tickFormatter={(v) => formatINR(v, { compact: true })} tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" width={56} />
              <Tooltip content={<MoneyTooltip />} />
              <Legend iconType="circle" formatter={(v) => <span className="text-xs text-muted-foreground">{v}</span>} />
              <Area type="monotone" dataKey="Balance" stroke="var(--chart-1)" strokeWidth={2} fill="url(#pfbal)" />
              <Area type="monotone" dataKey="Contributed" stroke="var(--chart-3)" strokeWidth={2} fill="url(#pfcontrib)" />
            </AreaChart>
          </ResponsiveContainer>
        </SectionCard>
      </div>
    </div>
  )
}
