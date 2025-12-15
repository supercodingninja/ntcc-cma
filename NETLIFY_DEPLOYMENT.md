# Deploy to Netlify - Ready Now!

Your app is built and ready to deploy to **praises.team**

## Quick Deploy (5 minutes)

### Step 1: Deploy to Netlify
Go to: **https://app.netlify.com/drop**

Drag and drop the **`dist`** folder from your project onto the page.

### Step 2: Add Environment Variables
After deployment, go to your site settings:
1. Site configuration → Environment variables
2. Add these two variables:

```
VITE_SUPABASE_URL=https://bjofpuajmlyjmufkxzwo.supabase.co
VITE_SUPABASE_ANON_KEY=[your key from .env file]
```

### Step 3: Connect Your Domain
1. Go to Domain settings in Netlify
2. Add custom domain: **praises.team**
3. Follow Netlify's DNS instructions

### Step 4: Redeploy
After adding environment variables, trigger a redeploy so the app picks up the variables.

## That's It!

Your Praises Choir Manager will be live at **https://praises.team**

---

## Your Environment Variables

Check your `.env` file for the exact values you need to add to Netlify.
