# Vercel Environment Variables Setup

## Required Variables

Add these in Vercel Dashboard → Settings → Environment Variables:

### 1. Frontend Variables (VITE prefix required)
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. Backend Variables (API routes)
```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Optional API Keys
```
RESEND_API_KEY=re_xxxxx
AFRICASTALKING_API_KEY=xxxxx
AFRICASTALKING_USERNAME=sandbox
```

## Important Notes

- All variables must be added to: Production, Preview, AND Development
- After adding variables, MUST redeploy WITHOUT build cache
- VITE_ prefix makes variables available to browser
- Service role key is backend-only (never exposed)

## Verification

After deployment, check browser console:
- Should NOT see: "Supabase credentials not configured"
- Should NOT see: "Invalid supabaseUrl"
- Should see: Supabase client initialized successfully
