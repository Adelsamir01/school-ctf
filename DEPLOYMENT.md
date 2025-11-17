# Deployment Guide

This guide covers deploying the School CTF platform to free hosting services.

## Option 1: Railway (Recommended)

Railway offers a free tier with $5 credit monthly, perfect for this application.

### Steps:

1. **Create Railway Account**
   - Go to https://railway.app
   - Sign up with GitHub

2. **Deploy from GitHub**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Railway will auto-detect Next.js

3. **Configure Environment Variables** (if needed)
   - Railway will automatically set up the project
   - No environment variables needed for basic setup

4. **Deploy**
   - Railway will automatically build and deploy
   - Your app will be live at `your-project.railway.app`

### Important Notes:
- The `/data` folder will persist between deployments
- Make sure to add `/data` to `.gitignore` if you don't want to commit data files
- Railway provides a free domain, or you can add a custom domain

---

## Option 2: Render

Render offers a free tier with some limitations.

### Steps:

1. **Create Render Account**
   - Go to https://render.com
   - Sign up with GitHub

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select your repository

3. **Configure Settings**
   - **Name**: school-ctf (or your choice)
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free

4. **Deploy**
   - Click "Create Web Service"
   - Render will build and deploy automatically
   - Your app will be live at `your-project.onrender.com`

### Important Notes:
- Free tier services spin down after 15 minutes of inactivity
- First request after spin-down may take 30-60 seconds
- The `/data` folder will persist on the filesystem

---

## Option 3: Fly.io

Fly.io offers a generous free tier.

### Steps:

1. **Install Fly CLI**
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Login to Fly**
   ```bash
   fly auth login
   ```

3. **Initialize Fly App**
   ```bash
   fly launch
   ```
   - Follow the prompts
   - Choose a region
   - Don't deploy yet

4. **Configure fly.toml** (already created below)

5. **Deploy**
   ```bash
   fly deploy
   ```

---

## Pre-Deployment Checklist

1. **Test Locally**
   ```bash
   npm run build
   npm start
   ```

2. **Check Environment**
   - Ensure all dependencies are in `package.json`
   - Verify `next.config.js` is correct

3. **Data Persistence**
   - The `/data` folder will be created automatically
   - On most platforms, this persists between deployments
   - Consider backing up important data

4. **Git Repository**
   - Make sure your code is pushed to GitHub
   - Don't commit `/data` folder (already in `.gitignore`)

---

## Post-Deployment

1. **Test the Application**
   - Visit your deployed URL
   - Test event password entry
   - Create a test team
   - Verify challenges work

2. **Monitor**
   - Check logs for any errors
   - Monitor resource usage on free tier

3. **Custom Domain** (Optional)
   - Most platforms allow custom domains
   - Follow platform-specific instructions

---

## Troubleshooting

### Build Fails
- Check Node.js version (should be 18+)
- Verify all dependencies are in `package.json`
- Check build logs for specific errors

### Data Not Persisting
- Ensure `/data` folder is writable
- Check platform filesystem limitations
- Some platforms may require volume mounts

### App Crashes
- Check application logs
- Verify environment variables (if any)
- Ensure port configuration is correct

---

## Platform Comparison

| Platform | Free Tier | Spin-down | Best For |
|----------|-----------|-----------|----------|
| Railway  | $5/month credit | No | Best overall experience |
| Render  | Free | Yes (15 min) | Simple deployments |
| Fly.io  | Generous | No | Global distribution |

