/**
 * Test the webhook endpoint with invalid authentication to check error logging
 */
async function testWebhookInvalidAuth() {
  console.log('Testing webhook with invalid authentication');
  console.log('--------------------------------------------------------------------------------');
  
  // Set environment variables for this process only - this will not affect the server
  process.env.WEBHOOK_SECRET = 'test-webhook-secret';
  
  console.log('Note: This test only works if the server has WEBHOOK_SECRET set.');
  console.log('Since we cannot set environment variables for the running server from this script,');
  console.log('we need to manually set it on the server side to test authentication failure.');
  console.log('--------------------------------------------------------------------------------');
  
  const externalId = `test-webhook-invalid-auth-${Date.now()}`;
  
  // Test payload - simulate a HostAI request
  const payload = {
    task: {
      action: 'Test webhook with invalid auth',
      description: 'Testing if the webhook endpoint properly rejects invalid authentication'
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
    // Test with invalid secret
    console.log('Sending request with invalid secret');
    const response = await fetch('http://localhost:5000/api/webhooks/hostai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-HostAI-Secret': 'invalid-secret-value' // Intentionally wrong
      },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    console.log(`Response status: ${response.status}`);
    console.log(`Response data: ${JSON.stringify(data, null, 2)}`);
    
    if (response.status === 401) {
      console.log('\n✅ SUCCESS: Webhook correctly rejected invalid authentication');
      console.log('Check server logs to verify header and query information was logged');
    } else {
      console.log('\n❌ FAILURE: Webhook should have rejected this request, but it didn\'t');
    }
    
  } catch (error) {
    console.error('Error testing webhook:', error);
  }
}

testWebhookInvalidAuth();