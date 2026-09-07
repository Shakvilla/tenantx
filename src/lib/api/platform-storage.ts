/**
 * Platform storage settings API client.
 *
 * Endpoints (backend: StorageSettingsController, /api/v1/admin/storage):
 *   GET  /api/v1/admin/storage/providers   → ProviderInfo[]
 *   GET  /api/v1/admin/storage/settings    → { activeProvider, configured }
 *   PUT  /api/v1/admin/storage/settings    → updates active provider + config
 *   POST /api/v1/admin/storage/test/{id}   → tests provider connection
 */

import { adminClient } from './admin-auth-client'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProviderConfigField {
  key: string
  label: string
  type: 'text' | 'password' | 'select'
  required: boolean
  defaultValue?: string
  placeholder?: string
  options?: string[]
}

export interface ProviderInfo {
  id: string
  displayName: string
  configured: boolean
  configFields: ProviderConfigField[]
}

export interface StorageSettings {
  activeProvider: string
  configured: boolean
}

export interface TestResult {
  success: boolean
  message: string
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

export async function listProviders(): Promise<ProviderInfo[]> {
  const res = await adminClient.get<ProviderInfo[]>('/storage/providers')
  return res.data
}

export async function getStorageSettings(): Promise<StorageSettings> {
  const res = await adminClient.get<StorageSettings>('/storage/settings')
  return res.data
}

export async function updateStorageSettings(
  activeProvider: string,
  config: Record<string, string>
): Promise<void> {
  await adminClient.put('/storage/settings', { activeProvider, config })
}

export async function testProviderConnection(
  providerId: string
): Promise<TestResult> {
  const res = await adminClient.post<TestResult>(`/storage/test/${providerId}`)
  return res.data
}
