/**
 * Test script to verify the updated webhook authentication changes
 */
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

async function testWebhookWithNoSecret() {
  console.log('Testing webhook with no secret in development mode...');
  try {
    const response = await fetch(`${BASE_URL}/api/webhooks/hostai`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        external_id: `test-${Date.now()}`,
        task: {
          action: 'Test Task',
          description: 'This is a test task'
        },
        guest: {
          guestName: 'Test Guest'
        },
        listing: {
          listingName: 'Test Property'
        }
      })
    });
    
    console.log(`Status: ${response.status}`);
    if (response.status === 201) {
      console.log('✅ Test passed: No secret in development mode returns 201');
    } else {
      console.log('❌ Test failed: Expected 201 in development mode with no secret');
    }
    
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

async function testWebhookWithWrongSecret() {
  console.log('\nTesting webhook with wrong secret in production mode...');
  
  // Save original NODE_ENV
  const originalNodeEnv = process.env.NODE_ENV;
  
  try {
    // Set NODE_ENV to production for this test
    process.env.NODE_ENV = 'production';
    
    const response = await fetch(`${BASE_URL}/api/webhooks/hostai`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-HostAI-Secret': 'wrong-secret'
      },
      body: JSON.stringify({
        external_id: `test-${Date.now()}`,
        title: 'Test Task',
        description: 'This is a test task with wrong secret',
        urgency: 'medium',
        status: 'pending',
        assigned_team: 'maintenance'
      })
    });
    
    console.log(`Status: ${response.status}`);
    if (response.status === 401) {
      console.log('✅ Test passed: Wrong secret in production mode returns 401');
    } else {
      console.log('❌ Test failed: Expected 401 in production mode with wrong secret');
    }
    
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Restore original NODE_ENV
    process.env.NODE_ENV = originalNodeEnv;
  }
}

async function runTests() {
  await testWebhookWithNoSecret();
  await testWebhookWithWrongSecret();
  console.log('\nAll tests completed.');
}

runTests();