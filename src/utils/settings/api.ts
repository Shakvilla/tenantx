// Documentation: /docs/settings/settings-module.md

import axios, { AxiosError } from 'axios'

// Type Imports
import type { PaymentSettings } from '@/types/settings/paymentTypes'
import type { NotificationSettings, SMSSettings } from '@/types/settings/notificationTypes'
import type { CompanySettings } from '@/types/settings/companyTypes'

const API_BASE_URL = '/api/settings'

// Generic API call helper using axios
async function apiCall<T>(endpoint: string, options?: { method?: string; body?: string }): Promise<T> {
  try {
    const config = {
      url: `${API_BASE_URL}${endpoint}`,
      method: options?.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      data: options?.body ? JSON.parse(options.body) : undefined,
    }

    const response = await axios.request<T>(config)

    
return response.data
  } catch (error) {
    if (error instanceof AxiosError) {
      const status = error.response?.status
      const data = error.response?.data as { message?: string } | undefined

      // Check if response is HTML (like 404 page)
      const contentType = error.response?.headers?.['content-type']
      const isHtml = contentType && contentType.includes('text/html')

      if (isHtml) {
        throw new Error(
          `API endpoint not found: ${endpoint}. Please ensure the backend API is running and the endpoint exists.`
        )
      }

      throw new Error(data?.message || `HTTP error! status: ${status}`)
    }

    throw error
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
      body: JSON.stringify(settings),
    })
  },
}

// Notification Settings API
export const notificationSettingsApi = {
  get: async (): Promise<NotificationSettings> => {
    return apiCall<NotificationSettings>('/notification')
  },
  update: async (settings: Partial<NotificationSettings>): Promise<NotificationSettings> => {
    return apiCall<NotificationSettings>('/notification', {
      method: 'POST',
      body: JSON.stringify(settings),
    })
  },
  testEmail: async (to: string): Promise<{ success: boolean; message: string }> => {
    return apiCall<{ success: boolean; message: string }>('/notification/test-email', {
      method: 'POST',
      body: JSON.stringify({ to }),
    })
  },
}

// SMS Settings API
export const smsSettingsApi = {
  get: async (): Promise<SMSSettings> => {
    return apiCall<SMSSettings>('/sms/config')
  },
  update: async (settings: Partial<SMSSettings>): Promise<SMSSettings> => {
    return apiCall<SMSSettings>('/sms/config', {
      method: 'POST',
      body: JSON.stringify(settings),
    })
  },
  test: async (phoneNumber: string): Promise<{ success: boolean; message: string }> => {
    return apiCall<{ success: boolean; message: string }>('/sms/test', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber }),
    })
  },
}

// Company Settings API
export const companySettingsApi = {
  get: async (): Promise<CompanySettings> => {
    return apiCall<CompanySettings>('/company')
  },
  update: async (settings: Partial<CompanySettings>): Promise<CompanySettings> => {
    return apiCall<CompanySettings>('/company', {
      method: 'POST',
      body: JSON.stringify(settings),
    })
  },
}

// Recurring Invoice Settings API
export const recurringInvoiceSettingsApi = {
  get: async (): Promise<any> => {
    return apiCall<any>('/recurring-invoice')
  },
  update: async (settings: any): Promise<any> => {
    return apiCall<any>('/recurring-invoice', {
      method: 'POST',
      body: JSON.stringify(settings),
    })
  },
}
