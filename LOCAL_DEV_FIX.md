# 🔧 Fix Localhost Blank Page

**Issue**: Localhost showing blank white page

---

## 🎯 Quick Fix Steps

### Step 1: Create .env File (CRITICAL)

Your app needs environment variables to connect to Supabase.

1. **Create a file called `.env`** in your project root
2. **Paste this content**:

```env
VITE_SUPABASE_URL=https://ruwetugllnjljjavbepikz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1d2V0dWdsbmpsamF2YmVwaWt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NDI2NjYsImV4cCI6MjA5NDQxODY2Nn0.krV7nb4DPolTSp_hMCnzWleTO3qvls3fwYGEgtsrHvQ
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1d2V0dWdsbmpsamF2YmVwaWt6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODg0MjY2NiwiZXhwIjoyMDk0NDE4NjY2fQ.6Udc1cXLslZmvxxgVSFrEg3lLoAcEur_f2IRIJz6les
```

3. **Save the file**

---

### Step 2: Stop and Restart Dev Server

1. **Stop the current server**:
   - Press `Ctrl + C` in the terminal

2. **Restart**:
   ```bash
   npm run dev
   ```

3. **Wait for**: "Local: http://localhost:5173"

4. **Open browser**: http://localhost:5173

---

### Step 3: Check Browser Console

If still blank:

1. **Open browser DevTools**: Press `F12`
2. **Go to Console tab**
3. **Look for red errors**

**Common errors**:
- `supabase is not defined` → .env file missing or not loaded
- `Failed to fetch` → Supabase connection issue
- `Cannot find module` → npm install needed

---

## 🔍 Detailed Troubleshooting

### Issue 1: .env File Not Recognized

**Try**: Create `.env.local` instead
```bash
# Copy .env to .env.local
cp .env .env.local
```

Or manually create `.env.local` with same content.

---

### Issue 2: Dependencies Not Installed

```bash
# Install all dependencies
npm install

# If that fails, try:
npm install --force

# Or clean install:
rm -rf node_modules package-lock.json
npm install
```

---

### Issue 3: Port Already in Use

If you see "Port 5173 is already in use":

```bash
# Stop the process using the port
# Windows:
netstat -ano | findstr :5173
# Note the PID number
taskkill /PID <PID_NUMBER> /F

# Then restart:
npm run dev
```

---

### Issue 4: Build Errors

Check terminal for errors when running `npm run dev`:

```bash
# Clear cache and restart
npm run dev -- --force

# Or:
rm -rf .vite
npm run dev
```

---

## ✅ Working Setup Checklist

- [ ] `.env` file exists in project root
- [ ] `.env` has all 3 Supabase variables
- [ ] `npm install` completed successfully
- [ ] `npm run dev` is running
- [ ] Browser shows "Local: http://localhost:5173" works
- [ ] No red errors in terminal
- [ ] No red errors in browser console (F12)

---

## 🚀 Expected Result

When working correctly:

1. **Terminal shows**:
   ```
   VITE v7.2.2  ready in XXX ms
   ➜  Local:   http://localhost:5173/
   ```

2. **Browser shows**: Your MakeFarmHub homepage

3. **Console (F12)**: No errors (maybe some warnings, that's ok)

---

## 📋 Quick Commands Reference

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Stop dev server
Ctrl + C

# Clear everything and start fresh
rm -rf node_modules .vite
npm install
npm run dev
```

---

## 🆘 Still Not Working?

**Do this**:

1. **Check terminal output** when you run `npm run dev`
2. **Check browser console** (F12 → Console tab)
3. **Copy the error message**
4. **Share it** - I'll give you exact fix

**Common fixes**:
- Missing .env → Create it with Supabase credentials
- Port in use → Kill process or use different port
- Dependencies missing → Run `npm install`
- Vite cache issue → Delete `.vite` folder

---

## 💡 Alternative: Use Different Port

If 5173 doesn't work:

```bash
# Use port 3000 instead
npm run dev -- --port 3000
```

Then open: http://localhost:3000

---

## 🎯 Next Steps After Fixing

Once localhost works:

1. ✅ Test signup/login locally
2. ✅ Verify Supabase connection
3. ✅ Then we'll fix Vercel deployment
4. ✅ Get your live site working

**One step at a time!** 🚀
