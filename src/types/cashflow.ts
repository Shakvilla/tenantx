export interface CashFlowMonthlyProjection {
  monthLabel: string             // "Jan '25"
  advanceRentIncome: number
  regularRentIncome: number
  totalExpected: number
  advanceRenewalsCount: number
  regularUnitsCount: number
}

export interface CashFlowResponse {
  months: CashFlowMonthlyProjection[]
  totalExpected12Months: number
  avgMonthlyExpected: number
  totalUnits: number
  vacantUnits: number
  occupiedAdvanceUnits: number
  occupiedRegularUnits: number
}
