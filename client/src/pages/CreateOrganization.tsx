import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useOrganizationStore } from '@/stores/organizationStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const createOrgSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z.string().min(2, 'Slug must be at least 2 characters').regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  adminEmail: z.string().email('Invalid email address'),
  adminPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

type CreateOrgFormData = z.infer<typeof createOrgSchema>;

export default function CreateOrganization() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const createOrganization = useOrganizationStore((state) => state.createOrganization);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateOrgFormData>({
    resolver: zodResolver(createOrgSchema),
  });

  const onSubmit = async (data: CreateOrgFormData) => {
    setIsLoading(true);
    try {
      const result = await createOrganization(data);
      
      toast({
        title: 'Organization created!',
        description: 'Your organization has been created successfully.',
      });

      // Route directly to admin dashboard
      navigate(`/org/${result.slug}/admin`);
    } catch (error) {
      console.error('Error creating organization:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create organization',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-lg mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Create Organization</CardTitle>
          <CardDescription>
            Set up your organization and admin account
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name">Organization Name</label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Acme Inc."
                disabled={isLoading}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="slug">Organization Slug</label>
              <Input
                id="slug"
                {...register('slug')}
                placeholder="acme"
                disabled={isLoading}
              />
              {errors.slug && (
                <p className="text-sm text-red-500">{errors.slug.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="adminEmail">Admin Email</label>
              <Input
                id="adminEmail"
                type="email"
                {...register('adminEmail')}
                placeholder="admin@example.com"
                disabled={isLoading}
              />
              {errors.adminEmail && (
                <p className="text-sm text-red-500">{errors.adminEmail.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="adminPassword">Admin Password</label>
              <Input
                id="adminPassword"
                type="password"
                {...register('adminPassword')}
                placeholder="••••••••"
                disabled={isLoading}
              />
              {errors.adminPassword && (
                <p className="text-sm text-red-500">{errors.adminPassword.message}</p>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Organization'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
} 