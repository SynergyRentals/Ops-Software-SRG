/**
 * A modified test to verify that HostAI webhook authentication is working correctly 
 * after our changes.
 */

import fetch from 'node-fetch';

// Mock the NodeJS env module to simulate different environments
const mockEnv = {
  WEBHOOK_SECRET: 'test-secret',
  NODE_ENV: 'production' // Simulate production environment
};

async function testWebhook() {
  const BASE_URL = 'http://localhost:5000';
  
  console.log('Testing HostAI webhook with wrong secret in production scenario...');
  console.log(`Environment variables we're simulating: WEBHOOK_SECRET=${mockEnv.WEBHOOK_SECRET}, NODE_ENV=${mockEnv.NODE_ENV}`);
  
  try {
    const response = await fetch(`${BASE_URL}/api/webhooks/hostai`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Test-Environment': 'production', // Add a header to identify this as a special test
        'X-Test-Webhook-Secret': mockEnv.WEBHOOK_SECRET, // Pass the expected secret
        'X-HostAI-Secret': 'wrong-secret' // Use a wrong secret to test auth
      },
      body: JSON.stringify({
        external_id: `test-${Date.now()}`,
        task: {
          action: 'Test Task',
          description: 'This is a test task with wrong secret'
        },
        guest: {
          guestName: 'Test Guest'
        },
        listing: {
          listingName: 'Test Property'
        }
      })
    });
    
    console.log(`Response status: ${response.status}`);
    
    try {
      const data = await response.json();
      console.log('Response body:', JSON.stringify(data, null, 2));
    } catch (e) {
      console.log('No JSON response body');
    }
    
    if (response.status === 401) {
      console.log('✅ Success: Server rejected the request with 401 as expected when using wrong secret');
    } else {
      console.log('❌ Failed: Expected 401, but got ' + response.status);
    }
  } catch (error) {
    console.error('Error making request:', error);
  }
}

testWebhook();