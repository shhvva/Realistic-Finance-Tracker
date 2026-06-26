# FinanceOS

A modern personal finance tracker built with Next.js, React, and IndexedDB.

FinanceOS helps you track investments, expenses, goals, PF contributions, retirement projections, and overall net worth — entirely in your browser.

## Features

* Interactive dashboard with charts and analytics
* Investment portfolio tracking
* Financial goals management
* Expense tracking
* PF (Provident Fund) tracking
* Retirement and corpus projections
* Reports and financial summaries
* Dark/light mode support
* Local-first storage using IndexedDB
* Responsive design for desktop and mobile

---

## Tech Stack

* Next.js 16
* React 19
* TypeScript
* Tailwind CSS v4
* Dexie (IndexedDB)
* Zustand
* Recharts
* Lucide Icons
* next-themes

---

## Screenshots

### Retirement Projections

![Projections](./assets/projections.png)

---

## Installation

Clone the repository:

```bash
git clone https://github.com/shhvva/Realistic-Finance-Tracker.git
cd Realistic-Finance-Tracker
```

Install dependencies:

```bash
pnpm install
```

---

## Running the Application

Start the development server:

```bash
pnpm dev
```

Open:

```text
http://localhost:3000
```

Build for production:

```bash
pnpm build
pnpm start
```

---

## Data Storage

FinanceOS uses IndexedDB through Dexie.

* No backend required.
* No database setup.
* All data remains in your browser.
* Data persists across refreshes.
* Clearing browser storage removes data.

---

## Modules

### Dashboard

* Net worth tracking
* Savings rate
* Cash flow analysis
* Asset allocation
* Market cap allocation
* Goal progress
* Net worth history

### Investments

Track mutual funds and investments.

### Goals

Monitor financial goals and progress.

### Expenses

Track monthly spending.

### PF

Track provident fund balances and contributions.

### Projections

Estimate retirement corpus using:

* Expected returns
* Inflation
* Annual investments
* Step-up percentages

### Reports

Generate financial summaries.

---

## Project Structure

```text
app/
components/
lib/
hooks/
public/
```

---

## Disclaimer

This project is intended for personal finance tracking and educational purposes only. It does not provide financial advice.

---

