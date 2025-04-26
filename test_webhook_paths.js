/**
 * Test script to verify both webhook paths (with and without the /api prefix)
 */
import fetch from 'node-fetch';

async function testWebhookPaths() {
  console.log('Testing multiple webhook path configurations');
  console.log('--------------------------------------------------------------------------------');
  
  // Generate a unique base ID for this test run
  const testBaseId = `path-test-${Date.now()}`;
  
  // Full HostAI payload based on the spec
  const createPayload = (uniqueSuffix) => ({
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
    external_id: `${testBaseId}-${uniqueSuffix}`
  });

  // Define paths to test
  const paths = [
    { name: "1. API prefixed path", path: "/api/webhooks/hostai" },
    { name: "2. Without API prefix", path: "/webhooks/hostai" },
    { name: "3. Simple webhook path", path: "/webhook" }
  ];
  
  // Test each path
  for (const pathInfo of paths) {
    console.log(`\nTesting ${pathInfo.name}: ${pathInfo.path}`);
    console.log('-'.repeat(80));
    
    try {
      // Create a unique payload for this test - important to create fresh payload for each test
      const payload = createPayload(pathInfo.path.replace(/\//g, '-') + '-' + Math.random().toString(36).substring(2, 8));
      
      console.log(`Sending request to ${pathInfo.path} with external_id: ${payload.external_id}`);
      const response = await fetch(`http://localhost:5000${pathInfo.path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-HostAI-Secret': process.env.WEBHOOK_SECRET || 'test-webhook-secret'
        },
        body: JSON.stringify(payload)
      });
      
      const statusCode = response.status;
      let responseData;
      
      try {
        responseData = await response.json();
      } catch (e) {
        responseData = await response.text();
      }
      
      console.log(`Response status: ${statusCode}`);
      console.log(`Response: ${JSON.stringify(responseData, null, 2)}`);
      
      if (statusCode === 201) {
        console.log(`✅ Path ${pathInfo.path} is working properly!`);
      } else {
        console.log(`❌ Path ${pathInfo.path} returned unexpected status: ${statusCode}`);
      }
    } catch (error) {
      console.error(`Error testing ${pathInfo.path}:`, error.message);
    }
  }
}

// Run the tests
testWebhookPaths();