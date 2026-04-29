# ClientSphere Production Deployment Checklist - MonsterASP IIS

## Pre-Deployment Verification

### Backend Build Verification
- [x] Backend builds successfully in Release mode
- [x] ONNX models present in publish folder:
  - [x] `publish\Models\lead_model.onnx`
  - [x] `publish\Models\sentiment_model.onnx`
  - [x] `publish\Models\vectorizer.onnx`
- [x] `publish\web.config` exists
- [x] All DLLs present in publish folder

### Frontend Build Verification
- [x] Frontend builds successfully (`npm run build`)
- [x] `dist/` folder created with production build
- [x] Environment validation in place (fails if VITE_API_URL missing in production)

### Security Fixes Implemented
- [x] Health check endpoint added: `/api/v1/health`
- [x] Stripe webhook idempotency protection (event ID caching for 7 days)
- [x] ONNX models configured to copy to publish output
- [x] Production configuration file created: `appsettings.Production.json`
- [x] IIS web.config created with MonsterASP-compatible log paths
- [x] Frontend API URL validation added (throws error if missing in production)
- [x] Database connection string includes `SSL Mode=Prefer;Timeout=30`
- [x] CORS configuration supports multiple domain variants
- [x] DevSeeder protected by `IsDevelopment()` check

---

## MonsterASP Deployment Steps

### Step 1: Backend Deployment

1. **Upload `/publish` folder** to MonsterASP via FTP/cPanel:
   - Target path: `D:\home\site\wwwroot\api` (or your configured path)
   - Ensure all files are uploaded (DLLs, web.config, Models folder, etc.)

2. **Configure IIS Application:**
   - Create Application Pool:
     - Name: `ClientSphereAPI`
     - .NET CLR Version: **No Managed Code**
     - Managed Pipeline Mode: Integrated
   - Create Application:
     - Alias: `api` (or your preferred path)
     - Physical path: `D:\home\site\wwwroot\api\publish`
     - Application pool: `ClientSphereAPI`

3. **Set Environment Variables** (via MonsterASP Control Panel):
   
   ```
   ASPNETCORE_ENVIRONMENT = Production
   
   ConnectionStrings__DefaultConnection = Host=YOUR_DB_HOST;Port=5432;Database=ClientSphereDB;Username=YOUR_USER;Password=YOUR_PASSWORD;SSL Mode=Require;Timeout=30
   
   Jwt__Secret = YOUR_64_CHARACTER_OR_LONGER_SECRET_KEY_HERE
   
   Stripe__SecretKey = sk_live_YOUR_PRODUCTION_STRIPE_SECRET_KEY
   
   Stripe__WebhookSecret = whsec_YOUR_PRODUCTION_WEBHOOK_SECRET
   
   Cors__AllowedOrigins__0 = https://your-domain.com
   Cors__AllowedOrigins__1 = https://www.your-domain.com
   ```

   **IMPORTANT NOTES:**
   - JWT Secret must be at least 64 characters
   - Use production Stripe keys (sk_live_*, not sk_test_*)
   - Include BOTH domain variants in CORS (with and without www.)
   - Connection string includes `SSL Mode=Require` for secure DB connection

4. **Configure Stripe Webhook:**
   - Go to Stripe Dashboard → Developers → Webhooks
   - Add endpoint: `https://your-domain.com/api/v1/webhooks/stripe`
   - Select events: `checkout.session.completed`
   - Copy the webhook signing secret to `Stripe__WebhookSecret` environment variable

5. **Verify Logs Directory:**
   - Ensure `D:\home\LogFiles\` exists and is writable
   - Application will log to: `D:\home\LogFiles\clientsphere-YYYYMMDD.txt`
   - Stdout logs: `D:\home\LogFiles\stdout_*.log`

---

### Step 2: Frontend Deployment

**Option A: MonsterASP Static Hosting**
1. Upload contents of `dist/` folder to static hosting root
2. Configure SPA routing (rewrite rules for `index.html`)

**Option B: IIS Static File Serving (Recommended)**
1. Create separate IIS site for frontend:
   - Site name: `ClientSphereWeb`
   - Physical path: `D:\home\site\wwwroot\web`
   - Port: 80 (HTTP) and 443 (HTTPS)
   - Host name: `your-domain.com` and `www.your-domain.com`

2. Upload contents of `dist/` folder to `D:\home\site\wwwroot\web`

3. Create `web.config` in `D:\home\site\wwwroot\web`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
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
      <mimeMap fileExtension=".json" mimeType="application/json" />
      <mimeMap fileExtension=".woff" mimeType="font/woff" />
      <mimeMap fileExtension=".woff2" mimeType="font/woff2" />
    </staticContent>
    <httpRedirect enabled="false" />
  </system.webServer>
</configuration>
```

4. **Update `.env.production`** before building:
   - Edit `clientsphere-web\.env.production`
   - Replace `https://your-domain.com` with your actual production URL
   - Rebuild: `npm run build`
   - Upload new `dist/` contents

---

### Step 3: SSL Configuration

1. **Obtain SSL Certificate:**
   - Use Let's Encrypt (free) via MonsterASP control panel
   - Or purchase from certificate authority

2. **Bind SSL to IIS Sites:**
   - Backend API site: Port 443 with SSL certificate
   - Frontend site: Port 443 with SSL certificate
   - Enable HTTPS redirect for both sites

3. **Verify HTTPS:**
   - Access `https://your-domain.com` → should load frontend
   - Access `https://your-domain.com/api/v1/health` → should return health check

---

### Step 4: Database Migration

**Run migrations against production PostgreSQL:**

```powershell
cd d:\Projects\ClientSphere
dotnet ef database update --project ClientSphere.Infrastructure --startup-project ClientSphere.API --connection "Host=YOUR_DB_HOST;Port=5432;Database=ClientSphereDB;Username=YOUR_USER;Password=YOUR_PASSWORD;SSL Mode=Require"
```

**Verify:**
- All tables created successfully
- Enum types mapped correctly (rbac_role, tenant_status, etc.)
- No data loss (if upgrading existing database)

---

## Post-Deployment Testing

### 1. Health Check
```bash
curl https://your-domain.com/api/v1/health
```
**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-04-29T12:00:00+00:00"
}
```

### 2. Authentication Flow
- [ ] Register new tenant → Stripe checkout → Webhook → Tenant created
- [ ] Login with admin credentials
- [ ] Verify JWT contains: `userId`, `role`, `tid` (tenant ID)
- [ ] Access protected endpoint → 200 OK
- [ ] Expired token → 401 Unauthorized

### 3. RBAC Enforcement
- [ ] Login as `SalesRep` → Access sales endpoints → 200 OK
- [ ] Login as `SalesRep` → Access admin endpoints → 403 Forbidden
- [ ] Verify UI hides unauthorized features

### 4. Multi-Tenant Isolation (CRITICAL)
- [ ] Create two tenants (TenantA, TenantB)
- [ ] Login as TenantA user
- [ ] Attempt to access TenantB resources via API
- [ ] **Expected**: Returns empty or 404 (query filters enforce isolation)
- [ ] Verify in database: No cross-tenant queries logged

### 5. CRUD Operations
- [ ] Create lead → Verify in database with correct `TenantId`
- [ ] Update customer → Verify audit fields (`UpdatedAt`, `UpdatedBy`)
- [ ] Delete contact → Verify soft delete (`IsDeleted = true`)

### 6. Stripe Integration
- [ ] Complete checkout → Webhook received → Tenant status = Active
- [ ] Invalid webhook signature → 400 Bad Request
- [ ] Missing webhook secret → 400 Bad Request
- [ ] **Duplicate webhook retry** → 200 OK (idempotency check prevents duplicate processing)
- [ ] Verify Stripe event ID cached after first processing

### 7. Error Handling
- [ ] Invalid request → 400 Bad Request with validation errors
- [ ] Not found → 404 Not Found
- [ ] Server error → 500 Internal Server Error (no stack traces in production)

---

## Monitoring & Logging

### Log Files Location
- Application logs: `D:\home\LogFiles\clientsphere-YYYYMMDD.txt`
- Stdout logs: `D:\home\LogFiles\stdout_*.log`
- IIS logs: `D:\home\LogFiles\W3SVC*\`

### Log Contents
Each log entry includes:
- Timestamp
- Log level (Warning, Error, etc.)
- Source context (class name)
- TenantId
- UserId
- Message
- Exception details (if error)

### Set Up Alerts For
- 500 errors (immediate notification)
- Failed JWT validations
- Stripe webhook failures
- Tenant status blocks
- Database connection failures

---

## Troubleshooting

### Issue: Application fails to start
**Check:**
1. Event Viewer → Windows Logs → Application
2. Stdout logs: `D:\home\LogFiles\stdout_*.log`
3. Verify environment variables are set correctly
4. Verify .NET Hosting Bundle is installed

### Issue: Database connection fails
**Check:**
1. Connection string is correct (host, port, database, credentials)
2. PostgreSQL firewall allows connections from MonsterASP server
3. SSL Mode is set correctly (Require or Prefer)
4. Test connection locally: `psql -h YOUR_DB_HOST -U YOUR_USER -d ClientSphereDB`

### Issue: CORS errors
**Check:**
1. `Cors__AllowedOrigins__0` matches exact frontend URL (including https://)
2. `Cors__AllowedOrigins__1` includes www. variant if applicable
3. Browser console for specific CORS error message

### Issue: Stripe webhook not working
**Check:**
1. Webhook endpoint is publicly accessible: `https://your-domain.com/api/v1/webhooks/stripe`
2. `Stripe__WebhookSecret` environment variable is set
3. Stripe dashboard shows webhook events being sent
4. Check application logs for webhook processing errors

### Issue: ONNX models missing
**Check:**
1. Models folder exists in publish: `publish\Models\`
2. All three .onnx files are present
3. Csproj includes: `<None Include="Models\**\*.*" CopyToOutputDirectory="PreserveNewest" />`

---

## Production Configuration Summary

### Files Created/Modified
1. `ClientSphere.API/appsettings.Production.json` - Production configuration template
2. `ClientSphere.API/web.config` - IIS ASP.NET Core Module configuration
3. `ClientSphere.API/Program.cs` - Added health check endpoint
4. `ClientSphere.API/ClientSphere.API.csproj` - ONNX models copy configuration
5. `ClientSphere.API/Controllers/StripeWebhookController.cs` - Idempotency protection
6. `clientsphere-web/.env.production` - Frontend production environment
7. `clientsphere-web/src/lib/api.ts` - API URL validation

### Environment Variables Required
```bash
# Backend (MonsterASP Panel)
ASPNETCORE_ENVIRONMENT=Production
ConnectionStrings__DefaultConnection=Host=...;SSL Mode=Require;Timeout=30
Jwt__Secret=<64+ character secret>
Stripe__SecretKey=sk_live_...
Stripe__WebhookSecret=whsec_...
Cors__AllowedOrigins__0=https://your-domain.com
Cors__AllowedOrigins__1=https://www.your-domain.com

# Frontend (.env.production)
VITE_API_URL=https://your-domain.com
```

---

## Final Confirmation Checklist

- [x] Backend published with all required files
- [x] Frontend built with production environment
- [x] Health check endpoint accessible
- [x] ONNX models present in publish output
- [x] Stripe webhook idempotency implemented
- [x] Database connection string includes SSL Mode
- [x] CORS configured for multiple domain variants
- [x] IIS web.config created
- [x] Production configuration files created
- [ ] Environment variables set in MonsterASP panel
- [ ] SSL certificate configured
- [ ] Database migrations applied
- [ ] All post-deployment tests passed
- [ ] Monitoring and alerts configured

---

## Deployment Date: _______________
## Deployed By: _______________
## Notes: _______________________________________________
