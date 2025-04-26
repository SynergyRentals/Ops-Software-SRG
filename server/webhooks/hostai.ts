import { Request, Response } from 'express';
import { saveTaskFromHostAI } from '../services/taskService';
import { storage } from '../storage';
import { env } from '../env';
import { hostAiWebhookSchema } from './schemas';
import { ZodError } from 'zod';
import crypto from 'crypto';

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
    
    // Enhanced debugging - Print ALL request information
    console.info("🌐 HostAI webhook request received", {
      headers: req.headers,
      query: req.query,
      contentType: req.get('Content-Type'),
      contentLength: req.get('Content-Length'),
      method: req.method,
      path: req.path
    });
    
    // Log the raw body content to diagnose parsing issues
    console.info("📦 HostAI webhook raw body:", {
      bodyType: typeof req.body,
      bodyEmpty: !req.body || Object.keys(req.body).length === 0,
      bodyContent: req.body
    });
    
    // Verify Content-Type header
    const contentType = req.get('Content-Type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error("❌ Invalid Content-Type header:", contentType);
      return res.status(400).json({
        error: 'Invalid Content-Type',
        message: 'The request must have Content-Type: application/json',
        receivedContentType: contentType
      });
    }
    
    // Verify body is not empty
    if (!req.body || Object.keys(req.body).length === 0) {
      console.error("❌ Empty request body");
      return res.status(400).json({
        error: 'Empty Request Body',
        message: 'The request body is empty or was not parsed as JSON properly',
        tip: 'Ensure you are sending a valid JSON payload with Content-Type: application/json'
      });
    }
    
    // New consolidated auth check implementation
    const supplied = req.get("authorization")?.replace("Bearer ","")
             || req.query.secret
             || req.get("x-hostai-secret")
             || req.get("x-webhook-secret");
    
    // Check if secret bypass is allowed
    const bypass = env.ALLOW_NO_SECRET === "true";
    
    if (env.WEBHOOK_SECRET && supplied !== env.WEBHOOK_SECRET) {
      return res.status(401).json({ message: "Invalid webhook secret" });
    }
    // If WEBHOOK_SECRET is undefined, skip auth entirely
    
    // Log a warning if bypass is active and no secret is supplied
    if (bypass && !supplied) {
      console.warn("⚠️ Secret bypass active (ALLOW_NO_SECRET=true)");
    }
    
    // Validate payload against schema
    try {
      // Ensure we have a valid object to parse
      if (typeof req.body !== 'object') {
        throw new Error('Request body is not a valid object');
      }
      
      const data = hostAiWebhookSchema.parse(req.body);

      // Generate a fallback external_id if one isn't provided in the payload
      const externalId = data.external_id || crypto.createHash("sha1")
        .update(`${data.listing.listingId}|${data._creationDate}`)
        .digest("hex");

      // Check for idempotency - don't process the same request twice
      try {
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
        payload: data,
        processed: false
      });
      
      // Process and save the task
      const task = await saveTaskFromHostAI({ ...data, external_id: externalId });
      
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
        // Enhanced Zod validation error logging
        console.error("❌ HostAI Zod validation failed", {
          issues: error.errors, 
          body: req.body,
          bodyType: typeof req.body,
          bodyKeys: req.body ? Object.keys(req.body) : 'no keys'
        });
        
        // Detailed response for validation errors
        return res.status(422).json({ 
          error: 'Validation Error', 
          details: error.format(),
          message: 'The webhook payload failed validation',
          requiredStructure: {
            task: {
              action: "string - REQUIRED",
              description: "string - REQUIRED",
              assignee: {
                firstName: "string - REQUIRED",
                lastName: "string - REQUIRED"
              }
            },
            source: { sourceType: "string", link: "string" },
            attachments: [{ name: "string?", extension: "string?", url: "URL string" }],
            guest: { guestName: "string", guestEmail: "string", guestPhone: "string" },
            listing: { listingName: "string", listingId: "string" },
            _creationDate: "ISO date string",
            external_id: "string (optional)"
          }
        });
      } else if (error instanceof Error) {
        console.error("❌ Error in HostAI webhook payload processing:", error.message);
        return res.status(400).json({
          error: 'Request Processing Error',
          message: error.message,
          tip: 'Check that your request body is properly formatted JSON'
        });
      }
      throw error; // re-throw for the outer try/catch
    }
  } catch (error) {
    // Enhanced general error logging
    console.error('❌ Error handling HostAI webhook:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      requestBody: req.body,
      requestHeaders: req.headers
    });
    
    return res.status(500).json({ 
      error: 'Internal server error processing webhook',
      message: error instanceof Error ? error.message : 'Unknown error',
      tip: 'Check server logs for details and ensure your JSON payload is properly formatted'
    });
  }
};