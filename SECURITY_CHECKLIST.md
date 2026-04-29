#  SECURITY CHECKLIST - Before Pushing to GitHub

##  CRITICAL: Verify These Files Are NOT in Your Repository

Run this command to check what will be committed:

```powershell
cd d:\Projects\ClientSphere
git status
```

###  Files That MUST NOT Be Committed:

- [ ] `.env` or `.env.production` with real secrets
- [ ] `appsettings.json` with real database passwords
- [ ] `web.config` with real JWT/Stripe secrets
- [ ] `node_modules/` folder
- [ ] `bin/` or `obj/` folders
- [ ] `publish/` folder
- [ ] `dist/` folder
- [ ] `logs/` folder
- [ ] `.vs/` folder
- [ ] Any `.user` files

---

##  How to Check If Sensitive Files Are Already in Git

```powershell
# Check if sensitive files are tracked
git ls-files | Select-String "appsettings.json"
git ls-files | Select-String "web.config"
git ls-files | Select-String ".env"
```

**If you see files listed**, they're already in Git and need to be removed!

---

##  How to Remove Accidentally Committed Sensitive Files

```powershell
# Remove from Git tracking (but keep local files)
git rm --cached ClientSphere.API/appsettings.json
git rm --cached ClientSphere.API/web.config
git rm --cached clientsphere-web/.env.production

# Commit the removal
git commit -m "Remove sensitive configuration files from Git"

# Verify they're removed
git status
```

**WARNING**: This only removes from Git tracking. If you already pushed to GitHub, the files are still in Git history!

---

##  Complete Git History Cleanup (If Secrets Were Pushed)

If you accidentally committed secrets and pushed to GitHub:

###  Option 1: Use BFG Repo-Cleaner (Easiest)

1. Download BFG: https://rtyley.github.io/bfg-repo-cleaner/
2. Run:
   ```powershell
   java -jar bfg.jar --delete-files appsettings.json
   java -jar bfg.jar --delete-files web.config
   java -jar bfg.jar --delete-files .env
   ```
3. Force push:
   ```powershell
   git push --force
   ```

###  Option 2: Create New Repository (Safest)

1. Create a new GitHub repository
2. Copy only safe files:
   ```powershell
   # Create temp folder
   mkdir ..\ClientSphere-Safe
   cd ..\ClientSphere-Safe
   
   # Copy source code only
   Copy-Item -Path "..\ClientSphere\*" -Destination . -Recurse -Exclude @("bin","obj","node_modules",".vs","logs","publish","dist")
   
   # Initialize new repo
   git init
   git add .
   git commit -m "Initial commit - clean repo"
   git remote add origin https://github.com/YOUR_USERNAME/ClientSphere.git
   git push -u origin main
   ```

---

##  Safe Files to Commit

### ✅ These Are Safe to Commit:

- [ ] Source code (`.cs`, `.tsx`, `.ts`, `.js`, `.css`)
- [ ] Project files (`.csproj`, `.slnx`, `.sln`)
- [ ] `package.json` (without scripts that contain secrets)
- [ ] `.gitignore` ✅ (this file itself!)
- [ ] `deploy.cmd` (deployment script)
- [ ] `.deployment` (deployment config)
- [ ] Documentation (`.md` files)
- [ ] `web.config.example` (template with placeholders)
- [ ] Migration files (`Migrations/*.cs`)
- [ ] `vite.config.ts`
- [ ] `tailwind.config.js`

### ❌ These Are NOT Safe to Commit:

- [ ] `.env*` files (except `.env.example` with placeholders)
- [ ] `appsettings.json` (use `appsettings.json.example`)
- [ ] `web.config` (use `web.config.example`)
- [ ] `*.user` files
- [ ] `bin/`, `obj/`, `node_modules/`
- [ ] `logs/` folder
- [ ] SSL certificates
- [ ] Personal access tokens
- [ ] API keys

---

##  Verify .gitignore is Working

```powershell
# Test if files are being ignored
git check-ignore -v bin/
git check-ignore -v obj/
git check-ignore -v node_modules/
git check-ignore -v .env
git check-ignore -v .env.production
```

**Expected output**: Should show the `.gitignore` rule that's ignoring each file.

---

##  Create Example Configuration Files

Create safe template files with placeholder values:

### appsettings.json.example

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=YOUR_HOST;Port=5432;Database=YOUR_DB;Username=YOUR_USER;Password=YOUR_PASSWORD"
  },
  "Jwt": {
    "Secret": "YOUR_64_CHAR_JWT_SECRET",
    "Issuer": "clientsphere-api",
    "Audience": "clientsphere-client"
  },
  "Stripe": {
    "SecretKey": "sk_live_YOUR_STRIPE_KEY",
    "WebhookSecret": "whsec_YOUR_WEBHOOK_SECRET"
  }
}
```

### .env.example

```env
# Frontend environment variables (template)
# Copy to .env.production and fill in real values
VITE_API_URL=https://clientsphere.runasp.net
```

---

##  Final Pre-Push Checklist

Before running `git push origin main`:

- [ ] Run `git status` and review all files
- [ ] Verify NO sensitive files are staged
- [ ] Verify `.gitignore` is committed
- [ ] Verify `web.config.example` exists (safe template)
- [ ] Verify `appsettings.json` has ONLY placeholder values
- [ ] Check `.env.production` is NOT staged
- [ ] Check `node_modules/` is NOT staged
- [ ] Check `bin/` and `obj/` are NOT staged

---

##  Commands to Run Before Pushing

```powershell
cd d:\Projects\ClientSphere

# 1. Check status
git status

# 2. Check what will be committed
git diff --cached --name-only

# 3. Verify .gitignore works
git check-ignore -v .env
git check-ignore -v bin/
git check-ignore -v node_modules/

# 4. If everything looks good, commit
git add .
git commit -m "Your commit message"

# 5. Double-check before pushing
git log --oneline -5

# 6. Push to GitHub
git push origin main
```

---

##  After Pushing to GitHub

### Verify Your Repository is Clean

1. Go to your GitHub repository in browser
2. Check the file list - should NOT see:
   - `.env` files
   - `bin/` folder
   - `obj/` folder
   - `node_modules/` folder
   - `logs/` folder

### If You See Sensitive Files on GitHub

**IMMEDIATELY**:
1. Change all passwords/secrets that were exposed
2. Rotate API keys (Stripe, JWT, etc.)
3. Follow "Complete Git History Cleanup" above
4. Never use those secrets again!

---

##  Best Practices Going Forward

1. **Always check `git status`** before committing
2. **Use `.env.example`** for sharing configuration templates
3. **Never commit real secrets** - use environment variables
4. **Rotate secrets regularly** (every 90 days)
5. **Use GitHub Secrets** for CI/CD pipelines
6. **Enable secret scanning** in GitHub repository settings

---

##  Enable GitHub Secret Scanning

1. Go to GitHub → Your Repository → Settings
2. Security & analysis
3. Enable:
   - ✅ Secret scanning
   - ✅ Push protection
   - ✅ Dependabot alerts

This will prevent you from accidentally pushing secrets!

---

##  Quick Reference

### Check if file is ignored:
```powershell
git check-ignore -v <filename>
```

### Remove file from Git (keep locally):
```powershell
git rm --cached <filename>
```

### See what will be committed:
```powershell
git status
git diff --cached
```

### Remove sensitive file from Git history:
```powershell
# Using BFG (recommended)
java -jar bfg.jar --delete-files <filename>
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force
```

---

**Remember**: Once secrets are on GitHub, they're compromised even if you delete them later!
