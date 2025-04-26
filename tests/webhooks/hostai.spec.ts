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

// Mock process.env
const originalEnv = process.env;

describe('HostAI Webhook Handler', () => {
  // Set NODE_ENV to production for authentication tests
  beforeEach(() => {
    process.env = { ...originalEnv, NODE_ENV: 'production' };
  });
  
  afterEach(() => {
    process.env = originalEnv;
  });
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
  
  // Complete valid payload for all tests
  const validPayload = {
    task: {
      action: 'Fix leaking faucet',
      description: 'The kitchen sink faucet is leaking and needs repair',
      assignee: { 
        firstName: 'John', 
        lastName: 'Doe' 
      }
    },
    source: {
      sourceType: 'TaskSource',
      link: 'https://example.com/task/12345'
    },
    attachments: [
      { 
        name: 'photo', 
        extension: 'jpg', 
        url: 'https://example.com/photo.jpg' 
      }
    ],
    guest: {
      guestName: 'Test Guest',
      guestEmail: 'guest@example.com',
      guestPhone: '123-456-7890'
    },
    listing: {
      listingName: 'Test Property',
      listingId: 'prop-123'
    },
    _creationDate: '2023-04-25T14:30:00Z',
    external_id: 'test-external-id'
  };

  // Full HostAI payload as per their spec (without external_id for testing auto-generation)
  const fullHostAIPayload = {
    task: {
      action: 'Fix leaking faucet',
      description: 'The kitchen sink faucet is leaking and needs repair',
      assignee: { 
        firstName: 'John', 
        lastName: 'Doe' 
      }
    },
    source: {
      sourceType: 'TaskSource',
      link: 'https://example.com/task/12345'
    },
    attachments: [
      { 
        name: 'photo', 
        extension: 'jpg', 
        url: 'https://example.com/photo.jpg' 
      }
    ],
    guest: {
      guestName: 'Test Guest',
      guestEmail: 'guest@example.com',
      guestPhone: '123-456-7890'
    },
    listing: {
      listingName: 'Test Property',
      listingId: 'prop-123'
    },
    _creationDate: '2023-04-25T14:30:00Z'
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
    // Missing required task.action field
    const invalidPayload = {
      task: {
        description: 'This payload is missing the required action field'
      },
      listing: {
        listingName: 'Test Property',
        listingId: 'prop-123'
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

  it('accepts full HostAI payload and generates external_id', async () => {
    // We need to capture the external_id that gets generated
    mockSaveTask.mockImplementation(payload => {
      return Promise.resolve({ 
        id: 2, 
        externalId: payload.external_id 
      });
    });

    const response = await supertest(app)
      .post('/api/webhooks/hostai')
      .set('Authorization', 'Bearer test-webhook-secret')
      .send(fullHostAIPayload);
    
    expect(response.status).toBe(201);
    expect(response.body.status).toBe('success');
    
    // Verify the external_id was generated
    expect(mockSaveTask).toHaveBeenCalled();
    const savedPayload = mockSaveTask.mock.calls[0][0];
    expect(savedPayload.external_id).toBeDefined();
    
    // Verify that all fields from the payload were passed to the saveTask function
    expect(savedPayload.task.action).toBe(fullHostAIPayload.task.action);
    expect(savedPayload.task.description).toBe(fullHostAIPayload.task.description);
    expect(savedPayload.task.assignee).toEqual(fullHostAIPayload.task.assignee);
    expect(savedPayload.source).toEqual(fullHostAIPayload.source);
    expect(savedPayload.attachments).toEqual(fullHostAIPayload.attachments);
    expect(savedPayload.guest).toEqual(fullHostAIPayload.guest);
    expect(savedPayload.listing).toEqual(fullHostAIPayload.listing);
    expect(savedPayload._creationDate).toBe(fullHostAIPayload._creationDate);
  });
});