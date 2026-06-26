import type { Settings, WithdrawalEvent } from "./db"

export interface ProjectionYear {
  age: number
  year: number
  corpus: number
  realCorpus: number // inflation adjusted
  contributions: number // cumulative contributions
  returns: number // cumulative returns
}

// export function projectRetirement(s: Settings): ProjectionYear[] {
//   const years: ProjectionYear[] = []
//   const r = s.expectedReturn / 100
//   const infl = s.inflation / 100
//   const stepUp = s.stepUp / 100
//   const startYear = new Date().getFullYear()

//   let corpus = 0
//   let annualInvest = s.annualInvestment
//   let cumulativeContrib = 0

//   const withdrawalsByAge = new Map<number, number>()
//   for (const w of s.withdrawals) {
//     withdrawalsByAge.set(w.age, (withdrawalsByAge.get(w.age) ?? 0) + w.amount)
//   }

//   for (let age = s.currentAge; age <= s.retirementAge; age++) {
//     // grow existing corpus
//     corpus = corpus * (1 + r)
//     // add this year's contribution
//     corpus += annualInvest
//     cumulativeContrib += annualInvest
//     // apply withdrawal events
//     const w = withdrawalsByAge.get(age)
//     if (w) corpus -= w

//     const elapsed = age - s.currentAge
//     const realCorpus = corpus / Math.pow(1 + infl, elapsed)

//     years.push({
//       age,
//       year: startYear + elapsed,
//       corpus: Math.max(0, Math.round(corpus)),
//       realCorpus: Math.max(0, Math.round(realCorpus)),
//       contributions: Math.round(cumulativeContrib),
//       returns: Math.max(0, Math.round(corpus - cumulativeContrib + sumWithdrawalsUpTo(s.withdrawals, age))),
//     })

//     annualInvest = annualInvest * (1 + stepUp)
//   }

//   return years
// }
export function projectRetirement(s: Settings): ProjectionYear[] {
  const years: ProjectionYear[] = []
  const r = s.expectedReturn / 100
  const infl = s.inflation / 100
  const startYear = new Date().getFullYear()

  let corpus = 0
  let cumulativeContrib = 0

  let ownAnnualInvest = s.annualInvestment
  let ownYearsInJob = 0

  let partnerAnnualInvest = s.partnerAnnualInvestment
  let partnerYearsInJob = 0
  const marriageActive = s.marriageAge > 0

  const withdrawalsByAge = new Map<number, number>()
  for (const w of s.withdrawals) {
    withdrawalsByAge.set(w.age, (withdrawalsByAge.get(w.age) ?? 0) + w.amount)
  }

  for (let age = s.currentAge; age <= s.retirementAge; age++) {
    corpus = corpus * (1 + r)

    corpus += ownAnnualInvest
    cumulativeContrib += ownAnnualInvest

    if (marriageActive && age >= s.marriageAge) {
      corpus += partnerAnnualInvest
      cumulativeContrib += partnerAnnualInvest
    }

    const w = withdrawalsByAge.get(age)
    if (w) corpus -= w

    const elapsed = age - s.currentAge
    const realCorpus = corpus / Math.pow(1 + infl, elapsed)

    years.push({
      age,
      year: startYear + elapsed,
      corpus: Math.max(0, Math.round(corpus)),
      realCorpus: Math.max(0, Math.round(realCorpus)),
      contributions: Math.round(cumulativeContrib),
      returns: Math.max(0, Math.round(corpus - cumulativeContrib + sumWithdrawalsUpTo(s.withdrawals, age))),
    })

    // your raise/switch logic for next year
    ownYearsInJob++
    if (ownYearsInJob >= s.jobChangeYears) {
      ownAnnualInvest *= 1 + s.raiseOnSwitch / 100
      ownYearsInJob = 0
    } else {
      ownAnnualInvest *= 1 + s.annualIncrement / 100
    }

    // partner's raise/switch logic, only once married
    if (marriageActive && age >= s.marriageAge) {
      partnerYearsInJob++
      if (partnerYearsInJob >= s.partnerJobChangeYears) {
        partnerAnnualInvest *= 1 + s.partnerRaiseOnSwitch / 100
        partnerYearsInJob = 0
      } else {
        partnerAnnualInvest *= 1 + s.partnerAnnualIncrement / 100
      }
    }
  }

  return years
}

function sumWithdrawalsUpTo(withdrawals: WithdrawalEvent[], age: number): number {
  return withdrawals.filter((w) => w.age <= age).reduce((a, w) => a + w.amount, 0)
}

export interface PFYear {
  year: number
  balance: number
  contributed: number
  interest: number
}

export function projectPF(s: Settings, years: number): PFYear[] {
  const out: PFYear[] = []
  const annualRate = s.epfRate / 100
  const startYear = new Date().getFullYear()
  const marriageActive = s.marriageAge > 0

  let bal = s.pfBalance + (marriageActive && s.currentAge >= s.marriageAge ? s.partnerPfBalance : 0)
  let totalContrib = bal

  let ownMonthly = s.pfMonthly
  let ownYearsInJob = 0
  let partnerMonthly = s.partnerPfMonthly
  let partnerYearsInJob = 0

  out.push({ year: startYear, balance: Math.round(bal), contributed: Math.round(totalContrib), interest: 0 })

  for (let i = 1; i <= years; i++) {
    const age = s.currentAge + i

    let yearlyContrib = ownMonthly * 12
    if (marriageActive && age >= s.marriageAge) yearlyContrib += partnerMonthly * 12

    bal = bal * (1 + annualRate) + yearlyContrib * (1 + annualRate / 2)
    totalContrib += yearlyContrib

    out.push({
      year: startYear + i,
      balance: Math.round(bal),
      contributed: Math.round(totalContrib),
      interest: Math.round(bal - totalContrib),
    })

    // PF contribution rides your salary growth — same job-switch model as Projections
    ownYearsInJob++
    if (ownYearsInJob >= s.jobChangeYears) {
      ownMonthly *= 1 + s.raiseOnSwitch / 100
      ownYearsInJob = 0
    } else {
      ownMonthly *= 1 + s.annualIncrement / 100
    }

    if (marriageActive && age >= s.marriageAge) {
      partnerYearsInJob++
      if (partnerYearsInJob >= s.partnerJobChangeYears) {
        partnerMonthly *= 1 + s.partnerRaiseOnSwitch / 100
        partnerYearsInJob = 0
      } else {
        partnerMonthly *= 1 + s.partnerAnnualIncrement / 100
      }
    }
  }

  return out
}

export function retirementCorpusTarget(annualExpenses: number, inflation: number, yearsToRetire: number): number {
  // 25x rule on inflation-adjusted expenses at retirement
  const futureExpenses = annualExpenses * Math.pow(1 + inflation / 100, yearsToRetire)
  return futureExpenses * 25
}
