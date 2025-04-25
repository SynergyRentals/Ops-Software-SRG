import { Request, Response } from 'express';
import { storage } from '../storage';
import { InsertTask } from '@shared/schema';

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
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: 'Failed to fetch tasks', error: error.message });
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
  } catch (error) {
    console.error(`Error fetching task ${req.params.id}:`, error);
    res.status(500).json({ message: 'Failed to fetch task', error: error.message });
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
        obj[key] = taskData[key];
        return obj;
      }, {} as Partial<InsertTask>);
    
    const updatedTask = await storage.updateTask(taskId, validUpdates);
    
    if (!updatedTask) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    res.status(200).json(updatedTask);
  } catch (error) {
    console.error(`Error updating task ${req.params.id}:`, error);
    res.status(500).json({ message: 'Failed to update task', error: error.message });
  }
}