# Tickets Feature

This directory contains all ticket management functionality for the CRM system.

## Structure
- `/components`: Ticket-related React components
  - `/chat`: Real-time chat components for ticket communication
- `/stores`: Ticket state management using Zustand
- `/types`: TypeScript types and interfaces
- `/hooks`: Custom React hooks for ticket management

## Key Components
- `TicketDetail`: Detailed view of a ticket
- `TicketForm`: Form for creating/editing tickets
- `TicketList`: List view of tickets
- `TicketChat`: Real-time chat interface

## State Management
Ticket state is managed using Zustand stores, handling:
- Ticket CRUD operations
- Real-time updates
- Ticket assignments
- Status management

## Types
Contains TypeScript definitions for:
- Ticket data structures
- Message formats
- Attachment handling
- Status and priority enums

## Hooks
Custom hooks for:
- Ticket operations
- Real-time updates
- File attachments
- Chat functionality
