import { useEffect, useState } from 'react';
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

const acceptInviteSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

interface InviteData {
  email: string;
  token: string;
  organizationName: string;
}

export default function AcceptInvite() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [inviteData, setInviteData] = useState<InviteData | null>(null);

  const form = useForm<z.infer<typeof acceptInviteSchema>>({
    resolver: zodResolver(acceptInviteSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    // Get invite token from URL parameters
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (!token) {
      toast({
        variant: 'destructive',
        title: 'Invalid invitation',
        description: 'No invitation token found.',
      });
      setLocation('/auth/agent/login');
      return;
    }

    // Verify and get invite details
    const verifyInvite = async () => {
      try {
        const { data: invite, error } = await supabase
          .from('agent_organization_invites')
          .select(`
            email,
            token,
            organizations (
              name
            )
          `)
          .eq('token', token)
          .eq('accepted', false)
          .single();

        if (error) throw error;

        if (!invite) {
          throw new Error('Invitation not found or already accepted');
        }

        const organization = invite.organizations[0] as { name: string };

        setInviteData({
          email: invite.email,
          token: invite.token,
          organizationName: organization.name,
        });
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Invalid invitation',
          description: error instanceof Error ? error.message : 'Failed to verify invitation',
        });
        setLocation('/auth/agent/login');
      }
    };

    verifyInvite();
  }, [toast, setLocation]);

  const onSubmit = async (values: z.infer<typeof acceptInviteSchema>) => {
    if (!inviteData) return;

    try {
      setIsLoading(true);

      // Create the user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: inviteData.email,
        password: values.password,
        options: {
          emailRedirectTo: 'http://localhost:5000/auth/agent/login',
          data: {
            role: 'agent',
          },
        },
      });

      if (authError) {
        console.error('Auth error details:', {
          message: authError.message,
          status: authError.status,
          name: authError.name,
          stack: authError.stack,
        });
        throw authError;
      }

      // Add a delay before accepting invite to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Accept the invite
      const { error: acceptError } = await supabase.rpc(
        'accept_agent_invite',
        { invite_token: inviteData.token }
      );

      if (acceptError) {
        console.error('Accept invite error:', acceptError);
        throw acceptError;
      }

      toast({
        title: 'Account created!',
        description: 'Please check your email to verify your account. You will be redirected to the login page.',
      });

      // Add a delay before redirect to ensure user sees the message
      await new Promise(resolve => setTimeout(resolve, 2000));
      setLocation('/auth/agent/login');
    } catch (error: any) {
      console.error('Full error details:', {
        error,
        message: error.message,
        status: error.status,
        name: error.name,
      });
      
      let errorMessage = 'Failed to create account';
      
      if (error.status === 429) {
        errorMessage = 'Too many attempts. Please try again in a few minutes.';
      } else if (error.status === 406) {
        errorMessage = 'Invalid email or password format.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!inviteData) {
    return null; // Or a loading state
  }

  return (
    <div className="container relative flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <AuthHeader />
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Accept Agent Invitation</CardTitle>
            <CardDescription>
              You've been invited to join {inviteData.organizationName} as a support agent.
              Set up your password to complete your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <FormLabel>Email</FormLabel>
                  <Input
                    type="email"
                    value={inviteData.email}
                    disabled
                  />
                </div>
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
                  {isLoading ? 'Creating account...' : 'Create account'}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="text-sm text-center">
            Already have an account?{' '}
            <Link href="/auth/agent/login" className="text-primary hover:underline">
              Login
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 