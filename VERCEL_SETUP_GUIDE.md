# 🚀 Vercel Setup Guide - Connect Your Supabase Database

**Follow these steps EXACTLY** to connect your deployed app to Supabase.

---

## 📋 Your Credentials (Ready to Use)

I've extracted these from your Supabase project:

```
SUPABASE_URL: https://ruwetugllnjljjavbepikz.supabase.co

ANON_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1d2V0dWdsbmpsamF2YmVwaWt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NDI2NjYsImV4cCI6MjA5NDQxODY2Nn0.krV7nb4DPolTSp_hMCnzWleTO3qvls3fwYGEgtsrHvQ

SERVICE_ROLE_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1d2V0dWdsbmpsamF2YmVwaWt6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODg0MjY2NiwiZXhwIjoyMDk0NDE4NjY2fQ.6Udc1cXLslZmvxxgVSFrEg3lLoAcEur_f2IRIJz6les
```

---

## Step 1: Open Vercel Dashboard (30 seconds)

1. **Go to Vercel**
   - Visit: https://vercel.com/dashboard
   - Sign in if needed

2. **Find Your Project**
   - Look for **"makefarmhub"** (or whatever you named it)
   - Click on the project name

---

## Step 2: Open Environment Variables (30 seconds)

1. **Click Settings Tab**
   - At the top of your project page
   - Click **"Settings"**

2. **Open Environment Variables**
   - In the left sidebar
   - Click **"Environment Variables"**

---

## Step 3: Add Variables One by One (3 minutes)

You need to add **3 variables**. For each one:

### Variable 1: VITE_SUPABASE_URL

1. Click **"Add New"** button
2. Fill in:
   - **Name**: `VITE_SUPABASE_URL`
   - **Value**: `https://ruwetugllnjljjavbepikz.supabase.co`
   - **Environment**: Check ALL THREE boxes
     - ✅ Production
     - ✅ Preview
     - ✅ Development
3. Click **"Save"**

---

### Variable 2: VITE_SUPABASE_ANON_KEY

1. Click **"Add New"** button again
2. Fill in:
   - **Name**: `VITE_SUPABASE_ANON_KEY`
   - **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1d2V0dWdsbmpsamF2YmVwaWt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NDI2NjYsImV4cCI6MjA5NDQxODY2Nn0.krV7nb4DPolTSp_hMCnzWleTO3qvls3fwYGEgtsrHvQ`
   - **Environment**: Check ALL THREE boxes
     - ✅ Production
     - ✅ Preview
     - ✅ Development
3. Click **"Save"**

---

### Variable 3: SUPABASE_SERVICE_ROLE_KEY

1. Click **"Add New"** button again
2. Fill in:
   - **Name**: `SUPABASE_SERVICE_ROLE_KEY`
   - **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1d2V0dWdsbmpsamF2YmVwaWt6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODg0MjY2NiwiZXhwIjoyMDk0NDE4NjY2fQ.6Udc1cXLslZmvxxgVSFrEg3lLoAcEur_f2IRIJz6les`
   - **Environment**: Check ALL THREE boxes
     - ✅ Production
     - ✅ Preview
     - ✅ Development
3. Click **"Save"**

---

## ✅ Verify Variables Added

After adding all 3, you should see:

```
VITE_SUPABASE_URL                (Production, Preview, Development)
VITE_SUPABASE_ANON_KEY          (Production, Preview, Development)
SUPABASE_SERVICE_ROLE_KEY       (Production, Preview, Development)
```

---

## Step 4: Redeploy Your App (2 minutes)

**IMPORTANT**: Environment variables only apply to NEW deployments.

1. **Go to Deployments Tab**
   - Click **"Deployments"** at the top

2. **Find Latest Deployment**
   - Should be at the top of the list
   - Says "Production" or has a green checkmark

3. **Redeploy**
   - Click the **"⋯"** (three dots) on the right
   - Click **"Redeploy"**
   - ✅ Check **"Use existing Build Cache"** (faster)
   - Click **"Redeploy"**

4. **Wait**
   - Takes about 1-2 minutes
   - Status will change: Building → Ready ✅

---

## Step 5: Test Your App (1 minute)

1. **Open Your Live Site**
   - Once deployment is "Ready"
   - Click **"Visit"** button
   - Or go to: `https://your-app.vercel.app`

2. **Try Signing Up**
   - Click "Sign Up"
   - Enter test details:
     - Name: `Test User`
     - Email: `test@example.com`
     - Phone: `+263771234567`
     - Password: `TestPass123!`
     - Role: `Buyer`
   - Click "Create Account"

3. **Check if it Works**
   - If signup succeeds → ✅ **CONNECTED!**
   - If you get an error → See troubleshooting below

---

## ✅ Success Checklist

- [ ] Opened Vercel dashboard
- [ ] Found my project
- [ ] Added VITE_SUPABASE_URL to all environments
- [ ] Added VITE_SUPABASE_ANON_KEY to all environments
- [ ] Added SUPABASE_SERVICE_ROLE_KEY to all environments
- [ ] Redeployed the app
- [ ] Tested signup/login
- [ ] App is connected to Supabase! 🎉

---

## 🔧 Troubleshooting

### Problem: Don't see my project in Vercel

**Solution**: 
1. Make sure you're signed into the correct Vercel account
2. Check if you imported from GitHub
3. If not connected, go to: https://vercel.com/new
4. Import your GitHub repository

---

### Problem: Environment variables not showing up

**Solution**:
1. Make sure you clicked "Save" after adding each variable
2. Refresh the page
3. They should appear in the list

---

### Problem: App still shows errors after redeploy

**Solution**:
1. Wait for deployment to fully complete (green checkmark)
2. Hard refresh your browser: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
3. Check browser console for specific error (F12 → Console tab)
4. Verify all 3 environment variables are set correctly

---

### Problem: Signup doesn't work

**Solution**:
1. Check Vercel deployment logs:
   - Deployments → [Your Deployment] → Runtime Logs
2. Common issues:
   - Environment variables not set
   - Supabase URL incorrect
   - Database not set up (run the SQL file in Supabase)

---

## 📊 How to Check Logs

If something's wrong:

1. **Go to Deployments**
2. **Click on latest deployment**
3. **Click "Runtime Logs"**
4. Look for errors in red

Common errors you might see:
- `supabase is not defined` → Variables not set correctly
- `Invalid API key` → Wrong anon key or URL
- `Table doesn't exist` → Need to run SQL setup in Supabase

---

## 🎉 You're Done!

Once all steps are complete:

✅ Your Vercel app is connected to Supabase  
✅ Users can sign up and log in  
✅ Database is storing data  
✅ All performance optimizations are active  
✅ App is production-ready!  

---

## 📈 What to Do Next

1. **Test all features**:
   - Marketplace browsing
   - Creating listings
   - Placing orders
   - Messaging
   - Wallet transactions

2. **Add more API keys** (when ready):
   - Stripe (for payments)
   - SendGrid (for emails)
   - Africa's Talking (for SMS)

3. **Invite beta users** to test

4. **Monitor performance** in Vercel Analytics

---

## 🆘 Still Need Help?

If you're stuck:

1. Take a screenshot of the error
2. Check Vercel deployment logs
3. Check Supabase logs (Dashboard → Logs)
4. Verify all 3 variables are added with correct values

**You're almost there!** 🚀
