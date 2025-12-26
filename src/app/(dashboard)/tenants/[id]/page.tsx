'use client'

// React Imports
import { useState } from 'react'

import { useParams } from 'next/navigation'

// Component Imports
import TenantDetails from '@/views/tenants/view/TenantDetails'

const ViewTenantPage = () => {
  const params = useParams()
  const tenantId = params.id as string

  // TODO: Fetch tenant data from API using tenantId
  // For now, using sample data
  const tenantData = {
    id: tenantId,
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+233 24 123 4567',
    roomNo: 'Unit 101',
    propertyName: 'Beautiful modern style luxury home exterior at sunset',
    numberOfUnits: 1,
    costPerMonth: '₵1,450',
    leasePeriod: '12 months',
    totalAmount: '₵14,400',
    status: 'active' as const,
    avatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3',
    age: 36,
    familyMembers: 4,
    job: 'Lawyer',
    previousAddress: {
      address: 'Staten Island, NY 10314, USA',
      city: 'New York',
      state: 'Manhattan',
      zipCode: '1216',
      country: 'United States'
    },
    permanentAddress: {
      address: 'Staten Island, NY 10314, USA',
      city: 'New York',
      state: 'Manhattan',
      zipCode: '1216',
      country: 'United States'
    },
    propertyImage:
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2350&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    propertyAddress: 'New York Staten Island, NY 10314, USA',
    unitName: 'Unite 4',
    securityDeposit: '₵400',
    lateFee: '₵100',
    rentType: 'Monthly',
    receipt: '₵100',
    paymentDueDate: '09/07/2024'
  }

  return <TenantDetails tenantData={tenantData} tenantId={tenantId} />
}

export default ViewTenantPage
