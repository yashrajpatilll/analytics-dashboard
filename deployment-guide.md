# Deployment Guide - Analytics Dashboard

## Overview
This guide provides step-by-step instructions for deploying the analytics dashboard to production using Vercel (frontend) and Render.com (WebSocket server).

## Prerequisites
- GitHub account
- Vercel account (free)
- Render.com account (free)
- Domain name (optional, for professional URLs)

## Phase 1: Environment Configuration

### 1.1 Update WebSocket Configuration

Create environment-based WebSocket URLs:

```bash
# Add to .env.local (development)
NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:8080

# Add to .env.production (will be created)
NEXT_PUBLIC_WEBSOCKET_URL=wss://your-websocket-render.com
```

### 1.2 Update WebSocket Server for Production

Modify `websocket-server.js` to support production deployment:

```javascript
// Production-ready WebSocket server configuration
const PORT = process.env.PORT || 8080;
const ENV = process.env.NODE_ENV || 'development';

const server = new WebSocket.Server({ 
  port: PORT,
  // Add CORS headers for production
  verifyClient: (info) => {
    // Allow connections from your frontend domains
    const allowedOrigins = [
      'http://localhost:3000',
      'https://your-app.vercel.app',
      // Add your custom domain here
    ];
    return allowedOrigins.includes(info.origin);
  }
});

console.log(`🚀 Analytics WebSocket Server running on ${ENV === 'production' ? 'wss' : 'ws'}://0.0.0.0:${PORT}`);
```

### 1.3 Update Frontend WebSocket Connection

Update hardcoded WebSocket URLs in components:

```typescript
// In src/components/dashboard/Dashboard.tsx
const WEBSOCKET_URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL || "ws://localhost:8080";

// In src/app/debug/page.tsx
const ws = new WebSocket(process.env.NEXT_PUBLIC_WEBSOCKET_URL || "ws://localhost:8080");
```

## Phase 2: WebSocket Server Deployment (Render.com)

### 2.1 Prepare WebSocket Server for Render.com

1. Create `Dockerfile` for WebSocket server:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --only=production
COPY websocket-server.js .
COPY .env.local .
EXPOSE 8080
CMD ["node", "websocket-server.js"]
```

2. Create `railway.json` configuration:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "dockerfile"
  },
  "deploy": {
    "restartPolicyType": "always"
  }
}
```

### 2.2 Deploy to Render.com

1. Push WebSocket server to a separate GitHub repository
2. Connect repository to Render.com
3. Configure environment variables in Render.com dashboard
4. Deploy and get the Render.com domain (e.g., `your-app.onrender.com`)

### 2.3 Configure Environment Variables in Render.com

```bash
NODE_ENV=production
PORT=8080
# Add any other required environment variables
```

## Phase 3: Frontend Deployment (Vercel)

### 3.1 Prepare Next.js App for Production

1. Update `next.config.ts` for production optimization:
```typescript
const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  // Add performance optimizations
  experimental: {
    optimizeCss: true,
  },
  // Enable static generation where possible
  output: 'standalone',
  // Optimize images
  images: {
    formats: ['image/webp', 'image/avif'],
  },
  // Add security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },
};
```

2. Create production environment file:
```bash
# .env.production
NEXT_PUBLIC_SUPABASE_URL=https://ldhqvsuzipctokmxwbhb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_WEBSOCKET_URL=wss://your-websocket-render.com
```

### 3.2 Deploy to Vercel

1. Connect GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Set up automatic deployments
4. Configure custom domain (optional)

## Phase 4: CI/CD Pipeline Setup

### 4.1 GitHub Actions for WebSocket Server

Create `.github/workflows/deploy-websocket.yml`:

```yaml
name: Deploy WebSocket Server

on:
  push:
    branches: [main]
    paths: ['websocket-server.js', 'package.json']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Railway
        uses: railway-app/railway@v0.1.0
        with:
          token: ${{ secrets.RAILWAY_TOKEN }}
          service: websocket-server
```

### 4.2 GitHub Actions for Frontend Testing

Create `.github/workflows/test-frontend.yml`:

```yaml
name: Frontend CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run lint
      - run: npm run build
      
      # Add type checking
      - run: npx tsc --noEmit
```

## Phase 5: Environment Management

### 5.1 Environment Variable Strategy

**Development (.env.local)**:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://ldhqvsuzipctokmxwbhb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_dev_key
NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:8080
NODE_ENV=development
```

**Production (Vercel Environment Variables)**:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://ldhqvsuzipctokmxwbhb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_prod_key
NEXT_PUBLIC_WEBSOCKET_URL=wss://your-websocket.railway.app
NODE_ENV=production
```

### 5.2 Security Considerations

1. **WebSocket CORS**: Configure allowed origins
2. **Supabase RLS**: Enable Row Level Security
3. **Environment Variables**: Never commit secrets to git
4. **HTTPS Only**: Ensure all production traffic uses HTTPS/WSS

## Phase 6: Performance Monitoring

### 6.1 Built-in Monitoring

**Vercel Analytics** (Free):
- Page performance metrics
- Core Web Vitals
- User engagement tracking

**Railway Metrics** (Free):
- WebSocket server uptime
- Memory and CPU usage
- Connection count monitoring

### 6.2 Custom Monitoring Implementation

Add performance monitoring to your WebSocket server:

```javascript
// Add to websocket-server.js
const performanceMetrics = {
  connections: 0,
  messagesPerSecond: 0,
  uptime: Date.now()
};

// Track metrics
setInterval(() => {
  console.log('📊 Server Metrics:', {
    activeConnections: connectedClients.size,
    uptime: Math.floor((Date.now() - performanceMetrics.uptime) / 1000) + 's',
    memoryUsage: process.memoryUsage()
  });
}, 60000); // Every minute
```

## Phase 7: Domain and SSL Configuration

### 7.1 Custom Domain Setup (Optional)

**For Professional Demo URLs**:

1. **Frontend Domain** (via Vercel):
   - Purchase domain or use subdomain
   - Configure DNS to point to Vercel
   - Automatic SSL certificate

2. **WebSocket Domain** (via Railway):
   - Configure custom domain in Railway dashboard
   - Update NEXT_PUBLIC_WEBSOCKET_URL

### 7.2 SSL Certificate Management

Both Vercel and Railway provide automatic SSL certificates for custom domains.

## Cost Analysis

### Free Tier Limitations:

**Vercel Free Tier**:
- 100GB bandwidth/month
- 100 deployments/day
- Custom domains supported
- **Sufficient for**: MVP demos, moderate traffic

**Railway Free Tier**:
- $5 credit/month (≈500 hours)
- Sleeps after 30min inactivity
- Custom domains supported
- **Sufficient for**: Demo purposes, light usage

**Supabase Free Tier**:
- 500MB database
- 50MB file storage
- 2GB bandwidth
- **Sufficient for**: MVP with moderate data

### Estimated Monthly Costs:
- **MVP Demo**: $0/month (using free tiers)
- **Light Production**: $5-10/month (with paid Railway)
- **Professional**: $20-30/month (custom domains, increased limits)

## Fallback Options

### Option 1: Heroku Alternative
If Railway fails:
- Frontend: Vercel (same)
- WebSocket: Render free tier (with sleep limitations)

### Option 2: Single Platform
If complexity becomes an issue:
- Deploy everything on Railway
- Slightly higher cost but simpler management

### Option 3: Local Development Mode
For urgent demos:
- Use ngrok to expose localhost WebSocket
- Deploy only frontend to Vercel
- Point WebSocket to ngrok tunnel

## Quick Start Commands

```bash
# 1. Update environment variables
cp .env.local .env.production
# Edit .env.production with production values

# 2. Test production build locally
npm run build
npm start

# 3. Deploy WebSocket to Railway
# (Follow Railway deployment steps)

# 4. Deploy Frontend to Vercel
# (Connect GitHub repo to Vercel)

# 5. Update WebSocket URL in production
# Configure NEXT_PUBLIC_WEBSOCKET_URL in Vercel dashboard
```

## Success Metrics

After deployment, verify:
- [ ] Frontend loads at custom URL
- [ ] WebSocket connects successfully (WSS)
- [ ] Real-time data streaming works
- [ ] Dashboard sharing functionality works
- [ ] Export features function properly
- [ ] Mobile responsiveness maintained
- [ ] SSL certificates active
- [ ] Performance metrics acceptable

## Support and Troubleshooting

Common issues and solutions:
1. **WebSocket connection fails**: Check CORS configuration
2. **Build fails**: Verify environment variables
3. **Slow performance**: Enable Next.js optimizations
4. **SSL issues**: Ensure using WSS in production

This deployment strategy provides a professional, cost-effective solution suitable for MVP demonstration while maintaining scalability for future growth. Render.com offers more generous free tier hours (750 vs ~500) compared to Railway, making it ideal for extended demos and development.