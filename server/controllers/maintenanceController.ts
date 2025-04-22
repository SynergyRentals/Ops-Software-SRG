import { Request, Response } from 'express';
import { storage } from '../storage';
import { InsertMaintenanceTask } from '@shared/schema';
import { analyzeMaintenanceRequest } from '../services/openai';

// Get all maintenance tasks with optional filters
export async function getMaintenanceTasks(req: Request, res: Response) {
  try {
    const { propertyId, status, urgency } = req.query;
    
    const filters: { propertyId?: number; status?: string; urgency?: string } = {};
    
    if (propertyId) {
      filters.propertyId = Number(propertyId);
    }
    
    if (status) {
      filters.status = status as string;
    }
    
    if (urgency) {
      filters.urgency = urgency as string;
    }
    
    const tasks = await storage.getMaintenanceTasks(filters);
    
    // Fetch property details for each task
    const tasksWithProperties = await Promise.all(
      tasks.map(async (task) => {
        const property = await storage.getProperty(task.propertyId);
        return {
          ...task,
          property: property ? {
            id: property.id,
            nickname: property.nickname,
            type: property.type,
            address: property.address,
            imageUrl: property.imageUrl
          } : null
        };
      })
    );
    
    res.status(200).json(tasksWithProperties);
  } catch (error) {
    console.error('Error fetching maintenance tasks:', error);
    res.status(500).json({ message: 'Failed to fetch maintenance tasks', error: error.message });
  }
}

// Get a specific maintenance task by ID
export async function getMaintenanceTask(req: Request, res: Response) {
  try {
    const taskId = Number(req.params.id);
    const task = await storage.getMaintenanceTask(taskId);
    
    if (!task) {
      return res.status(404).json({ message: 'Maintenance task not found' });
    }
    
    // Fetch property details
    const property = await storage.getProperty(task.propertyId);
    
    // Fetch assigned user details if assigned
    let assignedUser = null;
    if (task.assignedTo) {
      const user = await storage.getUser(task.assignedTo);
      if (user) {
        assignedUser = {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role
        };
      }
    }
    
    const taskWithDetails = {
      ...task,
      property: property ? {
        id: property.id,
        nickname: property.nickname,
        type: property.type,
        address: property.address,
        imageUrl: property.imageUrl
      } : null,
      assignedUser
    };
    
    res.status(200).json(taskWithDetails);
  } catch (error) {
    console.error(`Error fetching maintenance task ${req.params.id}:`, error);
    res.status(500).json({ message: 'Failed to fetch maintenance task', error: error.message });
  }
}

// Create a new maintenance task
export async function createMaintenanceTask(req: Request, res: Response) {
  try {
    const { title, description, propertyId, assignedTo, urgency, status, dueDate, source } = req.body;
    
    // Validate property exists
    const property = await storage.getProperty(propertyId);
    if (!property) {
      return res.status(400).json({ message: 'Invalid property ID' });
    }
    
    // Validate assigned user exists if provided
    if (assignedTo) {
      const user = await storage.getUser(assignedTo);
      if (!user) {
        return res.status(400).json({ message: 'Invalid user ID for assignment' });
      }
    }
    
    // Use AI to analyze task if urgency not provided
    let taskUrgency = urgency;
    if (!taskUrgency && description) {
      const analysis = await analyzeMaintenanceRequest(description);
      taskUrgency = analysis.suggestedUrgency;
    }
    
    const taskData: InsertMaintenanceTask = {
      title,
      description,
      propertyId,
      assignedTo: assignedTo || null,
      urgency: taskUrgency || 'medium',
      status: status || 'pending',
      dueDate: dueDate ? new Date(dueDate) : null,
      source: source || 'manual'
    };
    
    const task = await storage.createMaintenanceTask(taskData);
    
    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating maintenance task:', error);
    res.status(500).json({ message: 'Failed to create maintenance task', error: error.message });
  }
}

// Update a maintenance task
export async function updateMaintenanceTask(req: Request, res: Response) {
  try {
    const taskId = Number(req.params.id);
    const task = await storage.getMaintenanceTask(taskId);
    
    if (!task) {
      return res.status(404).json({ message: 'Maintenance task not found' });
    }
    
    const { title, description, propertyId, assignedTo, urgency, status, dueDate } = req.body;
    
    // Validate property exists if changed
    if (propertyId && propertyId !== task.propertyId) {
      const property = await storage.getProperty(propertyId);
      if (!property) {
        return res.status(400).json({ message: 'Invalid property ID' });
      }
    }
    
    // Validate assigned user exists if provided
    if (assignedTo && assignedTo !== task.assignedTo) {
      const user = await storage.getUser(assignedTo);
      if (!user) {
        return res.status(400).json({ message: 'Invalid user ID for assignment' });
      }
    }
    
    const updateData: Partial<InsertMaintenanceTask> = {};
    
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (propertyId !== undefined) updateData.propertyId = propertyId;
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo;
    if (urgency !== undefined) updateData.urgency = urgency;
    if (status !== undefined) updateData.status = status;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    
    const updatedTask = await storage.updateMaintenanceTask(taskId, updateData);
    
    res.status(200).json(updatedTask);
  } catch (error) {
    console.error(`Error updating maintenance task ${req.params.id}:`, error);
    res.status(500).json({ message: 'Failed to update maintenance task', error: error.message });
  }
}

// Delete a maintenance task
export async function deleteMaintenanceTask(req: Request, res: Response) {
  try {
    const taskId = Number(req.params.id);
    const task = await storage.getMaintenanceTask(taskId);
    
    if (!task) {
      return res.status(404).json({ message: 'Maintenance task not found' });
    }
    
    await storage.deleteMaintenanceTask(taskId);
    
    res.status(200).json({ message: 'Maintenance task deleted successfully' });
  } catch (error) {
    console.error(`Error deleting maintenance task ${req.params.id}:`, error);
    res.status(500).json({ message: 'Failed to delete maintenance task', error: error.message });
  }
}
