import { test, expect, type Page } from '@playwright/test'

import { unique } from './fixtures'

/**
 * The write paths — create, edit, delete — against the real backend.
 *
 * This is the gap the manual QA pass could not cover: it verified that the app
 * DISPLAYS correctly, but nothing exercised a form being filled and submitted.
 * A display bug shows a wrong number; a write bug corrupts what is stored.
 *
 * Assertions are made AFTER a navigation, so they prove the row round-tripped
 * through the backend rather than merely appearing in local component state.
 */

const dlg = (page: Page) => page.locator('[role="dialog"]').first()

/**
 * MUI Selects are div-based, so `selectOption` does not work, and `getByLabel`
 * resolves to the hidden native input the dialog intercepts clicks for. Target
 * the visible combobox inside the labelled form control.
 */
async function chooseFromSelect(page: Page, label: string | RegExp, option: RegExp | string) {
  await dlg(page)
    .locator('.MuiFormControl-root')
    .filter({ hasText: label })
    .first()
    .locator('[role="combobox"]')
    .click()

  await page.getByRole('option', { name: option }).first().click()
}

const saveAndContinue = (page: Page) => dlg(page).getByRole('button', { name: /Save & continue/i })

test.describe.serial('first-run wizard — the whole chain', () => {
  const propertyName = unique('E2E Property')
  const unitNo = unique('U')
  const occupantLast = unique('Tester')
  const phone = `02${Math.floor(10_000_000 + Math.random() * 89_999_999)}`

  test('creates property, unit, occupant, agreement and invoice', async ({ page }) => {
    await page.goto('/dashboard')

    const wizard = dlg(page)

    await expect(wizard.getByText('Set up your first property')).toBeVisible({ timeout: 30_000 })

    // ── 1. Property ────────────────────────────────────────────────────────
    await wizard.getByLabel(/Property name/i).fill(propertyName)
    await chooseFromSelect(page, /Property type/i, /House|Apartment|Flat/i)

    // Both starred fields are now filled, yet "Save & continue" is still
    // disabled: PropertyStep:32 also requires region + district, which are
    // only ever set by the address control the UI labels "Optional".
    await expect(saveAndContinue(page)).toBeDisabled()

    // Using that "optional" control is what reveals the genuinely required
    // fields. A GPS code decodes the region and district, then exposes a
    // "City / area *" select that did not exist on the step before.
    await wizard.getByPlaceholder(/Search an address, or enter a GPS code/i).fill('GA-184-7915')
    await page.waitForTimeout(2000)
    await page.keyboard.press('Escape') // dismiss the suggestion dropdown

    await expect(wizard.getByText(/City \/ area/i).first()).toBeVisible({ timeout: 20_000 })

    // Match a real locality, not the "Select City / area" placeholder option —
    // choosing that leaves the field empty and the step still blocked.
    await chooseFromSelect(page, /City \/ area/i, /^Accra$/)

    await expect(saveAndContinue(page)).toBeEnabled({ timeout: 20_000 })
    await saveAndContinue(page).click()

    // ── 2. Unit ────────────────────────────────────────────────────────────
    await expect(wizard.getByLabel(/Unit name \/ number/i)).toBeVisible({ timeout: 20_000 })
    await wizard.getByLabel(/Unit name \/ number/i).fill(unitNo)
    await chooseFromSelect(page, /Unit type/i, /1br|Studio|2br/i)
    await wizard.getByLabel(/Rent amount/i).fill('900')
    await saveAndContinue(page).click()

    // ── 3. Occupant ────────────────────────────────────────────────────────
    await expect(wizard.getByLabel(/First name/i)).toBeVisible({ timeout: 20_000 })
    await wizard.getByLabel(/First name/i).fill('E2E')
    await wizard.getByLabel(/Last name/i).fill(occupantLast)
    await wizard.getByLabel(/Email/i).fill(`${occupantLast.toLowerCase()}@localtest.dev`)
    // Unique per run: a phone number already held by another global user makes
    // occupant creation fail with a misleading "User not found" (see the
    // regression test below).
    await wizard.getByLabel(/Phone number/i).fill(phone)
    await wizard.getByLabel(/Move-in date/i).fill('2026-08-12')
    await saveAndContinue(page).click()

    // ── 4. Agreement ───────────────────────────────────────────────────────
    await expect(wizard.getByLabel(/Start date/i)).toBeVisible({ timeout: 20_000 })
    await wizard.getByLabel(/Start date/i).fill('2026-08-12')
    await wizard.getByLabel(/End date/i).fill('2027-08-11')
    await expect(saveAndContinue(page)).toBeEnabled({ timeout: 20_000 })
    await saveAndContinue(page).click()

    // ── 5. Invoice ─────────────────────────────────────────────────────────
    await expect(wizard.getByLabel(/Due date/i)).toBeVisible({ timeout: 20_000 })
    await wizard.getByLabel(/Due date/i).fill('2026-09-01')

    const finish = wizard.getByRole('button', { name: /Generate invoice/i })

    await expect(finish).toBeEnabled({ timeout: 20_000 })
    await finish.click()
    await page.waitForTimeout(3000)

    // ── Everything must survive a reload ───────────────────────────────────
    // `.first()` throughout: names legitimately appear more than once per page
    // (a row plus a summary card), and strict mode would fail on the duplicate.
    await page.goto('/properties')
    await expect(page.getByText(propertyName).first()).toBeVisible({ timeout: 30_000 })

    await page.goto('/properties/units')
    await expect(page.getByText(unitNo).first()).toBeVisible({ timeout: 30_000 })

    await page.goto('/occupants')
    await expect(page.getByText(occupantLast).first()).toBeVisible({ timeout: 30_000 })

    await page.goto('/agreement')
    await expect(page.getByText(occupantLast).first()).toBeVisible({ timeout: 30_000 })

    await page.goto('/billing/invoices')
    await expect(page.getByText(/INV-\d{4}-\d+/).first()).toBeVisible({ timeout: 30_000 })
  })

  test('the generated invoice names its tenant, property and unit', async ({ page }) => {
    /**
     * Was a defect: the wizard sends ids only, and the invoice row was written
     * with a live occupant_id but occupant_name, property_name and unit_no all
     * empty — an invoice belonging to nobody, for nothing.
     *
     * InvoiceServiceImpl.fillMissingNames now resolves the blanks from the ids
     * on write, so every caller gets them, not just the forms that happened to
     * send both. Stop resolving them and this goes red.
     */
    await page.goto('/billing/invoices')
    await expect(page.getByText(occupantLast).first()).toBeVisible({ timeout: 30_000 })
  })

  test('a fully onboarded unit is marked occupied, not reserved', async ({ page }) => {
    /**
     * Was a defect: completing all five steps still left the unit `reserved`,
     * the agreement PENDING and the occupant active. The occupant step sets the
     * unit `occupied` and the agreement step then downgraded it to `reserved`
     * (AgreementServiceImpl:142), because createAgreement always writes PENDING
     * — AgreementMapper hardcodes it — and reserves the unit to match.
     *
     * `reserved` is right for a lease signed ahead of a move-in. It is wrong
     * for first-run setup, where the tenancy already exists, and the unit then
     * fell into neither the Occupied nor the Vacant tile while also dropping
     * out of public listings.
     *
     * AgreementStep now activates the agreement it just created, via the
     * supported PENDING -> ACTIVE transition, which returns the unit to
     * `occupied`.
     */
    await page.goto('/properties/units')

    const row = page.getByRole('row').filter({ hasText: unitNo })

    await expect(row).toBeVisible({ timeout: 30_000 })
    await expect(row).not.toContainText(/Reserved/i)
  })
})
