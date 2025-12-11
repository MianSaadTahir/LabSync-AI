import 'dotenv/config';
import http from 'http';
import app from './app';
import connectDB from './src/config/db';
import { registerTelegramWebhook, getTelegramWebhookInfo } from './src/utils/telegramWebhook';
import { getBackgroundProcessor } from './src/services/backgroundProcessor';
import { initializeSocket } from './src/services/socketService';

const PORT = process.env.PORT || 4000;

const startServer = async (): Promise<void> => {
  try {
    await connectDB();
    
    // Register Telegram webhook on server startup (non-blocking with retries)
    // Don't wait for it - server will start even if webhook registration fails
    // Will automatically retry up to 3 times with exponential backoff
    registerTelegramWebhook(3)
      .then((webhookRegistered) => {
        if (webhookRegistered) {
          // Show current webhook info for debugging
          setTimeout(() => {
            getTelegramWebhookInfo().catch(() => {
              // Silently fail - not critical
            });
          }, 2000); // Wait 2 seconds before checking webhook info
        } else {
          console.log('[Telegram Webhook] Webhook registration failed after all retries, but server will continue');
          console.log('   You can manually register the webhook later or it will retry on next restart');
        }
      })
      .catch((error) => {
        console.warn('[Telegram Webhook] Error during registration (non-critical):', error instanceof Error ? error.message : 'Unknown error');
        console.warn('   Server will continue running. Webhook can be registered manually.');
      });
    
    // Start background processor for retrying failed operations
    const backgroundProcessor = getBackgroundProcessor();
    backgroundProcessor.start(30000); // Check every 30 seconds
    
    const server = http.createServer(app);
    
    // Initialize Socket.io server
    initializeSocket(server);
    
    // Handle server errors (like port already in use)
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`\n❌ Port ${PORT} is already in use!`);
        console.error(`   Another process is using port ${PORT}`);
        console.error(`   Solution: Kill the process or use a different port\n`);
        process.exit(1);
      } else {
        console.error('Server error:', error);
        process.exit(1);
      }
    });
    
    server.listen(PORT, () => {
      console.log(`✅ Backend running on port ${PORT}`);
      console.log(`   Health check: http://localhost:${PORT}/health`);
      console.log(`   WebSocket server: ws://localhost:${PORT}`);
      console.log(`   Background processor started (retries every 30s)`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully...');
      backgroundProcessor.stop();
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to start server:', errorMessage);
    process.exit(1);
  }
};

startServer();

