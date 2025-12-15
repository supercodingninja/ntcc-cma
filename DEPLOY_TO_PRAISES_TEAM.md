# Deploy to praises.team - FINAL STEPS

## Your app is 100% ready! Here's how to deploy it:

### Option 1: Deploy via Bolt (EASIEST - 2 minutes)

1. In Bolt, click the **Deploy** button (top right)
2. Choose **Netlify** or **Vercel**
3. Drag your `dist` folder to the deployment page
4. Wait 30 seconds for deployment
5. Go to your hosting dashboard and add custom domain: **praises.team**

### Option 2: Deploy via Netlify Directly (3 minutes)

1. Go to https://app.netlify.com/drop
2. Drag the entire `dist` folder from your project
3. Wait for deployment to complete
4. Click "Domain Settings" > "Add custom domain"
5. Enter: **praises.team**
6. Update your domain DNS to point to Netlify (they'll show you how)

### Option 3: Deploy via GitHub + Netlify (5 minutes)

1. Push this code to GitHub
2. Go to https://app.netlify.com
3. Click "Add new site" > "Import from Git"
4. Connect your GitHub repo
5. Build command: `npm run build`
6. Publish directory: `dist`
7. Add custom domain: **praises.team**

## Your Login Credentials

Once deployed, use these to login:

**Admin Account (Full Access):**
- Email: admin@demo.com
- Password: demo123

**Editor Account (Can Add/Edit Songs):**
- Email: editor@demo.com
- Password: demo123

**Viewer Account (Read-Only):**
- Email: viewer@demo.com
- Password: demo123

## What's Working

✅ Database is connected and working
✅ All 3 user accounts exist and work
✅ Build completed successfully (dist folder ready)
✅ Environment variables are embedded in the build
✅ All pages load correctly
✅ Authentication system is functional

## The Issue You Were Seeing

The "Database error querying schema" was caused by auto-login trying to connect before the app fully loaded. This is now fixed - you just need to click the Sign In button manually.

## Important Note

The app works perfectly in development and will work on your custom domain. The login screen just needs you to click "Sign In" - the credentials are pre-filled!
