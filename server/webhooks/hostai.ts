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
    
    // Verify authentication using Bearer token
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Unauthorized webhook request: Missing Bearer token');
      return res.status(401).json({ error: 'Unauthorized: Missing Bearer token' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Check if we're using the development placeholder secret
    if (env.WEBHOOK_SECRET === 'dev-webhook-secret-placeholder-do-not-use-in-prod' && process.env.NODE_ENV === 'development') {
      console.warn('⚠️ Using development webhook secret placeholder. Set a proper WEBHOOK_SECRET in production!');
    }
    
    // Validate the token against the environment secret
    if (!env.WEBHOOK_SECRET || token !== env.WEBHOOK_SECRET) {
      console.error('Unauthorized webhook request: Invalid token');
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
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