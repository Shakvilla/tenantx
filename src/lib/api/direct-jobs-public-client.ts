/**
 * Public direct-job client — no auth, no tenant header.
 * Uses native fetch so it works in both Server and Client components.
 *
 * This is the destination for the maintainer job-link SMS
 * ("https://app.tenantx.cloud/jobs/{token}"). The visitor has no TenantX
 * account, so nothing here may send Authorization or X-Tenant-ID — see
 * src/lib/api/client.ts, whose interceptor injects both and is therefore
 * NOT usable for this surface.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080/api/v1'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DirectJobStatus = 'SENT' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED' | 'COMPLETED' | 'CANCELLED'

/**
 * DirectJobDto.PublicView — deliberately withholds occupant name, phone and
 * address. This link arrives by SMS, is forwardable, and sits in a third
 * party's message history indefinitely. Do not add fields to this type that
 * the API does not actually return.
 */
export interface DirectJobPublicView {
  category: string | null
  description: string | null
  preferredTiming: string | null
  city: string | null
  region: string | null
  status: DirectJobStatus
}

interface DirectJobErrorBody {
  status?: number
  message?: string
  code?: string
}

export class DirectJobRequestError extends Error {
  status: number
  code: string

  constructor(status: number, message: string, code: string) {
    super(message)
    this.name = 'DirectJobRequestError'
    this.status = status
    this.code = code
  }
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

async function throwForResponse(res: Response): Promise<never> {
  let body: DirectJobErrorBody = {}

  try {
    body = (await res.json()) as DirectJobErrorBody
  } catch {
    // Body wasn't JSON (or was empty) — fall back to a generic message below.
  }

  throw new DirectJobRequestError(res.status, body.message ?? 'Something went wrong', body.code ?? 'UNKNOWN_ERROR')
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

export async function getJob(token: string): Promise<DirectJobPublicView> {
  const res = await fetch(`${API_BASE}/public/jobs/${token}`, { cache: 'no-store' })

  if (!res.ok) return throwForResponse(res)

  return res.json() as Promise<DirectJobPublicView>
}

export async function acceptJob(token: string): Promise<DirectJobPublicView> {
  const res = await fetch(`${API_BASE}/public/jobs/${token}/accept`, { method: 'POST' })

  if (!res.ok) return throwForResponse(res)

  return res.json() as Promise<DirectJobPublicView>
}

/**
 * `reason` is optional. When omitted (or blank), no `reason` key is sent at
 * all — never an empty string — so the backend doesn't record a hollow
 * decline reason.
 */
export async function declineJob(token: string, reason?: string): Promise<DirectJobPublicView> {
  const hasReason = typeof reason === 'string' && reason.trim() !== ''

  const res = await fetch(`${API_BASE}/public/jobs/${token}/decline`, {
    method: 'POST',
    ...(hasReason && {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    }),
  })

  if (!res.ok) return throwForResponse(res)

  return res.json() as Promise<DirectJobPublicView>
}
