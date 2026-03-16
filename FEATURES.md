# MAKEFARMHUB Features Documentation

## 🎯 Core Features

### 1. **Supabase Database Backend**
- Full PostgreSQL database with Row Level Security (RLS)
- 11 core tables: profiles, listings, orders, wallets, transactions, disputes, messages, reviews, vehicles, transport_requests, notifications
- Automated triggers for timestamps and rating calculations
- Optimized RPC functions for complex queries
- Storage buckets with security policies for avatars, listings, and vehicle images

**Key Files:**
- `supabase/migrations/001_initial_schema.sql` - Database schema
- `supabase/migrations/002_rpc_functions.sql` - Admin analytics & wallet functions
- `supabase/seed.sql` - Initial test data
- `supabase/README.md` - Setup instructions

### 2. **Real Payment Integration**

#### Stripe Payments
- Full Stripe Elements integration for card payments
- Secure payment intent creation via backend API
- Webhook handling for payment confirmations
- Automatic wallet credit on successful payment
- 5% platform commission on completed orders

**Key Files:**
- `src/components/Payment/RealStripePayment.tsx` - Stripe UI
- `api/create-payment-intent.ts` - Payment intent creation
- `api/stripe-webhook.ts` - Payment event handling

#### Mobile Money Payments
- Support for EcoCash, OneMoney, Telecash, InnBucks
- Webhook integration for payment confirmations
- Automatic transaction recording in Supabase
- Real-time balance updates

**Key Files:**
- `api/mobile-money-webhook.ts` - Mobile money webhook handler

### 3. **Enhanced PWA Features**

#### Push Notifications
- Web Push API integration
- VAPID key-based subscription
- Service worker notification display
- Custom notification actions and badges
- Deep linking to app sections

**Key Files:**
- `src/services/pushNotificationService.ts` - Push notification client
- `public/sw.js` - Service worker with push handlers

#### Background Sync
- Offline-first architecture
- Automatic sync queue for failed requests
- Retry logic for network failures
- Support for messages, orders, listings, profile updates

**Key Files:**
- `src/services/backgroundSyncService.ts` - Background sync client
- `public/sw.js` - Service worker with sync handlers

#### Offline Caching
- Cache-first strategy for static assets
- Network-first for HTML pages
- Runtime caching for API responses
- Automatic cache versioning and cleanup

### 4. **Security & Authentication**

#### Email Verification
- SendGrid email delivery
- Secure token generation (24-hour expiry)
- Verification link with token validation
- Automated profile verification on confirmation

**Key Files:**
- `api/send-verification-email.ts` - Email verification endpoint

#### Phone OTP Verification
- Africa's Talking SMS integration
- 6-digit OTP codes (10-minute expiry)
- SMS delivery to Zimbabwe numbers
- Development mode exposes OTP for testing

**Key Files:**
- `api/send-phone-otp.ts` - SMS OTP endpoint

#### Password Reset
- Secure reset link generation
- 1-hour token expiry
- Email delivery via SendGrid
- Token-based password update

**Key Files:**
- `api/reset-password.ts` - Password reset endpoint

#### Two-Factor Authentication (2FA)
- TOTP-based 2FA (Google Authenticator compatible)
- QR code generation for easy setup
- 10 backup codes per user
- Time-based code verification with drift tolerance

**Key Files:**
- `src/services/twoFactorService.ts` - 2FA client service
- `api/enable-2fa.ts` - 2FA setup endpoint
- `api/verify-2fa.ts` - 2FA verification endpoint

### 5. **Monitoring & Analytics**

#### Error Tracking (Sentry)
- Automatic error capture and reporting
- Performance monitoring
- Session replay for debugging
- User context tracking
- Breadcrumb trail for error investigation

**Key Files:**
- `src/services/errorTracking.ts` - Sentry integration
- `src/main.tsx` - Initialization

#### Google Analytics 4
- Page view tracking
- Custom event tracking
- E-commerce tracking (purchases, listings)
- Core Web Vitals monitoring (LCP, FID, CLS)
- User behavior analytics

**Key Files:**
- `src/services/analytics.ts` - GA4 integration
- `src/main.tsx` - Initialization

### 6. **Admin Dashboard Enhancements**

#### Real-Time Statistics
- Total users, farmers, buyers, transporters
- Revenue and commission tracking
- Active listings and orders
- Escrow balance monitoring
- Dispute management stats

#### Analytics & Reporting
- Revenue analytics by date
- Top-selling products
- User growth trends
- Transaction history
- Performance charts

**Key Files:**
- `src/services/supabase/adminService.ts` - Admin service with RPC calls
- `src/components/Admin/RevenueChart.tsx` - Revenue visualization

### 7. **Wallet & Escrow System**

#### Wallet Functions
- User wallet balance tracking
- Transaction history
- Deposit via Stripe or mobile money
- Withdrawal processing
- Escrow hold for orders
- Automated escrow release on delivery

#### RPC Functions
- `transfer_funds()` - Internal wallet transfers
- `process_order_escrow()` - Hold buyer payment
- `release_order_escrow()` - Release to seller with commission deduction

**Key Files:**
- `src/services/supabase/walletService.ts` - Wallet operations
- `supabase/migrations/002_rpc_functions.sql` - Wallet RPC functions

### 8. **Search & Discovery**

#### Advanced Search
- Full-text search across listings
- Category and subcategory filters
- Price range filtering
- Location-based filtering
- Seller rating integration
- Featured listing priority

**RPC Function:**
- `search_listings()` - Optimized search with filters

### 9. **Notification System**

#### Notification Types
- Payment confirmations
- Order updates
- Message alerts
- Dispute notifications
- System announcements

#### Features
- User-specific notifications
- Read/unread status
- Category filtering
- Deep links to relevant pages
- Batch mark-as-read

**RPC Functions:**
- `create_notification()` - Create user notification
- `mark_all_notifications_read()` - Batch update

## 🚀 Performance Optimizations

### Code Splitting
- React.lazy for route-based splitting
- Vendor chunk separation (React, Router, Stripe, Supabase)
- Service chunk separation
- Reduced main bundle from 459KB to ~70KB

**Key Files:**
- `vite.config.ts` - Manual chunks configuration
- `src/App.tsx` - Lazy-loaded components

### Service Worker Optimization
- Precache essential assets
- Runtime caching with stale-while-revalidate
- Network-first for HTML
- Cache-first for static assets

### Database Optimization
- RPC functions for complex queries
- Indexed columns for fast lookups
- Materialized views (can be added)
- Connection pooling via Supabase

## 🔐 Security Features

### Row Level Security (RLS)
- Profile visibility control
- User-scoped wallet access
- Order buyer/seller restrictions
- Message sender/recipient policies
- Admin-only access to sensitive operations

### API Security
- Environment variable for secrets
- Webhook signature verification (Stripe)
- CORS configuration
- Rate limiting (can be added)
- Input validation and sanitization

### Authentication Security
- Secure password hashing (Supabase Auth)
- Token-based verification
- OTP expiry enforcement
- 2FA backup codes
- Session management

## 📊 Analytics Events

### User Events
- `sign_up` - User registration
- `login` - User login
- `search` - Marketplace search
- `view_listing` - Listing view
- `create_listing` - Listing creation
- `purchase` - Order placement
- `send_message` - Message sent
- `update_profile` - Profile edit

### Performance Metrics
- Largest Contentful Paint (LCP)
- First Input Delay (FID)
- Cumulative Layout Shift (CLS)
- Custom timing metrics

## 🌍 Localization Ready

### Currency
- USD primary currency
- Mobile money integration (ZWL)
- Multi-currency support ready

### Phone Numbers
- Zimbabwe format (+263)
- International format support
- SMS delivery via Africa's Talking

## 📱 Progressive Web App (PWA)

### Features
- Installable on mobile and desktop
- Offline functionality
- Push notifications
- Background sync
- App-like experience
- Splash screen
- App icons (192x192, 512x512)

**Key Files:**
- `public/manifest.json` - PWA manifest
- `public/sw.js` - Service worker
- `src/main.tsx` - Service worker registration

## 🧪 Testing Infrastructure

### Unit Tests
- Vitest test runner
- React Testing Library
- Supabase mocks
- Component tests
- Service tests

**Key Files:**
- `src/test/setup.ts` - Test configuration
- `src/test/mocks/supabase.ts` - Supabase mock client
- `src/test/utils.tsx` - Test utilities

## 📦 Deployment

### Supported Platforms
- Vercel (recommended)
- Netlify
- Any Node.js hosting

### Environment Variables Required
- Supabase (URL, keys)
- Stripe (publishable, secret, webhook)
- SendGrid (API key, from email)
- Africa's Talking (API key, username)
- Sentry (DSN)
- Google Analytics (Measurement ID)

**See:** `DEPLOYMENT.md` for complete setup guide

## 🔄 API Endpoints

### Payment APIs
- `POST /api/create-payment-intent` - Stripe payment
- `POST /api/stripe-webhook` - Stripe events
- `POST /api/mobile-money-webhook` - Mobile money events

### Authentication APIs
- `POST /api/send-verification-email` - Email verification
- `POST /api/send-phone-otp` - SMS OTP
- `POST /api/reset-password` - Password reset

### 2FA APIs
- `POST /api/enable-2fa` - Enable 2FA
- `POST /api/verify-2fa` - Verify TOTP code
- `POST /api/verify-2fa-setup` - Verify 2FA setup
- `POST /api/disable-2fa` - Disable 2FA
- `POST /api/verify-backup-code` - Verify backup code
- `POST /api/regenerate-backup-codes` - New backup codes

### Notification APIs
- `POST /api/subscribe-push` - Subscribe to push
- `POST /api/unsubscribe-push` - Unsubscribe from push

## 📈 Future Enhancements

### Planned Features
- [ ] Real-time messaging with WebSockets
- [ ] Video call support for consultations
- [ ] AI-powered crop disease detection
- [ ] Weather integration for farming
- [ ] Blockchain-based supply chain tracking
- [ ] Multi-language support (Shona, Ndebele)
- [ ] Advanced fraud detection
- [ ] Marketplace recommendations
- [ ] Farmer training modules
- [ ] Insurance integration

### Performance Improvements
- [ ] Redis caching layer
- [ ] CDN for media assets
- [ ] Image optimization pipeline
- [ ] Database query optimization
- [ ] GraphQL API option
- [ ] Server-side rendering (SSR)

## 📞 Support

For technical issues or questions:
- **Email:** support@makefarmhub.com
- **Phone:** +263 78 291 9633
- **Documentation:** See README.md and DEPLOYMENT.md
