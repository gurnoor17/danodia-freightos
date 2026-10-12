const path = require('path');
// Load environment variables before any other module imports
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const app = require('./app');
const { testConnection, pool } = require('./config/database');

const PORT = parseInt(process.env.PORT, 10) || 5000;
const HOST = process.env.HOST || '0.0.0.0';
const NODE_ENV = process.env.NODE_ENV || 'development';

const startServer = async () => {
  try {
    console.log(`[Danodia FreightOS] Initializing backend server in ${NODE_ENV} mode...`);

    // Verify database connectivity
    console.log('[Database] Verifying PostgreSQL connection...');
    const dbTest = await testConnection();
    console.log(`[Database] Connected successfully to PostgreSQL at: ${dbTest.timestamp}`);

    const listenOn = (port, host) => {
      const server = app.listen(port, host, () => {
        console.log(`[Danodia FreightOS API] Running on http://${host === '0.0.0.0' ? 'localhost' : host}:${port}`);
        console.log(`[Danodia FreightOS API] Health Check: http://${host === '0.0.0.0' ? 'localhost' : host}:${port}/api/health`);
      });

      server.on('error', (err) => {
        if (err.code === 'EADDRINUSE' && host === '0.0.0.0') {
          console.warn(`[Server] Warning: Port ${port} wildcard (0.0.0.0) is occupied (often macOS AirPlay Receiver).`);
          console.log(`[Server] Automatically falling back to binding 127.0.0.1:${port}...`);
          listenOn(port, '127.0.0.1');
        } else {
          console.error(`[Server Error]: ${err.message}`);
          process.exit(1);
        }
      });

      // Graceful shutdown handling
      const shutdown = async (signal) => {
        console.log(`\n[Server] Received ${signal}. Gracefully shutting down...`);
        server.close(async () => {
          console.log('[Server] HTTP server closed.');
          try {
            await pool.end();
            console.log('[Database] PostgreSQL connection pool drained.');
          } catch (dbErr) {
            console.error('[Database] Error closing PostgreSQL pool:', dbErr);
          }
          process.exit(0);
        });
      };

      process.on('SIGINT', () => shutdown('SIGINT'));
      process.on('SIGTERM', () => shutdown('SIGTERM'));
    };

    listenOn(PORT, HOST);
  } catch (err) {
    console.error('[Server Startup Error]: Failed to connect to database or start server:');
    console.error(err.message);
    process.exit(1);
  }
};

startServer();
