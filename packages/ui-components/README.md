# @autocrm/ui-components

This package contains shared UI components for the AutoCRM application. These components are built with React, TypeScript, and Tailwind CSS, following the shadcn/ui design system.

## Components

The package is organized into two main categories:

### Core Components
Basic UI elements that serve as building blocks:
- Buttons
- Inputs
- Forms
- Modals
- etc.

### Composite Components
More complex components built from core components:
- DataTables
- SearchBars
- FileUploaders
- etc.

## Installation

This package is part of the AutoCRM monorepo and is installed automatically when you run `pnpm install` at the root.

To use in another workspace:

```bash
pnpm add @autocrm/ui-components
```

## Usage

```typescript
import { Button, Input } from '@autocrm/ui-components'

function MyComponent() {
  return (
    <div>
      <Input placeholder="Enter text..." />
      <Button>Click me</Button>
    </div>
  )
}
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

1. Each component should:
   - Be fully typed with TypeScript
   - Include comprehensive JSDoc comments
   - Follow WCAG 2.1 accessibility guidelines
   - Support keyboard navigation
   - Include proper loading states
   - Handle error states gracefully

2. Testing:
   - Write unit tests for all components
   - Include accessibility tests
   - Test responsive behavior
   - Test edge cases

3. Documentation:
   - Include usage examples
   - Document all props
   - Provide accessibility notes
   - Include responsive behavior notes
