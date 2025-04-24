// Note: This test file requires Vitest to be installed
// Run tests with: npx vitest run tests/db/task.spec.ts

// Importing test utilities - commented out until Vitest is installed
// import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db, pool } from '../../server/db';
import { 
  tasks, 
  taskAttachments, 
  TaskTeamTarget, 
  TaskUrgency, 
  TaskStatus
} from '../../shared/schema';
import { eq } from 'drizzle-orm';

describe('Task Database Schema Tests', () => {
  // Clean up any test data before and after tests
  beforeAll(async () => {
    await db.delete(taskAttachments);
    await db.delete(tasks);
  });

  afterAll(async () => {
    await db.delete(taskAttachments);
    await db.delete(tasks);
    await pool.end();
  });

  it('should create a task with all fields', async () => {
    const payload = {
      task: {
        action: 'fix',
        description: 'Fix the bathroom sink',
        assignee: { firstName: 'John', lastName: 'Doe' }
      },
      source: { sourceType: 'guest_app', link: 'https://example.com/request/123' },
      attachments: [{ name: 'sink_photo', extension: 'jpg', url: 'https://example.com/photos/sink.jpg' }],
      guest: { guestName: 'Jane Smith', guestEmail: 'jane@example.com', guestPhone: '555-123-4567' },
      listing: { listingName: 'Beach House', listingId: 'listing123' },
      _creationDate: '2025-04-24T18:02:11.000Z'
    };

    // Insert task
    const [insertedTask] = await db.insert(tasks).values({
      externalId: 'task-123',
      listingId: payload.listing.listingId,
      listingName: payload.listing.listingName,
      action: payload.task.action,
      description: payload.task.description,
      sourceType: payload.source.sourceType,
      sourceLink: payload.source.link,
      guestName: payload.guest.guestName,
      guestEmail: payload.guest.guestEmail,
      guestPhone: payload.guest.guestPhone,
      teamTarget: TaskTeamTarget.Maintenance,
      urgency: TaskUrgency.High,
      status: TaskStatus.New,
      scheduledFor: new Date(payload._creationDate),
      rawPayload: payload
    }).returning();

    expect(insertedTask.id).toBeDefined();
    expect(insertedTask.externalId).toBe('task-123');
    expect(insertedTask.listingId).toBe('listing123');
    expect(insertedTask.teamTarget).toBe(TaskTeamTarget.Maintenance);
    
    // Test attachment insertion
    const attachment = payload.attachments[0];
    const [insertedAttachment] = await db.insert(taskAttachments).values({
      taskId: insertedTask.id,
      name: attachment.name,
      extension: attachment.extension,
      url: attachment.url
    }).returning();
    
    expect(insertedAttachment.id).toBeDefined();
    expect(insertedAttachment.taskId).toBe(insertedTask.id);
    expect(insertedAttachment.name).toBe('sink_photo');
    
    // Verify relationship
    const [foundTask] = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, insertedTask.id));
      
    expect(foundTask).toBeDefined();
    
    // Get related attachments
    const attachments = await db
      .select()
      .from(taskAttachments)
      .where(eq(taskAttachments.taskId, insertedTask.id));
      
    expect(attachments.length).toBe(1);
    expect(attachments[0].url).toBe('https://example.com/photos/sink.jpg');
  });

  it('should use correct default values for enums', async () => {
    // Insert with defaults
    const [defaultsTask] = await db.insert(tasks).values({
      externalId: 'task-defaults',
      listingId: 'listing999',
      listingName: 'Mountain Lodge',
      action: 'check',
      description: 'Check heating system',
      rawPayload: { task: { action: 'check', description: 'Check heating system' } }
    }).returning();
    
    // Verify defaults
    expect(defaultsTask.teamTarget).toBe(TaskTeamTarget.Internal);
    expect(defaultsTask.urgency).toBe(TaskUrgency.Medium);
    expect(defaultsTask.status).toBe(TaskStatus.New);
  });

  it('should cascade delete attachments when task is deleted', async () => {
    // Create a task
    const [testTask] = await db.insert(tasks).values({
      externalId: 'task-cascade',
      action: 'test',
      description: 'Testing cascade delete',
      rawPayload: { task: { action: 'test', description: 'Testing cascade delete' } }
    }).returning();
    
    // Add multiple attachments
    await db.insert(taskAttachments).values([
      {
        taskId: testTask.id,
        name: 'photo1',
        extension: 'jpg',
        url: 'https://example.com/photos/1.jpg'
      },
      {
        taskId: testTask.id,
        name: 'photo2',
        extension: 'jpg',
        url: 'https://example.com/photos/2.jpg'
      }
    ]);
    
    // Verify attachments exist
    const attachmentsBefore = await db
      .select()
      .from(taskAttachments)
      .where(eq(taskAttachments.taskId, testTask.id));
      
    expect(attachmentsBefore.length).toBe(2);
    
    // Delete the task
    await db.delete(tasks).where(eq(tasks.id, testTask.id));
    
    // Verify all attachments are gone (cascade delete)
    const attachmentsAfter = await db
      .select()
      .from(taskAttachments)
      .where(eq(taskAttachments.taskId, testTask.id));
      
    expect(attachmentsAfter.length).toBe(0);
  });
});