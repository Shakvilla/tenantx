import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

import type * as SettingsApi from '@/lib/api/settings'

vi.mock('@/lib/api/settings', async importOriginal => {
  const actual = await importOriginal<typeof SettingsApi>()

  return {
    ...actual,
    companySettingsApi: { get: vi.fn(), update: vi.fn() },
    contactSettingsApi: { get: vi.fn(), update: vi.fn() }
  }
})

import { companySettingsApi, contactSettingsApi } from '@/lib/api/settings'
import BasicInformationSettings from '@/views/settings/company/BasicInformationSettings'

const phoneField = () => screen.getByLabelText(/phone number/i)

/** Renders with the company blob and the typed contact endpoint stubbed. */
async function renderForm({
  blobPhone = '',
  contactPhone = null as string | null
} = {}) {
  vi.mocked(companySettingsApi.get).mockResolvedValue({
    basic: { companyName: 'Atkaada', phone: blobPhone, email: 'hi@atkaada.com' }
  } as never)
  vi.mocked(companySettingsApi.update).mockResolvedValue({} as never)
  vi.mocked(contactSettingsApi.get).mockResolvedValue({ contactPhone } as never)
  vi.mocked(contactSettingsApi.update).mockResolvedValue({
    contactPhone: '+233241234567'
  } as never)

  render(<BasicInformationSettings />)
  await waitFor(() => expect(contactSettingsApi.get).toHaveBeenCalled())
}

const save = () => fireEvent.click(screen.getByRole('button', { name: /save settings/i }))

describe('BasicInformationSettings — the published contact number', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows the published number, not the settings blob’s copy', async () => {
    await renderForm({ blobPhone: '0209999999', contactPhone: '+233241234567' })

    await waitFor(() => expect(phoneField()).toHaveValue('+233241234567'))
  })

  it('falls back to the blob’s old value when nothing is published yet', async () => {
    // This field used to write to the blob, where nothing ever read it. A
    // landlord who filled it in before must not find the field empty — one
    // save then publishes what they already entered.
    await renderForm({ blobPhone: '0209999999', contactPhone: null })

    await waitFor(() => expect(phoneField()).toHaveValue('0209999999'))
  })

  it('saves the number to the typed endpoint', async () => {
    await renderForm()

    fireEvent.change(phoneField(), { target: { value: '024 123 4567' } })
    save()

    await waitFor(() => expect(contactSettingsApi.update).toHaveBeenCalledWith('024 123 4567'))
  })

  it('stops sending the phone into the company blob, so the two cannot drift', async () => {
    await renderForm()

    fireEvent.change(phoneField(), { target: { value: '024 123 4567' } })
    save()

    await waitFor(() => expect(companySettingsApi.update).toHaveBeenCalled())
    const payload = vi.mocked(companySettingsApi.update).mock.calls[0][0] as any

    expect(payload.basic).not.toHaveProperty('phone')
  })

  it('shows the normalised number back, since that is what tenants dial', async () => {
    await renderForm()

    fireEvent.change(phoneField(), { target: { value: '024 123 4567' } })
    save()

    await waitFor(() => expect(phoneField()).toHaveValue('+233241234567'))
    expect(screen.getByText(/\+233241234567/)).toBeInTheDocument()
  })

  it('rejects a malformed number inline, without calling either endpoint', async () => {
    await renderForm()

    fireEvent.change(phoneField(), { target: { value: 'not a phone' } })
    save()

    await waitFor(() => expect(screen.getByText(/7–16 digits/)).toBeInTheDocument())
    expect(contactSettingsApi.update).not.toHaveBeenCalled()

    // The whole save is blocked, not just the phone half — otherwise the form
    // would report success while silently dropping the number.
    expect(companySettingsApi.update).not.toHaveBeenCalled()
  })

  it('accepts a blank number, which unpublishes it', async () => {
    await renderForm({ contactPhone: '+233241234567' })

    fireEvent.change(phoneField(), { target: { value: '' } })
    save()

    await waitFor(() => expect(contactSettingsApi.update).toHaveBeenCalledWith(''))
  })

  it('still renders when the contact lookup fails', async () => {
    vi.mocked(companySettingsApi.get).mockResolvedValue({
      basic: { companyName: 'Atkaada' }
    } as never)
    vi.mocked(contactSettingsApi.get).mockRejectedValue(new Error('boom'))

    render(<BasicInformationSettings />)

    await waitFor(() => expect(screen.getByLabelText(/company name/i)).toHaveValue('Atkaada'))
  })
})
