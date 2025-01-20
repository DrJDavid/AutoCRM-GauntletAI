import { useEffect } from 'react';
import { useTicketStore } from '@/stores/ticketStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TicketList } from '@/components/tickets/TicketList';
import { useLocation } from 'wouter';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { tickets, fetchTickets, isLoading } = useTicketStore();

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const metrics = {
    openTickets: tickets.filter(t => t.status !== 'closed').length,
    avgResponseTime: '2.5 hours',
    resolutionRate: 85,
  };

  const statusData = [
    { name: 'New', count: tickets.filter(t => t.status === 'new').length },
    { name: 'Open', count: tickets.filter(t => t.status === 'open').length },
    { name: 'Pending', count: tickets.filter(t => t.status === 'pending').length },
    { name: 'Resolved', count: tickets.filter(t => t.status === 'resolved').length },
    { name: 'Closed', count: tickets.filter(t => t.status === 'closed').length },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.openTickets}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.avgResponseTime}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolution Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.resolutionRate}%</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ticket Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#4f46e5" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Loading...</div>
          ) : (
            <TicketList
              tickets={tickets.slice(0, 5)}
              onTicketSelect={(id) => setLocation(`/tickets/${id}`)}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
