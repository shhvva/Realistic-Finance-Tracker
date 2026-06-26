"use client"

import { useState } from "react"
import { Plus, Pencil, Trash2, Target, CheckCircle2, CalendarClock } from "lucide-react"
import { db, type Goal } from "@/lib/db"
import { useGoals } from "@/lib/hooks"
import { formatINR } from "@/lib/format"
import { PageHeader, SectionCard, StatCard } from "@/components/finance/primitives"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"

const empty: Omit<Goal, "id"> = {
  name: "",
  current: 0,
  target: 0,
  monthly: 0,
  dueDate: new Date().toISOString().slice(0, 10),
}

function monthsLeft(dueDate: string): number {
  const now = new Date()
  const due = new Date(dueDate)
  return Math.max(0, (due.getFullYear() - now.getFullYear()) * 12 + (due.getMonth() - now.getMonth()))
}

export default function GoalsPage() {
  const goals = useGoals()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Goal | null>(null)
  const [form, setForm] = useState<Omit<Goal, "id">>(empty)

  const totalTarget = goals.reduce((a, g) => a + g.target, 0)
  const totalCurrent = goals.reduce((a, g) => a + g.current, 0)
  const completed = goals.filter((g) => g.current >= g.target).length
  const overallPct = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0

  function openAdd() {
    setEditing(null)
    setForm(empty)
    setOpen(true)
  }

  function openEdit(g: Goal) {
    setEditing(g)
    const { id, ...rest } = g
    setForm(rest)
    setOpen(true)
  }

  async function save() {
    if (!form.name.trim()) {
      toast.error("Name is required")
      return
    }
    if (editing?.id) {
      await db.goals.update(editing.id, form)
      toast.success("Goal updated")
    } else {
      await db.goals.add(form)
      toast.success("Goal added")
    }
    setOpen(false)
  }

  async function remove(g: Goal) {
    if (g.id) {
      await db.goals.delete(g.id)
      toast.success("Goal deleted")
    }
  }

  return (
    <div>
      <PageHeader title="Goals" description="Track progress toward your financial milestones.">
        <Button onClick={openAdd}>
          <Plus className="size-4" /> Add Goal
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Target" value={formatINR(totalTarget, { compact: true })} icon={Target} />
        <StatCard label="Total Saved" value={formatINR(totalCurrent, { compact: true })} icon={Target} accent="text-chart-1" />
        <StatCard label="Overall Progress" value={`${overallPct.toFixed(0)}%`} icon={CalendarClock} accent="text-chart-3" />
        <StatCard label="Completed" value={`${completed} / ${goals.length}`} icon={CheckCircle2} accent="text-chart-4" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        {goals.map((g) => {
          const pct = g.target > 0 ? Math.min(100, (g.current / g.target) * 100) : 0
          const done = g.current >= g.target
          const ml = monthsLeft(g.dueDate)
          const remaining = Math.max(0, g.target - g.current)
          return (
            <Card key={g.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{g.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Due {new Date(g.dueDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                      {" · "}
                      {ml} months left
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(g)} aria-label="Edit">
                      <Pencil className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => remove(g)} aria-label="Delete">
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-medium">{formatINR(g.current, { compact: true })}</span>
                    <span className="text-muted-foreground">{formatINR(g.target, { compact: true })}</span>
                  </div>
                  <Progress value={pct} />
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span className={done ? "font-medium text-chart-1" : "font-medium text-foreground"}>
                      {pct.toFixed(1)}% complete
                    </span>
                    <span>
                      {done ? "Goal reached" : `${formatINR(remaining, { compact: true })} to go · ${formatINR(g.monthly, { compact: true })}/mo`}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
        {goals.length === 0 && (
          <SectionCard title="No goals yet" className="md:col-span-2">
            <p className="text-sm text-muted-foreground">Add your first goal to start tracking progress.</p>
          </SectionCard>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Goal" : "Add Goal"}</DialogTitle>
            <DialogDescription>Set a target and track your savings progress.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="gname">Name</Label>
              <Input id="gname" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Home Purchase" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="current">Current Amount (₹)</Label>
                <Input id="current" type="number" value={form.current || ""} onChange={(e) => setForm({ ...form, current: Number(e.target.value) })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="target">Target Amount (₹)</Label>
                <Input id="target" type="number" value={form.target || ""} onChange={(e) => setForm({ ...form, target: Number(e.target.value) })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="monthly">Monthly Contribution (₹)</Label>
                <Input id="monthly" type="number" value={form.monthly || ""} onChange={(e) => setForm({ ...form, monthly: Number(e.target.value) })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="due">Due Date</Label>
                <Input id="due" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save}>{editing ? "Save Changes" : "Add Goal"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
