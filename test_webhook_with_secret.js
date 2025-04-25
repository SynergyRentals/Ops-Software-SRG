/**
 * Test script to set a WEBHOOK_SECRET and verify that authentication works
 * This script should be run from the terminal with:
 * WEBHOOK_SECRET=test-secret NODE_ENV=production node test_webhook_with_secret.js
 */
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';
const CORRECT_SECRET = 'test-secret'; // Should match what you set in WEBHOOK_SECRET env var
const WRONG_SECRET = 'wrong-secret';

async function testWithCorrectSecret() {
  console.log('Testing webhook with correct secret...');
  try {
    const response = await fetch(`${BASE_URL}/api/webhooks/hostai`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-HostAI-Secret': CORRECT_SECRET
      },
      body: JSON.stringify({
        external_id: `test-${Date.now()}`,
        task: {
          action: 'Test Task',
          description: 'This is a test task with correct secret'
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
      console.log('✅ Test passed: Correct secret returns 201');
    } else {
      console.log('❌ Test failed: Expected 201 but got ' + response.status);
    }
    
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

async function testWithWrongSecret() {
  console.log('\nTesting webhook with wrong secret...');
  try {
    const response = await fetch(`${BASE_URL}/api/webhooks/hostai`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-HostAI-Secret': WRONG_SECRET
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
    
    console.log(`Status: ${response.status}`);
    if (response.status === 401) {
      console.log('✅ Test passed: Wrong secret returns 401');
    } else {
      console.log('❌ Test failed: Expected 401 but got ' + response.status);
    }
    
    try {
      const data = await response.json();
      console.log('Response:', JSON.stringify(data, null, 2));
    } catch (e) {
      console.log('No valid JSON response');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

async function runTests() {
  await testWithCorrectSecret();
  await testWithWrongSecret();
  console.log('\nAll tests completed.');
}

runTests();