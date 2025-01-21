import { useState } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
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

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export default function AgentLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof loginSchema>) => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) throw error;

      // Check if user is an agent
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (profileError) throw profileError;

      if (profile.role !== 'agent') {
        await supabase.auth.signOut();
        throw new Error('This login is for agents only');
      }

      toast({
        title: 'Welcome back!',
        description: 'Successfully logged in.',
      });

      setLocation('/agent/dashboard');
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
    <div className="container relative flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <AuthHeader />
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Agent Login</CardTitle>
            <CardDescription>
              Enter your email and password to access your agent account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
          <CardFooter className="flex flex-col space-y-2 text-sm text-center">
            <div>
              Don't have an account?{' '}
              <Link href="/auth/agent/register" className="text-primary hover:underline">
                Register
              </Link>
            </div>
            <div>
              <Link href="/auth/reset-password" className="text-primary hover:underline">
                Forgot your password?
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 