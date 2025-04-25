import { db } from '../db';
import { tasks } from '@shared/schema';
import { and, eq, lt } from 'drizzle-orm';

/**
 * Cleanup function to purge closed tasks older than 30 days
 * @returns Number of tasks purged
 */
export async function purgeOldClosedTasks(): Promise<number> {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Delete tasks that are closed and have a closedAt date older than 30 days
    const result = await db.delete(tasks).where(
      and(
        eq(tasks.status, 'closed'),
        lt(tasks.closedAt, thirtyDaysAgo)
      )
    );
    
    // Get the count of affected rows 
    // Note: Postgres returns the deleted rows, so we check the array length
    // For other databases we might need a different approach
    if (Array.isArray(result)) {
      console.log(`Purged ${result.length} closed tasks older than 30 days`);
      return result.length;
    } else {
      // For databases that return a count directly
      console.log(`Purged ${result} closed tasks older than 30 days`);
      return Number(result);
    }
  } catch (error) {
    console.error('Error purging old closed tasks:', error);
    throw error;
  }
}

/**
 * Run the cleanup job
 * This function would be called by a scheduler in a production environment
 */
export async function runCleanupJob(): Promise<void> {
  try {
    console.log('[CRON] Starting cleanup job to purge old closed tasks');
    const purgedCount = await purgeOldClosedTasks();
    console.log(`[CRON] Cleanup job completed. Purged ${purgedCount} tasks.`);
  } catch (error) {
    console.error('[CRON] Error running cleanup job:', error);
  }
}

// If this file is run directly (for testing), execute the cleanup job
if (require.main === module) {
  runCleanupJob()
    .then(() => {
      console.log('Cleanup job completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('Cleanup job failed:', error);
      process.exit(1);
    });
}