import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTicketStore } from '@/stores/ticketStore';
import { useUserStore } from '@/stores/userStore';
import { Loader2, ChevronLeft, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { TicketChat } from '@/components/chat/TicketChat';
import { FileViewer } from '@/components/files/FileViewer';
import type { TicketWithRelations, DbTicketAttachment } from '@/types/database';

export default function AgentTicketDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useUserStore();
  const { 
    selectedTicket,
    isLoading,
    error,
    fetchTicket,
    setSelectedTicket
  } = useTicketStore();
  const [selectedAttachment, setSelectedAttachment] = useState<DbTicketAttachment | null>(null);

  // Cast selectedTicket to include relations
  const ticket = selectedTicket as TicketWithRelations | null;

  // Fetch ticket data when component mounts or ID changes
  useEffect(() => {
    if (id && currentUser?.organization_id) {
      fetchTicket(id);
    }

    // Cleanup on unmount
    return () => {
      setSelectedTicket(null);
    };
  }, [id, currentUser?.organization_id]);

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-destructive/15 text-destructive p-4 rounded-lg">
          Error loading ticket details. Please try again.
        </div>
      </div>
    );
  }

  if (isLoading || !ticket) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/agent/tickets')}
          className="gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Tickets
        </Button>
      </div>

      <Card className="p-6">
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold">{ticket.title}</h1>
            <div className="flex items-center gap-2">
              <Badge variant={ticket.priority === 'urgent' ? 'destructive' : 'outline'}>
                {ticket.priority}
              </Badge>
              <Badge variant={ticket.status === 'open' ? 'default' : 'secondary'}>
                {ticket.status}
              </Badge>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            {ticket.created_at && new Date(ticket.created_at).toLocaleDateString()}
          </div>
        </div>

        <Separator className="my-4" />

        <div className="space-y-4">
          <div>
            <h2 className="font-medium mb-2">Description</h2>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {ticket.description || 'No description provided'}
            </p>
          </div>

          {ticket.attachments && ticket.attachments.length > 0 && (
            <div>
              <h2 className="font-medium mb-2">Attachments</h2>
              <div className="space-y-2">
                {ticket.attachments.map(attachment => (
                  <Button
                    key={attachment.id}
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={() => setSelectedAttachment(attachment)}
                  >
                    <Paperclip className="h-4 w-4" />
                    <span className="truncate">{attachment.file_name}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {formatFileSize(attachment.file_size)}
                    </span>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-4">Conversation</h2>
        <TicketChat ticketId={ticket.id} />
      </Card>

      {/* File Viewer Modal */}
      {selectedAttachment && (
        <FileViewer
          attachment={selectedAttachment}
          onClose={() => setSelectedAttachment(null)}
        />
      )}
    </div>
  );
}

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
