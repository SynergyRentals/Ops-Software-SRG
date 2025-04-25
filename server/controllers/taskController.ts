import { Request, Response } from 'express';
import { storage } from '../storage';
import { InsertTask, TaskStatus } from '@shared/schema';

// Get all tasks with optional filters
export async function getTasks(req: Request, res: Response) {
  try {
    const { status, urgency, teamTarget } = req.query;
    
    const filters: { status?: string; urgency?: string; teamTarget?: string } = {};
    
    if (status) {
      filters.status = status as string;
    }
    
    if (urgency) {
      filters.urgency = urgency as string;
    }
    
    if (teamTarget) {
      filters.teamTarget = teamTarget as string;
    }
    
    const tasks = await storage.getTasks(filters);
    
    res.status(200).json(tasks);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: 'Failed to fetch tasks', error: errorMessage });
  }
}

// Get a specific task by ID
export async function getTask(req: Request, res: Response) {
  try {
    const taskId = Number(req.params.id);
    const task = await storage.getTask(taskId);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    res.status(200).json(task);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error fetching task ${req.params.id}:`, error);
    res.status(500).json({ message: 'Failed to fetch task', error: errorMessage });
  }
}

// Create a new task
export async function createTask(req: Request, res: Response) {
  try {
    // Import the modules we need
    const { TaskStatus } = await import('@shared/schema');
    const { broadcast } = await import('../services/websocketService');
    
    try {
      // Prepare the task data - make sure to include required fields
      let taskData = {
        ...req.body,
        status: req.body.status || TaskStatus.New,
        // Store the original request body as rawPayload (required by Zod schema)
        rawPayload: req.body 
      };
      
      // Create the task
      const task = await storage.createTask(taskData);
      
      // Broadcast the new task to WebSocket clients
      broadcast('task:new', task);
      
      // Return the created task
      res.status(201).json(task);
    } catch (dbError: any) {
      // Handle database errors
      if (dbError.code) {
        // Database constraint violation or other SQL error
        console.error('Database error creating task:', dbError);
        return res.status(400).json({ 
          message: 'Database error creating task', 
          error: dbError.message 
        });
      }
      
      // Handle Zod validation errors if they come from storage layer
      if (dbError.errors) {
        console.error('Validation error:', dbError.errors);
        return res.status(422).json({ 
          message: 'Invalid task data', 
          errors: dbError.errors
        });
      }
      
      throw dbError; // Re-throw unexpected errors
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error creating task:', error);
    res.status(500).json({ message: 'Failed to create task', error: errorMessage });
  }
}

// Update a task
export async function updateTask(req: Request, res: Response) {
  try {
    const { broadcast } = await import('../services/websocketService');
    const taskId = Number(req.params.id);
    
    // Validate the request body with Zod partially
    try {
      const taskData: Partial<InsertTask> = req.body;
      
      // Validate the fields we allow to update
      const allowedUpdates = ['teamTarget', 'urgency', 'status', 'scheduledFor'];
      
      // Filter out any fields that are not allowed to be updated
      const validUpdates = Object.keys(taskData)
        .filter(key => allowedUpdates.includes(key))
        .reduce((obj, key) => {
          if (allowedUpdates.includes(key)) {
            // Special handling for dates
            if (key === 'scheduledFor' && taskData.scheduledFor) {
              try {
                // Convert ISO string to Date object, or keep Date object as is
                (obj as any)[key] = new Date(taskData.scheduledFor);
              } catch (err) {
                console.error("Failed to parse scheduledFor date:", err);
                throw new Error("Invalid date format for scheduledFor");
              }
            } else {
              (obj as any)[key] = taskData[key as keyof typeof taskData];
            }
          }
          return obj;
        }, {} as Partial<InsertTask>);
      
      // Update the task in storage
      const updatedTask = await storage.updateTask(taskId, validUpdates);
      
      if (!updatedTask) {
        return res.status(404).json({ message: 'Task not found' });
      }
      
      // Broadcast the updated task to WebSocket clients
      broadcast('task:updated', updatedTask);
      
      // Return the updated task
      res.status(200).json(updatedTask);
    } catch (zodError: any) {
      // Handle Zod validation errors with a 422 status code
      if (zodError.errors) {
        console.error('Zod validation error:', zodError.errors);
        return res.status(422).json({ 
          message: 'Invalid task data for update', 
          errors: zodError.errors
        });
      }
      throw zodError; // Re-throw if it's not a Zod validation error
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error updating task ${req.params.id}:`, error);
    res.status(500).json({ message: 'Failed to update task', error: errorMessage });
  }
}