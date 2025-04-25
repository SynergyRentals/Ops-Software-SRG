import { Request, Response } from 'express';
import { saveTaskFromHostAI } from '../services/taskService';
import { storage } from '../storage';
import { env } from '../env';
import { hostAiWebhookSchema } from './schemas';
import { ZodError } from 'zod';

/**
 * Extract webhook secret from various sources in the request
 * @param req Express request
 * @returns The extracted secret or undefined
 */
function extractSecret(req: Request) {
  // 1) Bearer token
  const auth = req.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.split(" ")[1];

  // 2) query ?secret=
  if (typeof req.query.secret === "string") return req.query.secret;

  // 3) X-HostAI-Secret
  const xHost = req.get("x-hostai-secret");
  if (xHost) return xHost;

  // 4) X-Webhook-Secret
  const xGeneric = req.get("x-webhook-secret");
  if (xGeneric) return xGeneric;

  return undefined;
}

/**
 * Handle HostAI webhook requests on a single static endpoint with flexible authentication:
 * - Bearer token in Authorization header
 * - Secret in URL query parameter (?secret=xyz)
 * - X-HostAI-Secret header
 * - X-Webhook-Secret header
 * - No auth if no WEBHOOK_SECRET is configured (development/staging only)
 * 
 * @param req Express request
 * @param res Express response
 */
export const handleHostAIWebhook = async (req: Request, res: Response) => {
  try {
    // Start timing for performance logging
    const startTime = Date.now();
    
    // Check if a webhook secret is configured or strict mode is forced via query param
    const strictMode = req.query.strict_auth === 'true';
    
    if (!env.WEBHOOK_SECRET && !strictMode) {
      // No webhook secret configured - log warning but allow access (for dev/staging)
      console.warn('⚠️ WARNING: No WEBHOOK_SECRET configured. Webhook authentication is disabled. This is NOT recommended for production.');
    } else {
      const supplied = extractSecret(req);
      // Use either the configured secret or a default test secret in strict mode
      const configured = env.WEBHOOK_SECRET || (strictMode ? 'test-webhook-secret' : '');

      if (configured && supplied !== configured) {
        console.warn("Webhook auth failed. headers=", req.headers, "query=", req.query);
        return res.status(401).json({ message: "Invalid webhook secret" });
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