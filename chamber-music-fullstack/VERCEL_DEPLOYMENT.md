# 🚀 Vercel Deployment Guide

**HarmonyForge - Full-Stack Deployment on Vercel**

---

## ✅ Overview

This application is now configured to deploy to Vercel with **full backend and frontend integration**. The backend runs as **Vercel Serverless Functions** while the frontend is served as a static React app.

---

## 📊 Architecture

### Production Architecture (Vercel)

```
User Browser
    ↓
Vercel CDN (Frontend)
    ↓ /api/harmonize
Vercel Serverless Function (Backend)
    ↓
Harmonization Engine
    ↓ Response
User Browser
```

### Development Architecture (Local)

```
User Browser
    ↓ http://localhost:5174
Vite Dev Server (Frontend)
    ↓ http://localhost:3001/api/harmonize
Express Server (Backend)
    ↓
Harmonization Engine
    ↓ Response
User Browser
```

---

## 🔧 Configuration Files

### 1. `/vercel.json` - Main Vercel Configuration

```json
{
  "version": 2,
  "buildCommand": "cd frontend && npm install && npx vite build",
  "outputDirectory": "frontend/dist",
  "functions": {
    "api/**/*.js": {
      "maxDuration": 60,
      "memory": 1024
    }
  },
  "rewrites": [
    {
      "source": "/api/harmonize",
      "destination": "/api/harmonize.js"
    },
    {
      "source": "/health",
      "destination": "/api/health.js"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**Key Settings:**
- `maxDuration: 60` - Allows up to 60 seconds for harmonization processing
- `memory: 1024` - Allocates 1GB RAM for serverless functions
- Rewrites route API calls to serverless functions
- SPA routing: all other routes serve `index.html`

### 2. `/api/harmonize.js` - Main API Endpoint

Serverless function that:
- ✅ Accepts `multipart/form-data` file uploads
- ✅ Validates file types (MusicXML only)
- ✅ Processes harmonization requests
- ✅ Returns harmony-only and combined MusicXML
- ✅ Handles CORS automatically
- ✅ Provides error handling and metadata

### 3. `/api/health.js` - Health Check Endpoint

Simple health check for monitoring:
- ✅ Returns service status
- ✅ Provides timestamp
- ✅ Confirms platform (Vercel)

### 4. `/frontend/src/services/api.ts` - Smart API Client

Automatically detects environment:

```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD ? '' : 'http://localhost:3001');
```

**Behavior:**
- **Production**: Uses relative paths (`/api/harmonize`)
- **Development**: Uses `http://localhost:3001/api/harmonize`
- **Override**: Set `VITE_API_URL` environment variable

---

## 🚀 Deployment Steps

### Step 1: Connect to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click **"Add New Project"**
4. Import your repository: `chamber-music-fullstack`

### Step 2: Configure Project

**Framework Preset:** `Other` (we have custom config)

**Root Directory:** `.` (project root)

**Build Settings:**
- **Build Command:** `cd frontend && npm install && npx vite build` (auto-configured)
- **Output Directory:** `frontend/dist` (auto-configured)
- **Install Command:** `npm install --include=dev` (auto-configured)

### Step 3: Environment Variables (Optional)

No environment variables are required! The app works out of the box.

**Optional Variables:**
- `NODE_ENV=production` (automatically set by Vercel)
- `VITE_API_URL` (override API URL if needed)

### Step 4: Deploy

Click **"Deploy"**

Vercel will:
1. ✅ Clone your repository
2. ✅ Install dependencies
3. ✅ Build the frontend (`npm run build`)
4. ✅ Set up serverless functions from `/api/`
5. ✅ Deploy to CDN
6. ✅ Provide a production URL

**Deployment Time:** ~2-3 minutes

### Step 5: Verify Deployment

Test your deployment:

```bash
# Health check
curl https://your-app.vercel.app/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2025-11-19T...",
  "service": "HarmonyForge Backend",
  "environment": "production",
  "platform": "vercel"
}
```

Open your app:
```
https://your-app.vercel.app
```

---

## 🧪 Testing the Deployment

### 1. Upload a Test File

1. Open your Vercel URL
2. Upload `test-melody.musicxml`
3. Select instruments (e.g., Violin, Viola, Cello)
4. Click **"Harmonize"**

**Expected:**
- ✅ File uploads successfully
- ✅ Processing screen appears
- ✅ Results display in ~5-15 seconds
- ✅ Both harmony-only and combined scores available

### 2. Check Console Logs

In Vercel Dashboard:
1. Go to your project
2. Click **"Functions"** tab
3. View logs for `/api/harmonize`

**Expected Logs:**
```
[Harmonize] Processing file: test-melody.musicxml
[Harmonize] Instruments: Violin, Viola, Cello
[Harmonize] File size: 12.34 KB
[Harmonize] Success in 8432ms
```

### 3. Monitor Performance

In Vercel Dashboard:
1. Click **"Analytics"** tab
2. View function execution times
3. Check for errors

**Expected Performance:**
- **Small files** (<50KB): 3-8 seconds
- **Medium files** (50-200KB): 8-20 seconds
- **Large files** (200KB-5MB): 20-45 seconds

---

## 🔍 Troubleshooting

### Issue: "Cannot connect to backend server"

**Cause:** API route not configured properly

**Solution:**
1. Check `vercel.json` rewrites
2. Verify `/api/harmonize.js` exists
3. Check Vercel function logs

### Issue: "File upload error"

**Cause:** File size too large or invalid format

**Solution:**
- Maximum file size: 50MB
- Accepted formats: `.xml`, `.musicxml`
- Check file MIME type

### Issue: "Function timeout"

**Cause:** Processing takes longer than 60 seconds

**Solutions:**
1. Increase `maxDuration` in `vercel.json`:
   ```json
   "functions": {
     "api/**/*.js": {
       "maxDuration": 300  // 5 minutes (Pro plan)
     }
   }
   ```
2. Upgrade to Vercel Pro for longer timeouts
3. Optimize harmonization algorithm

### Issue: "Memory limit exceeded"

**Cause:** Large file processing uses too much RAM

**Solutions:**
1. Increase memory allocation:
   ```json
   "functions": {
     "api/**/*.js": {
       "memory": 3008  // 3GB (Pro plan)
     }
   }
   ```
2. Upgrade to Vercel Pro
3. Implement streaming processing

### Issue: API works locally but not on Vercel

**Debugging Steps:**

1. **Check Vercel Logs:**
   ```
   Dashboard → Project → Functions → View Logs
   ```

2. **Test API Directly:**
   ```bash
   curl -X POST https://your-app.vercel.app/api/harmonize \
     -F "file=@test-melody.musicxml" \
     -F "instruments=Violin,Viola,Cello"
   ```

3. **Verify File Permissions:**
   - Ensure `/api/*.js` files are committed to git
   - Check `.gitignore` doesn't exclude them

4. **Check Dependencies:**
   - Verify `@xmldom/xmldom` is in `package.json`
   - Ensure it's a regular dependency, not devDependency

---

## 📦 Files Included in Deployment

### Serverless Functions (`/api/`)
```
/api/
  ├── harmonize.js    (Main API endpoint)
  └── health.js       (Health check)
```

### Backend Logic (`/backend/`)
```
/backend/
  └── src/
      └── adapters/
          └── nextjs-adapter.js  (Harmonization engine - 1,781 lines)
```

### Frontend Build (`/frontend/dist/`)
```
/frontend/dist/
  ├── index.html
  ├── assets/
  │   ├── index-[hash].js
  │   ├── index-[hash].css
  │   └── images/
  └── ...
```

---

## 🔄 Continuous Deployment

### Automatic Deployments

Vercel automatically deploys when you push to GitHub:

- **Main Branch:** Deploys to production
- **Other Branches:** Creates preview deployments
- **Pull Requests:** Creates preview for each PR

### Preview Deployments

Every PR gets a unique URL:
```
https://chamber-music-fullstack-[hash]-[team].vercel.app
```

**Benefits:**
- ✅ Test changes before merging
- ✅ Share with team for review
- ✅ Automatic cleanup after merge

### Deployment Triggers

Vercel deploys on:
- ✅ Git push to main
- ✅ PR creation/update
- ✅ Manual trigger in dashboard

---

## 🎯 Performance Optimization

### Caching Strategy

The harmonization engine includes caching:

```javascript
// Cache configuration in nextjs-adapter.js
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes
const MAX_CACHE_SIZE = 100; // Max entries
```

**Cache Key:** Hash of (file content + instruments)

**Benefits:**
- ✅ Instant responses for repeated requests
- ✅ Reduces function execution time
- ✅ Saves Vercel function credits

### Cold Start Optimization

First request after inactivity may be slower (cold start).

**Mitigation:**
1. Keep functions warm with periodic health checks
2. Use Vercel's "Instant Function" (Pro plan)
3. Implement pre-warming strategies

### CDN Caching

Frontend assets are cached on Vercel's global CDN:

- **HTML:** No cache (always fresh)
- **JS/CSS/Images:** 1 year cache (immutable)
- **API Responses:** No cache (dynamic)

---

## 🌍 Custom Domain (Optional)

### Add Custom Domain

1. Go to Vercel Dashboard
2. Click your project
3. Go to **Settings → Domains**
4. Add your domain (e.g., `harmonyforge.com`)
5. Follow DNS configuration instructions

### DNS Configuration

**Option 1: CNAME (Recommended)**
```
CNAME @ cname.vercel-dns.com
```

**Option 2: A Record**
```
A @ 76.76.21.21
```

### SSL Certificate

Vercel automatically provisions SSL certificates:
- ✅ Free SSL via Let's Encrypt
- ✅ Auto-renewal
- ✅ Supports wildcard domains

---

## 📊 Monitoring & Logs

### View Function Logs

```
Dashboard → Project → Functions → Select Function → View Logs
```

**Log Types:**
- **Info:** Successful requests
- **Error:** Failed requests
- **Warning:** Performance issues

### Analytics

Vercel provides analytics:
- **Real User Monitoring (RUM)**
- **Function execution times**
- **Error rates**
- **Geographic distribution**

**Access:**
```
Dashboard → Project → Analytics
```

### Alerts (Pro Plan)

Set up alerts for:
- High error rates
- Slow function execution
- Memory/timeout issues

---

## 💰 Cost Considerations

### Vercel Free Tier

**Includes:**
- ✅ 100GB bandwidth/month
- ✅ 100GB-hours function execution
- ✅ Serverless functions (60s timeout)
- ✅ Automatic SSL
- ✅ Global CDN

**Typical Usage:**
- Small app: ~10-50 harmonizations/day
- Estimated cost: **Free**

### Vercel Pro Tier ($20/month)

**Additional Features:**
- ✅ 1TB bandwidth
- ✅ 1000 GB-hours function execution
- ✅ 300s function timeout
- ✅ 3GB function memory
- ✅ Advanced analytics
- ✅ Team collaboration

**When to Upgrade:**
- Large files (>1MB)
- Complex harmonizations (>60s)
- High traffic (>1000 requests/day)

---

## 🔒 Security

### Built-in Security Features

- ✅ **HTTPS:** All traffic encrypted
- ✅ **CORS:** Properly configured
- ✅ **File Validation:** XML/MusicXML only
- ✅ **Size Limits:** 50MB max upload
- ✅ **Rate Limiting:** Vercel automatic protection
- ✅ **DDoS Protection:** Vercel infrastructure

### Additional Security (Optional)

1. **Authentication:** Add user authentication
2. **API Keys:** Require API key for endpoints
3. **Rate Limiting:** Implement custom rate limits
4. **Input Sanitization:** Enhanced XML validation

---

## 🎉 Success Checklist

After deployment, verify:

- ✅ Website loads at Vercel URL
- ✅ `/health` endpoint returns 200 OK
- ✅ File upload works
- ✅ Harmonization completes successfully
- ✅ Results download correctly
- ✅ No errors in Vercel logs
- ✅ Custom domain configured (if applicable)
- ✅ SSL certificate active
- ✅ Analytics tracking works

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Serverless Functions Guide](https://vercel.com/docs/functions/serverless-functions)
- [Vercel CLI](https://vercel.com/docs/cli)
- [Custom Domains](https://vercel.com/docs/custom-domains)

---

## 🆘 Support

### Project Issues

- GitHub Issues: `[Your Repo]/issues`
- Contact: [Your Email]

### Vercel Support

- Documentation: https://vercel.com/docs
- Community: https://github.com/vercel/vercel/discussions
- Support: https://vercel.com/support

---

**Last Updated:** November 19, 2025  
**Status:** ✅ Production Ready  
**Deployment URL:** https://harmonyforge-fullstack.vercel.app/

---

## 🔄 Local Development vs Production

| Feature | Local Development | Production (Vercel) |
|---------|------------------|---------------------|
| **Frontend** | Vite Dev Server (Port 5174) | Static CDN |
| **Backend** | Express Server (Port 3001) | Serverless Functions |
| **API Base URL** | `http://localhost:3001` | Relative paths (`/api/*`) |
| **File Upload** | Multer middleware | Custom multipart parser |
| **CORS** | Express cors middleware | Vercel headers |
| **Hot Reload** | ✅ Yes | ❌ No (needs redeploy) |
| **Logs** | Terminal console | Vercel Dashboard |
| **Debugging** | Browser DevTools + Node debugger | Vercel Logs |

---

**🎵 Happy Harmonizing! 🎵**

