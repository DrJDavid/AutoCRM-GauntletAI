import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

interface Profile {
  id: string;
  email: string;
  full_name: string;
  organization_id: string;
  role: string;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
}

interface TeamMember extends Profile {
  organizations: Organization;
}

const inviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['agent', 'customer'], {
    required_error: 'Please select a role',
  }),
});

export default function TeamManagement() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof inviteSchema>>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: '',
      role: 'agent',
    },
  });

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setLocation('/auth/agent/login');
          return;
        }

        // Get profile with organization
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select(`
            *,
            organizations (
              id,
              name,
              slug
            )
          `)
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        if (!profile) {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Profile not found',
          });
          return;
        }

        // Only allow admins to access this page
        if (profile.role !== 'admin') {
          toast({
            variant: 'destructive',
            title: 'Access Denied',
            description: 'Only administrators can manage team members',
          });
          setLocation('/agent/dashboard');
          return;
        }

        setProfile(profile);
        setOrganization(profile.organizations);

        // Load team members
        const { data: members, error: membersError } = await supabase
          .from('organization_members')
          .select(`
            profiles (
              id,
              email,
              full_name,
              role,
              organization_id
            ),
            organizations (
              id,
              name,
              slug
            )
          `)
          .eq('organization_id', profile.organization_id);

        if (membersError) throw membersError;

        setTeamMembers(members?.map(m => ({
          ...m.profiles,
          organizations: m.organizations
        })) || []);
      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load team data',
        });
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [setLocation, toast]);

  const onSubmit = async (values: z.infer<typeof inviteSchema>) => {
    try {
      if (!organization) return;

      const inviteTable = values.role === 'agent' 
        ? 'agent_organization_invites'
        : 'customer_organization_invites';

      // Create invite
      const { error: inviteError } = await supabaseAdmin
        .from(inviteTable)
        .insert([
          {
            email: values.email,
            organization_id: organization.id,
          }
        ]);

      if (inviteError) throw inviteError;

      toast({
        title: 'Invite sent',
        description: `Invitation sent to ${values.email}`,
      });

      setInviteDialogOpen(false);
      form.reset();
    } catch (error) {
      console.error('Error sending invite:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to send invite',
      });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!profile || !organization) {
    return <div className="flex items-center justify-center min-h-screen">No profile found</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Team Management</h1>
          <p className="text-gray-600">{organization.name}</p>
        </div>
        <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button>Invite Member</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
              <DialogDescription>
                Send an invitation to join your organization
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter email address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <FormControl>
                        <select
                          className="w-full p-2 border rounded"
                          {...field}
                        >
                          <option value="agent">Agent</option>
                          <option value="customer">Customer</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">
                  Send Invite
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {teamMembers.map((member) => (
          <Card key={member.id}>
            <CardHeader>
              <CardTitle>{member.full_name || member.email}</CardTitle>
              <CardDescription>{member.role}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600">
                <p>Email: {member.email}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 