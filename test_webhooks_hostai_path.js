/**
 * Test script to verify the /webhooks/hostai path specifically
 */
import fetch from 'node-fetch';

async function testWebhooksHostaiPath() {
  console.log('Testing the /webhooks/hostai path specifically');
  console.log('--------------------------------------------------------------------------------');
  
  // Generate a unique ID for this test
  const uniqueId = `path-test-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  
  // Full HostAI payload based on the spec
  const payload = {
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
    external_id: uniqueId
  };
  
  try {
    console.log(`Sending request to /webhooks/hostai with external_id: ${uniqueId}`);
    
    const response = await fetch('http://localhost:5000/webhooks/hostai', {
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
    console.log(`Response data: ${JSON.stringify(responseData, null, 2)}`);
    
    if (statusCode === 201) {
      console.log('✅ Path /webhooks/hostai is working properly!');
    } else {
      console.log(`❌ Path /webhooks/hostai returned unexpected status: ${statusCode}`);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the test
testWebhooksHostaiPath();