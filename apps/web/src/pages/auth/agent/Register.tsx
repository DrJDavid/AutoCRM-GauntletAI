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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Link } from 'wouter';
import { useUserStore } from '@/stores/userStore';

const registerSchema = z.object({
  email: z.string()
    .email('Please enter a valid email address')
    .refine(email => {
      // Allow test emails in specific formats
      if (email.endsWith('@example.com') || email.endsWith('@test.com')) {
        return true;
      }
      // For non-test emails, require more strict format
      return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
    }, 'Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must not exceed 100 characters'),
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

export default function Register() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const { signUp } = useUserStore();

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
      setLoading(true);
      console.log('Starting registration process for email:', values.email);

      // Validate invite by email
      console.log('Calling validate_invite_by_email with:', {
        email_param: values.email,
        type_param: 'agent'
      });

      const { data: validationResult, error: validationError } = await supabase
        .rpc('validate_invite_by_email', {
          email_param: values.email,
          type_param: 'agent'
        });

      console.log('Raw validation result:', validationResult);
      
      // The function returns an array with one row
      const result = Array.isArray(validationResult) ? validationResult[0] : validationResult;
      
      console.log('Processed validation result:', result);

      if (validationError) {
        console.error('Invite validation error:', {
          message: validationError.message,
          details: validationError.details,
          hint: validationError.hint
        });
        throw new Error('Failed to verify invitation');
      }

      if (!result) {
        console.error('No validation result returned');
        throw new Error('Failed to verify invitation - no result returned');
      }

      if (!result.is_valid) {
        console.error('Invalid validation result:', result);
        throw new Error(result.error_message || 'No valid invitation found for this email');
      }

      // Register user
      console.log('Valid invite found, proceeding with registration:', {
        email: values.email,
        role: 'agent',
        organizationId: result.organization_id
      });
      
      await signUp(values.email, values.password, 'agent', result.organization_id);

      toast({
        title: 'Success',
        description: 'Registration successful! Please check your email to verify your account.',
      });

      // Redirect to login
      navigate('/auth/agent/login');
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to register. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
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
              Create your agent account to start managing customer support.
            </p>
          </blockquote>
        </div>
      </div>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Create Agent Account</h1>
            <p className="text-sm text-muted-foreground">
              Set up your account to get started
            </p>
          </div>

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
                        type="email"
                        placeholder="you@example.com" 
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
                        type="password"
                        placeholder="••••••••"
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
                        type="password"
                        placeholder="••••••••"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>
          </Form>

          <div className="space-y-2">
            <p className="px-8 text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/auth/agent/login" className="underline underline-offset-4 hover:text-primary">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}