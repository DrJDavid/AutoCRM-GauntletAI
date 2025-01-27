# Shared Components and Utilities

This directory contains shared components, hooks, utilities, and constants used across the application.

## Structure

### `/components`
- `/ui`: Reusable UI components (shadcn/ui components)
- `/layout`: Layout components (headers, footers, sidebars)
- `/forms`: Form-related components

### `/hooks`
Custom React hooks that can be used across features

### `/utils`
Utility functions and helper methods

### `/constants`
Application-wide constants and configuration

## Component Guidelines
- Keep components small and focused
- Document props with TypeScript and JSDoc
- Include accessibility considerations
- Test critical functionality
- Follow consistent naming conventions

## Accessibility
All shared components should:
- Use semantic HTML
- Support keyboard navigation
- Include ARIA attributes where needed
- Follow WCAG 2.1 guidelines
- Have proper color contrast

## Testing
- Include unit tests for utilities
- Test component accessibility
- Test edge cases
- Include error boundary testing

## Documentation
- Include JSDoc comments
- Document props and types
- Include usage examples
- Document any side effects
