import { createSwaggerSpec } from 'next-swagger-doc'

/**
 * Swagger/OpenAPI specification configuration.
 */
export const getApiDocs = async () => {
  const spec = createSwaggerSpec({
    apiFolder: 'src/app/api',
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'TenantX API',
        version: '1.0.0',
        description: `
## Multi-Tenant Property Management API

TenantX is a SaaS platform for landlords and property managers in Ghana.

### Authentication

All API endpoints require Bearer token authentication:

\`\`\`
Authorization: Bearer <jwt_token>
\`\`\`

### Multi-Tenancy

All data is automatically scoped to your organization (tenant) via Row Level Security.
        `,
        contact: {
          name: 'TenantX Support',
          email: 'support@tenantx.com',
        },
      },
      servers: [
        {
          url: 'http://localhost:3000',
          description: 'Development server',
        },
        {
          url: 'https://api.tenantx.com',
          description: 'Production server',
        },
      ],
      tags: [
        { name: 'Auth', description: 'Authentication endpoints' },
        { name: 'Tenants', description: 'Property tenant (renter) management' },
        { name: 'Properties', description: 'Property management' },
        { name: 'Units', description: 'Unit management' },
        { name: 'Agreements', description: 'Lease agreement management' },
        { name: 'Invoices', description: 'Billing and invoice management' },
        { name: 'Payments', description: 'Payment processing' },
        { name: 'Maintenance', description: 'Maintenance request management' },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'JWT token from /api/v1/auth/login',
          },
        },
        schemas: {
          Error: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: false },
              error: {
                type: 'object',
                properties: {
                  code: { type: 'string', example: 'VALIDATION_ERROR' },
                  message: { type: 'string', example: 'Invalid email address' },
                },
              },
            },
          },
          Pagination: {
            type: 'object',
            properties: {
              page: { type: 'integer', example: 1 },
              pageSize: { type: 'integer', example: 10 },
              total: { type: 'integer', example: 100 },
              totalPages: { type: 'integer', example: 10 },
            },
          },
          TenantRecord: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              tenant_id: { type: 'string', format: 'uuid' },
              first_name: { type: 'string', example: 'John' },
              last_name: { type: 'string', example: 'Doe' },
              email: { type: 'string', format: 'email' },
              phone: { type: 'string', example: '+233201234567' },
              status: { 
                type: 'string', 
                enum: ['active', 'inactive', 'pending'],
                example: 'active' 
              },
              property_id: { type: 'string', format: 'uuid', nullable: true },
              unit_id: { type: 'string', format: 'uuid', nullable: true },
              unit_no: { type: 'string', nullable: true, example: 'A101' },
              move_in_date: { type: 'string', format: 'date-time', nullable: true },
              move_out_date: { type: 'string', format: 'date-time', nullable: true },
              emergency_contact: {
                type: 'object',
                nullable: true,
                properties: {
                  name: { type: 'string' },
                  phone: { type: 'string' },
                  relationship: { type: 'string' },
                },
              },
              created_at: { type: 'string', format: 'date-time' },
              updated_at: { type: 'string', format: 'date-time' },
            },
          },
          TenantHistory: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              tenant_record_id: { type: 'string', format: 'uuid' },
              event_type: {
                type: 'string',
                enum: ['move_in', 'move_out', 'status_change', 'payment', 'agreement_signed'],
              },
              event_date: { type: 'string', format: 'date-time' },
              details: { type: 'object' },
              notes: { type: 'string', nullable: true },
              created_at: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  })
  
  return spec
}
