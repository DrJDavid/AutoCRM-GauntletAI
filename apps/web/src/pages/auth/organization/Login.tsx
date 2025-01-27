import { AuthHeader } from '@/components/auth/AuthHeader';

export default function OrganizationLogin() {
  return (
    <div className="container relative h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <AuthHeader />
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
        // ... existing code ...
      </div>
      <div className="lg:p-8">
        // ... existing code ...
      </div>
    </div>
  );
} 