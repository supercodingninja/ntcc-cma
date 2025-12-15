# NTCCA Legacy - Complete Deployment Guide

## What You Have Now

A working Progressive Web App (PWA) for church music management with:
- Login/Signup authentication
- Role-based access (Admin, Editor, Viewer)
- Database connected to Supabase
- Responsive design for mobile and desktop
- PWA features (installable on devices)

## CRITICAL: Setup Supabase Connection

Before deploying, you MUST update the `.env` file with your actual Supabase credentials:

1. Go to your Supabase project dashboard
2. Click on "Project Settings" (gear icon)
3. Navigate to "API" section
4. Copy the "Project URL" and "anon public" API key
5. Update `.env` file:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Quick Deployment to Netlify (FREE)

### Step 1: Prepare for Deployment

```bash
npm run build
```

This creates a `dist` folder with your app.

### Step 2: Deploy to Netlify

**Option A: Using Netlify CLI**
```bash
npm install -g netlify-cli
netlify deploy --prod
```

**Option B: Using Netlify Website (Drag and Drop)**
1. Go to https://app.netlify.com
2. Sign up/login (free account)
3. Drag and drop your `dist` folder
4. Your app is live!

### Step 3: Add Environment Variables on Netlify
1. Go to Site Settings > Environment Variables
2. Add:
   - `VITE_SUPABASE_URL` = your Supabase URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key
3. Redeploy

Your app URL will be: `https://your-site-name.netlify.app`

## How to Install on Devices

### For iPhone/iPad Users:
1. Open the app URL in Safari
2. Tap the Share button (square with arrow)
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add"
5. The app icon now appears on your home screen!

### For Android Users:
1. Open the app URL in Chrome
2. Tap the menu (three dots)
3. Tap "Install app" or "Add to Home screen"
4. The app icon appears on your home screen!

### For Desktop (Chrome/Edge):
1. Open the app URL
2. Look for the install icon in the address bar (+ or computer icon)
3. Click it and confirm installation
4. The app opens in its own window!

## WordPress Integration Options

### Option 1: iFrame Embed (Easiest)
Add this to any WordPress page:

```html
<iframe src="https://your-app-url.netlify.app" 
        width="100%" 
        height="800px" 
        frameborder="0">
</iframe>
```

### Option 2: Subdomain (Professional)
1. In your WordPress hosting (www.myntcc.org):
   - Go to DNS settings
   - Add a CNAME record:
     - Name: `app` or `music`
     - Value: `your-site-name.netlify.app`
2. In Netlify:
   - Go to Domain Settings
   - Add custom domain: `app.myntcc.org`
3. Your app now lives at: `https://app.myntcc.org`

### Option 3: WordPress Plugin (Advanced)
1. Install "Custom HTML" or "Code Snippets" plugin
2. Create a new page template
3. Add this code to load your app:

```html
<!DOCTYPE html>
<html>
<head>
    <title>NTCCA Legacy</title>
    <style>
        body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; }
        iframe { width: 100%; height: 100vh; border: none; }
    </style>
</head>
<body>
    <iframe src="https://your-app-url.netlify.app"></iframe>
</body>
</html>
```

## Creating Your First Admin User

After deployment:
1. Go to your app URL
2. Click "Sign Up"
3. Create an account
4. Go to your Supabase Dashboard
5. Navigate to: Table Editor > profiles
6. Find your user
7. Change `role` from `viewer` to `admin`
8. Save
9. Logout and login again
10. You now have full admin access!

## What's Currently Working

- ✅ User Authentication (Login/Signup)
- ✅ Role-based access control
- ✅ Database structure (all tables created)
- ✅ Responsive navigation
- ✅ PWA installation capability
- ⚠️  Song pages (placeholders - need completion)
- ⚠️  Practice tracking (placeholder - needs completion)
- ⚠️  Reports (placeholder - needs completion)

## Next Steps to Complete the App

The foundation is built! Here's what needs to be completed:

### 1. Songs Page (`src/pages/Songs.jsx`)
Needs:
- Fetch and display songs from database
- Search and filter functionality
- Grid/list view of songs

### 2. Add/Edit Song Pages
Needs:
- Form with all 15+ fields (title, artist, key, tempo, lyrics, chords, etc.)
- Theme tagging system
- YouTube URL integration
- File upload for audio

### 3. Song Detail Page
Needs:
- Display all song information
- Show lyrics and chords
- Embed YouTube video
- "Mark as Practiced" button
- Practice history for this song

### 4. Practice History Page
Needs:
- List all practice sessions
- Filter by date range
- Filter by song
- Show who practiced what and when

### 5. Reports Page (Admin only)
Needs:
- Date range selector
- Generate CCLI Excel report
- Download functionality
- Report history

### 6. Users Management (Admin only)
Needs:
- List all users
- Change user roles
- View user activity

## Troubleshooting

**Problem: Can't login after signup**
- Check Supabase email auth settings
- Verify environment variables are set correctly

**Problem: App doesn't install on phone**
- Make sure you're using HTTPS (Netlify provides this automatically)
- Check that manifest.webmanifest is accessible

**Problem: Database errors**
- Verify Supabase credentials in .env
- Check Row Level Security policies in Supabase

## Support & Maintenance

This app uses 100% FREE services:
- Supabase Free Tier: 500MB database, 50,000 monthly users
- Netlify Free Tier: 100GB bandwidth/month
- No credit card required for either!

For 100 users, you'll never hit the limits.

## Security Notes

- All passwords are encrypted by Supabase
- Row Level Security (RLS) is enabled on all tables
- Only admins can manage users
- Only editors and admins can modify songs
- All users can view songs and track practice

---

**Your app is ready to deploy! Follow the steps above to go live.**
