import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function UserManagement() {
  const users = [
    {
      id: 1,
      name: "John Doe",
      email: "john@example.com",
      role: "Admin",
      status: "Active",
      lastActive: "2 hours ago"
    },
    {
      id: 2,
      name: "Jane Smith",
      email: "jane@example.com",
      role: "Agent",
      status: "Active",
      lastActive: "1 day ago"
    },
    {
      id: 3,
      name: "Bob Wilson",
      email: "bob@example.com",
      role: "Customer",
      status: "Inactive",
      lastActive: "1 week ago"
    }
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">User Management</h1>
        <div className="flex gap-4">
          <Input placeholder="Search users..." className="w-64" />
          <Button>Add User</Button>
        </div>
      </div>

      <div className="grid gap-4">
        {users.map((user) => (
          <Card key={user.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {user.name}
              </CardTitle>
              <span className={`px-2 py-1 rounded text-sm ${
                user.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {user.status}
              </span>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between text-sm text-gray-500">
                <div className="space-y-1">
                  <div>Email: {user.email}</div>
                  <div>Role: {user.role}</div>
                </div>
                <div>
                  Last active: {user.lastActive}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 