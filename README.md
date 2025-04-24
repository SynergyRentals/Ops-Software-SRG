# PropertyHub - Comprehensive Property Management

PropertyHub is a comprehensive property management platform designed for short-term rental operators, offering advanced tools for property tracking, maintenance, and scheduling.

## Key Features

- CSV-based property import system
- Multi-property management interface
- Admin and team role-based access control
- Automated property data processing
- AI-assisted scheduling and maintenance tracking
- Enhanced property editing functionality with direct edit capabilities
- Reservation overlay system with detailed day-level tracking
- Real-time webhook integration with HostAI for guest requests

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see `.env.example`)
4. Run database migrations: `npm run db:push`
5. Start the development server: `npm run dev`

## Webhook Integration

PropertyHub features robust webhook integration with services like HostAI to automatically create and manage tasks based on guest requests. The webhook system includes:

- Secure authentication with Bearer tokens
- Automatic team targeting and urgency classification
- Real-time WebSocket updates for instant UI notifications
- Support for file attachments
- Idempotency checks to prevent duplicate tasks

For detailed webhook configuration and usage, see [Webhook Documentation](docs/WEBHOOK.md).

## Database Configuration

This project uses Drizzle ORM with PostgreSQL. Make sure to set the `DATABASE_URL` environment variable.

## Environment Variables

- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Secret for session cookies
- `WEBHOOK_SECRET`: Secret for webhook authentication
- `WEBHOOK_REQUIRE_AUTH`: Set to "false" to disable webhook auth in development (default: "true")

## License

MIT