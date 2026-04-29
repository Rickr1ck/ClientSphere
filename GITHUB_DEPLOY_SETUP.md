# MonsterASP GitHub Deploy - Complete Setup Guide

##  What This Does

MonsterASP will **automatically pull your code from GitHub and build it** every time you push!

---

##  Step 1: Enable GitHub Deploy in MonsterASP

1. Go to your MonsterASP dashboard
2. Find **"Github Deploy"** section
3. Click **Enabled** (green toggle)
4. Fill in:

```
Repository Url: https://github.com/YOUR_USERNAME/ClientSphere.git
Repository: YOUR_USERNAME/ClientSphere
Branch: main
Type: GitHub
Personal Access Token: [Generate from GitHub]
```

---

##  Step 2: Generate GitHub Personal Access Token

1. Go to: https://github.com/settings/tokens
2. Click **Generate new token (classic)**
3. Name: `MonsterASP-Deploy`
4. Expiration: **No expiration** (or 90 days)
5. Select scopes:
   - ✅ **repo** (Full control of private repositories)
6. Click **Generate token**
7. **COPY THE TOKEN** - you won't see it again!
8. Paste into MonsterASP's **Personal Access Token** field
9. Click **Enable**

---

##  Step 3: Push Deployment Files to GitHub

You already have the files created. Now push them:

```powershell
cd d:\Projects\ClientSphere

git add .deployment
git add deploy.cmd
git commit -m "Add MonsterASP GitHub deployment configuration"
git push origin main
```

---

##  Step 4: Set Environment Variables

GitHub Deploy will pull code, but you still need to set **environment variables** on MonsterASP.

### Method A: Via web.config (Recommended)

Update your `ClientSphere.API/web.config` with actual values:

```xml
<environmentVariables>
  <environmentVariable name="ASPNETCORE_ENVIRONMENT" value="Production" />
  
  <environmentVariable name="ConnectionStrings__DefaultConnection" 
    value="Host=YOUR_DB_HOST;Port=5432;Database=ClientSphereDB;Username=YOUR_USER;Password=YOUR_PASSWORD;SSL Mode=Require;Timeout=30" />
  
  <environmentVariable name="Jwt__Secret" 
    value="YOUR_ACTUAL_64_CHAR_JWT_SECRET" />
  
  <environmentVariable name="Stripe__SecretKey" 
    value="sk_live_YOUR_STRIPE_KEY" />
  
  <environmentVariable name="Stripe__WebhookSecret" 
    value="whsec_YOUR_WEBHOOK_SECRET" />
  
  <environmentVariable name="Cors__AllowedOrigins__0" 
    value="https://clientsphere.runasp.net" />
  
  <environmentVariable name="Cors__AllowedOrigins__1" 
    value="https://www.clientsphere.runasp.net" />
</environmentVariables>
```

Then commit and push:

```powershell
git add ClientSphere.API/web.config
git commit -m "Update web.config with production environment variables"
git push origin main
```

### Method B: Via MonsterASP Control Panel

Some MonsterASP plans allow setting environment variables directly in the control panel. Check if this option is available.

---

##  Step 5: Trigger First Deployment

### Option A: Automatic
Just push to your `main` branch - it will trigger automatically!

```powershell
git push origin main
```

### Option B: Manual Trigger
In MonsterASP dashboard, look for a **"Sync"** or **"Deploy Now"** button in the GitHub Deploy section.

---

##  Step 6: Monitor Deployment

### Check Deployment Status

1. In MonsterASP dashboard, look for **Deployment Logs** or **Output** section
2. You should see:
   ```
   Building React frontend...
   Publishing .NET backend...
   Copying frontend build to wwwroot...
   Deployment successful!
   ```

### Check for Errors

If deployment fails:
1. Check the deployment logs in MonsterASP
2. Look for errors like:
   - `npm install failed` → Check `package.json`
   - `dotnet publish failed` → Check .NET SDK version
   - `Missing node.js` → MonsterASP needs Node.js installed

---

##  Step 7: Verify Deployment

### Test Backend

```powershell
# Health check
Invoke-RestMethod https://clientsphere.runasp.net/api/v1/health

# Expected output:
# status   timestamp
# ------   ---------
# healthy  2026-04-29T12:00:00+00:00
```

### Test Frontend

Open browser: https://clientsphere.runasp.net

You should see the ClientSphere login page.

---

##  How It Works

```
You push to GitHub
        ↓
MonsterASP detects change
        ↓
Runs deploy.cmd automatically
        ↓
  1. npm install (frontend)
  2. npm run build (frontend)
  3. dotnet restore (backend)
  4. dotnet publish (backend)
  5. Copy files to wwwroot
        ↓
Application restarts
        ↓
✅ Live at https://clientsphere.runasp.net
```

---

##  What Happens on Each Push

1. **You push code** to GitHub (`git push origin main`)
2. **MonsterASP detects** the new commit
3. **MonsterASP runs** `deploy.cmd`:
   - Installs npm packages
   - Builds React frontend
   - Publishes .NET backend
   - Copies files to correct locations
4. **Application restarts** automatically
5. **Your site is live** with the new code!

---

##  File Structure After Deployment

MonsterASP will create this structure:

```
D:\home\site\wwwroot\
├── ClientSphere.API.dll          ← Backend (published)
├── web.config                    ← IIS configuration
├── appsettings.json
├── Models\
│   ├── lead_model.onnx
│   ├── sentiment_model.onnx
│   └── vectorizer.onnx
├── wwwroot\                      ← Frontend (React build)
│   ├── index.html
│   ├── favicon.svg
│   ├── assets\
│   │   ├── index-*.js
│   │   └── index-*.css
│   └── ...
└── ... (other published files)
```

---

##  Important Notes

### ✅ What's Automated
- ✅ Pulling code from GitHub
- ✅ Building frontend (npm run build)
- ✅ Building backend (dotnet publish)
- ✅ Deploying to correct folders
- ✅ Restarting application

### ❌ What's NOT Automated
- ❌ Setting environment variables (do this once in web.config)
- ❌ Database migrations (run manually or add to deploy.cmd)
- ❌ SSL certificate setup (one-time setup in MonsterASP)
- ❌ Stripe webhook configuration (one-time setup in Stripe)

### ⚠️ Free Plan Limitations
- 256 MB RAM → builds may be slow
- 5 GB disk → clean old builds periodically
- Node.js version → ensure compatibility

---

##  Troubleshooting

### Issue: Deployment Not Triggering

**Check:**
1. GitHub Deploy is **Enabled** in MonsterASP
2. Repository URL is correct
3. Personal Access Token is valid
4. Branch name matches (`main` vs `master`)
5. Token has `repo` permission

**Fix:**
- Try clicking **Sync** or **Deploy Now** manually
- Check MonsterASP deployment logs

### Issue: npm install Fails

**Check:**
1. Node.js is installed on MonsterASP server
2. `package.json` exists in `clientsphere-web/`
3. No syntax errors in `package.json`

**Fix:**
- Add to `deploy.cmd`:
  ```batch
  node --version
  npm --version
  ```

### Issue: dotnet publish Fails

**Check:**
1. .NET SDK is installed on MonsterASP
2. `ClientSphere.slnx` exists
3. All project references are correct

**Fix:**
- Specify .NET version in `deploy.cmd`:
  ```batch
  dotnet --version
  ```

### Issue: Site Shows 502 Bad Gateway

**Check:**
1. Backend published successfully
2. `web.config` exists and is correct
3. Application pool is running
4. Environment variables are set

**Fix:**
- Check deployment logs for errors
- Verify `web.config` has correct `aspNetCore` settings
- Ensure environment variables are in `web.config`

---

##  Database Migrations

### Option 1: Manual (Recommended)

After deployment, run migrations manually:

```powershell
# From your local machine
cd d:\Projects\ClientSphere
dotnet ef database update `
  --project ClientSphere.Infrastructure `
  --startup-project ClientSphere.API `
  --connection "YOUR_PRODUCTION_CONNECTION_STRING"
```

### Option 2: Automatic (Add to deploy.cmd)

Add this to `deploy.cmd` before the success message:

```batch
:: Run database migrations
echo Running database migrations...
pushd "%DEPLOYMENT_SOURCE%"
call dotnet ef database update ^
  --project ClientSphere.Infrastructure ^
  --startup-project ClientSphere.API ^
  --connection "%ConnectionStrings__DefaultConnection%"
IF !ERRORLEVEL! NEQ 0 goto error
popd
```

⚠️ **Warning**: This requires database credentials in environment variables

---

##  Continuous Deployment Workflow

### Development Flow

```powershell
# 1. Make changes
# Edit code...

# 2. Test locally
npm run dev              # Test frontend
dotnet run               # Test backend

# 3. Commit and push
git add .
git commit -m "Add new feature"
git push origin main

# 4. Wait ~2-5 minutes
# MonsterASP automatically deploys!

# 5. Verify
Open https://clientsphere.runasp.net
```

### That's It!
Every push to `main` = automatic deployment! 🎉

---

##  Quick Reference

### Files You Created
- ✅ `.deployment` - Tells MonsterASP to use deploy.cmd
- ✅ `deploy.cmd` - Build and deployment script
- ✅ `web.config` - IIS configuration with environment variables

### MonsterASP GitHub Deploy Settings
```
Repository: YOUR_USERNAME/ClientSphere
Branch: main
Token: [Your GitHub PAT with repo scope]
```

### Environment Variables (in web.config)
- `ASPNETCORE_ENVIRONMENT` = Production
- `ConnectionStrings__DefaultConnection` = [Your PostgreSQL string]
- `Jwt__Secret` = [64+ char secret]
- `Stripe__SecretKey` = [sk_live_*]
- `Stripe__WebhookSecret` = [whsec_*]
- `Cors__AllowedOrigins__0` = https://clientsphere.runasp.net
- `Cors__AllowedOrigins__1` = https://www.clientsphere.runasp.net

---

##  Next Steps

1. ✅ Enable GitHub Deploy in MonsterASP
2. ✅ Generate GitHub Personal Access Token
3. ✅ Push `.deployment` and `deploy.cmd` to GitHub
4. ✅ Update `web.config` with production values
5. ✅ Push everything to GitHub
6. ✅ Wait for automatic deployment
7. ✅ Test: https://clientsphere.runasp.net/api/v1/health
8. ✅ Run database migrations
9. ✅ Configure Stripe webhook
10. ✅ Done! 🚀

---

##  Support

- **MonsterASP GitHub Deploy Docs**: Check the "HELP" link in your dashboard
- **Kudu Deployment**: MonsterASP uses Kudu (same as Azure App Service)
- **Troubleshooting**: Check deployment logs in MonsterASP dashboard

---

**Congratulations!** You now have **continuous deployment** from GitHub to MonsterASP! 

Every push to `main` will automatically build and deploy your application!
