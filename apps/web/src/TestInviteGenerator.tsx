import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserStore } from '@/stores/userStore';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

type InviteType = 'agent' | 'customer';

/**
 * A component for generating test invites during development
 * Only shown in development environment
 */
export function TestInviteGenerator() {
  const { currentUser } = useUserStore();
  const { toast } = useToast();
  const [email, setEmail] = useState('test@example.com');
  const [inviteType, setInviteType] = useState<InviteType>('agent');
  const [inviteLink, setInviteLink] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const generateInvite = async () => {
    if (!currentUser?.organization?.id) {
      toast({
        title: 'Error',
        description: 'Organization not found',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);

      // Log the parameters we're sending
      console.log('Generating invite with params:', {
        org_id: currentUser.organization.id,
        email,
        invite_type: inviteType,
      });

      const { data: token, error } = await supabase.rpc('generate_test_invite', {
        org_id: currentUser.organization.id,
        email: email,
        invite_type: inviteType,
      });

      // Log the response
      console.log('Supabase response:', { token, error });

      if (error) throw error;

      const inviteLink = `${window.location.origin}/auth/${inviteType}/accept?token=${token}`;
      setInviteLink(inviteLink);

      // Copy to clipboard
      await navigator.clipboard.writeText(inviteLink);
      
      toast({
        title: 'Invite generated!',
        description: 'Link copied to clipboard',
      });
    } catch (error) {
      console.error('Error details:', error);
      toast({
        title: 'Error',
        description: error instanceof Error 
          ? `Failed to generate invite: ${error.message}`
          : 'Failed to generate invite',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <Card className="w-full max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle>Generate Test Invite</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Invite Type</Label>
            <RadioGroup
              value={inviteType}
              onValueChange={(value) => setInviteType(value as InviteType)}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="agent" id="agent" />
                <Label htmlFor="agent">Agent</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="customer" id="customer" />
                <Label htmlFor="customer">Customer</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="flex space-x-2">
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="test@example.com"
            />
            <Button onClick={generateInvite} disabled={isLoading}>
              Generate
            </Button>
          </div>
        </div>

        {inviteLink && (
          <div className="p-2 bg-muted rounded text-sm break-all">
            {inviteLink}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
