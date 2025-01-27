# @autocrm/utils

This package contains shared utility functions and helpers for the AutoCRM application.

## Structure

```
src/
├── auth/              # Authentication utilities
│   ├── permissions.ts # Permission checking
│   └── tokens.ts     # Token handling
│
├── validation/        # Data validation
│   ├── schemas.ts    # Zod schemas
│   └── helpers.ts    # Validation helpers
│
├── formatting/        # Data formatting
│   ├── dates.ts      # Date formatting
│   └── numbers.ts    # Number formatting
│
└── index.ts          # Main export file
```

## Features

### Authentication Utilities
- Permission checking
- Token management
- Role validation

### Data Validation
- Zod schemas for data validation
- Type guards
- Input sanitization

### Formatting Helpers
- Date formatting
- Number formatting
- String manipulation

## Usage

```typescript
import { formatDate, validateTicket } from '@autocrm/utils'

// Format dates
const formattedDate = formatDate(new Date(), 'full')

// Validate data
const validatedTicket = validateTicket(ticketData)
```

## Development

1. Run development mode:
   ```bash
   pnpm dev
   ```

2. Build the package:
   ```bash
   pnpm build
   ```

3. Run tests:
   ```bash
   pnpm test
   ```

## Guidelines

1. Function Design:
   - Pure functions preferred
   - Proper error handling
   - TypeScript type safety
   - JSDoc documentation

2. Testing:
   - Unit tests for all utilities
   - Test edge cases
   - Test error conditions
   - Performance testing for critical functions

3. Documentation:
   - Clear function descriptions
   - Usage examples
   - Parameter documentation
   - Return value documentation

4. Error Handling:
   - Consistent error types
   - Informative error messages
   - Proper error propagation
   - Error recovery strategies
