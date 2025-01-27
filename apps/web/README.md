# AutoCRM Web Application

This is the web frontend for the AutoCRM application. It's built with React, TypeScript, and Vite, using our shared component library and utilities.

## Features

- Customer ticket management interface
- Agent dashboard
- Real-time updates using Supabase
- Modern UI with shadcn/ui components
- Type-safe API integration

## Tech Stack

- React 18+
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- Zustand for state management
- React Query for data fetching
- Zod for runtime type validation

## Project Structure

```
src/
├── components/     # Local components
├── hooks/         # Custom React hooks
├── lib/           # Utility functions and configurations
├── pages/         # Route components
├── stores/        # Zustand stores
└── types/         # TypeScript type definitions
```

## Configuration

Configuration files are stored in the `config/` directory:
- `vite.config.ts` - Vite bundler configuration
- `postcss.config.js` - PostCSS configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `theme.json` - UI theme configuration

## Development

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Start development server:
   ```bash
   pnpm dev
   ```

3. Build for production:
   ```bash
   pnpm build
   ```

4. Run tests:
   ```bash
   pnpm test
   ```

## Environment Variables

Required environment variables:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key

## Dependencies

This app uses several shared packages from our monorepo:
- `@autocrm/ui-components` - Shared UI components
- `@autocrm/api-types` - API and database types
- `@autocrm/utils` - Shared utilities

## Contributing

1. Follow the TypeScript strict mode guidelines
2. Write tests for new features
3. Update documentation as needed
4. Follow the project's code style
5. Make sure all tests pass before submitting PR
