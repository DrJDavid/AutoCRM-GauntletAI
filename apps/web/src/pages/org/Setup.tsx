import { useState } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/stores/userStore';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Loader2 } from 'lucide-react';

const setupSchema = z.object({
  organizationName: z.string().min(3, 'Organization name must be at least 3 characters'),
  inviteEmails: z.array(z.string().email('Invalid email address')).optional(),
});

export default function OrganizationSetup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { currentUser } = useUserStore();
  const [isLoading, setIsLoading] = useState(false);
  const [inviteFields, setInviteFields] = useState<string[]>(['']);

  const form = useForm<z.infer<typeof setupSchema>>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      organizationName: '',
      inviteEmails: [''],
    },
  });

  if (!currentUser?.organization) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Organization not found. Please contact support.
        </AlertDescription>
      </Alert>
    );
  }

  const onSubmit = async (values: z.infer<typeof setupSchema>) => {
    try {
      setIsLoading(true);

      // Update organization name if changed
      if (values.organizationName !== currentUser.organization!.name) {
        const { error: updateError } = await supabase
          .from('organizations')
          .update({ name: values.organizationName })
          .eq('id', currentUser.organization!.id);

        if (updateError) throw updateError;
      }

      // Send invites to team members
      const validEmails = values.inviteEmails?.filter(email => email.trim() !== '') || [];
      if (validEmails.length > 0) {
        const invites = validEmails.map(email => ({
          email,
          organization_id: currentUser.organization!.id,
          role: 'agent', // Default role for invited team members
          token: crypto.randomUUID(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        }));

        const { error: inviteError } = await supabase
          .from('organization_invites')
          .insert(invites);

        if (inviteError) throw inviteError;
      }

      toast({
        title: 'Organization setup complete!',
        description: validEmails.length > 0
          ? 'Invitations have been sent to your team members.'
          : 'Your organization is ready to go.',
      });

      setLocation('/admin/dashboard');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to complete setup',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addInviteField = () => {
    setInviteFields([...inviteFields, '']);
    const currentEmails = form.getValues('inviteEmails') || [];
    form.setValue('inviteEmails', [...currentEmails, '']);
  };

  return (
    <div className="container max-w-2xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Complete Your Organization Setup</CardTitle>
          <CardDescription>
            Configure your organization settings and invite team members to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="organizationName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter organization name"
                        defaultValue={currentUser.organization!.name}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <FormLabel>Invite Team Members</FormLabel>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addInviteField}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Email
                  </Button>
                </div>
                {inviteFields.map((_, index) => (
                  <FormField
                    key={index}
                    control={form.control}
                    name={`inviteEmails.${index}`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            placeholder="team@example.com"
                            type="email"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  'Complete Setup'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
