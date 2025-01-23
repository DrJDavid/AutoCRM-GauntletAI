import { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { Loader2, Clock, AlertCircle, CheckCircle2, Pencil } from 'lucide-react';
import { useUserStore } from '@/stores/userStore';
import { getFileUrl } from '@/lib/uploadFiles';
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
import type { Attachment } from '@/db/types/database';

const statusColors = {
  open: 'bg-green-500/10 text-green-500 hover:bg-green-500/20',
  'in-progress': 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20',
  resolved: 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20',
  closed: 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20',
} as const;

const priorityColors = {
  low: 'bg-gray-500/10 text-gray-500',
  medium: 'bg-yellow-500/10 text-yellow-600',
  high: 'bg-orange-500/10 text-orange-600',
  urgent: 'bg-red-500/10 text-red-600',
} as const;

// Schema for edit form validation
const editTicketSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  description: z.string().min(1, 'Description is required'),
  priority: z.enum(['low', 'medium', 'high', 'urgent'] as const),
  status: z.enum(['open', 'in-progress', 'resolved', 'closed'] as const),
});

type EditTicketFormValues = z.infer<typeof editTicketSchema>;

export default function TicketDetailsPage() {
  const [, setLocation] = useLocation();
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useUserStore();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [downloadUrls, setDownloadUrls] = useState<Record<string, string>>({});

  const {
    ticket,
    loading,
    error,
    updateStatus,
    updatePriority,
    updateDetails,
  } = useTicket(id, { realtime: true });

  const form = useForm<EditTicketFormValues>({
    resolver: zodResolver(editTicketSchema),
    defaultValues: {
      title: ticket?.title || '',
      description: ticket?.description || '',
      priority: ticket?.priority || 'medium',
      status: ticket?.status || 'open',
    },
  });

  // Update form values when ticket changes
  useEffect(() => {
    if (ticket) {
      form.reset({
        title: ticket.title,
        description: ticket.description,
        priority: ticket.priority,
        status: ticket.status,
      });
    }
  }, [ticket, form]);

  // Get download URLs for attachments
  useEffect(() => {
    if (!ticket?.attachments) return;

    const fetchUrls = async () => {
      const urls: Record<string, string> = {};
      for (const attachment of ticket.attachments) {
        const url = await getFileUrl(attachment.storage_path);
        if (url) urls[attachment.id] = url;
      }
      setDownloadUrls(urls);
    };

    fetchUrls();
  }, [ticket?.attachments]);

  const onSubmit = async (values: EditTicketFormValues) => {
    try {
      if (values.status !== ticket?.status) {
        await updateStatus(values.status);
      }
      if (values.priority !== ticket?.priority) {
        await updatePriority(values.priority);
      }
      if (values.title !== ticket?.title || values.description !== ticket?.description) {
        await updateDetails({
          title: values.title,
          description: values.description,
        });
      }

      toast({
        title: 'Success',
        description: 'Ticket updated successfully',
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating ticket:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update ticket',
        variant: 'destructive',
      });
    }
  };

  const downloadAttachment = async (attachment: Attachment) => {
    const url = downloadUrls[attachment.id];
    if (!url) {
      toast({
        title: 'Error',
        description: 'Failed to get download URL',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = attachment.file_name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: 'Error',
        description: 'Failed to download file',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!ticket) {
    return null;
  }

  return (
    <div className="container max-w-5xl py-6 space-y-8">
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
            {ticket.status}
          </Badge>
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      <Separator />

      {/* Main content */}
      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          {/* Description */}
          <Card className="p-6">
            <h2 className="font-semibold mb-4">Description</h2>
            <p className="whitespace-pre-wrap">{ticket.description}</p>
          </Card>

          {/* Attachments */}
          {ticket.attachments && ticket.attachments.length > 0 && (
            <Card className="p-6">
              <h2 className="font-semibold mb-4">Attachments</h2>
              <ul className="space-y-2">
                {ticket.attachments.map((attachment) => (
                  <li
                    key={attachment.id}
                    className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                  >
                    <span className="flex-1 truncate" title={attachment.file_name}>
                      {attachment.file_name}
                    </span>
                    <span className="text-sm text-muted-foreground mx-4">
                      {(attachment.file_size / 1024).toFixed(1)}KB
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => downloadAttachment(attachment)}
                    >
                      Download
                    </Button>
                  </li>
                ))}
              </ul>
            </Card>
          )}

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
                          <SelectItem value="in-progress">In Progress</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
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
    </div>
  );
}
