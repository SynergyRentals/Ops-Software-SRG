/**
 * Test the webhook with the new debug logs
 */
import fetch from 'node-fetch';

async function testDebugLogs() {
  console.log('Testing webhook with new debug logging');
  console.log('--------------------------------------------------------------------------------');
  
  // Generate a unique ID for this test
  const testId = `debug-logs-test-${Date.now()}`;
  
  // Test payload
  const payload = {
    task: {
      action: 'Test debug logging',
      description: 'Testing the enhanced debug logging in the webhook handler'
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
  };
  
  // Make a request with no auth at all
  console.log('\nTest 1: Making request with no authentication');
  try {
    const response = await fetch('http://localhost:5000/api/webhooks/hostai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    const statusCode = response.status;
    const data = await response.json();
    
    console.log(`Status code: ${statusCode}`);
    console.log(`Response: ${JSON.stringify(data, null, 2)}`);
    console.log('Check server logs for detailed debug information');
  } catch (error) {
    console.error('Error in test:', error);
  }
  
  // Make a request with X-HostAI-Secret header
  console.log('\nTest 2: Making request with X-HostAI-Secret header');
  try {
    const response = await fetch('http://localhost:5000/api/webhooks/hostai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-HostAI-Secret': 'some-test-secret'
      },
      body: JSON.stringify({
        ...payload,
        external_id: `${testId}-2`
      })
    });
    
    const statusCode = response.status;
    let responseText;
    
    try {
      const data = await response.json();
      responseText = JSON.stringify(data, null, 2);
    } catch (e) {
      responseText = await response.text();
    }
    
    console.log(`Status code: ${statusCode}`);
    console.log(`Response: ${responseText}`);
    console.log('Check server logs for detailed debug information');
  } catch (error) {
    console.error('Error in test:', error);
  }
}

// Run the tests
testDebugLogs();