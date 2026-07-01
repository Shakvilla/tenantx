/**
 * Inspections API client
 *
 * Endpoints:
 *   POST   /api/v1/inspections                         → create (DRAFT)
 *   GET    /api/v1/inspections/{id}                    → get by id (full)
 *   GET    /api/v1/inspections?unitId=                 → list all (or by unit)
 *   PATCH  /api/v1/inspections/{id}/complete           → save items + mark COMPLETED
 *   PUT    /api/v1/inspections/{id}                    → update metadata (DRAFT only)
 *   DELETE /api/v1/inspections/{id}                    → delete
 *   GET    /api/v1/inspections/unit/{unitId}/completed → completed list for a unit
 */

import { apiClient, API_BASE } from './client'
import { uploadImages } from '@/lib/imagekit'
import type {
  InspectionResponse,
  InspectionSummary,
  CreateInspectionRequest,
  CompleteInspectionRequest,
  InspectionSignOffRequest,
  ItemUpsert,
} from '@/types/inspection'

const BASE = `${API_BASE}/inspections`

export const inspectionsApi = {
  create: async (data: CreateInspectionRequest): Promise<InspectionResponse> => {
    const res = await apiClient.post<InspectionResponse>(BASE, data)
    return res.data
  },

  getById: async (id: string): Promise<InspectionResponse> => {
    const res = await apiClient.get<InspectionResponse>(`${BASE}/${id}`)
    return res.data
  },

  getAll: async (): Promise<InspectionSummary[]> => {
    const res = await apiClient.get<InspectionSummary[]>(BASE)
    return res.data
  },

  getByUnit: async (unitId: string): Promise<InspectionSummary[]> => {
    const res = await apiClient.get<InspectionSummary[]>(BASE, { params: { unitId } })
    return res.data
  },

  /** Completed inspections for a unit — used by the caution fee deduction picker */
  getCompletedByUnit: async (unitId: string): Promise<InspectionSummary[]> => {
    const res = await apiClient.get<InspectionSummary[]>(`${BASE}/unit/${unitId}/completed`)
    return res.data
  },

  complete: async (id: string, data: CompleteInspectionRequest): Promise<InspectionResponse> => {
    const res = await apiClient.patch<InspectionResponse>(`${BASE}/${id}/complete`, data)
    return res.data
  },

  update: async (id: string, data: Partial<CreateInspectionRequest>): Promise<InspectionResponse> => {
    const res = await apiClient.put<InspectionResponse>(`${BASE}/${id}`, data)
    return res.data
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`${BASE}/${id}`)
  },

  /** List inspections for the currently authenticated occupant */
  getMyInspections: async (): Promise<InspectionSummary[]> => {
    const res = await apiClient.get<InspectionSummary[]>(`${BASE}/my`)
    return res.data
  },
}

export async function signOffInspection(id: string, data: InspectionSignOffRequest): Promise<InspectionResponse> {
  const res = await apiClient.patch<InspectionResponse>(`${BASE}/${id}/sign-off`, data)
  return res.data
}

export function getInspectionReportUrl(id: string): string {
  return `${BASE}/${id}/report`
}

/**
 * Upload inspection item photos to ImageKit.
 *
 * Folder: /tenantx/{tenantId}/inspections/{inspectionId}
 *
 * @returns array of CDN URLs ready to store in ItemUpsert.photoUrls
 */
export async function uploadInspectionPhotos(
  files: File[],
  tenantId: string,
  inspectionId: string
): Promise<string[]> {
  const folder = `/tenantx/${tenantId}/inspections/${inspectionId}`
  const uploaded = await uploadImages(files, { folder })
  return uploaded.map(f => f.url)
}

/**
 * Build a CompleteInspectionRequest with pre-uploaded photo URLs already set.
 * Takes a map of { room_itemName → File[] } and returns items with urls filled in.
 */
export async function buildItemsWithPhotos(
  items: (ItemUpsert & { pendingFiles?: File[] })[],
  tenantId: string,
  inspectionId: string
): Promise<ItemUpsert[]> {
  return Promise.all(
    items.map(async item => {
      if (!item.pendingFiles?.length) return item
      const uploaded = await uploadInspectionPhotos(item.pendingFiles, tenantId, inspectionId)
      return {
        ...item,
        photoUrls: [...(item.photoUrls ?? []), ...uploaded],
        pendingFiles: undefined,
      }
    })
  )
}
