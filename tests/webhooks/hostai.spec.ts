import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import supertest from 'supertest';
import express from 'express';
import { ZodError } from 'zod';
import { handleHostAIWebhook } from '../../server/webhooks/hostai';

// Mock dependencies
vi.mock('../../server/services/taskService', () => ({
  saveTaskFromHostAI: vi.fn()
}));

vi.mock('../../server/storage', () => ({
  storage: {
    createWebhookEvent: vi.fn(),
    getTaskByExternalId: vi.fn()
  }
}));

vi.mock('../../server/env', () => ({
  env: {
    WEBHOOK_SECRET: 'test-webhook-secret'
  }
}));

// Import mocks
import { saveTaskFromHostAI } from '../../server/services/taskService';
import { storage } from '../../server/storage';

describe('HostAI Webhook Handler', () => {
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
  
  // Valid payload for testing
  const validPayload = {
    task: {
      action: 'Fix leaking faucet',
      description: 'The kitchen sink faucet is leaking and needs repair'
    },
    guest: {
      guestName: 'Test Guest',
      guestEmail: 'guest@example.com'
    },
    listing: {
      listingName: 'Test Property',
      listingId: 'prop-123'
    },
    external_id: 'test-external-id'
  };
  
  it('should return 201 with valid payload and correct secret', async () => {
    const response = await supertest(app)
      .post('/api/webhooks/hostai')
      .set('Authorization', 'Bearer test-webhook-secret')
      .send(validPayload);
    
    expect(response.status).toBe(201);
    expect(response.body.status).toBe('success');
    expect(mockGetTaskByExternalId).toHaveBeenCalledWith('test-external-id');
    expect(mockCreateWebhookEvent).toHaveBeenCalled();
    expect(mockSaveTask).toHaveBeenCalledWith(validPayload);
  });
  
  it('should return 401 with invalid secret', async () => {
    const response = await supertest(app)
      .post('/api/webhooks/hostai')
      .set('Authorization', 'Bearer wrong-secret')
      .send(validPayload);
    
    expect(response.status).toBe(401);
    expect(mockGetTaskByExternalId).not.toHaveBeenCalled();
    expect(mockCreateWebhookEvent).not.toHaveBeenCalled();
    expect(mockSaveTask).not.toHaveBeenCalled();
  });
  
  it('should return 401 when no Authorization header is provided', async () => {
    const response = await supertest(app)
      .post('/api/webhooks/hostai')
      .send(validPayload);
    
    expect(response.status).toBe(401);
    expect(mockGetTaskByExternalId).not.toHaveBeenCalled();
  });
  
  it('should return 422 with invalid payload', async () => {
    // Missing required 'external_id' field
    const invalidPayload = {
      task: {
        action: 'Fix leaking faucet'
      }
    };
    
    const response = await supertest(app)
      .post('/api/webhooks/hostai')
      .set('Authorization', 'Bearer test-webhook-secret')
      .send(invalidPayload);
    
    expect(response.status).toBe(422);
    expect(response.body.error).toBe('Validation Error');
    expect(mockSaveTask).not.toHaveBeenCalled();
  });
  
  it('should return 409 for duplicate tasks', async () => {
    // Mock that a task with the same external ID already exists
    mockGetTaskByExternalId.mockResolvedValue({ 
      id: 1, 
      externalId: 'test-external-id',
      listingId: 'prop-123'
    });
    
    const response = await supertest(app)
      .post('/api/webhooks/hostai')
      .set('Authorization', 'Bearer test-webhook-secret')
      .send(validPayload);
    
    expect(response.status).toBe(409);
    expect(response.body.status).toBe('ignored');
    expect(response.body.code).toBe('DUPLICATE_TASK');
    expect(mockSaveTask).not.toHaveBeenCalled();
  });
  
  it('should handle internal errors and return 500', async () => {
    mockSaveTask.mockRejectedValue(new Error('Database error'));
    
    const response = await supertest(app)
      .post('/api/webhooks/hostai')
      .set('Authorization', 'Bearer test-webhook-secret')
      .send(validPayload);
    
    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Internal server error processing webhook');
  });
});