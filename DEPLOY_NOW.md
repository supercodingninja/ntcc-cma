# Deploy to Netlify in 3 Minutes (Drag & Drop Method)

## Step 1: Download Your Build Folder
1. In Bolt.new, locate the **dist** folder in the file tree on the left
2. Right-click on the **dist** folder
3. Select "Download" or "Export"
4. Save it to your computer (Downloads folder is fine)

## Step 2: Go to Netlify Drop
1. Open this link: **https://app.netlify.com/drop**
2. If you don't have a Netlify account, click "Sign up" (it's free!)
3. You can sign up with GitHub, GitLab, Bitbucket, or Email

## Step 3: Drag & Drop
1. Once you're on the Netlify Drop page, you'll see a big box that says "Drag and drop your site folder here"
2. Drag the **dist** folder (that you downloaded) onto this box
3. Wait 10-30 seconds for it to upload and deploy
4. You'll get a live URL like: `https://random-name-12345.netlify.app`

## Step 4: Add Environment Variables (CRITICAL!)
Without these, your app won't connect to the database.

1. After deployment, click "Site settings"
2. In the left menu, click "Environment variables"
3. Click "Add a variable" and add these TWO variables:

**Variable 1:**
- Key: `VITE_SUPABASE_URL`
- Value: `https://fozsbkbfwofycvhrmkqy.supabase.co`

**Variable 2:**
- Key: `VITE_SUPABASE_ANON_KEY`
- Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvenNia2Jmd29meWN2aHJta3F5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3MTcxNDksImV4cCI6MjA3ODI5MzE0OX0.1nyd5SLS1Zef8AhWrvV1l9prXeXHdHXNTditsniwe0U`

4. Click "Save"
5. Go to "Deploys" tab at the top
6. Click "Trigger deploy" → "Clear cache and deploy site"
7. Wait 30 seconds for the new deployment

## Step 5: Open Your Live App!
1. Click on the green URL at the top (like `https://random-name-12345.netlify.app`)
2. The app will automatically log you in as admin
3. Start testing all the features!

## What You Can Do Now:
- Add songs to your library
- Record practice sessions
- View practice history
- Manage users (admin access)
- View reports and analytics
- Access memorial section
- Change accessibility settings

## Change Your Site Name (Optional)
1. In Netlify, go to "Site settings"
2. Click "Change site name"
3. Enter a name like "ntcca-worship-manager"
4. Your URL becomes: `https://ntcca-worship-manager.netlify.app`

## Test Different User Roles
The app has auto-login enabled for admin, but you can also test other roles:
- Admin: admin@demo.com / demo123
- Editor: editor@demo.com / demo123
- Viewer: viewer@demo.com / demo123

---

**Need Help?** If you see any errors:
1. Make sure BOTH environment variables are added correctly
2. Make sure you triggered a new deploy after adding them
3. Check for typos in the variable names and values
