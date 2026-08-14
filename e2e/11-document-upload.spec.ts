import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { test, expect, type Page } from '@playwright/test'

import { E2E_USER, unique } from './fixtures'

/**
 * Uploading a document, end to end, after the move off Supabase Storage.
 *
 * The old path routed bytes through a Next route handler holding a
 * service-role key and returned a permanent PUBLIC url, which the list then
 * opened directly — anyone holding the link could read a tenancy agreement, and
 * nothing checked they owned it. It was also dead under Docker, because
 * docker-compose never passed the Supabase keys to the web container.
 *
 * Files now go straight to ImageKit as PRIVATE objects, and reading one goes
 * through a signed link the server mints after checking the caller's tenant
 * owns the document.
 *
 * This drives the real dialog with a real PDF, then checks the three things the
 * migration was for:
 *
 *   1. the stored url is NOT publicly readable  (403, not 200)
 *   2. the app can still open it, via a signed link that works
 *   3. deleting the document takes the stored file with it, server-side
 */

const API = process.env.E2E_API_URL ?? 'http://localhost:8099/api/v1'

/** A genuinely valid one-page PDF — not a renamed text file. */
function writeTestPdf(): string {
  const text = 'TenantX - Signed Tenancy Agreement (e2e upload)'
  const content = Buffer.from(`BT /F1 14 Tf 60 700 Td (${text}) Tj ET`)
  const objs = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'
  ]

  let out = '%PDF-1.4\n'
  const offsets: number[] = []

  objs.forEach((o, i) => {
    offsets.push(Buffer.byteLength(out))
    out += `${i + 1} 0 obj\n${o}\nendobj\n`
  })

  const xref = Buffer.byteLength(out)

  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`
  offsets.forEach(o => { out += `${String(o).padStart(10, '0')} 00000 n \n` })
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`

  const path = join(mkdtempSync(join(tmpdir(), 'tenantx-doc-')), 'tenancy-agreement.pdf')

  writeFileSync(path, out, 'binary')

  return path
}

function queryDb(sql: string): string {
  return execFileSync(
    'docker',
    ['exec', 'tenantx-backend-db-1', 'psql', '-U', 'postgres', '-d', 'tenantx', '-t', '-A', '-c', sql],
    { encoding: 'utf8' }
  ).trim()
}

/** The wizard opens full-screen over whatever page you asked for. */
async function dismissSetupWizard(page: Page) {
  const close = page.getByRole('button', { name: 'close setup' })

  await close.waitFor({ state: 'visible', timeout: 15_000 }).catch(() => {})

  if (await close.isVisible().catch(() => false)) {
    await close.click()
    await page.getByRole('button', { name: /Resume Later/i }).click()
    await expect(close).toBeHidden()
  }
}

/**
 * Scoped to the dialog: the Documents page behind it has its own Status and
 * Property filters, so an unscoped /^Property/i matches two controls and
 * Playwright refuses to guess.
 */
async function pickOption(page: Page, label: RegExp, optionText?: RegExp) {
  await page.getByRole('dialog').getByLabel(label).click()

  const option = optionText
    ? page.getByRole('option', { name: optionText })
    : page.getByRole('option').first()

  await option.click()
}

test.describe.serial('uploading a document to ImageKit', () => {
  const occupantLast = unique('DocOwner')

  let documentId = ''
  let storedUrl = ''

  test.beforeAll(async ({ playwright, browser }) => {
    // A document needs an occupant and a property to attach to.
    const context = await browser.newContext({ storageState: 'e2e/.auth/state.json' })
    const page = await context.newPage()
    const cookies = await page.context().cookies()
    const token = cookies.find(c => c.name === 'auth_token')?.value
    const headers = {
      Authorization: `Bearer ${token}`,
      'X-Tenant-ID': E2E_USER.tenantId,
      'Content-Type': 'application/json'
    }
    const req = await playwright.request.newContext()

    await req.post(`${API}/properties`, {
      headers,
      data: {
        name: unique('Doc Property'),
        type: 'house', ownership: 'own', condition: 'good', status: 'active',
        region: 'greater-accra', district: 'accra-metro', city: 'Accra'
      }
    })

    await req.post(`${API}/occupants`, {
      headers,
      data: {
        firstName: 'E2E',
        lastName: occupantLast,
        email: `${occupantLast.toLowerCase()}@localtest.dev`,
        phone: `02${Math.floor(10_000_000 + Math.random() * 89_999_999)}`,
        status: 'active'
      }
    })

    await req.dispose()
    await context.close()
  })

  test('a real PDF uploads through the dialog and is filed', async ({ page }) => {
    await page.goto('/documents')
    await dismissSetupWizard(page)

    await page.getByRole('button', { name: /Upload Document/i }).click()

    await pickOption(page, /Document Type/i, /^Signed Tenancy Agreement$/)
    await pickOption(page, /^Tenant/i, new RegExp(occupantLast))
    await pickOption(page, /^Property/i)

    // The real control, with real PDF bytes — this is the path that used to
    // post to a Next route holding a Supabase service key.
    await page.locator('input[type="file"]').setInputFiles(writeTestPdf())

    // The upload is direct to ImageKit; wait for the dialog to report it done
    // rather than guessing at a delay.
    await expect(page.getByText(/tenancy-agreement\.pdf/i)).toBeVisible({ timeout: 60_000 })

    await page.getByRole('button', { name: /Save Document/i }).click()

    await expect(page.getByText(/Signed Tenancy Agreement/).first()).toBeVisible({ timeout: 30_000 })

    const row = queryDb(
      `SELECT id || '|' || coalesce(file_url,'') || '|' || coalesce(file_id,'')
       FROM documents WHERE tenant_id = '${E2E_USER.tenantId}'
       ORDER BY created_at DESC LIMIT 1;`
    )
    const [id, url, fileId] = row.split('|')

    documentId = id
    storedUrl = url

    expect(fileId, 'no ImageKit file id was stored').toBeTruthy()
    expect(url, 'the stored url should be an ImageKit delivery url').toContain('ik.imagekit.io')
    expect(url, 'documents belong under the tenant folder').toContain(E2E_USER.tenantId)
  })

  test('the stored url is private — it is not readable on its own', async ({ page }) => {
    expect(storedUrl, 'previous test did not record the url').toBeTruthy()

    const res = await page.request.get(storedUrl)

    // The whole point of the migration. Under Supabase this returned 200 to
    // anyone at all, which for a tenancy agreement is the defect.
    //
    // ImageKit answers 403 for a private file requested without a signature;
    // both codes are accepted because which one a CDN picks is its business,
    // and pinning the exact number would make this fail on a provider change
    // that had not actually exposed anything.
    expect([401, 403], `${storedUrl} should not be publicly readable`).toContain(res.status())

    // Belt and braces: whatever the status, no PDF came back.
    expect((await res.body()).subarray(0, 4).toString()).not.toBe('%PDF')
  })

  test('the app opens it with a signed link that actually works', async ({ page }) => {
    await page.goto('/documents')
    await dismissSetupWizard(page)

    const res = await page.request.get(`${API}/documents/${documentId}/download-url`, {
      headers: {
        Authorization: `Bearer ${(await page.context().cookies()).find(c => c.name === 'auth_token')?.value}`,
        'X-Tenant-ID': E2E_USER.tenantId
      }
    })

    expect(res.status()).toBe(200)

    const { url } = await res.json()

    expect(url, 'the link must be signed, or it is just the private url again').toContain('ik-s=')
    expect(url).toContain('ik-t=')

    // A signature that does not actually open the file is worse than none: it
    // looks like it worked and fails in the landlord's browser.
    const opened = await page.request.get(url)

    expect(opened.status(), 'the signed link did not open the file').toBe(200)
    expect((await opened.body()).subarray(0, 4).toString()).toBe('%PDF')
  })

  test('deleting the document removes the stored file too', async ({ page }) => {
    const res = await page.request.delete(`${API}/documents/${documentId}`, {
      headers: {
        Authorization: `Bearer ${(await page.context().cookies()).find(c => c.name === 'auth_token')?.value}`,
        'X-Tenant-ID': E2E_USER.tenantId
      }
    })

    expect(res.status()).toBe(204)

    // Deletion is server-side and asynchronous — it runs off the request thread
    // so it cannot hold a transaction open across HTTPS calls. Poll rather than
    // assert immediately.
    // 404 once ImageKit has dropped it — up from the 403 a live private file
    // gives. The browser used to make this cleanup call itself, after the
    // record was gone, and skipped it whenever the tab was closed first.
    await expect
      .poll(async () => (await page.request.get(storedUrl)).status(), { timeout: 60_000 })
      .toBe(404)
  })
})
