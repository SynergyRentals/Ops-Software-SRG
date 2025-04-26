import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import supertest from 'supertest';
import express from 'express';
import { handleHostAIWebhook } from '../../server/webhooks/hostai';

// Mock dependencies
vi.mock('../../server/services/taskService', () => ({
  saveTaskFromHostAI: vi.fn().mockResolvedValue({ id: 1, externalId: 'generated-external-id' })
}));

vi.mock('../../server/storage', () => ({
  storage: {
    createWebhookEvent: vi.fn().mockResolvedValue({ id: 1 }),
    getTaskByExternalId: vi.fn().mockResolvedValue(null)
  }
}));

// Mock the env to simulate development environment with no secret
vi.mock('../../server/env', () => ({
  env: {
    NODE_ENV: 'development',
    WEBHOOK_SECRET: undefined
  }
}));

// Import mocks
import { saveTaskFromHostAI } from '../../server/services/taskService';
import { storage } from '../../server/storage';

describe('HostAI Webhook Handler - No Secret in Development Mode', () => {
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
    mockSaveTask.mockResolvedValue({ id: 1, externalId: 'generated-external-id' });
    mockCreateWebhookEvent.mockResolvedValue({ id: 1 });
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });
  
  // Valid payload without external_id
  const validPayloadNoExternalId = {
    task: {
      action: 'Clean up room 205',
      description: 'Guest reported that the room needs cleaning'
    },
    source: {
      sourceType: 'sms',
      link: 'https://example.com/messages/123'
    },
    guest: {
      guestName: 'John Doe',
      guestEmail: 'john.doe@example.com',
      guestPhone: '+1234567890'
    },
    listing: {
      listingName: 'Downtown Luxury Apartment',
      listingId: 'apt-205'
    },
    _creationDate: new Date().toISOString()
  };
  
  it('should allow requests without authentication in development mode', async () => {
    const response = await supertest(app)
      .post('/api/webhooks/hostai')
      .send(validPayloadNoExternalId);
    
    expect(response.status).toBe(201);
    expect(response.body.status).toBe('success');
    expect(mockCreateWebhookEvent).toHaveBeenCalled();
    expect(mockSaveTask).toHaveBeenCalled();
  });
  
  it('should generate an external_id when none is provided', async () => {
    // Mock the saveTaskFromHostAI to simulate hash generation
    mockSaveTask.mockImplementation((payload) => {
      const generatedHash = 'auto-generated-hash';
      return Promise.resolve({ 
        id: 1, 
        externalId: generatedHash,
        action: payload.task.action
      });
    });
    
    const response = await supertest(app)
      .post('/api/webhooks/hostai')
      .send(validPayloadNoExternalId);
    
    expect(response.status).toBe(201);
    expect(response.body.task).toHaveProperty('externalId');
    expect(mockSaveTask).toHaveBeenCalledWith(expect.objectContaining({
      task: expect.objectContaining({
        action: validPayloadNoExternalId.task.action
      }),
      listing: expect.objectContaining({
        listingId: validPayloadNoExternalId.listing.listingId
      })
    }));
  });
  
  it('should still work with Authorization header in dev mode', async () => {
    const response = await supertest(app)
      .post('/api/webhooks/hostai')
      .set('Authorization', 'Bearer some-random-secret')
      .send(validPayloadNoExternalId);
    
    expect(response.status).toBe(201);
    expect(response.body.status).toBe('success');
  });
  
  it('should still work with X-HostAI-Secret header in dev mode', async () => {
    const response = await supertest(app)
      .post('/api/webhooks/hostai')
      .set('X-HostAI-Secret', 'some-random-secret')
      .send(validPayloadNoExternalId);
    
    expect(response.status).toBe(201);
    expect(response.body.status).toBe('success');
  });
  
  it('should log details about the incoming request', async () => {
    // Create a spy on console.log
    const consoleSpy = vi.spyOn(console, 'log');
    
    await supertest(app)
      .post('/api/webhooks/hostai')
      .set('X-Test-Header', 'test-value')
      .send(validPayloadNoExternalId);
    
    // Check if our logging mechanism was called
    expect(consoleSpy).toHaveBeenCalled();
    
    // Restore the original implementation
    consoleSpy.mockRestore();
  });
});