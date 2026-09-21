import { test, expect, type APIRequestContext, type Page } from '@playwright/test'

import { E2E_USER, unique } from './fixtures'

/**
 * Agent relationships + mandates, end to end against the API and the UI.
 *
 * Requires AGENT_NETWORK enabled for the e2e tenant (V198 seeds it disabled
 * everywhere; the pilot enables it per tenant via the CMS or an override).
 * While the flag is off every test below skips itself after proving the lock
 * is visible — so the suite stays green on a fresh seed and exercises the
 * full flow the moment the flag is on. Nothing here depends on OTP delivery,
 * so the claim handshake itself is covered by backend tests, not this spec.
 */

const API = process.env.E2E_API_URL ?? 'http://localhost:8099/api/v1'

async function apiHeaders(page: Page): Promise<Record<string, string>> {
  const cookies = await page.context().cookies()
  const token = cookies.find(c => c.name === 'auth_token')?.value
  const tenant = cookies.find(c => c.name === 'tenant_id')?.value ?? E2E_USER.tenantId

  if (!token) throw new Error('No auth_token cookie — auth.setup.ts did not run, or its state is stale.')

  return { Authorization: `Bearer ${token}`, 'X-Tenant-ID': tenant, 'Content-Type': 'application/json' }
}

async function post<T>(req: APIRequestContext, path: string, body: unknown, headers: Record<string, string>): Promise<{ status: number; body: T }> {
  const res = await req.post(`${API}${path}`, { data: body, headers })

  return { status: res.status(), body: (await res.json().catch(() => ({}))) as T }
}

async function get<T>(req: APIRequestContext, path: string, headers: Record<string, string>): Promise<{ status: number; body: T }> {
  const res = await req.get(`${API}${path}`, { headers })

  return { status: res.status(), body: (await res.json().catch(() => ({}))) as T }
}

async function patch<T>(req: APIRequestContext, path: string, body: unknown, headers: Record<string, string>): Promise<{ status: number; body: T }> {
  const res = await req.patch(`${API}${path}`, { data: body, headers })

  return { status: res.status(), body: (await res.json().catch(() => ({}))) as T }
}

async function isFlagOn(page: Page): Promise<boolean> {
  await page.goto('/members/relationships')
  const locked = page.getByText(/Agent relationships are part of the agent network/i)

  // Visible quickly when locked; when unlocked the list (or its empty state)
  // renders instead and the lock copy never appears.
  return (await locked.waitFor({ state: 'visible', timeout: 15_000 }).then(() => false).catch(() => true))
}

test.describe('agent relationships', () => {
  test('record → invite → mandate draft → propose → activation gate → revoke → end', async ({ page, request }) => {
    test.skip(!(await isFlagOn(page)), 'AGENT_NETWORK is off for this tenant — enable it to run the positive flow.')

    const headers = await apiHeaders(page)
    const name = unique('E2E Agent')

    // 1. Record an offline agent — unclaimed, zero access.
    const created = await post<{ relationshipId: string; status: string }>(
      request, '/agent-relationships', { displayName: name, email: `${Date.now()}@example.com` }, headers)

    expect(created.status, `create ${JSON.stringify(created.body)}`).toBe(201)
    expect(created.body.status).toBe('UNCLAIMED')
    const relationshipId = created.body.relationshipId

    // 2. Invite — moves to INVITED and issues a single-use claim token server-side.
    const invited = await post<{ invitationId: string }>(
      request, `/agent-relationships/${relationshipId}/invite`,
      { contactChannel: 'EMAIL', contact: `${Date.now()}@example.com` }, headers)

    expect(invited.status, `invite ${JSON.stringify(invited.body)}`).toBe(201)

    const listed = await get<{ relationshipId: string; status: string }[]>(request, '/agent-relationships', headers)

    expect(listed.status).toBe(200)
    expect(listed.body.find(r => r.relationshipId === relationshipId)?.status).toBe('INVITED')

    // 3. Draft a mandate, scope it, propose the terms.
    const draft = await post<{ mandateId: string; status: string }>(
      request, `/agent-relationships/${relationshipId}/mandates`, {}, headers)

    expect(draft.status).toBe(201)
    const mandateId = draft.body.mandateId

    const scoped = await patch<{ status: string; termsVersion: number }>(
      request, `/agent-mandates/${mandateId}`,
      {
        propertyIds: ['00000000-0000-0000-0000-000000000001'],
        capabilities: ['VIEW_ASSIGNED_PROPERTIES', 'SCHEDULE_VIEWINGS'],
        feeTerms: [{ feeType: 'COMMISSION', payer: 'LANDLORD', basis: 'PERCENT_OF_RENT', rate: 0.1 }]
      },
      headers)

    expect(scoped.status, `scope ${JSON.stringify(scoped.body)}`).toBe(200)

    const proposed = await post<{ status: string }>(request, `/agent-mandates/${mandateId}/propose`, {}, headers)

    expect(proposed.status).toBe(200)
    expect(proposed.body.status).toBe('PROPOSED')

    // 4. The mutual-acceptance gate: landlord activation before agent acceptance
    // must fail — access requires both acceptances, never one side alone.
    const earlyActivate = await post(request, `/agent-mandates/${mandateId}/activate`, {}, headers)

    expect(earlyActivate.status).toBe(422)

    // 5. Revoke the draft-cycle mandate; revocation is terminal.
    const revoked = await post<{ status: string }>(request, `/agent-mandates/${mandateId}/revoke`, {}, headers)

    expect(revoked.status).toBe(200)
    expect(revoked.body.status).toBe('REVOKED')

    // 6. End the relationship with a reason; the record (and its history) stays.
    const ended = await post<{ status: string }>(
      request, `/agent-relationships/${relationshipId}/end`, { reason: 'E2E cleanup' }, headers)

    expect(ended.status).toBe(200)
    expect(ended.body.status).toBe('ENDED')

    const relisted = await get<{ relationshipId: string; status: string }[]>(request, '/agent-relationships', headers)

    expect(relisted.body.find(r => r.relationshipId === relationshipId)?.status).toBe('ENDED')
  })

  test('landlord UI records an offline agent', async ({ page }) => {
    test.skip(!(await isFlagOn(page)), 'AGENT_NETWORK is off for this tenant — enable it to run the UI flow.')

    const name = unique('E2E UI Agent')

    await page.goto('/members/relationships')
    await page.getByRole('button', { name: 'Record offline agent' }).click()
    await page.getByLabel('Display name').fill(name)
    await page.getByRole('button', { name: 'Record agent', exact: true }).click()

    await expect(page.getByText('Offline agent recorded')).toBeVisible({ timeout: 20_000 })
    await expect(page.getByText(name).first()).toBeVisible({ timeout: 20_000 })
  })
})
