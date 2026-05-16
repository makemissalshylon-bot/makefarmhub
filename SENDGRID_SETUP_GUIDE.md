# 📧 SendGrid Email Setup Guide

## Overview
SendGrid will handle all production emails:
- ✅ Signup verification codes
- ✅ Order confirmations
- ✅ Payment receipts
- ✅ Notifications

---

## Step 1: Create SendGrid Account

1. Go to: **https://signup.sendgrid.com/**
2. Sign up for **Free Plan** (100 emails/day free forever)
3. Verify your email address

---

## Step 2: Create API Key

1. Go to: **https://app.sendgrid.com/settings/api_keys**
2. Click **"Create API Key"**
3. Name: `MakeFarmHub Production`
4. Permissions: **"Full Access"**
5. Click **"Create & View"**
6. **Copy the API key** (starts with `SG.`)
   - ⚠️ You can only see this once!

---

## Step 3: Verify Sender Email

SendGrid requires a verified sender email.

### Option A: Single Sender (Quick - 5 min)
1. Go to: **https://app.sendgrid.com/settings/sender_auth/senders**
2. Click **"Create New Sender"**
3. Fill in:
   - **From Name:** `MakeFarmHub`
   - **From Email:** Your email (e.g., `noreply@yourdomain.com` or `your@gmail.com`)
   - **Reply To:** Same as above
   - **Address, City, Country:** Your details
4. Click **"Create"**
5. **Check your email** → Click verification link
6. ✅ Sender verified!

### Option B: Domain Authentication (Advanced - requires DNS)
- Only if you own a custom domain
- See: https://docs.sendgrid.com/ui/account-and-settings/how-to-set-up-domain-authentication

---

## Step 4: Add to Vercel Environment Variables

1. Go to: **https://vercel.com/zimprep-dev/makefarmhub/settings/environment-variables**
2. Add these variables:

### Variable 1:
- **Name:** `SENDGRID_API_KEY`
- **Value:** `SG.your_api_key_here` (paste the key from Step 2)
- **Environments:** ✅ Production, ✅ Preview, ✅ Development

### Variable 2:
- **Name:** `SENDGRID_FROM_EMAIL`
- **Value:** `noreply@yourdomain.com` (the verified email from Step 3)
- **Environments:** ✅ Production, ✅ Preview, ✅ Development

### Variable 3:
- **Name:** `SENDGRID_FROM_NAME`
- **Value:** `MakeFarmHub`
- **Environments:** ✅ Production, ✅ Preview, ✅ Development

3. Click **"Save"**

---

## Step 5: Redeploy

After adding env vars:
1. Go to: **https://vercel.com/zimprep-dev/makefarmhub**
2. Click latest deployment → **"Redeploy"**
3. Wait 2-3 minutes

---

## Step 6: Test Email Sending

1. Go to your signup page
2. Try creating an account
3. **Should now receive a real email** with verification code! ✅

Check SendGrid dashboard for email activity:
- https://app.sendgrid.com/email_activity

---

## 🎯 What Changes After Setup

**Before (Dev Mode):**
- Code shown on screen in yellow box
- No actual email sent

**After (Production):**
- Real email sent to user's inbox
- Professional looking email with MakeFarmHub branding
- Reliable delivery

---

## 📊 SendGrid Free Tier Limits

- **100 emails/day** free forever
- **40,000 emails first month** (trial boost)
- Upgrade when you need more

---

## ⚠️ Important Notes

1. **Keep API key secret** - Never commit to GitHub
2. **Verify sender email** - Emails won't send without this
3. **Check spam folder** - First emails might go to spam
4. **Monitor usage** - Watch your daily limit

---

## 🚀 Ready to Set Up?

Follow Steps 1-6 above. Takes ~15 minutes total.

Let me know when you've:
1. ✅ Created SendGrid account
2. ✅ Got your API key
3. ✅ Verified sender email
4. ✅ Added to Vercel env vars

Then we'll test it! 📧
