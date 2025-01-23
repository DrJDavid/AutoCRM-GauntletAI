import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useInviteStore } from "@/stores/inviteStore";
import { useUserStore } from "@/stores/userStore";
import { useToast } from "@/hooks/use-toast";
import { InviteList } from "@/components/InviteList";

export default function InviteCustomers() {
  const { currentUser } = useUserStore();
  const { createCustomerInvite, isLoading } = useInviteStore();
  const { toast } = useToast();
  const [emails, setEmails] = useState("");

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.organization?.id) {
      toast({
        title: "Error",
        description: "No organization found",
        variant: "destructive",
      });
      return;
    }

    const emailList = emails
      .split("\n")
      .map(email => email.trim())
      .filter(email => email.length > 0);

    if (emailList.length === 0) {
      toast({
        title: "Error",
        description: "Please enter at least one email address",
        variant: "destructive",
      });
      return;
    }

    let successCount = 0;
    let failureCount = 0;

    for (const email of emailList) {
      try {
        const response = await createCustomerInvite(email, currentUser.organization.id);
        if (response.success) {
          successCount++;
        } else {
          failureCount++;
        }
      } catch (err) {
        console.error(`Failed to invite ${email}:`, err);
        failureCount++;
      }
    }

    // Show summary toast
    if (successCount > 0 && failureCount === 0) {
      toast({
        title: "Success",
        description: `Successfully invited ${successCount} customer${successCount > 1 ? 's' : ''}`,
      });
      // Clear form on complete success
      setEmails("");
    } else if (successCount > 0 && failureCount > 0) {
      toast({
        title: "Partial Success",
        description: `Successfully invited ${successCount} customer${successCount > 1 ? 's' : ''}, but failed to invite ${failureCount}`,
        variant: "warning",
      });
    } else {
      toast({
        title: "Error",
        description: `Failed to invite ${failureCount} customer${failureCount > 1 ? 's' : ''}`,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-8">Invite Customers</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Send Customer Invitations</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="emails">Email Addresses</Label>
                <Textarea
                  id="emails"
                  value={emails}
                  onChange={(e) => setEmails(e.target.value)}
                  placeholder="Enter email addresses (one per line)"
                  className="min-h-[100px]"
                  required
                />
                <p className="text-sm text-gray-500">
                  Enter one email address per line
                </p>
              </div>
              <Button 
                type="submit" 
                className="w-full"
                disabled={isLoading || !emails.trim()}
              >
                {isLoading ? "Sending Invitations..." : "Send Invitations"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Invites</CardTitle>
          </CardHeader>
          <CardContent>
            <InviteList type="customer" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}