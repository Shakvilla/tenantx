# View Maintenance Request Feature

## Overview
Implementation of the view maintenance request dialog functionality to display detailed information about maintenance requests.

## Implementation Date
2024-12-19

## Changes Made

### 1. Created ViewMaintenanceRequestDialog Component
**File:** `src/views/maintenance/requests/ViewMaintenanceRequestDialog.tsx`

**Features:**
- Displays comprehensive maintenance request details in a dialog
- Shows property information with image and unit number
- Displays tenant information with avatar
- Shows issue title and description
- Displays priority and status with color-coded chips
- Shows assigned maintainer (if assigned)
- Displays requested date and completed date (if completed)
- Image gallery with thumbnail navigation for request images
- Edit button that opens the edit dialog

**Components Used:**
- MUI Dialog, DialogTitle, DialogContent, DialogActions
- MUI Card, CardContent, CardMedia
- MUI Grid2 for responsive layout
- MUI Chip for status and priority display
- CustomAvatar component for avatars
- getInitials utility for avatar fallbacks

**Status Colors:**
- `new`: info (blue)
- `pending`: warning (orange)
- `in-progress`: primary
- `completed`: success (green)
- `rejected`: error (red)

**Priority Colors:**
- `low`: info (blue)
- `medium`: warning (orange)
- `high`: error (red)
- `urgent`: error (red)

### 2. Integrated Dialog into MaintenanceRequestsListTable
**File:** `src/views/maintenance/requests/MaintenanceRequestsListTable.tsx`

**Changes:**
- Added import for ViewMaintenanceRequestDialog
- Added state variables:
  - `viewRequestOpen`: controls dialog visibility
  - `requestToView`: stores the request to display
- Updated "View" action in table to open the dialog
- Added ViewMaintenanceRequestDialog component to JSX
- Connected edit functionality from view dialog to edit dialog

**Integration Points:**
- View action in table row menu (line ~469)
- Dialog component added after Edit Request Dialog
- Edit button in view dialog opens edit dialog

## Technical Details

### Date Formatting
Uses `formatDate` helper function to format dates as "DD Month YYYY" (e.g., "15 November 2024")

### Image Display
- Main image displayed at 300px height
- Thumbnail grid with 4 columns on mobile, 3 on tablet
- Clickable thumbnails with hover effects
- Selected thumbnail highlighted with primary border

### Responsive Design
- Uses MUI Grid2 for responsive layout
- Property and tenant info in 2 columns on desktop, stacked on mobile
- Images adapt to container width

## Testing Notes
- Dialog opens when "View" is clicked from table action menu
- All request data displays correctly
- Images display properly when available
- Edit button transitions to edit dialog
- Close button closes dialog
- Status and priority chips display with correct colors

## Future Enhancements
- Add image zoom functionality
- Add print/export functionality
- Add comments/notes section
- Add timeline/history view

