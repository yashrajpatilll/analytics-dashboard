// Load environment variables
require('dotenv').config({ path: '.env.local' });

const WebSocket = require('ws');
const { createClient } = require('@supabase/supabase-js');
const server = new WebSocket.Server({ port: 8080 });
const url = require('url');

console.log('🚀 Analytics WebSocket Server running on ws://localhost:8080');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Verify Supabase connection
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase environment variables!');
  console.error('Make sure .env.local exists with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

console.log('✅ Supabase client initialized successfully');

// In-memory cache for active sessions (for WebSocket connections only)
const activeConnections = new Map(); // sessionId -> Set<WebSocket>
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
  
  console.log('🔗 New WebSocket connection attempt:', {
    sessionId: sessionId || 'none',
    userId: userId || 'none',
    userName: userName || 'none',
    url: request.url
  });
  
  // Store client info
  ws.clientInfo = { sessionId, userId, userName };
  connectedClients.set(ws, ws.clientInfo);

  // Add error handler immediately
  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
  });
  
  if (sessionId && userId && userName) {
    console.log(`✅ Collaborative client connected: ${userName} (${userId}) to session ${sessionId}`);
    
    // Join collaborative session in memory for WebSocket connections (always allow)
    if (!activeConnections.has(sessionId)) {
      activeConnections.set(sessionId, new Set());
    }
    activeConnections.get(sessionId).add(ws);
    
    // Update session in Supabase with user joining (but don't fail if session doesn't exist yet)
    updateSessionActiveUsers(sessionId, userId, 'join').catch(error => {
      console.warn(`⚠️  Could not update session ${sessionId} in database:`, error.message);
      console.log(`💡 Session will still work for WebSocket collaboration`);
    });
    
    // Notify other clients in session about new user
    const sessionClients = activeConnections.get(sessionId);
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

    // Send analytics data to collaborative clients (they don't get regular analytics stream)
    if (sessionClients.size > 0) {
      console.log(`📊 Starting data stream for collaborative session ${sessionId} with ${sessionClients.size} clients`);
      
      // Send initial data burst to all collaborative clients
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          const dataPoint = generateDataPoint();
          sessionClients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              try {
                client.send(JSON.stringify(dataPoint));
              } catch (error) {
                console.error('Error sending data to collaborative client:', error);
              }
            }
          });
        }, i * 100);
      }
    }
  } else {
    console.log('✅ Analytics client connected');
  }

  // Wait a moment before sending data to ensure client is ready
  setTimeout(() => {
    // Send initial data burst (only for analytics clients, not collaborative)
    if (!sessionId && ws.readyState === WebSocket.OPEN) {
      console.log('📊 Sending initial data burst to analytics client');
      for (let i = 0; i < 3; i++) { // Reduced from 5 to 3
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
        }, i * 200); // Faster initial data burst for better demo experience
      }
    }
  }, 1000); // Wait 1 second before starting
  
  // Regular data streaming 
  let interval;
  if (!sessionId) {
    // Regular analytics client - stream to this client only
    interval = setInterval(() => {
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
    }, 500 + Math.random() * 1000); // Updated to 0.5-1.5 seconds for more realistic real-time demo
  } else {
    // Collaborative client - stream to all clients in the session
    interval = setInterval(() => {
      const sessionClients = activeConnections.get(sessionId);
      if (sessionClients && sessionClients.size > 0) {
        const dataPoint = generateDataPoint();
        sessionClients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            try {
              client.send(JSON.stringify(dataPoint));
            } catch (error) {
              console.error('Error sending collaborative data:', error);
            }
          }
        });
      } else {
        clearInterval(interval);
      }
    }, 500 + Math.random() * 1000); // Updated to 0.5-1.5 seconds for more realistic real-time demo
  }
  
  // Handle collaborative messages
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      
      if (sessionId && message.sessionId === sessionId) {
        // Update dashboard config in Supabase if it's a filter change
        if (message.type === 'filter-change' || message.type === 'site-selection') {
          updateSessionDashboardConfig(sessionId, message.payload).catch(console.error);
        }
        
        // Broadcast collaborative message to other clients in the same session
        const sessionClients = activeConnections.get(sessionId);
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
  
  ws.on('close', (code, reason) => {
    console.log(`❌ Client disconnected: ${userName || 'Analytics client'} (code: ${code}, reason: ${reason})`);
    if (interval) clearInterval(interval);
    
    // Handle collaborative session cleanup
    if (sessionId && activeConnections.has(sessionId)) {
      const sessionClients = activeConnections.get(sessionId);
      sessionClients.delete(ws);
      
      // Update session in Supabase with user leaving
      if (userId) {
        updateSessionActiveUsers(sessionId, userId, 'leave').catch(console.error);
        
        // Notify other clients about user leaving
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
        activeConnections.delete(sessionId);
      }
    }
    
    connectedClients.delete(ws);
  });
});

// Helper functions for Supabase operations
async function updateSessionActiveUsers(sessionId, userId, action) {
  try {
    console.log(`🔍 Attempting to fetch session ${sessionId} from database...`);
    
    // Get current session
    const { data: session, error: fetchError } = await supabase
      .from('collaborative_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        console.warn(`⚠️  Session ${sessionId} not found in database - session may have expired or not been created properly`);
        console.log(`🔍 Checking if session exists with different query...`);
        
        // Try a broader search to see if session exists at all
        const { data: allSessions, error: searchError } = await supabase
          .from('collaborative_sessions')
          .select('id, created_at, expires_at')
          .limit(5);
          
        if (searchError) {
          console.error('Error searching for sessions:', searchError);
        } else {
          console.log('📋 Recent sessions in database:', allSessions);
        }
      } else {
        console.error('Error fetching session:', fetchError);
      }
      return;
    }

    console.log(`✅ Found session ${sessionId} in database:`, {
      id: session.id,
      owner_id: session.owner_id,
      created_at: session.created_at,
      expires_at: session.expires_at,
      active_users_count: session.active_users?.length || 0
    });

    let activeUsers = session?.active_users || [];
    
    if (action === 'join' && !activeUsers.includes(userId)) {
      activeUsers.push(userId);
    } else if (action === 'leave') {
      activeUsers = activeUsers.filter(id => id !== userId);
    }

    // Update session with new active users
    const { error: updateError } = await supabase
      .from('collaborative_sessions')
      .update({ active_users: activeUsers })
      .eq('id', sessionId);

    if (updateError) {
      console.error('Error updating session active users:', updateError);
    }
  } catch (error) {
    console.error('Error in updateSessionActiveUsers:', error);
  }
}

async function updateSessionDashboardConfig(sessionId, config) {
  try {
    const { error } = await supabase
      .from('collaborative_sessions')
      .update({ dashboard_config: config })
      .eq('id', sessionId);

    if (error) {
      console.error('Error updating dashboard config:', error);
    }
  } catch (error) {
    console.error('Error in updateSessionDashboardConfig:', error);
  }
}

// Cleanup expired sessions every hour
setInterval(async () => {
  try {
    const { data, error } = await supabase
      .from('collaborative_sessions')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .select();

    if (error) {
      console.error('Error cleaning up expired sessions:', error);
    } else if (data?.length > 0) {
      console.log(`🧹 Cleaned up ${data.length} expired sessions`);
    }
  } catch (error) {
    console.error('Error in cleanup job:', error);
  }
}, 60 * 60 * 1000); // Every hour
