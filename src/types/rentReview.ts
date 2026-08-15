export type RentReviewStatus = 'PENDING' | 'NOTIFIED' | 'APPLIED' | 'CANCELLED'

export interface RentReviewSummary {
  id:           string
  unitId:       string
  unitNo:       string
  propertyName: string
  occupantName: string
  currentRent:  number
  proposedRent: number
  increasePct:  number | null
  effectiveDate: string
  status:       RentReviewStatus
  createdAt:    string
}

export interface RentReviewResponse {
  id:            string
  unitId:        string
  unitNo:        string
  propertyId:    string
  propertyName:  string
  occupantId:    string | null
  occupantName:  string | null
  occupantPhone: string | null
  occupantEmail: string | null
  currentRent:   number
  proposedRent:  number
  increasePct:   number | null
  effectiveDate: string
  status:        RentReviewStatus
  notifiedAt:    string | null
  appliedAt:     string | null
  cancelledAt:   string | null
  notes:         string | null
  createdAt:     string
}

export interface CreateRentReviewRequest {
  unitId:        string
  proposedRent:  number
  effectiveDate: string
  notes?:        string
}
