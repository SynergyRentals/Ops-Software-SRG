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
- Task Scheduling System with business rules
  - Implemented `suggestSchedule` utility for proposing date/time slots based on task urgency
  - Created scheduling algorithm with business rules:
    - Urgent tasks → today (before 22:00)
    - High priority tasks → today, else next-day before 12:00
    - Medium priority tasks → reservation checkout day
    - Low priority tasks → first fully vacant day
  - Added Scheduler component with suggested slots and manual date picker
  - Made scheduling function performant (<50ms for large calendars)
  - Added unit tests to verify different scheduling scenarios

### API Changes
- Added `/api/tasks` endpoint to get all tasks with optional filters
- Added `/api/tasks/:id` endpoint to get a specific task
- Added `PATCH /api/tasks/:id` endpoint to update task fields
- Added `/api/tasks/:id/suggestions` endpoint to get scheduling suggestions
- Enhanced WebSocket server to broadcast task:new events

### Fixed
- Fixed undefined errors in TaskCard component
- Ensured proper type safety in TaskInboxPage component