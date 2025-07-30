const WebSocket = require('ws');
const server = new WebSocket.Server({ port: 8080 });

console.log('🚀 Analytics WebSocket Server running on ws://localhost:8080');

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
  console.log('✅ Client connected');
  

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
  
  ws.on('close', () => {
    console.log('❌ Client disconnected');
    clearInterval(interval);
  });
});
