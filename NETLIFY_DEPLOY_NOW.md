# DEPLOY TO NETLIFY NOW - STEP BY STEP

Your app is built and ready! The `dist` folder is freshly created with all your code.

## OPTION 1: Deploy via Netlify Drop (FASTEST - 2 MINUTES)

### Steps:
1. **Open this link in your browser:** https://app.netlify.com/drop
2. **Drag the ENTIRE `dist` folder** from your project onto the page
3. **Wait 30 seconds** - Netlify will upload and deploy
4. **Click "Site settings"** on the deployed site
5. **Go to "Environment variables"** and add:
   - Variable: `VITE_SUPABASE_URL`
   - Value: `https://fozsbkbfwofycvhrmkqy.supabase.co`
   - Click "Add variable"

   - Variable: `VITE_SUPABASE_ANON_KEY`
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvenNia2Jmd29meWN2aHJta3F5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3MTcxNDksImV4cCI6MjA3ODI5MzE0OX0.1nyd5SLS1Zef8AhWrvV1l9prXeXHdHXNTditsniwe0U`
   - Click "Add variable"

6. **Go to "Deploys"** and click "Trigger deploy" → "Clear cache and deploy site"
7. **Wait 1 minute** for redeploy
8. **Your app is LIVE!** Click the URL to see it

## OPTION 2: Deploy via Netlify CLI (3 MINUTES)

### Steps:
1. Install Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

2. Login to Netlify:
   ```bash
   netlify login
   ```

3. Deploy from the project folder:
   ```bash
   netlify deploy --prod --dir=dist
   ```

4. Follow prompts and your app will be live!

## OPTION 3: Deploy via GitHub + Netlify (5 MINUTES)

### Steps:
1. **Push your code to GitHub** (if not already there)

2. **Go to Netlify:** https://app.netlify.com

3. **Click "Add new site" → "Import an existing project"**

4. **Choose "Deploy with GitHub"**

5. **Select your repository**

6. **Configure build settings:**
   - Build command: `npm run build`
   - Publish directory: `dist`

7. **Add environment variables** (before deploying):
   - `VITE_SUPABASE_URL` = `https://fozsbkbfwofycvhrmkqy.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvenNia2Jmd29meWN2aHJta3F5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3MTcxNDksImV4cCI6MjA3ODI5MzE0OX0.1nyd5SLS1Zef8AhWrvV1l9prXeXHdHXNTditsniwe0U`

8. **Click "Deploy site"**

9. **Wait 2-3 minutes** and your app is live!

## After Deployment: Connect praises.team Domain

Once your app is deployed to Netlify:

1. **In Netlify dashboard**, click on your site
2. **Click "Domain settings"**
3. **Click "Add custom domain"**
4. **Enter:** `praises.team`
5. **Click "Verify" then "Add domain"**
6. **Follow the DNS instructions** Netlify provides
7. **Update your domain registrar** with the DNS records
8. **Wait 5-60 minutes** for DNS to propagate
9. **Your app will be live at https://praises.team**

## Login Credentials

Once deployed, login with:
- **Email:** admin@demo.com
- **Password:** demo123

## What's Ready

✅ `dist` folder is built and ready
✅ `netlify.toml` configuration file created
✅ Database is connected and working
✅ All 3 user accounts exist (admin, editor, viewer)
✅ Environment variables documented above

## The Issue Before

The app was never uploaded to the internet. Now with the `dist` folder ready and these instructions, you can deploy it in 2-5 minutes depending on which option you choose.

## Recommended Path

**Use Option 1 (Netlify Drop)** - it's the fastest and easiest. Just drag and drop the `dist` folder!

Your app will be live at a URL like: `https://wonderful-site-name-123.netlify.app`

Then connect your `praises.team` domain and it will be live there too!
