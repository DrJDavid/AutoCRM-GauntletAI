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
  const { login, currentUser } = useUserStore();
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
      await login({
        type: 'team',
        email: values.email,
        password: values.password,
        organizationSlug: values.organizationSlug
      });

      toast({
        title: 'Welcome back!',
        description: 'You have successfully logged in.',
      });

      // Redirect based on role from user store
      if (currentUser?.role === 'admin') {
        setLocation('/admin/dashboard');
      } else if (currentUser?.role === 'agent') {
        setLocation('/agent/dashboard');
      } else {
        setLocation('/unauthorized');
      }
    } catch (error) {
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <AuthHeader />
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Team Login</CardTitle>
          <CardDescription>
            Enter your organization ID and credentials to login
          </CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <div className="text-sm text-center">
            <Link href="/auth/reset-password" className="text-primary hover:underline">
              Forgot your password?
            </Link>
          </div>
          <div className="text-sm text-center">
            Need to create an account?{' '}
            <Link href="/auth/agent/register" className="text-primary hover:underline">
              Register here
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}