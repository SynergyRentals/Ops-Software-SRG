#!/bin/bash

# Base URL
BASE_URL="http://localhost:5000"

# Login and save cookies
echo "Logging in..."
COOKIES_FILE="cookies.txt"
LOGIN_RESPONSE=$(curl -s -c "$COOKIES_FILE" -X POST "$BASE_URL/api/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}')

echo "Login response: $LOGIN_RESPONSE"

# Create a task for testing
echo -e "\nCreating a task..."
CREATE_TASK_RESPONSE=$(curl -s -b "$COOKIES_FILE" -X POST "$BASE_URL/api/schedule/task" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Task","description":"Test description","teamTarget":"maintenance","urgency":"high","scheduledFor":"2025-04-30T10:00:00.000Z"}')

echo "Create task response: $CREATE_TASK_RESPONSE"

# Extract task ID from response
TASK_ID=$(echo $CREATE_TASK_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -z "$TASK_ID" ]; then
  echo "Failed to get task ID from response."
  exit 1
fi

echo "Created task with ID: $TASK_ID"

# Get scheduling suggestions for the task
echo -e "\nGetting scheduling suggestions..."
SUGGESTIONS_RESPONSE=$(curl -s -b "$COOKIES_FILE" "$BASE_URL/api/tasks/$TASK_ID/suggestions")

echo "Scheduling suggestions response: $SUGGESTIONS_RESPONSE"

# Update the task with a scheduled date
echo -e "\nUpdating task with scheduled date..."
UPDATE_RESPONSE=$(curl -s -b "$COOKIES_FILE" -X PATCH "$BASE_URL/api/tasks/$TASK_ID" \
  -H "Content-Type: application/json" \
  -d '{"scheduledFor":"2025-05-01T14:00:00.000Z","status":"scheduled"}')

echo "Update task response: $UPDATE_RESPONSE"

# Clean up
rm -f "$COOKIES_FILE"
echo -e "\nTest completed."