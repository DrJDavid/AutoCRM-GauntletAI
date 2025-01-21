import { useState } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
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
  organizationName: z.string().min(3, 'Organization name must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function TeamRegister() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      organizationName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof registerSchema>) => {
    try {
      setIsLoading(true);

      // Sign up the user with Supabase Auth first
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
      });

      if (authError) {
        console.error('Auth error:', authError);
        throw new Error(`Authentication failed: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error('No user data returned from authentication');
      }

      // Create the organization
      const baseSlug = values.organizationName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      const randomSuffix = Math.random().toString(36).substring(2, 7);
      const orgSlug = `${baseSlug}-${randomSuffix}`;

      const { data: organization, error: orgError } = await supabase
        .from('organizations')
        .insert([
          { name: values.organizationName, slug: orgSlug }
        ])
        .select()
        .single();

      if (orgError) {
        console.error('Organization creation error:', orgError);
        throw new Error(`Failed to create organization: ${orgError.message}`);
      }

      // Update the existing profile with organization details
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          role: 'admin',
          organization_id: organization.id,
        })
        .eq('id', authData.user.id);

      if (profileError) {
        // If profile update fails, clean up the organization
        await supabase
          .from('organizations')
          .delete()
          .eq('id', organization.id);
        
        console.error('Profile update error:', profileError);
        throw new Error(`Failed to update profile: ${profileError.message}`);
      }

      toast({
        title: 'Registration successful!',
        description: 'Please check your email to verify your account. You can login after verification.',
      });

      setLocation('/auth/team/login');
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        variant: 'destructive',
        title: 'Registration Failed',
        description: error instanceof Error ? error.message : 'Failed to register. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Create your organization</CardTitle>
          <CardDescription>
            Enter your organization details and admin account information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="organizationName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your organization name"
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
                    <FormLabel>Admin Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter admin email"
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
                {isLoading ? 'Creating organization...' : 'Create organization'}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="text-sm text-center">
          Already have an organization?{' '}
          <Link href="/auth/team/login" className="text-primary hover:underline">
            Login
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}