# 📱 Africa's Talking SMS Setup Guide

## Overview
SMS verification for:
- ✅ Phone number verification
- ✅ OTP codes via SMS
- ✅ Order notifications
- ✅ Payment confirmations

---

## Step 1: Create Account

1. Go to: **https://account.africastalking.com/auth/register**
2. Sign up (Free account)
3. Verify your email

---

## Step 2: Get Sandbox Credentials (Testing)

**Sandbox = Free testing environment**

1. Login to: **https://account.africastalking.com/**
2. Go to: **"Sandbox App"**
3. Copy these:
   - **Username:** `sandbox`
   - **API Key:** Click "Generate" under SMS

**Sandbox Features:**
- Send test SMS for free
- Numbers must be added to simulator first
- Perfect for development

---

## Step 3: Test in Sandbox

1. Go to: **https://account.africastalking.com/apps/sandbox/simulator**
2. Add test phone numbers:
   - Format: `+263771234567` (Zimbabwe)
   - Click "Add Phone Number"
3. Send test SMS from simulator to verify setup

---

## Step 4: Production Setup (After Testing)

**To send real SMS:**

1. Create **Live App**:
   - Go to: Apps → Create App
   - Name: `MakeFarmHub`
   - Click "Create"

2. **Add Credits:**
   - Go to: Billing → Buy Airtime
   - Minimum: $10 USD
   - SMS costs: ~$0.02-0.05 per SMS

3. **Get Live Credentials:**
   - Username: Your app name (e.g., `MakeFarmHub`)
   - API Key: Generate under your app settings

---

## Step 5: Add to Environment Variables

### For Sandbox (Development)

Add to `.env`:
```env
AFRICASTALKING_USERNAME=sandbox
AFRICASTALKING_API_KEY=your_sandbox_api_key_here
```

Add to Vercel (Development/Preview only):
- Name: `AFRICASTALKING_USERNAME`
- Value: `sandbox`
- Environments: ✅ Development, ✅ Preview

- Name: `AFRICASTALKING_API_KEY`
- Value: `your_sandbox_key`
- Environments: ✅ Development, ✅ Preview

### For Production (Real SMS)

Add to Vercel (Production only):
- Name: `AFRICASTALKING_USERNAME`
- Value: `MakeFarmHub` (your app name)
- Environments: ✅ Production

- Name: `AFRICASTALKING_API_KEY`
- Value: `your_live_api_key`
- Environments: ✅ Production

---

## Step 6: Supported Countries

Africa's Talking supports:
- 🇿🇼 **Zimbabwe** ✅
- 🇰🇪 Kenya
- 🇺🇬 Uganda
- 🇹🇿 Tanzania
- 🇳🇬 Nigeria
- 🇿🇦 South Africa
- And more...

---

## 🎯 SMS Flow

**User Signup:**
1. User enters phone number
2. Click "Send Code"
3. **Receives SMS:** "Your MakeFarmHub code is: 123456"
4. Enter code
5. Account verified! ✅

**SMS Content Example:**
```
MakeFarmHub OTP: 123456
Valid for 10 minutes. Do not share.
```

---

## 💰 Pricing

**Sandbox:** Free (testing only)

**Production SMS Costs:**
- Zimbabwe: ~$0.03 per SMS
- Kenya: ~$0.02 per SMS
- Other countries: $0.02-0.05 per SMS

**Minimum Top-up:** $10 USD (sends ~300-500 SMS)

---

## 📊 Your Current Code

**Already implemented:**
- ✅ SMS sending logic in `api/send-otp.ts`
- ✅ Phone number formatting (Zimbabwe +263)
- ✅ Fallback if SMS fails
- ✅ OTP generation and validation

**Just needs:**
- Africa's Talking credentials in environment variables

---

## ✅ Setup Checklist

**For Testing (Now):**
1. ✅ Create Africa's Talking account
2. ✅ Get sandbox API key
3. ✅ Add to Vercel (Development env)
4. ✅ Add test phone to simulator
5. ✅ Test signup with phone number

**For Production (Later):**
1. ⏳ Create live app
2. ⏳ Add $10+ credits
3. ⏳ Get live API key
4. ⏳ Add to Vercel (Production env)
5. ⏳ Test with real phone numbers

---

## 🚀 Next Steps

1. Sign up at Africa's Talking
2. Get sandbox credentials
3. Share API key with me
4. I'll add to environment variables
5. Test SMS sending!

**Ready to set this up?** 📱
