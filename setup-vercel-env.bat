@echo off
echo Setting up Vercel environment variables...

vercel env add DATABASE_URL production
echo postgresql://postgres.nuqwylqbxlayrskvadwm:Ahmad2255464@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres

vercel env add SUPABASE_DATABASE_URL production  
echo postgresql://postgres.nuqwylqbxlayrskvadwm:Ahmad2255464@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres

vercel env add SUPABASE_URL production
echo https://nuqwylqbxlayrskvadwm.supabase.co

vercel env add SUPABASE_ANON_KEY production
echo eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51cXd5bHFieGxheXJza3ZhZHdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NDc4NjcsImV4cCI6MjA3MDMxOTg2N30.idrUVnsACqH7Z2PIWf0R4ix1YknzRyRARjShWtJTUVs

vercel env add SESSION_SECRET production
echo labdesk_super_secret_key_2024

vercel env add NODE_ENV production
echo production

vercel env add COOKIE_SECURE production
echo true

echo Environment variables setup complete!
pause
