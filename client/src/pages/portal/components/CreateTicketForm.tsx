import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useUserStore } from '@/stores/userStore';
import { supabase } from '@/lib/supabaseClient';
import { FileUpload } from '@/components/ui/file-upload';
import { uploadFiles } from '@/lib/uploadFiles';
import type { TicketPriority } from '@/db/types/database';

// Schema for form validation
const ticketSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  description: z.string().min(1, 'Description is required'),
  priority: z.enum(['low', 'medium', 'high', 'urgent'] as const),
});

type TicketFormValues = z.infer<typeof ticketSchema>;

/**
 * CreateTicketForm component allows customers to create new support tickets
 * - Validates input using Zod schema
 * - Handles file attachments with drag & drop support
 * - Auto-assigns to customer's organization
 * - Shows success/error feedback
 */
export function CreateTicketForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const { currentUser } = useUserStore();

  const form = useForm<TicketFormValues>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'medium',
    },
  });

  const onSubmit = async (values: TicketFormValues) => {
    console.log('Form submitted with values:', values);
    console.log('Current user:', currentUser);

    if (!currentUser?.id || !currentUser?.organization?.id) {
      console.error('Missing user data:', { 
        userId: currentUser?.id, 
        orgId: currentUser?.organization?.id 
      });
      toast({
        title: 'Error',
        description: 'You must be logged in to create a ticket',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const ticketData = {
        title: values.title,
        description: values.description,
        priority: values.priority,
        status: 'open',
        customer_id: currentUser.id,
        organization_id: currentUser.organization.id,
      };
      console.log('Creating ticket with data:', ticketData);

      // Create the ticket in Supabase
      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .insert(ticketData)
        .select()
        .single();

      if (ticketError) {
        console.error('Error creating ticket:', ticketError);
        throw ticketError;
      }

      console.log('Ticket created:', ticket);

      // Upload files if any
      if (files.length > 0 && ticket) {
        console.log('Uploading files:', files);
        try {
          const attachments = await uploadFiles({
            files,
            ticketId: ticket.id,
            organizationId: currentUser.organization.id,
            userId: currentUser.id,
          });
          console.log('Files uploaded:', attachments);
        } catch (uploadError) {
          console.error('Error uploading files:', uploadError);
          // Continue with success message even if file upload fails
        }
      }

      toast({
        title: 'Success',
        description: 'Your ticket has been created successfully',
      });

      // Reset form and files
      form.reset();
      setFiles([]);
    } catch (error) {
      console.error('Error in form submission:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create ticket. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Brief description of your issue" {...field} />
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
                <Textarea
                  placeholder="Please provide detailed information about your issue"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="priority"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Priority</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
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

        <div className="space-y-2">
          <FormLabel>Attachments</FormLabel>
          <FileUpload
            onChange={setFiles}
            maxFiles={5}
            maxSize={5 * 1024 * 1024} // 5MB
            disabled={isSubmitting}
          />
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create Ticket'}
        </Button>
      </form>
    </Form>
  );
}
