# Dockerfile for WebSocket Server
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install only WebSocket server dependencies
RUN npm init -y && npm install ws dotenv

# Copy WebSocket server file
COPY websocket-server.js .

# Environment variables will be provided by Render platform
# No need to copy .env.local as it's not in git and Render provides env vars

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S websocket -u 1001

# Change ownership of the app directory
RUN chown -R websocket:nodejs /app
USER websocket

# Expose the port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const WebSocket = require('ws'); const ws = new WebSocket('ws://localhost:8080'); ws.on('open', () => { ws.close(); process.exit(0); }); ws.on('error', () => process.exit(1));"

# Start the server
CMD ["node", "websocket-server.js"]