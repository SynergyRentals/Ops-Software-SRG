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
    const taskData: InsertTask = req.body;
    
    // Ensure status is set
    if (!taskData.status) {
      taskData.status = TaskStatus.New;
    }
    
    // Create the task
    const task = await storage.createTask(taskData);
    
    // Return the created task
    res.status(201).json(task);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error creating task:', error);
    res.status(500).json({ message: 'Failed to create task', error: errorMessage });
  }
}

// Update a task
export async function updateTask(req: Request, res: Response) {
  try {
    const taskId = Number(req.params.id);
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
    
    const updatedTask = await storage.updateTask(taskId, validUpdates);
    
    if (!updatedTask) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    res.status(200).json(updatedTask);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error updating task ${req.params.id}:`, error);
    res.status(500).json({ message: 'Failed to update task', error: errorMessage });
  }
}