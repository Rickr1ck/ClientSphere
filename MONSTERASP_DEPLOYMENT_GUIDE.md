# Complete MonsterASP Deployment Guide - ClientSphere CRM

This guide provides step-by-step instructions for deploying ClientSphere CRM to MonsterASP Windows IIS hosting.

---

## Table of Contents
1. [Prerequisites](#1-prerequisites)
2. [Prepare Your Production Environment](#2-prepare-your-production-environment)
3. [Backend Deployment](#3-backend-deployment)
4. [Frontend Deployment](#4-frontend-deployment)
5. [Database Setup](#5-database-setup)
6. [SSL Configuration](#6-ssl-configuration)
7. [Stripe Webhook Setup](#7-stripe-webhook-setup)
8. [Post-Deployment Testing](#8-post-deployment-testing)
9. [Troubleshooting](#9-troubleshooting)
10. [Monitoring & Maintenance](#10-monitoring--maintenance)

---

## 1. Prerequisites

### What You Need Before Starting

- **MonsterASP Account** with IIS hosting plan
- **Domain Name** pointed to MonsterASP server (e.g., `your-domain.com`)
- **PostgreSQL Database** (external or managed service like Supabase, Neon, or Azure Database)
- **Stripe Account** with production mode enabled
- **Local Development Environment** with:
  - .NET 10.0 SDK (or your target version)
  - Node.js 18+ and npm
  - Git

### MonsterASP Server Requirements

- Windows Server 2019 or later
- IIS 10.0 or later
- .NET Hosting Bundle installed (matches your .NET version)
- ASP.NET Core Module V2
- URL Rewrite Module installed

---

## 2. Prepare Your Production Environment

### Step 2.1: Generate Production Secrets

#### Generate JWT Secret (≥64 characters)
```powershell
# PowerShell - Generate secure JWT secret
$bytes = New-Object byte[] 64
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
$jwtSecret = [System.Convert]::ToBase64String($bytes)
Write-Output $jwtSecret
```

**Save this secret securely** - you'll need it for the environment variables.

#### Get Production Stripe Keys
1. Log in to [Stripe Dashboard](https://dashboard.stripe.com)
2. Switch to **Production Mode** (toggle in top-right)
3. Go to **Developers → API keys**
4. Copy:
   - **Secret Key** (starts with `sk_live_`)
   - **Publishable Key** (starts with `pk_live_`)

### Step 2.2: Update Frontend Environment File

Edit `clientsphere-web/.env.production`:

```env
# Replace with your actual production domain
VITE_API_URL=https://your-domain.com
```

**Important**: Use `https://` not `http://`

### Step 2.3: Build Frontend for Production

```powershell
cd d:\Projects\ClientSphere\clientsphere-web
npm run build
```

Verify the build succeeded and `dist/` folder was created.

### Step 2.4: Publish Backend for Production

```powershell
cd d:\Projects\ClientSphere\ClientSphere.API
dotnet publish -c Release -o publish
```

Verify publish output:
```powershell
# Check for required files
Test-Path publish\ClientSphere.API.dll        # Should be True
Test-Path publish\web.config                  # Should be True
Test-Path publish\Models\lead_model.onnx      # Should be True
Test-Path publish\Models\sentiment_model.onnx # Should be True
Test-Path publish\Models\vectorizer.onnx      # Should be True
```

---

## 3. Backend Deployment

### Step 3.1: Upload Files to MonsterASP

#### Using FTP (FileZilla or similar):
1. Connect to your MonsterASP FTP server
2. Navigate to your site root (usually `D:\home\site\wwwroot\`)
3. Create folder structure:
   ```
   D:\home\site\wwwroot\
   ├── api\          ← Backend goes here
   └── web\          ← Frontend goes here
   ```

4. Upload **contents of `publish/` folder** to `D:\home\site\wwwroot\api\`

   **Do NOT upload the `publish` folder itself** - upload its contents!

   Expected structure:
   ```
   D:\home\site\wwwroot\api\
   ├── ClientSphere.API.dll
   ├── web.config
   ├── appsettings.json
   ├── appsettings.Production.json
   ├── Models\
   │   ├── lead_model.onnx
   │   ├── sentiment_model.onnx
   │   └── vectorizer.onnx
   ├── wwwroot\
   └── ... (other DLLs and files)
   ```

#### Using MonsterASP Control Panel:
1. Log in to MonsterASP control panel
2. Go to **File Manager**
3. Navigate to `D:\home\site\wwwroot\api\`
4. Use the upload feature to upload all files from your `publish/` folder

### Step 3.2: Configure IIS Application Pool

1. **Log in to MonsterASP Control Panel**
2. Go to **IIS Manager** or **Application Pools**
3. Create new Application Pool:
   - **Name**: `ClientSphereAPI`
   - **.NET CLR Version**: `No Managed Code` ⚠️ (Critical!)
   - **Managed Pipeline Mode**: `Integrated`
   - **Start Mode**: `AlwaysRunning` (if available)

   **Why "No Managed Code"?** ASP.NET Core runs as a separate process (kestrel), IIS just proxies requests.

### Step 3.3: Create IIS Application

1. In IIS Manager, expand **Sites → Default Web Site**
2. Right-click → **Add Application**
3. Configure:
   - **Alias**: `api` (your API will be at `https://your-domain.com/api`)
   - **Application Pool**: `ClientSphereAPI`
   - **Physical Path**: `D:\home\site\wwwroot\api`

4. Click **OK**

### Step 3.4: Set Environment Variables

In MonsterASP Control Panel, go to **Configuration → Environment Variables** (or similar section).

Add these variables **one by one**:

```
Name: ASPNETCORE_ENVIRONMENT
Value: Production
```

```
Name: ConnectionStrings__DefaultConnection
Value: Host=YOUR_DB_HOST.postgres.database.azure.com;Port=5432;Database=ClientSphereDB;Username=YOUR_USER@YOUR_SERVER;Password=YOUR_STRONG_PASSWORD;SSL Mode=Require;Timeout=30;Command Timeout=120
```

**Important Notes for Connection String:**
- Replace `YOUR_DB_HOST` with your PostgreSQL server hostname
- Replace `YOUR_USER@YOUR_SERVER` with your full username (Azure requires `user@server` format)
- Replace `YOUR_STRONG_PASSWORD` with your database password
- `SSL Mode=Require` is mandatory for production
- `Timeout=30` sets connection timeout
- `Command Timeout=120` sets query timeout (2 minutes)

```
Name: Jwt__Secret
Value: <Your 64+ character JWT secret from Step 2.1>
```

```
Name: Stripe__SecretKey
Value: sk_live_YOUR_PRODUCTION_STRIPE_SECRET_KEY
```

```
Name: Stripe__WebhookSecret
Value: whsec_YOUR_WEBHOOK_SECRET (we'll set this in Step 7)
```

```
Name: Cors__AllowedOrigins__0
Value: https://your-domain.com
```

```
Name: Cors__AllowedOrigins__1
Value: https://www.your-domain.com
```

**Important CORS Notes:**
- Include BOTH domain variants (with and without www)
- Use `https://` not `http://`
- No trailing slashes

### Step 3.5: Configure Logging Directory

Ensure the log directory exists and is writable:

1. In MonsterASP File Manager, navigate to `D:\home\`
2. Create folder `LogFiles` if it doesn't exist
3. Set permissions:
   - Right-click `LogFiles` → Properties → Security
   - Add `IIS_IUSRS` user with **Write** permission
   - Or add `IUSR` with **Write** permission

Application logs will be written to:
- `D:\home\LogFiles\clientsphere-20260429.txt` (daily rolling logs)
- `D:\home\LogFiles\stdout_*.log` (ASP.NET Core module logs)

### Step 3.6: Test Backend Health Check

Before proceeding, verify the backend is running:

1. Open browser and navigate to:
   ```
   https://your-domain.com/api/v1/health
   ```

2. **Expected Response** (HTTP 200):
   ```json
   {
     "status": "healthy",
     "timestamp": "2026-04-29T12:00:00+00:00"
   }
   ```

3. **If you get an error:**
   - Check `D:\home\LogFiles\stdout_*.log` for startup errors
   - Verify all environment variables are set correctly
   - Ensure Application Pool is using `.NET CLR Version: No Managed Code`
   - Check that `web.config` exists in the api folder

---

## 4. Frontend Deployment

### Step 4.1: Upload Frontend Files

Upload **contents of `dist/` folder** to `D:\home\site\wwwroot\web\`

Expected structure:
```
D:\home\site\wwwroot\web\
├── index.html
├── favicon.svg
├── assets\
│   ├── index-CAjOZfHP.js
│   ├── index-C2PNfIqQ.css
│   └── ... (other assets)
└── ... (other static files)
```

### Step 4.2: Create Frontend web.config

Create a file named `web.config` in `D:\home\site\wwwroot\web\` with this content:

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <!-- SPA Routing: Rewrite all non-file requests to index.html -->
        <rule name="SPA Routes" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
            <add input="{REQUEST_URI}" pattern="^/api/" negate="true" />
          </conditions>
          <action type="Rewrite" url="/" />
        </rule>
      </rules>
    </rewrite>
    
    <staticContent>
      <!-- Add MIME types for common file types -->
      <mimeMap fileExtension=".json" mimeType="application/json" />
      <mimeMap fileExtension=".woff" mimeType="font/woff" />
      <mimeMap fileExtension=".woff2" mimeType="font/woff2" />
      <mimeMap fileExtension=".ttf" mimeType="font/ttf" />
      <mimeMap fileExtension=".svg" mimeType="image/svg+xml" />
    </staticContent>
    
    <!-- Enable compression for better performance -->
    <urlCompression doStaticCompression="true" doDynamicCompression="true" />
  </system.webServer>
</configuration>
```

This configuration:
- Enables React Router (SPA routing)
- Prevents API calls from being rewritten to index.html
- Adds proper MIME types for fonts and assets
- Enables gzip compression

### Step 4.3: Create IIS Site for Frontend

1. In IIS Manager, right-click **Sites** → **Add Website**
2. Configure:
   - **Site name**: `ClientSphereWeb`
   - **Physical path**: `D:\home\site\wwwroot\web`
   - **Type**: `https`
   - **IP address**: `All Unassigned`
   - **Port**: `443`
   - **Host name**: `your-domain.com`

3. Click **OK**

4. Add another binding for `www.your-domain.com`:
   - Right-click site → **Edit Bindings**
   - Add binding with host name: `www.your-domain.com`

### Step 4.4: Test Frontend

Open browser and navigate to:
```
https://your-domain.com
```

You should see the ClientSphere login page.

**If you get a blank page:**
- Open browser DevTools (F12) → Console tab
- Check for JavaScript errors
- Verify `.env.production` has correct `VITE_API_URL`
- Ensure frontend was rebuilt after setting the URL

---

## 5. Database Setup

### Step 5.1: Create PostgreSQL Database

**Option A: Using Supabase (Recommended for ease)**
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Go to **Project Settings → Database**
4. Copy connection string

**Option B: Using Azure Database for PostgreSQL**
1. Go to Azure Portal
2. Create **Azure Database for PostgreSQL - Flexible Server**
3. Configure:
   - Server name: `clientsphere-db`
   - Region: Same as MonsterASP server (for low latency)
   - PostgreSQL version: 14 or higher
   - Compute + Storage: Basic tier (upgrade as needed)
4. Enable **Public Access** with your MonsterASP server IP
5. Set admin username and password

**Option C: Using Your Own PostgreSQL Server**
- Ensure PostgreSQL 14+ is installed
- Create database: `CREATE DATABASE ClientSphereDB;`
- Create user with appropriate permissions

### Step 5.2: Run Database Migrations

From your **local development machine**:

```powershell
cd d:\Projects\ClientSphere

# Run migrations against production database
dotnet ef database update `
  --project ClientSphere.Infrastructure `
  --startup-project ClientSphere.API `
  --connection "Host=YOUR_DB_HOST;Port=5432;Database=ClientSphereDB;Username=YOUR_USER;Password=YOUR_PASSWORD;SSL Mode=Require"
```

**Verify Migration Success:**
```sql
-- Connect to your production database and run:
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
```

You should see tables like:
- `tenants`
- `users`
- `leads`
- `customers`
- `contacts`
- `opportunities`
- `tickets`
- `marketing_campaigns`
- `invoices`
- `__efmigrationshistory`

### Step 5.3: Verify Enum Types

PostgreSQL enums must be created correctly:

```sql
-- Check enum types exist
SELECT typname FROM pg_type WHERE typtype = 'e';
```

Expected enums:
- `rbac_role`
- `tenant_status`
- `subscription_tier`
- `ticket_priority`
- `ticket_status`
- `opportunity_stage`
- `campaign_status`
- `lead_status`
- `invoice_status`
- `ai_sentiment_label`

---

## 6. SSL Configuration

### Step 6.1: Obtain SSL Certificate

**Option A: Let's Encrypt (Free - Recommended)**

Using MonsterASP Control Panel:
1. Go to **SSL/TLS Certificates**
2. Click **Add Certificate**
3. Select **Let's Encrypt**
4. Enter domains:
   - `your-domain.com`
   - `www.your-domain.com`
5. Complete domain verification (usually automatic)
6. Click **Install**

**Option B: Purchase SSL Certificate**
1. Buy from Certificate Authority (GoDaddy, Namecheap, etc.)
2. Generate CSR in IIS Manager
3. Submit CSR to CA
4. Download certificate and install in IIS

### Step 6.2: Bind SSL to IIS Sites

1. In IIS Manager, select **ClientSphereWeb** site
2. Click **Bindings** (right panel)
3. Edit HTTPS binding:
   - Type: `https`
   - Port: `443`
   - SSL certificate: Select your certificate
   - Host name: `your-domain.com`

4. Repeat for `api` application (under Default Web Site)

### Step 6.3: Force HTTPS Redirect

Create `web.config` in `D:\home\site\wwwroot\web\` (frontend) to force HTTPS:

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <!-- Force HTTPS -->
        <rule name="Force HTTPS" stopProcessing="true">
          <match url="(.*)" />
          <conditions>
            <add input="{HTTPS}" pattern="^OFF$" />
          </conditions>
          <action type="Redirect" url="https://{HTTP_HOST}/{R:1}" redirectType="Permanent" />
        </rule>
        
        <!-- SPA Routes (existing rule) -->
        <rule name="SPA Routes" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
            <add input="{REQUEST_URI}" pattern="^/api/" negate="true" />
          </conditions>
          <action type="Rewrite" url="/" />
        </rule>
      </rules>
    </rewrite>
    <!-- ... rest of config ... -->
  </system.webServer>
</configuration>
```

### Step 6.4: Test HTTPS

Open browser and navigate to:
```
http://your-domain.com
```

It should automatically redirect to:
```
https://your-domain.com
```

---

## 7. Stripe Webhook Setup

### Step 7.1: Create Webhook Endpoint in Stripe

1. Log in to [Stripe Dashboard](https://dashboard.stripe.com)
2. Switch to **Production Mode**
3. Go to **Developers → Webhooks**
4. Click **Add endpoint**
5. Configure:
   - **Endpoint URL**: `https://your-domain.com/api/v1/webhooks/stripe`
   - **Events to send**: 
     - Select **Listen to specific events**
     - Check: `checkout.session.completed`
   - Click **Add endpoint**

6. **Copy the Signing Secret**:
   - After creating, you'll see a "Signing secret" section
   - Click **Reveal**
   - Copy the secret (starts with `whsec_`)

### Step 7.2: Update Environment Variable

In MonsterASP Control Panel, update:

```
Name: Stripe__WebhookSecret
Value: whsec_YOUR_ACTUAL_SIGNING_SECRET
```

**Important**: 
- Use the webhook signing secret, NOT the API secret key
- Restart the application after updating

### Step 7.3: Test Webhook

1. In Stripe Dashboard → Webhooks → Your endpoint
2. Click **Send test webhook**
3. Select `checkout.session.completed` event
4. Click **Send test webhook**

5. Check your application logs:
   ```
   D:\home\LogFiles\clientsphere-YYYYMMDD.txt
   ```

   You should see:
   ```
   Stripe event received: checkout.session.completed (ID: evt_xxxxx)
   ```

6. **Verify Idempotency**:
   - Send the same test webhook again
   - Logs should show: `Stripe event {EventId} already processed, skipping.`

---

## 8. Post-Deployment Testing

### Test 1: Health Check
```bash
curl https://your-domain.com/api/v1/health
```

**Expected**: HTTP 200 with `{"status":"healthy","timestamp":"..."}`

### Test 2: User Registration Flow

1. **Navigate to** `https://your-domain.com/register`
2. **Fill in registration form**:
   - Tenant name: "Test Company"
   - Tenant slug: "test-company"
   - Admin email: "admin@testcompany.com"
   - Admin password: "SecurePass123!"
3. **Click "Proceed to Payment"**
4. **Complete Stripe test checkout** (use Stripe test card: `4242 4242 4242 4242`)
5. **Verify**:
   - Webhook received (check logs)
   - Tenant created in database
   - Admin can log in

### Test 3: Login and JWT Validation

1. **Navigate to** `https://your-domain.com/login`
2. **Login** with admin credentials
3. **Open DevTools** → Application → Local Storage
4. **Verify JWT contains**:
   - `userId`
   - `role` (should be "TenantAdmin")
   - `tid` (tenant ID)

### Test 4: Multi-Tenant Isolation (CRITICAL)

1. **Create second tenant** (repeat Test 2 with different company)
2. **Login as Tenant 1 admin**
3. **Try to access Tenant 2 data**:
   - Create a lead in Tenant 1
   - Open browser DevTools → Network tab
   - Note the lead ID
   - Try to access: `GET /api/v1/leads/{tenant2-lead-id}`
4. **Expected**: 404 Not Found or empty result

### Test 5: RBAC Enforcement

1. **Login as SalesRep** (create user with SalesRep role)
2. **Try to access admin features**:
   - Navigate to `/admin/tenants`
   - Try to delete a user
3. **Expected**: 403 Forbidden or UI hides these features

### Test 6: CRUD Operations

**Create Lead:**
```bash
curl -X POST https://your-domain.com/api/v1/leads \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "company": "Example Corp"
  }'
```

**Expected**: HTTP 201 with lead data including correct `tenantId`

### Test 7: Stripe Webhook Idempotency

1. **Trigger webhook** (complete a checkout or send test webhook)
2. **Send same webhook again** (simulate Stripe retry)
3. **Expected**: 
   - Second request returns HTTP 200
   - No duplicate tenant/user created
   - Logs show "already processed, skipping"

---

## 9. Troubleshooting

### Issue: Application Won't Start

**Symptoms**: 502 Bad Gateway or 503 Service Unavailable

**Steps**:
1. **Check Event Viewer**:
   - Open Event Viewer on MonsterASP server
   - Go to **Windows Logs → Application**
   - Look for errors from `IIS AspNetCore Module V2`

2. **Check stdout logs**:
   ```powershell
   Get-Content D:\home\LogFiles\stdout_*.log -Tail 100
   ```

3. **Common causes**:
   - Wrong .NET CLR Version (must be "No Managed Code")
   - Missing environment variables
   - Database connection failure
   - Missing or invalid JWT secret

4. **Enable detailed logging temporarily**:
   - Edit `web.config`
   - Set `stdoutLogEnabled="true"`
   - Check `D:\home\LogFiles\stdout_*.log`

### Issue: Database Connection Failed

**Symptoms**: Application starts but database operations fail

**Steps**:
1. **Verify connection string**:
   - Check `ConnectionStrings__DefaultConnection` environment variable
   - Ensure SSL Mode=Require is included
   - Test connection locally:
     ```powershell
     psql -h YOUR_DB_HOST -U YOUR_USER -d ClientSphereDB
     ```

2. **Check PostgreSQL logs** for connection attempts

3. **Verify firewall rules**:
   - MonsterASP server IP must be allowed in PostgreSQL firewall
   - Port 5432 must be open

4. **Check Azure Database settings** (if using Azure):
   - "Allow public access from any Azure service" must be ON
   - Or add MonsterASP server IP to firewall rules

### Issue: CORS Errors

**Symptoms**: Browser console shows CORS policy errors

**Steps**:
1. **Verify CORS environment variables**:
   ```
   Cors__AllowedOrigins__0 = https://your-domain.com
   Cors__AllowedOrigins__1 = https://www.your-domain.com
   ```

2. **Check for trailing slashes** - they must NOT be present

3. **Verify protocol** - must be `https://` not `http://`

4. **Test with curl**:
   ```bash
   curl -H "Origin: https://your-domain.com" \
        -H "Access-Control-Request-Method: GET" \
        -X OPTIONS https://your-domain.com/api/v1/health
   ```
   
   Response should include:
   ```
   Access-Control-Allow-Origin: https://your-domain.com
   ```

### Issue: Stripe Webhook Not Working

**Symptoms**: Checkout completes but tenant not created

**Steps**:
1. **Check Stripe Dashboard → Webhooks**:
   - Verify endpoint URL is correct
   - Check for failed webhook attempts
   - View webhook logs for error messages

2. **Verify webhook secret**:
   - Ensure `Stripe__WebhookSecret` environment variable matches
   - Use the signing secret (whsec_*), not API key

3. **Check application logs**:
   ```powershell
   Get-Content D:\home\LogFiles\clientsphere-*.txt -Tail 50
   ```

4. **Test webhook manually**:
   - Use Stripe CLI: `stripe trigger checkout.session.completed`
   - Or send test webhook from Stripe Dashboard

### Issue: ONNX AI Models Not Found

**Symptoms**: AI features (lead scoring, sentiment analysis) fail

**Steps**:
1. **Verify models exist**:
   ```powershell
   Test-Path D:\home\site\wwwroot\api\Models\lead_model.onnx
   ```

2. **Check file permissions**:
   - IIS_IUSRS must have Read access to Models folder

3. **Verify web.config**:
   - Ensure it's in the api folder
   - Check `aspNetCore` element has correct `arguments`

4. **Re-upload Models folder** if missing

### Issue: Frontend Shows Blank Page

**Symptoms**: Page loads but content is empty

**Steps**:
1. **Open DevTools** (F12) → Console tab
2. **Check for errors**:
   - "VITE_API_URL is required" → Update `.env.production` and rebuild
   - CORS errors → Check backend CORS configuration
   - 404 errors → Verify `VITE_API_URL` is correct

3. **Verify SPA routing**:
   - Navigate directly to `https://your-domain.com/login`
   - If this works but `/` doesn't, check frontend `web.config` rewrite rules

4. **Clear browser cache** and reload

---

## 10. Monitoring & Maintenance

### 10.1: Log Monitoring

**Log Locations**:
- Application logs: `D:\home\LogFiles\clientsphere-YYYYMMDD.txt`
- Stdout logs: `D:\home\LogFiles\stdout_*.log`
- IIS logs: `D:\home\LogFiles\W3SVC*\u_ex*.log`

**What to Monitor**:
- **Errors**: Any log entry with `[ERR]` or `[FTL]`
- **Failed JWT validations**: Security concern
- **Stripe webhook failures**: Payment processing issues
- **Database connection errors**: Infrastructure problems
- **Tenant status blocks**: Subscription/payment issues

### 10.2: Performance Monitoring

**Use MonsterASP Control Panel** to monitor:
- CPU usage
- Memory usage
- Disk space
- Bandwidth

**Database Performance**:
```sql
-- Check slow queries (PostgreSQL)
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

### 10.3: Backup Strategy

**Database Backups**:
- Enable automatic backups in your PostgreSQL provider
- Supabase: Automatic daily backups (retain 7 days)
- Azure: Configure geo-redundant backups

**File Backups**:
- Regular backup of `D:\home\site\wwwroot\` (if you store uploads)
- Keep copies of `web.config` files

### 10.4: Update Deployment

**When deploying updates**:

1. **Backend Update**:
   ```powershell
   # Build and publish
   dotnet publish -c Release -o publish
   
   # Upload to MonsterASP
   # Stop IIS application pool
   # Replace files in D:\home\site\wwwroot\api\
   # Start application pool
   ```

2. **Frontend Update**:
   ```powershell
   # Update code
   # Rebuild
   npm run build
   
   # Upload contents of dist/ to D:\home\site\wwwroot\web\
   ```

3. **Database Migrations**:
   ```powershell
   dotnet ef database update --connection "YOUR_PRODUCTION_CONNECTION_STRING"
   ```

4. **Always test** after updates using the Post-Deployment Testing checklist

### 10.5: Security Best Practices

1. **Rotate secrets regularly**:
   - JWT secret (every 90 days)
   - Stripe keys (if compromised)
   - Database password (every 90 days)

2. **Monitor failed login attempts**:
   - Check logs for brute force attacks
   - Implement rate limiting if needed

3. **Keep dependencies updated**:
   - Regular `dotnet restore` to update NuGet packages
   - Regular `npm update` for frontend dependencies

4. **Enable HTTPS everywhere**:
   - Force HTTPS redirect (already configured)
   - Use HSTS headers (add to web.config)

5. **Regular security audits**:
   - Review logs weekly
   - Check for unusual activity
   - Verify tenant isolation still working

---

## Quick Reference

### Environment Variables Summary

| Variable | Example Value | Required |
|----------|--------------|----------|
| `ASPNETCORE_ENVIRONMENT` | `Production` | ✅ |
| `ConnectionStrings__DefaultConnection` | `Host=db.postgres.com;Port=5432;...` | ✅ |
| `Jwt__Secret` | `base64-encoded-64-bytes...` | ✅ |
| `Stripe__SecretKey` | `sk_live_abc123...` | ✅ |
| `Stripe__WebhookSecret` | `whsec_xyz789...` | ✅ |
| `Cors__AllowedOrigins__0` | `https://your-domain.com` | ✅ |
| `Cors__AllowedOrigins__1` | `https://www.your-domain.com` | ✅ |

### File Locations Summary

| File | Location |
|------|----------|
| Backend files | `D:\home\site\wwwroot\api\` |
| Frontend files | `D:\home\site\wwwroot\web\` |
| Backend web.config | `D:\home\site\wwwroot\api\web.config` |
| Frontend web.config | `D:\home\site\wwwroot\web\web.config` |
| Application logs | `D:\home\LogFiles\clientsphere-*.txt` |
| Stdout logs | `D:\home\LogFiles\stdout_*.log` |
| IIS logs | `D:\home\LogFiles\W3SVC*\` |

### Important URLs

| URL | Purpose |
|-----|---------|
| `https://your-domain.com` | Frontend application |
| `https://your-domain.com/api/v1/health` | Health check |
| `https://your-domain.com/api/v1/webhooks/stripe` | Stripe webhook |
| `https://your-domain.com/login` | Login page |
| `https://your-domain.com/register` | Registration page |

---

## Support Resources

- **MonsterASP Support**: Check their documentation or submit ticket
- **ASP.NET Core Docs**: https://docs.microsoft.com/aspnet/core
- **IIS Documentation**: https://docs.microsoft.com/iis
- **PostgreSQL Docs**: https://www.postgresql.org/docs
- **Stripe Docs**: https://stripe.com/docs

---

## Deployment Checklist (Print This)

- [ ] JWT secret generated (≥64 characters)
- [ ] Stripe production keys obtained
- [ ] Frontend `.env.production` updated
- [ ] Frontend built (`npm run build`)
- [ ] Backend published (`dotnet publish -c Release`)
- [ ] ONNX models verified in publish folder
- [ ] Files uploaded to MonsterASP
- [ ] IIS Application Pool created (No Managed Code)
- [ ] IIS Applications/Sites created
- [ ] Environment variables set
- [ ] Log directory created with write permissions
- [ ] Backend health check responds (HTTP 200)
- [ ] Frontend loads correctly
- [ ] PostgreSQL database created
- [ ] Database migrations applied
- [ ] SSL certificate installed
- [ ] HTTPS redirect working
- [ ] Stripe webhook endpoint created
- [ ] Webhook secret set in environment variables
- [ ] Webhook tested successfully
- [ ] User registration flow tested
- [ ] Login tested
- [ ] Multi-tenant isolation verified
- [ ] RBAC enforcement verified
- [ ] CRUD operations tested
- [ ] Logs verified (no errors)

---

**Deployment Date**: _______________  
**Deployed By**: _______________  
**Domain**: _______________  
**Notes**: _______________________________________________

---

## Congratulations! 🎉

Your ClientSphere CRM is now deployed to MonsterASP IIS hosting with:
- ✅ Production-ready configuration
- ✅ Secure HTTPS enforcement
- ✅ Multi-tenant isolation
- ✅ Stripe payment integration
- ✅ AI-powered features (ONNX models)
- ✅ Comprehensive logging and monitoring
- ✅ Idempotent webhook processing

For ongoing maintenance, refer to Section 10: Monitoring & Maintenance.
