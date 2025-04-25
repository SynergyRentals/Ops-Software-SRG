/**
 * Test the webhook with strict authentication mode enabled
 */
import fetch from 'node-fetch';

async function testStrictAuth() {
  console.log('Testing webhook with strict authentication mode');
  console.log('--------------------------------------------------------------------------------');
  
  // Generate a unique ID for this test
  const testId = `strict-auth-test-${Date.now()}`;
  
  // Test payload
  const payload = {
    task: {
      action: 'Test strict authentication',
      description: 'Testing if strict auth mode works correctly'
    },
    guest: {
      guestName: 'Test Guest',
      guestEmail: 'test@example.com'
    },
    listing: {
      listingId: 'test-property-id',
      listingName: 'Test Property'
    },
    external_id: testId
  };

  const SECRET = 'test-webhook-secret';
  const INVALID_SECRET = 'wrong-secret';
  
  // Test scenarios
  const tests = [
    {
      name: '1. Valid secret with strict auth',
      url: 'http://localhost:5000/api/webhooks/hostai?strict_auth=true',
      headers: { 'X-HostAI-Secret': SECRET },
      expectedStatus: 201
    },
    {
      name: '2. Invalid secret with strict auth',
      url: 'http://localhost:5000/api/webhooks/hostai?strict_auth=true',
      headers: { 'X-HostAI-Secret': INVALID_SECRET },
      expectedStatus: 401
    },
    {
      name: '3. No secret with strict auth',
      url: 'http://localhost:5000/api/webhooks/hostai?strict_auth=true',
      headers: {},
      expectedStatus: 401
    }
  ];
  
  // Execute each test
  for (const [index, test] of tests.entries()) {
    console.log(`\nRunning test: ${test.name}`);
    console.log(`URL: ${test.url}`);
    console.log(`Headers: ${JSON.stringify(test.headers || {})}`);
    
    // Use a different external ID for each test to prevent duplicates
    const currentPayload = {
      ...payload,
      external_id: `${testId}-${index + 1}`
    };
    
    try {
      const response = await fetch(test.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...test.headers
        },
        body: JSON.stringify(currentPayload)
      });
      
      const statusCode = response.status;
      const responseText = await response.text();
      
      try {
        const data = JSON.parse(responseText);
        console.log(`Status code: ${statusCode}`);
        console.log(`Response: ${JSON.stringify(data, null, 2)}`);
      } catch (e) {
        console.log(`Status code: ${statusCode}`);
        console.log(`Response (text): ${responseText}`);
      }
      
      if (statusCode === test.expectedStatus) {
        console.log(`✅ Test passed - Got expected status code ${statusCode}`);
      } else {
        console.log(`❌ Test failed - Expected ${test.expectedStatus} but got ${statusCode}`);
      }
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`Error in test ${test.name}:`, error);
    }
  }
}

// Run the tests
testStrictAuth();