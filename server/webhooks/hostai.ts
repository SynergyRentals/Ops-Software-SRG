import { Request, Response } from 'express';
import { z } from 'zod';
import { saveHostAITask, taskExists } from '../services/taskService';

// Zod schema for HostAI webhook payload validation
const hostAIAttachmentSchema = z.object({
  name: z.string().optional(),
  extension: z.string().optional(),
  url: z.string().url()
});

const hostAIPayloadSchema = z.object({
  external_id: z.string().optional(),
  task: z.object({
    action: z.string(),
    description: z.string().optional(),
    assignee: z.object({
      firstName: z.string().optional(),
      lastName: z.string().optional()
    }).optional()
  }),
  source: z.object({
    sourceType: z.string().optional(),
    link: z.string().url().optional()
  }).optional(),
  guest: z.object({
    guestName: z.string().optional(),
    guestEmail: z.string().email().optional(),
    guestPhone: z.string().optional()
  }).optional(),
  listing: z.object({
    listingName: z.string().optional(),
    listingId: z.string().optional()
  }).optional(),
  attachments: z.array(hostAIAttachmentSchema).optional(),
  _creationDate: z.string().datetime().optional()
});

/**
 * Handle HostAI webhook requests
 * @param req Express request
 * @param res Express response
 */
export const handleHostAIWebhook = async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    // 1. Check authorization (Bearer token)
    const authHeader = req.headers.authorization;
    const webhookSecret = process.env.WEBHOOK_SECRET;
    
    if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.slice(7) !== webhookSecret) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or missing authentication token'
      });
    }
    
    // 2. Validate payload schema
    const validationResult = hostAIPayloadSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(422).json({
        error: 'Invalid payload',
        validation_errors: validationResult.error.format(),
        message: 'The request payload does not match the expected schema'
      });
    }
    
    const payload = validationResult.data;
    
    // 3. Check for duplicate task (idempotency)
    const isDuplicate = await taskExists(payload.external_id, payload.listing?.listingId);
    
    if (isDuplicate) {
      return res.status(409).json({
        error: 'Duplicate task',
        message: 'A task with this external_id and listing_id already exists',
        external_id: payload.external_id,
        listing_id: payload.listing?.listingId
      });
    }
    
    // 4. Process and save the task
    const savedTask = await saveHostAITask(payload);
    
    // 5. Return success response
    const processingTime = Date.now() - startTime;
    
    return res.status(200).json({
      success: true,
      message: 'Task successfully processed',
      task_id: savedTask.id,
      team_target: savedTask.teamTarget,
      urgency: savedTask.urgency,
      processing_time_ms: processingTime
    });
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('Error handling HostAI webhook:', error);
    
    return res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred while processing the webhook',
      processing_time_ms: processingTime
    });
  }
};