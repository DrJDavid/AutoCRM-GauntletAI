import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useInviteStore } from "@/stores/inviteStore";
import { useUserStore } from "@/stores/userStore";
import { useToast } from "@/hooks/use-toast";
import { InviteList } from "@/components/InviteList";

export default function ManageAgents() {
  const { currentUser } = useUserStore();
  const { createAgentInvite, isLoading } = useInviteStore();
  const { toast } = useToast();
  const [email, setEmail] = useState("");

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

    try {
      const response = await createAgentInvite(email, currentUser.organization.id);
      if (response.success) {
        toast({
          title: "Success",
          description: `Successfully invited ${email} as a team member`,
        });
        // Clear form
        setEmail("");
      } else {
        throw new Error("Failed to create invite");
      }
    } catch (err) {
      console.error("Failed to create invite:", err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to create invite",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Manage Agents</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Active Invites</CardTitle>
          </CardHeader>
          <CardContent>
            <InviteList type="agent" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Invite New Agent</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="agent@example.com"
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full"
                disabled={isLoading || !email}
              >
                {isLoading ? "Sending Invitation..." : "Send Invitation"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}