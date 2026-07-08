import PageBanner from '@components/banner/PageBanner'
import SmsSenderIdSection from '@/views/settings/sms/SmsSenderIdSection'

export const metadata = { title: 'SMS Sender ID — Settings' }

export default function SmsSenderIdPage() {
  return (
    <>
      <PageBanner
        title='SMS Sender ID'
        description='Personalize the sender name your occupants see on SMS reminders.'
        icon='ri-chat-smile-3-line'
      />
      <SmsSenderIdSection />
    </>
  )
}
