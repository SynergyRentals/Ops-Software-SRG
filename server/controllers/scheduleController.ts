import { Request, Response } from 'express';
import { suggestSchedule, parseReservations } from '../utils/schedule';
import { storage } from '../storage';
import { InsertTask, TaskUrgency } from '../../shared/schema';

/**
 * Get scheduling suggestions for a task based on urgency level and calendar data
 * Following business rules:
 * - Urgent → today (before 22:00)
 * - High → today, else next-day before 12:00
 * - Medium → reservation checkout day
 * - Low → first fully vacant day
 */
export async function getTaskScheduleSuggestions(req: Request, res: Response) {
  try {
    const taskId = parseInt(req.params.id);
    if (isNaN(taskId)) {
      return res.status(400).json({ message: 'Invalid task ID' });
    }

    // Fetch task from database
    const task = await storage.getTask(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // For demo purposes, let's create some sample reservation data
    // In a real app, this would come from a calendar API or database
    const today = new Date();
    const reservationData = [
      {
        start: new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString(),
        end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3).toISOString()
      },
      {
        start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5).toISOString(),
        end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7).toISOString()
      }
    ];

    // Parse reservations into Date objects
    const reservations = parseReservations(reservationData);

    // Generate suggestions based on task urgency and reservations
    const suggestions = suggestSchedule(task, reservations);

    return res.status(200).json({ 
      task: taskId,
      suggestions 
    });
  } catch (error) {
    console.error('Error generating schedule suggestions:', error);
    return res.status(500).json({ message: 'Failed to generate schedule suggestions' });
  }
}

/**
 * Get AI-assisted scheduling suggestions for multiple tasks
 * Provides optimized scheduling based on task priority and team workload
 */
export async function getAiScheduleSuggestions(req: Request, res: Response) {
  try {
    // Get all pending tasks 
    const tasks = await storage.getTasks({ status: 'new' });
    
    // For now, just provide standard scheduling without AI optimization
    // In a real implementation, this would use ML/AI to optimize across tasks
    const today = new Date();
    const reservationData = [
      {
        start: new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString(),
        end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3).toISOString()
      }
    ];
    
    const reservations = parseReservations(reservationData);
    
    // Generate suggestions for each task
    const scheduleSuggestions = tasks.map(task => {
      const suggestions = suggestSchedule(task, reservations);
      return {
        taskId: task.id,
        taskName: task.action || `Task #${task.id}`,
        urgency: task.urgency,
        teamTarget: task.teamTarget,
        suggestions
      };
    });
    
    return res.status(200).json({
      scheduleSuggestions
    });
  } catch (error) {
    console.error('Error generating AI schedule suggestions:', error);
    return res.status(500).json({ message: 'Failed to generate AI schedule suggestions' });
  }
}

/**
 * Create a scheduled task with the specified date/time
 */
export async function createScheduledTask(req: Request, res: Response) {
  try {
    const { title, description, scheduledFor, teamTarget, urgency, propertyId } = req.body;
    
    if (!title || !scheduledFor || !teamTarget) {
      return res.status(400).json({ message: 'Missing required fields: title, scheduledFor, teamTarget' });
    }
    
    // Create a new task
    const newTask: InsertTask = {
      externalId: null,
      listingId: propertyId ? String(propertyId) : null,
      listingName: null,
      action: title,
      description: description || null,
      sourceType: 'manual',
      sourceLink: null,
      guestName: null,
      guestEmail: null,
      guestPhone: null,
      teamTarget: teamTarget,
      urgency: urgency || TaskUrgency.Medium,
      status: 'scheduled',
      scheduledFor: new Date(scheduledFor),
      createdAt: new Date(),
      rawPayload: {}
    };
    
    const createdTask = await storage.createTask(newTask);
    
    return res.status(201).json({
      task: createdTask,
      message: 'Task scheduled successfully'
    });
  } catch (error) {
    console.error('Error creating scheduled task:', error);
    return res.status(500).json({ message: 'Failed to create scheduled task' });
  }
}