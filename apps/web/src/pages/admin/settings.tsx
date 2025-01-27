import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { TestInviteGenerator } from "@/components/TestInviteGenerator";

export default function Settings() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      <div className="grid gap-6 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Organization Settings</CardTitle>
            <CardDescription>
              Manage your organization's basic information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Organization Name</Label>
              <Input defaultValue="Gauntlet AI" />
            </div>
            <div className="space-y-2">
              <Label>Support Email</Label>
              <Input defaultValue="support@gauntlet-ai.com" />
            </div>
            <div className="space-y-2">
              <Label>Website</Label>
              <Input defaultValue="https://gauntlet-ai.com" />
            </div>
            <Button>Save Changes</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notification Settings</CardTitle>
            <CardDescription>
              Configure how and when you receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <div className="text-sm text-gray-500">
                  Receive notifications about new tickets
                </div>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Urgent Ticket Alerts</Label>
                <div className="text-sm text-gray-500">
                  Get immediate alerts for high-priority tickets
                </div>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Daily Summary</Label>
                <div className="text-sm text-gray-500">
                  Receive a daily summary of ticket activity
                </div>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ticket Settings</CardTitle>
            <CardDescription>
              Configure how tickets are handled in your organization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-assignment</Label>
                <div className="text-sm text-gray-500">
                  Automatically assign tickets to available agents
                </div>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Customer Feedback</Label>
                <div className="text-sm text-gray-500">
                  Request feedback after ticket resolution
                </div>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="space-y-2">
              <Label>Default Response Time (hours)</Label>
              <Input type="number" defaultValue="24" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Development Tools</CardTitle>
            <CardDescription>
              Tools for testing and development (only visible in development mode)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TestInviteGenerator />
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Danger Zone</CardTitle>
            <CardDescription>
              Irreversible and destructive actions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="destructive">Delete Organization</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}