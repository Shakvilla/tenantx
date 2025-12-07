# Settings Module Documentation

## Overview

The Settings module provides a comprehensive system for managing application settings in the TenantX application. It includes three main settings pages: Payment Settings, Notification Settings, and Company Settings. All settings integrate with backend APIs for persistence and real-time updates.

## Features

### Payment Settings

- **Payment Gateway Configuration**: Configure Redde Payment, Paystack, and Hubtel gateways
  - API keys and credentials management
  - Test/Live mode toggle per gateway
  - Gateway priority/order selection
  - Webhook URL configuration
- **Payment Methods**: Enable/disable payment methods (Cards, Bank Transfer, Mobile Money, Cash)
  - Method-specific gateway configuration
  - Mobile money provider selection (MTN, Vodafone, AirtelTigo)
- **Tax Settings**: Configure tax calculation and display
  - Default tax rate
  - Tax ID number (GRA)
  - Tax display options (inclusive/exclusive)
  - VAT/GST settings
- **Currency Settings**: Manage currency configuration
  - Default currency (GHS)
  - Supported currencies
  - Currency symbol position
  - Decimal places

### Notification Settings

- **SMTP Configuration**: Configure email server settings
  - SMTP host, port, encryption
  - Authentication credentials
  - From email and name
  - Test email functionality
- **Email Templates**: Manage email templates
  - Template selection (Invoice, Payment, Welcome, etc.)
  - Custom template editor
  - Template variables support
  - Reset to default functionality
- **Email Preferences**: Configure email notification preferences
  - Enable/disable notification types
  - Email frequency settings
  - Notification recipients
  - BCC/CC settings
- **SMS Settings (FROG)**: Configure SMS notifications
  - SMS provider status
  - API endpoint configuration
  - SMS notification preferences
  - Test SMS functionality
  - **Note**: SMS functionality is implemented on backend, frontend consumes API endpoints

### Company Settings

- **Basic Information**: Company basic details
  - Company name
  - Address (street, city, state, zip, country)
  - Contact information (phone, email, website)
  - Logo upload
  - Timezone
- **Advanced Information**: Company advanced details
  - Tax ID / VAT number
  - Registration number
  - Legal entity type
  - Business license number
  - Fiscal year start
  - Legal address (if different from business address)

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
│   │   ├── PaymentGatewaySettings.tsx                # Gateway configuration
│   │   ├── PaymentMethodsSettings.tsx                # Payment methods configuration
│   │   ├── TaxSettings.tsx                           # Tax configuration
│   │   └── CurrencySettings.tsx                      # Currency settings
│   ├── notification/
│   │   ├── NotificationSettingsContent.tsx            # Main notification settings component
│   │   ├── SMTPConfiguration.tsx                     # SMTP server settings
│   │   ├── EmailTemplatesSettings.tsx                # Email template management
│   │   ├── EmailPreferencesSettings.tsx              # Email notification preferences
│   │   └── SMSSettings.tsx                           # SMS settings (FROG)
│   └── company/
│       ├── CompanySettingsContent.tsx                 # Main company settings component
│       ├── BasicInformationSettings.tsx               # Company basic info
│       └── AdvancedInformationSettings.tsx            # Advanced info
├── types/settings/
│   ├── paymentTypes.ts                                # Payment settings types
│   ├── notificationTypes.ts                           # Notification settings types
│   └── companyTypes.ts                                # Company settings types
├── utils/settings/
│   └── api.ts                                         # API utility functions
└── docs/settings/
    └── settings-module.md                              # This documentation file
```

## Data Structure

### Payment Settings

- **Gateways**: Configuration for Redde Payment, Paystack, and Hubtel
  - API keys/credentials (provider-specific)
  - Test/Live mode
  - Webhook URLs
  - Priority/order
- **Payment Methods**: Array of enabled payment methods with gateway associations
- **Tax Settings**: Tax calculation configuration
- **Currency Settings**: Currency display and supported currencies

### Notification Settings

- **SMTP Config**: Email server configuration
- **Email Templates**: Array of customizable email templates
- **Email Preferences**: Notification preferences with frequency settings
- **SMS Settings**: FROG SMS provider configuration

### Company Settings

- **Basic Info**: Company name, address, contact, logo, timezone
- **Advanced Info**: Tax ID, registration, legal entity type, fiscal year

## Components

### Payment Settings Components

#### PaymentGatewaySettings

Tabbed interface for configuring payment gateways:
- Redde Payment: API key, Merchant ID, Merchant token
- Paystack: Public key, Secret key, Merchant code
- Hubtel: Client ID, Client secret, Merchant account number
- Each gateway has enable/disable, mode toggle, priority, and webhook URL

#### PaymentMethodsSettings

Enable/disable payment methods with gateway associations:
- Credit/Debit cards (Paystack, Hubtel)
- Bank transfer (Redde, Paystack, Hubtel)
- Mobile money (Redde, Hubtel) with provider selection
- Cash payments

#### TaxSettings

Tax configuration:
- Enable/disable tax calculation
- Default tax rate (%)
- Tax ID number
- Display option (inclusive/exclusive)
- VAT/GST toggles

#### CurrencySettings

Currency management:
- Default currency selection
- Supported currencies (multi-select)
- Currency symbol position
- Decimal places

### Notification Settings Components

#### SMTPConfiguration

SMTP server settings:
- Host, port, encryption (TLS/SSL/None)
- Username/password authentication
- From email and name
- Test email button

#### EmailTemplatesSettings

Email template management:
- Template type selection
- Subject and body editors
- Template variables display
- Save and reset functionality

#### EmailPreferencesSettings

Email notification preferences:
- Toggle notification types
- Email frequency (immediate/daily/weekly)
- Recipients, BCC, CC configuration

#### SMSSettings

SMS configuration (FROG provider):
- SMS provider status display
- API endpoint configuration
- SMS notification preferences
- Test SMS functionality
- **Backend Integration**: All operations call backend API endpoints

### Company Settings Components

#### BasicInformationSettings

Company basic information form:
- Company name
- Full address fields
- Contact information
- Logo upload with preview
- Timezone selection

#### AdvancedInformationSettings

Company advanced information:
- Tax ID and VAT number
- Registration number
- Legal entity type
- Business license
- Fiscal year start
- Optional legal address

## API Integration

All settings components use centralized API utilities from `src/utils/settings/api.ts`:

### Payment Settings API

- `paymentSettingsApi.get()`: Get payment settings
- `paymentSettingsApi.update(settings)`: Update payment settings

### Notification Settings API

- `notificationSettingsApi.get()`: Get notification settings
- `notificationSettingsApi.update(settings)`: Update notification settings
- `notificationSettingsApi.testEmail(to)`: Send test email

### SMS Settings API

- `smsSettingsApi.get()`: Get SMS configuration
- `smsSettingsApi.update(settings)`: Update SMS configuration
- `smsSettingsApi.test(phoneNumber)`: Send test SMS

### Company Settings API

- `companySettingsApi.get()`: Get company settings
- `companySettingsApi.update(settings)`: Update company settings

## Usage

### Accessing Settings

Navigate to settings pages via the menu:
- `/settings/payment` - Payment Settings
- `/settings/notification` - Notification Settings
- `/settings/company` - Company Settings

### Saving Settings

Each settings section has an independent "Save Settings" button:
1. Configure settings in the form
2. Click "Save Settings"
3. Loading state shows "Saving..."
4. Success/error notification appears
5. Settings are persisted via API

### Error Handling

All components include:
- Loading states during API calls
- Error handling with user-friendly messages
- Success notifications
- Snackbar alerts for feedback

## TypeScript Types

All types are defined in `src/types/settings/`:

**paymentTypes.ts**:
- `PaymentGateway`: 'redde' | 'paystack' | 'hubtel'
- `PaymentMethod`: 'card' | 'bank_transfer' | 'mobile_money' | 'cash'
- `MobileMoneyProvider`: 'mtn' | 'vodafone' | 'airteltigo'
- `PaymentSettings`: Complete payment settings type
- `TaxSettings`, `CurrencySettings`: Configuration types

**notificationTypes.ts**:
- `SMTPConfig`: SMTP configuration type
- `EmailTemplate`: Email template type
- `NotificationPreference`: Notification preference type
- `SMSSettings`: SMS settings type
- `NotificationSettings`: Complete notification settings type

**companyTypes.ts**:
- `CompanyBasicInfo`: Basic company information type
- `CompanyAdvancedInfo`: Advanced company information type
- `CompanySettings`: Complete company settings type

## Current Status

All settings pages implemented with:
- ✅ Full UI components for all settings sections
- ✅ API integration utilities
- ✅ Error handling and loading states
- ✅ Success/error notifications
- ✅ TypeScript type definitions
- ✅ Responsive design
- ✅ Form validation

## Notes

- All settings use backend API endpoints (defined in `src/utils/settings/api.ts`)
- API endpoints follow pattern: `/api/settings/{section}`
- SMS settings use FROG provider (backend implementation)
- Payment gateways: Redde Payment, Paystack, Hubtel
- All components follow existing codebase patterns and styling
- Menu items already configured in navigation data files

## Future Enhancements

- Settings import/export functionality
- Settings history/audit log
- Bulk settings operations
- Settings validation rules
- Settings templates/presets
- Advanced payment gateway features (webhook testing, etc.)
- Email template preview with sample data
- SMS delivery reports and analytics

