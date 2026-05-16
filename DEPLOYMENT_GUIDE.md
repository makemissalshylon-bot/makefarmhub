# MakeFarmHub Deployment Guide

This guide walks you through setting up the complete MakeFarmHub application from scratch.

## 🔴 Critical Prerequisites

Before deploying, you need:
- A Supabase account (https://supabase.com)
- A Vercel account (https://vercel.com)
- Git repository access (GitHub)

---

## Step 1: Create Supabase Project

### 1.1 Create New Project
1. Go to https://supabase.com/dashboard
2. Click **"New Project"**
3. Fill in:
   - **Name**: `makefarmhub` (or your preference)
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users (e.g., `af-south-1` for Africa)
4. Click **"Create new project"** (takes 1-2 minutes)

### 1.2 Get API Credentials
1. In your project dashboard, go to **Settings** → **API**
2. Copy these values (you'll need them for Vercel):
   ```
   Project URL: https://xxxxxxxxxxxxx.supabase.co
   anon/public key: eyJhbGc...
   service_role key: eyJhbGc... (⚠️ Keep secret!)
   ```

---

## Step 2: Set Up Database Schema

### 2.1 Run Main Schema
1. In Supabase dashboard, go to **SQL Editor**
2. Click **"New query"**
3. Copy the entire contents of `supabase/schema.sql`
4. Paste into the editor
5. Click **"Run"** (bottom right)
6. ✅ Should see: "Success. No rows returned"

### 2.2 Run RPC Functions
1. Create a **new query** in SQL Editor
2. Copy the entire contents of `supabase/migrations/002_rpc_functions.sql`
3. Paste and click **"Run"**
4. ✅ Should see: "Success. No rows returned"

### 2.3 (Optional) Load Seed Data
1. Create a **new query** in SQL Editor
2. Copy the entire contents of `supabase/seed.sql`
3. Paste and click **"Run"**
4. ✅ Should see: "Success. No rows returned"

---

## Step 3: Create Storage Buckets

### 3.1 Create Buckets
1. In Supabase dashboard, go to **Storage**
2. Click **"Create a new bucket"**
3. Create these buckets (set all as **Public**):
   - `listing-images`
   - `avatars`
   - `review-images`

### 3.2 Configure Bucket Policies
The schema already created the storage policies, but verify:
1. Click each bucket → **Policies** tab
2. Should see:
   - ✅ "Public access for SELECT"
   - ✅ "Authenticated users can upload to own folder"

---

## Step 4: Configure Authentication

### 4.1 Enable Email Auth
1. Go to **Authentication** → **Providers**
2. Enable **Email** (should be on by default)
3. Under **Email Templates**:
   - Customize "Confirm signup" and "Magic Link" templates if desired
   - Set **Site URL** to `https://makefarmhub.vercel.app`

### 4.2 Enable Phone Auth (Optional - for SMS OTP)
1. Still in **Authentication** → **Providers**
2. Enable **Phone**
3. Choose provider:
   - **Recommended**: Twilio or Africa's Talking
   - For Africa's Talking:
     - Get API key from https://account.africastalking.com/
     - Add `AFRICASTALKING_API_KEY` and `AFRICASTALKING_USERNAME` to Vercel env vars

### 4.3 Configure Redirect URLs
1. Go to **Authentication** → **URL Configuration**
2. Add these **Redirect URLs**:
   ```
   https://makefarmhub.vercel.app
   https://makefarmhub.vercel.app/**
   http://localhost:5173
   http://localhost:5173/**
   ```

---

## Step 5: Deploy to Vercel

### 5.1 Connect Repository
1. Go to https://vercel.com/dashboard
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository (`zimprep-dev/makefarmhub`)
4. Click **"Import"**

### 5.2 Configure Environment Variables
In the Vercel project settings, add these **Environment Variables**:

#### Required (App Won't Work Without These)
```bash
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
VITE_ADMIN_EMAIL=missal@makefarmhub.com
VITE_ADMIN_PASSWORD=your_secure_admin_password
```

#### Backend Only (Server-side secrets)
```bash
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... (service_role key)
```

#### Optional (Add as needed)
```bash
# Analytics
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Weather widget
VITE_OPENWEATHER_API_KEY=your_key_here

# Payment gateways (add when ready)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
ECOCASH_API_KEY=...
ONEMONEY_API_KEY=...

# SMS (for phone OTP)
AFRICASTALKING_API_KEY=...
AFRICASTALKING_USERNAME=sandbox
```

### 5.3 Deploy
1. Click **"Deploy"**
2. Wait 2-3 minutes for build to complete
3. ✅ Your app is live at `https://makefarmhub.vercel.app`

---

## Step 6: Verify Everything Works

### 6.1 Test Authentication
1. Go to your deployed app
2. Click **"Sign Up"**
3. Create a test account:
   - Enter name, email, phone, password
   - Select role (e.g., "Farmer")
4. Check your email for confirmation link
5. ✅ Should be able to log in

### 6.2 Test Database Connection
1. Log in to your test account
2. Go to **Dashboard**
3. You should see:
   - ✅ Wallet balance ($0.00)
   - ✅ No errors in browser console (F12)

### 6.3 Test Core Features
- **Create a listing** (if farmer account)
- **Browse marketplace** (all users)
- **View profile** (all users)
- **Check wallet** (all users)

---

## Step 7: Enable Realtime Features

### 7.1 Configure Realtime
1. In Supabase dashboard, go to **Database** → **Replication**
2. Enable replication for these tables:
   - `messages`
   - `notifications`
   - `orders`
   - `conversations`
3. Click **"Save"**

The schema already added these tables to `supabase_realtime` publication via:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
```

---

## Step 8: Enable Real Payment & Notification Services

### 8.1 Stripe (Credit/Debit Cards) ✅ READY
**Status**: Fully implemented in `api/create-payment-intent.ts`, `api/confirm-payment.ts`, `api/stripe-webhook.ts`

1. Create account at https://stripe.com
2. Get API keys from https://dashboard.stripe.com/apikeys
3. Add to Vercel env vars:
   ```bash
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51xxxxx
   STRIPE_SECRET_KEY=sk_test_51xxxxx
   STRIPE_WEBHOOK_SECRET=whsec_xxxxx
   ```
4. Set up webhook in Stripe Dashboard:
   - URL: `https://makefarmhub.vercel.app/api/stripe-webhook`
   - Events to listen for:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `charge.refunded`

**Test it**:
```bash
# Use Stripe test card: 4242 4242 4242 4242
# Any future expiry, any CVC, any ZIP
```

### 8.2 SendGrid (Email Notifications) ✅ READY
**Status**: Fully implemented in `api/send-email.ts` with templates for orders, payments, delivery, messages

1. Create account at https://sendgrid.com
2. Get API key from https://app.sendgrid.com/settings/api_keys
3. Verify sender email in SendGrid dashboard
4. Add to Vercel env vars:
   ```bash
   SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
   SENDGRID_FROM_EMAIL=noreply@makefarmhub.com
   SENDGRID_FROM_NAME=MakeFarmHub
   ```

**Templates included**:
- Order confirmation emails
- Payment receipt emails
- Delivery update notifications
- New message notifications

### 8.3 Mobile Money (EcoCash, OneMoney, InnBucks, Telecash) ✅ READY
**Status**: Fully implemented in `api/mobile-money-initiate.ts`, `api/mobile-money-status.ts`, `api/mobile-money-verify.ts`, `api/mobile-money-webhook.ts`

**Providers supported**:
1. **EcoCash** (Econet)
   ```bash
   ECOCASH_API_KEY=your_ecocash_api_key
   ```
   API: https://api.ecocash.co.zw/v1/payments

2. **OneMoney** (NetOne)
   ```bash
   ONEMONEY_API_KEY=your_onemoney_api_key
   ```
   API: https://api.onemoney.co.zw/v1/transactions

3. **InnBucks** (Multi-network)
   ```bash
   INNBUCKS_API_KEY=your_innbucks_api_key
   ```
   API: https://api.innbucks.co.zw/api/v1/payment

4. **Telecash** (Telecel)
   ```bash
   TELECASH_API_KEY=your_telecash_api_key
   ```
   API: https://api.telecash.co.zw/v1/payment/request

**How it works**:
1. User selects provider (EcoCash, OneMoney, etc.)
2. App calls `/api/mobile-money-initiate` → sends push notification to user's phone
3. User approves payment on their phone (dial *151# for EcoCash, etc.)
4. App polls `/api/mobile-money-status` until payment confirmed
5. Webhook `/api/mobile-money-webhook` receives final confirmation

**Demo mode**: If API keys not set, returns mock "pending" status (for testing UI flow)

### 8.4 Africa's Talking (SMS OTP) ✅ READY
**Status**: Fully implemented in `api/send-phone-otp.ts` for phone verification

1. Create account at https://africastalking.com
2. Get API key from https://account.africastalking.com/apps/sandbox/settings/key
3. Add to Vercel env vars:
   ```bash
   AFRICASTALKING_API_KEY=atsk_xxxxxxxxxxxxx
   AFRICASTALKING_USERNAME=sandbox  # or your production username
   ```

**What it does**:
- Sends 6-digit OTP codes via SMS for phone verification
- Used during signup and 2FA
- Auto-expires after 10 minutes

**Test mode**: If not configured, OTP is logged to console (check Vercel function logs)

---

## 🚨 Troubleshooting

### "Supabase is not configured" Warning
- Check browser console (F12) for exact error
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set in Vercel
- Redeploy after adding env vars

### Auth Errors ("Invalid credentials")
- Check **Authentication** → **Providers** in Supabase (Email enabled?)
- Verify redirect URLs include your Vercel domain
- Check browser console for CORS errors

### Database Errors ("relation does not exist")
- Run `supabase/schema.sql` in SQL Editor
- Check **Table Editor** to verify tables were created
- Verify RLS policies are enabled (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`)

### Storage Upload Fails
- Verify buckets exist and are **Public**
- Check bucket names match code:
  - `listing-images` (not `listings`)
  - `avatars`
  - `review-images`

### Admin Login Not Working
- Verify `VITE_ADMIN_EMAIL` and `VITE_ADMIN_PASSWORD` are set
- Admin account must exist in Supabase Auth with matching email
- Role in `profiles` table must be `'admin'`

---

## 📊 Monitoring & Maintenance

### Check Application Health
1. **Supabase Dashboard** → **Logs** → Filter by errors
2. **Vercel Dashboard** → **Deployments** → View function logs
3. **Browser Console** (F12) → Check for JS errors

### Database Backup
1. **Supabase** → **Database** → **Backups**
2. Enable **Point-in-time Recovery** (paid plan)
3. Or manually export via **SQL Editor**:
   ```sql
   -- Export data
   SELECT * FROM profiles;
   SELECT * FROM listings;
   -- etc.
   ```

### Performance Monitoring
- Add Sentry for error tracking
- Use Vercel Analytics (built-in)
- Monitor Supabase usage (Database → Usage)

---

## ✅ Deployment Checklist

- [ ] Supabase project created
- [ ] Database schema applied (`schema.sql`)
- [ ] RPC functions added (`002_rpc_functions.sql`)
- [ ] Storage buckets created (`listing-images`, `avatars`, `review-images`)
- [ ] Authentication configured (Email + optional Phone)
- [ ] Vercel project deployed
- [ ] Environment variables set (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, admin credentials)
- [ ] Test user account created and verified
- [ ] Core features tested (signup, login, dashboard, marketplace)
- [ ] Realtime enabled for messages/notifications
- [ ] (Optional) Payment gateways configured
- [ ] (Optional) SMS provider configured

---

## 🎯 Next Steps

Once deployed, consider:
1. **Custom domain** → Vercel → Settings → Domains
2. **SSL certificate** → Auto-provisioned by Vercel
3. **Email templates** → Supabase → Authentication → Email Templates
4. **Monitoring** → Add Sentry DSN to `VITE_SENTRY_DSN`
5. **Analytics** → Add Google Analytics ID to `VITE_GA_MEASUREMENT_ID`
6. **Production API keys** → Replace all `test_` / `sandbox` keys with live credentials

---

## 🆘 Need Help?

- **Supabase Docs**: https://supabase.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **Project Issues**: https://github.com/zimprep-dev/makefarmhub/issues
