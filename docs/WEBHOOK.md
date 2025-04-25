# PropertyHub Webhook Integration Guide

This guide explains how to configure and use PropertyHub's webhook integration with services like HostAI.

## HostAI Webhook Setup

PropertyHub can receive and process webhook events from HostAI to automatically create tasks in the system.

### Configuration

1. **Set up webhook URL in HostAI**:
   ```
   https://your-app-url/webhooks/hostai
   ```

2. **Authentication Options**:

   For production use, we recommend using a secure, randomly-generated token. Set the following environment variable:

   ```
   WEBHOOK_SECRET=your-secure-random-token
   ```

   The webhook endpoint supports two authentication methods:

   **Method 1**: Bearer token in Authorization header (recommended for production)
   ```
   Authorization: Bearer your-secure-random-token
   ```

   **Method 2**: Query parameter in URL (useful for HostAI test UI that can't set headers)
   ```
   https://your-app-url/webhooks/hostai?secret=your-secure-random-token
   ```

3. **Development/Staging Options**:

   For testing in development or staging environments:

   - If no `WEBHOOK_SECRET` is set in the environment, authentication will be disabled with a warning log
   - This allows for easy testing but is NOT recommended for production environments

### Webhook Payload Format

The HostAI webhook expects a JSON payload with the following structure:

```json
{
  "task": {
    "action": "Task title/action",
    "description": "Detailed description of the task"
  },
  "guest": {
    "guestName": "Guest Name",
    "guestEmail": "guest@example.com",
    "guestPhone": "+1234567890"
  },
  "listing": {
    "listingName": "Property Name",
    "listingId": "property-identifier"
  },
  "external_id": "unique-external-identifier",
  "source": {
    "sourceType": "message/email/etc",
    "link": "Optional URL to source"
  },
  "attachments": [
    {
      "name": "photo.jpg",
      "extension": "jpg",
      "url": "https://example.com/path/to/photo.jpg"
    }
  ]
}
```

The minimum required fields are:
- `external_id` - A unique identifier for this task (used for idempotency)
- `task.action` - The title or action of the task

### Automatic Classification

PropertyHub automatically analyzes the task content to:

1. **Determine Team Target** - Tasks are assigned to the appropriate team:
   - `cleaning` - For tasks related to cleaning, laundry, etc.
   - `maintenance` - For tasks related to repairs, replacements, etc.
   - `landlord` - For tasks related to contracts, payments, etc.
   - `internal` - Default for miscellaneous tasks

2. **Determine Urgency** - Tasks are classified by urgency:
   - `urgent` - Critical issues affecting safety or security
   - `high` - Important issues affecting guest experience
   - `medium` - Standard priority (default)
   - `low` - Low priority, can be addressed when convenient

### Real-time Updates

Tasks created via webhooks are immediately available in the dashboard and trigger real-time updates via WebSockets to connected clients.

### Testing the Webhook

You can test the webhook locally using curl with either authentication method:

**Method 1**: Using Authorization header (recommended)
```bash
curl -X POST http://localhost:5000/webhooks/hostai \
-H "Content-Type: application/json" \
-H "Authorization: Bearer your-webhook-secret" \
-d '{
  "task": {
    "action": "Test webhook task",
    "description": "This is a test task from the webhook"
  },
  "guest": {
    "guestName": "Test Guest",
    "guestEmail": "test@example.com"
  },
  "listing": {
    "listingName": "Test Property",
    "listingId": "test-property-id"
  },
  "external_id": "test-webhook-123"
}'
```

**Method 2**: Using query parameter (for services that can't set headers)
```bash
curl -X POST "http://localhost:5000/webhooks/hostai?secret=your-webhook-secret" \
-H "Content-Type: application/json" \
-d '{
  "task": {
    "action": "Test webhook task",
    "description": "This is a test task from the webhook"
  },
  "guest": {
    "guestName": "Test Guest",
    "guestEmail": "test@example.com"
  },
  "listing": {
    "listingName": "Test Property",
    "listingId": "test-property-id"
  },
  "external_id": "test-webhook-456"
}'
```

## Security Considerations

- Always use a strong, random token for `WEBHOOK_SECRET` in production
- Avoid using URL query parameters for authentication in production
- Never disable authentication in production
- Use HTTPS for all webhook endpoints in production
- Monitor webhook traffic for unusual patterns
- Regularly rotate webhook secrets