#!/bin/bash

# Test the HostAI webhook with development mode (no auth check)
echo "=== Testing in development mode (no secret, should succeed) ==="
curl -X POST http://localhost:5000/api/webhooks/hostai \
  -H "Content-Type: application/json" \
  -d '{
    "external_id": "test-'$(date +%s)'",
    "task": {
      "action": "Test Task",
      "description": "This is a test task in development mode"
    },
    "guest": {
      "guestName": "Test Guest"
    },
    "listing": {
      "listingName": "Test Property"
    }
  }' | jq .

sleep 2

# Test with wrong auth in production mode (should fail with 401)
echo -e "\n=== Testing in production mode with wrong secret (should fail with 401) ==="
# Using a special header that will be logged by the modified webhook handler
curl -v -X POST http://localhost:5000/api/webhooks/hostai \
  -H "Content-Type: application/json" \
  -H "X-HostAI-Secret: wrong-secret" \
  -H "X-NODE-ENV: production" \
  -d '{
    "external_id": "test-'$(date +%s)'",
    "task": {
      "action": "Test Task",
      "description": "This is a test task with wrong secret"
    },
    "guest": {
      "guestName": "Test Guest"
    },
    "listing": {
      "listingName": "Test Property"
    }
  }'