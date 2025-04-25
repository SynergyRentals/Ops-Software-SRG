import { Request, Response } from 'express';
import { saveTaskFromHostAI } from '../services/taskService';
import { storage } from '../storage';
import { env } from '../env';
import { hostAiWebhookSchema } from './schemas';
import { ZodError } from 'zod';

/**
 * Handle HostAI webhook requests on a single static endpoint with optional Bearer token auth
 * @param req Express request
 * @param res Express response
 */
export const handleHostAIWebhook = async (req: Request, res: Response) => {
  try {
    // Start timing for performance logging
    const startTime = Date.now();
    
    // Authentication is now optional since HostAI doesn't support headers
    // If a secret is set, we'll check for it, but we won't require it
    if (env.WEBHOOK_SECRET && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      
      if (authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        if (token !== env.WEBHOOK_SECRET) {
          return res.status(401).json({ error: 'Unauthorized: Invalid webhook token' });
        }
      }
    }
    
    // Validate payload against schema
    try {
      const webhookPayload = hostAiWebhookSchema.parse(req.body);
      
      // Check for idempotency - don't process the same request twice
      try {
        const existingTask = await storage.getTaskByExternalId(webhookPayload.external_id);
        
        if (existingTask) {
          console.log(`Ignoring duplicate task with external_id: ${webhookPayload.external_id}`);
          return res.status(409).json({ 
            status: 'ignored',
            message: 'Task already exists, ignoring duplicate',
            code: 'DUPLICATE_TASK'
          });
        }
      } catch (error) {
        console.error('Error checking for existing task:', error);
        // If there was an error checking for duplicates, we'll continue and let the database
        // handle any constraint violations
      }
      
      // Store the webhook event for audit purposes
      await storage.createWebhookEvent({
        source: 'hostai',
        payload: webhookPayload,
        processed: false
      });
      
      // Process and save the task
      const task = await saveTaskFromHostAI(webhookPayload);
      
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
      if (error instanceof ZodError) {
        return res.status(422).json({ 
          error: 'Validation Error', 
          details: error.format(),
          message: 'The webhook payload failed validation'
        });
      }
      throw error; // re-throw for the outer try/catch
    }
  } catch (error) {
    console.error('Error handling HostAI webhook:', error);
    return res.status(500).json({ error: 'Internal server error processing webhook' });
  }
};