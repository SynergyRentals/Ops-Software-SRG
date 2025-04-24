import { Request, Response } from 'express';
import { saveHostAITask, taskExists } from '../services/taskService';
import { storage } from '../storage';
import { env } from '../env';

/**
 * Handle HostAI webhook requests
 * @param req Express request
 * @param res Express response
 */
export const handleHostAIWebhook = async (req: Request, res: Response) => {
  try {
    // Start timing for performance logging
    const startTime = Date.now();
    
    // Different authentication strategies
    let authenticated = false;
    
    // Check if we're in development mode with the placeholder secret
    const isDevelopmentMode = process.env.NODE_ENV === 'development';
    const isUsingDevSecret = env.WEBHOOK_SECRET === 'dev-webhook-secret-placeholder-do-not-use-in-prod';
    
    if (isDevelopmentMode && isUsingDevSecret) {
      console.warn('⚠️ Using development webhook secret placeholder. Set a proper WEBHOOK_SECRET in production!');
      
      // In development, check for Bearer token but don't require it if webhookKeyParam is present
      const authHeader = req.headers.authorization;
      const webhookKeyParam = req.query.key;
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        // Verify Bearer token if provided
        const token = authHeader.split(' ')[1];
        if (token === env.WEBHOOK_SECRET) {
          authenticated = true;
        }
      }
      
      // Accept key in URL query parameter as fallback in development
      if (!authenticated && webhookKeyParam === env.WEBHOOK_SECRET) {
        authenticated = true;
        console.warn('⚠️ Using query parameter for webhook authentication - not recommended for production!');
      }
      
      // In development, allow requests without authentication if WEBHOOK_REQUIRE_AUTH is "false"
      if (!authenticated && process.env.WEBHOOK_REQUIRE_AUTH === "false") {
        authenticated = true;
        console.warn('⚠️ SECURITY RISK: Webhook authentication is disabled. This should NEVER be used in production!');
      }
    } else {
      // In production, only accept proper Bearer token authentication
      const authHeader = req.headers.authorization;
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        if (env.WEBHOOK_SECRET && token === env.WEBHOOK_SECRET) {
          authenticated = true;
        }
      }
    }
    
    // Reject unauthenticated requests
    if (!authenticated) {
      console.error('Unauthorized webhook request: Authentication failed');
      return res.status(401).json({ error: 'Unauthorized: Authentication failed' });
    }
    
    const webhookPayload = req.body;
    
    // Basic payload validation
    if (!webhookPayload || typeof webhookPayload !== 'object') {
      console.error('Invalid payload format');
      return res.status(400).json({ error: 'Invalid payload format' });
    }
    
    // Check for required fields
    if (!webhookPayload.external_id) {
      console.error('Missing external_id in payload');
      return res.status(400).json({ error: 'Missing external_id in payload' });
    }
    
    // Check for idempotency - don't process the same request twice
    const exists = await taskExists(webhookPayload.external_id, webhookPayload.listing?.listingId);
    
    if (exists) {
      console.log(`Ignoring duplicate task with external_id: ${webhookPayload.external_id}`);
      return res.status(200).json({ 
        status: 'success',
        message: 'Task already exists, ignoring duplicate',
        existed: true
      });
    }
    
    // Store the webhook event for audit purposes
    await storage.createWebhookEvent({
      source: 'hostai',
      payload: webhookPayload,
      processed: false
    });
    
    // Process and save the task
    const task = await saveHostAITask(webhookPayload);
    
    // Calculate processing time
    const processingTime = Date.now() - startTime;
    
    // Log performance metrics
    console.log(`HostAI webhook processed in ${processingTime}ms`);
    
    // Return success with the created task
    return res.status(201).json({
      status: 'success',
      task,
      processingTime
    });
  } catch (error) {
    console.error('Error handling HostAI webhook:', error);
    return res.status(500).json({ error: 'Internal server error processing webhook' });
  }
};