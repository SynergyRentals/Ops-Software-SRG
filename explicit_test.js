/**
 * Test the webhook with various authentication methods directly
 */
import fetch from 'node-fetch';

async function testWebhookAuth() {
  console.log('Testing webhook authentication with explicit script');
  console.log('--------------------------------------------------------------------------------');
  
  // Generate a unique ID for each test
  const baseId = `explicit-test-${Date.now()}`;
  
  // Test payload template
  const createPayload = (testId) => ({
    task: {
      action: 'Test webhook authentication',
      description: 'Testing webhook auth with various methods'
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
  });

  const SECRET = 'test-webhook-secret';
  const INVALID_SECRET = 'wrong-secret';
  
  // Test cases
  const tests = [
    {
      name: '1. Bearer token (valid)',
      headers: { 'Authorization': `Bearer ${SECRET}` },
      expectedSuccess: true
    },
    {
      name: '2. Bearer token (invalid)',
      headers: { 'Authorization': `Bearer ${INVALID_SECRET}` },
      expectedSuccess: false
    },
    {
      name: '3. Query parameter (valid)',
      query: `?secret=${SECRET}`,
      expectedSuccess: true
    },
    {
      name: '4. Query parameter (invalid)',
      query: `?secret=${INVALID_SECRET}`,
      expectedSuccess: false
    },
    {
      name: '5. X-HostAI-Secret header (valid)',
      headers: { 'X-HostAI-Secret': SECRET },
      expectedSuccess: true
    },
    {
      name: '6. X-HostAI-Secret header (invalid)',
      headers: { 'X-HostAI-Secret': INVALID_SECRET },
      expectedSuccess: false
    },
    {
      name: '7. X-Webhook-Secret header (valid)',
      headers: { 'X-Webhook-Secret': SECRET },
      expectedSuccess: true
    },
    {
      name: '8. X-Webhook-Secret header (invalid)',
      headers: { 'X-Webhook-Secret': INVALID_SECRET },
      expectedSuccess: false
    }
  ];
  
  // Execute each test
  for (const [index, test] of tests.entries()) {
    const testId = `${baseId}-${index + 1}`;
    const payload = createPayload(testId);
    
    console.log(`\nRunning test: ${test.name}`);
    
    const url = `http://localhost:5000/api/webhooks/hostai${test.query || ''}`;
    console.log(`URL: ${url}`);
    console.log(`Headers: ${JSON.stringify(test.headers || {})}`);
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...test.headers
        },
        body: JSON.stringify(payload)
      });
      
      const statusCode = response.status;
      const data = await response.json();
      
      console.log(`Status code: ${statusCode}`);
      console.log(`Response: ${JSON.stringify(data, null, 2)}`);
      
      const wasSuccessful = statusCode === 201;
      
      if (wasSuccessful === test.expectedSuccess) {
        console.log(`✅ Test passed - Got ${wasSuccessful ? 'success' : 'failure'} as expected`);
      } else {
        console.log(`❌ Test failed - Expected ${test.expectedSuccess ? 'success' : 'failure'} but got ${wasSuccessful ? 'success' : 'failure'}`);
      }
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`Error in test ${test.name}:`, error);
    }
  }
}

// Run the tests
testWebhookAuth();