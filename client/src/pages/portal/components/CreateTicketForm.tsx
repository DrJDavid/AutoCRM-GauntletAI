import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileUpload } from '@/components/ui/file-upload';
import { useToast } from '@/components/ui/use-toast';
import { useUserStore } from '@/stores/userStore';
import { supabase } from '@/lib/supabaseClient';
import { uploadFiles } from '@/lib/uploadFiles';

interface CreateTicketFormProps {
  onSuccess?: () => void;
}

export function CreateTicketForm({ onSuccess }: CreateTicketFormProps) {
  const { toast } = useToast();
  const { currentUser } = useUserStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  // Debug log current user state
  console.log('Current user state:', { 
    userId: currentUser?.id,
    organizationId: currentUser?.organization_id,
    isLoggedIn: !!currentUser
  });

  // Ensure user is logged in and has organization
  if (!currentUser?.id || !currentUser?.organization_id) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500">You must be logged in and part of an organization to create tickets.</p>
      </div>
    );
  }

  const form = useForm({
    defaultValues: {
      title: '',
      description: '',
      priority: 'medium',
      category: 'other',
    },
  });

  const onSubmit = async (data: any) => {
    console.log('Form submission started with data:', data);

    try {
      setIsSubmitting(true);

      // Log the data being sent to Supabase
      const ticketData = {
        ...data,
        customer_id: currentUser.id,
        organization_id: currentUser.organization_id,
        status: 'open',
      };
      console.log('Sending ticket data to Supabase:', ticketData);
      
      // Create the ticket in Supabase
      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .insert([ticketData])
        .select()
        .single();

      if (ticketError) {
        console.error('Supabase ticket creation error:', ticketError);
        throw ticketError;
      }

      console.log('Ticket created successfully:', ticket);

      // Upload files if any were selected
      if (files.length > 0 && ticket) {
        console.log('Starting file upload for files:', files.map(f => f.name));
        
        await uploadFiles({
          files,
          ticketId: ticket.id,
          organizationId: currentUser.organization_id,
          userId: currentUser.id,
        });

        console.log('Files uploaded successfully');
      }

      toast({
        title: 'Success',
        description: 'Your ticket has been created successfully.',
      });

      form.reset();
      setFiles([]);
      onSuccess?.();

    } catch (error) {
      console.error('Error creating ticket:', error);
      toast({
        title: 'Error',
        description: 'There was an error creating your ticket. Please try again.',
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
                <Input placeholder="Brief description of the issue" {...field} />
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
                  placeholder="Detailed description of your issue"
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

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="technical_issue">Technical Issue</SelectItem>
                  <SelectItem value="billing">Billing</SelectItem>
                  <SelectItem value="account">Account</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FileUpload
          value={files}
          onChange={setFiles}
          maxFiles={5}
          maxSize={5 * 1024 * 1024} // 5MB
          accept={{
            'image/*': [],
            'application/pdf': [],
            'text/*': [],
          }}
        />

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create Ticket'}
        </Button>
      </form>
    </Form>
  );
}
