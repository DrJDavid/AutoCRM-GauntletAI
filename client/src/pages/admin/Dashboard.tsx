import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserStore } from '@/stores/userStore';
import { useTicketStore } from '@/stores/ticketStore';
import { 
  TicketCheck, 
  AlertCircle,
  Loader2,
  UserPlus,
  BarChart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TicketList } from '@/features/tickets';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { currentUser } = useUserStore();
  const { tickets, fetchTickets } = useTicketStore();

  useEffect(() => {
    if (currentUser) {
      fetchTickets();
    }
  }, [currentUser, fetchTickets]);

  if (currentUser === null) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
          <h3 className="font-semibold">Access Denied</h3>
          <p className="text-sm text-muted-foreground">Please log in to view the dashboard.</p>
        </div>
      </div>
    );
  }

  // Calculate ticket statistics
  const totalTickets = tickets.length;
  const openTickets = tickets.filter(t => t.status === 'open').length;
  const inProgressTickets = tickets.filter(t => t.status === 'in_progress').length;
  const resolvedTickets = tickets.filter(t => t.status === 'resolved').length;
  const urgentTickets = tickets.filter(t => t.priority === 'urgent').length;

  // Calculate trends (mock data for now)
  const ticketsThisWeek = totalTickets;
  const ticketsLastWeek = Math.floor(totalTickets * 0.8);
  const trend = ((ticketsThisWeek - ticketsLastWeek) / ticketsLastWeek) * 100;

  const stats = [
    {
      title: "Total Tickets",
      value: totalTickets,
      change: trend >= 0 ? `+${trend.toFixed(1)}%` : `${trend.toFixed(1)}%`,
      description: "from last week"
    },
    {
      title: "Active Agents",
      value: "8",
      change: "+2",
      description: "new this week"
    },
    {
      title: "Customer Satisfaction",
      value: "94%",
      change: "+2%",
      description: "from last month"
    },
    {
      title: "Avg Response Time",
      value: "2.5h",
      change: "-30min",
      description: "from last week"
    }
  ];

  return (
    <div className="space-y-6 p-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Welcome back, {currentUser.email}</h2>
        <p className="text-muted-foreground">
          Here's an overview of your organization's support activity
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className={stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}>
                  {stat.change}
                </span>
                {' '}
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-6">
        <h3 className="text-lg font-medium mb-4">Quick Actions</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Link to="/org/customers/invite">
            <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center gap-2">
              <UserPlus className="h-6 w-6" />
              <span>Invite Customers</span>
            </Button>
          </Link>
          <Link to="/admin/tickets/all">
            <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center gap-2">
              <TicketCheck className="h-6 w-6" />
              <span>View All Tickets</span>
            </Button>
          </Link>
          <Link to="/admin/tickets/analytics">
            <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center gap-2">
              <BarChart className="h-6 w-6" />
              <span>View Analytics</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
} 