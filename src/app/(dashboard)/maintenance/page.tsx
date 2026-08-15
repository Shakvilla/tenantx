import { redirect } from 'next/navigation'

/**
 * `/maintenance` is a section, not a page — the sidebar entry is a group whose
 * children are Categories, Maintainers, Requests and Preventative Schedules.
 *
 * Nothing was served here, and because the platform's offline notice used to
 * sit at this URL under the blank layout, a landlord who typed or bookmarked
 * `/maintenance` was told the platform was down for maintenance. Send them to
 * the work queue instead: Requests is the only child with no feature gate, so
 * it is the one page every tenant can reach.
 */
const MaintenancePage = () => {
  redirect('/maintenance/requests')
}

export default MaintenancePage
