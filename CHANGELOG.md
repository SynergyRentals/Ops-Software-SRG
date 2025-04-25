# Changelog

## [Unreleased]

### Added
- Tasks & Projects page with real-time list of incoming tasks
  - Added `/tasks` route in the wouter router
  - Created the TaskInboxPage component with WebSocket integration
  - Implemented responsive TaskCard component with team and urgency selection
  - Added card flip animation using framer-motion when both team & urgency are selected
  - Added optimistic UI updates for better UX
  - Created API endpoints for fetching and updating tasks
  - Added real-time task notifications via WebSockets
  - Created unit test for TaskCard component

### API Changes
- Added `/api/tasks` endpoint to get all tasks with optional filters
- Added `/api/tasks/:id` endpoint to get a specific task
- Added `PATCH /api/tasks/:id` endpoint to update task fields
- Enhanced WebSocket server to broadcast task:new events

### Fixed
- Fixed undefined errors in TaskCard component
- Ensured proper type safety in TaskInboxPage component