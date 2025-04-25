import fetch from 'node-fetch';

/**
 * Test the webhook endpoint with different authentication methods
 */
async function testWebhook() {
  // Configure webhook URL and secret (if any)
  const baseUrl = 'http://localhost:5000';
  const webhookSecret = process.env.WEBHOOK_SECRET || '';
  
  // Test data
  const payload = {
    task: {
      action: 'Test webhook from test script',
      description: 'Testing if the webhook endpoint works properly'
    },
    guest: {
      guestName: 'Test Guest',
      guestEmail: 'test@example.com'
    },
    listing: {
      listingName: 'Test Property',
      listingId: 'test-property-id-script'
    },
    external_id: 'test-webhook-script-' + Date.now()
  };

  // Test scenarios
  const tests = [
    {
      name: "1. No auth - standard webhook endpoint",
      url: `${baseUrl}/webhook`,
      headers: { 'Content-Type': 'application/json' }
    },
    {
      name: "2. No auth - API webhook endpoint",
      url: `${baseUrl}/api/webhooks/hostai`,
      headers: { 'Content-Type': 'application/json' }
    }
  ];
  
  // Add authentication tests if we have a secret
  if (webhookSecret) {
    tests.push(
      {
        name: "3. Auth with Bearer token",
        url: `${baseUrl}/webhook`,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${webhookSecret}`
        }
      },
      {
        name: "4. Auth with query parameter",
        url: `${baseUrl}/webhook?secret=${webhookSecret}`,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } else {
    console.log("⚠️ No WEBHOOK_SECRET environment variable found - skipping authentication tests");
  }

  // Run all tests sequentially
  for (const test of tests) {
    console.log(`\n${test.name}`);
    console.log('-'.repeat(80));
    
    try {
      const response = await fetch(test.url, {
        method: 'POST',
        headers: test.headers,
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log(`Response status: ${response.status}`);
      console.log(`Response data: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      console.error(`Error: ${error.message}`);
    }
  }
}

testWebhook();