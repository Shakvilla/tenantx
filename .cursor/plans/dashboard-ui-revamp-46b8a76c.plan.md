<!-- 46b8a76c-c67a-4566-8b1c-763a93d2916e 98473285-7c82-4c8a-9d82-e6740053138e -->
# Dashboard UI Revamp Plan

## Overview

Rebuild the dashboard to match the current system's layout using components from full-version. The dashboard displays metrics cards, charts, and tables in a grid layout.

## Structure Analysis

### Current Dashboard Components (from images):

1. **Metric Cards Grid** (5 rows):

   - Row 1: Customer breakdown, New customers, Agents
   - Row 2: Daily financials (Revenue, Withdrawals, Balance)
   - Row 3: Monthly financials (Transactions, Withdrawals, Balance)
   - Row 4: Overall financials (Deposits, Withdrawals, Balance)
   - Row 5: Commissions and Approvals

2. **Two-Panel Layout**:

   - Left: Revenue Generation (line chart + donut chart)
   - Right: Top 50 Contributors (bar chart + table)

3. **Full-width Card**: Daily Agent Revenue Collection (placeholder)

## Implementation Steps

### Step 1: Copy Required Components from full-version

- Copy `src/components/card-statistics/` folder (Vertical, Horizontal components)
- Copy chart wrapper: `src/libs/styles/AppReactApexCharts.tsx` (if exists) or use ApexCharts directly
- Copy table styles: `src/@core/styles/table.module.css`
- Ensure ApexCharts and TanStack React Table dependencies exist

### Step 2: Create Custom Metric Card Components

**File**: `src/views/dashboards/DashboardMetricCard.tsx`

- Create reusable card component for metrics with:
  - Title
  - Multiple stat rows (e.g., "Total Customers: 33", "Male Customers: 21")
  - Optional icon
  - Optional action button (e.g., "View Customers created Today")
- Use MUI Card, CardContent, Typography
- Support different layouts (single stat, multiple stats, with actions)

### Step 3: Create Financial Metric Cards

**File**: `src/views/dashboards/FinancialMetricCard.tsx`

- Specialized card for financial metrics showing:
  - Title (e.g., "Revenue Collected Today")
  - Amount with currency (GHC)
  - Icon (clock icon)
- Reuse CardStatVertical pattern from full-version

### Step 4: Create Revenue Generation Panel

**File**: `src/views/dashboards/RevenueGeneration.tsx`

- Card with green header ("Revenue Generation")
- Subtitle: "Ongoing transactions based on statuses"
- Small line chart at top (light green background)
- Large donut chart in center (blue, 100% complete)
- Legend showing "complete: 100.00%"
- Use ApexCharts LineChart and DonutChart patterns from full-version

### Step 5: Create Top 50 Contributors Panel

**File**: `src/views/dashboards/TopContributors.tsx`

- Card with title "Top 50 Contributors"
- Small bar chart at top (light green background, teal bars)
- Table below with columns:
  - NAME: Person icon, name, agent name
  - CONTRIBUTION: Amount in GH₵ (green boxes)
- Use TanStack React Table pattern from UserTable
- Use BarChart component pattern from full-version

### Step 6: Create Daily Agent Revenue Card

**File**: `src/views/dashboards/DailyAgentRevenue.tsx`

- Card with green header ("Daily Agent Revenue Collection")
- Subtitle: "Daily Revenues collected by agents"
- Empty white content area (placeholder for future chart)
- Small graph icon in bottom-left

### Step 7: Build Main Dashboard Page

**File**: `src/app/(dashboard)/dashboard/page.tsx`

- Use MUI Grid2 for responsive layout
- Organize cards in rows matching current layout:
  - Row 1: 3 cards (Customer breakdown, New customers, Agents)
  - Row 2: 3 financial cards (Daily metrics)
  - Row 3: 3 financial cards (Monthly metrics)
  - Row 4: 3 financial cards (Overall metrics)
  - Row 5: 3 cards (Commissions, Approvals)
  - Row 6: 2 panels side-by-side (Revenue Generation, Top Contributors)
  - Row 7: Full-width card (Daily Agent Revenue)
- Grid sizes: xs=12, sm=6, md=4 for 3-column cards; md=6 for 2-column panels

### Step 8: Create Data Types

**File**: `src/types/dashboards/dashboardTypes.ts`

- Define TypeScript interfaces for:
  - CustomerStats
  - FinancialMetrics
  - ContributorData
  - RevenueData

### Step 9: Add Dependencies Check

- Verify ApexCharts is available (check package.json)
- Verify TanStack React Table is available
- Add if missing from full-version dependencies

## File Structure

```
src/
├── views/
│   └── dashboards/
│       ├── DashboardMetricCard.tsx
│       ├── FinancialMetricCard.tsx
│       ├── RevenueGeneration.tsx
│       ├── TopContributors.tsx
│       └── DailyAgentRevenue.tsx
├── components/
│   └── card-statistics/ (copied from full-version)
├── types/
│   └── dashboards/
│       └── dashboardTypes.ts
└── app/
    └── (dashboard)/
        └── dashboard/
            └── page.tsx
```

## Key Design Decisions

- Use MUI Grid2 for responsive layout (matches full-version pattern)
- Reuse card-statistics components from full-version
- Use ApexCharts for all charts (line, bar, donut)
- Use TanStack React Table for contributors table
- Maintain green header style for special cards
- Use GHC currency format throughout
- Keep icon sizes consistent (using reduced icon sizes from previous changes)

## Notes

- All components will be client components ('use client') for interactivity
- Charts use dynamic imports for ApexCharts (performance)
- Table uses TanStack React Table for sorting/filtering
- Maintain same visual hierarchy and spacing as current system

### To-dos

- [x] 