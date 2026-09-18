// Next Imports
import { redirect } from 'next/navigation'

/**
 * /settings has no content of its own — the sidebar's Settings group links straight to its
 * sub-pages — but the bare URL is reachable (typed, bookmarked, or linked) and used to 404
 * (QA sweep 2026-08-22). Land on the first sub-page instead.
 */
const SettingsIndexPage = () => {
  redirect('/settings/company')
}

export default SettingsIndexPage
