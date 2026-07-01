// ─── Enums ────────────────────────────────────────────────────────────────────

export type InspectionType   = 'MOVE_IN' | 'MOVE_OUT'
export type InspectionStatus = 'DRAFT' | 'COMPLETED'
export type InspectionRoom   =
  | 'LIVING_ROOM'
  | 'KITCHEN'
  | 'BEDROOM_1'
  | 'BEDROOM_2'
  | 'BEDROOM_3'
  | 'BATHROOM_1'
  | 'BATHROOM_2'
  | 'TOILET'
  | 'CORRIDOR'
  | 'BALCONY'
  | 'GARAGE'
  | 'COMPOUND'
  | 'OTHER'

export type InspectionItemName =
  | 'WALLS'
  | 'FLOOR'
  | 'CEILING'
  | 'WINDOWS'
  | 'DOORS'
  | 'LIGHTING'
  | 'FIXTURES'
  | 'OTHER'

export type InspectionCondition = 'GOOD' | 'FAIR' | 'POOR'

// ─── Item ─────────────────────────────────────────────────────────────────────

export interface InspectionItemResponse {
  id: string
  room: InspectionRoom
  itemName: InspectionItemName
  condition: InspectionCondition | null
  notes: string | null
  photoUrls: string[]
}

export interface ItemUpsert {
  room: InspectionRoom
  itemName: InspectionItemName
  condition?: InspectionCondition
  notes?: string
  photoUrls?: string[]
}

// ─── Inspection ───────────────────────────────────────────────────────────────

/** Full inspection with all items (used after create / complete / get-by-id) */
export interface InspectionResponse {
  id: string
  unitId: string
  propertyId: string
  unitNo: string | null
  propertyName: string | null
  type: InspectionType
  status: InspectionStatus
  inspectionDate: string | null
  inspectorName: string | null
  inspectorNotes: string | null
  tenantAcknowledgement: string | null
  signedOffDate: string | null
  pdfUrl: string | null
  items: InspectionItemResponse[]
  createdAt: string
  updatedAt: string | null
}

/** Lightweight summary row for the table */
export interface InspectionSummary {
  id: string
  unitId: string
  unitNo: string | null
  propertyId: string
  propertyName: string | null
  type: InspectionType
  status: InspectionStatus
  inspectionDate: string | null
  inspectorName: string | null
  itemCount: number
  goodCount: number
  fairCount: number
  poorCount: number
  createdAt: string
  signedOffDate: string | null
}

// ─── Request DTOs ─────────────────────────────────────────────────────────────

export interface CreateInspectionRequest {
  unitId: string
  propertyId: string
  unitNo?: string
  propertyName?: string
  type: InspectionType
  inspectionDate?: string
  inspectorName?: string
}

export interface CompleteInspectionRequest {
  inspectorNotes?: string
  tenantAcknowledgement?: string
  signedOffDate?: string
  items: ItemUpsert[]
}

export interface InspectionSignOffRequest {
  tenantAcknowledgement: string
  signedOffDate: string  // ISO date string YYYY-MM-DD
}
