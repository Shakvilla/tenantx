/**
 * The browser's device identity for login OTP.
 *
 * This is NOT a secret and NOT a credential. It names a browser so the backend can remember
 * that this particular browser already passed an OTP challenge, and skip the challenge for
 * `otp.device.trust_days`. Possessing it grants nothing on its own — trust is stored
 * server-side against (principal, device) and every use still requires a valid session or a
 * correct password first.
 *
 * ONE id per browser profile, shared by the landlord and platform-admin surfaces. It names the
 * browser, not the account; the backend already scopes trust per principal, so a second id
 * would only double the challenges without isolating anything.
 */
export const DEVICE_ID_STORAGE_KEY = 'tenantx_device_id'

export function getDeviceId(): string {
  // Server-rendered passes have no browser to identify. Returning '' rather than generating
  // one keeps a per-render random value out of the header, which would look like a brand new
  // device on every single request.
  if (typeof window === 'undefined') return ''

  const existing = window.localStorage.getItem(DEVICE_ID_STORAGE_KEY)

  if (existing) return existing

  const generated = crypto.randomUUID()

  window.localStorage.setItem(DEVICE_ID_STORAGE_KEY, generated)

  return generated
}
