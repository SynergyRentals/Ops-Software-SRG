import { Request, Response } from 'express';
import { storage } from '../storage';
import { suggestSchedule, parseReservations } from '../utils/schedule';

// Get scheduling suggestions for a task
export async function getTaskScheduleSuggestions(req: Request, res: Response) {
  try {
    const taskId = Number(req.params.id);
    
    // Get the task
    const task = await storage.getTask(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // For now, stub the reservations with empty array
    // In a real implementation, we would fetch actual reservations from the property
    const mockReservations: { start: string; end: string }[] = [];
    
    // Get property information if listingId/listingName is available
    if (task.listingId) {
      // Try to find the property by nickname (which might match listingName)
      const properties = await storage.getProperties();
      const matchingProperty = properties.find(
        p => p.nickname === task.listingName || p.id.toString() === task.listingId
      );
      
      if (matchingProperty) {
        // In a real implementation, we would fetch reservations from the property's icalUrl
        // For now, we'll just provide a stub
      }
    }
    
    // Use the utility function to suggest schedule slots
    const reservations = parseReservations(mockReservations);
    const suggestions = suggestSchedule(task, reservations);
    
    res.status(200).json({ 
      suggestions,
      taskId: task.id,
      urgency: task.urgency
    });
  } catch (error) {
    console.error('Error getting task schedule suggestions:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ 
      message: 'Failed to get task schedule suggestions', 
      error: errorMessage 
    });
  }
}

// AI-powered scheduling suggestions (existing)
export async function getAiScheduleSuggestions(req: Request, res: Response) {
  try {
    const { propertyId, taskTitle, taskDescription, urgency, availabilityWindows } = req.body;
    
    if (!propertyId || !taskTitle || !taskDescription || !availabilityWindows) {
      return res.status(400).json({ message: 'Missing required fields for scheduling' });
    }
    
    // Validate property exists
    const property = await storage.getProperty(propertyId);
    if (!property) {
      return res.status(400).json({ message: 'Invalid property ID' });
    }
    
    // Get existing tasks for the property to consider in scheduling
    const existingTasks = await storage.getMaintenanceTasks({ propertyId });
    
    // Transform tasks for the AI scheduling function
    const currentTasks = existingTasks
      .filter(task => task.dueDate !== null)
      .map(task => ({
        title: task.title,
        scheduledTime: task.dueDate!.toISOString(),
        duration: 60 // Default duration in minutes
      }));
    
    // Call OpenAI service to suggest schedule
    // Note: This is a different suggestSchedule function from the OpenAI service
    // and not our utility function from utils/schedule.ts
    const suggestion = await import('../services/openai').then(openai => 
      openai.suggestSchedule({
        propertyId,
        taskTitle,
        taskDescription,
        urgency: urgency || 'medium',
        availabilityWindows,
        currentTasks
      })
    );
    
    res.status(200).json(suggestion);
  } catch (error) {
    console.error('Error generating schedule suggestions:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ 
      message: 'Failed to generate schedule suggestions', 
      error: errorMessage 
    });
  }
}

// Create scheduled task (existing)
export async function createScheduledTask(req: Request, res: Response) {
  try {
    // Existing implementation
    res.status(501).json({ message: 'Not implemented yet' });
  } catch (error) {
    console.error('Error creating scheduled task:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ 
      message: 'Failed to create scheduled task', 
      error: errorMessage 
    });
  }
}