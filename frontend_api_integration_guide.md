# TenantX Exhaustive API Integration Guide

This document is the definitive reference for frontend teams (Web & Mobile) integrating with the TenantX Backend. It covers **every endpoint** documented in the project's baseline Postman collection.

---

## 1. Core Architecture & Standards

### 1.1 Base URLs

- **Development**: `http://localhost:8080/api/v1`
- **Staging**: `https://api.staging.tenantx.com/api/v1`
- **Production**: `https://api.tenantx.com/api/v1`

### 1.2 Headers

| Header          | description            | Required for                |
| :-------------- | :--------------------- | :-------------------------- |
| `Content-Type`  | `application/json`     | All POST/PUT/PATCH requests |
| `Authorization` | `Bearer <accessToken>` | All protected endpoints     |
| `X-Tenant-ID`   | `<tenantId>`           | All tenant-scoped endpoints |

### 1.3 Response Formats

- **Single Object**: Direct JSON representation.
- **Paginated List**: `success`, `data: [...]`, and `meta.pagination` (contains `page`, `pageSize`, `total`, `totalPages`, `hasNext`, `hasPrev`, `cursor`).
- **Errors**: `timestamp`, `status`, `error`, `message`, `path`.

---

## 2. Global Authentication (Cross-Tenant)

These endpoints are used for initial login, OTP verification, and selecting a tenant. They do **not** require a `X-Tenant-ID` header initially.

### 2.1 Global Login

`POST /global/auth/login`

**Request Payload:**

```json
{
  "email": "user@example.com",
  "password": "Password@123"
}
```

**Success Response (200 OK):**

```json
{
  "accessToken": "string",
  "tokenType": "string",
  "expiresIn": 0,
  "firstTimeLogin": true,
  "workspaces": [
    {
      "tenantId": "string",
      "tenantName": "string",
      "role": "string",
      "userType": "STAFF"
    }
  ]
}
```

### 2.2 Request OTP (First-time Login)

`POST /global/auth/request-otp`

**Request Payload:**

```json
{
  "email": "user@example.com"
}
```

### 2.3 Verify OTP

`POST /global/auth/verify-otp`

**Request Payload:**

```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Success Response (200 OK):**

```json
{
  "verificationToken": "short-lived-token"
}
```

### 2.4 Set Password

`POST /global/auth/set-password`

**Request Payload:**

```json
{
  "otpVerificationToken": "token-from-verify-otp",
  "newPassword": "NewPassword@123",
  "confirmPassword": "NewPassword@123"
}
```

### 2.6 Forgot Password Flow

Used when a user has forgotten their password.

#### 2.6.1 Initiate Forgot Password

`POST /global/auth/forgot-password/initiate`

**Request Payload:**

```json
{
  "email": "user@example.com"
}
```

**Success Response (200 OK):**

```json
{
  "channels": [
    {
      "channel": "EMAIL",
      "maskedAddress": "u***r@example.com"
    },
    {
      "channel": "SMS",
      "maskedAddress": "*******789"
    }
  ]
}
```

#### 2.6.2 Send OTP

`POST /global/auth/forgot-password/otp/send`

**Request Payload:**

```json
{
  "email": "user@example.com",
  "channel": "EMAIL"
}
```

_Note: `channel` must be `EMAIL` or `SMS`._

#### 2.6.3 Verify OTP

`POST /global/auth/forgot-password/otp/verify`

**Request Payload:**

```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Success Response (200 OK):**

```json
{
  "verificationToken": "password-reset-token"
}
```

#### 2.6.4 Reset Password

`POST /global/auth/forgot-password/reset`

**Request Payload:**

```json
{
  "resetToken": "token-from-otp-verify",
  "newPassword": "NewStrongPassword@123",
  "confirmPassword": "NewStrongPassword@123"
}
```

### 2.5 Select Tenant

`POST /global/auth/select-tenant`

**Request Payload:**

```json
{
  "tenantId": "tenant-uuid"
}
```

**Success Response (200 OK):**
Returns a tenant-scoped **Access Token** and **Refresh Token**.

---

## 3. Tenant-Scoped Authentication

Once a tenant is selected, use these endpoints for session management within that tenant. **Requires `X-Tenant-ID`** header.

### 3.1 Tenant Login (Direct)

`POST /auth/login`

**Request Payload:**

```json
{
  "email": "user@example.com",
  "password": "Password@123"
}
```

### 3.2 Token Refresh

`POST /auth/refresh`

**Request Payload:**

```json
{
  "refreshToken": "eyJhbG..."
}
```

### 3.3 Register (Self-Service Signup)

`POST /auth/signup`

**Request Payload:**

```json
{
  "email": "newadmin@example.com",
  "password": "StrongPassword@123",
  "fullName": "New Admin",
  "companyName": "New Corp"
}
```

---

## 4. Properties Management

### 4.1 Create Property

`POST /properties`

**Request Payload:**

```json
{
  "name": "Sunset Heights",
  "address": "123 Solar Way",
  "description": "Premium residential complex",
  "type": "RESIDENTIAL",
  "amenities": ["Pool", "Gym", "Security"],
  "metadata": {
    "yearBuilt": 2022
  }
}
```

### 4.2 List Properties

`GET /properties`

**Query Parameters:**

- `size` (default: 50)
- `sort` (default: `id,asc`)
- `cursor` (opaque string for next page)

**Success Response (200 OK - Paginated):**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Sunset Heights",
      "address": "123 Solar Way",
      "type": "RESIDENTIAL",
      "active": true
    }
  ],
  "meta": {
    "pagination": { "hasNext": true, "cursor": "..." }
  }
}
```

### 4.3 Get My Property (Occupant Only)

`GET /properties/my-property`

Returns the full details of the property assigned to the authenticated occupant.

---

## 5. Units Management

### 5.1 Add Unit to Property

`POST /properties/{propertyId}/units`

**Request Payload:**

```json
{
  "unitNo": "A-101",
  "floor": 1,
  "type": "APARTMENT",
  "bedrooms": 2,
  "bathrooms": 2,
  "rent": 1500.0,
  "currency": "USD"
}
```

### 5.2 List Units for Property

`GET /properties/{propertyId}/units`

### 5.3 Global Available Units Search

`GET /units/available`

---

## 6. User & Role Management (RBAC)

### 6.1 User Profile & Management

`GET /users/me` (Current User)
`GET /users/{id}` (Target User)

**Success Response (200 OK):**

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "fullName": "Jane Doe",
  "companyName": "Acme Corp",
  "active": true,
  "createdAt": "2023-10-01T10:00:00Z"
}
```

`PUT /users/{id}` (Update Profile)
**Request Payload:**

```json
{
  "fullName": "Jane Smith",
  "companyName": "Acme Global",
  "email": "jane.smith@example.com"
}
```

### 6.2 Roles & Permissions

`POST /roles` (Create Custom Role)
**Request Payload:**

```json
{
  "name": "Property Manager",
  "description": "Can manage properties and units",
  "permissionCodes": ["property:read", "property:write", "unit:read"]
}
```

`POST /roles/assign` (Assign Role to User)
**Request Payload:**

```json
{
  "userId": "user-uuid",
  "roleId": "role-uuid"
}
```

---

## 7. Occupants Management

### 7.1 Register Occupant

`POST /occupants`

**Request Payload:**

```json
{
  "firstName": "Alice",
  "lastName": "Johnson",
  "email": "alice.j@example.com",
  "phone": "+1234567890",
  "propertyId": "prop-uuid",
  "unitId": "unit-uuid",
  "moveInDate": "2023-11-01"
}
```

### 7.2 Get Occupant Profile

`GET /occupants/{id}`

**Success Response (200 OK):**

```json
{
  "id": "uuid",
  "firstName": "Alice",
  "lastName": "Johnson",
  "unitNo": "A-101",
  "status": "ACTIVE",
  "moveInDate": "2023-11-01"
}
```

---

## 8. Maintenance & Operations (Detailed)

### 8.1 Create Maintenance Request

`POST /maintenance/requests`

**Request Payload:**

```json
{
  "title": "Leaking Pipe",
  "description": "The kitchen sink is leaking heavily.",
  "categoryId": "cat-uuid",
  "priority": "HIGH",
  "propertyId": "prop-uuid",
  "unitId": "unit-uuid"
}
```

### 8.2 Maintenance Comments & Parts

`POST /maintenance/requests/{id}/comments`
**Request Payload:**

```json
{
  "content": "Plumber scheduled for tomorrow morning.",
  "isInternal": true
}
```

`POST /maintenance/requests/{id}/parts`
**Request Payload:**

```json
{
  "partName": "U-Joint Pipe",
  "quantity": 1,
  "unitCost": 25.5
}
```

---

## 9. Notifications

### 9.1 List Notifications

`GET /notifications`

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "recipientAddress": "user@example.com",
      "subject": "Maintenance Update",
      "status": "SENT",
      "createdAt": "2023-11-01T12:00:00Z"
    }
  ]
}
```

---

## 10. Platform Administration (Global Admin Only)

### 10.1 Admin Login

`POST /admin/auth/login`

**Request Payload:**

```json
{
  "username": "sysadmin",
  "password": "SecureAdminPassword@123"
}
```

### 10.2 Provision Tenant

`POST /admin/tenants`

**Request Payload:**

```json
{
  "name": "New Property Group",
  "tenant_id": "new-pg",
  "description": "Enterprise tenant account"
}
```

---

## 11. Implementation Safeguards

1. **Pagination**: Never loop over pages using numeric offsets. **Required**: Use the opaque `cursor` from the `meta` block.
2. **Sorting**: Default format is `field,asc` or `field,desc`.
3. **Date Formats**: ISO-8601 (`YYYY-MM-DDTHH:mm:ssZ`).
4. **Token Refresh**: Intercept 401 errors to trigger `/auth/refresh` before retrying the original request.
