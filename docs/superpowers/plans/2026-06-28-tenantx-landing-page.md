# TenantX SaaS Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone React + Vite marketing site for TenantX that acquires landlord sign-ups, matching the approved Figma template structure with 10 sections.

**Architecture:** A single-page app with all sections rendered sequentially in `App.tsx`, each section an independent component. No routing beyond anchor-based scroll. Framer Motion drives scroll-triggered reveal animations. All copy and data lives in `src/lib/constants.ts` so content can be updated without touching component files.

**Tech Stack:** React 18, Vite 5, TypeScript, Tailwind CSS v3, Framer Motion, Lucide React, Vitest + React Testing Library

## Global Constraints

- Primary color: `#7367F0` (TenantX purple) — defined as `primary` in tailwind config
- Dark section bg: `#1A1A2E` — defined as `dark-bg` in tailwind config
- Font: Inter (Google Fonts, weights 400/500/600/700/800)
- Tailwind CSS v3 (NOT v4 — v4 has breaking config changes)
- React 18 (NOT React 19)
- All "Get Started" links: `` `${APP_URL}/register` ``
- All plan CTA links: `` `${APP_URL}/register?plan=${plan.id}` ``
- "Sign In" link: `` `${APP_URL}/login` ``
- "Book a Demo" / "Talk to Sales" links: `DEMO_URL`
- Screenshots: WebP files in `public/assets/screenshots/` — placeholders for now, real screenshots added before launch
- All images below the fold: `loading="lazy"`
- Mobile hamburger breakpoint: `md` (768px)
- No MUI, no Next.js, no Axios

---

### Task 1: Project Scaffolding + Configuration

**Files:**
- Create: `tenantx-landing/` (new repo at `/Users/mac/Desktop/TenantApp/tenantx-landing/`)
- Create: `tenantx-landing/vite.config.ts`
- Create: `tenantx-landing/vitest.config.ts`
- Create: `tenantx-landing/tailwind.config.ts`
- Create: `tenantx-landing/postcss.config.js`
- Create: `tenantx-landing/index.html`
- Create: `tenantx-landing/src/main.tsx`
- Create: `tenantx-landing/src/App.tsx`
- Create: `tenantx-landing/src/index.css`
- Create: `tenantx-landing/src/lib/constants.ts`
- Create: `tenantx-landing/src/types/index.ts`
- Create: `tenantx-landing/src/__tests__/setup.ts`
- Create: `tenantx-landing/src/__tests__/App.test.tsx`
- Create: `tenantx-landing/.env.example`

**Interfaces:**
- Produces: working project with `npm run dev`, `npm run build`, `npm test` all passing

- [ ] **Step 1: Scaffold with Vite**

```bash
cd /Users/mac/Desktop/TenantApp
npm create vite@latest tenantx-landing -- --template react-ts
cd tenantx-landing
npm install
```

- [ ] **Step 2: Install dependencies**

```bash
npm install framer-motion lucide-react
npm install -D tailwindcss@3 postcss autoprefixer vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
npx tailwindcss init -p
```

- [ ] **Step 3: Configure Tailwind**

Replace `tailwind.config.js` with `tailwind.config.ts`:

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#7367F0',
        'primary-dark': '#5E50EE',
        'dark-bg': '#1A1A2E',
        'dark-card': '#16213E',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
```

- [ ] **Step 4: Configure Vite**

`vite.config.ts`:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
```

- [ ] **Step 5: Configure Vitest**

`vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    globals: true,
  },
})
```

`src/__tests__/setup.ts`:
```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 6: Update package.json scripts**

In `package.json`, replace the `scripts` block with:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "type-check": "tsc --noEmit"
  }
}
```

- [ ] **Step 7: Set up index.css**

`src/index.css`:
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

html {
  scroll-behavior: smooth;
}

body {
  font-family: 'Inter', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
}
```

- [ ] **Step 8: Create constants**

`src/lib/constants.ts`:
```typescript
export const APP_URL = import.meta.env.VITE_APP_URL ?? 'https://app.tenantx.gh'
export const DEMO_URL = import.meta.env.VITE_DEMO_URL ?? 'mailto:hello@tenantx.gh'

export const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Contact', href: '#contact' },
]

export const PLANS = [
  {
    id: 'basic',
    name: 'BASIC',
    price: 50,
    units: 5,
    momoFee: '1.5%',
    popular: false,
    features: [
      'Up to 5 units',
      'Property & tenant management',
      'Manual invoice generation',
      'Email support',
    ],
  },
  {
    id: 'standard',
    name: 'STANDARD',
    price: 150,
    units: 25,
    momoFee: '1.5%',
    popular: true,
    features: [
      'Up to 25 units',
      'Everything in BASIC',
      'Automated invoicing',
      'Mobile Money collection',
      'Digital lease agreements',
      'Maintenance request tracking',
    ],
  },
  {
    id: 'premium',
    name: 'PREMIUM',
    price: 350,
    units: 100,
    momoFee: '1.5%',
    popular: false,
    features: [
      'Up to 100 units',
      'Everything in STANDARD',
      'Advanced analytics & reports',
      'Priority support',
      'API access',
      'Custom branding',
    ],
  },
]

export const TESTIMONIALS = [
  {
    id: 1,
    quote: 'TenantX made collecting rent from my 8 tenants so much easier. I no longer chase anyone.',
    name: 'Kofi A.',
    location: 'Accra, Ghana',
    avatar: '/assets/avatars/avatar-1.webp',
  },
  {
    id: 2,
    quote: 'The digital agreements alone saved me hours every month. Everything is in one place.',
    name: 'Ama B.',
    location: 'Kumasi, Ghana',
    avatar: '/assets/avatars/avatar-2.webp',
  },
  {
    id: 3,
    quote: 'I can now see all my properties and income in one dashboard. An absolute game changer.',
    name: 'Emmanuel D.',
    location: 'Takoradi, Ghana',
    avatar: '/assets/avatars/avatar-3.webp',
  },
]

export const FAQ_ITEMS = [
  {
    question: 'How does Mobile Money rent collection work?',
    answer: "TenantX integrates directly with Ghana's Mobile Money networks. When an invoice is generated, tenants receive a payment prompt and pay via MoMo. The 1.5% platform fee is deducted automatically and funds are settled to your registered account.",
  },
  {
    question: 'Can I manage multiple properties and units?',
    answer: 'Yes. You can add as many properties as you like, each with multiple units. The STANDARD plan supports up to 25 units and PREMIUM supports up to 100 units across all your properties.',
  },
  {
    question: 'Is my tenant data secure?',
    answer: 'All data is encrypted at rest and in transit. TenantX is hosted on secure cloud infrastructure with daily backups. We never share your tenant data with third parties.',
  },
  {
    question: 'Do I need technical knowledge to use TenantX?',
    answer: 'Not at all. TenantX is designed for landlords, not tech experts. The onboarding wizard guides you step by step, and our support team is available via WhatsApp if you need help.',
  },
  {
    question: 'What happens when I exceed my unit limit?',
    answer: "You'll receive a notification when you're approaching your plan's unit limit. You can upgrade to a higher plan at any time directly from your dashboard — no data is lost during upgrades.",
  },
  {
    question: 'Can I cancel my subscription at any time?',
    answer: 'Yes. There are no long-term contracts. You can cancel your subscription at any time from your account settings. Your data remains accessible until the end of your billing period.',
  },
]
```

- [ ] **Step 9: Create types**

`src/types/index.ts`:
```typescript
export interface Plan {
  id: string
  name: string
  price: number
  units: number
  momoFee: string
  popular: boolean
  features: string[]
}

export interface Testimonial {
  id: number
  quote: string
  name: string
  location: string
  avatar: string
}

export interface FAQItem {
  question: string
  answer: string
}
```

- [ ] **Step 10: Minimal App.tsx + main.tsx**

`src/App.tsx`:
```tsx
export default function App() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <p>TenantX Landing</p>
    </div>
  )
}
```

`src/main.tsx`:
```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

`index.html` — replace `<title>` and `<meta name="description">`:
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>TenantX — Property Management Built for Ghana</title>
    <meta name="description" content="TenantX helps Ghanaian landlords track tenants, automate invoices, and collect rent via Mobile Money — all in one place." />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 11: Create .env files**

`.env.example`:
```
VITE_APP_URL=https://app.tenantx.gh
VITE_DEMO_URL=https://calendly.com/tenantx/demo
```

`.env.local` (for local dev — never commit):
```
VITE_APP_URL=http://localhost:3000
VITE_DEMO_URL=mailto:hello@tenantx.gh
```

Add `.env.local` and `.env` to `.gitignore`.

- [ ] **Step 12: Write smoke test**

`src/__tests__/App.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import App from '../App'

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />)
    expect(screen.getByText('TenantX Landing')).toBeInTheDocument()
  })
})
```

- [ ] **Step 13: Run tests — confirm they pass**

```bash
npm test
```
Expected: 1 test passes.

- [ ] **Step 14: Verify dev server**

```bash
npm run dev
```
Expected: Vite server at http://localhost:5173 with "TenantX Landing" visible.

- [ ] **Step 15: Init git and commit**

```bash
git init
echo -e "node_modules\ndist\n.env.local\n.env" >> .gitignore
git add .
git commit -m "feat: scaffold tenantx-landing React + Vite + Tailwind project"
```

---

### Task 2: UI Primitives + Scroll Hook

**Files:**
- Create: `src/components/ui/Button.tsx`
- Create: `src/components/ui/SectionWrapper.tsx`
- Create: `src/hooks/useScrollAnimation.ts`
- Create: `src/__tests__/Button.test.tsx`

**Interfaces:**
- Produces:
  - `Button` — `variant: 'primary' | 'secondary' | 'outline'`, `size?: 'sm' | 'md' | 'lg'`, `href?: string`, `onClick?: () => void`, `children: React.ReactNode`, `className?: string`, `target?: string`, `rel?: string`
  - `SectionWrapper` — `id?: string`, `className?: string`, `children: React.ReactNode`
  - `useScrollAnimation(threshold?: number)` — returns `{ ref: RefObject<HTMLDivElement>, isInView: boolean }`

- [ ] **Step 1: Write Button tests**

`src/__tests__/Button.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Button from '../components/ui/Button'

describe('Button', () => {
  it('renders as anchor when href provided', () => {
    render(<Button variant="primary" href="/test">Click me</Button>)
    expect(screen.getByRole('link', { name: 'Click me' })).toHaveAttribute('href', '/test')
  })

  it('renders as button when no href', () => {
    render(<Button variant="primary">Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(<Button variant="primary" onClick={handleClick}>Click</Button>)
    await user.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledOnce()
  })

  it('applies primary variant classes', () => {
    render(<Button variant="primary">Primary</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-primary')
  })

  it('applies outline variant classes', () => {
    render(<Button variant="outline">Outline</Button>)
    expect(screen.getByRole('button')).toHaveClass('border-primary')
  })
})
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
npm test -- Button
```
Expected: FAIL — `Button` not found

- [ ] **Step 3: Implement Button**

`src/components/ui/Button.tsx`:
```tsx
import React from 'react'

interface ButtonProps {
  variant: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  href?: string
  onClick?: () => void
  children: React.ReactNode
  className?: string
  target?: string
  rel?: string
}

const BASE = 'inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'

const VARIANTS: Record<ButtonProps['variant'], string> = {
  primary: 'bg-primary hover:bg-primary-dark text-white',
  secondary: 'bg-white hover:bg-gray-50 text-primary border border-primary',
  outline: 'border border-primary text-primary hover:bg-primary hover:text-white',
}

const SIZES: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
}

export default function Button({
  variant,
  size = 'md',
  href,
  onClick,
  children,
  className = '',
  target,
  rel,
}: ButtonProps) {
  const classes = `${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`

  if (href) {
    return (
      <a href={href} className={classes} target={target} rel={rel}>
        {children}
      </a>
    )
  }

  return (
    <button onClick={onClick} className={classes}>
      {children}
    </button>
  )
}
```

- [ ] **Step 4: Implement SectionWrapper**

`src/components/ui/SectionWrapper.tsx`:
```tsx
import React from 'react'

interface SectionWrapperProps {
  id?: string
  className?: string
  children: React.ReactNode
}

export default function SectionWrapper({ id, className = '', children }: SectionWrapperProps) {
  return (
    <section id={id} className={`w-full ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </section>
  )
}
```

- [ ] **Step 5: Implement useScrollAnimation**

`src/hooks/useScrollAnimation.ts`:
```typescript
import { useRef } from 'react'
import { useInView } from 'framer-motion'

export function useScrollAnimation(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, amount: threshold })
  return { ref, isInView }
}
```

- [ ] **Step 6: Run tests — confirm they pass**

```bash
npm test -- Button
```
Expected: 5 tests pass

- [ ] **Step 7: Commit**

```bash
git add src/components/ui/ src/hooks/ src/__tests__/Button.test.tsx src/__tests__/setup.ts
git commit -m "feat: add Button, SectionWrapper primitives and useScrollAnimation hook"
```

---

### Task 3: Navbar

**Files:**
- Create: `src/components/layout/Navbar.tsx`
- Create: `src/__tests__/Navbar.test.tsx`

**Interfaces:**
- Consumes: `NAV_LINKS`, `APP_URL` from `src/lib/constants.ts`; `Button` from `src/components/ui/Button.tsx`
- Produces: `<Navbar />` — no props

- [ ] **Step 1: Write Navbar tests**

`src/__tests__/Navbar.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Navbar from '../components/layout/Navbar'

describe('Navbar', () => {
  it('renders logo text', () => {
    render(<Navbar />)
    expect(screen.getByText('TenantX')).toBeInTheDocument()
  })

  it('renders all nav links', () => {
    render(<Navbar />)
    expect(screen.getByRole('link', { name: 'Features' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Pricing' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'FAQ' })).toBeInTheDocument()
  })

  it('renders Get Started CTA', () => {
    render(<Navbar />)
    expect(screen.getByRole('link', { name: /get started/i })).toBeInTheDocument()
  })

  it('toggles mobile menu on hamburger click', async () => {
    const user = userEvent.setup()
    render(<Navbar />)
    await user.click(screen.getByRole('button', { name: /open menu/i }))
    expect(screen.getByRole('button', { name: /close menu/i })).toBeInTheDocument()
  })

  it('closes mobile menu when a nav link is clicked', async () => {
    const user = userEvent.setup()
    render(<Navbar />)
    await user.click(screen.getByRole('button', { name: /open menu/i }))
    const mobileLinks = screen.getAllByRole('link', { name: 'Features' })
    await user.click(mobileLinks[mobileLinks.length - 1])
    expect(screen.getByRole('button', { name: /open menu/i })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
npm test -- Navbar
```
Expected: FAIL

- [ ] **Step 3: Implement Navbar**

`src/components/layout/Navbar.tsx`:
```tsx
import { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'
import Button from '../ui/Button'
import { NAV_LINKS, APP_URL } from '../../lib/constants'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 64)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const closeMenu = () => setMenuOpen(false)

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-sm shadow-sm' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <a href="#top" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">TX</span>
            </div>
            <span className="font-bold text-xl text-gray-900">TenantX</span>
          </a>

          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(link => (
              <a
                key={link.href}
                href={link.href}
                className="text-gray-600 hover:text-primary font-medium transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <a href={`${APP_URL}/login`} className="text-gray-600 hover:text-primary font-medium transition-colors">
              Sign In
            </a>
            <Button variant="primary" size="sm" href={`${APP_URL}/register`}>
              Get Started Free
            </Button>
          </div>

          <button
            className="md:hidden p-2 rounded-md text-gray-600 hover:text-primary"
            onClick={() => setMenuOpen(o => !o)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden fixed inset-0 top-16 bg-white z-40 flex flex-col p-6 gap-6">
          {NAV_LINKS.map(link => (
            <a
              key={link.href}
              href={link.href}
              onClick={closeMenu}
              className="text-xl font-medium text-gray-800 hover:text-primary transition-colors"
            >
              {link.label}
            </a>
          ))}
          <div className="flex flex-col gap-3 pt-4 border-t border-gray-100">
            <a href={`${APP_URL}/login`} onClick={closeMenu} className="text-center text-gray-600 hover:text-primary font-medium">
              Sign In
            </a>
            <Button variant="primary" href={`${APP_URL}/register`} className="w-full justify-center">
              Get Started Free
            </Button>
          </div>
        </div>
      )}
    </header>
  )
}
```

- [ ] **Step 4: Run tests — confirm they pass**

```bash
npm test -- Navbar
```
Expected: 5 tests pass

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/Navbar.tsx src/__tests__/Navbar.test.tsx
git commit -m "feat: add sticky responsive Navbar with mobile overlay menu"
```

---

### Task 4: Hero Section

**Files:**
- Create: `src/components/sections/Hero.tsx`
- Create: `public/assets/screenshots/dashboard.webp` (placeholder)
- Create: `src/__tests__/Hero.test.tsx`

**Interfaces:**
- Consumes: `APP_URL`, `DEMO_URL` from constants; `Button` from ui
- Produces: `<Hero />` — no props

- [ ] **Step 1: Create asset directories and placeholder**

```bash
mkdir -p public/assets/screenshots public/assets/avatars public/assets/logos
# If curl available, fetch a placeholder; otherwise copy any image manually
curl -s -o public/assets/screenshots/dashboard.webp \
  "https://placehold.co/800x500/7367F0/ffffff?text=TenantX+Dashboard" \
  || echo "Manually place a dashboard.webp in public/assets/screenshots/"
```

- [ ] **Step 2: Write Hero tests**

`src/__tests__/Hero.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import Hero from '../components/sections/Hero'

describe('Hero', () => {
  it('renders h1 headline', () => {
    render(<Hero />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      /manage your properties smarter/i
    )
  })

  it('renders Start Free Trial CTA', () => {
    render(<Hero />)
    expect(screen.getByRole('link', { name: /start free trial/i })).toBeInTheDocument()
  })

  it('renders Book a Demo CTA', () => {
    render(<Hero />)
    expect(screen.getByRole('link', { name: /book a demo/i })).toBeInTheDocument()
  })

  it('renders trust bar copy', () => {
    render(<Hero />)
    expect(screen.getByText(/trusted by landlords across ghana/i)).toBeInTheDocument()
  })

  it('renders dashboard screenshot', () => {
    render(<Hero />)
    expect(screen.getByAltText(/tenantx dashboard/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 3: Run tests — confirm they fail**

```bash
npm test -- Hero
```
Expected: FAIL

- [ ] **Step 4: Implement Hero**

`src/components/sections/Hero.tsx`:
```tsx
import { motion } from 'framer-motion'
import Button from '../ui/Button'
import { APP_URL, DEMO_URL } from '../../lib/constants'

const PARTNER_PLACEHOLDERS = ['Partner 1', 'Partner 2', 'Partner 3', 'Partner 4']

export default function Hero() {
  return (
    <section id="top" className="relative pt-24 pb-20 overflow-hidden bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight">
            Manage your properties smarter.{' '}
            <span className="text-primary">Collect rent faster.</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            TenantX helps Ghanaian landlords track tenants, automate invoices, and collect rent
            via Mobile Money — all in one place.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="primary" size="lg" href={`${APP_URL}/register`}>
              Start Free Trial
            </Button>
            <Button variant="outline" size="lg" href={DEMO_URL}>
              Book a Demo
            </Button>
          </div>
        </motion.div>

        <motion.div
          className="mt-16 max-w-5xl mx-auto"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div
            className="rounded-xl overflow-hidden shadow-2xl border border-gray-200 bg-white"
            style={{ transform: 'perspective(1200px) rotateX(4deg) rotateY(-2deg)' }}
          >
            <div className="bg-gray-100 px-4 py-3 flex items-center gap-2 border-b border-gray-200">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-400" />
                <span className="w-3 h-3 rounded-full bg-yellow-400" />
                <span className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 mx-4 bg-white rounded px-3 py-1 text-xs text-gray-400 border border-gray-200">
                app.tenantx.gh/dashboard
              </div>
            </div>
            <img
              src="/assets/screenshots/dashboard.webp"
              alt="TenantX Dashboard"
              className="w-full"
              loading="eager"
            />
          </div>
        </motion.div>

        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500 font-medium mb-6">Trusted by landlords across Ghana</p>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-40 grayscale">
            {PARTNER_PLACEHOLDERS.map(name => (
              <div
                key={name}
                className="h-8 w-24 bg-gray-400 rounded flex items-center justify-center text-xs text-white font-medium"
              >
                {name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 5: Run tests — confirm they pass**

```bash
npm test -- Hero
```
Expected: 5 tests pass

- [ ] **Step 6: Commit**

```bash
git add src/components/sections/Hero.tsx src/__tests__/Hero.test.tsx public/assets/
git commit -m "feat: add Hero section with 3D dashboard mockup, CTAs, and trust bar"
```

---

### Task 5: WhyTenantX Section

**Files:**
- Create: `src/components/sections/WhyTenantX.tsx`
- Create: `src/__tests__/WhyTenantX.test.tsx`

**Interfaces:**
- Consumes: `useScrollAnimation` from `src/hooks/useScrollAnimation.ts`
- Produces: `<WhyTenantX />` — no props

- [ ] **Step 1: Write tests**

`src/__tests__/WhyTenantX.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import WhyTenantX from '../components/sections/WhyTenantX'

describe('WhyTenantX', () => {
  it('renders h2 headline', () => {
    render(<WhyTenantX />)
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      /why landlords choose tenantx/i
    )
  })

  it('renders all 3 stats', () => {
    render(<WhyTenantX />)
    expect(screen.getByText('GH₵ 2M+')).toBeInTheDocument()
    expect(screen.getByText('500+')).toBeInTheDocument()
    expect(screen.getByText('98%')).toBeInTheDocument()
  })

  it('renders differentiator list', () => {
    render(<WhyTenantX />)
    expect(screen.getByText(/momo native/i)).toBeInTheDocument()
    expect(screen.getByText(/digital agreements/i)).toBeInTheDocument()
    expect(screen.getByText(/multi-property/i)).toBeInTheDocument()
    expect(screen.getByText(/mobile-first/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
npm test -- WhyTenantX
```

- [ ] **Step 3: Implement WhyTenantX**

`src/components/sections/WhyTenantX.tsx`:
```tsx
import { motion } from 'framer-motion'
import { useScrollAnimation } from '../../hooks/useScrollAnimation'

const STATS = [
  { value: 'GH₵ 2M+', label: 'Rent collected on time' },
  { value: '500+', label: 'Properties managed across Ghana' },
  { value: '98%', label: 'Platform uptime, always available' },
]

const DIFFERENTIATORS = [
  'MoMo native — collect rent directly via Mobile Money',
  'Digital agreements — no printing, no chasing signatures',
  'Multi-property — manage all your properties in one account',
  'Mobile-first — works perfectly on any Android phone',
]

export default function WhyTenantX() {
  const { ref, isInView } = useScrollAnimation()

  return (
    <section className="bg-dark-bg py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Why landlords choose TenantX for smarter property management
          </h2>
          <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
            Our platform is purpose-built for the Ghanaian rental market — from MoMo collections
            to digital agreements.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-20">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.value}
              initial={{ opacity: 0, y: 24 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="text-center"
            >
              <p className="text-4xl sm:text-5xl font-extrabold text-primary">{stat.value}</p>
              <p className="mt-2 text-gray-400">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h3 className="text-2xl font-bold text-white mb-6">Built for Ghana, from the ground up</h3>
            <ul className="space-y-4">
              {DIFFERENTIATORS.map(item => (
                <li key={item} className="flex items-start gap-3 text-gray-300">
                  <span className="mt-1 w-5 h-5 rounded-full bg-primary flex-shrink-0 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative">
            <img
              src="/assets/screenshots/dashboard.webp"
              alt="TenantX analytics dashboard"
              className="rounded-xl shadow-2xl w-full"
              loading="lazy"
            />
            <div className="absolute -top-3 -right-3 bg-white rounded-lg px-3 py-2 shadow-lg text-xs font-semibold text-gray-800">
              GH₵ 4,500 collected
            </div>
            <div className="absolute bottom-8 -left-3 bg-primary rounded-lg px-3 py-2 shadow-lg text-xs font-semibold text-white">
              8/8 units occupied
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Run tests — confirm they pass**

```bash
npm test -- WhyTenantX
```
Expected: 3 tests pass

- [ ] **Step 5: Commit**

```bash
git add src/components/sections/WhyTenantX.tsx src/__tests__/WhyTenantX.test.tsx
git commit -m "feat: add WhyTenantX dark section with stats and differentiator list"
```

---

### Task 6: Features Grid

**Files:**
- Create: `src/components/sections/Features.tsx`
- Create: `src/__tests__/Features.test.tsx`

**Interfaces:**
- Consumes: `useScrollAnimation`; `SectionWrapper`
- Produces: `<Features />` — no props

- [ ] **Step 1: Write tests**

`src/__tests__/Features.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import Features from '../components/sections/Features'

describe('Features', () => {
  it('renders h2 headline', () => {
    render(<Features />)
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      /everything you need/i
    )
  })

  it('renders all 6 feature card titles', () => {
    render(<Features />)
    expect(screen.getByText('Property Management')).toBeInTheDocument()
    expect(screen.getByText('Tenant Onboarding')).toBeInTheDocument()
    expect(screen.getByText('Invoice & Billing')).toBeInTheDocument()
    expect(screen.getByText('Lease Agreements')).toBeInTheDocument()
    expect(screen.getByText('Maintenance Requests')).toBeInTheDocument()
    expect(screen.getByText('Reports & Analytics')).toBeInTheDocument()
  })

  it('renders 6 feature images', () => {
    render(<Features />)
    expect(screen.getAllByRole('img').length).toBe(6)
  })
})
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
npm test -- Features
```

- [ ] **Step 3: Add screenshot placeholders**

```bash
for name in properties onboarding invoice agreement maintenance analytics; do
  cp public/assets/screenshots/dashboard.webp "public/assets/screenshots/${name}.webp" 2>/dev/null \
    || echo "Copy dashboard.webp to ${name}.webp manually"
done
```

- [ ] **Step 4: Implement Features**

`src/components/sections/Features.tsx`:
```tsx
import { motion } from 'framer-motion'
import { Building2, Users, FileText, FileCheck, Wrench, BarChart3 } from 'lucide-react'
import { useScrollAnimation } from '../../hooks/useScrollAnimation'
import SectionWrapper from '../ui/SectionWrapper'
import type { LucideIcon } from 'lucide-react'

interface FeatureCard {
  title: string
  description: string
  icon: LucideIcon
  screenshot: string
  alt: string
}

const FEATURES: FeatureCard[] = [
  {
    title: 'Property Management',
    description: 'Add and manage unlimited properties and units with full details, photos, and rent schedules.',
    icon: Building2,
    screenshot: '/assets/screenshots/properties.webp',
    alt: 'Property management list view',
  },
  {
    title: 'Tenant Onboarding',
    description: 'Digital 5-step onboarding wizard. No paperwork, no chasing — tenants set up in minutes.',
    icon: Users,
    screenshot: '/assets/screenshots/onboarding.webp',
    alt: 'Tenant onboarding wizard',
  },
  {
    title: 'Invoice & Billing',
    description: 'Auto-generate invoices and collect rent via Mobile Money instantly. Track who has paid.',
    icon: FileText,
    screenshot: '/assets/screenshots/invoice.webp',
    alt: 'Invoice and billing view',
  },
  {
    title: 'Lease Agreements',
    description: 'Create digital lease agreements with custom terms. Sign and store everything in the cloud.',
    icon: FileCheck,
    screenshot: '/assets/screenshots/agreement.webp',
    alt: 'Lease agreement form',
  },
  {
    title: 'Maintenance Requests',
    description: 'Log, track, and resolve maintenance issues in one place. Keep tenants informed.',
    icon: Wrench,
    screenshot: '/assets/screenshots/maintenance.webp',
    alt: 'Maintenance requests list',
  },
  {
    title: 'Reports & Analytics',
    description: 'Occupancy rates, revenue trends, and expense tracking — all in real-time dashboards.',
    icon: BarChart3,
    screenshot: '/assets/screenshots/analytics.webp',
    alt: 'Analytics dashboard',
  },
]

export default function Features() {
  const { ref, isInView } = useScrollAnimation()

  return (
    <SectionWrapper id="features" className="py-20 lg:py-28 bg-white">
      <div ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Everything you need to run your rental business
          </h2>
          <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
            From onboarding tenants to collecting rent, TenantX handles it all.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {FEATURES.map((feature, i) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 32 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                <img
                  src={feature.screenshot}
                  alt={feature.alt}
                  className="w-full h-48 object-cover object-top"
                  loading="lazy"
                />
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon size={20} className="text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
                  </div>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </SectionWrapper>
  )
}
```

- [ ] **Step 5: Run tests — confirm they pass**

```bash
npm test -- Features
```
Expected: 3 tests pass

- [ ] **Step 6: Commit**

```bash
git add src/components/sections/Features.tsx src/__tests__/Features.test.tsx public/assets/screenshots/
git commit -m "feat: add Features grid with 6 animated cards"
```

---

### Task 7: Results Section

**Files:**
- Create: `src/components/sections/Results.tsx`
- Create: `src/__tests__/Results.test.tsx`

**Interfaces:**
- Consumes: `useScrollAnimation`; `SectionWrapper`
- Produces: `<Results />` — no props

- [ ] **Step 1: Write tests**

`src/__tests__/Results.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import Results from '../components/sections/Results'

describe('Results', () => {
  it('renders h2 headline', () => {
    render(<Results />)
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      /data-driven insights/i
    )
  })

  it('renders all 4 checklist items', () => {
    render(<Results />)
    expect(screen.getByText(/real-time rent collection tracking/i)).toBeInTheDocument()
    expect(screen.getByText(/occupancy and vacancy reporting/i)).toBeInTheDocument()
    expect(screen.getByText(/expense vs revenue breakdown/i)).toBeInTheDocument()
    expect(screen.getByText(/automated overdue rent reminders/i)).toBeInTheDocument()
  })

  it('renders pull quote attribution', () => {
    render(<Results />)
    expect(screen.getByText(/kofi a\./i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
npm test -- Results
```

- [ ] **Step 3: Implement Results**

`src/components/sections/Results.tsx`:
```tsx
import { motion } from 'framer-motion'
import { CheckCircle } from 'lucide-react'
import { useScrollAnimation } from '../../hooks/useScrollAnimation'
import SectionWrapper from '../ui/SectionWrapper'

const CHECKLIST = [
  'Real-time rent collection tracking',
  'Occupancy and vacancy reporting',
  'Expense vs revenue breakdown',
  'Automated overdue rent reminders',
]

export default function Results() {
  const { ref, isInView } = useScrollAnimation()

  return (
    <SectionWrapper className="py-20 lg:py-28 bg-gray-50">
      <div ref={ref}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Data-driven insights that help you grow
            </h2>
            <p className="text-gray-600 mb-8">
              Stop guessing. TenantX gives you clear visibility into every corner of your rental
              portfolio so you can make smarter decisions faster.
            </p>
            <ul className="space-y-4">
              {CHECKLIST.map(item => (
                <li key={item} className="flex items-center gap-3 text-gray-700">
                  <CheckCircle size={20} className="text-primary flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 32 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="rounded-xl border border-gray-200 overflow-hidden shadow-lg">
              <img
                src="/assets/screenshots/analytics.webp"
                alt="TenantX analytics"
                className="w-full"
                loading="lazy"
              />
            </div>
          </motion.div>
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-8 flex flex-col sm:flex-row items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-gray-300 flex-shrink-0 overflow-hidden">
            <img
              src="/assets/avatars/avatar-1.webp"
              alt="Kofi A."
              className="w-full h-full object-cover"
              loading="lazy"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          </div>
          <div>
            <p className="text-gray-700 text-lg italic">
              "TenantX saved me over 10 hours a month on manual bookkeeping. Now I can focus on
              growing my portfolio."
            </p>
            <p className="mt-2 font-semibold text-gray-900">
              Kofi A. <span className="text-gray-500 font-normal">— Accra, Ghana</span>
            </p>
          </div>
        </div>
      </div>
    </SectionWrapper>
  )
}
```

- [ ] **Step 4: Run tests — confirm they pass**

```bash
npm test -- Results
```
Expected: 3 tests pass

- [ ] **Step 5: Commit**

```bash
git add src/components/sections/Results.tsx src/__tests__/Results.test.tsx
git commit -m "feat: add Results section with checklist and pull quote"
```

---

### Task 8: Testimonials Carousel

**Files:**
- Create: `src/components/sections/Testimonials.tsx`
- Create: `src/__tests__/Testimonials.test.tsx`

**Interfaces:**
- Consumes: `TESTIMONIALS` (array of `Testimonial`) from constants; `useScrollAnimation`; `SectionWrapper`
- Produces: `<Testimonials />` — no props

- [ ] **Step 1: Write tests**

`src/__tests__/Testimonials.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import Testimonials from '../components/sections/Testimonials'

describe('Testimonials', () => {
  it('renders h2 heading', () => {
    render(<Testimonials />)
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      /what our customers say/i
    )
  })

  it('renders all 3 testimonial names', () => {
    render(<Testimonials />)
    expect(screen.getByText(/kofi a\./i)).toBeInTheDocument()
    expect(screen.getByText(/ama b\./i)).toBeInTheDocument()
    expect(screen.getByText(/emmanuel d\./i)).toBeInTheDocument()
  })

  it('renders star ratings', () => {
    render(<Testimonials />)
    expect(screen.getAllByLabelText('star').length).toBe(15)
  })
})
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
npm test -- Testimonials
```

- [ ] **Step 3: Implement Testimonials**

`src/components/sections/Testimonials.tsx`:
```tsx
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star } from 'lucide-react'
import { useScrollAnimation } from '../../hooks/useScrollAnimation'
import SectionWrapper from '../ui/SectionWrapper'
import { TESTIMONIALS } from '../../lib/constants'

export default function Testimonials() {
  const { ref, isInView } = useScrollAnimation()
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)

  const next = useCallback(() => {
    setActive(i => (i + 1) % TESTIMONIALS.length)
  }, [])

  useEffect(() => {
    if (paused) return
    const id = setInterval(next, 4000)
    return () => clearInterval(id)
  }, [paused, next])

  const Stars = () => (
    <div className="flex gap-0.5 mb-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={16} className="text-yellow-400 fill-yellow-400" aria-label="star" />
      ))}
    </div>
  )

  return (
    <SectionWrapper className="py-20 lg:py-28 bg-white">
      <div ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">What our customers say?</h2>
        </motion.div>

        {/* Desktop: all 3 visible */}
        <div className="hidden md:grid grid-cols-3 gap-6">
          {TESTIMONIALS.map(t => (
            <div key={t.id} className="rounded-2xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <Stars />
              <p className="text-gray-700 mb-6 italic">"{t.quote}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                  <img src={t.avatar} alt={t.name} className="w-full h-full object-cover" loading="lazy"
                       onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{t.name}</p>
                  <p className="text-sm text-gray-500">{t.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile: single-card carousel */}
        <div
          className="md:hidden"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="relative overflow-hidden">
            <AnimatePresence mode="wait">
              {TESTIMONIALS.map((t, i) =>
                i === active ? (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, x: 60 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -60 }}
                    transition={{ duration: 0.35 }}
                    className="rounded-2xl border border-gray-200 p-6"
                  >
                    <Stars />
                    <p className="text-gray-700 mb-6 italic">"{t.quote}"</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                        <img src={t.avatar} alt={t.name} className="w-full h-full object-cover" loading="lazy"
                             onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{t.name}</p>
                        <p className="text-sm text-gray-500">{t.location}</p>
                      </div>
                    </div>
                  </motion.div>
                ) : null
              )}
            </AnimatePresence>
          </div>
          <div className="flex justify-center gap-2 mt-6">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`w-2 h-2 rounded-full transition-colors ${i === active ? 'bg-primary' : 'bg-gray-300'}`}
                aria-label={`Go to testimonial ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </SectionWrapper>
  )
}
```

- [ ] **Step 4: Run tests — confirm they pass**

```bash
npm test -- Testimonials
```
Expected: 3 tests pass

- [ ] **Step 5: Commit**

```bash
git add src/components/sections/Testimonials.tsx src/__tests__/Testimonials.test.tsx
git commit -m "feat: add Testimonials section with mobile carousel and desktop grid"
```

---

### Task 9: Pricing Section

**Files:**
- Create: `src/components/sections/Pricing.tsx`
- Create: `src/__tests__/Pricing.test.tsx`

**Interfaces:**
- Consumes: `PLANS` (`Plan[]`) from constants; `APP_URL`; `Button`; `useScrollAnimation`; `SectionWrapper`
- Produces: `<Pricing />` — no props

- [ ] **Step 1: Write tests**

`src/__tests__/Pricing.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import Pricing from '../components/sections/Pricing'

describe('Pricing', () => {
  it('renders h2 headline', () => {
    render(<Pricing />)
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(/flexible plans/i)
  })

  it('renders all 3 plan names', () => {
    render(<Pricing />)
    expect(screen.getByText('BASIC')).toBeInTheDocument()
    expect(screen.getByText('STANDARD')).toBeInTheDocument()
    expect(screen.getByText('PREMIUM')).toBeInTheDocument()
  })

  it('renders correct prices', () => {
    render(<Pricing />)
    expect(screen.getByText('50')).toBeInTheDocument()
    expect(screen.getByText('150')).toBeInTheDocument()
    expect(screen.getByText('350')).toBeInTheDocument()
  })

  it('marks STANDARD as most popular', () => {
    render(<Pricing />)
    expect(screen.getByText('Most Popular')).toBeInTheDocument()
  })

  it('renders 3 Get Started links', () => {
    render(<Pricing />)
    expect(screen.getAllByRole('link', { name: /get started/i }).length).toBe(3)
  })

  it('renders traditional costs comparison', () => {
    render(<Pricing />)
    expect(screen.getByText(/what landlords spend traditionally/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
npm test -- Pricing
```

- [ ] **Step 3: Implement Pricing**

`src/components/sections/Pricing.tsx`:
```tsx
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { useScrollAnimation } from '../../hooks/useScrollAnimation'
import SectionWrapper from '../ui/SectionWrapper'
import Button from '../ui/Button'
import { PLANS, APP_URL } from '../../lib/constants'

const TRADITIONAL_COSTS = [
  { label: 'Manual bookkeeping', cost: 'GHS 200/mo' },
  { label: 'Printing agreements', cost: 'GHS 50/mo' },
  { label: 'Missed rent (no reminders)', cost: 'GHS 500+/mo' },
]

export default function Pricing() {
  const { ref, isInView } = useScrollAnimation()

  return (
    <SectionWrapper id="pricing" className="py-20 lg:py-28 bg-gray-50">
      <div ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Flexible plans that fit your portfolio
          </h2>
          <p className="mt-3 text-gray-500">No hidden fees. Cancel anytime.</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* Traditional costs */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="bg-red-50 border border-red-200 rounded-2xl p-6"
          >
            <h3 className="font-semibold text-gray-900 mb-4 text-sm uppercase tracking-wide">
              What landlords spend traditionally
            </h3>
            <ul className="space-y-3 mb-6">
              {TRADITIONAL_COSTS.map(item => (
                <li key={item.label} className="flex justify-between text-sm">
                  <span className="text-gray-600">{item.label}</span>
                  <span className="font-semibold text-red-600">{item.cost}</span>
                </li>
              ))}
            </ul>
            <div className="border-t border-red-200 pt-3 flex justify-between font-bold">
              <span>Total</span>
              <span className="text-red-600">GHS 750+/mo</span>
            </div>
          </motion.div>

          {/* Plan cards */}
          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {PLANS.map((plan, i) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 32 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`rounded-2xl p-6 flex flex-col relative ${
                  plan.popular
                    ? 'bg-primary text-white shadow-xl shadow-primary/30 scale-105'
                    : 'bg-white border border-gray-200'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                    Most Popular
                  </div>
                )}
                <div className="mb-4">
                  <p className={`text-xs font-bold tracking-widest mb-1 ${plan.popular ? 'text-white/70' : 'text-gray-500'}`}>
                    {plan.name}
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-sm font-medium ${plan.popular ? 'text-white/80' : 'text-gray-500'}`}>GHS</span>
                    <span className="text-4xl font-extrabold">{plan.price}</span>
                    <span className={`text-sm ${plan.popular ? 'text-white/70' : 'text-gray-500'}`}>/mo</span>
                  </div>
                  <p className={`text-sm mt-1 ${plan.popular ? 'text-white/70' : 'text-gray-500'}`}>
                    Up to {plan.units} units · {plan.momoFee} MoMo fee
                  </p>
                </div>
                <ul className="space-y-2 flex-1 mb-6">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check size={16} className={`mt-0.5 flex-shrink-0 ${plan.popular ? 'text-white' : 'text-primary'}`} />
                      <span className={plan.popular ? 'text-white/90' : 'text-gray-600'}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  variant={plan.popular ? 'secondary' : 'outline'}
                  href={`${APP_URL}/register?plan=${plan.id}`}
                  className="w-full justify-center"
                >
                  Get Started
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </SectionWrapper>
  )
}
```

- [ ] **Step 4: Run tests — confirm they pass**

```bash
npm test -- Pricing
```
Expected: 6 tests pass

- [ ] **Step 5: Commit**

```bash
git add src/components/sections/Pricing.tsx src/__tests__/Pricing.test.tsx
git commit -m "feat: add Pricing section with plan cards and cost comparison"
```

---

### Task 10: FAQ Accordion

**Files:**
- Create: `src/components/sections/FAQ.tsx`
- Create: `src/__tests__/FAQ.test.tsx`

**Interfaces:**
- Consumes: `FAQ_ITEMS` (`FAQItem[]`) from constants; `SectionWrapper`; `useScrollAnimation`
- Produces: `<FAQ />` — no props

- [ ] **Step 1: Write tests**

`src/__tests__/FAQ.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FAQ from '../components/sections/FAQ'

describe('FAQ', () => {
  it('renders h2 headline', () => {
    render(<FAQ />)
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      /frequently asked questions/i
    )
  })

  it('renders all 6 questions', () => {
    render(<FAQ />)
    expect(screen.getByText(/mobile money rent collection/i)).toBeInTheDocument()
    expect(screen.getByText(/manage multiple properties/i)).toBeInTheDocument()
    expect(screen.getByText(/tenant data secure/i)).toBeInTheDocument()
    expect(screen.getByText(/technical knowledge/i)).toBeInTheDocument()
    expect(screen.getByText(/exceed my unit limit/i)).toBeInTheDocument()
    expect(screen.getByText(/cancel my subscription/i)).toBeInTheDocument()
  })

  it('shows answer when question clicked', async () => {
    const user = userEvent.setup()
    render(<FAQ />)
    await user.click(screen.getByText(/mobile money rent collection/i))
    expect(screen.getByText(/ghana's mobile money networks/i)).toBeInTheDocument()
  })

  it('closes first answer when second question clicked', async () => {
    const user = userEvent.setup()
    render(<FAQ />)
    await user.click(screen.getByText(/mobile money rent collection/i))
    await user.click(screen.getByText(/manage multiple properties/i))
    expect(screen.queryByText(/ghana's mobile money networks/i)).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
npm test -- FAQ
```

- [ ] **Step 3: Implement FAQ**

`src/components/sections/FAQ.tsx`:
```tsx
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { useScrollAnimation } from '../../hooks/useScrollAnimation'
import SectionWrapper from '../ui/SectionWrapper'
import { FAQ_ITEMS } from '../../lib/constants'

export default function FAQ() {
  const { ref, isInView } = useScrollAnimation()
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggle = (i: number) => setOpenIndex(prev => (prev === i ? null : i))

  return (
    <SectionWrapper id="faq" className="py-20 lg:py-28 bg-white">
      <div ref={ref} className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Frequently asked questions
          </h2>
        </motion.div>

        <div className="divide-y divide-gray-200 border border-gray-200 rounded-2xl overflow-hidden">
          {FAQ_ITEMS.map((item, i) => (
            <div key={i}>
              <button
                onClick={() => toggle(i)}
                className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-gray-50 transition-colors"
                aria-expanded={openIndex === i}
              >
                <span className="font-medium text-gray-900 pr-4">{item.question}</span>
                <ChevronDown
                  size={20}
                  className={`flex-shrink-0 text-gray-500 transition-transform duration-300 ${openIndex === i ? 'rotate-180' : ''}`}
                />
              </button>
              <AnimatePresence initial={false}>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <p className="px-6 pb-5 text-gray-600 leading-relaxed">{item.answer}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  )
}
```

- [ ] **Step 4: Run tests — confirm they pass**

```bash
npm test -- FAQ
```
Expected: 4 tests pass

- [ ] **Step 5: Commit**

```bash
git add src/components/sections/FAQ.tsx src/__tests__/FAQ.test.tsx
git commit -m "feat: add FAQ accordion with animated open/close"
```

---

### Task 11: FinalCTA + Footer

**Files:**
- Create: `src/components/sections/FinalCTA.tsx`
- Create: `src/components/layout/Footer.tsx`
- Create: `src/__tests__/FinalCTA.test.tsx`
- Create: `src/__tests__/Footer.test.tsx`

**Interfaces:**
- Consumes: `APP_URL`, `DEMO_URL`, `NAV_LINKS` from constants; `Button`; `useScrollAnimation`
- Produces: `<FinalCTA />`, `<Footer />` — no props

- [ ] **Step 1: Write tests**

`src/__tests__/FinalCTA.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import FinalCTA from '../components/sections/FinalCTA'

describe('FinalCTA', () => {
  it('renders h2 headline', () => {
    render(<FinalCTA />)
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      /ready to manage your properties/i
    )
  })

  it('renders Get Started Free link', () => {
    render(<FinalCTA />)
    expect(screen.getByRole('link', { name: /get started free/i })).toBeInTheDocument()
  })

  it('renders Talk to Sales link', () => {
    render(<FinalCTA />)
    expect(screen.getByRole('link', { name: /talk to sales/i })).toBeInTheDocument()
  })
})
```

`src/__tests__/Footer.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import Footer from '../components/layout/Footer'

describe('Footer', () => {
  it('renders tagline', () => {
    render(<Footer />)
    expect(screen.getByText(/property management built for ghana/i)).toBeInTheDocument()
  })

  it('renders Privacy Policy link', () => {
    render(<Footer />)
    expect(screen.getByRole('link', { name: /privacy policy/i })).toBeInTheDocument()
  })

  it('renders Terms of Service link', () => {
    render(<Footer />)
    expect(screen.getByRole('link', { name: /terms of service/i })).toBeInTheDocument()
  })

  it('renders copyright', () => {
    render(<Footer />)
    expect(screen.getByText(/2026 tenantx/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
npm test -- FinalCTA Footer
```

- [ ] **Step 3: Implement FinalCTA**

`src/components/sections/FinalCTA.tsx`:
```tsx
import { motion } from 'framer-motion'
import { useScrollAnimation } from '../../hooks/useScrollAnimation'
import Button from '../ui/Button'
import { APP_URL, DEMO_URL } from '../../lib/constants'

export default function FinalCTA() {
  const { ref, isInView } = useScrollAnimation()

  return (
    <section className="bg-primary py-20 lg:py-28">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to manage your properties smarter?
          </h2>
          <p className="text-white/80 text-lg mb-10">
            Join hundreds of Ghanaian landlords already using TenantX.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="secondary" size="lg" href={`${APP_URL}/register`}>
              Get Started Free
            </Button>
            <Button
              variant="outline"
              size="lg"
              href={DEMO_URL}
              className="border-white text-white hover:bg-white hover:text-primary"
            >
              Talk to Sales
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Implement Footer**

`src/components/layout/Footer.tsx`:
```tsx
const FOOTER_LINKS: Record<string, { label: string; href: string }[]> = {
  Product: [
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'FAQ', href: '#faq' },
    { label: 'Changelog', href: '#' },
  ],
  Company: [
    { label: 'About', href: '#' },
    { label: 'Blog', href: '#' },
    { label: 'Contact', href: '#contact' },
    { label: 'Careers', href: '#' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
    { label: 'Cookie Policy', href: '#' },
  ],
}

export default function Footer() {
  return (
    <footer id="contact" className="bg-gray-900 text-gray-400 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-gray-800">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">TX</span>
              </div>
              <span className="font-bold text-xl text-white">TenantX</span>
            </div>
            <p className="text-sm leading-relaxed mb-6">Property management built for Ghana</p>
            <div className="flex gap-4">
              <a href="#" aria-label="Twitter/X" className="hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a href="#" aria-label="LinkedIn" className="hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
              <a href="#" aria-label="WhatsApp" className="hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </a>
            </div>
          </div>

          {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
            <div key={heading}>
              <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">{heading}</h4>
              <ul className="space-y-3">
                {links.map(link => (
                  <li key={link.label}>
                    <a href={link.href} className="text-sm hover:text-white transition-colors">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 text-center text-sm">
          <p>© 2026 TenantX. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
```

- [ ] **Step 5: Run tests — confirm they pass**

```bash
npm test -- FinalCTA Footer
```
Expected: 7 tests pass (3 + 4)

- [ ] **Step 6: Commit**

```bash
git add src/components/sections/FinalCTA.tsx src/components/layout/Footer.tsx src/__tests__/FinalCTA.test.tsx src/__tests__/Footer.test.tsx
git commit -m "feat: add FinalCTA and Footer"
```

---

### Task 12: App Assembly + CLAUDE.md

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/__tests__/App.test.tsx`
- Create: `CLAUDE.md`

**Interfaces:**
- Consumes: all section and layout components

- [ ] **Step 1: Wire all sections in App.tsx**

`src/App.tsx`:
```tsx
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import Hero from './components/sections/Hero'
import WhyTenantX from './components/sections/WhyTenantX'
import Features from './components/sections/Features'
import Results from './components/sections/Results'
import Testimonials from './components/sections/Testimonials'
import Pricing from './components/sections/Pricing'
import FAQ from './components/sections/FAQ'
import FinalCTA from './components/sections/FinalCTA'

export default function App() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <Navbar />
      <main>
        <Hero />
        <WhyTenantX />
        <Features />
        <Results />
        <Testimonials />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  )
}
```

- [ ] **Step 2: Update App smoke test**

`src/__tests__/App.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import App from '../App'

describe('App', () => {
  it('renders page banner (header)', () => {
    render(<App />)
    expect(screen.getByRole('banner')).toBeInTheDocument()
  })

  it('renders main content area', () => {
    render(<App />)
    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  it('renders footer', () => {
    render(<App />)
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  })
})
```

- [ ] **Step 3: Run all tests**

```bash
npm test
```
Expected: all tests pass with no failures.

- [ ] **Step 4: Type check**

```bash
npm run type-check
```
Expected: no TypeScript errors.

- [ ] **Step 5: Production build check**

```bash
npm run build
```
Expected: build succeeds, output in `dist/`. Check that `dist/index.html` exists.

- [ ] **Step 6: Write CLAUDE.md**

`CLAUDE.md`:
```markdown
# tenantx-landing

Public SaaS marketing site for TenantX — targeting Ghanaian landlords.
Standalone React + Vite app. Separate from the Next.js landlord portal (`Tenants/`).

## Commands

\`\`\`bash
npm run dev          # Dev server at http://localhost:5173
npm run build        # Production build → dist/
npm run preview      # Preview production build locally
npm test             # Run Vitest once
npm run test:watch   # Vitest in watch mode
npm run type-check   # TypeScript check (tsc --noEmit)
\`\`\`

## Architecture

Single-page app. All sections render sequentially in `src/App.tsx`. No routing — anchor scroll only.

| Layer | Location | Responsibility |
|---|---|---|
| Sections | `src/components/sections/` | One file per page section |
| Layout | `src/components/layout/` | Navbar, Footer |
| UI primitives | `src/components/ui/` | Button, SectionWrapper |
| Copy & data | `src/lib/constants.ts` | All text, plans, FAQ, testimonials |
| Types | `src/types/index.ts` | Plan, Testimonial, FAQItem |
| Tests | `src/__tests__/` | Vitest + React Testing Library |

## Environment Variables

\`\`\`env
VITE_APP_URL=https://app.tenantx.gh      # Next.js landlord portal
VITE_DEMO_URL=https://calendly.com/tenantx/demo
\`\`\`

Copy `.env.example` to `.env.local` for local development.

## Screenshots

Placeholder WebP files are in `public/assets/screenshots/`.
Replace with real WebP exports (max 800px wide) from the TenantX app before launch.

## Brand

Primary: `#7367F0` · Dark bg: `#1A1A2E` · Font: Inter
```

- [ ] **Step 7: Final commit**

```bash
git add src/App.tsx src/__tests__/App.test.tsx CLAUDE.md
git commit -m "feat: assemble full landing page, wire all sections, add CLAUDE.md"
```

---

## Self-Review

**Spec coverage:**
- ✅ Navbar — sticky, blur on scroll, mobile hamburger, Sign In + Get Started links
- ✅ Hero — h1 headline, 2 CTAs, browser-frame 3D dashboard screenshot, trust bar
- ✅ WhyTenantX dark section — 3 stats, differentiator list, annotated screenshot
- ✅ Features grid — 6 cards with icons, descriptions, and screenshots
- ✅ Results — 2-col split, 4-item checklist, analytics screenshot, pull quote strip
- ✅ Testimonials — 3-col desktop, mobile carousel with dots, auto-scroll + pause on hover
- ✅ Pricing — traditional cost comparison + 3 plan cards, STANDARD highlighted, plan CTAs with `?plan=`
- ✅ FAQ — accordion, 6 full questions + answers in constants, one open at a time
- ✅ FinalCTA — purple bg, headline, 2 CTAs
- ✅ Footer — 4 columns, social SVG icons, legal links, copyright 2026
- ✅ Responsive — hamburger < md, 1-col stacks, horizontal pricing scroll on tablet, lazy images
- ✅ Brand tokens — `primary`, `primary-dark`, `dark-bg` in tailwind.config.ts
- ✅ Env variables — `VITE_APP_URL`, `VITE_DEMO_URL`, `.env.example`
- ✅ CLAUDE.md written
- ✅ `<3s on 3G` — WebP format, `loading="lazy"` below fold, no heavy JS bundles, `loading="eager"` on hero only

**Placeholder scan:** No TBDs. FAQ answers fully written in `constants.ts`. Screenshot placeholders explicit with replacement instructions. All code complete.

**Type consistency:** `Plan`, `Testimonial`, `FAQItem` defined once in `src/types/index.ts`. `PLANS` typed as `Plan[]`, `TESTIMONIALS` as `Testimonial[]`, `FAQ_ITEMS` as `FAQItem[]` — all consistent across tasks.
