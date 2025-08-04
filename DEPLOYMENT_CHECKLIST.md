# Analytics Dashboard - Deployment Checklist

## 📋 Pre-Deployment Checklist

### Environment Setup
- [ ] **Environment variables configured** for development
  - [ ] `.env.local` contains all required variables
  - [ ] `NEXT_PUBLIC_SUPABASE_URL` set correctly
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` set correctly
  - [ ] `NEXT_PUBLIC_WEBSOCKET_URL` points to localhost:8080

### Code Quality
- [ ] **Build tests passing locally**
  ```bash
  npm run build
  npm run lint
  npm run typecheck  # if available
  ```
- [ ] **WebSocket server starts without errors**
  ```bash
  node websocket-server.js
  ```
- [ ] **Frontend connects to WebSocket** in development
- [ ] **All TypeScript errors resolved**
- [ ] **No console errors** in browser dev tools

### Testing Functionality
- [ ] **Dashboard loads** with mock data
- [ ] **Real-time data streaming** works
- [ ] **Export functionality** operational
- [ ] **Dashboard sharing** works correctly
- [ ] **Mobile responsiveness** verified
- [ ] **All routes accessible** (/, /shared/:id, etc.)

---

## 🚀 Deployment Process

### Phase 1: WebSocket Server (Render.com)

#### Repository Setup
- [ ] **WebSocket server files** ready for deployment
  - [ ] `websocket-server.js` contains production CORS config
  - [ ] `package.json` includes WebSocket dependencies
  - [ ] `Dockerfile` created for containerization

#### Render.com Configuration
- [ ] **Render.com account** created and connected to GitHub
- [ ] **New Web Service** created from repository
- [ ] **Build command** set (if needed): `npm install`
- [ ] **Start command** set: `node websocket-server.js`
- [ ] **Environment variables** configured in Render dashboard:
  - [ ] `NODE_ENV=production`
  - [ ] `PORT=8080` (or use Render's default)

#### Deployment Verification
- [ ] **WebSocket server deployed** successfully
- [ ] **Health check** passes (service shows "Live")
- [ ] **WebSocket URL** obtained (e.g., `https://your-app.onrender.com`)
- [ ] **WSS connection** testable via browser dev tools

### Phase 2: Frontend (Vercel)

#### Environment Configuration
- [ ] **Production environment variables** set in Vercel dashboard:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `NEXT_PUBLIC_WEBSOCKET_URL=wss://your-app.onrender.com`
  - [ ] `NODE_ENV=production`

#### Vercel Deployment
- [ ] **Vercel account** created and connected to GitHub
- [ ] **Project imported** from GitHub repository
- [ ] **Build settings** configured (usually auto-detected)
- [ ] **Domain configured** (either `.vercel.app` or custom)

#### Frontend Verification
- [ ] **Frontend builds** successfully on Vercel
- [ ] **Deployment completes** without errors
- [ ] **Production URL** accessible
- [ ] **Environment variables** loaded correctly

---

## ✅ Post-Deployment Verification

### Connection Testing
- [ ] **Frontend loads** at production URL
- [ ] **WebSocket connects** successfully 
  - Check browser Network tab for WebSocket connection
  - Look for WSS connection (not WS)
- [ ] **SSL certificates** active (HTTPS/WSS only)
- [ ] **No mixed content warnings** in browser

### Functionality Testing
- [ ] **Real-time data streaming** functional
  - Dashboard updates automatically
  - Data appears in real-time
- [ ] **Dashboard sharing** works correctly
  - Share URLs generate properly
  - Shared dashboards accessible
- [ ] **Export functionality** operational
  - CSV export works
  - PDF export works (if implemented)
- [ ] **Authentication flow** complete (if implemented)

### Performance Testing
- [ ] **Page load time** < 3 seconds
- [ ] **WebSocket connection time** < 2 seconds
- [ ] **Real-time data latency** < 1 second
- [ ] **Core Web Vitals** acceptable (check Vercel Analytics)

### Cross-Device Testing
- [ ] **Desktop browsers** (Chrome, Firefox, Safari)
- [ ] **Mobile devices** (iOS Safari, Android Chrome)
- [ ] **Tablet responsiveness** verified
- [ ] **Different screen sizes** tested

### Error Handling
- [ ] **Network disconnection** handled gracefully
- [ ] **WebSocket reconnection** works after temporary disconnection
- [ ] **404 pages** display correctly
- [ ] **Error boundaries** catch React errors

---

## 🔧 Troubleshooting Common Issues

### WebSocket Connection Fails
**Symptoms**: Dashboard shows "Connecting..." indefinitely
- [ ] Check CORS configuration in `websocket-server.js`
- [ ] Verify WebSocket URL uses `wss://` (not `ws://`)
- [ ] Confirm Render.com service is "Live"
- [ ] Check browser dev tools for connection errors

### Build Failures
**Symptoms**: Deployment fails during build process
- [ ] Check for TypeScript errors locally
- [ ] Verify all dependencies in `package.json`
- [ ] Check environment variables are set
- [ ] Review build logs in deployment platform

### CORS Errors
**Symptoms**: Browser shows CORS policy errors
- [ ] Add production domain to allowed origins
- [ ] Update WebSocket server CORS configuration
- [ ] Redeploy WebSocket server after CORS changes

### Performance Issues
**Symptoms**: Slow loading or poor responsiveness
- [ ] Enable Next.js production optimizations
- [ ] Check Render.com service hasn't gone to sleep
- [ ] Verify CDN caching is working (Vercel)
- [ ] Monitor WebSocket message frequency

---

## 🔒 Security Verification

### HTTPS/WSS Enforcement
- [ ] **Frontend** serves over HTTPS only
- [ ] **WebSocket** connects via WSS only
- [ ] **No mixed content** warnings

### CORS Configuration
- [ ] **Production domains** included in allowed origins
- [ ] **Development domains** removed from production CORS
- [ ] **Wildcard origins** avoided in production

### Environment Variables
- [ ] **Sensitive data** not exposed in client bundle
- [ ] **API keys** properly prefixed (`NEXT_PUBLIC_` only for client-side)
- [ ] **No secrets** committed to version control

---

## 📊 Monitoring Setup

### Platform Monitoring
- [ ] **Vercel Analytics** enabled (if available)
- [ ] **Render.com metrics** accessible
- [ ] **Uptime monitoring** configured (optional)

### Custom Monitoring
- [ ] **WebSocket connection** count tracking
- [ ] **Error logging** implemented
- [ ] **Performance metrics** collection

---

## 🎯 Demo Readiness Checklist

### URLs and Access
- [ ] **Production URL** bookmarked and accessible
- [ ] **Demo data** populated and realistic
- [ ] **Sharing URLs** tested and working

### Presentation Preparation
- [ ] **Multiple devices** tested (laptop, phone, tablet)
- [ ] **Network connectivity** verified at demo location
- [ ] **Fallback plan** prepared (local development mode)

### Performance Verification
- [ ] **Load time** acceptable on demo network
- [ ] **WebSocket** connects reliably
- [ ] **Real-time features** demonstrate smoothly

---

## 📝 Deployment Summary

**Platform Configuration:**
- **Frontend**: Vercel (https://your-app.vercel.app)
- **WebSocket**: Render.com (wss://your-app.onrender.com)
- **Database**: Supabase (existing configuration)

**Environment Variables Set:**
- Vercel: `NEXT_PUBLIC_WEBSOCKET_URL`, `NEXT_PUBLIC_SUPABASE_*`
- Render.com: `NODE_ENV`, `PORT`

**Deployment Status:**
- [ ] All services deployed and healthy
- [ ] All tests passing
- [ ] Performance metrics acceptable
- [ ] Ready for demonstration

---

## 🆘 Emergency Procedures

### If WebSocket Server Fails
1. Check Render.com service status
2. Restart service in Render dashboard
3. Verify environment variables
4. Check recent deployment logs

### If Frontend Fails
1. Check Vercel deployment status
2. Verify build logs for errors
3. Confirm environment variables
4. Test locally with production config

### Quick Demo Fallback
If production deployment fails before demo:
1. Start local WebSocket server: `node websocket-server.js`
2. Use ngrok to expose WebSocket: `ngrok http 8080`
3. Update `NEXT_PUBLIC_WEBSOCKET_URL` to ngrok URL
4. Deploy frontend with updated WebSocket URL

---
