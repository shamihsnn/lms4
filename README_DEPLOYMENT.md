# LabDesk Deployment Guide for Vercel

This guide will help you deploy your LabDesk application to Vercel successfully.

## Prerequisites

1. Make sure you have a Vercel account
2. Ensure your code is pushed to a Git repository (GitHub, GitLab, or Bitbucket)

## Environment Variables Setup

Before deploying, you need to set up the following environment variables in your Vercel project:

1. Go to your Vercel dashboard
2. Select your project or create a new one
3. Go to Settings > Environment Variables
4. Add the following variables:

```
SUPABASE_URL=https://nuqwylqbxlayrskvadwm.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51cXd5bHFieGxheXJza3ZhZHdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NDc4NjcsImV4cCI6MjA3MDMxOTg2N30.idrUVnsACqH7Z2PIWf0R4ix1YknzRyRARjShWtJTUVs
DATABASE_URL=postgresql://postgres.nuqwylqbxlayrskvadwm:Ahmad2255464@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
SUPABASE_DATABASE_URL=postgresql://postgres.nuqwylqbxlayrskvadwm:Ahmad2255464@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
SESSION_SECRET=labdesk_super_secret_key_2024
COOKIE_SECURE=true
NODE_ENV=production
```

## Deployment Steps

1. Push your latest code to your Git repository
2. Connect your repository to Vercel
3. When setting up the project in Vercel:
   - Framework Preset: Other
   - Root Directory: /
   - Build Command: npm run build (or your build command)
   - Output Directory: dist
   - Install Command: npm install
4. Add the environment variables as listed above
5. Deploy!

## Troubleshooting Common Issues

### 401 Authentication Errors

These typically occur due to session configuration issues:
- Ensure `SESSION_SECRET` is set correctly
- Ensure `COOKIE_SECURE` is set to `true` for production
- Check that your login endpoint is working correctly

### Database Connection Errors

- Verify all database URLs are correctly set
- Ensure your Supabase database allows connections from Vercel
- Check that your database credentials are correct

### 404 Errors

- Make sure your `vercel.json` rewrites are correctly configured
- Ensure your API routes are properly set up

## Testing Your Deployment

1. After deployment, visit your site
2. Try to log in with your admin credentials
3. If you haven't created an admin user yet, the default is:
   - Username: admin
   - Password: admin123
4. Try changing your password to verify API functionality

## Need Help?

If you're still experiencing issues:
1. Check the Vercel deployment logs
2. Check your browser's developer console for errors
3. Verify all environment variables are correctly set
4. Make sure your Supabase project is properly configured
