// Load environment variables (Render provides them directly)
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('dotenv').config();

// eslint-disable-next-line @typescript-eslint/no-require-imports
const WebSocket = require('ws');

// Production-ready configuration
const PORT = process.env.PORT || 8080;
const ENV = process.env.NODE_ENV || 'development';

// CORS configuration for production
const allowedOrigins = [
  'http://localhost:3000',
  'https://localhost:3000',
  // Add your Vercel deployment URL here when available
  // 'https://your-app.vercel.app',
  // Temporary: Allow all Vercel domains for testing
  'https://analytics-dashboard-chi.vercel.app',
  'https://analytics-dashboard-git-main-yashrajpatillls-projects.vercel.app',
  // Add custom domain here when available
  // 'https://your-custom-domain.com'
];

const server = new WebSocket.Server({ 
  port: PORT,
  verifyClient: (info) => {
    // In development, allow all origins
    if (ENV === 'development') {
      return true;
    }
    
    // In production, check allowed origins
    const origin = info.origin;
    if (!origin) return false; // Reject requests without origin
    
    // Allow all Vercel domains for now
    const isVercelDomain = origin.includes('vercel.app');
    const isAllowedOrigin = allowedOrigins.includes(origin);
    
    if (isVercelDomain || isAllowedOrigin) {
      console.log(`✅ Connection allowed from origin: ${origin}`);
      return true;
    } else {
      console.log(`❌ Connection rejected from origin: ${origin}`);
      return false;
    }
  }
});

const protocol = ENV === 'production' ? 'wss' : 'ws';
const host = ENV === 'production' ? '0.0.0.0' : 'localhost';
console.log(`🚀 Analytics WebSocket Server running on ${protocol}://${host}:${PORT}`);


// Connected clients tracking
const connectedClients = new Map();

const sites = [
  { siteId: 'site_001', siteName: 'E-commerce Store' },
  { siteId: 'site_002', siteName: 'News Portal' },
  { siteId: 'site_003', siteName: 'SaaS Platform' },
  { siteId: 'site_004', siteName: 'Blog Site' },
  { siteId: 'site_005', siteName: 'Corporate Website' }
];

const generateDataPoint = () => {
  const site = sites[Math.floor(Math.random() * sites.length)];
  return {
    timestamp: new Date().toISOString(),
    siteId: site.siteId,
    siteName: site.siteName,
    pageViews: Math.floor(Math.random() * 200) + 50,
    uniqueVisitors: Math.floor(Math.random() * 150) + 30,
    bounceRate: Math.round((Math.random() * 0.6 + 0.2) * 100) / 100,
    avgSessionDuration: Math.floor(Math.random() * 300) + 60,
    topPages: [
      { path: "/", views: Math.floor(Math.random() * 50) + 20 },
      { path: "/products", views: Math.floor(Math.random() * 40) + 10 },
      { path: "/about", views: Math.floor(Math.random() * 30) + 5 }
    ],
    performanceMetrics: {
      loadTime: Math.round((Math.random() * 3 + 0.5) * 100) / 100,
      firstContentfulPaint: Math.round((Math.random() * 2 + 0.3) * 100) / 100,
      largestContentfulPaint: Math.round((Math.random() * 4 + 1.0) * 100) / 100
    },
    userFlow: [
      { from: "/", to: "/products", count: Math.floor(Math.random() * 20) },
      { from: "/products", to: "/checkout", count: Math.floor(Math.random() * 15) }
    ]
  };
};

server.on('connection', (ws) => {
  console.log('🔗 New WebSocket connection');
  
  // Update performance metrics
  performanceMetrics.totalConnections++;
  
  // Store client info
  connectedClients.set(ws, { connectedAt: new Date() });

  // Add error handler immediately
  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
    performanceMetrics.errorsCount++;
  });
  
  console.log('✅ Analytics client connected');

  // Wait a moment before sending data to ensure client is ready
  setTimeout(() => {
    // Send initial data burst
    if (ws.readyState === WebSocket.OPEN) {
      console.log('📊 Sending initial data burst to analytics client');
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          if (ws.readyState === WebSocket.OPEN) {
            try {
              const dataPoint = generateDataPoint();
              ws.send(JSON.stringify(dataPoint));
              performanceMetrics.messagesSent++;
              console.log('📤 Sent data point:', dataPoint.siteName);
            } catch (error) {
              console.error('Error sending initial data:', error);
              performanceMetrics.errorsCount++;
            }
          }
        }, i * 200);
      }
    }
  }, 1000);
  
  // Regular data streaming
  const interval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(generateDataPoint()));
        performanceMetrics.messagesSent++;
      } catch (error) {
        console.error('Error sending data:', error);
        performanceMetrics.errorsCount++;
        clearInterval(interval);
      }
    } else {
      clearInterval(interval);
    }
  }, 500 + Math.random() * 1000);
  
  // Handle client messages (basic ping/pong)
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      if (message.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
      }
    } catch (error) {
      console.log('Error parsing message:', error);
    }
  });
  
  ws.on('close', (code, reason) => {
    console.log(`❌ Analytics client disconnected (code: ${code}, reason: ${reason})`);
    clearInterval(interval);
    connectedClients.delete(ws);
  });
});

// Performance metrics tracking
const performanceMetrics = {
  startTime: Date.now(),
  totalConnections: 0,
  messagesSent: 0,
  errorsCount: 0
};

// Enhanced server health monitoring
setInterval(() => {
  const activeConnections = connectedClients.size;
  const uptime = Math.floor((Date.now() - performanceMetrics.startTime) / 1000);
  const memoryUsage = process.memoryUsage();
  
  console.log(`💓 Server heartbeat:`, {
    activeConnections,
    totalConnections: performanceMetrics.totalConnections,
    messagesSent: performanceMetrics.messagesSent,
    errors: performanceMetrics.errorsCount,
    uptime: `${uptime}s`,
    memoryMB: Math.round(memoryUsage.heapUsed / 1024 / 1024),
    environment: ENV
  });
}, 30 * 1000); // Every 30 seconds

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  server.close(() => {
    console.log('✅ WebSocket server closed.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  server.close(() => {
    console.log('✅ WebSocket server closed.');
    process.exit(0);
  });
});
