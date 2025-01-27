# Client Project Structure

## Overview
The client project follows a feature-based organization pattern, emphasizing modularity and separation of concerns.

## Directory Structure

```
/src
  /features           # Feature-based modules
    /auth            # Authentication feature
      /components    # Auth-specific components
      /hooks        # Auth-specific hooks
      /stores       # Auth state management
      /types        # Auth-specific types
      /utils        # Auth-specific utilities
      index.ts      # Public API

    /tickets         # Ticket management feature
      /components   # Ticket-specific components
      /hooks       # Ticket-specific hooks
      /stores      # Ticket state management
      /types       # Ticket-specific types
      /utils       # Ticket-specific utilities
      index.ts     # Public API

    /organizations   # Organization management
      /components
      /hooks
      /stores
      /types
      /utils
      index.ts

    /users           # User management
      /components
      /hooks
      /stores
      /types
      /utils
      index.ts

  /shared            # Shared resources
    /components     # Shared components
      /ui          # UI components (shadcn)
      /layout      # Layout components
      /forms       # Form components
    /hooks         # Common hooks
    /utils         # Utility functions
    /constants     # Constants and configurations

  /lib               # Core configurations
    supabaseClient.ts
    queryClient.ts
    theme.ts

  /styles            # Global styles
    globals.css
    themes.css

  /types             # Global types
    supabase.ts     # Supabase types
    common.ts       # Common type definitions
    index.ts        # Type exports

  App.tsx            # Root component
  main.tsx          # Entry point
```

## Key Principles

1. **Feature-based Organization**
   - Each feature is self-contained with its own components, hooks, and state
   - Features communicate through well-defined interfaces
   - Shared code is moved to the /shared directory

2. **Code Organization**
   - Components are grouped by feature
   - Shared components are in /shared/components
   - Each feature has its own types and hooks
   - Global types are in /types

3. **State Management**
   - Each feature has its own store
   - Stores are kept small and focused
   - Global state is minimized

4. **File Naming**
   - Use kebab-case for files: `ticket-list.tsx`
   - Use PascalCase for components: `TicketList`
   - Use camelCase for utilities and hooks: `useTicketList`

5. **Imports**
   - Use absolute imports with `@/` prefix
   - Feature-specific imports stay within feature
   - Shared code is imported from /shared

## Usage Guidelines

1. **Adding New Features**
   - Create a new directory in /features
   - Include all feature-specific code
   - Export public API through index.ts

2. **Shared Components**
   - Only move components to /shared if used by multiple features
   - Keep UI components in /shared/components/ui
   - Document shared components thoroughly

3. **State Management**
   - Keep state close to where it's used
   - Use feature-specific stores
   - Share state through well-defined interfaces

4. **Type Definitions**
   - Keep feature-specific types in feature directory
   - Move shared types to /types
   - Use type exports in index.ts files
