import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import supertest from 'supertest';
import express from 'express';
import { handleHostAIWebhook } from '../../server/webhooks/hostai';

// Mock dependencies
vi.mock('../../server/services/taskService', () => ({
  saveTaskFromHostAI: vi.fn().mockResolvedValue({ id: 1, externalId: 'test-external-id' })
}));

vi.mock('../../server/storage', () => ({
  storage: {
    createWebhookEvent: vi.fn().mockResolvedValue({ id: 1 }),
    getTaskByExternalId: vi.fn().mockResolvedValue(null)
  }
}));

// Mock the env to simulate development environment (for simplicity)
vi.mock('../../server/env', () => ({
  env: {
    NODE_ENV: 'development',
    WEBHOOK_SECRET: undefined
  }
}));

// Import mocks
import { saveTaskFromHostAI } from '../../server/services/taskService';
import { storage } from '../../server/storage';

describe('HostAI Webhook Handler - Bad Payload Validation', () => {
  let app: express.Express;
  let mockGetTaskByExternalId: any;
  let mockSaveTask: any;
  let mockCreateWebhookEvent: any;
  
  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.post('/api/webhooks/hostai', handleHostAIWebhook);
    
    // Reset mocks
    mockGetTaskByExternalId = vi.mocked(storage.getTaskByExternalId).mockReset();
    mockSaveTask = vi.mocked(saveTaskFromHostAI).mockReset();
    mockCreateWebhookEvent = vi.mocked(storage.createWebhookEvent).mockReset();
    
    // Default successful implementations
    mockGetTaskByExternalId.mockResolvedValue(null); // No existing task
    mockSaveTask.mockResolvedValue({ id: 1, externalId: 'test-external-id' });
    mockCreateWebhookEvent.mockResolvedValue({ id: 1 });
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });
  
  // Base valid payload for reference
  const baseValidPayload = {
    task: {
      action: 'Fix broken AC in room 302',
      description: 'The air conditioning unit is not cooling properly'
    },
    source: {
      sourceType: 'phone',
      link: 'https://example.com/calls/789'
    },
    guest: {
      guestName: 'Jane Smith',
      guestEmail: 'jane.smith@example.com',
      guestPhone: '+1987654321'
    },
    listing: {
      listingName: 'City Center Suite',
      listingId: 'cc-302'
    },
    _creationDate: new Date().toISOString()
  };
  
  it('should reject payloads missing task.action field', async () => {
    const invalidPayload = {
      ...baseValidPayload,
      task: {
        description: 'Missing the required action field'
      }
    };
    
    const response = await supertest(app)
      .post('/api/webhooks/hostai')
      .send(invalidPayload);
    
    expect(response.status).toBe(422);
    expect(response.body.error).toBe('Validation Error');
    expect(response.body.details.task).toBeDefined();
    expect(response.body.details.task.action).toBeDefined();
    expect(mockSaveTask).not.toHaveBeenCalled();
  });
  
  it('should reject payloads with missing task object', async () => {
    // Create a new payload without the task property
    const { task, ...invalidPayload } = baseValidPayload;
    
    const response = await supertest(app)
      .post('/api/webhooks/hostai')
      .send(invalidPayload);
    
    expect(response.status).toBe(422);
    expect(response.body.error).toBe('Validation Error');
    expect(mockSaveTask).not.toHaveBeenCalled();
  });
  
  it('should accept payloads missing optional fields', async () => {
    const minimalPayload = {
      task: {
        action: 'Minimal valid task'
      },
      listing: {
        listingId: 'minimal-id',
        listingName: 'Minimal Listing'
      }
    };
    
    const response = await supertest(app)
      .post('/api/webhooks/hostai')
      .send(minimalPayload);
    
    expect(response.status).toBe(201);
    expect(response.body.status).toBe('success');
    expect(mockSaveTask).toHaveBeenCalled();
  });
  
  it('should handle empty task description', async () => {
    const payload = {
      ...baseValidPayload,
      task: {
        action: 'Task with empty description',
        description: ''
      }
    };
    
    const response = await supertest(app)
      .post('/api/webhooks/hostai')
      .send(payload);
    
    expect(response.status).toBe(201);
    expect(response.body.status).toBe('success');
    expect(mockSaveTask).toHaveBeenCalled();
  });
  
  it('should accept payloads with external_id field', async () => {
    const payload = {
      ...baseValidPayload,
      external_id: 'custom-external-id'
    };
    
    mockSaveTask.mockResolvedValue({ 
      id: 1, 
      externalId: 'custom-external-id',
      action: payload.task.action
    });
    
    const response = await supertest(app)
      .post('/api/webhooks/hostai')
      .send(payload);
    
    expect(response.status).toBe(201);
    expect(response.body.task.externalId).toBe('custom-external-id');
    expect(mockSaveTask).toHaveBeenCalledWith(expect.objectContaining({
      external_id: 'custom-external-id'
    }));
  });
  
  it('should reject malformed JSON payloads', async () => {
    const response = await supertest(app)
      .post('/api/webhooks/hostai')
      .set('Content-Type', 'application/json')
      .send('{"task": {"action": "Malformed JSON}}'); // Intentionally malformed
    
    expect(response.status).toBe(400);
    expect(mockSaveTask).not.toHaveBeenCalled();
  });
  
  it('should reject duplicate tasks', async () => {
    // Configure mock to simulate a task with the same external_id
    mockGetTaskByExternalId.mockResolvedValue({
      id: 999,
      externalId: 'existing-external-id'
    });
    
    const payload = {
      ...baseValidPayload,
      external_id: 'existing-external-id'
    };
    
    const response = await supertest(app)
      .post('/api/webhooks/hostai')
      .send(payload);
    
    expect(response.status).toBe(409);
    expect(response.body.status).toBe('ignored');
    expect(response.body.code).toBe('DUPLICATE_TASK');
    expect(mockSaveTask).not.toHaveBeenCalled();
  });
});