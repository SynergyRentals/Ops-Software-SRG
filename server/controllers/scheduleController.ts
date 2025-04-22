import { Request, Response } from 'express';
import { storage } from '../storage';
import { suggestSchedule } from '../services/openai';

// AI-powered scheduling suggestions
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
      .filter(task => task.dueDate)
      .map(task => ({
        title: task.title,
        scheduledTime: task.dueDate.toISOString(),
        duration: 60 // Default duration in minutes
      }));
    
    // Call OpenAI to suggest schedule
    const suggestion = await suggestSchedule({
      propertyId,
      taskTitle,
      taskDescription,
      urgency: urgency || 'medium',
      availabilityWindows,
      currentTasks
    });
    
    res.status(200).json(suggestion);
  } catch (error) {
    console.error('Error generating schedule suggestions:', error);
    res.status(500).json({ 
      message: 'Failed to generate schedule suggestions', 
      error: error.message 
    });
  }
}

// Create a maintenance task with AI-assisted scheduling
export async function createScheduledTask(req: Request, res: Response) {
  try {
    const { 
      title, 
      description, 
      propertyId, 
      assignedTo, 
      urgency, 
      suggestedSlot 
    } = req.body;
    
    if (!propertyId || !title || !suggestedSlot || !suggestedSlot.start) {
      return res.status(400).json({ message: 'Missing required fields for scheduled task' });
    }
    
    // Validate property exists
    const property = await storage.getProperty(propertyId);
    if (!property) {
      return res.status(400).json({ message: 'Invalid property ID' });
    }
    
    // Validate user if provided
    if (assignedTo) {
      const user = await storage.getUser(assignedTo);
      if (!user) {
        return res.status(400).json({ message: 'Invalid user ID for assignment' });
      }
    }
    
    // Create the task with the suggested schedule
    const task = await storage.createMaintenanceTask({
      title,
      description,
      propertyId,
      assignedTo: assignedTo || null,
      urgency: urgency || 'medium',
      status: 'pending',
      dueDate: new Date(suggestedSlot.start),
      source: 'ai'
    });
    
    res.status(201).json({
      message: 'Scheduled task created successfully',
      task
    });
  } catch (error) {
    console.error('Error creating scheduled task:', error);
    res.status(500).json({ 
      message: 'Failed to create scheduled task', 
      error: error.message 
    });
  }
}
