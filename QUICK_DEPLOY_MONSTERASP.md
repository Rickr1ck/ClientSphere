# Quick Deployment Guide - Using Your MonsterASP Details

## Your Server Information
- **Domain**: https://clientsphere.runasp.net
- **WebDeploy Server**: site66264.siteasp.net:8172
- **Site Name**: site66264
- **Login**: site66264
- **Password**: 3Jh@j_X9L5#a

---

## Option A: Deploy via WebDeploy (Easiest - Recommended)

### Step 1: Download Publish Profile

1. In your MonsterASP dashboard, click **"Download publish profile"** button
2. Save the `.PublishSettings` file to your computer
3. Remember where you saved it (e.g., `Downloads\site66264.PublishSettings`)

### Step 2: Publish Backend from Visual Studio

1. Open `ClientSphere.slnx` in Visual Studio
2. Right-click on **ClientSphere.API** project → **Publish**
3. Click **"Add a publish profile"**
4. Select **"Import Profile"** → Choose the `.PublishSettings` file you downloaded
5. Click **Import**

6. **Configure Publish Settings**:
   - Configuration: `Release`
   - Target Framework: `net10.0`
   - Deployment Mode: `Self-Contained` or `Framework-Dependent`
   - Target Runtime: `win-x86` (matches your server)
   
7. **Edit web.config** (if needed):
   - Click on the publish profile → **Settings** → **File Publish Options**
   - Ensure these files are included:
     - `web.config` ✅
     - `appsettings.json` ✅
     - `Models/` folder ✅

8. Click **Publish**

Visual Studio will automatically:
- Build the project
- Upload files to MonsterASP via WebDeploy
- Configure the application

### Step 3: Set Environment Variables via FTP

WebDeploy doesn't set environment variables. You need to do this separately:

1. **Download FileZilla** (free FTP client) or use Windows File Explorer
2. **Connect via FTP**:
   - Host: `site66264.siteasp.net`
   - Username: `site66264`
   - Password: `3Jh@j_X9L5#a`
   - Port: `21`

3. **Navigate to site root** (usually `/site66264/`)

4. **Create/Edit `web.config`** to include environment variables:

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <location path="." inheritInChildApplications="false">
    <system.webServer>
      <handlers>
        <add name="aspNetCore" path="*" verb="*" modules="AspNetCoreModuleV2" resourceType="Unspecified" />
      </handlers>
      <aspNetCore 
        processPath="dotnet" 
        arguments=".\ClientSphere.API.dll" 
        stdoutLogEnabled="true" 
        stdoutLogFile=".\logs\stdout" 
        hostingModel="inprocess">
        <environmentVariables>
          <environmentVariable name="ASPNETCORE_ENVIRONMENT" value="Production" />
          <environmentVariable name="ConnectionStrings__DefaultConnection" value="Host=YOUR_DB_HOST;Port=5432;Database=ClientSphereDB;Username=YOUR_USER;Password=YOUR_PASSWORD;SSL Mode=Require;Timeout=30" />
          <environmentVariable name="Jwt__Secret" value="YOUR_64_CHAR_JWT_SECRET" />
          <environmentVariable name="Stripe__SecretKey" value="sk_live_YOUR_STRIPE_KEY" />
          <environmentVariable name="Stripe__WebhookSecret" value="whsec_YOUR_WEBHOOK_SECRET" />
          <environmentVariable name="Cors__AllowedOrigins__0" value="https://clientsphere.runasp.net" />
          <environmentVariable name="Cors__AllowedOrigins__1" value="https://www.clientsphere.runasp.net" />
        </environmentVariables>
      </aspNetCore>
    </system.webServer>
  </location>
</configuration>
```

5. **Upload this web.config** to replace the existing one in your site root

---

## Option B: Deploy via FTP (Alternative)

### Step 1: Publish Locally

```powershell
cd d:\Projects\ClientSphere\ClientSphere.API
dotnet publish -c Release -o publish
```

### Step 2: Upload via FileZilla

1. **Download FileZilla**: https://filezilla-project.org/
2. **Connect**:
   - Host: `site66264.siteasp.net`
   - Username: `site66264`
   - Password: `3Jh@j_X9L5#a`
   - Port: `21`
   - Click **Quickconnect**

3. **Upload files**:
   - Navigate to your site folder (usually `/site66264/` or `/wwwroot/`)
   - **Delete old files** (backup first if needed)
   - Upload **all contents** of `publish/` folder
   - Ensure `Models/` folder is included

4. **Upload web.config** with environment variables (from Option A above)

---

## Option C: Deploy via Git (If Supported)

If MonsterASP supports Git deployment:

1. Initialize git in your project (if not already)
2. Add MonsterASP as remote:
   ```bash
   git remote add monsterasp https://site66264:3Jh@j_X9L5#a@site66264.siteasp.net/git/site66264.git
   ```
3. Push to deploy:
   ```bash
   git push monsterasp main
   ```

---

## Update Frontend (.env.production)

Edit `clientsphere-web\.env.production`:

```env
VITE_API_URL=https://clientsphere.runasp.net
```

Then rebuild:
```powershell
cd d:\Projects\ClientSphere\clientsphere-web
npm run build
```

Upload contents of `dist/` folder to your site root (or subfolder if you have separate frontend/backend).

---

## Test Deployment

### 1. Test Health Check
```
https://clientsphere.runasp.net/api/v1/health
```

Expected: `{"status":"healthy","timestamp":"2026-04-29T..."}`

### 2. Test Frontend
```
https://clientsphere.runasp.net
```

Should show login page.

### 3. Check Logs

Via FTP, check:
- `/site66264/logs/` (or wherever logs are configured)
- Look for `stdout_*.log` for startup errors
- Look for `clientsphere-*.txt` for application logs

---

## Environment Variables Checklist

Update these values in your `web.config` before deployment:

- [ ] `ConnectionStrings__DefaultConnection` - Your PostgreSQL connection string
- [ ] `Jwt__Secret` - Generate 64+ character secret
- [ ] `Stripe__SecretKey` - Your production Stripe key (sk_live_*)
- [ ] `Stripe__WebhookSecret` - Get from Stripe Dashboard
- [ ] `Cors__AllowedOrigins__0` - https://clientsphere.runasp.net
- [ ] `Cors__AllowedOrigins__1` - https://www.clientsphere.runasp.net

---

## Important Notes for Free Plan

⚠️ **Memory Limit**: 256 MB RAM
- Keep logging minimal (Warning level)
- Avoid large file uploads
- Monitor memory usage

️ **Disk Limit**: 5120 MB (5 GB)
- Regularly clean old log files
- Don't store large files on server

⚠️ **x86 Architecture**: Your server is 32-bit
- Ensure publish target is `win-x86`
- Some 64-bit-only libraries won't work

---

## Database Setup

Since you're on a free plan, use an external PostgreSQL:

### Option 1: Supabase (Free)
1. Go to https://supabase.com
2. Create free project
3. Get connection string from Project Settings → Database
4. Use in your `ConnectionStrings__DefaultConnection`

### Option 2: Neon (Free)
1. Go to https://neon.tech
2. Create free PostgreSQL database
3. Get connection string
4. Use in your environment variables

### Run Migrations

```powershell
cd d:\Projects\ClientSphere
dotnet ef database update `
  --project ClientSphere.Infrastructure `
  --startup-project ClientSphere.API `
  --connection "YOUR_SUPABASE_OR_NEON_CONNECTION_STRING"
```

---

## Stripe Webhook Setup

1. Go to https://dashboard.stripe.com/test/webhooks (or production)
2. Add endpoint: `https://clientsphere.runasp.net/api/v1/webhooks/stripe`
3. Select events: `checkout.session.completed`
4. Copy signing secret to `Stripe__WebhookSecret` in web.config

---

## Troubleshooting

### Application Won't Start
1. Check `stdout_*.log` in logs folder
2. Verify all environment variables are set
3. Check .NET version compatibility (you have .NET 10.x support)
4. Ensure `web.config` is correct

### Database Connection Fails
1. Verify connection string format
2. Check if external database allows your server IP
3. Test connection locally with psql

### CORS Errors
1. Verify CORS origins include `https://clientsphere.runasp.net`
2. Check for trailing slashes (should NOT have them)

---

## Quick Commands Reference

### Build Backend
```powershell
dotnet publish -c Release -o publish
```

### Build Frontend
```powershell
npm run build
```

### Generate JWT Secret
```powershell
$bytes = New-Object byte[] 64
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
[System.Convert]::ToBase64String($bytes)
```

### Test Health Check
```powershell
Invoke-RestMethod https://clientsphere.runasp.net/api/v1/health
```

---

## Next Steps

1. ✅ Choose deployment method (WebDeploy recommended)
2. ✅ Update `web.config` with your environment variables
3. ✅ Build and publish backend
4. ✅ Build and upload frontend
5. ✅ Set up external PostgreSQL database
6. ✅ Run database migrations
7. ✅ Configure Stripe webhook
8. ✅ Test health check endpoint
9. ✅ Test full registration flow
10. ✅ Monitor logs for errors

Good luck with your deployment! 🚀
