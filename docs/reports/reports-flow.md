# Reports Flow Documentation

## Overview

The Reports feature provides a comprehensive reporting system for the TenantX application. Users can generate and view reports for tenants, expenses, earnings, and maintenance with date filtering and export capabilities.

## Features

- **Tabbed Interface**: Four report types accessible via tabs (Tenants, Expenses, Earnings, Maintenance)
- **Date Filtering**: Preset ranges (Last 7 days, Last 30 days, Last 3 months, Last 6 months, Last year, All time) and custom date range picker
- **Charts**: Visual representation using ApexCharts (Line, Bar, Donut charts)
- **Summary Cards**: Key metrics displayed in summary cards with trend indicators
- **Export Functionality**: Export reports to PDF, Excel, and CSV formats
- **Responsive Design**: Works on all screen sizes

## File Structure

```
src/
├── app/(dashboard)/reports/
│   └── page.tsx                    # Main reports page route
├── views/reports/
│   ├── ReportsPage.tsx            # Main reports component with tabs
│   ├── TenantsReport.tsx          # Tenants report component
│   ├── ExpensesReport.tsx         # Expenses report component
│   ├── EarningsReport.tsx         # Earnings report component
│   └── MaintenanceReport.tsx     # Maintenance report component
├── components/reports/
│   ├── DateRangeFilter.tsx        # Date range filter component
│   ├── ReportCharts.tsx           # Reusable chart components
│   ├── ExportButtons.tsx           # Export functionality buttons
│   └── ReportSummaryCards.tsx     # Summary statistics cards
├── types/reports/
│   └── reportTypes.ts             # TypeScript type definitions
└── utils/reports/
    ├── dateUtils.ts                # Date range utilities
    └── exportUtils.ts              # Export functions (PDF, Excel, CSV)
```

## Report Types

### 1. Tenants Report
- **Summary Metrics**: Total Tenants, Active Tenants, Occupancy Rate, New Tenants
- **Charts**:
  - Line Chart: Tenant trends over time
  - Donut Chart: Tenant distribution (Active vs Inactive)
  - Bar Chart: Lease status breakdown

### 2. Expenses Report
- **Summary Metrics**: Total Expenses, Paid Expenses, Unpaid Expenses, Average Expense
- **Charts**:
  - Line Chart: Expense trends over time
  - Donut Chart: Expenses by category
  - Bar Chart: Monthly comparison

### 3. Earnings Report
- **Summary Metrics**: Total Revenue, Paid Revenue, Pending Revenue, Average Revenue
- **Charts**:
  - Line Chart: Revenue trends over time
  - Donut Chart: Payment status distribution
  - Bar Chart: Revenue by property

### 4. Maintenance Report
- **Summary Metrics**: Total Requests, Completed, Pending, In Progress
- **Charts**:
  - Line Chart: Request trends over time
  - Donut Chart: Status distribution
  - Bar Chart: Requests by property

## Date Filtering

The date filter supports:
- **Preset Ranges**: Quick selection of common date ranges
- **Custom Range**: Manual selection of start and end dates
- **Shared State**: Date range is shared across all report tabs

## Export Functionality

### PDF Export
- Uses jsPDF and jspdf-autotable
- Exports tables and summary data
- Charts are not included (would require image conversion)

### Excel Export
- Uses xlsx library
- Exports data in Excel format (.xlsx)
- Includes all report data

### CSV Export
- Uses xlsx library
- Exports data in CSV format
- Compatible with spreadsheet applications

## Dependencies

- `jspdf`: PDF generation
- `jspdf-autotable`: Table formatting for PDF
- `xlsx`: Excel/CSV export
- `apexcharts`: Chart library (already installed)
- `react-apexcharts`: React wrapper for ApexCharts (already installed)

## Navigation

The Reports page is accessible at `/reports` and is linked in the main navigation menu under "Reports" (previously had sub-menu items).

## Data Integration

Currently, the reports use mock data. To integrate with real data:

1. Create API endpoints or data fetching functions for each report type
2. Replace mock data in each report component with actual API calls
3. Update the `useMemo` hooks to fetch data based on the selected date range

## Future Enhancements

- Real-time data integration
- Scheduled report generation
- Email report delivery
- Custom report builder
- Chart image export for PDF
- More chart types and visualizations
- Report templates
- Comparison reports (year-over-year, month-over-month)

## Last Updated

Implementation completed: Reports flow with all four report types, date filtering, charts, and export functionality.

