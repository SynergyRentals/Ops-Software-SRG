import { Request, Response } from 'express';
import { storage } from '../storage';

export async function getOverview(req: Request, res: Response) {
  try {
    const stats = await storage.getDashboardStats();
    
    res.status(200).json(stats);
  } catch (error) {
    console.error('Error fetching dashboard overview:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard overview', error: error.message });
  }
}

export async function getProgressWidgets(req: Request, res: Response) {
  try {
    // Get pending tasks
    const pendingTasks = await storage.getMaintenanceTasks({ status: 'pending' });
    const completedTasks = await storage.getMaintenanceTasks({ status: 'completed' });
    
    // Calculate progress
    const totalTasks = pendingTasks.length + completedTasks.length;
    const completionRate = totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0;
    
    // Get recent tasks
    const allTasks = [...pendingTasks, ...completedTasks]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
    
    // Get low stock items
    const lowStockItems = await storage.getLowStockItems();
    
    // Get properties with tasks
    const properties = await storage.getProperties();
    const propertyStats = await Promise.all(
      properties.map(async (property) => {
        const propertyTasks = await storage.getMaintenanceTasks({ propertyId: property.id });
        const activeTasks = propertyTasks.filter(task => task.status === 'pending' || task.status === 'in_progress');
        
        return {
          id: property.id,
          name: property.nickname,
          activeTasks: activeTasks.length,
          totalTasks: propertyTasks.length
        };
      })
    );
    
    res.status(200).json({
      taskCompletion: {
        rate: completionRate,
        completed: completedTasks.length,
        total: totalTasks
      },
      recentTasks: allTasks,
      lowStockItems,
      propertyStats
    });
  } catch (error) {
    console.error('Error fetching dashboard widgets:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard widgets', error: error.message });
  }
}
