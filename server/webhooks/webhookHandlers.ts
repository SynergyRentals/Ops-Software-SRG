import { Request, Response } from 'express';
import { storage } from '../storage';
import { InsertMaintenanceTask, InsertWebhookEvent } from '@shared/schema';
import { analyzeMaintenanceRequest } from '../services/openai';

// Process webhook from HostAI
export async function handleHostAiWebhook(req: Request, res: Response) {
  try {
    // Store the raw webhook event
    const webhookEvent: InsertWebhookEvent = {
      source: 'hostai',
      payload: req.body,
      processed: false
    };
    
    const storedEvent = await storage.createWebhookEvent(webhookEvent);
    
    // Extract task details from the webhook payload
    const payload = req.body;
    
    if (!payload.property_id || !payload.issue_description) {
      return res.status(400).json({ 
        message: 'Invalid webhook payload, missing required fields',
        event_id: storedEvent.id,
        status: 'failed'
      });
    }
    
    // Find property by external ID or name
    let propertyId;
    const properties = await storage.getProperties();
    
    // Try to match property by nickname or title if external ID mapping is not available
    const matchedProperty = properties.find(p => 
      p.nickname.toLowerCase().includes(payload.property_name?.toLowerCase()) || 
      p.title.toLowerCase().includes(payload.property_name?.toLowerCase())
    );
    
    if (matchedProperty) {
      propertyId = matchedProperty.id;
    } else {
      // Default to first property if no match
      propertyId = properties[0]?.id || 1;
    }
    
    // Use AI to analyze the task and suggest urgency
    const analysis = await analyzeMaintenanceRequest(payload.issue_description);
    
    // Create maintenance task
    const maintenanceTask: InsertMaintenanceTask = {
      title: payload.issue_title || 'Maintenance Required',
      description: payload.issue_description,
      propertyId,
      urgency: analysis.suggestedUrgency,
      status: 'pending',
      dueDate: payload.due_date ? new Date(payload.due_date) : new Date(Date.now() + 24 * 60 * 60 * 1000), // Default to 24hrs if not specified
      source: 'hostai'
    };
    
    const createdTask = await storage.createMaintenanceTask(maintenanceTask);
    
    // Mark webhook as processed
    await storage.updateWebhookEvent(storedEvent.id, { processed: true });
    
    return res.status(201).json({
      message: 'Webhook processed successfully',
      task_id: createdTask.id,
      event_id: storedEvent.id,
      status: 'success'
    });
  } catch (error) {
    console.error('Error processing HostAI webhook:', error);
    return res.status(500).json({
      message: 'Error processing webhook',
      error: error.message,
      status: 'failed'
    });
  }
}

// Process webhook from SuiteOp
export async function handleSuiteOpWebhook(req: Request, res: Response) {
  try {
    // Store the raw webhook event
    const webhookEvent: InsertWebhookEvent = {
      source: 'suiteop',
      payload: req.body,
      processed: false
    };
    
    const storedEvent = await storage.createWebhookEvent(webhookEvent);
    
    // Extract task details from the webhook payload
    const payload = req.body;
    
    if (!payload.property_identifier || !payload.maintenance_details) {
      return res.status(400).json({ 
        message: 'Invalid webhook payload, missing required fields',
        event_id: storedEvent.id,
        status: 'failed'
      });
    }
    
    // Find property by external ID or name
    let propertyId;
    const properties = await storage.getProperties();
    
    // Try to match property by nickname or title
    const matchedProperty = properties.find(p => 
      p.nickname.toLowerCase().includes(payload.property_identifier?.toLowerCase()) || 
      p.title.toLowerCase().includes(payload.property_identifier?.toLowerCase())
    );
    
    if (matchedProperty) {
      propertyId = matchedProperty.id;
    } else {
      // Default to first property if no match
      propertyId = properties[0]?.id || 1;
    }
    
    // Use AI to analyze the task and suggest urgency
    const analysis = await analyzeMaintenanceRequest(payload.maintenance_details);
    
    // Create maintenance task
    const maintenanceTask: InsertMaintenanceTask = {
      title: payload.maintenance_title || 'Maintenance Task',
      description: payload.maintenance_details,
      propertyId,
      urgency: analysis.suggestedUrgency,
      status: 'pending',
      dueDate: payload.scheduled_date ? new Date(payload.scheduled_date) : new Date(Date.now() + 48 * 60 * 60 * 1000), // Default to 48hrs
      source: 'suiteop'
    };
    
    const createdTask = await storage.createMaintenanceTask(maintenanceTask);
    
    // Mark webhook as processed
    await storage.updateWebhookEvent(storedEvent.id, { processed: true });
    
    return res.status(201).json({
      message: 'Webhook processed successfully',
      task_id: createdTask.id,
      event_id: storedEvent.id,
      status: 'success'
    });
  } catch (error) {
    console.error('Error processing SuiteOp webhook:', error);
    return res.status(500).json({
      message: 'Error processing webhook',
      error: error.message,
      status: 'failed'
    });
  }
}
