# AutoCRM

A modern, AI-powered customer relationship management system built with React, TypeScript, and Supabase.

## Features

- 🔐 Role-based access control (Admin, Agent, Customer)
- 📊 Real-time dashboard with ticket analytics
- 🎫 Advanced ticket management system
- 👥 Team collaboration tools
- 🚀 Modern, responsive UI with shadcn/ui

## Tech Stack

- **Frontend:**
  - React 18
  - TypeScript 5.0+
  - Tailwind CSS
  - shadcn/ui components
  - Zustand for state management
  - React Query for data fetching

- **Backend:**
  - Supabase (PostgreSQL)
  - Row Level Security
  - Real-time subscriptions
  - Auth management

## Getting Started

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/autocrm.git
   cd autocrm
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**
   - Create a `.env` file in the `client` directory
   - Add the following Supabase credentials:
     ```
     VITE_SUPABASE_URL=your_supabase_project_url
     VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
     VITE_SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
     ```
   - You can find these values in your Supabase project settings under Project Settings -> API

4. **Start the development server**

   ```bash
   npm run dev
   ```

5. **Build for production**

   ```bash
   npm run build
   ```

## Database Schema

The database schema is organized into several logical groups:

### Core Tables
- `organizations`: Stores organization details
- `profiles`: User profiles with role-based access control
- `teams`: Team management within organizations

### Ticket System
- `tickets`: Customer support tickets
- `comments`: Ticket comments and updates
- `attachments`: File attachments for tickets

### Knowledge Base
- `knowledge_articles`: Documentation and help articles
- `article_categories`: Article categorization
- `article_feedback`: User feedback on articles

### Invitation System
- `agent_organization_invites`: Invitations for new agents
- `customer_organization_invites`: Invitations for new customers

Detailed schema documentation can be found in the `db/schema/` directory.

## Row Level Security (RLS)

The database uses Row Level Security to enforce access control:

- **Admins** can manage their organization's data
- **Agents** can view and manage assigned tickets
- **Customers** can only access their own tickets and data

RLS policies are documented in the SQL files under `db/schema/`.

## Project Structure

```
src/
├── components/     # Reusable UI components
├── hooks/         # Custom React hooks
├── lib/           # Utility functions and configurations
├── pages/         # Page components
├── stores/        # Zustand stores
├── styles/        # Global styles and Tailwind config
└── types/         # TypeScript type definitions
```

## Documentation

- [AutoCRM Documentation](docs/README.md)
- [API Documentation](docs/API.md)
- [Contributing Guide](docs/CONTRIBUTING.md)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the beautiful UI components
- [Supabase](https://supabase.io/) for the backend infrastructure
- [Tailwind CSS](https://tailwindcss.com/) for the styling system
