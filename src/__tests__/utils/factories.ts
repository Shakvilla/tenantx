import type { TenantRecord } from '@/repositories/tenant-repository'

/**
 * Factory functions for creating test data.
 */

export const createMockTenantRecord = (
  overrides?: Partial<TenantRecord>
): TenantRecord => ({
  id: 'tr-123-456',
  tenant_id: 'tenant-123',
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@example.com',
  phone: '+233201234567',
  avatar: null,
  status: 'active',
  property_id: 'prop-123',
  unit_id: 'unit-123',
  unit_no: 'A101',
  move_in_date: '2024-01-01T00:00:00Z',
  move_out_date: null,
  emergency_contact: {
    name: 'Jane Doe',
    phone: '+233207654321',
    relationship: 'Spouse',
  },
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
})

export const createMockProperty = (overrides?: Record<string, unknown>) => ({
  id: 'prop-123',
  tenant_id: 'tenant-123',
  name: 'Sunset Apartments',
  description: 'A beautiful apartment complex',
  address: {
    street: '123 Main St',
    city: 'Accra',
    state: 'Greater Accra',
    zip: '00233',
    country: 'Ghana',
  },
  type: 'residential',
  ownership: 'own',
  total_units: 10,
  occupied_units: 8,
  status: 'active',
  images: [],
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
})

export const createMockUser = (overrides?: Record<string, unknown>) => ({
  id: 'user-123',
  tenant_id: 'tenant-123',
  email: 'admin@example.com',
  name: 'Admin User',
  role: 'admin',
  status: 'active',
  avatar_url: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
})

export const createMockAuthUser = (overrides?: Record<string, unknown>) => ({
  id: 'user-123',
  email: 'admin@example.com',
  user_metadata: {
    tenant_id: 'tenant-123',
    role: 'admin',
    name: 'Admin User',
  },
  ...overrides,
})

/**
 * Generate multiple mock records.
 */
export function createMockTenantRecordList(
  count: number,
  baseOverrides?: Partial<TenantRecord>
): TenantRecord[] {
  return Array.from({ length: count }, (_, i) =>
    createMockTenantRecord({
      id: `tr-${i + 1}`,
      email: `tenant${i + 1}@example.com`,
      first_name: `Tenant`,
      last_name: `${i + 1}`,
      ...baseOverrides,
    })
  )
}
