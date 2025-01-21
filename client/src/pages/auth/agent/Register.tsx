import { useState } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { supabase, supabaseAdmin } from '@/lib/supabase';
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

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

interface Organization {
  id: string;
  name: string;
  slug: string;
}

interface InviteWithOrg {
  token: string;
  organization_id: string;
  organizations: Organization;
  email: string;
}

export default function AgentRegister() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof registerSchema>) => {
    try {
      setIsLoading(true);

      // Check if there's a pending invite for this email using admin client
      console.log('Checking for invite with email:', values.email);
      
      const { data: invites, error: inviteError } = await supabaseAdmin
        .from('agent_organization_invites')
        .select(`
          *,
          organizations (
            id,
            name,
            slug
          )
        `)
        .eq('email', values.email)
        .eq('accepted', false);

      console.log('Initial invite query result:', { invites, error: inviteError });

      if (inviteError) throw inviteError;

      if (!invites || invites.length === 0) {
        toast({
          variant: 'destructive',
          title: 'No invitation found',
          description: 'You need an invitation to register as an agent. Please contact your organization administrator.',
        });
        return;
      }

      const inviteData = invites[0];
      console.log('Using invite:', inviteData);

      // Get organization from the joined data
      const { organizations: organization } = inviteData;
      console.log('Organization data:', organization);
      
      if (!organization) {
        console.log('Organization data missing:', inviteData);
        toast({
          variant: 'destructive',
          title: 'Invalid invitation',
          description: 'The invitation is not associated with a valid organization.',
        });
        return;
      }

      // First check if user already exists by listing users
      const { data: users, error: userLookupError } = await supabaseAdmin.auth.admin.listUsers();
      
      console.log('User lookup response:', { users, userLookupError });

      const existingUser = users?.users.find(user => user.email === values.email);
      
      console.log('Existing user check:', { existingUser });

      let userId;
      
      if (existingUser) {
        // User exists, we'll use their ID
        userId = existingUser.id;
        console.log('Using existing user:', userId);
      } else {
        // Create new user account using admin API
        console.log('Creating new user account with data:', {
          email: values.email,
          role: 'agent',
          organization_id: organization.id,
          organization_slug: organization.slug,
        });

        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: values.email,
          password: values.password,
          email_confirm: true, // Auto-confirm the email
          user_metadata: {
            role: 'agent',
            organization_id: organization.id,
            organization_slug: organization.slug,
          }
        });

        console.log('Auth response:', { authData, error: authError });

        if (authError) {
          console.error('Auth error:', authError);
          throw authError;
        }

        if (!authData.user) {
          throw new Error('No user data returned from user creation');
        }

        userId = authData.user.id;
      }

      // Use admin client for database operations
      console.log('Creating/updating profile for user:', userId);
      
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert([
          {
            id: userId,
            email: values.email,
            role: 'agent',
            organization_id: organization.id,
            created_at: new Date().toISOString(),
            full_name: '',  // Empty string for now, can be updated later
            avatar_url: null  // Null for now, can be updated later
          }
        ], {
          onConflict: 'id',
          ignoreDuplicates: false // Update if exists
        })
        .select()
        .single();

      if (profileError) {
        console.error('Profile creation/update error:', profileError);
        throw profileError;
      }

      console.log('Creating/updating organization member for user:', userId);

      const { error: memberError } = await supabaseAdmin
        .from('organization_members')
        .upsert([
          {
            id: crypto.randomUUID(), // Generate a new UUID for the member record
            user_id: userId,
            organization_id: organization.id,
            role: 'agent',
            // created_at and updated_at are optional, let the database handle them
          }
        ], {
          onConflict: 'user_id,organization_id',
          ignoreDuplicates: true // Skip if exists since we don't need to update anything
        });

      if (memberError) {
        console.error('Member creation/update error:', memberError);
        throw memberError;
      }

      console.log('Marking invite as accepted');

      const { error: acceptError } = await supabaseAdmin
        .from('agent_organization_invites')
        .update({ accepted: true })
        .eq('token', inviteData.token);

      if (acceptError) {
        console.error('Accept invite error:', acceptError);
        throw acceptError;
      }

      toast({
        title: 'Registration successful!',
        description: existingUser 
          ? 'Your account has been linked to the organization.' 
          : 'Please check your email to verify your account.',
      });
      
      setLocation('/auth/team/login');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to register',
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
            <CardTitle className="text-2xl font-bold">Create an agent account</CardTitle>
            <CardDescription>
              Enter your email below to create your agent account
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