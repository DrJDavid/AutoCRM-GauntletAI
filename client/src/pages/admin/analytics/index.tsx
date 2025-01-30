import { FC, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';

type TicketStats = {
  total_tickets: number;
  open_tickets: number;
  closed_tickets: number;
  avg_resolution_time: number;
};

type AgentPerformance = {
  tickets_handled: number;
  avg_resolution_time: number;
  customer_satisfaction: number;
};

const AnalyticsPage: FC = () => {
  const [ticketStats, setTicketStats] = useState<TicketStats | null>(null);
  const [agentStats, setAgentStats] = useState<Record<string, AgentPerformance>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // Fetch ticket statistics
        const { data: statsData, error: statsError } = await supabase
          .rpc('get_ticket_stats');

        if (statsError) throw statsError;
        if (statsData && statsData.length > 0) {
          setTicketStats(statsData[0]);
        }

        // Fetch agent performance
        const { data: agentsData, error: agentsError } = await supabase
          .from('profiles')
          .select('id, email, first_name, last_name')
          .eq('role', 'agent');

        if (agentsError) throw agentsError;

        // Get performance data for each agent
        const performanceData: Record<string, AgentPerformance> = {};
        if (agentsData) {
          for (const agent of agentsData) {
            const { data: perfData, error: perfError } = await supabase
              .rpc('get_agent_performance', { agent_id_param: agent.id });

            if (perfError) throw perfError;
            if (perfData && perfData.length > 0) {
              performanceData[agent.id] = perfData[0];
            }
          }
        }

        setAgentStats(performanceData);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (isLoading) {
    return <div>Loading analytics...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">Analytics Dashboard</h1>

      {/* Ticket Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ticketStats?.total_tickets || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ticketStats?.open_tickets || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Closed Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ticketStats?.closed_tickets || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Resolution Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {ticketStats?.avg_resolution_time
                ? `${Math.round(ticketStats.avg_resolution_time / 3600)}h`
                : 'N/A'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agent Performance */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Agent Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-muted">
                <tr>
                  <th scope="col" className="px-6 py-3">Agent</th>
                  <th scope="col" className="px-6 py-3">Tickets Handled</th>
                  <th scope="col" className="px-6 py-3">Avg. Resolution Time</th>
                  <th scope="col" className="px-6 py-3">Customer Satisfaction</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(agentStats).map(([agentId, stats]) => (
                  <tr key={agentId} className="border-b">
                    <td className="px-6 py-4">{agentId}</td>
                    <td className="px-6 py-4">{stats.tickets_handled}</td>
                    <td className="px-6 py-4">
                      {Math.round(stats.avg_resolution_time / 3600)}h
                    </td>
                    <td className="px-6 py-4">
                      {Math.round(stats.customer_satisfaction * 100)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsPage; 