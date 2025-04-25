/**
 * Test the webhook endpoint with custom header authentication (X-HostAI-Secret, X-Webhook-Secret)
 */
async function testWebhookWithCustomHeaders() {
  console.log('Testing webhook with custom header authentication');
  console.log('--------------------------------------------------------------------------------');
  
  const externalId = `test-webhook-headers-${Date.now()}`;
  
  // Test payload - simulate a HostAI request
  const payload = {
    task: {
      action: 'Test webhook with custom header auth',
      description: 'Testing if the webhook endpoint works with X-HostAI-Secret and X-Webhook-Secret headers'
    },
    guest: {
      guestName: 'Test Guest',
      guestEmail: 'test@example.com'
    },
    listing: {
      listingId: 'test-property-id-script',
      listingName: 'Test Property'
    },
    external_id: externalId
  };
  
  try {
    // Test 1: X-HostAI-Secret header
    console.log('Test 1: Using X-HostAI-Secret header');
    const response1 = await fetch('http://localhost:5000/api/webhooks/hostai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-HostAI-Secret': process.env.WEBHOOK_SECRET || 'test-webhook-secret'
      },
      body: JSON.stringify(payload)
    });
    
    const data1 = await response1.json();
    console.log(`Response status: ${response1.status}`);
    console.log(`Response data: ${JSON.stringify(data1, null, 2)}`);
    
    if (response1.status === 201) {
      console.log('\n✅ SUCCESS: Webhook accepted the request with X-HostAI-Secret header');
    } else {
      console.log('\n❌ FAILURE: Webhook rejected the request with X-HostAI-Secret header');
    }
    
    console.log('\n--------------------------------------------------------------------------------');
    
    // Test 2: X-Webhook-Secret header
    // Change external_id to avoid duplicate detection
    payload.external_id = `${externalId}-2`;
    console.log('Test 2: Using X-Webhook-Secret header');
    const response2 = await fetch('http://localhost:5000/api/webhooks/hostai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': process.env.WEBHOOK_SECRET || 'test-webhook-secret'
      },
      body: JSON.stringify(payload)
    });
    
    const data2 = await response2.json();
    console.log(`Response status: ${response2.status}`);
    console.log(`Response data: ${JSON.stringify(data2, null, 2)}`);
    
    if (response2.status === 201) {
      console.log('\n✅ SUCCESS: Webhook accepted the request with X-Webhook-Secret header');
    } else {
      console.log('\n❌ FAILURE: Webhook rejected the request with X-Webhook-Secret header');
    }
    
  } catch (error) {
    console.error('Error testing webhook:', error);
  }
}

testWebhookWithCustomHeaders();