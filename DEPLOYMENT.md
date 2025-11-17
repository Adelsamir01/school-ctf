# Netlify Deployment Guide

## Important: File Storage Limitation

**Netlify's file system is read-only** except for `/tmp`, which means the current JSON file-based storage won't persist data between requests. You have two options:

### Option 1: Use a Database (Recommended)

Replace the file-based storage with a database service:
- **Supabase** (PostgreSQL) - Free tier available
- **Fauna** - Serverless database
- **PlanetScale** - MySQL compatible
- **MongoDB Atlas** - Free tier available

### Option 2: Use Netlify Functions with External Storage

Use services like:
- **Upstash Redis** - Serverless Redis
- **DynamoDB** - AWS serverless database

## Deployment Steps

1. **Push to GitHub/GitLab/Bitbucket**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Connect to Netlify**
   - Go to [netlify.com](https://netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Connect your Git repository
   - Netlify will auto-detect Next.js settings

3. **Build Settings** (should auto-detect):
   - Build command: `npm run build`
   - Publish directory: `.next`

4. **Environment Variables** (if using a database):
   - Go to Site settings → Environment variables
   - Add your database connection strings

5. **Deploy**
   - Click "Deploy site"
   - Netlify will build and deploy automatically

## Current Setup

The `netlify.toml` file is configured for Next.js deployment. The build will work, but **data won't persist** until you migrate to a database.

## Quick Database Migration

To migrate to Supabase (example):

1. Create a Supabase project
2. Create tables matching the current JSON structure
3. Update `lib/db.ts` to use Supabase client instead of file operations
4. Add `SUPABASE_URL` and `SUPABASE_KEY` as environment variables

## Testing Locally

Before deploying, test the build:
```bash
npm run build
npm start
```

