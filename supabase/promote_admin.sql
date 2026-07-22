-- Promote an existing authenticated user to platform admin.
-- Run in Supabase SQL Editor AFTER the user has signed up once.
--
-- 1. Sign up / log in on makefarmhub.vercel.app with your email
-- 2. Replace the email below
-- 3. Run this script
-- 4. Log out and log back in (or hard refresh)

UPDATE profiles
SET role = 'admin',
    verified = true,
    updated_at = NOW()
WHERE email = 'YOUR_EMAIL@example.com';

-- Verify
SELECT id, name, email, role, verified
FROM profiles
WHERE email = 'YOUR_EMAIL@example.com';
