import fetch from 'node-fetch';

/**
 * Test the webhook endpoint with query parameter authentication
 */
async function testWebhookWithQueryParam() {
  // Configure webhook URL and secret
  const baseUrl = 'http://localhost:5000';
  const webhookSecret = 'test-secret'; // Hard-coded for this specific test
  
  // Test data with unique ID to avoid duplicate issues
  const payload = {
    task: {
      action: 'Test webhook with query parameter auth',
      description: 'Testing if the webhook endpoint works with query parameter authentication'
    },
    guest: {
      guestName: 'Test Guest',
      guestEmail: 'test@example.com'
    },
    listing: {
      listingName: 'Test Property',
      listingId: 'test-property-id-script'
    },
    external_id: 'test-webhook-query-param-' + Date.now()
  };

  console.log('Testing webhook with query parameter authentication');
  console.log('-'.repeat(80));
  
  try {
    // Use the secret as a query parameter
    const url = `${baseUrl}/webhook?secret=${webhookSecret}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log(`Response status: ${response.status}`);
    console.log(`Response data: ${JSON.stringify(data, null, 2)}`);
    
    if (response.status === 201) {
      console.log('\n✅ SUCCESS: Webhook accepted the request with query parameter authentication');
    } else {
      console.log('\n❌ FAILED: Webhook did not accept the request with query parameter authentication');
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}

testWebhookWithQueryParam();