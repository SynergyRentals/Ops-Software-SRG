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

// Mock the env to simulate production environment with a secret
vi.mock('../../server/env', () => ({
  env: {
    NODE_ENV: 'production',
    WEBHOOK_SECRET: 'test-webhook-secret'
  }
}));

// Import mocks
import { saveTaskFromHostAI } from '../../server/services/taskService';
import { storage } from '../../server/storage';

describe('HostAI Webhook Handler - With Secret Headers', () => {
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
  
  // Valid payload with external_id
  const validPayload = {
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
    external_id: 'test-external-id-123',
    _creationDate: new Date().toISOString()
  };
  
  it('should require authentication in production mode', async () => {
    const response = await supertest(app)
      .post('/api/webhooks/hostai')
      .send(validPayload);
    
    expect(response.status).toBe(401);
    expect(mockSaveTask).not.toHaveBeenCalled();
  });
  
  it('should accept requests with Authorization Bearer token', async () => {
    const response = await supertest(app)
      .post('/api/webhooks/hostai')
      .set('Authorization', 'Bearer test-webhook-secret')
      .send(validPayload);
    
    expect(response.status).toBe(201);
    expect(response.body.status).toBe('success');
    expect(mockSaveTask).toHaveBeenCalled();
  });
  
  it('should accept requests with X-HostAI-Secret header', async () => {
    const response = await supertest(app)
      .post('/api/webhooks/hostai')
      .set('X-HostAI-Secret', 'test-webhook-secret')
      .send(validPayload);
    
    expect(response.status).toBe(201);
    expect(response.body.status).toBe('success');
    expect(mockSaveTask).toHaveBeenCalled();
  });
  
  it('should accept requests with X-Webhook-Secret header', async () => {
    const response = await supertest(app)
      .post('/api/webhooks/hostai')
      .set('X-Webhook-Secret', 'test-webhook-secret')
      .send(validPayload);
    
    expect(response.status).toBe(201);
    expect(response.body.status).toBe('success');
    expect(mockSaveTask).toHaveBeenCalled();
  });
  
  it('should accept requests with secret query parameter', async () => {
    const response = await supertest(app)
      .post('/api/webhooks/hostai?secret=test-webhook-secret')
      .send(validPayload);
    
    expect(response.status).toBe(201);
    expect(response.body.status).toBe('success');
    expect(mockSaveTask).toHaveBeenCalled();
  });
  
  it('should reject requests with invalid Bearer token', async () => {
    const response = await supertest(app)
      .post('/api/webhooks/hostai')
      .set('Authorization', 'Bearer wrong-secret')
      .send(validPayload);
    
    expect(response.status).toBe(401);
    expect(mockSaveTask).not.toHaveBeenCalled();
  });
  
  it('should reject requests with invalid X-HostAI-Secret header', async () => {
    const response = await supertest(app)
      .post('/api/webhooks/hostai')
      .set('X-HostAI-Secret', 'wrong-secret')
      .send(validPayload);
    
    expect(response.status).toBe(401);
    expect(mockSaveTask).not.toHaveBeenCalled();
  });
  
  it('should reject requests with invalid X-Webhook-Secret header', async () => {
    const response = await supertest(app)
      .post('/api/webhooks/hostai')
      .set('X-Webhook-Secret', 'wrong-secret')
      .send(validPayload);
    
    expect(response.status).toBe(401);
    expect(mockSaveTask).not.toHaveBeenCalled();
  });
  
  it('should reject requests with invalid secret query parameter', async () => {
    const response = await supertest(app)
      .post('/api/webhooks/hostai?secret=wrong-secret')
      .send(validPayload);
    
    expect(response.status).toBe(401);
    expect(mockSaveTask).not.toHaveBeenCalled();
  });
});