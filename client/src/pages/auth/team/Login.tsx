import { useState } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useUserStore } from '@/stores/userStore';
import { AuthHeader } from '@/components/auth/AuthHeader';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Link } from 'wouter';

const teamLoginSchema = z.object({
  organizationSlug: z.string().min(1, 'Organization ID is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type TeamRole = 'admin' | 'agent';

export default function TeamLogin() {
  const [, setLocation] = useLocation();
  const { login } = useUserStore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof teamLoginSchema>>({
    resolver: zodResolver(teamLoginSchema),
    defaultValues: {
      organizationSlug: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof teamLoginSchema>) => {
    try {
      setIsLoading(true);
      
      // Wait for login and profile load to complete
      const profile = await login({
        type: 'team',
        email: values.email,
        password: values.password,
        organizationSlug: values.organizationSlug
      });

      if (!profile) {
        throw new Error('Failed to load user profile');
      }

      // Redirect based on role immediately using the returned profile
      switch (profile.role) {
        case 'admin':
          setLocation('/admin/dashboard');
          break;
        case 'agent':
          setLocation('/agent/dashboard');
          break;
        default:
          setLocation('/unauthorized');
      }

      // Show success toast after redirect
      toast({
        title: 'Welcome back!',
        description: 'You have successfully logged in.',
      });

    } catch (error) {
      console.error('Login error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to login',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container relative h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
        <div className="absolute inset-0 bg-zinc-900" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <AuthHeader />
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              Streamline your customer support and team collaboration with AutoCRM's powerful tools and insights.
            </p>
          </blockquote>
        </div>
      </div>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Team Login</h1>
            <p className="text-sm text-muted-foreground">
              Enter your organization ID and credentials to login
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="organizationSlug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization ID</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="your-org-name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your email"
                        type="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your password"
                        type="password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </Button>
            </form>
          </Form>

          <div className="space-y-2">
            <p className="px-8 text-center text-sm text-muted-foreground">
              <Link href="/auth/reset-password" className="underline underline-offset-4 hover:text-primary">
                Forgot your password?
              </Link>
            </p>
            <p className="px-8 text-center text-sm text-muted-foreground">
              Need to create an account?{' '}
              <Link href="/auth/agent/register" className="underline underline-offset-4 hover:text-primary">
                Register here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}