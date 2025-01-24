import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { Loader2, Clock, AlertCircle, CheckCircle2, Pencil, Upload, ChevronLeft, UserPlus, UserMinus } from 'lucide-react';
import { useUserStore } from '@/stores/userStore';
import { useTicket } from '@/hooks/useTicket';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { TicketChat } from '@/components/chat/TicketChat';
import { FileViewer } from '@/components/files/FileViewer';
import type { Ticket, TicketStatus, TicketPriority, TicketCategory } from '@/types/database';

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
  priority: z.enum(['low', 'medium', 'high', 'urgent'] as const),
  status: z.enum(['open', 'in_progress', 'resolved', 'closed'] as const),
  category: z.enum(['account', 'billing', 'technical_issue', 'other'] as const),
});

type EditTicketFormValues = z.infer<typeof editTicketSchema>;

export function AgentTicketDetailsPage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { currentUser } = useUserStore();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<any>(null);
  const {
    ticket,
    loading,
    error,
    updateStatus,
    updatePriority,
    updateCategory,
    assignTicket,
  } = useTicket(id!, { realtime: true });

  const form = useForm<EditTicketFormValues>({
    resolver: zodResolver(editTicketSchema),
    defaultValues: {
      priority: 'medium',
      status: 'open',
      category: 'other',
    },
  });

  // Update form values when ticket loads or changes
  useEffect(() => {
    if (ticket) {
      form.reset({
        priority: ticket.priority,
        status: ticket.status,
        category: ticket.category,
      });
    }
  }, [ticket, form]);

  const onSubmit = async (values: EditTicketFormValues) => {
    try {
      if (!ticket) {
        console.error('Cannot submit form: ticket not found');
        throw new Error('Cannot submit form: ticket not found');
      }

      console.log('Submitting form with values:', values);
      console.log('Current ticket state:', ticket);

      // Track changes to show appropriate success message
      const changes: string[] = [];

      if (values.status !== ticket.status) {
        console.log('Updating status:', { old: ticket.status, new: values.status });
        await updateStatus(values.status);
        changes.push('status');
      }
      if (values.priority !== ticket.priority) {
        console.log('Updating priority:', { old: ticket.priority, new: values.priority });
        await updatePriority(values.priority);
        changes.push('priority');
      }
      if (values.category !== ticket.category) {
        console.log('Updating category:', { old: ticket.category, new: values.category });
        await updateCategory(values.category);
        changes.push('category');
      }

      setIsEditing(false);
      
      // Show success message with specific changes
      const changeText = changes.length > 0
        ? `Updated ticket ${changes.join(', ')}`
        : 'No changes made';
        
      toast({
        title: 'Success',
        description: changeText,
      });
    } catch (error) {
      console.error('Failed to update ticket:', error);
      
      // Extract error message
      let errorMessage = 'Failed to update ticket';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        errorMessage = (error as any).message || JSON.stringify(error);
      }

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <AlertCircle className="w-8 h-8 text-red-500" />
        <p className="text-lg font-medium">Failed to load ticket</p>
        <Button onClick={() => setLocation('/agent/dashboard')}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <Button
            variant="ghost"
            className="mb-2"
            onClick={() => setLocation('/agent')}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold">{ticket.title}</h1>
          <div className="flex items-center gap-2 text-gray-500 mt-1">
            <Clock className="w-4 h-4" />
            <span>Created {new Date(ticket.created_at).toLocaleString()}</span>
          </div>
        </div>
        <Button onClick={() => setIsEditing(!isEditing)}>
          <Pencil className="w-4 h-4 mr-2" />
          {isEditing ? 'Cancel Edit' : 'Edit Ticket'}
        </Button>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {/* Status, Priority, Category Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <h3 className="font-semibold mb-2">Status</h3>
            {isEditing ? (
              <Select
                value={form.getValues('status')}
                onValueChange={(value) => form.setValue('status', value as TicketStatus)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Badge
                variant="secondary"
                className={statusColors[ticket.status]}
              >
                {ticket.status.replace('_', ' ')}
              </Badge>
            )}
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold mb-2">Priority</h3>
            {isEditing ? (
              <Select
                value={form.getValues('priority')}
                onValueChange={(value) => form.setValue('priority', value as TicketPriority)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Badge
                variant="secondary"
                className={priorityColors[ticket.priority]}
              >
                {ticket.priority}
              </Badge>
            )}
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold mb-2">Category</h3>
            {isEditing ? (
              <Select
                value={form.getValues('category')}
                onValueChange={(value) => form.setValue('category', value as TicketCategory)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="account">Account</SelectItem>
                  <SelectItem value="billing">Billing</SelectItem>
                  <SelectItem value="technical_issue">Technical Issue</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Badge
                variant="secondary"
                className={categoryColors[ticket.category]}
              >
                {ticket.category.replace('_', ' ')}
              </Badge>
            )}
          </Card>
        </div>

        {/* Assignment Card */}
        <Card className="p-4">
          <h3 className="font-semibold mb-2">Assignment</h3>
          <div className="flex items-center justify-between">
            <div>
              {ticket.assigned_agent ? (
                <div className="text-sm text-gray-600">
                  Assigned to: {ticket.assigned_agent.email}
                </div>
              ) : (
                <div className="text-sm text-gray-600">
                  Not assigned
                </div>
              )}
            </div>
            <div>
              {ticket.assigned_agent_id === currentUser?.id && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={async () => {
                    try {
                      await assignTicket(null);
                      toast({
                        title: 'Success',
                        description: 'Ticket unassigned successfully',
                      });
                    } catch (error) {
                      toast({
                        title: 'Error',
                        description: 'Failed to unassign ticket',
                        variant: 'destructive',
                      });
                    }
                  }}
                >
                  <UserMinus className="h-4 w-4 mr-2" />
                  Unassign
                </Button>
              )}
              {!ticket.assigned_agent_id && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={async () => {
                    try {
                      await assignTicket(currentUser?.id || null);
                      toast({
                        title: 'Success',
                        description: 'Ticket assigned to you successfully',
                      });
                    } catch (error) {
                      toast({
                        title: 'Error',
                        description: 'Failed to assign ticket',
                        variant: 'destructive',
                      });
                    }
                  }}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Assign to me
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Save/Cancel buttons when editing */}
        {isEditing && (
          <div className="flex justify-end gap-2 mb-6">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditing(false);
                form.reset({
                  priority: ticket.priority,
                  status: ticket.status,
                  category: ticket.category,
                });
              }}
            >
              Cancel
            </Button>
            <Button onClick={form.handleSubmit(onSubmit)}>
              Save Changes
            </Button>
          </div>
        )}

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

        {/* Attachments */}
        {ticket.attachments && ticket.attachments.length > 0 && (
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Attachments</h3>
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
                        {new Date(attachment.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* File Viewer */}
      {selectedAttachment && (
        <FileViewer
          attachment={selectedAttachment}
          onClose={() => setSelectedAttachment(null)}
        />
      )}
    </div>
  );
}
