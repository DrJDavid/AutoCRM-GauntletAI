import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function TicketsOverview() {
  const tickets = [
    {
      id: "T-123",
      subject: "Login issues with mobile app",
      status: "Open",
      priority: "High",
      customer: "john@example.com",
      assignedTo: "Sarah Johnson",
      created: "2h ago"
    },
    {
      id: "T-122",
      subject: "Cannot update profile picture",
      status: "In Progress",
      priority: "Medium",
      customer: "alice@example.com",
      assignedTo: "Mike Chen",
      created: "4h ago"
    },
    {
      id: "T-121",
      subject: "Billing question",
      status: "Open",
      priority: "Low",
      customer: "bob@example.com",
      assignedTo: "Unassigned",
      created: "1d ago"
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">All Tickets</h1>
        <Button>Create Ticket</Button>
      </div>

      <div className="grid gap-4">
        {tickets.map((ticket) => (
          <Card key={ticket.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <span className="text-gray-500">{ticket.id}</span>
                {ticket.subject}
              </CardTitle>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-sm ${
                  ticket.status === 'Open' ? 'bg-yellow-100 text-yellow-800' :
                  ticket.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {ticket.status}
                </span>
                <span className={`px-2 py-1 rounded text-sm ${
                  ticket.priority === 'High' ? 'bg-red-100 text-red-800' :
                  ticket.priority === 'Medium' ? 'bg-orange-100 text-orange-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {ticket.priority}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between text-sm text-gray-500">
                <div className="space-y-1">
                  <div>Customer: {ticket.customer}</div>
                  <div>Assigned to: {ticket.assignedTo}</div>
                </div>
                <div>
                  Created {ticket.created}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 