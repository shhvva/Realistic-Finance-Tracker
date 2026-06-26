"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import {
  LayoutDashboard,
  TrendingUp,
  Target,
  Receipt,
  PiggyBank,
  LineChart,
  FileBarChart,
  Menu,
  Moon,
  Sun,
  Wallet,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/investments", label: "Investments", icon: TrendingUp },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/pf", label: "PF", icon: PiggyBank },
  { href: "/projections", label: "Projections", icon: LineChart },
  { href: "/reports", label: "Reports", icon: FileBarChart },
]

function ThemeToggle({ collapsed }: { collapsed: boolean }) {
  const { theme, setTheme } = useTheme()
  return (
    <Button
      variant="ghost"
      className={cn("w-full justify-start gap-3 text-sidebar-foreground", collapsed && "justify-center px-0")}
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      <Sun className="size-5 shrink-0 dark:hidden" />
      <Moon className="hidden size-5 shrink-0 dark:block" />
      {!collapsed && <span>Toggle theme</span>}
    </Button>
  )
}

function NavLinks({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const pathname = usePathname()
  return (
    <nav className="flex flex-1 flex-col gap-1 p-3">
      {NAV.map((item) => {
        const active = pathname === item.href
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            title={collapsed ? item.label : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              collapsed && "justify-center px-0",
              active
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            <Icon className="size-5 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </Link>
        )
      })}
    </nav>
  )
}

function Brand({ collapsed }: { collapsed: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5 px-5 py-5", collapsed && "justify-center px-0")}>
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
        <Wallet className="size-5" />
      </div>
      {!collapsed && (
        <div className="leading-tight">
          <p className="text-base font-semibold tracking-tight text-sidebar-foreground">FinanceOS</p>
          <p className="text-xs text-muted-foreground">Personal finance</p>
        </div>
      )}
    </div>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-svh overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 md:flex",
          collapsed ? "w-[72px]" : "w-64",
        )}
      >
        <Brand collapsed={collapsed} />
        <NavLinks collapsed={collapsed} />
        <div className="border-t border-sidebar-border p-3">
          <ThemeToggle collapsed={collapsed} />
          <Button
            variant="ghost"
            className={cn("mt-1 w-full justify-start gap-3 text-sidebar-foreground", collapsed && "justify-center px-0")}
            onClick={() => setCollapsed((c) => !c)}
          >
            {collapsed ? <PanelLeft className="size-5" /> : <PanelLeftClose className="size-5" />}
            {!collapsed && <span>Collapse</span>}
          </Button>
        </div>
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-foreground/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar">
            <Brand collapsed={false} />
            <NavLinks collapsed={false} onNavigate={() => setMobileOpen(false)} />
            <div className="border-t border-sidebar-border p-3">
              <ThemeToggle collapsed={false} />
            </div>
          </aside>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur md:hidden">
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <Menu className="size-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Wallet className="size-5 text-primary" />
            <span className="font-semibold">FinanceOS</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl p-4 md:p-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
