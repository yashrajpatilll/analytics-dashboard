// Load environment variables
require('dotenv').config({ path: '.env.local' });

const WebSocket = require('ws');
const server = new WebSocket.Server({ port: 8080 });

console.log('🚀 Analytics WebSocket Server running on ws://localhost:8080');


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
  
  // Store client info
  connectedClients.set(ws, { connectedAt: new Date() });

  // Add error handler immediately
  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
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
              console.log('📤 Sent data point:', dataPoint.siteName);
            } catch (error) {
              console.error('Error sending initial data:', error);
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
      } catch (error) {
        console.error('Error sending data:', error);
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

// Basic server health monitoring
setInterval(() => {
  const activeConnections = connectedClients.size;
  console.log(`💓 Server heartbeat - ${activeConnections} active connections`);
}, 30 * 1000); // Every 30 seconds
