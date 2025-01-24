import { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { Loader2, Clock, Upload, ChevronLeft, AlertCircle, Tag } from 'lucide-react';
import { useUserStore } from '@/stores/userStore';
import { uploadFiles } from '@/lib/uploadFiles';
import { useTicket } from '@/hooks/useTicket';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useDropzone } from 'react-dropzone';
import { TicketChat } from '@/components/chat/TicketChat';
import type { Attachment } from '@/types/database';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { FileViewer } from '@/components/files/FileViewer';
import { formatFileSize } from '@/lib/utils';

const statusColors = {
  open: 'bg-green-500/10 text-green-500',
  in_progress: 'bg-yellow-500/10 text-yellow-500',
  resolved: 'bg-blue-500/10 text-blue-500',
  closed: 'bg-gray-500/10 text-gray-500',
} as const;

const priorityColors = {
  low: 'bg-blue-500/10 text-blue-500',
  medium: 'bg-yellow-500/10 text-yellow-500',
  high: 'bg-orange-500/10 text-orange-500',
  urgent: 'bg-red-500/10 text-red-500',
} as const;

const categoryColors = {
  account: 'bg-purple-500/10 text-purple-500',
  billing: 'bg-emerald-500/10 text-emerald-500',
  technical_issue: 'bg-cyan-500/10 text-cyan-500',
  other: 'bg-gray-500/10 text-gray-500',
} as const;

export default function TicketDetailsPage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { currentUser } = useUserStore();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<Attachment | null>(null);
  const { ticket, loading } = useTicket(id!, { realtime: true });

  // File upload handling
  const onDrop = async (acceptedFiles: File[]) => {
    if (!ticket || !currentUser) return;

    try {
      setIsUploading(true);
      await uploadFiles({
        files: acceptedFiles,
        ticketId: ticket.id,
        organizationId: ticket.organization_id,
        userId: currentUser.id,
      });
      toast({
        title: 'Success',
        description: 'Files uploaded successfully',
      });
    } catch (error) {
      console.error('Failed to upload files:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload files',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  if (loading) {
    return (
      <PortalLayout>
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </PortalLayout>
    );
  }

  if (!ticket) {
    return (
      <PortalLayout>
        <div className="p-8 text-center">
          <h2 className="text-2xl font-semibold mb-2">Ticket Not Found</h2>
          <p className="text-gray-500">The ticket you're looking for doesn't exist or you don't have permission to view it.</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => setLocation('/portal')}
          >
            Return to Portal
          </Button>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout>
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Back button */}
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => setLocation('/portal')}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Tickets
        </Button>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold">{ticket.title}</h1>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className={priorityColors[ticket.priority]}>
                {ticket.priority}
              </Badge>
              <Badge variant="secondary" className={statusColors[ticket.status]}>
                {ticket.status.replace('_', ' ')}
              </Badge>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex gap-2 items-center text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              <span>Created {new Date(ticket.created_at).toLocaleString()}</span>
            </div>
            <div className="flex gap-2 items-center">
              <Tag className="h-4 w-4 text-gray-500" />
              <Badge variant="secondary" className={categoryColors[ticket.category]}>
                {ticket.category.replace('_', ' ')}
              </Badge>
            </div>
          </div>
        </div>

        {/* Description */}
        <Card className="p-4 mb-6">
          <h3 className="font-semibold mb-2">Description</h3>
          <p className="text-gray-700 whitespace-pre-wrap">
            {ticket.description || 'No description provided.'}
          </p>
        </Card>

        {/* Chat */}
        <Card className="p-4 mb-6">
          <TicketChat ticketId={ticket.id} />
        </Card>

        {/* File Upload */}
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Attachments</h3>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            {isUploading ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <p>Uploading...</p>
              </div>
            ) : isDragActive ? (
              <p>Drop the files here...</p>
            ) : (
              <div className="space-y-1">
                <p>Drag and drop files here, or click to select files</p>
                <p className="text-sm text-muted-foreground">Up to 10MB per file</p>
              </div>
            )}
          </div>

          {/* Attachments List */}
          {ticket.attachments && ticket.attachments.length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Uploaded Files</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ticket.attachments.map((attachment) => (
                  <Card
                    key={attachment.id}
                    className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setSelectedAttachment(attachment)}
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex-1 truncate">
                        <p className="font-medium truncate">{attachment.file_name}</p>
                        <p className="text-sm text-gray-500">
                          {formatFileSize(attachment.file_size)}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* File Viewer */}
      {selectedAttachment && (
        <FileViewer
          attachment={selectedAttachment}
          onClose={() => setSelectedAttachment(null)}
        />
      )}
    </PortalLayout>
  );
}
