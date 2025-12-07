---
name: Settings Module Implementation
overview: "Implement the Settings module with three pages: Payment Settings (payment gateway, methods, tax, currency), Notification Settings (SMTP, email templates, preferences), and Company Settings (basic info, advanced info). Follow the existing recurring-invoice settings pattern."
todos:
  - id: create-types
    content: Create TypeScript type definitions for payment, notification, and company settings in src/types/settings/
    status: completed
  - id: payment-settings
    content: Implement Payment Settings page with PaymentGatewaySettings, PaymentMethodsSettings, TaxSettings, and CurrencySettings components
    status: completed
  - id: notification-settings
    content: Implement Notification Settings page with SMTPConfiguration, EmailTemplatesSettings, and EmailPreferencesSettings components
    status: completed
  - id: company-settings
    content: Implement Company Settings page with BasicInformationSettings and AdvancedInformationSettings components
    status: completed
  - id: documentation
    content: Create comprehensive documentation in docs/settings/settings-module.md following the subscription-plans module pattern
    status: completed
  - id: update-memory
    content: Update docs/memory.md with settings module implementation status
    status: completed
---

# Settings Module Implementation Plan

## Overview

Implement the Settings module with three new settings pages following the existing pattern from `recurring-invoice` settings. Each page will use the same structure: PageBanner, Grid layout, and Card-based sections.

**Important Notes:**

- Payment providers: **Redde Payment**, **Paystack**, and **Hubtel**
- SMS provider: **FROG** (backend implementation, frontend consumes API endpoints)
- All settings will integrate with backend APIs (endpoints to be consumed)

## File Structure

```
src/
├── app/(dashboard)/settings/
│   ├── payment/
│   │   └── page.tsx                                    # Payment settings route
│   ├── notification/
│   │   └── page.tsx                                   # Notification settings route
│   └── company/
│       └── page.tsx                                   # Company settings route
├── views/settings/
│   ├── payment/
│   │   ├── PaymentSettingsContent.tsx                # Main payment settings component
│   │   ├── PaymentGatewaySettings.tsx                # Gateway configuration (Redde, Paystack, Hubtel)
│   │   ├── PaymentMethodsSettings.tsx                # Payment methods configuration
│   │   ├── TaxSettings.tsx                           # Tax configuration
│   │   └── CurrencySettings.tsx                      # Currency settings
│   ├── notification/
│   │   ├── NotificationSettingsContent.tsx            # Main notification settings component
│   │   ├── SMTPConfiguration.tsx                     # SMTP server settings
│   │   ├── EmailTemplatesSettings.tsx                # Email template management
│   │   ├── EmailPreferencesSettings.tsx              # Email notification preferences
│   │   └── SMSSettings.tsx                           # SMS settings (FROG - backend integration)
│   └── company/
│       ├── CompanySettingsContent.tsx                 # Main company settings component
│       ├── BasicInformationSettings.tsx               # Company basic info (name, address, contact)
│       └── AdvancedInformationSettings.tsx            # Advanced info (tax ID, registration, legal)
├── types/settings/
│   ├── paymentTypes.ts                                # Payment settings types
│   ├── notificationTypes.ts                           # Notification settings types
│   └── companyTypes.ts                                # Company settings types
└── docs/settings/
    └── settings-module.md                              # Module documentation
```

## Implementation Details

### 1. Payment Settings (`/settings/payment`)

**Payment Providers:** Redde Payment, Paystack, Hubtel

**Page Components:**

- `PaymentSettingsContent.tsx` - Main container with Grid layout
- `PaymentGatewaySettings.tsx` - Configure payment gateways:
  - Gateway selection (Redde Payment, Paystack, Hubtel)
  - Provider-specific API keys/credentials:
    - **Redde Payment**: API key, Merchant ID, Merchant token
    - **Paystack**: Public key, Secret key, Merchant code
    - **Hubtel**: Client ID, Client secret, Merchant account number
  - Webhook URLs for each gateway
  - Test/Live mode toggle per gateway
  - Enable/disable specific gateways
  - Gateway priority/order selection
- `PaymentMethodsSettings.tsx` - Enable/disable payment methods:
  - Credit/Debit cards
  - Bank transfer
  - Mobile money (MTN, Vodafone, AirtelTigo)
  - Cash
  - Method-specific settings per gateway
- `TaxSettings.tsx` - Tax configuration:
  - Enable tax calculation
  - Default tax rate (%)
  - Tax ID number (Ghana Revenue Authority)
  - Tax display options (inclusive/exclusive)
  - VAT/GST settings
- `CurrencySettings.tsx` - Currency configuration:
  - Default currency (GHS - Ghana Cedi)
  - Supported currencies
  - Currency symbol position (before/after)
  - Decimal places (2 for GHS)

**Types** (`paymentTypes.ts`):

- `PaymentGateway`: 'redde' | 'paystack' | 'hubtel'
- `PaymentMethod`: 'card' | 'bank_transfer' | 'mobile_money' | 'cash'
- `MobileMoneyProvider`: 'mtn' | 'vodafone' | 'airteltigo'
- `PaymentSettings`: Complete payment settings type
- `TaxSettings`: Tax configuration type
- `CurrencySettings`: Currency configuration type
- `GatewayConfig`: Provider-specific configuration
  - `ReddeConfig`: API key, merchant ID, merchant token, webhook URL
  - `PaystackConfig`: Public key, secret key, merchant code, webhook URL
  - `HubtelConfig`: Client ID, client secret, merchant account, webhook URL

### 2. Notification Settings (`/settings/notification`)

**Page Components:**

- `NotificationSettingsContent.tsx` - Main container with Grid layout
- `SMTPConfiguration.tsx` - SMTP server settings:
  - SMTP host
  - SMTP port
  - Encryption (TLS/SSL/None)
  - Authentication (username/password)
  - From email and name
  - Test email functionality (send test email button)
- `EmailTemplatesSettings.tsx` - Email template management:
  - Template selection (Invoice, Payment, Welcome, Tenant Notice, etc.)
  - Template preview
  - Custom template editor (rich text or HTML)
  - Template variables list ({{tenant_name}}, {{amount}}, etc.)
  - Save/Reset template functionality
- `EmailPreferencesSettings.tsx` - Email notification preferences:
  - Enable/disable notification types:
    - Invoice sent
    - Payment received
    - Payment reminder
    - Tenant welcome
    - Maintenance request
  - Email frequency settings
  - Notification recipients (admin emails)
  - BCC/CC settings
- `SMSSettings.tsx` - SMS configuration (FROG provider):
  - **Note:** FROG SMS is implemented on backend, this UI consumes API endpoints
  - Display current SMS configuration (read-only or editable based on backend)
  - SMS provider status (connected/disconnected)
  - API endpoint configuration (if configurable from frontend)
  - SMS notification preferences:
    - Enable/disable SMS notifications
    - SMS notification types (same as email)
    - Phone number validation
  - Test SMS functionality (calls backend endpoint)
  - **Backend Integration:** All SMS operations will call backend API endpoints

**Types** (`notificationTypes.ts`):

- `SMTPConfig`: SMTP configuration type
- `EmailTemplate`: Email template type
- `TemplateVariable`: Available template variable type
- `NotificationPreference`: Notification preference type
- `SMSSettings`: SMS settings type (for FROG integration)
- `NotificationSettings`: Complete notification settings type
- **API Endpoints (to be consumed):**
  - `GET /api/settings/sms/config` - Get SMS configuration
  - `POST /api/settings/sms/config` - Update SMS configuration
  - `POST /api/settings/sms/test` - Send test SMS

### 3. Company Settings (`/settings/company`)

**Page Components:**

- `CompanySettingsContent.tsx` - Main container with Grid layout
- `BasicInformationSettings.tsx` - Basic company information:
  - Company name
  - Address (street, city, state, zip, country)
  - Contact information (phone, email, website)
  - Logo upload
  - Timezone
- `AdvancedInformationSettings.tsx` - Advanced company information:
  - Tax ID / VAT number
  - Registration number
  - Legal entity type
  - Business license number
  - Fiscal year start
  - Legal address (if different)

**Types** (`companyTypes.ts`):

- `CompanyBasicInfo`: Basic company information type
- `CompanyAdvancedInfo`: Advanced company information type
- `CompanySettings`: Complete company settings type

## Component Patterns

All settings components will follow the existing pattern from `RecurringSettingsContent`:

1. **Card Structure:**

   - `Card` with `CardHeader` (title + subheader)
   - `Divider`
   - `CardContent` with form fields
   - Save button at bottom of each card

2. **Form Fields:**

   - Use MUI components: `TextField`, `Select`, `Switch`, `FormControlLabel`
   - Use `Grid2` for responsive layouts
   - Include helper text for clarity
   - Form validation (client-side)

3. **State Management:**

   - Local state with `useState` for each section
   - Save handlers with TODO comments (backend integration later)
   - Console logging for now (replace with API calls later)

## Documentation

Create `/docs/settings/settings-module.md` with:

- Overview of all settings pages
- Feature descriptions
- File structure
- Component details
- Type definitions
- Usage instructions
- Future enhancements (API integration, validation, etc.)

## Implementation Steps

1. Create TypeScript types for all three settings modules
2. Implement Payment Settings page and components
3. Implement Notification Settings page and components
4. Implement Company Settings page and components
5. Create documentation file
6. Update memory.md with settings module status

## Notes

- All settings use mock data/state for now (backend integration needed later)
- Follow existing codebase patterns and styling
- Use RemixIcon icons (`ri-*`) for consistency
- All pages accessible via existing menu structure (already configured)
- Each settings section is independent and can be saved separately