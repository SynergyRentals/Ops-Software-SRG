import { Request, Response } from 'express';
import { storage } from '../storage';
import { TaskStatus } from '@shared/schema';
import { broadcast } from '../services/websocketService';
import { sendWatchNotification } from '../services/notificationService';

/**
 * Mark a task as being watched
 * Increments the watch_count and notifies if this is a repeat watch for the same external_id
 */
export async function watchTask(req: Request, res: Response) {
  try {
    const taskId = Number(req.params.id);
    const task = await storage.getTask(taskId);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Update task status to "watch" and increment watch_count
    const updatedTask = await storage.updateTask(taskId, {
      status: TaskStatus.Watch,
      watchCount: (task.watchCount || 0) + 1
    });
    
    // If this task has an external ID and has been watched more than once,
    // trigger a notification to relevant stakeholders
    if (updatedTask && updatedTask.externalId && updatedTask.watchCount > 1) {
      // This is a repeat watch, send notification
      try {
        await sendWatchNotification(updatedTask);
      } catch (notifyError) {
        console.error('Error sending watch notification:', notifyError);
        // Continue execution even if notification fails
      }
    }
    
    if (!updatedTask) {
      return res.status(500).json({ message: 'Failed to update task' });
    }
    
    // Broadcast the update via WebSocket
    broadcast('task:updated', updatedTask);
    
    res.status(200).json(updatedTask);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error watching task ${req.params.id}:`, error);
    res.status(500).json({ message: 'Failed to mark task as watched', error: errorMessage });
  }
}

/**
 * Mark a task as closed
 * Sets status to closed and records the closed timestamp
 */
export async function closeTask(req: Request, res: Response) {
  try {
    const taskId = Number(req.params.id);
    const task = await storage.getTask(taskId);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Update task status to "closed" and record the timestamp
    const updatedTask = await storage.updateTask(taskId, {
      status: TaskStatus.Closed,
      closedAt: new Date()
    });
    
    if (!updatedTask) {
      return res.status(500).json({ message: 'Failed to close task' });
    }
    
    // Broadcast the update via WebSocket
    broadcast('task:updated', updatedTask);
    
    res.status(200).json(updatedTask);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error closing task ${req.params.id}:`, error);
    res.status(500).json({ message: 'Failed to close task', error: errorMessage });
  }
}