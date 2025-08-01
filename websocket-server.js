const WebSocket = require('ws');
const server = new WebSocket.Server({ port: 8080 });
const url = require('url');

console.log('🚀 Analytics WebSocket Server running on ws://localhost:8080');

// Collaborative sessions storage
const collaborativeSessions = new Map();
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

server.on('connection', (ws, request) => {
  const query = url.parse(request.url, true).query;
  const sessionId = query.sessionId;
  const userId = query.userId;
  const userName = query.userName;
  
  // Store client info
  ws.clientInfo = { sessionId, userId, userName };
  connectedClients.set(ws, ws.clientInfo);
  
  if (sessionId && userId && userName) {
    console.log(`✅ Collaborative client connected: ${userName} (${userId}) to session ${sessionId}`);
    
    // Join collaborative session
    if (!collaborativeSessions.has(sessionId)) {
      collaborativeSessions.set(sessionId, new Set());
    }
    collaborativeSessions.get(sessionId).add(ws);
    
    // Notify other clients in session about new user
    const sessionClients = collaborativeSessions.get(sessionId);
    sessionClients.forEach(client => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'user-join',
          userId: userId,
          payload: { name: userName },
          timestamp: new Date().toISOString(),
          sessionId: sessionId
        }));
      }
    });
  } else {
    console.log('✅ Analytics client connected');
  }

  // Send initial data burst
  for (let i = 0; i < 5; i++) {
    setTimeout(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(generateDataPoint()));
      }
    }, i * 200);
  }
  
  // Regular data streaming
  const interval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(generateDataPoint()));
    } else {
      clearInterval(interval);
    }
  }, 1000 + Math.random() * 2000);
  
  // Handle collaborative messages
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      
      if (sessionId && message.sessionId === sessionId) {
        // Broadcast collaborative message to other clients in the same session
        const sessionClients = collaborativeSessions.get(sessionId);
        if (sessionClients) {
          sessionClients.forEach(client => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(data);
            }
          });
        }
      }
    } catch (error) {
      console.log('Error parsing collaborative message:', error);
    }
  });
  
  ws.on('close', () => {
    console.log(`❌ Client disconnected: ${userName || 'Analytics client'}`);
    clearInterval(interval);
    
    // Handle collaborative session cleanup
    if (sessionId && collaborativeSessions.has(sessionId)) {
      const sessionClients = collaborativeSessions.get(sessionId);
      sessionClients.delete(ws);
      
      // Notify other clients about user leaving
      if (userId) {
        sessionClients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'user-leave',
              userId: userId,
              payload: {},
              timestamp: new Date().toISOString(),
              sessionId: sessionId
            }));
          }
        });
      }
      
      // Clean up empty sessions
      if (sessionClients.size === 0) {
        collaborativeSessions.delete(sessionId);
      }
    }
    
    connectedClients.delete(ws);
  });
});
