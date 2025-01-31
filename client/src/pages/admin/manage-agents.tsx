import { FC, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Database } from '@/types/supabase';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Plus, Send, Loader2, X } from 'lucide-react';
import { useUserStore } from '@/stores/userStore';

type Profile = Database['public']['Tables']['profiles']['Row'];
type InvitationType = Database['public']['Enums']['invitation_type'];

const ManageAgentsPage: FC = () => {
  const { currentUser } = useUserStore();
  const { toast } = useToast();
  const [agents, setAgents] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [emails, setEmails] = useState<string[]>(['']);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'agent')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAgents(data || []);
    } catch (error) {
      console.error('Error fetching agents:', error);
      toast({
        title: 'Error',
        description: 'Failed to load agents',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleAgentStatus = async (agentId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !currentStatus })
        .eq('id', agentId);

      if (error) throw error;

      setAgents(agents.map(agent =>
        agent.id === agentId
          ? { ...agent, is_active: !currentStatus }
          : agent
      ));

      toast({
        title: 'Success',
        description: `Agent ${currentStatus ? 'deactivated' : 'activated'} successfully`,
      });
    } catch (error) {
      console.error('Error updating agent status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update agent status',
        variant: 'destructive',
      });
    }
  };

  const handleAddEmail = () => {
    setEmails([...emails, '']);
  };

  const handleRemoveEmail = (index: number) => {
    const newEmails = emails.filter((_, i) => i !== index);
    setEmails(newEmails.length ? newEmails : ['']);
  };

  const handleEmailChange = (index: number, value: string) => {
    const newEmails = [...emails];
    newEmails[index] = value;
    setEmails(newEmails);
  };

  const handleInvite = async () => {
    if (!currentUser?.organization_id) {
      toast({
        title: 'Error',
        description: 'Organization not found',
        variant: 'destructive',
      });
      return;
    }

    const validEmails = emails.filter(email => email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/));
    
    if (!validEmails.length) {
      toast({
        title: 'Error',
        description: 'Please enter at least one valid email address',
        variant: 'destructive',
      });
      return;
    }

    setIsSending(true);

    try {
      // Create agent invites using the invitations table
      for (const email of validEmails) {
        console.log('Creating agent invite:', {
          organization_id: currentUser.organization_id,
          email: email
        });

        const { error } = await supabase
          .from('invitations')
          .insert({
            organization_id: currentUser.organization_id,
            email: email,
            type: 'agent',
            role: 'agent',
            invited_by: currentUser.id,
            status: 'pending',
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
          });

        if (error) {
          console.error('Agent invite error:', error);
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
          throw error;
        }

        console.log('Agent invite created for:', email);
      }

      toast({
        title: 'Success',
        description: 'Agent invitations sent successfully',
      });

      // Reset form
      setEmails(['']);
    } catch (error: any) {
      console.error('Failed to create invites:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send invitations',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Manage Agents</h1>
      </div>

      {/* Invite Agents Card */}
      <Card>
        <CardHeader>
          <CardTitle>Invite New Agents</CardTitle>
          <CardDescription>
            Send invitations to new support agents
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {emails.map((email, index) => (
            <div key={index} className="flex gap-2">
              <Input
                type="email"
                placeholder="agent@example.com"
                value={email}
                onChange={(e) => handleEmailChange(index, e.target.value)}
                disabled={isSending}
              />
              {emails.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveEmail(index)}
                  disabled={isSending}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleAddEmail}
              disabled={isSending}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Another Email
            </Button>
          </div>

          <Button
            onClick={handleInvite}
            disabled={isSending}
            className="w-full"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Send Invitations
          </Button>
        </CardContent>
      </Card>

      {/* Agent List Card */}
      <Card>
        <CardHeader>
          <CardTitle>Agent List</CardTitle>
          <CardDescription>
            Manage your organization's support agents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agents.map((agent) => (
                <TableRow key={agent.id}>
                  <TableCell>
                    {agent.first_name} {agent.last_name}
                  </TableCell>
                  <TableCell>{agent.email}</TableCell>
                  <TableCell>{agent.department || 'N/A'}</TableCell>
                  <TableCell>
                    <Badge
                      variant={agent.is_active ? 'default' : 'secondary'}
                    >
                      {agent.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {agent.last_seen_at
                      ? formatDistanceToNow(new Date(agent.last_seen_at), { addSuffix: true })
                      : 'Never'}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleAgentStatus(agent.id, !!agent.is_active)}
                    >
                      {agent.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default ManageAgentsPage;