// Documentation: /docs/settings/settings-module.md

export type PaymentGateway = 'redde' | 'paystack' | 'hubtel'

export type PaymentMethod = 'card' | 'bank_transfer' | 'mobile_money' | 'cash'

export type MobileMoneyProvider = 'mtn' | 'vodafone' | 'airteltigo'

export type GatewayMode = 'test' | 'live'

export type TaxDisplayOption = 'inclusive' | 'exclusive'

export type CurrencySymbolPosition = 'before' | 'after'

export interface ReddeConfig {
  apiKey: string
  merchantId: string
  merchantToken: string
  webhookUrl: string
  enabled: boolean
  mode: GatewayMode
  priority: number
}

export interface PaystackConfig {
  publicKey: string
  secretKey: string
  merchantCode: string
  webhookUrl: string
  enabled: boolean
  mode: GatewayMode
  priority: number
}

export interface HubtelConfig {
  clientId: string
  clientSecret: string
  merchantAccountNumber: string
  webhookUrl: string
  enabled: boolean
  mode: GatewayMode
  priority: number
}

export type GatewayConfig = ReddeConfig | PaystackConfig | HubtelConfig

export interface PaymentMethodConfig {
  method: PaymentMethod
  enabled: boolean
  gateway: PaymentGateway
  mobileMoneyProviders?: MobileMoneyProvider[]
}

export interface TaxSettings {
  enabled: boolean
  defaultTaxRate: number
  taxIdNumber: string
  displayOption: TaxDisplayOption
  vatEnabled: boolean
  gstEnabled: boolean
}

export interface CurrencySettings {
  defaultCurrency: string
  supportedCurrencies: string[]
  symbolPosition: CurrencySymbolPosition
  decimalPlaces: number
}

export interface PaymentSettings {
  gateways: {
    redde?: ReddeConfig
    paystack?: PaystackConfig
    hubtel?: HubtelConfig
  }
  paymentMethods: PaymentMethodConfig[]
  tax: TaxSettings
  currency: CurrencySettings
}
