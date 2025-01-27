import { useState } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AuthHeader } from '@/components/auth/AuthHeader';
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
          role: 'head_admin',
          organization_id: organization.id,
          is_head_admin: true,
          is_deleted: false
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
    <div className="container relative h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
        <div className="absolute inset-0 bg-zinc-900" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <AuthHeader />
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              Join thousands of organizations using AutoCRM to deliver exceptional customer service.
            </p>
          </blockquote>
        </div>
      </div>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[450px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Create your organization</h1>
            <p className="text-sm text-muted-foreground">
              Enter your organization details and admin account information
            </p>
          </div>

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

          <p className="px-8 text-center text-sm text-muted-foreground">
            Already have an organization?{' '}
            <Link href="/auth/team/login" className="underline underline-offset-4 hover:text-primary">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}