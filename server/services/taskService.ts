import { storage } from '../storage';
import { InsertTask, InsertTaskAttachment, TaskTeamTarget, TaskUrgency, Task } from '@shared/schema';
import { broadcast } from './websocketService';

interface HostAIPayload {
  task: {
    action?: string;
    description?: string;
    assignee?: {
      firstName?: string;
      lastName?: string;
    };
  };
  source?: {
    sourceType?: string;
    link?: string;
  };
  guest?: {
    guestName?: string;
    guestEmail?: string;
    guestPhone?: string;
  };
  listing?: {
    listingName?: string;
    listingId?: string;
  };
  attachments?: Array<{
    name?: string;
    extension?: string;
    url: string;
  }>;
  external_id?: string;
  _creationDate?: string;
  [key: string]: any;
}

/**
 * Determine team target based on action text
 * @param action - The action text to analyze
 * @returns The appropriate team target
 */
export const determineTeamTarget = (action: string): string => {
  action = action.toLowerCase();
  
  if (action.includes('clean') || action.includes('cleaning')) {
    return TaskTeamTarget.Cleaning;
  }
  
  if (action.includes('maintenance') || 
      action.includes('repair') || 
      action.includes('fix') || 
      action.includes('broken')) {
    return TaskTeamTarget.Maintenance;
  }
  
  // Default to internal team
  return TaskTeamTarget.Internal;
};

/**
 * Determine urgency based on action and description
 * @param action - The action text to analyze
 * @param description - The description text to analyze
 * @returns The appropriate urgency level
 */
export const determineUrgency = (action: string, description?: string): string => {
  const combinedText = (action + ' ' + (description || '')).toLowerCase();
  
  // Check for urgent keywords
  if (combinedText.includes('urgent') || 
      combinedText.includes('emergency') ||
      combinedText.includes('immediately') ||
      combinedText.includes('asap') ||
      combinedText.includes('leak') ||
      combinedText.includes('flooding')) {
    return TaskUrgency.Urgent;
  }
  
  // Check for high priority keywords
  if (combinedText.includes('high priority') || 
      combinedText.includes('important') ||
      combinedText.includes('soon')) {
    return TaskUrgency.High;
  }
  
  // Check for low priority keywords
  if (combinedText.includes('low priority') || 
      combinedText.includes('when convenient') ||
      combinedText.includes('sometime')) {
    return TaskUrgency.Low;
  }
  
  // Default to medium
  return TaskUrgency.Medium;
};

/**
 * Save a HostAI task to the database
 * @param payload - The HostAI webhook payload
 * @returns The saved task with its ID
 */
export const saveHostAITask = async (payload: HostAIPayload): Promise<Task> => {
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
      const attachmentsData: InsertTaskAttachment[] = payload.attachments.map(attachment => ({
        taskId: task.id,
        name: attachment.name,
        extension: attachment.extension,
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