import Dexie, { type Table } from "dexie"

export type InvestmentCategory = "large" | "flexi" | "mid" | "small" | "gold" | "debt"

export interface Investment {
  id?: number
  name: string
  category: InvestmentCategory
  sip: number // monthly SIP amount
  invested: number // total invested value
  current: number // current value
  xirr: number // percentage
}

export interface Goal {
  id?: number
  name: string
  current: number
  target: number
  monthly: number // monthly contribution
  dueDate: string // ISO date
}

export interface Snapshot {
  id?: number
  month: string // e.g. "2026-01"
  netWorth: number
  investments: number
  savings: number
  expenses: number
}

export interface WithdrawalEvent {
  id: string
  age: number
  amount: number
  label: string
}

export interface Settings {
  id: string
  monthlyIncome: number
  emergencyFund: number
  pfBalance: number
  pfMonthly: number
  epfRate: number
  currentAge: number
  retirementAge: number
  expectedReturn: number
  inflation: number
  annualInvestment: number
  annualExpenses: number
  withdrawals: WithdrawalEvent[]
  bankBalance: number

  // job-switch income growth (replaces flat stepUp)
  jobChangeYears: number      // avg years before you switch jobs
  raiseOnSwitch: number       // % jump on switching
  annualIncrement: number     // % raise in years you stay put

  // marriage / partner (merged household corpus)
  marriageAge: number              // 0 = not modeled yet
  partnerAnnualInvestment: number
  partnerJobChangeYears: number
  partnerRaiseOnSwitch: number
  partnerAnnualIncrement: number
}

export interface Settings {
  id: string // always "app"
  monthlyIncome: number
  emergencyFund: number
  // PF
  pfBalance: number
  pfMonthly: number
  epfRate: number
  partnerPfBalance: number
  partnerPfMonthly: number
  // Projections
  currentAge: number
  retirementAge: number
  expectedReturn: number
  inflation: number
  annualInvestment: number
  stepUp: number
  annualExpenses: number
  withdrawals: WithdrawalEvent[]
}

export interface Purchase {
  id?: number
  label: string       // "California burrito"
  category: string    // "Food"
  amount: number
  date: string         // ISO "YYYY-MM-DD"
}

export const DEFAULT_EXPENSE_CATEGORIES = [
  "Food",
  "Rent",
  "Utilities",
  "Transport",
  "Friends & Social",
  "Shopping",
  "Health",
  "Entertainment",
  "Travel",
  "EMI / Loans",
  "Misc",
  "Tanvi"
]

export function normCategory(c: string) {
  return c.trim().toLowerCase()
}

// if "food" matches an existing "Food", keep the existing casing instead of making a new slice
export function canonicalizeCategory(input: string, existing: string[]): string {
  const trimmed = input.trim()
  const match = existing.find((c) => normCategory(c) === normCategory(trimmed))
  return match ?? trimmed
}

export const CATEGORY_LABELS: Record<InvestmentCategory, string> = {
  large: "Large Cap",
  flexi: "Flexi Cap",
  mid: "Mid Cap",
  small: "Small Cap",
  gold: "Gold",
  debt: "Debt",
}

// class FinanceDB extends Dexie {
//   investments!: Table<Investment, number>
//   goals!: Table<Goal, number>
//   expenses!: Table<Expense, number>
//   snapshots!: Table<Snapshot, number>
//   settings!: Table<Settings, string>

//   constructor() {
//     super("financeos")
//     this.version(1).stores({
//       investments: "++id, name, category",
//       goals: "++id, name, dueDate",
//       expenses: "++id, category",
//       snapshots: "++id, month",
//       settings: "id",
//     })
//   }
// }
class FinanceDB extends Dexie {
  investments!: Table<Investment, number>
  goals!: Table<Goal, number>
  purchases!: Table<Purchase, number>
  snapshots!: Table<Snapshot, number>
  settings!: Table<Settings, string>

  constructor() {
    super("financeos")
    this.version(1).stores({
      investments: "++id, name, category",
      goals: "++id, name, dueDate",
      expenses: "++id, category",
      snapshots: "++id, month",
      settings: "id",
    })
    this.version(2).stores({
      investments: "++id, name, category",
      goals: "++id, name, dueDate",
      expenses: "++id, category",
      purchases: "++id, category, date",
      snapshots: "++id, month",
      settings: "id",
    })
    this.version(3).stores({
      investments: "++id, name, category",
      goals: "++id, name, dueDate",
      expenses: "++id, category",
      purchases: "++id, category, date",
      snapshots: "++id, month",
      settings: "id",
    })

  }
}

export const db = new FinanceDB()

export const DEFAULT_SETTINGS: Settings = {
  id: "app",
  monthlyIncome: 220000,
  emergencyFund: 1200000,
  pfBalance: 1850000,
  pfMonthly: 21600,
  epfRate: 8.25,
  currentAge: 32,
  retirementAge: 55,
  expectedReturn: 12,
  inflation: 6,
  annualInvestment: 720000,
  stepUp: 10,
  annualExpenses: 1200000,
  jobChangeYears: 3,
  raiseOnSwitch: 25,
  annualIncrement: 4,
  marriageAge: 0,
  partnerAnnualInvestment: 0,
  partnerJobChangeYears: 3,
  partnerRaiseOnSwitch: 25,
  partnerAnnualIncrement: 4,
  partnerPfBalance: 0,
  partnerPfMonthly: 0,
  bankBalance: 0,
  withdrawals: [
    { id: "w1", age: 40, amount: 2500000, label: "Home down payment" },
    { id: "w2", age: 45, amount: 1500000, label: "Child education" },
  ],
}

let seeded = false

export async function ensureSeed() {
  if (seeded) return
  seeded = true

  const existing = await db.settings.get("app")
  if (!existing) {
    await db.settings.put(DEFAULT_SETTINGS)
  }

  const invCount = await db.investments.count()

  const goalCount = await db.goals.count()

  const expCount = await db.purchases.count()

  const snapCount = await db.snapshots.count()

}
