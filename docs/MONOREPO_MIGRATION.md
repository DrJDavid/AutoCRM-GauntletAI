# Monorepo Migration Plan

## Overview

This document outlines the plan to restructure our codebase into a monorepo architecture. This will improve code organization, sharing, and maintainability.

## Migration Status 

The migration has been completed! Here's what we've accomplished:

### Structure
- Created monorepo structure with apps and packages
- Moved frontend to apps/web
- Moved backend to apps/api
- Set up shared packages

### Frontend (apps/web)
- React application with TypeScript
- Vite build system
- Tailwind CSS + shadcn/ui components
- React Query for data fetching
- Zustand for state management
- Supabase client integration
- Environment variables configured

### Backend (apps/api)
- Express server with TypeScript
- Route configuration
- Middleware setup (security, sessions)
- Supabase service integration
- Environment variables configured

### Shared Packages
- @autocrm/api-types: Shared API and database types
- @autocrm/ui-components: Shared UI components
- @autocrm/utils: Shared utilities

### Current Structure

```
/AutoCRM-GauntletAI
├── /apps
│   ├── /web              # React frontend
│   │   ├── /src
│   │   │   ├── /auth
│   │   │   ├── /chat
│   │   │   ├── /layout
│   │   │   ├── /lib
│   │   │   ├── /pages
│   │   │   ├── /stores
│   │   │   ├── /tickets
│   │   │   └── /ui
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── /api              # Express backend
│       ├── /src
│       │   ├── /config
│       │   ├── /lib
│       │   └── /routes
│       ├── package.json
│       └── tsconfig.json
│
├── /packages
│   ├── /ui-components    # Shared UI components
│   ├── /api-types        # API and database types
│   └── /utils            # Shared utilities
│
└── /docs                 # Documentation
```

## Next Steps
1. Test the full application flow
2. Set up CI/CD pipelines
3. Add automated tests
4. Deploy to production

## Notes
- All packages are properly linked using workspace dependencies
- Environment variables are configured for both apps
- Supabase integration is working in both frontend and backend
- Database schema and migrations are managed through Supabase

## Key Decisions

1. Package Management
   - Using pnpm for better monorepo support and disk efficiency
   - Package naming convention: @autocrm/<package-type>-<name>
     - Example: @autocrm/ui-components, @autocrm/api-types

2. Build System
   - Using Turborepo for build orchestration
   - Maintaining Vercel deployment
   - Keeping Supabase for backend services

3. Environment & Deployment
   - Vercel manages production environment variables
   - Supabase handles cloud functions and database
   - Development environment uses local .env files

## Migration Steps

### Phase 1: Setup (Estimated time: 2-3 hours)
1. Create new directory structure
   - Create `/apps` directory
   - Create `/packages` directory
   - Set up initial package.json files
   - Configure TypeScript for workspaces

2. Configure Build Tools
   - Set up root package.json for workspace management
   - Configure Vite for web app
   - Configure TypeScript project references
   - Update ESLint and Prettier configs

### Phase 2: Package Creation (Estimated time: 4-5 hours)
1. Create Shared Packages
   - Create @autocrm/ui-components package
     - Move UI components
     - Set up package build
   - Create @autocrm/api-types package
     - Move API and database types
     - Set up package build
   - Create @autocrm/utils package
     - Move shared utilities
     - Set up package build

2. Update Package Dependencies
   - Configure package.json for each workspace
   - Set up internal dependencies
   - Update external dependencies

### Phase 3: Application Migration (Estimated time: 6-8 hours)
1. Migrate Web Application
   - Move client code to /apps/web
   - Update import paths
   - Configure environment variables
   - Update build configuration

2. Migrate API Application
   - Move server code to /apps/api
   - Update import paths
   - Configure environment variables
   - Update build configuration

### Phase 4: Testing and Verification (Estimated time: 4-5 hours)
1. Test Build Process
   - Test individual package builds
   - Test application builds
   - Verify production builds

2. Test Development Experience
   - Verify hot reload works
   - Test package linking
   - Verify type checking

3. Test Deployment
   - Update deployment scripts
   - Test Vercel deployment
   - Verify environment variables

## Package Dependencies

### @autocrm/ui-components
- Dependencies:
  - react
  - tailwindcss
  - @radix-ui/* (for shadcn)
  - class-variance-authority
  - clsx
  - tailwind-merge

### @autocrm/api-types
- Dependencies:
  - typescript
  - @types/node
  - zod

### @autocrm/utils
- Dependencies:
  - @autocrm/api-types
  - typescript
  - zod

### apps/web
- Dependencies:
  - @autocrm/ui-components
  - @autocrm/api-types
  - @autocrm/utils
  - react
  - vite
  - tailwindcss
  - (other existing dependencies)

### apps/api
- Dependencies:
  - @autocrm/api-types
  - @autocrm/utils
  - express
  - (other existing dependencies)

## Initial Setup Steps

1. Initialize pnpm workspace
   ```bash
   pnpm init
   ```

2. Create root pnpm-workspace.yaml
   ```yaml
   packages:
     - 'apps/*'
     - 'packages/*'
   ```

3. Configure Turborepo
   ```json
   {
     "pipeline": {
       "build": {
         "dependsOn": ["^build"],
         "outputs": ["dist/**"]
       },
       "dev": {
         "cache": false
       },
       "test": {
         "dependsOn": ["^build"],
         "outputs": []
       }
     }
   }
   ```

4. Root package.json
   ```json
   {
     "name": "autocrm",
     "private": true,
     "scripts": {
       "build": "turbo run build",
       "dev": "turbo run dev",
       "test": "turbo run test",
       "lint": "turbo run lint"
     },
     "devDependencies": {
       "turbo": "latest",
       "typescript": "latest",
       "@types/node": "latest",
       "prettier": "latest",
       "eslint": "latest"
     }
   }
   ```

## Immediate Next Steps

1. Install pnpm globally
   ```bash
   npm install -g pnpm
   ```

2. Create new directory structure
   ```bash
   mkdir -p apps/{web,api} packages/{ui-components,api-types,utils}
   ```

3. Initialize root configuration
   ```bash
   pnpm init
   pnpm add -D turbo typescript @types/node prettier eslint
   ```

4. Create initial package.json files for each workspace
   ```bash
   cd packages/ui-components && pnpm init
   cd ../api-types && pnpm init
   cd ../utils && pnpm init
   cd ../../apps/web && pnpm init
   cd ../api && pnpm init
   ```

5. Configure Vercel deployment
   - Update vercel.json for monorepo structure
   - Configure build settings in Vercel dashboard
   - Set up environment variables

## Workspace Configuration

```json
{
  "name": "autocrm",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "test": "turbo run test",
    "lint": "turbo run lint"
  }
}
```

## Git Strategy

1. Create feature branch 
   ```bash
   git checkout -b feature/monorepo-restructure
   ```

2. Commit Structure
   - Initial setup: workspace configuration
   - Package creation: one commit per package
   - Application migration: separate commits for web and api
   - Final configuration and fixes

3. Pull Request
   - Comprehensive description of changes
   - Migration steps for team members
   - Testing instructions

## Rollback Plan

1. Save Current State
   ```bash
   git tag pre-monorepo-v1
   git push origin pre-monorepo-v1
   ```

2. Rollback Steps if Needed
   ```bash
   git checkout main
   git reset --hard pre-monorepo-v1
   git push --force origin main
   ```

## Post-Migration Tasks

1. Documentation Updates
   - Update main README.md
   - Create package-specific READMEs
   - Update development guides
   - Document new build processes

2. CI/CD Updates
   - Update GitHub Actions
   - Configure workspace-aware testing
   - Update deployment scripts

3. Team Training
   - Document monorepo workflow
   - Create package development guide
   - Schedule team walkthrough

## Success Criteria

1. Build Process
   - All packages build successfully
   - Development environment works
   - Production builds are optimized

2. Development Experience
   - Hot reload works
   - Package changes reflect in apps
   - TypeScript integration works

3. Deployment
   - Successful Vercel deployment
   - Environment variables work
   - Performance metrics maintained

## Timeline

- Phase 1 (Setup): Day 1
- Phase 2 (Packages): Day 1-2
- Phase 3 (Apps): Day 2-3
- Phase 4 (Testing): Day 3-4
- Documentation & Training: Day 4-5

Total Estimated Time: 4-5 days

## Questions to Answer Before Starting

1. Package Management
   - Should we use npm workspaces or switch to pnpm/yarn?
   - How should we handle version management?
   - What should be our package naming convention?

2. Build Process
   - Should we use Turborepo or another build orchestrator?
   - How should we handle development vs production builds?
   - What optimization strategies should we employ?

3. Testing Strategy
   - How should we organize tests across workspaces?
   - What level of test coverage do we need?
   - How should we handle integration tests?

4. Deployment
   - How should we handle different deployment environments?
   - What changes are needed in our CI/CD pipeline?
   - How should we manage environment variables?
