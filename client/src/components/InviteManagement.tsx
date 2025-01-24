import { useState } from 'react';
import { useInviteStore } from '@/stores/inviteStore';
import { useUserStore } from '@/stores/userStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InviteList } from './InviteList';
import { useToast } from '@/hooks/use-toast';

export const InviteManagement = () => {
  const { currentUser } = useUserStore();
  const { createAgentInvite, createCustomerInvite, isLoading, error, clearError } = useInviteStore();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [inviteType, setInviteType] = useState<'agent' | 'customer'>('agent');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setSuccessMessage('');

    try {
      if (!currentUser?.organization?.id) {
        toast({
          title: 'Error',
          description: 'No organization found',
          variant: 'destructive',
        });
        return;
      }

      console.log('Submitting invite:', { email, inviteType, message });
      const createInvite = inviteType === 'agent' ? createAgentInvite : createCustomerInvite;
      const response = await createInvite(email, currentUser.organization.id, message);
      
      console.log('Invite response:', response);
      if (response.success) {
        const typeLabel = inviteType === 'agent' ? 'team member' : 'customer';
        const successMsg = `Successfully invited ${email} as a ${typeLabel}`;
        setSuccessMessage(successMsg);
        toast({
          title: 'Success',
          description: successMsg,
        });
        // Clear form
        setEmail('');
        setMessage('');
      } else {
        throw new Error('Failed to create invite');
      }
    } catch (err) {
      console.error('Failed to create invite:', err);
      setSuccessMessage('');
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to create invite',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Invite Management</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Invite Form */}
        <Card>
          <CardHeader>
            <CardTitle>Create Invite</CardTitle>
            <CardDescription>
              Invite a new team member or customer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invite-type">Invite Type</Label>
                <Select
                  value={inviteType}
                  onValueChange={(value) => setInviteType(value as 'agent' | 'customer')}
                >
                  <SelectTrigger id="invite-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agent">Team Member</SelectItem>
                    <SelectItem value="customer">Customer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message (Optional)</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Add a personal message..."
                  rows={3}
                />
              </div>

              {error && (
                <div className="text-red-600 text-sm">
                  {error}
                </div>
              )}

              {successMessage && (
                <div className="text-green-600 text-sm mt-2">
                  {successMessage}
                </div>
              )}

              <Button 
                type="submit" 
                disabled={isLoading || !email}
                className="w-full"
              >
                {isLoading ? 'Sending Invite...' : 'Send Invite'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Invite Lists */}
        <Card>
          <CardHeader>
            <CardTitle>Active Invites</CardTitle>
            <CardDescription>
              Manage your pending and accepted invites
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="agent">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="agent">Team Members</TabsTrigger>
                <TabsTrigger value="customer">Customers</TabsTrigger>
              </TabsList>
              <TabsContent value="agent">
                <InviteList type="agent" />
              </TabsContent>
              <TabsContent value="customer">
                <InviteList type="customer" />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
