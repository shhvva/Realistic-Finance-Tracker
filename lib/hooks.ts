"use client"

import { useLiveQuery } from "dexie-react-hooks"
import { db, DEFAULT_SETTINGS, type Settings } from "./db"

export function useInvestments() {
  return useLiveQuery(() => db.investments.toArray(), [], [])
}

export function useGoals() {
  return useLiveQuery(() => db.goals.toArray(), [], [])
}

export function useExpenses() {
  return useLiveQuery(() => db.purchases.toArray(), [], [])
}

export function useSnapshots() {
  return useLiveQuery(async () => {
    const rows = await db.snapshots.toArray()
    return rows.sort((a, b) => a.month.localeCompare(b.month))
  }, [], [])
}

export function usePurchases() {
  return useLiveQuery(() => db.purchases.orderBy("date").reverse().toArray(), [], [])
}

// export function useSettings(): Settings {
//   return useLiveQuery(() => db.settings.get("app"), [], DEFAULT_SETTINGS) ?? DEFAULT_SETTINGS
// }

// export async function updateSettings(patch: Partial<Settings>) {
//   const current = (await db.settings.get("app")) ?? DEFAULT_SETTINGS
//   await db.settings.put({ ...current, ...patch, id: "app" })
// }

export function useSettings(): Settings {
  const merged = useLiveQuery(async () => {
    const stored = await db.settings.get("app")
    return stored ? { ...DEFAULT_SETTINGS, ...stored } : DEFAULT_SETTINGS
  }, [], DEFAULT_SETTINGS)
  return merged ?? DEFAULT_SETTINGS
}

export async function updateSettings(patch: Partial<Settings>) {
  const current = (await db.settings.get("app")) ?? DEFAULT_SETTINGS
  await db.settings.put({ ...DEFAULT_SETTINGS, ...current, ...patch, id: "app" })
}
