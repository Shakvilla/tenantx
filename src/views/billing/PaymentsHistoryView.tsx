'use client'

// Auth Imports
import { useAuth } from '@/contexts/AuthContext'

// View Imports
import OccupantPaymentsView from '@/views/billing/OccupantPaymentsView'
import LandlordPaymentsView from '@/views/billing/LandlordPaymentsView'

/**
 * Role-aware entry point for /billing/payments.
 *
 * Occupants see only their own payment history; everyone else (landlord,
 * admin, staff, etc.) sees the tenant-wide payments/billing history.
 */
const PaymentsHistoryView = () => {
  const { user } = useAuth()
  const isOccupant = user?.userType === 'OCCUPANT'

  return isOccupant ? <OccupantPaymentsView /> : <LandlordPaymentsView />
}

export default PaymentsHistoryView
