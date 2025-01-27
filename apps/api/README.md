# AutoCRM API

This is the backend API for the AutoCRM application. It's built with Express.js and TypeScript, using Supabase for database and authentication.

## Features

- RESTful API endpoints for ticket management
- Authentication using Passport.js and Supabase Auth
- Real-time updates with Supabase Realtime
- Row Level Security (RLS) for data access control
- Session management with express-session

## Tech Stack

- Node.js with Express
- TypeScript
- Supabase for database and auth
- Passport.js for authentication
- Zod for runtime type validation
- Vitest for testing

## Project Structure

```
src/
├── config/         # Configuration files
├── controllers/    # Route handlers
├── middleware/     # Express middleware
├── routes/         # API route definitions
├── services/       # Business logic
├── types/         # TypeScript type definitions
└── utils/         # Utility functions
```

## API Routes

- `/auth/*` - Authentication endpoints
- `/api/tickets/*` - Ticket management
- `/api/users/*` - User management
- `/api/realtime/*` - Real-time event handlers

## Development

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   ```

3. Start development server:
   ```bash
   pnpm dev
   ```

4. Build for production:
   ```bash
   pnpm build
   ```

5. Run tests:
   ```bash
   pnpm test
   ```

## Environment Variables

Required environment variables:
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)
- `SESSION_SECRET` - Session encryption key
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

## Dependencies

This API uses several shared packages from our monorepo:
- `@autocrm/api-types` - Shared API and database types
- `@autocrm/utils` - Shared utilities

## Security

- All routes are protected by authentication middleware
- Input validation using Zod schemas
- Session management with secure cookies
- Rate limiting on authentication endpoints
- Proper error handling and logging

## Contributing

1. Follow the TypeScript strict mode guidelines
2. Write tests for new features
3. Update documentation as needed
4. Follow the project's code style
5. Make sure all tests pass before submitting PR
