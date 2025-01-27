import { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  Input,
  Button,
  useToast
} from '@/components/ui';
import { useUserStore } from '@/stores/userStore';
import { supabase } from '@/lib/supabase';
import { Loader2, Send, Plus, X } from 'lucide-react';

export default function TeamInvite() {
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
    if (!currentUser?.organization) {
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
      // Create invites in the database
      const { error } = await supabase
        .from('invites')
        .insert(
          validEmails.map(email => ({
            organization_id: currentUser.organization,
            email,
            role: 'agent',
            invited_by: currentUser.id,
          }))
        );

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Invitations sent successfully',
      });

      // Reset form
      setEmails(['']);
    } catch (error: any) {
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
          <CardTitle>Invite Team Members</CardTitle>
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