const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const env = require('./config/env');
const db = require('./config/db');

async function startServer() {
  try {
    // 1. Initialize Database (or Fallback store)
    console.log('[Server] Connecting to database...');
    await db.initMySQL();

    // 2. Create HTTP & Socket.io server
    const server = http.createServer(app);
    const io = new Server(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });

    // 3. Setup Socket.io Real-time Connections
    io.on('connection', (socket) => {
      socket.on('join_user_room', (userId) => {
        if (userId) {
          socket.join(`user_${userId}`);
        }
      });
    });

    // 4. Start listening
    const PORT = env.port || 3000;
    server.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`🚀 Vimbai Tandire Portfolio is LIVE!`);
      console.log(`📍 Local URL: http://localhost:${PORT}`);
      console.log(`⚙️  Environment: ${env.nodeEnv}`);
      console.log(`🌐 Production Domain: https://gnostix.co.zw`);
      console.log(`====================================================`);
    });
  } catch (err) {
    console.error('[Server Error] Startup failed:', err);
    process.exit(1);
  }
}

startServer();
