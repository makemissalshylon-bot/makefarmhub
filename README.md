# MAKEFARMHUB

**Digital Agriculture Marketplace** — Connecting farmers, buyers, and transporters across Zimbabwe.

Live: [makefarmhub-eosin.vercel.app](https://makefarmhub-eosin.vercel.app)

## Features

- **Marketplace** — Browse and list crops, livestock, and farm equipment with advanced search, location filtering, price ranges, and saved searches
- **Multi-role Dashboards** — Tailored views for farmers, buyers, transporters, and admins
- **Payments** — Stripe card payments + Mobile Money (EcoCash, OneMoney, InnBucks, Telecash)
- **Real-time Messaging** — WebSocket-powered chat with typing indicators, image sharing, and location sharing
- **Multi-language** — English, Shona, and Ndebele with currency switching (USD/ZWL)
- **Transport Booking** — Book and track deliveries with vehicle management
- **Email Notifications** — Transactional emails for orders, payments, delivery updates, and messages
- **Analytics Dashboard** — Charts, stats, and reports for admin users
- **PWA** — Installable, offline-capable progressive web app with push notifications
- **Dark Mode** — Full dark theme support across all components
- **Accessibility** — Keyboard navigation, screen reader support, accessibility panel

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite 5 |
| Styling | CSS custom properties, responsive design |
| Icons | Lucide React |
| Routing | React Router v6 |
| Backend | Vercel Serverless Functions |
| Database / Auth | Supabase |
| Payments | Stripe, Mobile Money (manual verify until provider keys) |
| Hosting | Vercel |

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
git clone https://github.com/zimprep-dev/makefarmhub.git
cd makefarmhub
npm install
```

### Environment Variables

Copy the example env file and fill in your keys:

```bash
cp .env.example .env
```

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | For real DB | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | For real DB | Supabase anon key |
| `VITE_STRIPE_PUBLISHABLE_KEY` | No | Enables real Stripe Elements checkout |
| `VITE_OPENWEATHER_API_KEY` | No | Weather widget (alias: `VITE_WEATHER_API_KEY`) |
| `VITE_GA_ID` | No | Google Analytics (alias: `VITE_GA_MEASUREMENT_ID`) |
| `VITE_API_URL` | No | API override (default `/api`) |

**Server-only variables** (set in Vercel dashboard, never in frontend):

| Variable | Description |
|----------|-------------|
| `SUPABASE_SERVICE_ROLE_KEY` | Webhooks / admin server ops |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret → point Dashboard to `/api/webhook` |
| `SENDGRID_API_KEY` | Email notifications |
| `RESEND_API_KEY` | Used by OTP email path when configured |
| `ECOCASH_API_KEY` / `ONEMONEY_API_KEY` / … | Mobile money providers |

### Development

```bash
npm run dev
```

Opens at `http://localhost:5173`. For local `/api/*` functions, use `npx vercel dev`.

### Build & test

```bash
npm run build
npm run preview
npm test
npm run typecheck
```

## API Endpoints

Consolidated Vercel functions (Hobby-friendly):

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payments?action=create-intent` | Create Stripe payment intent |
| POST | `/api/payments?action=confirm` | Verify payment intent status with Stripe |
| POST | `/api/payments?action=refund` | Create Stripe refund |
| POST | `/api/webhook` | Stripe webhook (DB updates + notifications) |
| POST | `/api/mobile-money?action=initiate` | Start mobile money payment |
| POST | `/api/mobile-money?action=verify` | Submit SMS reference (manual review if no provider) |
| POST | `/api/notifications?action=email` | Send transactional email |
| POST | `/api/notifications?action=sms` | Send SMS |
| POST | `/api/otp` | Send / verify OTP |

## Project Structure

```
MAKEFARMHUB/
├── api/                    # Vercel serverless functions
├── public/                 # Static assets, manifest, service worker, icons
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── Analytics/      # Chart components (Bar, Line, Donut, StatCard)
│   │   ├── Chat/           # Live chat widget
│   │   ├── Language/       # Language switcher
│   │   ├── Layout/         # Navbar, Footer, DashboardLayout
│   │   ├── Marketplace/    # Product cards, quick view, filters
│   │   ├── Mobile/         # Bottom nav, pull-to-refresh, swipeable cards
│   │   ├── Payment/        # Stripe + Mobile Money payment forms
│   │   ├── PWA/            # Install prompt, offline indicator
│   │   ├── Search/         # Advanced filters
│   │   └── UI/             # Toast, Modal, Skeleton, ErrorBoundary
│   ├── context/            # React contexts (Auth, Theme, Language, AppData)
│   ├── hooks/              # Custom hooks (realtime, scroll, safe state)
│   ├── locales/            # Translation strings (EN, SN, ND)
│   ├── pages/              # Route pages (Dashboard, Marketplace, Admin, etc.)
│   ├── services/           # API services (email, realtime, payments)
│   ├── styles/             # Global CSS (variables, dark mode, animations)
│   └── types/              # TypeScript type definitions
├── e2e/                    # Playwright end-to-end tests
├── .env.example            # Environment variable template
├── package.json
└── vite.config.ts          # Vite build configuration
```

## Roles

Sign up with a role, or (in local `npm run dev` only) switch roles from Profile.

| Role | Features |
|------|----------|
| Farmer | Dashboard, create listings, manage orders, wallet |
| Buyer | Browse marketplace, place orders, track deliveries |
| Transporter | Manage vehicles, accept bookings, track routes |
| Admin | Full analytics, user management, disputes, settings (Supabase `role=admin` in production) |

## Ops checklist (after deploy)

| Task | How |
|------|-----|
| Stripe keys | Vercel env: `VITE_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY` |
| Stripe webhook | Dashboard → endpoint `https://makefarmhub-eosin.vercel.app/api/webhook` → save `STRIPE_WEBHOOK_SECRET` → redeploy |
| Promote admin | Run `supabase/promote_admin.sql` in Supabase SQL Editor (replace email) |
| Seed DB samples | Run `supabase/seed.sql` after schema migrations |
| Config probe | `GET https://makefarmhub-eosin.vercel.app/api/check-config` (booleans only) |
| Local APIs | `npx vercel dev` (Vite alone does not serve `/api/*`) |

Without Stripe keys, checkout still offers mobile money (pending verification). Without Supabase listings, the UI seeds a demo catalog so marketplace is never empty.

## Deployment

The app auto-deploys to Vercel on push to `main`. For manual deployment:

```bash
npx vercel --prod
```

## License

UNLICENSED — All rights reserved.
