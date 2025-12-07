// Documentation: /docs/settings/settings-module.md

// Type Imports
import type { PaymentSettings } from '@/types/settings/paymentTypes'
import type { NotificationSettings, SMSSettings } from '@/types/settings/notificationTypes'
import type { CompanySettings } from '@/types/settings/companyTypes'

const API_BASE_URL = '/api/settings'

// Generic API call helper
async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers
    },
    ...options
  })

  // Check if response is JSON
  const contentType = response.headers.get('content-type')
  const isJson = contentType && contentType.includes('application/json')

  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`
    
    if (isJson) {
      try {
        const error = await response.json()
        errorMessage = error.message || errorMessage
      } catch {
        // If JSON parsing fails, use default message
      }
    } else {
      // If response is HTML (like 404 page), read as text to get better error
      try {
        const text = await response.text()
        if (text.includes('<!DOCTYPE')) {
          errorMessage = `API endpoint not found: ${endpoint}. Please ensure the backend API is running and the endpoint exists.`
        } else {
          errorMessage = text || errorMessage
        }
      } catch {
        // Use default error message
      }
    }
    
    throw new Error(errorMessage)
  }

  // Parse JSON response
  if (isJson) {
    try {
      return await response.json()
    } catch (error) {
      throw new Error(`Failed to parse JSON response: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  } else {
    // If response is not JSON, return empty object (for endpoints that might return empty responses)
    return {} as T
  }
}

// Payment Settings API
export const paymentSettingsApi = {
  get: async (): Promise<PaymentSettings> => {
    return apiCall<PaymentSettings>('/payment')
  },
  update: async (settings: Partial<PaymentSettings>): Promise<PaymentSettings> => {
    return apiCall<PaymentSettings>('/payment', {
      method: 'POST',
      body: JSON.stringify(settings)
    })
  }
}

// Notification Settings API
export const notificationSettingsApi = {
  get: async (): Promise<NotificationSettings> => {
    return apiCall<NotificationSettings>('/notification')
  },
  update: async (settings: Partial<NotificationSettings>): Promise<NotificationSettings> => {
    return apiCall<NotificationSettings>('/notification', {
      method: 'POST',
      body: JSON.stringify(settings)
    })
  },
  testEmail: async (to: string): Promise<{ success: boolean; message: string }> => {
    return apiCall<{ success: boolean; message: string }>('/notification/test-email', {
      method: 'POST',
      body: JSON.stringify({ to })
    })
  }
}

// SMS Settings API
export const smsSettingsApi = {
  get: async (): Promise<SMSSettings> => {
    return apiCall<SMSSettings>('/sms/config')
  },
  update: async (settings: Partial<SMSSettings>): Promise<SMSSettings> => {
    return apiCall<SMSSettings>('/sms/config', {
      method: 'POST',
      body: JSON.stringify(settings)
    })
  },
  test: async (phoneNumber: string): Promise<{ success: boolean; message: string }> => {
    return apiCall<{ success: boolean; message: string }>('/sms/test', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber })
    })
  }
}

// Company Settings API
export const companySettingsApi = {
  get: async (): Promise<CompanySettings> => {
    return apiCall<CompanySettings>('/company')
  },
  update: async (settings: Partial<CompanySettings>): Promise<CompanySettings> => {
    return apiCall<CompanySettings>('/company', {
      method: 'POST',
      body: JSON.stringify(settings)
    })
  }
}

// Recurring Invoice Settings API
export const recurringInvoiceSettingsApi = {
  get: async (): Promise<any> => {
    return apiCall<any>('/recurring-invoice')
  },
  update: async (settings: any): Promise<any> => {
    return apiCall<any>('/recurring-invoice', {
      method: 'POST',
      body: JSON.stringify(settings)
    })
  }
}

