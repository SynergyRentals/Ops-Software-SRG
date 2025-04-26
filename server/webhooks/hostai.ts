import { Request, Response } from 'express';
import { saveTaskFromHostAI } from '../services/taskService';
import { storage } from '../storage';
import { env } from '../env';
import { hostAiWebhookSchema } from './schemas';
import { ZodError } from 'zod';
import * as crypto from 'crypto';

/**
 * Extract webhook secret from various sources in the request
 * @param req Express request
 * @returns The extracted secret or undefined
 */
function extractSecret(req: Request) {
  const auth = req.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7);

  if (typeof req.query.secret === "string") return req.query.secret;

  return req.get("x-hostai-secret") || req.get("x-webhook-secret");
}

/**
 * Handle HostAI webhook requests on a single static endpoint with flexible authentication:
 * - Bearer token in Authorization header
 * - Secret in URL query parameter (?secret=xyz)
 * - X-HostAI-Secret header
 * - X-Webhook-Secret header
 * - Authentication bypassed in development mode if no secret is supplied
 * 
 * Detailed debug logs are included to help troubleshoot authentication issues.
 * 
 * @param req Express request
 * @param res Express response
 */
export const handleHostAIWebhook = async (req: Request, res: Response) => {
  try {
    // Start timing for performance logging
    const startTime = Date.now();
    
    // Print all headers and query params BEFORE auth check
    console.info("🌐 HostAI webhook", {headers: req.headers, query: req.query});
    
    // New consolidated auth check implementation
    const supplied = req.get("authorization")?.replace("Bearer ","")
             || req.query.secret
             || req.get("x-hostai-secret")
             || req.get("x-webhook-secret");
             
    if (env.WEBHOOK_SECRET && supplied !== env.WEBHOOK_SECRET
        && process.env.NODE_ENV === "production") {
      return res.status(401).json({message: "Invalid webhook secret"});
    }
    
    // Validate payload against schema
    try {
      const webhookPayload = hostAiWebhookSchema.parse(req.body);
      
      // If no external_id is provided, generate one using a hash of listingId and creationDate
      if (!webhookPayload.external_id) {
        const listingId = webhookPayload.listing?.listingId || '';
        const creationDate = webhookPayload._creationDate || Date.now().toString();
        const hashInput = `${listingId}|${creationDate}`;
        
        const externalId = crypto
          .createHash('sha1')
          .update(hashInput)
          .digest('hex');
        
        console.log(`No external_id provided, generated: ${externalId}`);
        webhookPayload.external_id = externalId;
      }
      
      // Check for idempotency - don't process the same request twice
      try {
        // We know external_id exists now because we just created it if it didn't exist
        const externalId = webhookPayload.external_id as string;
        const existingTask = await storage.getTaskByExternalId(externalId);
        
        if (existingTask) {
          console.log(`Ignoring duplicate task with external_id: ${externalId}`);
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