import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function ManageAgents() {
  const agents = [
    {
      name: "Sarah Johnson",
      email: "sarah@example.com",
      status: "Online",
      activeTickets: 5,
      performance: "95%"
    },
    {
      name: "Mike Chen",
      email: "mike@example.com",
      status: "Away",
      activeTickets: 3,
      performance: "92%"
    },
    {
      name: "Emma Wilson",
      email: "emma@example.com",
      status: "Offline",
      activeTickets: 0,
      performance: "88%"
    }
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Manage Agents</h1>
        <Button>Invite New Agent</Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Active Agents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {agents.map((agent, i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">{agent.name}</div>
                    <div className="text-sm text-gray-500">{agent.email}</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-medium ${
                      agent.status === 'Online' ? 'text-green-600' :
                      agent.status === 'Away' ? 'text-yellow-600' :
                      'text-gray-600'
                    }`}>
                      {agent.status}
                    </div>
                    <div className="text-sm text-gray-500">
                      {agent.activeTickets} active tickets
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Invite New Agent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input type="email" placeholder="agent@example.com" />
              </div>
              <div className="space-y-2">
                <Label>Message (Optional)</Label>
                <Textarea 
                  placeholder="Add a personal message to the invitation"
                  className="min-h-[100px]"
                />
              </div>
              <Button className="w-full">Send Invitation</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Agent Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {agents.map((agent, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{agent.name}</div>
                    <div className="text-sm text-gray-500">
                      Customer Satisfaction Rate
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: agent.performance }}
                      />
                    </div>
                    <span className="font-medium">{agent.performance}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 