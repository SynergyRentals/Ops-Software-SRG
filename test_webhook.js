import fetch from 'node-fetch';

async function testWebhook() {
  const url = 'http://localhost:5000/webhook';
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

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error testing webhook:', error);
  }
}

testWebhook();