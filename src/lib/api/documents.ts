/**
 * Documents API Client
 */

import { apiGet, apiPost, apiPatch, apiPut, apiDelete, API_BASE } from './client'

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
  agreementId?: string
  agreementNumber?: string
  fileUrl?: string
  fileName?: string
  fileId?: string
  createdAt: string
  updatedAt?: string
}

/** One page from GET /documents — server-side pagination metadata. */
export type DocumentPage = {
  content: DocumentItem[]
  page: number
  size: number
  total: number
  totalPages: number
}

export type CreateDocumentRequest = {
  documentType: string
  occupantId?: string
  occupantName?: string
  propertyId?: string
  propertyName?: string
  unitId?: string
  unitNo?: string
  agreementId?: string
  agreementNumber?: string
  fileUrl?: string
  fileName?: string
  fileId?: string
}

export type ReplaceDocumentFileRequest = {
  fileUrl: string
  fileName?: string
  fileId: string
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

export type GetDocumentsParams = {
  status?: string
  documentType?: string
  occupantId?: string
  propertyName?: string
  search?: string
  page?: number
  size?: number
  sort?: string
}

// ---------------------------------------------------------------------------
// API Functions
// ---------------------------------------------------------------------------

export async function getDocuments(params?: GetDocumentsParams): Promise<DocumentPage> {
  const query = new URLSearchParams()
  if (params?.status)        query.set('status', params.status)
  if (params?.documentType)  query.set('documentType', params.documentType)
  if (params?.occupantId)    query.set('occupantId', params.occupantId)
  if (params?.propertyName)  query.set('propertyName', params.propertyName)
  if (params?.search)        query.set('search', params.search)
  if (params?.page !== undefined)    query.set('page', String(params.page))
  if (params?.size !== undefined)    query.set('size', String(params.size))
  if (params?.sort)          query.set('sort', params.sort)
  const qs = query.toString()
  return apiGet<DocumentPage>(`${API_BASE}/documents${qs ? `?${qs}` : ''}`)
}

export async function getDocumentById(id: string): Promise<DocumentItem> {
  return apiGet<DocumentItem>(`${API_BASE}/documents/${id}`)
}

export async function createDocument(request: CreateDocumentRequest): Promise<DocumentItem> {
  return apiPost<DocumentItem>(`${API_BASE}/documents`, request)
}

export async function replaceDocumentFile(
  id: string,
  request: ReplaceDocumentFileRequest
): Promise<DocumentItem> {
  return apiPut<DocumentItem>(`${API_BASE}/documents/${id}/file`, request)
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