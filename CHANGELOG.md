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
- Added an alternative simpler webhook URL (`/webhook`) for compatibility

### Changed
- Renamed saveHostAITask to saveTaskFromHostAI for clarity
- Updated environment variable handling to make WEBHOOK_SECRET optional
- Improved error responses with more detailed information
- Standardized webhook authentication with industry best practices

### Fixed
- Fixed duplicate task detection to properly compare listing IDs
- Fixed potential issues with null/undefined values in attachments

### Security
- Made webhook authentication completely optional
- Support for Bearer token authentication if headers are available
- Authentication only checked when Authorization header is present

## How to upgrade

1. Update your HostAI webhook configuration to one of these URLs:
   - Main URL: `https://maintenance-tracker-synergyrentalst.replit.app/api/webhooks/hostai`
   - Alternative simpler URL: `https://maintenance-tracker-synergyrentalst.replit.app/webhook`
   
   If one URL doesn't work with HostAI, try the alternative URL.
   
2. Authentication is now optional:
   - No configuration needed in HostAI
   - You can optionally set WEBHOOK_SECRET in your .env file, but it won't be enforced

3. Remove any old environment variables:
   - HOSTAI_WEBHOOK_SECRET (now optional, replaced by WEBHOOK_SECRET)
   - WEBHOOK_REQUIRE_AUTH (no longer needed)