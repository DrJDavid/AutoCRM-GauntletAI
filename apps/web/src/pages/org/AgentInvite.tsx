import { useState } from 'react';
import { useUserStore } from '@/stores/userStore';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Loader2, Send, Plus, X } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function AgentInvite() {
  const { currentUser } = useUserStore();
  const { toast } = useToast();
  const [emails, setEmails] = useState<string[]>(['']);
  const [isLoading, setIsLoading] = useState(false);

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
    if (!currentUser?.organization?.id) {
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

    setIsLoading(true);

    try {
      // Create agent invites
      for (const email of validEmails) {
        console.log('Sending agent invite with:', {
          org_id: currentUser.organization.id,
          agent_email: email
        });

        const { data, error } = await supabase.rpc(
          'create_agent_invite',
          {
            org_id: currentUser.organization.id,
            agent_email: email
          }
        );

        if (error) {
          console.error('Agent invite error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
            status: error.status,
            raw: error,
            full: JSON.stringify(error, null, 2),
            requestData: {
              org_id: currentUser.organization.id,
              agent_email: email
            }
          });
          throw error;
        }

        console.log('Agent invite created:', data);
      }

      toast({
        title: 'Success',
        description: 'Agent invitations sent successfully',
      });

      // Reset form
      setEmails(['']);
    } catch (error: any) {
      console.error('Full error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send invitations',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Invite Support Agents</CardTitle>
          <CardDescription>
            Invite agents to help manage support tickets for your organization
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
                disabled={isLoading}
              />
              {emails.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveEmail(index)}
                  disabled={isLoading}
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
              disabled={isLoading}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Another Email
            </Button>
          </div>

          <Button
            onClick={handleInvite}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Send Invitations
          </Button>
        </CardContent>
      </Card>
    </div>
  );
} 