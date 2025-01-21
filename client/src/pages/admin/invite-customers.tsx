import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function InviteCustomers() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-8">Invite Customers</h1>

      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Send Customer Invitations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Email Addresses</Label>
              <Textarea 
                placeholder="Enter email addresses (one per line)"
                className="min-h-[100px]"
              />
            </div>
            <div className="space-y-2">
              <Label>Custom Message (Optional)</Label>
              <Textarea 
                placeholder="Add a personal message to the invitation email"
                className="min-h-[100px]"
              />
            </div>
            <Button className="w-full">Send Invitations</Button>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Recent Invites</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { email: "customer1@example.com", status: "Pending", sent: "2 hours ago" },
                { email: "customer2@example.com", status: "Accepted", sent: "1 day ago" },
                { email: "customer3@example.com", status: "Expired", sent: "5 days ago" }
              ].map((invite, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b last:border-0">
                  <div>
                    <div>{invite.email}</div>
                    <div className="text-sm text-gray-500">Sent {invite.sent}</div>
                  </div>
                  <span className={`px-2 py-1 rounded text-sm ${
                    invite.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                    invite.status === 'Accepted' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {invite.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 