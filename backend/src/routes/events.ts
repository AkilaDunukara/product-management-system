import express from 'express';
import { getSubClient } from '../config/redis';

/**
 * Event Routes - Server-Sent Events implementation
 * Provides real-time notifications via Redis pub/sub integration
 */

const router = express.Router();

/**
 * GET /events/stream - Server-Sent Events endpoint for real-time notifications
 */
router.get('/stream', async (req, res) => {
  const sellerId = req.sellerId;
  
  console.log(`🔌 SSE connection established for seller ${sellerId}`);

  // Set SSE headers for proper streaming
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control',
    'X-Accel-Buffering': 'no' // Disable nginx buffering
  });

  // Send initial connection confirmation
  res.write(`data: ${JSON.stringify({
    type: 'connected',
    sellerId: sellerId,
    timestamp: Date.now(),
    message: 'SSE connection established'
  })}\n\n`);

  let heartbeatInterval: NodeJS.Timeout;
  let isConnected = true;

  try {
    // Subscribe to seller-specific notification channel
    const subClient = getSubClient();
    const channel = `notifications:${sellerId}`;

    await subClient.subscribe(channel, (message) => {
      if (!isConnected) return;
      
      try {
        const notification = JSON.parse(message);
        res.write(`event: ${notification.type}\n`);
        res.write(`data: ${JSON.stringify(notification)}\n\n`);
        console.log(`📨 Sent ${notification.type} notification to seller ${sellerId}`);
      } catch (error) {
        console.error('❌ Error processing notification:', error);
        if (isConnected) {
          res.write(`data: ${JSON.stringify({
            type: 'error',
            message: 'Failed to process notification'
          })}\n\n`);
        }
      }
    });

    // Send heartbeat every 30 seconds to keep connection alive
    heartbeatInterval = setInterval(() => {
      if (isConnected) {
        res.write(': heartbeat\n\n');
      }
    }, 30000);

    // Cleanup function for connection termination
    const cleanup = async () => {
      if (!isConnected) return;
      isConnected = false;
      
      console.log(`🔌 SSE connection closed for seller ${sellerId}`);
      
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
      }
      
      try {
        await subClient.unsubscribe(channel);
      } catch (error) {
        console.error('❌ Error unsubscribing from Redis:', error);
      }
    };

    // Handle connection cleanup on close or error
    req.on('close', cleanup);
    req.on('error', cleanup);

  } catch (error) {
    console.error('❌ SSE setup error:', error);
    if (isConnected) {
      res.write(`data: ${JSON.stringify({
        type: 'error',
        message: 'Failed to establish event stream',
        error_code: 'SSE_SETUP_ERROR'
      })}\n\n`);
    }
  }
});

export default router;
