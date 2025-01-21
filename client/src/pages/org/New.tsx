import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function OrganizationNew() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Create New Organization</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Organization Name</Label>
            <Input placeholder="Enter organization name" />
          </div>
          
          <div className="space-y-2">
            <Label>Organization Slug</Label>
            <Input placeholder="your-org-name" />
            <p className="text-sm text-gray-500">
              This will be used in your organization's URL: autocrm.com/your-org-name
            </p>
          </div>

          <div className="space-y-2">
            <Label>Industry</Label>
            <Input placeholder="e.g. Technology, Healthcare, etc." />
          </div>

          <div className="space-y-2">
            <Label>Support Email</Label>
            <Input type="email" placeholder="support@your-org.com" />
          </div>

          <Button className="w-full">Create Organization</Button>
        </CardContent>
      </Card>
    </div>
  );
} 