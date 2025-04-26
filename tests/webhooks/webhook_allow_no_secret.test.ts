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

// Mock the env to simulate production environment with a secret and ALLOW_NO_SECRET=true
vi.mock('../../server/env', () => ({
  env: {
    WEBHOOK_SECRET: 'test-webhook-secret',
    ALLOW_NO_SECRET: 'true'
  }
}));

// Import mocks
import { saveTaskFromHostAI } from '../../server/services/taskService';
import { storage } from '../../server/storage';

// Mock process.env
const originalEnv = process.env;

describe('HostAI Webhook Handler - ALLOW_NO_SECRET=true', () => {
  // Set NODE_ENV to production for authentication tests
  beforeEach(() => {
    process.env = { ...originalEnv, NODE_ENV: 'production' };
    
    // Spy on console.warn to verify warning messages
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });
  
  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
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
  
  it('should accept requests without authentication when ALLOW_NO_SECRET=true in production', async () => {
    const response = await supertest(app)
      .post('/api/webhooks/hostai')
      .send(validPayload);
    
    expect(response.status).toBe(201);
    expect(response.body.status).toBe('success');
    expect(mockSaveTask).toHaveBeenCalled();
    
    // Verify warning message was logged
    expect(console.warn).toHaveBeenCalledWith('⚠️ Secret bypass active (ALLOW_NO_SECRET=true)');
  });
  
  it('should still accept requests with valid secret when ALLOW_NO_SECRET=true', async () => {
    const response = await supertest(app)
      .post('/api/webhooks/hostai')
      .set('Authorization', 'Bearer test-webhook-secret')
      .send(validPayload);
    
    expect(response.status).toBe(201);
    expect(response.body.status).toBe('success');
    expect(mockSaveTask).toHaveBeenCalled();
    
    // No warning should be logged when a valid secret is provided
    expect(console.warn).not.toHaveBeenCalled();
  });
  
  it('should still reject requests with invalid secret even when ALLOW_NO_SECRET=true', async () => {
    const response = await supertest(app)
      .post('/api/webhooks/hostai')
      .set('Authorization', 'Bearer wrong-secret')
      .send(validPayload);
    
    expect(response.status).toBe(401);
    expect(mockSaveTask).not.toHaveBeenCalled();
    
    // No warning should be logged for invalid secret
    expect(console.warn).not.toHaveBeenCalled();
  });
});