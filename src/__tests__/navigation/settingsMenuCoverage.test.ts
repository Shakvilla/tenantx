import { describe, it, expect } from 'vitest'
import { readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

import verticalMenuData from '@/data/navigation/verticalMenuData'

/**
 * Every settings page must be reachable from the menu.
 *
 * `/settings/payment` shipped with no navigation entry anywhere. It rendered
 * perfectly and could be reached only by typing the URL, which meant late-fee
 * configuration — a paid feature — was unreachable for every landlord who had
 * paid for it. Nobody noticed because the page itself was fine.
 *
 * This compares the routes that exist on disk against the routes the menu
 * offers, so the next settings page added without a menu entry fails here
 * instead of in the field.
 */

const SETTINGS_ROUTES_DIR = join(process.cwd(), 'src/app/(dashboard)/settings')

describe('Settings menu coverage', () => {
  it('offers a menu entry for every settings page that exists', () => {
    const onDisk = readdirSync(SETTINGS_ROUTES_DIR, { withFileTypes: true })
      .filter(entry => entry.isDirectory())
      .filter(entry => existsSync(join(SETTINGS_ROUTES_DIR, entry.name, 'page.tsx')))
      .map(entry => `/settings/${entry.name}`)
      .sort()

    const settings = verticalMenuData('LANDLORD', {}).find(item => item.label === 'Settings') as any

    const inMenu = (settings?.children ?? []).map((child: any) => child.href).sort()

    expect(onDisk.length).toBeGreaterThan(0)
    expect(inMenu).toEqual(onDisk)
  })
})
