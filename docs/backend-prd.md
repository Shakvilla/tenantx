# Backend API Product Requirements Document (PRD)

## TenantX - Multi-Tenant Property Management SaaS

**Version:** 2.0.0  
**Last Updated:** January 2026  
**Status:** Draft

---

## 1. Executive Summary

### 1.1 Purpose

This PRD defines the requirements for building a decoupled, scalable backend API for TenantX, a multi-tenant property management SaaS platform. The backend will serve both web (Next.js Server Actions) and mobile/external clients through a unified RESTful API.

### 1.2 Key Objectives

- **Decoupled Architecture**: Complete separation between frontend and backend
- **Multi-Tenancy**: Shared database schema with tenant isolation enforced at all layers
- **Scalability**: Support for thousands of tenants and millions of records
- **Security**: Enterprise-grade security with RLS, authentication, and authorization
- **Performance**: Sub-200ms API response times for standard operations
- **Extensibility**: Easy to extend and modify without frontend refactoring

### 1.3 Technology Stack

#### Backend
- **Language**: Java 21 (LTS)
- **Framework**: Spring Boot 3.x with Spring Security
- **Database**: PostgreSQL 16+
- **ORM**: Spring Data JPA / Hibernate
- **Authentication**: JWT tokens with Spring Security
- **Authorization**: Role-based access with tenant isolation
- **Storage**: AWS S3 / MinIO for documents and files
- **Caching**: Redis for session and query caching
- **Background Jobs**: Spring Scheduler + Quartz
- **API Documentation**: OpenAPI 3.0 / Swagger UI
- **Build Tool**: Maven / Gradle

#### Frontend (Existing)
- **Framework**: Next.js 15 (App Router)
- **HTTP Client**: Axios
- **State Management**: React Context

---

## 2. Architecture Overview

### 2.1 System Architecture

```
┌─────────────────┐         ┌─────────────────┐
│   Web Frontend  │         │  Mobile/External │
│  (Next.js App)  │         │      Clients     │
└────────┬─────────┘         └────────┬─────────┘
         │                            │
         │ HTTP/REST                  │ HTTP/REST
         │ Bearer Token               │ Bearer Token
         │                            │
         └────────────┬───────────────┘
                      │
         ┌────────────▼───────────────┐
         │   API Gateway/Middleware   │
         │  - Authentication          │
         │  - Tenant Resolution      │
         │  - Rate Limiting          │
         │  - Request Validation     │
         └────────────┬───────────────┘
                      │
         ┌────────────▼───────────────┐
         │     Service Layer           │
         │  - Business Logic          │
         │  - Data Validation         │
         │  - Tenant Isolation        │
         └────────────┬───────────────┘
                      │
         ┌────────────▼───────────────┐
         │   Data Access Layer         │
         │  - Repository Pattern      │
         │  - Query Builders          │
         │  - RLS Enforcement         │
         └────────────┬───────────────┘
                      │
          ┌────────────▼───────────────┐
          │   PostgreSQL Database      │
          │  - Shared Schema           │
          │  - Tenant Isolation        │
          │  - Optimized Indexes       │
          └────────────────────────────┘
                      │
          ┌───────────┴────────────────┐
          │                            │
     ┌────▼────┐                 ┌─────▼────┐
     │  Redis  │                 │ S3/MinIO │
     │ Caching │                 │ Storage  │
     └─────────┘                 └──────────┘
```

### 2.2 API Design Principles

1. **RESTful Design**: Follow REST conventions with proper HTTP methods and status codes
2. **Versioning**: All APIs under `/api/v1/` prefix
3. **Consistent Responses**: Standardized response format across all endpoints
4. **Pagination**: All list endpoints support cursor-based pagination
5. **Filtering & Sorting**: Query parameters for filtering, sorting, and searching
6. **Error Handling**: Consistent error response format with error codes
7. **Documentation**: OpenAPI/Swagger documentation for all endpoints

### 2.3 Multi-Tenant Architecture

#### 2.3.1 Tenant Isolation Strategy

- **Shared Database Schema**: Single PostgreSQL database with `tenant_id` column in all tenant-scoped tables
- **Application-Level Filtering**: All queries explicitly filter by `tenant_id` via JPA Specifications/QueryDSL
- **Tenant Context**: Set via Spring `ThreadLocal` context in request interceptor
- **Repository Pattern**: Base repository enforces tenant filtering on all queries

#### 2.3.2 Tenant Resolution

Tenants can be resolved from:

1. **JWT Claims**: `tenant_id` claim in authentication token
2. **Subdomain**: Extract tenant from subdomain (e.g., `acme.tenantx.com`)
3. **Header**: `X-Tenant-ID` header (for API clients)
4. **Organization Membership**: User's organization membership table

#### 2.3.3 Tenant Context Flow

```
Request → Filter/Interceptor → Extract Tenant ID → Verify Access → Set ThreadLocal Context → Service Layer → Repository (Tenant Filter)
```

---

## 3. API Specifications

### 3.1 Base URL Structure

```
Web (Server Actions): Internal calls, no base URL needed
API (Route Handlers): /api/v1/{resource}
```

### 3.2 Authentication

#### 3.2.1 Authentication Flow

- **Method**: JWT Bearer Token authentication
- **Token Issuer**: Spring Security with `jjwt` library
- **Token Contains**: `userId`, `tenantId`, `role`, `permissions`
- **Token Expiry**: Access token (15 min), Refresh token (7 days)

#### 3.2.2 Request Authentication

- **Header**: `Authorization: Bearer <jwt_token>`
- **Validation**: JWT signature verification + claims extraction
- **Tenant Resolution**: From JWT `tenant_id` claim or `X-Tenant-ID` header
- **User Context**: Stored in Spring `SecurityContextHolder`

### 3.3 Standard Response Format

#### Success Response

```typescript
{
  success: true,
  data: T | T[] | null,
  meta?: {
    pagination?: {
      page: number,
      pageSize: number,
      total: number,
      totalPages: number,
      hasNext: boolean,
      hasPrev: boolean,
      cursor?: string
    },
    filters?: Record<string, any>,
    sort?: {
      field: string,
      order: 'asc' | 'desc'
    }
  }
}
```

#### Error Response

```typescript
{
  success: false,
  error: {
    code: string,           // Error code (e.g., 'VALIDATION_ERROR', 'NOT_FOUND')
    message: string,        // Human-readable message
    details?: any,          // Additional error details
    field?: string          // Field name for validation errors
  }
}
```

### 3.4 HTTP Status Codes

- `200 OK`: Successful GET, PUT, PATCH requests
- `201 Created`: Successful POST requests
- `204 No Content`: Successful DELETE requests
- `400 Bad Request`: Validation errors, malformed requests
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Authenticated but insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict (e.g., duplicate entry)
- `422 Unprocessable Entity`: Business logic validation errors
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server errors

---

## 4. Core Modules & Endpoints

### 4.1 Authentication & Authorization

#### 4.1.1 Endpoints

**POST** `/api/v1/auth/login`

- **Description**: Authenticate user and return JWT token
- **Request Body**:
  ```typescript
  {
    email: string,
    password: string,
    tenantId?: string  // Optional: for multi-tenant login
  }
  ```
- **Response**: `{ success: true, data: { token: string, user: User, tenant: Tenant } }`

**POST** `/api/v1/auth/register`

- **Description**: Register new user (may create tenant)
- **Request Body**:
  ```typescript
  {
    email: string,
    password: string,
    name: string,
    tenantName?: string  // If creating new tenant
  }
  ```

**POST** `/api/v1/auth/refresh`

- **Description**: Refresh JWT token
- **Headers**: `Authorization: Bearer <refresh_token>`

**POST** `/api/v1/auth/logout`

- **Description**: Invalidate session/token

**GET** `/api/v1/auth/me`

- **Description**: Get current authenticated user
- **Response**: `{ success: true, data: { user: User, tenants: Tenant[] } }`

#### 4.1.2 Authorization Levels

- **Super Admin**: System-wide access (for platform admins)
- **Tenant Admin**: Full access within tenant
- **Tenant User**: Limited access within tenant
- **Tenant Viewer**: Read-only access within tenant

---

### 4.2 Tenants Module

#### 4.2.1 Data Model

```typescript
interface Tenant {
  id: string // UUID
  tenant_id: string // Tenant ID (for multi-tenancy)
  firstName: string
  lastName: string
  email: string
  phone: string
  avatar?: string
  status: 'active' | 'inactive' | 'pending'
  propertyId?: string
  unitId?: string
  unitNo?: string
  moveInDate?: Date
  moveOutDate?: Date
  emergencyContact?: {
    name: string
    phone: string
    relationship: string
  }
  documents?: Document[]
  createdAt: Date
  updatedAt: Date
}
```

#### 4.2.2 Endpoints

**GET** `/api/v1/tenants`

- **Description**: List all tenants (paginated, filtered)
- **Query Params**: `page`, `pageSize`, `search`, `status`, `propertyId`, `sort`
- **Response**: `{ success: true, data: Tenant[], meta: { pagination } }`

**GET** `/api/v1/tenants/:id`

- **Description**: Get tenant by ID
- **Response**: `{ success: true, data: Tenant }`

**POST** `/api/v1/tenants`

- **Description**: Create new tenant
- **Request Body**: `Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>`
- **Response**: `{ success: true, data: Tenant }`

**PUT** `/api/v1/tenants/:id`

- **Description**: Update tenant (full update)
- **Request Body**: `Partial<Tenant>`
- **Response**: `{ success: true, data: Tenant }`

**PATCH** `/api/v1/tenants/:id`

- **Description**: Partial update tenant
- **Request Body**: `Partial<Tenant>`
- **Response**: `{ success: true, data: Tenant }`

**DELETE** `/api/v1/tenants/:id`

- **Description**: Soft delete tenant
- **Response**: `{ success: true, data: null }`

**GET** `/api/v1/tenants/:id/history`

- **Description**: Get tenant history (moves, payments, etc.)
- **Response**: `{ success: true, data: TenantHistory[] }`

**GET** `/api/v1/tenants/stats\*\*

- **Description**: Get tenant statistics
- **Response**: `{ success: true, data: { total, active, inactive, pending } }`

---

### 4.3 Properties Module

#### 4.3.1 Data Model

```typescript
interface Property {
  id: string
  tenant_id: string
  name: string
  description?: string
  
  // Location (expanded from frontend form)
  address: {
    street: string
    city: string
    state: string      // Maps to 'region' in frontend
    zip: string
    country: string
  }
  region: string       // Ghana region (Greater Accra, Ashanti, etc.)
  district: string     // District within region
  gpsCode?: string     // Ghana GPS address code
  
  // Property classification
  type: 'residential' | 'commercial' | 'mixed' | 'house' | 'apartment'
  ownership: 'own' | 'lease'
  condition: 'new' | 'good' | 'fair' | 'poor'
  
  // Property features (from frontend form - property level)
  bedrooms?: number
  bathrooms?: number
  rooms?: number
  amenities?: string[]
  
  // Unit counts (auto-calculated)
  totalUnits: number
  occupiedUnits: number
  
  // Status
  status: 'active' | 'inactive' | 'maintenance'
  
  // Media
  images?: string[]
  thumbnailIndex?: number   // Index of thumbnail image
  documents?: Document[]
  
  // Financial
  purchasePrice?: number
  currentValue?: number
  currency?: string         // Default: 'GHS'
  
  // Metadata
  metadata?: Record<string, unknown>
  
  createdAt: Date
  updatedAt: Date
}

interface Unit {
  id: string
  tenant_id: string
  propertyId: string
  unitNo: string
  floor?: number
  
  // Unit type
  type: 'studio' | '1br' | '2br' | '3br' | '4br+' | 'commercial' | 'office' | 'retail'
  
  // Size & features
  sizeSqft?: number
  bedrooms?: number
  bathrooms?: number
  amenities?: string[]
  features?: Record<string, unknown>
  
  // Financial
  rent: number
  deposit?: number
  currency?: string         // Default: 'GHS'
  
  // Status (note: 'vacant' in frontend maps to 'available' in DB)
  status: 'available' | 'occupied' | 'maintenance' | 'reserved'
  
  // Current tenant
  tenantRecordId?: string
  
  // Media
  images?: string[]
  
  // Metadata
  metadata?: Record<string, unknown>
  
  createdAt: Date
  updatedAt: Date
}
```


#### 4.3.2 Endpoints

**Properties:**

- **GET** `/api/v1/properties` - List properties
- **GET** `/api/v1/properties/:id` - Get property
- **POST** `/api/v1/properties` - Create property
- **PUT** `/api/v1/properties/:id` - Update property
- **DELETE** `/api/v1/properties/:id` - Delete property
- **GET** `/api/v1/properties/stats` - Property statistics

**Units:**

- **GET** `/api/v1/properties/:propertyId/units` - List units
- **GET** `/api/v1/units/:id` - Get unit
- **POST** `/api/v1/properties/:propertyId/units` - Create unit
- **PUT** `/api/v1/units/:id` - Update unit
- **DELETE** `/api/v1/units/:id` - Delete unit
- **GET** `/api/v1/units/available` - List available units

---

### 4.4 Agreements Module

#### 4.4.1 Data Model

```typescript
interface Agreement {
  id: string
  tenant_id: string
  agreementNumber: string // Unique: AGR-001
  type: 'lease' | 'contract' | 'other'
  status: 'active' | 'expired' | 'pending' | 'terminated'
  tenantId: string
  propertyId: string
  unitId: string
  startDate: Date
  endDate: Date
  signedDate?: Date
  expiryDate?: Date
  amount: number
  rent: number
  securityDeposit: number
  lateFee: number
  paymentFrequency: 'monthly' | 'quarterly' | 'yearly' | 'one-time'
  terms?: string
  conditions?: string
  duration?: string
  renewalOptions?: string
  documentUrl?: string
  attachments?: string[]
  createdAt: Date
  updatedAt: Date
}
```

#### 4.4.2 Endpoints

- **GET** `/api/v1/agreements` - List agreements (with filters)
- **GET** `/api/v1/agreements/:id` - Get agreement
- **POST** `/api/v1/agreements` - Create agreement
- **PUT** `/api/v1/agreements/:id` - Update agreement
- **DELETE** `/api/v1/agreements/:id` - Delete agreement
- **GET** `/api/v1/agreements/stats` - Agreement statistics
- **POST** `/api/v1/agreements/:id/sign` - Sign agreement
- **GET** `/api/v1/agreements/:id/download` - Download agreement document

---

### 4.5 Billing & Invoices Module

#### 4.5.1 Data Model

```typescript
interface Invoice {
  id: string
  tenant_id: string
  invoiceNumber: string // Unique: INV-001
  tenantId: string
  propertyId?: string
  unitId?: string
  agreementId?: string
  type: 'rent' | 'utility' | 'maintenance' | 'other'
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  issueDate: Date
  dueDate: Date
  paidDate?: Date
  items: InvoiceItem[]
  subtotal: number
  tax: number
  discount: number
  total: number
  currency: string
  notes?: string
  paymentMethod?: 'card' | 'bank_transfer' | 'mobile_money' | 'cash'
  paymentGateway?: 'redde' | 'paystack' | 'hubtel'
  createdAt: Date
  updatedAt: Date
}

interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  amount: number
  tax?: number
}

interface Payment {
  id: string
  tenant_id: string
  invoiceId: string
  amount: number
  currency: string
  method: 'card' | 'bank_transfer' | 'mobile_money' | 'cash'
  gateway?: 'redde' | 'paystack' | 'hubtel'
  transactionId?: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  paidAt?: Date
  metadata?: Record<string, any>
  createdAt: Date
}
```

#### 4.5.2 Endpoints

**Invoices:**

- **GET** `/api/v1/invoices` - List invoices
- **GET** `/api/v1/invoices/:id` - Get invoice
- **POST** `/api/v1/invoices` - Create invoice
- **PUT** `/api/v1/invoices/:id` - Update invoice
- **DELETE** `/api/v1/invoices/:id` - Delete invoice
- **POST** `/api/v1/invoices/:id/send` - Send invoice via email
- **GET** `/api/v1/invoices/:id/download` - Download invoice PDF
- **GET** `/api/v1/invoices/stats` - Invoice statistics

**Payments:**

- **GET** `/api/v1/payments` - List payments
- **GET** `/api/v1/payments/:id` - Get payment
- **POST** `/api/v1/payments` - Record payment
- **POST** `/api/v1/payments/:id/refund` - Refund payment
- **GET** `/api/v1/invoices/:invoiceId/payments` - Get invoice payments

**Payment Processing:**

- **POST** `/api/v1/payments/process` - Process payment via gateway
- **POST** `/api/v1/payments/webhooks/:gateway` - Webhook endpoints for gateways

---

### 4.6 Expenses Module

#### 4.6.1 Data Model

```typescript
interface Expense {
  id: string
  tenant_id: string
  category: string // From expense categories
  description: string
  amount: number
  currency: string
  date: Date
  propertyId?: string
  unitId?: string
  vendor?: string
  receiptUrl?: string
  tags?: string[]
  status: 'pending' | 'approved' | 'rejected'
  approvedBy?: string
  approvedAt?: Date
  createdAt: Date
  updatedAt: Date
}

interface ExpenseCategory {
  id: string
  tenant_id: string
  name: string
  description?: string
  isActive: boolean
  createdAt: Date
}
```

#### 4.6.2 Endpoints

**Expenses:**

- **GET** `/api/v1/expenses` - List expenses
- **GET** `/api/v1/expenses/:id` - Get expense
- **POST** `/api/v1/expenses` - Create expense
- **PUT** `/api/v1/expenses/:id` - Update expense
- **DELETE** `/api/v1/expenses/:id` - Delete expense
- **GET** `/api/v1/expenses/stats` - Expense statistics
- **POST** `/api/v1/expenses/:id/approve` - Approve expense
- **POST** `/api/v1/expenses/:id/reject` - Reject expense

**Categories:**

- **GET** `/api/v1/expenses/categories` - List categories
- **POST** `/api/v1/expenses/categories` - Create category
- **PUT** `/api/v1/expenses/categories/:id` - Update category
- **DELETE** `/api/v1/expenses/categories/:id` - Delete category

---

### 4.7 Maintenance Module

#### 4.7.1 Data Model

```typescript
interface MaintenanceRequest {
  id: string
  tenant_id: string
  requestNumber: string // Unique: MNT-001
  title: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  propertyId: string
  unitId?: string
  tenantId?: string
  maintainerId?: string
  requestedBy: string
  assignedTo?: string
  scheduledDate?: Date
  completedDate?: Date
  images?: string[]
  cost?: number
  notes?: string
  createdAt: Date
  updatedAt: Date
}

interface Maintainer {
  id: string
  tenant_id: string
  name: string
  email: string
  phone: string
  specialization: string[]
  status: 'active' | 'inactive'
  rating?: number
  totalJobs?: number
  createdAt: Date
  updatedAt: Date
}
```

#### 4.7.2 Endpoints

**Maintenance Requests:**

- **GET** `/api/v1/maintenance/requests` - List requests
- **GET** `/api/v1/maintenance/requests/:id` - Get request
- **POST** `/api/v1/maintenance/requests` - Create request
- **PUT** `/api/v1/maintenance/requests/:id` - Update request
- **PATCH** `/api/v1/maintenance/requests/:id/assign` - Assign maintainer
- **PATCH** `/api/v1/maintenance/requests/:id/status` - Update status
- **GET** `/api/v1/maintenance/requests/stats` - Request statistics

**Maintainers:**

- **GET** `/api/v1/maintenance/maintainers` - List maintainers
- **GET** `/api/v1/maintenance/maintainers/:id` - Get maintainer
- **POST** `/api/v1/maintenance/maintainers` - Create maintainer
- **PUT** `/api/v1/maintenance/maintainers/:id` - Update maintainer
- **DELETE** `/api/v1/maintenance/maintainers/:id` - Delete maintainer

---

### 4.8 Documents Module

#### 4.8.1 Data Model

```typescript
interface Document {
  id: string
  tenant_id: string
  name: string
  type: 'agreement' | 'invoice' | 'receipt' | 'id' | 'other'
  category?: string
  fileUrl: string
  fileSize: number
  mimeType: string
  relatedTo?: {
    type: 'tenant' | 'property' | 'agreement' | 'invoice'
    id: string
  }
  status: 'pending' | 'approved' | 'rejected'
  uploadedBy: string
  reviewedBy?: string
  reviewedAt?: Date
  notes?: string
  tags?: string[]
  createdAt: Date
  updatedAt: Date
}
```

#### 4.8.2 Endpoints

- **GET** `/api/v1/documents` - List documents
- **GET** `/api/v1/documents/:id` - Get document
- **POST** `/api/v1/documents` - Upload document
- **DELETE** `/api/v1/documents/:id` - Delete document
- **POST** `/api/v1/documents/:id/approve` - Approve document
- **POST** `/api/v1/documents/:id/reject` - Reject document
- **GET** `/api/v1/documents/:id/download` - Download document

---

### 4.9 Communication Module

#### 4.9.1 Data Model

```typescript
interface Communication {
  id: string
  tenant_id: string
  type: 'message' | 'notice' | 'announcement'
  subject: string
  content: string
  from: {
    userId: string
    name: string
    email: string
  }
  to: {
    type: 'tenant' | 'property' | 'all'
    ids: string[]
  }
  status: 'draft' | 'sent' | 'read'
  sentAt?: Date
  readAt?: Date
  attachments?: string[]
  priority: 'low' | 'normal' | 'high'
  createdAt: Date
  updatedAt: Date
}

interface MessageThread {
  id: string
  tenant_id: string
  participants: string[]
  subject: string
  lastMessage?: Communication
  unreadCount: number
  createdAt: Date
  updatedAt: Date
}
```

#### 4.9.2 Endpoints

- **GET** `/api/v1/communications` - List communications
- **GET** `/api/v1/communications/:id` - Get communication
- **POST** `/api/v1/communications` - Send communication
- **POST** `/api/v1/communications/:id/reply` - Reply to communication
- **PATCH** `/api/v1/communications/:id/read` - Mark as read
- **GET** `/api/v1/communications/threads` - List message threads
- **GET** `/api/v1/communications/threads/:id` - Get thread messages

---

### 4.10 Reports Module

#### 4.10.1 Report Types

- **Earnings Report**: Revenue, payments, outstanding invoices
- **Expenses Report**: Expense breakdown by category, property, time period
- **Maintenance Report**: Maintenance requests, costs, maintainer performance
- **Tenants Report**: Tenant statistics, occupancy rates, turnover

#### 4.10.2 Endpoints

- **GET** `/api/v1/reports/earnings` - Generate earnings report
- **GET** `/api/v1/reports/expenses` - Generate expenses report
- **GET** `/api/v1/reports/maintenance` - Generate maintenance report
- **GET** `/api/v1/reports/tenants` - Generate tenants report
- **GET** `/api/v1/reports/:type/export` - Export report (PDF, Excel, CSV)

**Query Parameters:**

- `startDate`: Start date for report period
- `endDate`: End date for report period
- `propertyId`: Filter by property
- `format`: Export format (`pdf`, `excel`, `csv`)

---

### 4.11 Settings Module

#### 4.11.1 Settings Categories

**Company Settings:**

- Basic information (name, address, contact)
- Advanced information (tax ID, registration, legal entity)

**Payment Settings:**

- Payment gateway configuration (Redde, Paystack, Hubtel)
- Payment methods (cards, bank transfer, mobile money, cash)
- Tax settings (rate, display options)
- Currency settings

**Notification Settings:**

- SMTP configuration
- Email templates
- Email preferences
- SMS settings (FROG provider)

**Recurring Invoice Settings:**

- Auto-generation settings
- Frequency settings
- Notification preferences
- Default invoice settings

#### 4.11.2 Endpoints

- **GET** `/api/v1/settings/company` - Get company settings
- **PUT** `/api/v1/settings/company` - Update company settings
- **GET** `/api/v1/settings/payment` - Get payment settings
- **PUT** `/api/v1/settings/payment` - Update payment settings
- **GET** `/api/v1/settings/notification` - Get notification settings
- **PUT** `/api/v1/settings/notification` - Update notification settings
- **POST** `/api/v1/settings/notification/test-email` - Send test email
- **POST** `/api/v1/settings/notification/test-sms` - Send test SMS
- **GET** `/api/v1/settings/recurring-invoice` - Get recurring invoice settings
- **PUT** `/api/v1/settings/recurring-invoice` - Update recurring invoice settings

---

### 4.12 Subscription Plans Module

#### 4.12.1 Data Model

```typescript
interface SubscriptionPlan {
  id: string
  tenant_id: string // NULL for platform-wide plans
  name: string
  tier: 'free' | 'basic' | 'pro' | 'enterprise'
  description: string
  status: 'active' | 'inactive' | 'archived'
  isPopular: boolean
  price: string // "0" for free
  currency: string
  billingCycle: 'monthly' | 'quarterly' | 'yearly'
  trialPeriod: number // Days
  limits: {
    maxProperties: number // -1 for unlimited
    maxTenants: number
    maxUnits: number
    maxDocuments: number
    maxUsers: number
  }
  features: string[]
  createdAt: Date
  updatedAt: Date
}

interface Subscription {
  id: string
  tenant_id: string
  userId: string
  planId: string
  status: 'active' | 'expired' | 'cancelled' | 'trial'
  startDate: Date
  endDate: Date
  trialEndDate?: Date
  autoRenew: boolean
  billingCycle: 'monthly' | 'quarterly' | 'yearly'
  amount: number
  currency: string
  createdAt: Date
  updatedAt: Date
}
```

#### 4.12.2 Endpoints

**Plans:**

- **GET** `/api/v1/subscription-plans` - List plans (filtered by tenant or platform)
- **GET** `/api/v1/subscription-plans/:id` - Get plan
- **POST** `/api/v1/subscription-plans` - Create plan (admin only)
- **PUT** `/api/v1/subscription-plans/:id` - Update plan
- **DELETE** `/api/v1/subscription-plans/:id` - Delete plan
- **GET** `/api/v1/subscription-plans/stats` - Plan statistics

**Subscriptions:**

- **GET** `/api/v1/subscriptions` - List subscriptions
- **GET** `/api/v1/subscriptions/:id` - Get subscription
- **POST** `/api/v1/subscriptions` - Create subscription
- **PUT** `/api/v1/subscriptions/:id` - Update subscription
- **POST** `/api/v1/subscriptions/:id/cancel` - Cancel subscription
- **GET** `/api/v1/subscriptions/current` - Get current tenant subscription
- **GET** `/api/v1/subscriptions/:id/usage` - Get subscription usage

---

### 4.13 Members Module (Agents & Customers)

#### 4.13.1 Data Model

```typescript
interface Agent {
  id: string
  tenant_id: string
  name: string
  email: string
  phone: string
  role: 'agent' | 'manager' | 'admin'
  status: 'active' | 'inactive'
  permissions: string[]
  avatar?: string
  createdAt: Date
  updatedAt: Date
}

interface Customer {
  id: string
  tenant_id: string
  name: string
  email: string
  phone: string
  type: 'individual' | 'business'
  status: 'active' | 'inactive'
  avatar?: string
  createdAt: Date
  updatedAt: Date
}
```

#### 4.13.2 Endpoints

**Agents:**

- **GET** `/api/v1/members/agents` - List agents
- **GET** `/api/v1/members/agents/:id` - Get agent
- **POST** `/api/v1/members/agents` - Create agent
- **PUT** `/api/v1/members/agents/:id` - Update agent
- **DELETE** `/api/v1/members/agents/:id` - Delete agent

**Customers:**

- **GET** `/api/v1/members/customers` - List customers
- **GET** `/api/v1/members/customers/:id` - Get customer
- **POST** `/api/v1/members/customers` - Create customer
- **PUT** `/api/v1/members/customers/:id` - Update customer
- **DELETE** `/api/v1/members/customers/:id` - Delete customer

---

### 4.14 Landlords Module (Property Owners)

#### 4.14.1 Data Model

```typescript
interface Landlord {
  id: string
  tenant_id: string
  
  // Type
  type: 'individual' | 'business'
  
  // Personal Information (for individuals)
  firstName?: string
  lastName?: string
  
  // Business Information (for businesses)
  businessName?: string
  registrationNumber?: string
  taxId?: string
  
  // Contact Information
  email: string
  phone: string
  alternatePhone?: string
  
  // Address
  address?: LandlordAddress
  
  // Identification
  idType?: 'ghana_card' | 'passport' | 'drivers_license' | 'voter_id'
  idNumber?: string
  idExpiryDate?: Date
  
  // Bank Account (for disbursements)
  bankAccount?: LandlordBankAccount
  
  // Mobile Money (Ghana-specific)
  mobileMoneyProvider?: 'mtn' | 'vodafone' | 'airteltigo'
  mobileMoneyNumber?: string
  
  // Status
  status: 'active' | 'inactive' | 'pending' | 'suspended'
  
  // Commission/Fee Settings
  commissionRate?: number  // Percentage taken by property manager
  commissionType?: 'percentage' | 'fixed'
  
  // Documents
  documents?: Document[]
  avatar?: string
  
  // Statistics (computed)
  totalProperties?: number
  totalUnits?: number
  totalEarnings?: number
  
  // Notes
  notes?: string
  
  // Metadata
  metadata?: Record<string, unknown>
  
  createdAt: Date
  updatedAt: Date
}

interface LandlordAddress {
  street: string
  city: string
  region: string  // Ghana region
  district?: string
  gpsCode?: string  // Ghana GPS address code
  country: string
}

interface LandlordBankAccount {
  bankName: string
  bankCode?: string
  accountNumber: string
  accountName: string
  branchName?: string
  swiftCode?: string
}

interface LandlordPropertyAssignment {
  id: string
  tenant_id: string
  landlordId: string
  propertyId: string
  
  // Assignment details
  ownershipType: 'full' | 'partial'
  ownershipPercentage?: number  // For partial ownership
  
  // Revenue sharing
  revenueSharePercentage: number  // Landlord's share of property income
  
  // Assignment period
  startDate: Date
  endDate?: Date
  
  // Status
  status: 'active' | 'inactive' | 'pending'
  
  // Agreement
  agreementDocumentId?: string
  
  createdAt: Date
  updatedAt: Date
}

interface LandlordEarning {
  id: string
  tenant_id: string
  landlordId: string
  propertyId?: string
  
  // Period
  periodStart: Date
  periodEnd: Date
  
  // Amounts
  grossAmount: number
  commissionAmount: number
  netAmount: number
  currency: string
  
  // Payment
  status: 'pending' | 'processing' | 'paid' | 'failed'
  paidAt?: Date
  paymentMethod?: 'bank_transfer' | 'mobile_money' | 'cheque' | 'cash'
  transactionReference?: string
  
  // Details
  breakdown?: {
    rentIncome: number
    otherIncome: number
    expenses: number
    maintenanceCosts: number
  }
  
  createdAt: Date
}

interface LandlordStatement {
  id: string
  tenant_id: string
  landlordId: string
  
  // Period
  statementNumber: string  // Unique: STM-001
  periodStart: Date
  periodEnd: Date
  
  // Summary
  openingBalance: number
  totalIncome: number
  totalDeductions: number
  closingBalance: number
  currency: string
  
  // Line items
  items: LandlordStatementItem[]
  
  // Status
  status: 'draft' | 'sent' | 'viewed'
  sentAt?: Date
  viewedAt?: Date
  
  // Document
  documentUrl?: string
  
  createdAt: Date
}

interface LandlordStatementItem {
  id: string
  date: Date
  description: string
  type: 'income' | 'expense' | 'commission' | 'payout' | 'adjustment'
  propertyId?: string
  propertyName?: string
  amount: number
  balance: number
}
```

#### 4.14.2 Endpoints

**Landlords:**

- **GET** `/api/v1/landlords` - List landlords (paginated, filtered)
  - Query Params: `page`, `pageSize`, `search`, `status`, `type`, `sort`
  - Response: `{ success: true, data: Landlord[], meta: { pagination } }`

- **GET** `/api/v1/landlords/:id` - Get landlord by ID
  - Response: `{ success: true, data: Landlord }`

- **POST** `/api/v1/landlords` - Create new landlord
  - Request Body: `CreateLandlordRequest`
  - Response: `{ success: true, data: Landlord }`

- **PUT** `/api/v1/landlords/:id` - Update landlord (full update)
  - Request Body: `UpdateLandlordRequest`
  - Response: `{ success: true, data: Landlord }`

- **PATCH** `/api/v1/landlords/:id` - Partial update landlord
  - Request Body: `Partial<UpdateLandlordRequest>`
  - Response: `{ success: true, data: Landlord }`

- **DELETE** `/api/v1/landlords/:id` - Soft delete landlord
  - Response: `{ success: true, data: null }`

- **GET** `/api/v1/landlords/stats` - Get landlord statistics
  - Response: `{ success: true, data: { total, active, inactive, pending, totalProperties } }`

**Property Assignments:**

- **GET** `/api/v1/landlords/:id/properties` - Get landlord's properties
  - Query Params: `page`, `pageSize`, `status`
  - Response: `{ success: true, data: LandlordPropertyAssignment[], meta: { pagination } }`

- **POST** `/api/v1/landlords/:id/properties` - Assign property to landlord
  - Request Body: `{ propertyId, ownershipType, ownershipPercentage?, revenueSharePercentage, startDate, agreementDocumentId? }`
  - Response: `{ success: true, data: LandlordPropertyAssignment }`

- **PUT** `/api/v1/landlords/:id/properties/:propertyId` - Update property assignment
  - Request Body: `UpdatePropertyAssignmentRequest`
  - Response: `{ success: true, data: LandlordPropertyAssignment }`

- **DELETE** `/api/v1/landlords/:id/properties/:propertyId` - Unassign property from landlord
  - Response: `{ success: true, data: null }`

**Earnings & Statements:**

- **GET** `/api/v1/landlords/:id/earnings` - Get landlord earnings
  - Query Params: `startDate`, `endDate`, `propertyId`, `status`
  - Response: `{ success: true, data: LandlordEarning[], meta: { pagination, summary } }`

- **POST** `/api/v1/landlords/:id/earnings/calculate` - Calculate earnings for period
  - Request Body: `{ periodStart, periodEnd, propertyIds? }`
  - Response: `{ success: true, data: LandlordEarning }`

- **POST** `/api/v1/landlords/:id/earnings/:earningId/payout` - Process payout
  - Request Body: `{ paymentMethod, reference? }`
  - Response: `{ success: true, data: LandlordEarning }`

- **GET** `/api/v1/landlords/:id/statements` - Get landlord statements
  - Query Params: `page`, `pageSize`, `year`
  - Response: `{ success: true, data: LandlordStatement[], meta: { pagination } }`

- **POST** `/api/v1/landlords/:id/statements` - Generate statement
  - Request Body: `{ periodStart, periodEnd }`
  - Response: `{ success: true, data: LandlordStatement }`

- **GET** `/api/v1/landlords/:id/statements/:statementId` - Get statement details
  - Response: `{ success: true, data: LandlordStatement }`

- **GET** `/api/v1/landlords/:id/statements/:statementId/download` - Download statement PDF
  - Response: PDF file

- **POST** `/api/v1/landlords/:id/statements/:statementId/send` - Send statement via email
  - Response: `{ success: true, data: { sent: true } }`

---

## 5. Database Schema

### 5.1 Core Tables

#### Tenants (Platform Tenants)

```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subdomain TEXT UNIQUE,
  status TEXT DEFAULT 'active',
  subscription_id UUID REFERENCES subscriptions(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Users

```java
@Entity
@Table(name = "users")
public class User extends BaseEntity {
    @Column(nullable = false)
    private UUID tenantId;
    
    @Column(nullable = false, unique = true)
    private String email;
    
    @Column(nullable = false)
    private String name;
    
    @Column(nullable = false)
    private String passwordHash;
    
    @Enumerated(EnumType.STRING)
    private UserRole role = UserRole.USER;
    
    @Enumerated(EnumType.STRING)
    private UserStatus status = UserStatus.ACTIVE;
    
    private String avatarUrl;
}
```

All tenant-scoped entities extend `TenantScopedEntity`:

```java
@MappedSuperclass
public abstract class TenantScopedEntity extends BaseEntity {
    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;
    
    @PrePersist
    public void prePersist() {
        if (tenantId == null) {
            tenantId = TenantContext.getCurrentTenantId();
        }
        super.prePersist();
    }
}

// Base repository with tenant filtering
public interface TenantScopedRepository<T extends TenantScopedEntity> extends JpaRepository<T, UUID> {
    
    @Query("SELECT e FROM #{#entityName} e WHERE e.tenantId = :tenantId")
    List<T> findAllByTenantId(@Param("tenantId") UUID tenantId);
    
    default List<T> findAllForCurrentTenant() {
        return findAllByTenantId(TenantContext.getCurrentTenantId());
    }
}
```

### 5.2 Key Tables

1. **tenants** - Platform tenants
2. **users** - System users (linked to auth.users)
3. **properties** - Properties
4. **units** - Property units
5. **tenant_records** - Tenant records (renamed from "tenants" to avoid confusion)
6. **agreements** - Lease agreements
7. **invoices** - Invoices
8. **payments** - Payment records
9. **expenses** - Expense records
10. **expense_categories** - Expense categories
11. **maintenance_requests** - Maintenance requests
12. **maintainers** - Maintenance service providers
13. **documents** - Document storage metadata
14. **communications** - Messages and notices
15. **subscription_plans** - Subscription plans
16. **subscriptions** - Active subscriptions
17. **settings** - JSONB column for tenant settings
18. **landlords** - Property owners (individuals/businesses)
19. **landlord_property_assignments** - Landlord-to-property relationships
20. **landlord_earnings** - Landlord income/payout records
21. **landlord_statements** - Periodic financial statements for landlords

### 5.3 Indexes Strategy

- **Composite Indexes**: `(tenant_id, created_at DESC)` for all tenant-scoped tables
- **Foreign Key Indexes**: Index all foreign keys
- **Search Indexes**: Full-text search indexes on name, email, description fields
- **Unique Constraints**: `(tenant_id, field)` for tenant-scoped uniqueness

---

## 6. Security Requirements

### 6.1 Authentication

- JWT-based authentication for API routes
- Cookie-based authentication for Server Actions
- Token expiration and refresh mechanism
- Multi-factor authentication (future)

### 6.2 Authorization

- Role-based access control (RBAC)
- Permission-based fine-grained access
- Tenant-level isolation enforced at all layers
- Resource-level permissions

### 6.3 Data Security

- Application-level tenant isolation via repository pattern
- Encryption at rest (PostgreSQL TDE or disk encryption)
- Encryption in transit (HTTPS/TLS)
- Sensitive data encryption (BCrypt for passwords, AES for payment info)

### 6.4 API Security

- Rate limiting per tenant/user
- Request validation (Zod schemas)
- SQL injection prevention (parameterized queries)
- XSS prevention (input sanitization)
- CSRF protection for state-changing operations

### 6.5 Audit Logging

- Log all sensitive operations
- Track tenant access
- Log data modifications
- Security event logging

---

## 7. Performance Requirements

### 7.1 Response Times

- **Standard Operations**: < 200ms (p95)
- **List Queries**: < 500ms (p95) with pagination
- **Report Generation**: < 5s for standard reports
- **File Uploads**: < 2s for files < 10MB

### 7.2 Scalability

- Support 10,000+ tenants
- Support 1M+ records per tenant
- Handle 1000+ concurrent requests
- Horizontal scaling capability

### 7.3 Optimization Strategies

- Database query optimization (indexes, query plans)
- Caching (Redis) for frequently accessed data
- Pagination for all list endpoints
- Batch operations where applicable
- Background job processing for heavy operations

---

## 8. Error Handling

### 8.1 Error Categories

1. **Validation Errors** (400): Invalid input data
2. **Authentication Errors** (401): Missing/invalid auth
3. **Authorization Errors** (403): Insufficient permissions
4. **Not Found Errors** (404): Resource not found
5. **Conflict Errors** (409): Resource conflicts
6. **Business Logic Errors** (422): Business rule violations
7. **Rate Limit Errors** (429): Too many requests
8. **Server Errors** (500): Internal server errors

### 8.2 Error Response Format

```typescript
{
  success: false,
  error: {
    code: 'VALIDATION_ERROR',
    message: 'Invalid input data',
    details: {
      field: 'email',
      reason: 'Invalid email format'
    }
  }
}
```

### 8.3 Error Codes

- `VALIDATION_ERROR`: Input validation failed
- `AUTHENTICATION_REQUIRED`: Missing authentication
- `INVALID_TOKEN`: Invalid or expired token
- `INSUFFICIENT_PERMISSIONS`: User lacks required permissions
- `TENANT_ACCESS_DENIED`: User cannot access tenant
- `RESOURCE_NOT_FOUND`: Requested resource not found
- `DUPLICATE_ENTRY`: Resource already exists
- `BUSINESS_RULE_VIOLATION`: Business logic validation failed
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INTERNAL_ERROR`: Internal server error

---

## 9. Testing Requirements

### 9.1 Test Types

1. **Unit Tests**: Services, utilities, pure functions
2. **Integration Tests**: API endpoints with test database
3. **E2E Tests**: Critical user flows
4. **Performance Tests**: Load testing, stress testing

### 9.2 Test Coverage

- Minimum 80% coverage for business logic
- 100% coverage for security-critical code
- All API endpoints must have integration tests

### 9.3 Test Data

- Use factories/fixtures for test data
- Clean up test data after tests
- Use test database for integration tests
- Mock external services (payment gateways, SMS)

---

## 10. Documentation Requirements

### 10.1 API Documentation

- OpenAPI/Swagger specification
- Endpoint descriptions
- Request/response examples
- Error response examples
- Authentication requirements

### 10.2 Code Documentation

- JSDoc comments for public APIs
- Complex business logic documentation
- Algorithm complexity documentation
- Architecture decision records (ADRs)

### 10.3 Developer Documentation

- Setup instructions
- Development workflow
- Deployment guide
- Troubleshooting guide

---

## 11. Deployment & Infrastructure

### 11.1 Environment Setup

- **Development**: Local PostgreSQL + Redis via Docker Compose
- **Staging**: Kubernetes cluster or Cloud Run
- **Production**: Managed PostgreSQL (AWS RDS / GCP Cloud SQL) + Redis

### 11.2 CI/CD Pipeline

- Automated testing on PR
- Code quality checks (linting, type checking)
- Automated deployments to staging
- Manual approval for production

### 11.3 Monitoring & Logging

- Application logging (structured logs)
- Error tracking (Sentry or similar)
- Performance monitoring (APM)
- Database query monitoring

### 11.4 Backup & Recovery

- Automated database backups (managed PostgreSQL feature)
- Point-in-time recovery (PITR)
- Disaster recovery plan
- Database replication for high availability

---

## 12. Future Enhancements

### 12.1 Phase 2 Features

- Real-time notifications (WebSocket)
- Advanced reporting and analytics
- Mobile app API optimization
- GraphQL API option
- Webhook system for integrations

### 12.2 Phase 3 Features

- AI-powered insights
- Automated workflows
- Third-party integrations (accounting software, etc.)
- Multi-language support
- Advanced search (full-text, semantic)

---

## 13. Acceptance Criteria

### 13.1 Functional Requirements

- [ ] All CRUD operations work for all modules
- [ ] Multi-tenant isolation enforced at all layers
- [ ] Authentication and authorization working
- [ ] All API endpoints return standardized responses
- [ ] Error handling consistent across all endpoints
- [ ] File uploads and downloads working
- [ ] Payment processing integrated
- [ ] Email/SMS notifications working

### 13.2 Non-Functional Requirements

- [ ] API response times meet performance requirements
- [ ] Security requirements met (RLS, auth, encryption)
- [ ] Test coverage > 80%
- [ ] API documentation complete
- [ ] Code follows SOLID principles
- [ ] Proper error handling and logging
- [ ] Database migrations versioned and tested

### 13.3 Multi-Tenant Requirements

- [ ] Tenant isolation enforced via RLS
- [ ] Tenant context set correctly in all requests
- [ ] Cross-tenant data access prevented
- [ ] Tenant-scoped indexes created
- [ ] Tenant resolution working (JWT, subdomain, header)

---

## 14. Implementation Guidelines

### 14.1 Code Organization (Spring Boot)

```
com.tenantx.api/
├── config/
│   ├── SecurityConfig.java
│   ├── JpaConfig.java
│   └── RedisConfig.java
├── controller/
│   ├── AuthController.java
│   ├── TenantController.java
│   ├── PropertyController.java
│   └── ...
├── service/
│   ├── AuthService.java
│   ├── TenantService.java
│   └── ...
├── repository/
│   ├── TenantRepository.java
│   ├── PropertyRepository.java
│   └── ...
├── entity/
│   ├── BaseEntity.java
│   ├── TenantScopedEntity.java
│   ├── Tenant.java
│   ├── Property.java
│   └── ...
├── dto/
│   ├── request/
│   └── response/
├── security/
│   ├── JwtTokenProvider.java
│   ├── TenantContext.java
│   └── TenantFilter.java
├── exception/
│   ├── GlobalExceptionHandler.java
│   └── BusinessException.java
└── util/
    └── ...
```

### 14.2 Service Layer Pattern

```java
@Service
@RequiredArgsConstructor
public class TenantService {
    private final TenantRepository tenantRepository;
    private final TenantMapper mapper;
    
    @Transactional
    public TenantResponse createTenant(CreateTenantRequest request) {
        // Validate input (handled by @Valid in controller)
        
        // Business logic
        Tenant tenant = mapper.toEntity(request);
        tenant.setTenantId(TenantContext.getCurrentTenantId());
        
        // Save via repository
        Tenant saved = tenantRepository.save(tenant);
        return mapper.toResponse(saved);
    }
}
```

### 14.3 Repository Pattern

```java
@Repository
public interface TenantRepository extends TenantScopedRepository<Tenant> {
    
    Optional<Tenant> findByIdAndTenantId(UUID id, UUID tenantId);
    
    @Query("SELECT t FROM Tenant t WHERE t.tenantId = :tenantId AND t.status = :status")
    Page<Tenant> findByStatus(@Param("tenantId") UUID tenantId, 
                              @Param("status") TenantStatus status, 
                              Pageable pageable);
    
    @Query("SELECT t FROM Tenant t WHERE t.tenantId = :tenantId AND " +
           "(LOWER(t.firstName) LIKE %:search% OR LOWER(t.lastName) LIKE %:search%)")
    Page<Tenant> searchByName(@Param("tenantId") UUID tenantId, 
                              @Param("search") String search, 
                              Pageable pageable);
}
```

### 14.4 Controller Pattern

```java
@RestController
@RequestMapping("/api/v1/tenants")
@RequiredArgsConstructor
public class TenantController {
    private final TenantService tenantService;
    
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<TenantResponse> createTenant(
            @Valid @RequestBody CreateTenantRequest request) {
        TenantResponse tenant = tenantService.createTenant(request);
        return ApiResponse.success(tenant);
    }
    
    @GetMapping
    public ApiResponse<Page<TenantResponse>> listTenants(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status) {
        Page<TenantResponse> tenants = tenantService.listTenants(page, size, search, status);
        return ApiResponse.success(tenants);
    }
}
```

---

## 15. Success Metrics

### 15.1 Performance Metrics

- API response time p95 < 200ms
- API availability > 99.9%
- Error rate < 0.1%

### 15.2 Quality Metrics

- Test coverage > 80%
- Code review coverage 100%
- Security vulnerabilities: 0 critical, 0 high

### 15.3 Business Metrics

- API adoption rate
- Error rate by endpoint
- Tenant satisfaction

---

## Appendix A: API Endpoint Summary

### Authentication

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`

### Tenants

- `GET /api/v1/tenants`
- `GET /api/v1/tenants/:id`
- `POST /api/v1/tenants`
- `PUT /api/v1/tenants/:id`
- `DELETE /api/v1/tenants/:id`
- `GET /api/v1/tenants/:id/history`
- `GET /api/v1/tenants/stats`

### Properties

- `GET /api/v1/properties`
- `GET /api/v1/properties/:id`
- `POST /api/v1/properties`
- `PUT /api/v1/properties/:id`
- `DELETE /api/v1/properties/:id`
- `GET /api/v1/properties/:propertyId/units`
- `GET /api/v1/units/:id`
- `POST /api/v1/properties/:propertyId/units`
- `PUT /api/v1/units/:id`
- `DELETE /api/v1/units/:id`

### Agreements

- `GET /api/v1/agreements`
- `GET /api/v1/agreements/:id`
- `POST /api/v1/agreements`
- `PUT /api/v1/agreements/:id`
- `DELETE /api/v1/agreements/:id`
- `GET /api/v1/agreements/stats`

### Billing & Invoices

- `GET /api/v1/invoices`
- `GET /api/v1/invoices/:id`
- `POST /api/v1/invoices`
- `PUT /api/v1/invoices/:id`
- `DELETE /api/v1/invoices/:id`
- `POST /api/v1/invoices/:id/send`
- `GET /api/v1/invoices/:id/download`
- `GET /api/v1/payments`
- `POST /api/v1/payments`
- `POST /api/v1/payments/process`

### Expenses

- `GET /api/v1/expenses`
- `GET /api/v1/expenses/:id`
- `POST /api/v1/expenses`
- `PUT /api/v1/expenses/:id`
- `DELETE /api/v1/expenses/:id`
- `GET /api/v1/expenses/categories`

### Maintenance

- `GET /api/v1/maintenance/requests`
- `GET /api/v1/maintenance/requests/:id`
- `POST /api/v1/maintenance/requests`
- `PUT /api/v1/maintenance/requests/:id`
- `GET /api/v1/maintenance/maintainers`
- `POST /api/v1/maintenance/maintainers`

### Documents

- `GET /api/v1/documents`
- `GET /api/v1/documents/:id`
- `POST /api/v1/documents`
- `DELETE /api/v1/documents/:id`

### Communication

- `GET /api/v1/communications`
- `GET /api/v1/communications/:id`
- `POST /api/v1/communications`
- `POST /api/v1/communications/:id/reply`

### Reports

- `GET /api/v1/reports/earnings`
- `GET /api/v1/reports/expenses`
- `GET /api/v1/reports/maintenance`
- `GET /api/v1/reports/tenants`

### Settings

- `GET /api/v1/settings/company`
- `PUT /api/v1/settings/company`
- `GET /api/v1/settings/payment`
- `PUT /api/v1/settings/payment`
- `GET /api/v1/settings/notification`
- `PUT /api/v1/settings/notification`

### Subscription Plans

- `GET /api/v1/subscription-plans`
- `GET /api/v1/subscription-plans/:id`
- `POST /api/v1/subscription-plans`
- `GET /api/v1/subscriptions`
- `POST /api/v1/subscriptions`

### Landlords

- `GET /api/v1/landlords`
- `GET /api/v1/landlords/:id`
- `POST /api/v1/landlords`
- `PUT /api/v1/landlords/:id`
- `PATCH /api/v1/landlords/:id`
- `DELETE /api/v1/landlords/:id`
- `GET /api/v1/landlords/stats`
- `GET /api/v1/landlords/:id/properties`
- `POST /api/v1/landlords/:id/properties`
- `PUT /api/v1/landlords/:id/properties/:propertyId`
- `DELETE /api/v1/landlords/:id/properties/:propertyId`
- `GET /api/v1/landlords/:id/earnings`
- `POST /api/v1/landlords/:id/earnings/calculate`
- `POST /api/v1/landlords/:id/earnings/:earningId/payout`
- `GET /api/v1/landlords/:id/statements`
- `POST /api/v1/landlords/:id/statements`
- `GET /api/v1/landlords/:id/statements/:statementId`
- `GET /api/v1/landlords/:id/statements/:statementId/download`
- `POST /api/v1/landlords/:id/statements/:statementId/send`

---

## Appendix B: Data Models Reference

See individual module sections for detailed data models.

---

## Document Control

**Version History:**

- v2.1.0 (February 2026): Added Landlords (Property Owners) Module
- v2.0.0 (January 2026): Updated for Spring Boot + PostgreSQL backend
- v1.0.0 (2024): Initial PRD draft (Supabase)

**Reviewers:**

- [ ] Backend Team Lead
- [ ] Frontend Team Lead
- [ ] Product Manager
- [ ] Security Team

**Approvals:**

- [ ] Technical Lead
- [ ] Product Owner

---

**End of Document**
