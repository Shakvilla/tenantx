export interface LegalSection {
  heading: string
  paragraphs?: string[]
  bullets?: string[]
}

export interface LegalDoc {
  title: string
  lastUpdated: string
  intro: string
  sections: LegalSection[]
}

// Bump this whenever the legal copy below materially changes.
const LAST_UPDATED = '14 July 2026'

export function buildTerms(platformName: string): LegalDoc {
  return {
    title: 'Terms of Service',
    lastUpdated: LAST_UPDATED,
    intro: `These terms govern your use of the public property listings on ${platformName}. By browsing listings or requesting a viewing, you agree to them. If you do not agree, please do not use the service.`,
    sections: [
      {
        heading: 'What this service is',
        paragraphs: [
          `${platformName} is a property platform that lets verified property managers in Ghana publish rental listings, and lets you browse those listings and contact the manager responsible for a home you are interested in.`,
          `${platformName} is not a party to any tenancy agreement. Rental contracts are made directly between you and the property manager or landlord. We do not act as an estate agent, broker, or legal representative for either side.`,
        ],
      },
      {
        heading: 'Viewing requests and contact',
        paragraphs: [
          'Requesting a viewing is free. When you send a viewing request, or contact a property manager by phone, WhatsApp, or email through a listing, your message goes to the property manager responsible for that listing so they can respond to you directly.',
        ],
      },
      {
        heading: 'Listing information',
        paragraphs: [
          'Property managers are responsible for the accuracy of their listings, including prices, photos, amenities, and availability. We take reasonable steps to keep listings current, but details can change and errors can occur.',
          'Always view a property in person and confirm the terms with the property manager before making any payment or signing any agreement.',
        ],
      },
      {
        heading: 'Payments',
        paragraphs: [
          `All prices shown are monthly rents in Ghana Cedis (GHS) unless a listing states otherwise. ${platformName} does not collect rent, deposits, or viewing fees through these public pages.`,
        ],
        bullets: [
          'Never pay money to secure a viewing — viewings are free.',
          'Never send money to anyone before you have viewed the property and agreed terms in writing.',
          'Be cautious of anyone asking for payment outside the contact options shown on a listing.',
        ],
      },
      {
        heading: 'Acceptable use',
        bullets: [
          'Do not submit false, misleading, or abusive viewing requests.',
          'Do not scrape, copy, or republish listings or photos without permission.',
          'Do not use the service to advertise, spam, or harass property managers or other users.',
          'Do not attempt to interfere with the operation or security of the platform.',
        ],
      },
      {
        heading: 'Our liability',
        paragraphs: [
          `To the fullest extent permitted by law, ${platformName} is not liable for losses arising from your dealings with a property manager or landlord, including disputes over rent, deposits, property condition, or the accuracy of a listing. The service is provided "as is" without warranties of any kind.`,
        ],
      },
      {
        heading: 'Changes to these terms',
        paragraphs: [
          'We may update these terms from time to time. The date at the top of this page shows when they were last changed. Continuing to use the service after a change means you accept the updated terms.',
        ],
      },
      {
        heading: 'Governing law',
        paragraphs: [
          'These terms are governed by the laws of the Republic of Ghana, and any disputes are subject to the jurisdiction of the courts of Ghana.',
        ],
      },
    ],
  }
}

export function buildPrivacy(platformName: string): LegalDoc {
  return {
    title: 'Privacy Policy',
    lastUpdated: LAST_UPDATED,
    intro: `This policy explains what personal information ${platformName} collects when you use the public property listings, how it is used, and the choices you have. We handle personal data in line with Ghana's Data Protection Act, 2012 (Act 843).`,
    sections: [
      {
        heading: 'Information we collect',
        paragraphs: ['We only collect the information needed to connect you with a property manager:'],
        bullets: [
          'Viewing requests — your name, phone number, optional email address, and the message you write. These are required so the property manager can respond to you.',
          'Saved homes — listings you save are stored only in your own browser (local storage). They never leave your device and we cannot see them.',
          'Basic technical data — standard server logs such as IP address and browser type, used for security and to keep the service running.',
        ],
      },
      {
        heading: 'How we use your information',
        paragraphs: ['We do not use your information for advertising, and we do not sell it to anyone. We use it only to:'],
        bullets: [
          'Deliver your viewing request to the property manager responsible for the listing.',
          'Respond to questions or issues you raise.',
          'Protect the platform against fraud, spam, and abuse.',
        ],
      },
      {
        heading: 'Who we share it with',
        paragraphs: [
          'When you request a viewing, your name, contact details, and message are shared with the property manager of that listing — that is the purpose of the request. We may also use service providers (such as hosting) that process data on our behalf, and we may disclose information where the law requires it.',
        ],
      },
      {
        heading: 'How long we keep it',
        paragraphs: [
          'Viewing requests are kept for as long as needed to handle your enquiry and for a reasonable period afterwards for record-keeping, then deleted or anonymised. Saved homes stay in your browser until you remove them or clear your browser data.',
        ],
      },
      {
        heading: 'Your rights',
        paragraphs: ['Under the Data Protection Act, 2012 (Act 843), you have the right to:'],
        bullets: [
          'Ask what personal data we hold about you.',
          'Ask us to correct inaccurate information.',
          'Ask us to delete your information, subject to legal record-keeping requirements.',
          'Object to processing of your information.',
        ],
      },
      {
        heading: 'Cookies and local storage',
        paragraphs: [
          'These public pages do not use advertising or tracking cookies. The only thing stored in your browser is your list of saved homes, which you can clear at any time by removing the saved listings or clearing your browser data.',
        ],
      },
      {
        heading: 'Changes to this policy',
        paragraphs: [
          'We may update this policy from time to time. The date at the top of this page shows when it was last changed.',
        ],
      },
      {
        heading: 'Contact',
        paragraphs: [
          `To exercise any of your rights or ask questions about this policy, reach ${platformName} through the contact options shown on any listing page, and your message will be routed to the platform team.`,
        ],
      },
    ],
  }
}
