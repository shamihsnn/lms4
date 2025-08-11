# PowerShell script to set Vercel environment variables
Write-Host "Setting Vercel environment variables..." -ForegroundColor Green

# Set DATABASE_URL
Write-Host "Setting DATABASE_URL..." -ForegroundColor Yellow
$env:VERCEL_ENV_VALUE = "postgresql://postgres.nuqwylqbxlayrskvadwm:Ahmad2255464@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"
vercel env add DATABASE_URL production --value $env:VERCEL_ENV_VALUE

# Set SUPABASE_DATABASE_URL
Write-Host "Setting SUPABASE_DATABASE_URL..." -ForegroundColor Yellow
$env:VERCEL_ENV_VALUE = "postgresql://postgres.nuqwylqbxlayrskvadwm:Ahmad2255464@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"
vercel env add SUPABASE_DATABASE_URL production --value $env:VERCEL_ENV_VALUE

# Set SUPABASE_URL
Write-Host "Setting SUPABASE_URL..." -ForegroundColor Yellow
$env:VERCEL_ENV_VALUE = "https://nuqwylqbxlayrskvadwm.supabase.co"
vercel env add SUPABASE_URL production --value $env:VERCEL_ENV_VALUE

# Set SUPABASE_ANON_KEY
Write-Host "Setting SUPABASE_ANON_KEY..." -ForegroundColor Yellow
$env:VERCEL_ENV_VALUE = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51cXd5bHFieGxheXJza3ZhZHdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NDc4NjcsImV4cCI6MjA3MDMxOTg2N30.idrUVnsACqH7Z2PIWf0R4ix1YknzRyRARjShWtJTUVs"
vercel env add SUPABASE_ANON_KEY production --value $env:VERCEL_ENV_VALUE

# Set SESSION_SECRET
Write-Host "Setting SESSION_SECRET..." -ForegroundColor Yellow
$env:VERCEL_ENV_VALUE = "labdesk_super_secret_key_2024"
vercel env add SESSION_SECRET production --value $env:VERCEL_ENV_VALUE

# Set NODE_ENV
Write-Host "Setting NODE_ENV..." -ForegroundColor Yellow
$env:VERCEL_ENV_VALUE = "production"
vercel env add NODE_ENV production --value $env:VERCEL_ENV_VALUE

# Set COOKIE_SECURE
Write-Host "Setting COOKIE_SECURE..." -ForegroundColor Yellow
$env:VERCEL_ENV_VALUE = "true"
vercel env add COOKIE_SECURE production --value $env:VERCEL_ENV_VALUE

Write-Host "All environment variables have been set!" -ForegroundColor Green
Write-Host "Now redeploying..." -ForegroundColor Green

# Redeploy
vercel --prod
