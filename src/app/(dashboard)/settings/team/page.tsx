'use client'

// Component Imports
import PageBanner from '@components/banner/PageBanner'
import TeamSettingsContent from '@/views/settings/team/TeamSettingsContent'

const TeamSettingsPage = () => {
  return (
    <>
      <PageBanner
        title='Team & Roles'
        description='Invite staff, and create roles that control what each staff member can access'
        icon='ri-team-line'
      />
      <TeamSettingsContent />
    </>
  )
}

export default TeamSettingsPage
