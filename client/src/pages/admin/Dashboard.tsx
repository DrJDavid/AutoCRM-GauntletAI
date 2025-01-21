import { useEffect } from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserStore } from '@/stores/userStore';
import { useTicketStore } from '@/stores/ticketStore';
import { 
  Users, 
  TicketCheck, 
  Clock, 
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  UserPlus,
  BarChart
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminDashboard() {
  const { currentUser, isLoading: userLoading } = useUserStore();
  const { tickets, isLoading: ticketsLoading, error, fetchTickets } = useTicketStore();

  useEffect(() => {
    if (currentUser?.organization) {
      fetchTickets();
    }
  }, [fetchTickets, currentUser?.organization]);

  if (userLoading || ticketsLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
          <h3 className="font-semibold">Error Loading Dashboard</h3>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
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
  const resolvedTickets = tickets.filter(t => t.status === 'resolved').length;
  const urgentTickets = tickets.filter(t => t.priority === 'urgent').length;

  // Calculate trends (mock data for now)
  const ticketsThisWeek = totalTickets;
  const ticketsLastWeek = Math.floor(totalTickets * 0.8);
  const trend = ((ticketsThisWeek - ticketsLastWeek) / ticketsLastWeek) * 100;

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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <TicketCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{totalTickets}</div>
                <p className="text-xs text-muted-foreground">
                  {trend >= 0 ? '+' : ''}{trend.toFixed(1)}% from last week
                </p>
              </div>
              {trend >= 0 ? (
                <ArrowUpRight className="h-4 w-4 text-red-500" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-green-500" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openTickets}</div>
            <p className="text-xs text-muted-foreground">
              {((openTickets / totalTickets) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved Tickets</CardTitle>
            <TicketCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resolvedTickets}</div>
            <p className="text-xs text-muted-foreground">
              {((resolvedTickets / totalTickets) * 100).toFixed(1)}% resolution rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgent Tickets</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{urgentTickets}</div>
            <p className="text-xs text-muted-foreground">
              Requires immediate attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mt-6">
        <h3 className="text-lg font-medium mb-4">Quick Actions</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Link href="/org/customers/invite">
            <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center gap-2">
              <UserPlus className="h-6 w-6" />
              <span>Invite Customers</span>
            </Button>
          </Link>
          <Link href="/admin/tickets/all">
            <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center gap-2">
              <TicketCheck className="h-6 w-6" />
              <span>View All Tickets</span>
            </Button>
          </Link>
          <Link href="/admin/tickets/analytics">
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