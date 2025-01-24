import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { Loader2, Clock, AlertCircle, CheckCircle2, Pencil, Upload, ChevronLeft } from 'lucide-react';
import { useUserStore } from '@/stores/userStore';
import { getFileUrl, uploadFiles } from '@/lib/uploadFiles';
import { useTicket } from '@/hooks/useTicket';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useDropzone } from 'react-dropzone';
import { TicketChat } from '@/components/chat/TicketChat';
import type { Attachment, Ticket, TicketStatus, TicketPriority, TicketCategory } from '@/types/database';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { FileViewer } from '@/components/files/FileViewer';
import { formatFileSize } from '@/lib/utils';

const statusColors: Record<TicketStatus, string> = {
  open: 'bg-green-500/10 text-green-500 hover:bg-green-500/20',
  in_progress: 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20',
  resolved: 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20',
  closed: 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20',
} as const;

const priorityColors: Record<TicketPriority, string> = {
  low: 'bg-gray-500/10 text-gray-500',
  medium: 'bg-blue-500/10 text-blue-500',
  high: 'bg-yellow-500/10 text-yellow-500',
  urgent: 'bg-red-500/10 text-red-500',
} as const;

const categoryColors: Record<TicketCategory, string> = {
  account: 'bg-purple-500/10 text-purple-500',
  billing: 'bg-pink-500/10 text-pink-500',
  technical_issue: 'bg-cyan-500/10 text-cyan-500',
  other: 'bg-gray-500/10 text-gray-500',
} as const;

// Schema for edit form validation
const editTicketSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().nullable(),
  priority: z.enum(['low', 'medium', 'high', 'urgent'] as const),
  status: z.enum(['open', 'in_progress', 'resolved', 'closed'] as const),
  category: z.enum(['account', 'billing', 'technical_issue', 'other'] as const),
});

type EditTicketFormValues = z.infer<typeof editTicketSchema>;

export default function TicketDetailsPage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { currentUser } = useUserStore();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<Attachment | null>(null);
  const [downloadUrls, setDownloadUrls] = useState<Record<string, string>>({});
  const {
    ticket,
    loading,
    error,
    updateStatus,
    updatePriority,
    updateCategory,
    updateDetails,
    refresh,
  } = useTicket(id!, { realtime: true });

  const form = useForm<EditTicketFormValues>({
    resolver: zodResolver(editTicketSchema),
    defaultValues: {
      title: ticket?.title || '',
      description: ticket?.description || '',
      priority: ticket?.priority || 'medium',
      status: ticket?.status || 'open',
      category: ticket?.category || 'other',
    },
  });

  // Update form when ticket changes
  useEffect(() => {
    if (ticket) {
      form.reset({
        title: ticket.title,
        description: ticket.description || '',
        priority: ticket.priority,
        status: ticket.status,
        category: ticket.category,
      });
    }
  }, [ticket, form]);

  const onSubmit = async (values: EditTicketFormValues) => {
    try {
      if (!ticket) return;

      if (values.status !== ticket.status) {
        await updateStatus(values.status);
      }
      if (values.priority !== ticket.priority) {
        await updatePriority(values.priority);
      }
      if (values.category !== ticket.category) {
        await updateCategory(values.category);
      }
      if (values.title !== ticket.title || values.description !== ticket.description) {
        await updateDetails({
          title: values.title,
          description: values.description || '',
        });
      }

      setIsEditing(false);
      toast({
        title: 'Success',
        description: 'Ticket updated successfully',
      });
    } catch (error) {
      console.error('Failed to update ticket:', error);
      toast({
        title: 'Error',
        description: 'Failed to update ticket',
        variant: 'destructive',
      });
    }
  };

  // File upload handling
  const onDrop = async (acceptedFiles: File[]) => {
    if (!ticket) return;

    try {
      setIsUploading(true);
      await uploadFiles({
        files: acceptedFiles,
        ticketId: ticket.id,
        organizationId: ticket.organization_id,
        userId: currentUser?.id || '',
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

  const viewAttachment = (attachment: Attachment) => {
    setSelectedAttachment(attachment);
  };

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
      <div className="space-y-6">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              onClick={() => setLocation('/portal')}
              className="flex items-center"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Tickets
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <h1 className="text-2xl font-bold">Ticket #{ticket.id.slice(-8)}</h1>
          </div>
          <div className="flex items-center space-x-2">
            {currentUser?.id === ticket.customer_id && (
              <Button
                variant="outline"
                onClick={() => setIsEditing(true)}
                className="flex items-center"
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit Ticket
              </Button>
            )}
          </div>
        </div>

        <Card>
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold">{ticket.title}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Created {new Date(ticket.created_at).toLocaleDateString()}</span>
                {ticket.customer && (
                  <>
                    <span>•</span>
                    <span>by {ticket.customer.email}</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className={priorityColors[ticket.priority]}>
                {ticket.priority}
              </Badge>
              <Badge variant="secondary" className={statusColors[ticket.status]}>
                {ticket.status.replace('_', ' ')}
              </Badge>
              <Badge variant="secondary" className={categoryColors[ticket.category]}>
                {ticket.category.replace('_', ' ')}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Main content */}
          <Tabs defaultValue="details">
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-6">
              {/* Description */}
              <Card className="p-6">
                <h2 className="font-semibold mb-4">Description</h2>
                <p className="whitespace-pre-wrap">{ticket.description}</p>
              </Card>

              {/* File Upload */}
              <Card className="p-6">
                <h2 className="font-semibold mb-4">Attachments</h2>
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
                {(ticket.attachments || []).length > 0 && (
                  <div className="mt-4">
                    <h3 className="font-semibold mb-2">Attachments</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {(ticket.attachments || []).map((attachment: Attachment) => (
                        <Card
                          key={attachment.id}
                          className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => viewAttachment(attachment)}
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

              {/* Assignment */}
              <Card className="p-6">
                <h2 className="font-semibold mb-4">Assignment</h2>
                {ticket.assigned_agent ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>Assigned to {ticket.assigned_agent.email}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                    <span>Not assigned</span>
                  </div>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="chat" className="space-y-6">
              <Card>
                <TicketChat ticketId={ticket.id} />
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="space-y-6">
              {/* Activity timeline will be implemented next */}
              <Card className="p-6">
                <p className="text-muted-foreground">Activity timeline coming soon...</p>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Edit dialog */}
          <Dialog open={isEditing} onOpenChange={setIsEditing}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit Ticket</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea {...field} className="min-h-[100px]" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Priority</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="urgent">Urgent</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="open">Open</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="resolved">Resolved</SelectItem>
                              <SelectItem value="closed">Closed</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="account">Account</SelectItem>
                              <SelectItem value="billing">Billing</SelectItem>
                              <SelectItem value="technical_issue">Technical Issue</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Save Changes</Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </Card>
      </div>
      {selectedAttachment && (
        <FileViewer
          attachment={selectedAttachment}
          isOpen={!!selectedAttachment}
          onClose={() => setSelectedAttachment(null)}
        />
      )}
    </PortalLayout>
  );
}
