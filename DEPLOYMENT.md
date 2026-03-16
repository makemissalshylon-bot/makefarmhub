# MAKEFARMHUB Deployment Guide

## Prerequisites

- Node.js 18+ installed
- Supabase account
- Vercel account (recommended) or Netlify
- Stripe account (for payments)
- SendGrid account (for emails)
- Africa's Talking account (for SMS, optional)
- Sentry account (for error tracking, optional)

## Step 1: Supabase Setup

### 1.1 Create Supabase Project
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project
3. Save your project URL and API keys

### 1.2 Run Database Migrations
```bash
cd supabase
psql -h db.your-project.supabase.co -U postgres -d postgres -f migrations/001_initial_schema.sql
psql -h db.your-project.supabase.co -U postgres -d postgres -f migrations/002_rpc_functions.sql
```

Or use Supabase CLI:
```bash
supabase link --project-ref your-project-ref
supabase db push
```

### 1.3 Seed Database (Optional)
```bash
psql -h db.your-project.supabase.co -U postgres -d postgres -f seed.sql
```

### 1.4 Configure Authentication
In Supabase Dashboard:
- Go to Authentication → Providers
- Enable Email and Phone providers
- Configure email templates
- Set up redirect URLs

## Step 2: Stripe Setup

### 2.1 Create Stripe Account
1. Sign up at [Stripe Dashboard](https://dashboard.stripe.com)
2. Get your API keys (Publishable and Secret)

### 2.2 Configure Webhooks
1. Go to Developers → Webhooks
2. Add endpoint: `https://your-app.vercel.app/api/stripe-webhook`
3. Listen for events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
4. Save the webhook signing secret

## Step 3: Email Service Setup (SendGrid)

1. Create account at [SendGrid](https://sendgrid.com)
2. Verify sender email address
3. Create API key with "Mail Send" permission
4. Save API key and verified email

## Step 4: SMS Service Setup (Africa's Talking)

1. Create account at [Africa's Talking](https://africastalking.com)
2. Get API key from settings
3. Save username (use 'sandbox' for testing)

## Step 5: Error Tracking Setup (Sentry)

1. Create project at [Sentry](https://sentry.io)
2. Get DSN from project settings
3. Enable Performance Monitoring and Session Replay

## Step 6: Google Analytics Setup

1. Create GA4 property at [Google Analytics](https://analytics.google.com)
2. Get Measurement ID (format: G-XXXXXXXXXX)

## Step 7: Environment Variables

Create `.env` file in project root:

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_key
STRIPE_SECRET_KEY=sk_live_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret

# SendGrid
SENDGRID_API_KEY=SG.your_key
SENDGRID_FROM_EMAIL=noreply@makefarmhub.com
SENDGRID_FROM_NAME=MAKEFARMHUB

# Africa's Talking (Optional)
AFRICASTALKING_API_KEY=your_key
AFRICASTALKING_USERNAME=your_username

# Sentry
VITE_SENTRY_DSN=https://your_dsn@sentry.io/project_id

# Google Analytics
VITE_GA_ID=G-XXXXXXXXXX

# App URL
VITE_APP_URL=https://makefarmhub.vercel.app
```

## Step 8: Deploy to Vercel

### 8.1 Install Vercel CLI
```bash
npm install -g vercel
```

### 8.2 Deploy
```bash
# Install dependencies
npm install

# Build project
npm run build

# Deploy to Vercel
vercel --prod
```

### 8.3 Configure Environment Variables
In Vercel Dashboard:
1. Go to Settings → Environment Variables
2. Add all environment variables from `.env`
3. Mark sensitive keys (SECRET, API_KEY) as "Production" only

### 8.4 Configure Domains (Optional)
1. Go to Settings → Domains
2. Add custom domain (e.g., makefarmhub.com)
3. Update DNS records as instructed

## Step 9: Post-Deployment

### 9.1 Test Core Features
- [ ] User signup/login
- [ ] Email verification
- [ ] Phone OTP
- [ ] Create listing
- [ ] Place order
- [ ] Stripe payment
- [ ] Mobile money payment
- [ ] Messaging
- [ ] Admin dashboard

### 9.2 Configure Webhooks
Update webhook URLs in:
- Stripe Dashboard
- Mobile money provider dashboards

### 9.3 Enable Production Mode
- Switch Stripe from test to live keys
- Update Africa's Talking from sandbox to production
- Verify Sentry is receiving events
- Check Google Analytics is tracking

### 9.4 Monitor
- Check Vercel logs
- Monitor Sentry for errors
- Review Google Analytics data
- Test payment flows end-to-end

## Troubleshooting

### Database Issues
- Verify Supabase connection
- Check RLS policies are enabled
- Ensure migrations ran successfully

### Payment Issues
- Verify Stripe webhook is receiving events
- Check webhook signing secret matches
- Test with Stripe test cards

### Email/SMS Not Sending
- Verify API keys are correct
- Check sender email is verified (SendGrid)
- Ensure phone numbers are in correct format

### Build Errors
```bash
# Clear cache and rebuild
rm -rf node_modules dist .vite
npm install
npm run build
```

## Security Checklist

- [ ] All secret keys are in environment variables (not code)
- [ ] SUPABASE_SERVICE_ROLE_KEY is server-side only
- [ ] RLS policies are enabled on all tables
- [ ] Stripe webhooks verify signatures
- [ ] CORS is configured properly
- [ ] Rate limiting is enabled on API endpoints
- [ ] Input validation on all forms
- [ ] SQL injection prevention (use parameterized queries)
- [ ] XSS protection enabled

## Maintenance

### Regular Tasks
- Monitor error logs in Sentry
- Review analytics in Google Analytics
- Check Supabase database usage
- Update dependencies monthly
- Backup database weekly

### Scaling Considerations
- Enable Supabase database read replicas
- Add CDN for static assets
- Implement Redis for caching
- Set up load balancing
- Enable auto-scaling on Vercel

## Support

For issues, contact:
- Email: support@makefarmhub.com
- Phone: +263 78 291 9633
