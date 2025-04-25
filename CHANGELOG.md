# Changelog

## [Unreleased]

### Breaking Changes
- Removed HOSTAI_* environment variables (replaced with generic WEBHOOK_SECRET)
- Removed WEBHOOK_REQUIRE_AUTH environment variable
- Changed HostAI webhook path to use a single static endpoint: `/api/webhooks/hostai`
- Changed HostAI webhook authentication to use standard Bearer token auth instead of custom header

### Added
- Added Zod validation schema for HostAI webhook payloads
- Added proper error handling with status codes (401, 409, 422, 500)
- Added comprehensive test suite for webhook endpoint with all supported status codes
- Added performance monitoring for webhook processing

### Changed
- Renamed saveHostAITask to saveTaskFromHostAI for clarity
- Updated environment variable handling to make WEBHOOK_SECRET optional
- Improved error responses with more detailed information
- Standardized webhook authentication with industry best practices

### Fixed
- Fixed duplicate task detection to properly compare listing IDs
- Fixed potential issues with null/undefined values in attachments

### Security
- Implemented Bearer token authentication for webhook endpoints
- Made webhook authentication optional but recommended (set WEBHOOK_SECRET to enable)
- Removed query parameter based authentication

## How to upgrade

1. Set the new environment variable in your deployment:
   ```
   replit secrets add WEBHOOK_SECRET="super_long_token"
   ```

2. Update your HostAI webhook configuration to:
   - URL: `/api/webhooks/hostai` (instead of `/webhooks/hostai`)
   - Authentication: Add the header `Authorization: Bearer super_long_token`

3. Remove any old environment variables:
   - HOSTAI_WEBHOOK_SECRET (now replaced by WEBHOOK_SECRET)
   - WEBHOOK_REQUIRE_AUTH (no longer needed)