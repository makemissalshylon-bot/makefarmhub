-- Promote an existing authenticated user to platform admin.
-- Run in Supabase SQL Editor AFTER the user has signed up once.
--
-- 1. Sign up / log in on makefarmhub-eosin.vercel.app with your email
-- 2. Replace the email below with your real account email
-- 3. Run this script
-- 4. Log out and log back in (or hard refresh)
--
-- Production admin is profiles.role = 'admin' only.
-- Do not rely on VITE_ADMIN_PASSWORD (dev shortcut; not a production secret).

UPDATE profiles
SET role = 'admin',
    verified = true,
    updated_at = NOW()
WHERE email = 'makemissalshylon@gmail.com';

-- Verify (must use the same email as UPDATE)
SELECT id, name, email, role, verified
FROM profiles
WHERE email = 'makemissalshylon@gmail.com';
