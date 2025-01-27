import { useState } from 'react';
import { useLocation } from 'wouter';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/components/ui/use-toast';
import { AuthHeader } from '@/components/auth/AuthHeader';
import { Link } from 'wouter';
import { useOrganizationStore } from '@/stores/organizationStore';

const organizationSchema = z.object({
  name: z.string().min(2, 'Organization name is required'),
  slug: z.string().min(2, 'Organization slug is required')
    .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens are allowed'),
  adminEmail: z.string().email('Please enter a valid admin email address'),
  adminPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string()
}).refine((data) => data.adminPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function OrganizationNew() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { createOrganization } = useOrganizationStore();

  const form = useForm<z.infer<typeof organizationSchema>>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: '',
      slug: '',
      adminEmail: '',
      adminPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof organizationSchema>) => {
    try {
      setIsLoading(true);
      
      await createOrganization({
        name: values.name,
        slug: values.slug,
        adminEmail: values.adminEmail,
        adminPassword: values.adminPassword,
      });

      toast({
        title: 'Organization created!',
        description: 'Your organization has been created successfully.',
      });

      // Redirect to admin dashboard since user is already authenticated
      setLocation('/admin/dashboard');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create organization',
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
            <h1 className="text-2xl font-semibold tracking-tight">Create New Organization</h1>
            <p className="text-sm text-muted-foreground">
              Set up your organization's profile to get started with AutoCRM
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter organization name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization Slug</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="your-org-name"
                            {...field}
                            onChange={(e) => {
                              const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-');
                              field.onChange(value);
                            }}
                          />
                        </FormControl>
                        <p className="text-sm text-muted-foreground">
                          This will be used in your organization's URL: autocrm.com/your-org-name. Must be unique across all organizations.
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="adminEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Admin Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="admin@your-org.com" {...field} />
                        </FormControl>
                        <p className="text-sm text-muted-foreground">
                          This email will be used for the organization admin account
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="adminPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Admin Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <p className="text-sm text-muted-foreground">
                          Password must be at least 8 characters and contain uppercase, lowercase, number, and special character
                        </p>
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
                          <Input type="password" placeholder="••••••••" {...field} />
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
                    {isLoading ? 'Creating...' : 'Create Organization'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <p className="px-8 text-center text-sm text-muted-foreground">
            Already have an organization?{' '}
            <Link href="/org/login">
              <span className="underline underline-offset-4 hover:text-primary">Sign in</span>
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}