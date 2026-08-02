// Component Imports
import JobLinkPage from '@/views/jobs/JobLinkPage'

// This is the landing page for the maintainer job-link SMS
// ("https://app.tenantx.cloud/jobs/{token}"). The visitor has no TenantX
// account — never add auth, tenant context, or dashboard chrome here.
//
// The token is only ever passed down to the view for API calls. Do not put
// it in metadata/title — it must never be logged, titled, or sent to
// analytics (see job-link-page-brief.md, "Privacy — the hard rule").

interface PageProps {
  params: Promise<{ token: string }>
}

export default async function JobLinkRoutePage({ params }: PageProps) {
  const { token } = await params

  return <JobLinkPage token={token} />
}
