# Subscription Plans Module Documentation

## Overview

The Subscription Plans module provides a comprehensive system for managing subscription plans and user subscriptions in the TenantX application. It includes both admin interfaces for managing plans and user-facing interfaces for viewing and subscribing to plans.

## Features

### Admin Features

- **Full CRUD Operations**: Create, Read, Update, and Delete subscription plans
- **Statistics Dashboard**: View key metrics including total plans, active subscriptions, and monthly recurring revenue
- **Plan Management**: Manage plan tiers (Free, Basic, Pro, Enterprise) with pricing, limits, and features
- **Advanced Filtering**: Filter by status, tier, and billing cycle
- **Search Functionality**: Global search across all plan fields
- **Plan Activation/Deactivation**: Toggle plan status
- **Feature Management**: Add and remove plan features dynamically

### User Features

- **Plan Comparison View**: Card-based layout comparing all available plans
- **Feature Comparison Table**: Side-by-side comparison of plan features
- **Current Subscription Status**: Display active subscription with usage statistics
- **Subscribe/Upgrade Functionality**: Subscribe to new plans or upgrade existing ones
- **Billing Cycle Selection**: Choose between monthly, quarterly, or yearly billing
- **Usage Tracking**: Visual progress bars showing resource usage vs limits

## File Structure

```
src/
├── app/(dashboard)/subscription-plans/
│   └── page.tsx                                    # Main route (admin view)
├── views/subscription-plans/
│   ├── SubscriptionPlansListTable.tsx             # Admin: Plans list table
│   ├── SubscriptionPlansStatsCard.tsx             # Admin: Statistics card
│   ├── AddSubscriptionPlanDialog.tsx              # Admin: Create/Edit dialog
│   ├── ViewSubscriptionPlanDialog.tsx            # Admin: View details
│   ├── PlansComparisonView.tsx                   # User: Plan comparison cards
│   ├── CurrentSubscriptionCard.tsx               # User: Current subscription status
│   └── SubscribeDialog.tsx                      # User: Subscribe/Upgrade dialog
├── types/subscription-plans/
│   ├── subscriptionPlanTypes.ts                  # Plan type definitions
│   └── subscriptionTypes.ts                      # User subscription types
└── docs/subscription-plans/
    └── subscription-plans-module.md               # This documentation file
```

## Data Structure

### Subscription Plan Fields

- **Basic Information**:

  - `id`: Unique identifier
  - `name`: Plan name (e.g., "Pro Plan")
  - `tier`: Plan tier (free, basic, pro, enterprise)
  - `description`: Plan description
  - `status`: Plan status (active, inactive, archived)
  - `isPopular`: Boolean flag for popular plan badge

- **Pricing**:

  - `price`: Plan price (string, "0" for free)
  - `currency`: Currency symbol (e.g., "₵")
  - `billingCycle`: Billing frequency (monthly, quarterly, yearly)
  - `trialPeriod`: Trial period in days

- **Limits**:

  - `maxProperties`: Maximum properties (-1 for unlimited)
  - `maxTenants`: Maximum tenants (-1 for unlimited)
  - `maxUnits`: Maximum units (-1 for unlimited)
  - `maxDocuments`: Maximum documents (-1 for unlimited)
  - `maxUsers`: Maximum users (-1 for unlimited)

- **Features**:

  - `features`: Array of feature strings

- **Metadata**:
  - `createdAt`: Creation timestamp
  - `updatedAt`: Last update timestamp
  - `createdBy`: Creator identifier

### Subscription Fields (User's active subscription)

- `id`: Unique identifier
- `userId`: User identifier
- `planId`: Associated plan ID
- `planName`: Plan name
- `status`: Subscription status (active, expired, cancelled, trial)
- `startDate`: Subscription start date
- `endDate`: Subscription end date
- `trialEndDate`: Trial end date (if applicable)
- `autoRenew`: Auto-renewal enabled flag
- `billingCycle`: Billing cycle (monthly, quarterly, yearly)
- `amount`: Subscription amount
- `currency`: Currency symbol

### Subscription Usage

- `propertiesUsed`: Number of properties currently used
- `propertiesLimit`: Maximum properties allowed
- `tenantsUsed`: Number of tenants currently used
- `tenantsLimit`: Maximum tenants allowed
- `unitsUsed`: Number of units currently used
- `unitsLimit`: Maximum units allowed
- `documentsUsed`: Number of documents currently used
- `documentsLimit`: Maximum documents allowed
- `usersUsed`: Number of users currently used
- `usersLimit`: Maximum users allowed

## Components

### SubscriptionPlansListTable

Main admin component displaying all subscription plans in a table format with:

- Search and filter capabilities
- Pagination (10, 25, 50 rows per page)
- Row selection
- Action menu (View, Edit, Activate/Deactivate, Delete)
- Statistics card integration
- Filters: Status, Tier, Billing Cycle

### SubscriptionPlansStatsCard

Displays key metrics:

- Total Plans
- Active Plans
- Total Subscriptions
- Active Subscriptions
- Monthly Recurring Revenue (MRR)

### AddSubscriptionPlanDialog

Form dialog for creating and editing plans with accordion sections:

- Basic Information (name, tier, description, status, popular flag)
- Pricing (price, currency, billing cycle, trial period)
- Limits (properties, tenants, units, documents, users)
- Features (dynamic list with add/remove)

### ViewSubscriptionPlanDialog

Read-only view of plan details with:

- Complete plan information
- Organized sections
- Subscription count display
- Feature list

### PlansComparisonView

User-facing component for comparing plans:

- Card-based layout (responsive grid)
- Billing cycle toggle (monthly/quarterly/yearly)
- Highlight popular plan
- Feature comparison table
- Subscribe buttons
- Pricing display with cycle conversion

### CurrentSubscriptionCard

Displays user's current subscription:

- Subscription details (plan name, status, dates)
- Usage statistics with progress bars
- Renewal information
- Upgrade/Downgrade/Cancel options

### SubscribeDialog

Dialog for subscribing to a plan:

- Plan summary
- Billing cycle selection
- Pricing summary
- Payment method placeholder
- Terms acceptance checkbox
- Subscribe button

## Usage

### Accessing the Module

Navigate to `/subscription-plans` in the application. The menu item is already configured with icon `ri-vip-crown-line`.

### Admin: Creating a Plan

1. Click "Add Plan" button
2. Fill in the required fields in the form sections:
   - Basic Information: Name, tier, description, status
   - Pricing: Price, currency, billing cycle, trial period
   - Limits: Set limits for properties, tenants, units, documents, users
   - Features: Add features using the dynamic list
3. Mark as "Popular" if needed
4. Click "Save Now"

### Admin: Editing a Plan

1. Click the action menu (three dots) on a plan row
2. Select "Edit"
3. Modify the fields as needed
4. Click "Update"

### Admin: Viewing a Plan

1. Click the action menu on a plan row
2. Select "View"
3. Review all plan details including subscription count

### Admin: Activating/Deactivating a Plan

1. Click the action menu on a plan row
2. Select "Activate" or "Deactivate"
3. Plan status will be toggled immediately

### User: Viewing Plans

The PlansComparisonView component displays all active plans in a card layout with:

- Plan pricing and features
- Billing cycle selection
- Feature comparison table
- Subscribe buttons

### User: Subscribing to a Plan

1. Click "Subscribe" on a plan card
2. Select billing cycle if needed
3. Review plan summary and pricing
4. Accept terms and conditions
5. Click "Subscribe Now"

### User: Viewing Current Subscription

The CurrentSubscriptionCard shows:

- Current plan details
- Usage statistics with visual progress bars
- Renewal date
- Upgrade/Downgrade/Cancel options

## Filtering and Search

- **Status Filter**: Filter plans by status (active, inactive, archived)
- **Tier Filter**: Filter by tier (free, basic, pro, enterprise)
- **Billing Cycle Filter**: Filter by billing cycle (monthly, quarterly, yearly)
- **Global Search**: Search across all plan fields

## TypeScript Types

All types are defined in `src/types/subscription-plans/`:

**subscriptionPlanTypes.ts**:

- `PlanTier`: 'free' | 'basic' | 'pro' | 'enterprise'
- `BillingCycle`: 'monthly' | 'quarterly' | 'yearly'
- `PlanStatus`: 'active' | 'inactive' | 'archived'
- `SubscriptionPlan`: Main plan type
- `PlanFormDataType`: Form data type

**subscriptionTypes.ts**:

- `SubscriptionStatus`: 'active' | 'expired' | 'cancelled' | 'trial'
- `Subscription`: User subscription type
- `SubscriptionUsage`: Usage statistics type

## Mock Data

Sample plans included:

- **Free Plan**: 0 properties, 0 tenants, 5 documents, 1 user
- **Basic Plan**: 5 properties, 20 tenants, 15 units, 100 documents, 2 users - ₵29/month
- **Pro Plan**: 25 properties, 100 tenants, 75 units, 500 documents, 5 users - ₵99/month (Popular)
- **Enterprise Plan**: Unlimited everything - ₵299/month

## Current Status

All features implemented and working. The subscription plans module is accessible at `/subscription-plans` with full CRUD functionality for admin and plan comparison/subscription interfaces for users.

## Notes

- Currently using mock data for plans and subscriptions. Real data integration needed.
- Payment gateway integration is placeholder (needs backend integration).
- Subscription management API integration needed.
- Usage tracking data needs to be connected to actual resource counts.
- Menu item already exists in both vertical and horizontal menu data files with icon `ri-vip-crown-line`.
- All components follow existing codebase patterns and styling.

## Future Enhancements

- Payment gateway integration (Stripe, PayPal, etc.)
- Subscription management API endpoints
- Usage tracking and enforcement
- Email notifications for subscription events
- Plan upgrade/downgrade workflows with prorating
- Invoice generation for subscriptions
- Subscription analytics and reporting
- Plan recommendations based on usage
