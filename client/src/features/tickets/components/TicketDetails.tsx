import { FC, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUserStore } from '@/stores/userStore';
import { useTicketStore } from '@/stores/ticketStore';
import { TicketChat } from './TicketChat';
import { TicketFiles } from './TicketFiles';
import { TicketActions } from './TicketActions';
import { TicketScratchpad } from './TicketScratchpad';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from '@/components/ui/use-toast';
import type { DbTicket, TicketStatus, TicketPriority } from '@/types/database';
import type { Ticket } from '../types';
import { cn } from '@/lib/utils';

// Transform database ticket to frontend ticket
const toFrontendTicket = (dbTicket: DbTicket): Ticket => ({
  ...dbTicket,
  status: dbTicket.status || 'open',
  priority: dbTicket.priority || 'low',
});

interface TicketDetailsProps {
  mode?: 'admin' | 'agent' | 'customer';
}

export const TicketDetails: FC<TicketDetailsProps> = ({ mode = 'customer' }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useUserStore();
  const { tickets, fetchTicket, isLoading, error } = useTicketStore();
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    if (id) {
      fetchTicket(id);
    }
  }, [id, fetchTicket]);

  const ticket = tickets.find(t => t.id === id);
  const frontendTicket = ticket ? toFrontendTicket(ticket) : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading ticket details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error.message}</p>
          <Button onClick={() => fetchTicket(id!)}>Retry</Button>
        </div>
      </div>
    );
  }

  if (!frontendTicket) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Ticket not found or you don't have permission to view it.</p>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    );
  }

  const canEdit = mode === 'admin' || 
    (mode === 'agent' && frontendTicket.organization_id === currentUser?.organization_id) ||
    (mode === 'customer' && frontendTicket.customer_id === currentUser?.id);

  const canAssign = mode === 'admin' || mode === 'agent';
  const canChangeStatus = canEdit;
  const canChangePriority = mode === 'admin' || mode === 'agent';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{frontendTicket.title}</CardTitle>
              <CardDescription>
                Ticket #{frontendTicket.id.slice(0, 8)}
                {frontendTicket.customer && ` • From: ${frontendTicket.customer.email}`}
                {frontendTicket.created_at && ` • Created: ${new Date(frontendTicket.created_at).toLocaleDateString()}`}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {canEdit && (
                <TicketActions
                  ticket={frontendTicket}
                  mode={mode}
                  canAssign={canAssign}
                  canChangeStatus={canChangeStatus}
                  canChangePriority={canChangePriority}
                />
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="files">Files</TabsTrigger>
              {mode !== 'customer' && (
                <TabsTrigger value="history">History</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="details" className="space-y-4">
              <div className="prose max-w-none">
                <h3>Description</h3>
                <p>{frontendTicket.description}</p>
              </div>

              <div className="flex gap-4 mt-4">
                <Badge variant={frontendTicket.status === 'open' ? 'default' : 'secondary'}>
                  {frontendTicket.status.replace('_', ' ')}
                </Badge>
                <Badge variant={frontendTicket.priority === 'urgent' ? 'destructive' : 'default'}>
                  {frontendTicket.priority}
                </Badge>
              </div>
            </TabsContent>

            <TabsContent value="chat">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className={cn(
                  "lg:col-span-2",
                  mode === 'customer' && "lg:col-span-3"
                )}>
                  <TicketChat
                    ticketId={frontendTicket.id}
                    mode={mode}
                    className="min-h-[400px]"
                  />
                </div>
                
                {mode !== 'customer' && (
                  <div className="lg:col-span-1">
                    <TicketScratchpad
                      ticketId={frontendTicket.id}
                      className="sticky top-4"
                    />
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="files">
              <TicketFiles
                ticketId={frontendTicket.id}
                mode={mode}
                canUpload={canEdit}
              />
            </TabsContent>

            {mode !== 'customer' && (
              <TabsContent value="history">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Version History</h3>
                  {/* We'll implement version history next */}
                  <p className="text-muted-foreground">Coming soon...</p>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}; 