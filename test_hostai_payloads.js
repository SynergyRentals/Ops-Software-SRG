/**
 * Test script to verify the modified HostAI webhook parsing
 * Tests:
 * 1. A sample payload without external_id should work (201)
 * 2. A payload missing task.action should fail validation (422)
 * 3. A payload with external_id should work (201)
 */
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

// Valid payload without external_id
const validPayloadNoExternalId = {
  task: {
    action: "Clean up room 205",
    description: "Guest reported that the room needs cleaning"
  },
  source: {
    sourceType: "sms",
    link: "https://example.com/messages/123"
  },
  guest: {
    guestName: "John Doe",
    guestEmail: "john.doe@example.com",
    guestPhone: "+1234567890"
  },
  listing: {
    listingName: "Downtown Luxury Apartment",
    listingId: "apt-205"
  },
  _creationDate: new Date().toISOString()
};

// Invalid payload missing task.action
const invalidPayloadNoAction = {
  task: {
    description: "This payload is missing the required action field"
  },
  source: {
    sourceType: "email",
    link: "https://example.com/emails/456"
  },
  listing: {
    listingName: "Beach House",
    listingId: "bh-101"
  },
  _creationDate: new Date().toISOString()
};

// Valid payload with external_id
const validPayloadWithExternalId = {
  task: {
    action: "Fix broken AC in room 302",
    description: "The air conditioning unit is not cooling properly"
  },
  source: {
    sourceType: "phone",
    link: "https://example.com/calls/789"
  },
  guest: {
    guestName: "Jane Smith",
    guestEmail: "jane.smith@example.com",
    guestPhone: "+1987654321"
  },
  listing: {
    listingName: "City Center Suite",
    listingId: "cc-302"
  },
  external_id: "test-external-id-" + Date.now(),
  _creationDate: new Date().toISOString()
};

async function testValidPayload() {
  console.log('Testing valid payload without external_id (should succeed with 201)...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/webhooks/hostai`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(validPayloadNoExternalId)
    });
    
    console.log(`Status: ${response.status}`);
    
    if (response.status === 201) {
      console.log('✅ Success: Server accepted the payload without external_id');
      
      const data = await response.json();
      console.log('Response data:');
      console.log('Task ID:', data.task.id);
      console.log('Generated external_id:', data.task.externalId);
      console.log('Action:', data.task.action);
    } else {
      console.log('❌ Failed: Expected 201, but got', response.status);
      
      try {
        const errorData = await response.json();
        console.log('Error response:', errorData);
      } catch (e) {
        console.log('No JSON in response');
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

async function testInvalidPayload() {
  console.log('\nTesting invalid payload missing task.action (should fail with 422)...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/webhooks/hostai`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(invalidPayloadNoAction)
    });
    
    console.log(`Status: ${response.status}`);
    
    if (response.status === 422) {
      console.log('✅ Success: Server rejected the invalid payload as expected');
      
      const data = await response.json();
      console.log('Validation error:', data);
    } else {
      console.log('❌ Failed: Expected 422, but got', response.status);
      
      try {
        const responseData = await response.json();
        console.log('Unexpected response:', responseData);
      } catch (e) {
        console.log('No JSON in response');
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

async function testPayloadWithExternalId() {
  console.log('\nTesting valid payload with external_id (should succeed with 201)...');
  
  try {
    // Store the external ID for verification
    const providedExternalId = validPayloadWithExternalId.external_id;
    
    const response = await fetch(`${BASE_URL}/api/webhooks/hostai`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(validPayloadWithExternalId)
    });
    
    console.log(`Status: ${response.status}`);
    
    if (response.status === 201) {
      console.log('✅ Success: Server accepted the payload with external_id');
      
      const data = await response.json();
      console.log('Response data:');
      console.log('Task ID:', data.task.id);
      console.log('Provided external_id:', providedExternalId);
      console.log('Returned external_id:', data.task.externalId);
      console.log('Action:', data.task.action);
      
      if (data.task.externalId === providedExternalId) {
        console.log('✅ External ID was preserved correctly');
      } else {
        console.log('❌ External ID was changed! Expected:', providedExternalId, 'Got:', data.task.externalId);
      }
    } else {
      console.log('❌ Failed: Expected 201, but got', response.status);
      
      try {
        const errorData = await response.json();
        console.log('Error response:', errorData);
      } catch (e) {
        console.log('No JSON in response');
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

async function runTests() {
  console.log('=== Testing HostAI Webhook Parser ===\n');
  await testValidPayload();
  await testInvalidPayload();
  await testPayloadWithExternalId();
  console.log('\nAll tests completed.');
}

runTests();