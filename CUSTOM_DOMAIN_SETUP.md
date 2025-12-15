# Deploy to Your Custom Domain: praises.team

## Part 1: Deploy to Netlify First

Follow the steps in `DEPLOY_NOW.md` to get your app deployed to Netlify first. You'll start with a URL like `https://random-name-12345.netlify.app`

## Part 2: Connect Your Custom Domain (praises.team)

### Step 1: Add Custom Domain in Netlify
1. Log into your Netlify dashboard
2. Click on your deployed site
3. Go to **"Domain settings"** (or "Domain management")
4. Click **"Add custom domain"**
5. Enter: `praises.team`
6. Click **"Verify"** then **"Add domain"**

### Step 2: Add www Subdomain (Optional but Recommended)
1. In the same Domain settings page
2. Click **"Add domain alias"**
3. Enter: `www.praises.team`
4. This ensures both `praises.team` and `www.praises.team` work

### Step 3: Configure Your DNS

Netlify will show you DNS records to add. You need to update your domain registrar (where you bought praises.team).

#### Option A: Use Netlify DNS (Easiest - Recommended)
1. In Netlify, click **"Set up Netlify DNS"**
2. Netlify will give you nameservers like:
   - `dns1.p01.nsone.net`
   - `dns2.p01.nsone.net`
   - `dns3.p01.nsone.net`
   - `dns4.p01.nsone.net`

3. Go to your domain registrar (GoDaddy, Namecheap, Google Domains, etc.)
4. Find **"Nameservers"** or **"DNS Settings"**
5. Replace the existing nameservers with Netlify's nameservers
6. Save changes

**DNS propagation takes 5-60 minutes** (sometimes up to 24 hours)

#### Option B: Use Your Current DNS Provider
If you want to keep your current DNS provider, add these records:

**For the root domain (praises.team):**
- Type: `A`
- Name: `@` or leave blank
- Value: `75.2.60.5` (Netlify's load balancer)
- TTL: `3600` or `Auto`

**For www subdomain (www.praises.team):**
- Type: `CNAME`
- Name: `www`
- Value: `[your-netlify-site-name].netlify.app` (your temporary Netlify URL)
- TTL: `3600` or `Auto`

### Step 4: Enable HTTPS (Free SSL Certificate)
1. Once DNS is configured and propagated, go back to Netlify
2. In Domain settings, find the **HTTPS** section
3. Click **"Verify DNS configuration"**
4. Click **"Provision certificate"**
5. Wait 1-2 minutes for the SSL certificate to be issued
6. Your site will automatically redirect from HTTP to HTTPS

### Step 5: Set Primary Domain
1. In Netlify's Domain settings
2. Choose which should be primary:
   - `praises.team` (recommended)
   - `www.praises.team`
3. The other will automatically redirect to your primary choice

## Where to Update DNS (Common Registrars)

### GoDaddy
1. Log in to GoDaddy
2. Go to "My Products"
3. Click "DNS" next to praises.team
4. Update Nameservers or add A/CNAME records

### Namecheap
1. Log in to Namecheap
2. Go to "Domain List"
3. Click "Manage" next to praises.team
4. Go to "Nameservers" or "Advanced DNS"

### Google Domains
1. Log in to Google Domains
2. Click on praises.team
3. Go to "DNS" tab
4. Update Name servers or Custom records

### Cloudflare
1. Log in to Cloudflare
2. Select praises.team
3. Go to "DNS" tab
4. Add A and CNAME records

## Verification

After DNS propagation (5-60 minutes), test:
1. Visit `https://praises.team` - should load your app
2. Visit `https://www.praises.team` - should load or redirect
3. Try on different devices and networks

## Timeline

- **Immediate**: Deploy to Netlify (1-2 minutes)
- **5 minutes**: Add domain and configure DNS
- **5-60 minutes**: DNS propagation
- **1-2 minutes**: SSL certificate provisioning
- **Total**: Usually ready in 15-60 minutes

## Final Result

Your worship song management app will be live at:
- **https://praises.team** ✅
- **https://www.praises.team** ✅
- Auto-login as admin enabled
- Secure HTTPS connection
- Professional custom domain

## Need Help?

If DNS doesn't propagate:
1. Double-check nameservers are correct
2. Wait longer (up to 24 hours max)
3. Clear your browser cache
4. Try incognito/private browsing
5. Test on different device/network
6. Use DNS checker: https://dnschecker.org

## After It's Live

Don't forget to:
- Test all features (songs, practice tracking, reports)
- Add your real songs and data
- Create actual user accounts for your team
- Update profile settings
- Explore accessibility features

Your domain `praises.team` is perfect for a worship song management system!
