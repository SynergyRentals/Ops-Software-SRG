/**
 * Test the webhook with the exact payload format provided in the requirements
 */
async function testExactPayload() {
  console.log('Testing HostAI webhook with exact payload format from requirements');
  console.log('--------------------------------------------------------------------------------');
  
  // The exact JSON payload format from the requirements
  const payload = {
    task: {
      action: "string",
      description: "string",
      assignee: { firstName: "string", lastName: "string" }
    },
    source: {
      sourceType: "TaskSource",
      link: "string"
    },
    attachments: [
      { name: "string", extension: "string", url: "https://example.com/photo.jpg" }
    ],
    guest: {
      guestName: "string",
      guestEmail: "string",
      guestPhone: "string"
    },
    listing: {
      listingName: "string",
      listingId: "string"
    },
    _creationDate: "2023-04-25T14:30:00Z"
  };
  
  try {
    console.log('Sending request with exact payload format...');
    const response = await fetch('http://localhost:5000/api/webhooks/hostai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
      console.log('✅ Success! The webhook accepted the exact payload format.');
    } else if (statusCode === 422) {
      console.log('❌ Failed. The webhook rejected the payload due to validation errors.');
    } else {
      console.log(`❓ Unexpected status code: ${statusCode}`);
    }
  } catch (error) {
    console.error('Error in test:', error);
  }
}

testExactPayload();