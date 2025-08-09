# LabDesk Supabase Setup Guide

This guide will help you set up your LabDesk application with Supabase database for reliable data storage and Vercel deployment.

## 🚀 Quick Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `labdesk-database`
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose closest to your users
5. Click "Create new project"

### 2. Get Your Database Credentials

Once your project is created:

1. Go to **Settings** → **Database**
2. Copy the **Connection string** (it looks like):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```
3. Go to **Settings** → **API**
4. Copy your **Project URL** and **anon public** key

### 3. Set Up Database Schema

1. Go to **SQL Editor** in your Supabase dashboard
2. Copy the contents of `migrations/001_initial_schema.sql`
3. Paste it into the SQL editor and run it
4. This will create all tables, indexes, and default data

### 4. Configure Environment Variables

Create a `.env` file in your project root:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# Session Configuration
SESSION_SECRET=your_very_secure_random_string_here

# Environment
NODE_ENV=development
```

### 5. Install Dependencies

```bash
npm install
```

### 6. Test Your Setup

```bash
npm run dev
```

Your application should now connect to Supabase! The default admin credentials are:
- **Username**: `admin`
- **Password**: `admin123`

## 🌐 Deploying to Vercel

### 1. Prepare for Deployment

```bash
npm run build
```

### 2. Deploy to Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Login: `vercel login`
3. Deploy: `vercel`

### 3. Set Environment Variables in Vercel

In your Vercel dashboard:

1. Go to your project → **Settings** → **Environment Variables**
2. Add these variables:
   ```
   SUPABASE_URL=https://your-project-ref.supabase.co
   SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   SESSION_SECRET=your_very_secure_random_string_here
   NODE_ENV=production
   ```

### 4. Redeploy

After setting environment variables, redeploy:
```bash
vercel --prod
```

## 🔧 Database Management

### Viewing Data
- Use Supabase **Table Editor** to view/edit data
- Or run: `npm run db:studio` for local Drizzle Studio

### Making Schema Changes
1. Modify `shared/schema.ts`
2. Generate migration: `npm run db:generate`
3. Apply to database: `npm run db:push`

### Backup & Recovery
- Supabase automatically backs up your data
- You can also export data from the Table Editor

## 🔒 Security Features

Your database includes:
- **Row Level Security (RLS)** enabled
- **Encrypted connections** (SSL)
- **Automatic backups**
- **Real-time monitoring**

## 📊 Default Test Templates

The setup includes templates for:
- Complete Blood Count (CBC)
- Liver Function Test (LFT)
- Renal Function Test (RFT)
- Lipid Profile
- Thyroid Function
- Blood Sugar
- Electrolytes
- Cardiac Markers
- Urine Analysis

## 🆘 Troubleshooting

### Connection Issues
1. Check your database URL is correct
2. Verify your password doesn't contain special characters that need encoding
3. Ensure your Supabase project is active

### Deployment Issues
1. Check all environment variables are set in Vercel
2. Verify your build command completes successfully
3. Check Vercel function logs for errors

### Data Loss Prevention
- Supabase automatically backs up your data
- Test changes in development first
- Use the audit log to track ID changes

## 📞 Support

If you encounter issues:
1. Check Supabase project logs
2. Verify environment variables
3. Test database connectivity
4. Check Vercel deployment logs

Your LabDesk system is now ready for production use with reliable Supabase database backing! 🎉
