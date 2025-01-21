import { useState } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { AuthHeader } from '@/components/auth/AuthHeader';
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

const joinRequestSchema = z.object({
  organizationSlug: z.string().min(1, 'Organization ID is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function TeamJoinRequest() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof joinRequestSchema>>({
    resolver: zodResolver(joinRequestSchema),
    defaultValues: {
      organizationSlug: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof joinRequestSchema>) => {
    try {
      setIsLoading(true);

      // First, verify the organization exists
      const { data: organization, error: orgError } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('slug', values.organizationSlug)
        .single();

      if (orgError || !organization) {
        throw new Error('Organization not found. Please check the Organization ID.');
      }

      // Sign up the user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/team/verify`,
          data: {
            role: 'pending', // Initial role is pending until approved
            organization_id: organization.id,
          },
        },
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('No user data returned from authentication');
      }

      // Create a join request
      const { error: requestError } = await supabase
        .from('organization_join_requests')
        .insert([
          {
            user_id: authData.user.id,
            organization_id: organization.id,
            email: values.email,
            status: 'pending',
          }
        ]);

      if (requestError) throw requestError;

      toast({
        title: 'Join request submitted!',
        description: 'Please check your email to verify your account. An admin will review your request.',
      });

      setLocation('/auth/team/login');
    } catch (error) {
      console.error('Join request error:', error);
      toast({
        variant: 'destructive',
        title: 'Request Failed',
        description: error instanceof Error ? error.message : 'Failed to submit request. Please try again.',
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
          <CardTitle className="text-2xl font-bold">Join Organization</CardTitle>
          <CardDescription>
            Request to join an existing organization as a team member
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
                        placeholder="Create a password"
                        type="password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Confirm your password"
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
                {isLoading ? 'Submitting request...' : 'Request to join'}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 text-sm text-center">
          <div>
            Already have an account?{' '}
            <Link href="/auth/team/login" className="text-primary hover:underline">
              Login
            </Link>
          </div>
          <div>
            Have an invite?{' '}
            <Link href="/auth/team/accept-invite" className="text-primary hover:underline">
              Accept Invitation
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
} 