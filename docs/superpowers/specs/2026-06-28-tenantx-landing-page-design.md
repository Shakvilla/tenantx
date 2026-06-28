# TenantX SaaS Landing Page — Design Spec
**Date:** 2026-06-28
**Ticket:** LANDING-001
**Status:** Approved

---

## Overview

A standalone public marketing website targeting Ghanaian landlords, designed to acquire sign-ups for the TenantX property management platform. Follows the Airbnb-style marketplace aesthetic with alternating light/dark sections, embedded product screenshots, pricing comparison, and testimonials — modelled on an approved Figma template.

This site is **not** the occupant/renter portal (a separate future ticket). It is a pure acquisition tool: visit → understand value → sign up.

---

## Architecture

### Repo
`tenantx-landing` — standalone repo, sibling to `Tenants/` and `TenantX-backend/`

```
tenantx-landing/
├── public/
│   └── assets/          # screenshots, logos, avatar images
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   └── Footer.tsx
│   │   └── sections/
│   │       ├── Hero.tsx
│   │       ├── WhyTenantX.tsx
│   │       ├── Features.tsx
│   │       ├── Results.tsx
│   │       ├── Testimonials.tsx
│   │       ├── Pricing.tsx
│   │       ├── FAQ.tsx
│   │       └── FinalCTA.tsx
│   ├── hooks/
│   │   └── useScrollAnimation.ts
│   ├── lib/
│   │   └── constants.ts  # APP_URL, DEMO_URL, nav links, plan data
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
├── tailwind.config.ts
├── vite.config.ts
├── tsconfig.json
└── package.json
```

### Tech Stack

| Concern | Choice |
|---|---|
| Framework | React 18 + Vite 5 + TypeScript |
| Styling | Tailwind CSS v3 |
| Routing | React Router v6 (single `/` route, anchor scroll) |
| Animations | Framer Motion (scroll-triggered reveals) |
| Forms | React Hook Form + Zod |
| Icons | Lucide React |
| Font | Inter (via Google Fonts) |
| Deployment | Vercel (separate project from Next.js app) |

### Brand Tokens

```
Primary:     #7367F0   (TenantX purple)
Dark bg:     #1A1A2E   (dark sections)
Text:        #111827   (gray-900)
Muted:       #6B7280   (gray-500)
White:       #FFFFFF
Border:      #E5E7EB   (gray-200)
```

### External Links

- "Get Started" / "Start Free Trial" → `{APP_DOMAIN}/register`
- "Book a Demo" → mailto or Calendly link (placeholder until decided)
- "Sign In" (navbar) → `{APP_DOMAIN}/login`

`APP_DOMAIN` stored in `.env` as `VITE_APP_URL`.

---

## Section Specs

### 1. Navbar

**Behaviour:** Transparent at top → white with blur backdrop + box shadow on scroll (threshold: 64px). Sticky (`position: fixed`, z-50).

**Layout:**
```
[Logo]     [Features] [Pricing] [FAQ] [Contact]     [Sign In]  [Get Started Free →]
```

**Mobile (< 768px):** Hamburger icon right. On tap → fullscreen overlay with vertical nav links + CTA button. Close on link click or backdrop tap.

**Logo:** TenantX wordmark + icon. Links to `#top`.

---

### 2. Hero

**Headline:** "Manage your properties smarter. Collect rent faster."

**Subtext:** "TenantX helps Ghanaian landlords track tenants, automate invoices, and collect rent via Mobile Money — all in one place."

**CTAs:**
- Primary (filled, purple): "Start Free Trial" → `{APP_URL}/register`
- Secondary (outline): "Book a Demo" → demo link

**Visual:** Product dashboard screenshot inside a browser-chrome mockup frame, displayed with a subtle 3D perspective tilt (rotateX 8deg, rotateY -4deg via CSS transform). Framer Motion: fade-in + slight upward translate on load.

**Trust bar (below visual):**
- Label: "Trusted by landlords across Ghana"
- 4–5 greyscale partner/customer logos in a flex row

---

### 3. Why TenantX (dark section)

**Background:** `#1A1A2E`

**Headline:** "Why landlords choose TenantX for smarter property management"

**Subtext:** "Our platform is purpose-built for the Ghanaian rental market — from MoMo collections to digital agreements."

**3 stat blocks (centered row):**
| Stat | Label |
|---|---|
| GH₵ 2M+ | Rent collected on time |
| 500+ | Properties managed across Ghana |
| 98% | Platform uptime, always available |

**Feature highlight below stats:**
- Left: bulleted list of 4 key differentiators (MoMo native, digital agreements, multi-property, mobile-first)
- Right: dashboard screenshot with 3 floating callout annotation chips

---

### 4. Features Grid

**Headline:** "Everything you need to run your rental business"

**Subtext:** "From onboarding tenants to collecting rent, TenantX handles it all."

**Layout:** 2-column grid (desktop), 1-column (mobile). 6 cards total.

| # | Title | Description | Screenshot |
|---|---|---|---|
| 1 | Property Management | Add unlimited properties and units with full details | Properties list view |
| 2 | Tenant Onboarding | Digital 5-step wizard — no paperwork, no chasing | Onboarding wizard |
| 3 | Invoice & Billing | Auto-generate invoices, collect via Mobile Money instantly | Invoice view |
| 4 | Lease Agreements | Digital agreements with custom terms and e-signature | Agreement form |
| 5 | Maintenance Requests | Log, track, and resolve maintenance issues in one place | Maintenance list |
| 6 | Reports & Analytics | Occupancy rates, revenue trends, and expense tracking | Dashboard chart |

Each card: light border, rounded-2xl, screenshot at top, icon + title + description below.

---

### 5. Data-Driven Results

**Layout:** Split — left 50% text, right 50% screenshot.

**Left side:**
- Headline: "Data-driven insights that help you grow"
- Subtext about making informed decisions
- 4 checkmark items:
  - Real-time rent collection tracking
  - Occupancy and vacancy reporting
  - Expense vs revenue breakdown
  - Automated overdue rent reminders

**Right side:** Analytics dashboard screenshot in a card frame.

**Bottom strip (full width, light purple bg):**
- Landlord avatar photo + name + location
- Pull quote: testimonial about time saved

---

### 6. Testimonials

**Headline:** "What our customers say?"

**Layout:** Carousel (auto-scroll every 4s, pause on hover). Shows 1 testimonial at a time on mobile, 3 on desktop.

Each card:
- Star rating (5 stars)
- Quote text (max 2 sentences)
- Avatar image + name + location (e.g. "Accra, Ghana")

**Initial testimonials (placeholder — replace with real quotes before launch):**
1. "TenantX made collecting rent from my 8 tenants so much easier. I no longer chase anyone." — Kofi A., Accra
2. "The digital agreements alone saved me hours every month." — Ama B., Kumasi
3. "I can now see all my properties and income in one dashboard. Game changer." — Emmanuel D., Takoradi

---

### 7. Pricing

**Headline:** "Flexible plans that fit your portfolio"

**Subtext:** "No hidden fees. Cancel anytime."

**Left column — "What landlords spend traditionally":**
| Item | Est. Cost |
|---|---|
| Manual bookkeeping | GHS 200/mo |
| Printing agreements | GHS 50/mo |
| Missed rent (no reminders) | GHS 500+/mo |
| **Total** | **GHS 750+/mo** |

**Right — 3 plan cards:**

| | BASIC | STANDARD | PREMIUM |
|---|---|---|---|
| Price | GHS 50/mo | GHS 150/mo | GHS 350/mo |
| Units | Up to 5 | Up to 25 | Up to 100 |
| MoMo fee | 1.5% | 1.5% | 1.5% |
| Highlight | — | Most Popular ⭐ | — |

Feature list per plan (cumulative):
- BASIC: Properties + units, tenant management, manual invoices
- STANDARD: + Auto invoicing, MoMo collection, agreements, maintenance
- PREMIUM: + Analytics, priority support, API access, custom branding

CTA per card: "Get Started" → `{APP_URL}/register?plan={plan}`

---

### 8. FAQ

**Headline:** "Frequently asked questions"

**Layout:** Accordion (one open at a time).

| # | Question |
|---|---|
| 1 | How does Mobile Money rent collection work? |
| 2 | Can I manage multiple properties and units? |
| 3 | Is my tenant data secure? |
| 4 | Do I need technical knowledge to use TenantX? |
| 5 | What happens when I exceed my unit limit? |
| 6 | Can I cancel my subscription at any time? |

Answers are concise (2–3 sentences each). Full answer copy to be provided before implementation.

---

### 9. Final CTA (dark section)

**Background:** `#7367F0` (primary purple)

**Headline:** "Ready to manage your properties smarter?"

**Subtext:** "Join hundreds of Ghanaian landlords already using TenantX."

**CTAs:**
- "Get Started Free" (white filled button)
- "Talk to Sales" (white outline button)

---

### 10. Footer

**Layout:** 4-column grid (desktop), stacked (mobile).

| Column | Content |
|---|---|
| Brand | Logo + tagline: "Property management built for Ghana" + social icons |
| Product | Features, Pricing, FAQ, Changelog |
| Company | About, Blog, Contact, Careers |
| Legal | Privacy Policy, Terms of Service, Cookie Policy |

Bottom bar: `© 2026 TenantX. All rights reserved.`

Social icons: Twitter/X, LinkedIn, WhatsApp (links TBD).

---

## Responsive Behaviour

| Breakpoint | Key changes |
|---|---|
| < 640px (mobile) | Single column layouts, hamburger nav, hero text smaller, trust logos wrap |
| 640–1024px (tablet) | 2-col features grid, pricing cards scroll horizontally |
| > 1024px (desktop) | Full multi-column layouts as designed |

Target: < 3s load on 3G (Ghana constraint). Optimise all screenshots: WebP, max 800px wide, lazy-loaded below fold.

---

## Email Capture (Renter Portal — out of scope for this ticket)

Email capture with listing preferences is scoped to the separate renter portal ticket, not this landing page. The only email interaction here is the "Talk to Sales" CTA which opens a mailto or Calendly.

---

## Environment Variables

```env
VITE_APP_URL=https://app.tenantx.gh
VITE_DEMO_URL=https://calendly.com/tenantx/demo
```

---

## Out of Scope

- Occupant/renter-facing pages (separate repo + ticket)
- Blog / CMS integration
- Multi-language support
- A/B testing
- Analytics integration (add post-launch)
