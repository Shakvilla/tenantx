/**
 * Platform storage settings API client.
 *
 * Endpoints (backend: StorageSettingsController, /api/v1/platform/storage):
 *   GET  /api/v1/platform/storage/providers   → ProviderInfo[]
 *   GET  /api/v1/platform/storage/settings    → { activeProvider, configured }
 *   PUT  /api/v1/platform/storage/settings    → updates active provider + config
 *   POST /api/v1/platform/storage/test/{id}   → tests provider connection
 */

import { apiGet, apiPost, apiPut, API_BASE } from './client'

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
  return apiGet<ProviderInfo[]>(`${API_BASE}/platform/storage/providers`)
}

export async function getStorageSettings(): Promise<StorageSettings> {
  return apiGet<StorageSettings>(`${API_BASE}/platform/storage/settings`)
}

export async function updateStorageSettings(
  activeProvider: string,
  config: Record<string, string>
): Promise<void> {
  await apiPut<void>(`${API_BASE}/platform/storage/settings`, { activeProvider, config })
}

export async function testProviderConnection(
  providerId: string
): Promise<TestResult> {
  return apiPost<TestResult>(`${API_BASE}/platform/storage/test/${providerId}`)
}
