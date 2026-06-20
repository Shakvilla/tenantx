/**
 * Documents API Client
 */

import { apiGet, apiPost, apiPatch, apiDelete, API_BASE } from './client'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DocumentItem = {
  id: string
  documentType: string
  status: 'pending' | 'accepted' | 'rejected'
  rejectReason?: string
  occupantId?: string
  occupantName?: string
  propertyId?: string
  propertyName?: string
  unitId?: string
  unitNo?: string
  fileUrl?: string
  fileName?: string
  fileId?: string
  createdAt: string
  updatedAt?: string
}

export type CreateDocumentRequest = {
  documentType: string
  occupantId?: string
  occupantName?: string
  propertyId?: string
  propertyName?: string
  unitId?: string
  unitNo?: string
  fileUrl?: string
  fileName?: string
  fileId?: string
}

export type UpdateDocumentStatusRequest = {
  status: 'accepted' | 'rejected'
  rejectReason?: string
}

export type DocumentStats = {
  total: number
  pending: number
  accepted: number
  rejected: number
}

// ---------------------------------------------------------------------------
// API Functions
// ---------------------------------------------------------------------------

export async function getDocuments(params?: {
  status?: string
  documentType?: string
}): Promise<DocumentItem[]> {
  const query = new URLSearchParams()
  if (params?.status)       query.set('status', params.status)
  if (params?.documentType) query.set('documentType', params.documentType)
  const qs = query.toString()
  return apiGet<DocumentItem[]>(`${API_BASE}/documents${qs ? `?${qs}` : ''}`)
}

export async function getDocumentById(id: string): Promise<DocumentItem> {
  return apiGet<DocumentItem>(`${API_BASE}/documents/${id}`)
}

export async function createDocument(request: CreateDocumentRequest): Promise<DocumentItem> {
  return apiPost<DocumentItem>(`${API_BASE}/documents`, request)
}

export async function updateDocumentStatus(
  id: string,
  request: UpdateDocumentStatusRequest
): Promise<DocumentItem> {
  return apiPatch<DocumentItem>(`${API_BASE}/documents/${id}/status`, request)
}

export async function deleteDocument(id: string): Promise<void> {
  return apiDelete(`${API_BASE}/documents/${id}`)
}

export async function getDocumentStats(): Promise<DocumentStats> {
  return apiGet<DocumentStats>(`${API_BASE}/documents/stats`)
}
