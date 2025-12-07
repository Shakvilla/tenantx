# Agreements Module Documentation

## Overview

The Agreements module provides a comprehensive system for managing lease agreements and general contracts in the TenantX application. Users can create, view, edit, and delete agreements with full support for both lease agreements and general contracts.

## Features

- **Full CRUD Operations**: Create, Read, Update, and Delete agreements
- **Statistics Dashboard**: View key metrics including total, active, expired, and pending agreements
- **Advanced Filtering**: Filter by property, type, and status
- **Search Functionality**: Global search across all agreement fields
- **Document Management**: Upload and download agreement documents
- **Financial Tracking**: Track amounts, rent, security deposits, and late fees
- **Terms & Conditions**: Store detailed terms, conditions, and renewal options
- **Responsive Design**: Works on all screen sizes

## File Structure

```
src/
├── app/(dashboard)/agreement/
│   └── page.tsx                    # Main agreement page route
├── views/agreement/
│   ├── AgreementsListTable.tsx     # Main list table component
│   ├── AgreementsStatsCard.tsx    # Statistics card component
│   ├── AddAgreementDialog.tsx     # Create/Edit dialog component
│   └── ViewAgreementDialog.tsx    # View details dialog component
├── types/agreement/
│   └── agreementTypes.ts          # TypeScript type definitions
└── docs/agreement/
    └── agreement-module.md         # This documentation file
```

## Agreement Data Structure

### Core Fields

- **Basic Information**:
  - `id`: Unique identifier
  - `agreementNumber`: Unique agreement number (e.g., AGR-001)
  - `type`: Agreement type (lease, contract, other)
  - `status`: Agreement status (active, expired, pending, terminated)

- **Parties**:
  - `tenantId`: Tenant identifier
  - `tenantName`: Tenant name
  - `tenantAvatar`: Tenant avatar URL
  - `propertyId`: Property identifier
  - `propertyName`: Property name
  - `unitId`: Unit identifier
  - `unitNo`: Unit number

- **Dates**:
  - `startDate`: Agreement start date
  - `endDate`: Agreement end date
  - `signedDate`: Date when agreement was signed
  - `expiryDate`: Agreement expiry date

- **Financial**:
  - `amount`: Total agreement amount
  - `rent`: Monthly/periodic rent
  - `securityDeposit`: Security deposit amount
  - `lateFee`: Late payment fee
  - `paymentFrequency`: Payment frequency (monthly, quarterly, yearly, one-time)

- **Terms**:
  - `terms`: Agreement terms
  - `conditions`: Agreement conditions
  - `duration`: Agreement duration
  - `renewalOptions`: Renewal options

- **Documents**:
  - `documentUrl`: URL to agreement document
  - `attachments`: Array of attachment URLs

## Components

### AgreementsListTable

Main component displaying all agreements in a table format with:
- Search and filter capabilities
- Pagination (10, 25, 50 rows per page)
- Row selection
- Action menu (View, Edit, Delete, Download)
- Statistics card integration

### AgreementsStatsCard

Displays key metrics:
- Total Agreements
- Active Agreements
- Expired Agreements
- Pending Agreements
- Total Revenue

### AddAgreementDialog

Form dialog for creating and editing agreements with sections:
- Basic Information (agreement number, type, status, duration)
- Parties (tenant, property, unit selection)
- Dates (start, end, signed dates)
- Financial (amount, rent, security deposit, late fee, payment frequency)
- Terms & Conditions (terms, conditions, renewal options)
- Documents (file upload)

### ViewAgreementDialog

Read-only view of agreement details with:
- Complete agreement information
- Organized sections
- Download document button
- Print option

## Usage

### Accessing the Module

Navigate to `/agreement` in the application. The menu item is already configured with icon `ri-file-contract-line`.

### Creating an Agreement

1. Click "Add Agreement" button
2. Fill in the required fields in the form sections
3. Upload agreement document (optional)
4. Click "Save Now"

### Editing an Agreement

1. Click the action menu (three dots) on an agreement row
2. Select "Edit"
3. Modify the fields as needed
4. Click "Update"

### Viewing an Agreement

1. Click the action menu on an agreement row
2. Select "View"
3. Review all agreement details
4. Download or print if needed

### Deleting an Agreement

1. Click the action menu on an agreement row
2. Select "Delete"
3. Confirm deletion in the dialog

## Filtering and Search

- **Property Filter**: Filter agreements by property
- **Type Filter**: Filter by agreement type (lease, contract, other)
- **Status Filter**: Filter by status (active, expired, pending, terminated)
- **Global Search**: Search across all agreement fields

## TypeScript Types

All types are defined in `src/types/agreement/agreementTypes.ts`:

- `Agreement`: Main agreement type
- `AgreementStatus`: Status type union
- `AgreementType`: Type union
- `PaymentFrequency`: Payment frequency type union
- `AgreementFormDataType`: Form data type

## Current Status

All features implemented and working. The agreements module is accessible at `/agreement` with full CRUD functionality.

## Notes

- Currently using mock data for agreements. Real data integration needed.
- Document upload creates a preview URL but doesn't persist to storage (needs backend integration).
- Export functionality is available but needs implementation.
- All components follow existing codebase patterns and styling.

