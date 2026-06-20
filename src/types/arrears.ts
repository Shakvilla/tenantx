export interface OccupantArrearsRow {
  occupantId:    string | null
  occupantName:  string | null
  occupantEmail: string | null
  occupantPhone: string | null
  unitNo:        string | null
  propertyName:  string | null
  currency:      string
  days1to30:     number
  days31to60:    number
  days61to90:    number
  days90plus:    number
  totalOutstanding: number
  oldestDueDate: string | null   // ISO date string
  invoiceCount:  number
}

export interface ArrearsReport {
  totalDefaulters:   number
  totalOutstanding:  number
  totalDays1to30:    number
  totalDays31to60:   number
  totalDays61to90:   number
  totalDays90plus:   number
  rows:              OccupantArrearsRow[]
}
