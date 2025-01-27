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
   - Copy `.env.example` to `.env.local`
   - Fill in your Supabase credentials

4. **Start the development server**

   ```bash
   npm run dev
   ```

5. **Build for production**

   ```bash
   npm run build
   ```

## Project Structure

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

- [Development Progress](docs/PROGRESS.md)
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
