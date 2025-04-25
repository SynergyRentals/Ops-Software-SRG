import { storage } from '../storage';
import { type Task, type InsertTask, type TaskAttachment, type InsertTaskAttachment } from '@shared/schema';
import { broadcast } from './websocketService';
import { type HostAiWebhookPayload } from '../webhooks/schemas';

/**
 * Determine team target based on action text
 * @param action - The action text to analyze
 * @returns The appropriate team target
 */
export const determineTeamTarget = (action: string): string => {
  action = action.toLowerCase();
  
  // Cleaning related keywords
  if (action.includes('clean') || 
      action.includes('wash') || 
      action.includes('vacuum') || 
      action.includes('dust') || 
      action.includes('sweep') ||
      action.includes('mop') ||
      action.includes('laundry') ||
      action.includes('linens') ||
      action.includes('bedding') ||
      action.includes('towels')) {
    return 'cleaning';
  }
  
  // Maintenance related keywords
  if (action.includes('fix') || 
      action.includes('repair') || 
      action.includes('replace') || 
      action.includes('broken') || 
      action.includes('leak') ||
      action.includes('plumb') ||
      action.includes('electric') ||
      action.includes('hvac') ||
      action.includes('heat') ||
      action.includes('cool') ||
      action.includes('air conditioning') ||
      action.includes('appliance')) {
    return 'maintenance';
  }
  
  // Landlord related keywords
  if (action.includes('lease') || 
      action.includes('contract') || 
      action.includes('payment') || 
      action.includes('bill') || 
      action.includes('landlord') ||
      action.includes('owner') ||
      action.includes('rent') ||
      action.includes('extension') ||
      action.includes('legal') ||
      action.includes('permit')) {
    return 'landlord';
  }
  
  // Default to internal
  return 'internal';
};

/**
 * Determine urgency based on action and description
 * @param action - The action text to analyze
 * @param description - The description text to analyze
 * @returns The appropriate urgency level
 */
export const determineUrgency = (action: string, description?: string): string => {
  const text = `${action} ${description || ''}`.toLowerCase();
  
  // Urgent keywords - safety and critical issues
  if (text.includes('emergency') || 
      text.includes('urgent') || 
      text.includes('immediately') || 
      text.includes('asap') || 
      text.includes('safety') ||
      text.includes('dangerous') ||
      text.includes('gas leak') ||
      text.includes('fire') ||
      text.includes('flood') ||
      text.includes('electrical issue') ||
      text.includes('no water') ||
      text.includes('no power') ||
      text.includes('no heat') ||
      text.includes('security')) {
    return 'urgent';
  }
  
  // High priority keywords - affecting guest stay
  if (text.includes('important') || 
      text.includes('high priority') || 
      text.includes('soon') || 
      text.includes('within 24 hours') || 
      text.includes('guest complaint') ||
      text.includes('not working') ||
      text.includes('broken') ||
      text.includes('leak') ||
      text.includes('wifi')) {
    return 'high';
  }
  
  // Low priority keywords - minor issues
  if (text.includes('low priority') || 
      text.includes('when convenient') || 
      text.includes('sometime') || 
      text.includes('eventually') || 
      text.includes('minor') ||
      text.includes('cosmetic') ||
      text.includes('suggestion') ||
      text.includes('idea')) {
    return 'low';
  }
  
  // Default to medium priority
  return 'medium';
};

/**
 * Save a HostAI task to the database
 * @param payload - The HostAI webhook payload
 * @returns The saved task with its ID
 */
export const saveTaskFromHostAI = async (payload: HostAiWebhookPayload): Promise<Task> => {
  try {
    // Extract required fields from payload
    const action = payload.task?.action || '';
    const description = payload.task?.description || '';
    
    // Determine team target and urgency based on action/description
    const teamTarget = determineTeamTarget(action);
    const urgency = determineUrgency(action, description);
    
    // Prepare task data
    const taskData: InsertTask = {
      externalId: payload.external_id,
      listingId: payload.listing?.listingId,
      listingName: payload.listing?.listingName,
      action,
      description,
      sourceType: payload.source?.sourceType,
      sourceLink: payload.source?.link,
      guestName: payload.guest?.guestName,
      guestEmail: payload.guest?.guestEmail,
      guestPhone: payload.guest?.guestPhone,
      teamTarget: teamTarget as "internal" | "cleaning" | "maintenance" | "landlord",
      urgency: urgency as "urgent" | "high" | "medium" | "low",
      status: 'new',
      scheduledFor: payload._creationDate ? new Date(payload._creationDate) : undefined,
      rawPayload: payload
    };
    
    // Save task to database
    const task = await storage.createTask(taskData);
    
    // If attachments exist, save them
    if (payload.attachments && Array.isArray(payload.attachments) && payload.attachments.length > 0) {
      const attachmentsData: InsertTaskAttachment[] = payload.attachments.map((attachment) => ({
        taskId: task.id,
        name: attachment.name || null,
        extension: attachment.extension || null,
        url: attachment.url
      }));
      
      await Promise.all(attachmentsData.map(attachment => 
        storage.createTaskAttachment(attachment)
      ));
    }
    
    // Broadcast the new task to WebSocket clients
    broadcast('task:new', task);
    
    return task;
  } catch (error) {
    console.error('Error saving HostAI task:', error);
    throw error;
  }
};

/**
 * Check if a task with the given external ID and listing ID already exists
 * @param externalId - The external ID of the task
 * @param listingId - The listing ID
 * @returns True if a task already exists, otherwise false
 */
export const taskExists = async (externalId?: string, listingId?: string): Promise<boolean> => {
  if (!externalId) return false;
  
  const existingTask = await storage.getTaskByExternalId(externalId);
  
  // If no task found with this external ID, it doesn't exist
  if (!existingTask) return false;
  
  // If listing ID is provided, make sure it matches
  if (listingId && existingTask.listingId !== listingId) {
    return false;
  }
  
  return true;
};