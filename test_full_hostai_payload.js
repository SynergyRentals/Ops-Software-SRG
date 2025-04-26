/**
 * Test script to verify that the updated HostAI webhook schema accepts the full payload
 */
async function testFullHostAIPayload() {
  console.log('Testing HostAI webhook with full payload');
  console.log('--------------------------------------------------------------------------------');
  
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
    _creationDate: '2023-04-25T14:30:00Z'
  };
  
  try {
    // Make the request to the webhook endpoint
    console.log('Sending request with full payload...');
    const response = await fetch('http://localhost:5000/api/webhooks/hostai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Include a secret in development mode for testing
        'X-HostAI-Secret': process.env.WEBHOOK_SECRET || 'test-webhook-secret'
      },
      body: JSON.stringify(payload)
    });
    
    const statusCode = response.status;
    let responseText;
    
    try {
      const data = await response.json();
      responseText = JSON.stringify(data, null, 2);
    } catch (e) {
      responseText = await response.text();
    }
    
    console.log(`Response status: ${statusCode}`);
    console.log(`Response body: ${responseText}`);
    
    if (statusCode === 201) {
      console.log('✅ Success! The webhook accepted the full payload.');
    } else if (statusCode === 422) {
      console.log('❌ Failed. The webhook rejected the payload due to validation errors.');
    } else {
      console.log(`❓ Unexpected status code: ${statusCode}`);
    }
  } catch (error) {
    console.error('Error in test:', error);
  }
}

testFullHostAIPayload();