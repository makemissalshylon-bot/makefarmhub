# 💳 Stripe Payment Integration Guide

## Overview
Stripe will handle card payments for:
- ✅ Product purchases
- ✅ Order payments
- ✅ Secure checkout
- ✅ Automatic payouts to farmers

---

## Step 1: Create Stripe Account

1. Go to: **https://dashboard.stripe.com/register**
2. Sign up with your email
3. Complete business verification
4. **Country:** Zimbabwe (if available) or use another supported country

---

## Step 2: Get API Keys

### Test Mode Keys (For Development)
1. Go to: **https://dashboard.stripe.com/test/apikeys**
2. You'll see:
   - **Publishable key:** `pk_test_...` (safe for frontend)
   - **Secret key:** `sk_test_...` (⚠️ keep secret!)
3. Copy both keys

### Live Mode Keys (For Production - Later)
1. Complete Stripe account verification first
2. Then get from: **https://dashboard.stripe.com/apikeys**

---

## Step 3: Add to Environment Variables

### Local Development (.env file)
Add these to your `.env` file:

```env
# Stripe Test Keys
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
```

### Vercel Production
1. Go to: **https://vercel.com/zimprep-dev/makefarmhub/settings/environment-variables**
2. Add:

**Variable 1:**
- Name: `VITE_STRIPE_PUBLISHABLE_KEY`
- Value: `pk_test_...`
- Environments: ✅ All

**Variable 2:**
- Name: `STRIPE_SECRET_KEY`
- Value: `sk_test_...`
- Environments: ✅ Production, ✅ Preview

---

## Step 4: Test Cards

Use these test cards in Test Mode:

**Success:**
- Card: `4242 4242 4242 4242`
- Expiry: Any future date (e.g., 12/34)
- CVC: Any 3 digits (e.g., 123)

**Declined:**
- Card: `4000 0000 0000 0002`

**Requires 3D Secure:**
- Card: `4000 0027 6000 3184`

More test cards: https://stripe.com/docs/testing

---

## Step 5: Webhook Setup (For Order Updates)

1. Go to: **https://dashboard.stripe.com/test/webhooks**
2. Click **"Add endpoint"**
3. Endpoint URL: `https://makefarmhub.vercel.app/api/stripe-webhook`
4. Select events:
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`
   - ✅ `charge.refunded`
5. Click **"Add endpoint"**
6. Copy **Signing Secret** (starts with `whsec_`)

Add to Vercel:
- Name: `STRIPE_WEBHOOK_SECRET`
- Value: `whsec_...`

---

## Step 6: Enable Payment Methods

1. Go to: **https://dashboard.stripe.com/settings/payment_methods**
2. Enable:
   - ✅ Cards (Visa, Mastercard, etc.)
   - ✅ Mobile wallets (Apple Pay, Google Pay)

---

## 🎯 What Users Will See

**Checkout Flow:**
1. Select product → Add to cart
2. Click "Checkout"
3. Enter card details (secure Stripe form)
4. Click "Pay"
5. Order confirmed! 🎉

**For Farmers:**
- Get paid automatically to their bank account
- Stripe handles all money transfers
- Dashboard shows earnings

---

## 💰 Pricing

**Test Mode:** Free forever

**Live Mode:**
- **2.9% + $0.30** per successful card charge
- **No monthly fees**
- **No setup fees**

For Zimbabwe: May need to use Stripe Atlas or supported country

---

## 🚀 Ready for Production?

**Before going live:**
1. ✅ Complete business verification
2. ✅ Add bank account for payouts
3. ✅ Switch to Live API keys
4. ✅ Test thoroughly with test cards

---

## ✅ Next Steps

I'll implement the Stripe checkout flow in your app. You just need to:
1. Create Stripe account
2. Get test API keys
3. Add to Vercel env vars

**Let me know when you have the keys ready!** 💳
