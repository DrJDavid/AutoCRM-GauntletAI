# Authentication Feature

This directory contains all authentication-related functionality for the CRM system.

## Structure
- `/components`: Authentication-related React components
- `/stores`: Authentication state management using Zustand
- `/types`: TypeScript types and interfaces
- `/hooks`: Custom React hooks for authentication

## Key Components
- `AuthHeader`: Header component for authentication pages
- `ProtectedRoute`: Route wrapper for authenticated access

## State Management
Authentication state is managed using Zustand stores, handling:
- User authentication status
- Login/logout functionality
- Session management
- Role-based access control

## Types
Contains TypeScript definitions for:
- User authentication data
- Login/signup form data
- Session information
- Role and permission types

## Hooks
Custom hooks for:
- Authentication state access
- Login/logout operations
- Session management
- Role-based access control
