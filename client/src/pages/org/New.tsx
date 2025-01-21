import { useState } from 'react';
import { useLocation } from 'wouter';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
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
import { useToast } from '@/components/ui/use-toast';
import { useUserStore } from '@/stores/userStore';
import { supabase } from '@/lib/supabase';

const organizationSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters'),
  slug: z.string().min(2, 'Organization ID must be at least 2 characters')
    .regex(/^[a-z0-9-]+$/, 'Organization ID can only contain lowercase letters, numbers, and hyphens'),
  adminEmail: z.string().email('Please enter a valid email address'),
  adminPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

export default function OrganizationNew() {
  const [, setLocation] = useLocation();
  const { signUp } = useUserStore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof organizationSchema>>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: '',
      slug: '',
      adminEmail: '',
      adminPassword: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof organizationSchema>) => {
    try {
      setIsLoading(true);
      
      // Create organization first
      const { data: organization, error: orgError } = await supabase
        .from('organizations')
        .insert([
          { 
            name: values.name,
            slug: values.slug
          }
        ])
        .select()
        .single();

      if (orgError) throw orgError;

      // Create admin account and link to organization
      await signUp(
        values.adminEmail,
        values.adminPassword,
        'admin',
        organization.id
      );

      toast({
        title: 'Organization created!',
        description: 'Please check your email to verify your account.',
      });

      // Redirect to setup wizard
      setLocation('/org/setup');
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Create New Organization</CardTitle>
          <CardDescription>
            Set up your organization and create your admin account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Acme Inc."
                        {...field}
                      />
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
                    <FormLabel>Organization ID</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="acme-inc"
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-');
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
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
                      <Input
                        type="email"
                        placeholder="admin@acme.com"
                        {...field}
                      />
                    </FormControl>
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
    </div>
  );
} 