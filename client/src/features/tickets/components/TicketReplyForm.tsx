import { FC } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { useTicketStore } from '@/stores/ticketStore';
import { useUserStore } from '@/stores/userStore';

const replySchema = z.object({
  message: z.string().min(1, 'Message is required'),
});

type ReplyFormValues = z.infer<typeof replySchema>;

interface TicketReplyFormProps {
  ticketId: string;
}

export const TicketReplyForm: FC<TicketReplyFormProps> = ({ ticketId }) => {
  const { currentUser } = useUserStore();
  const { addMessage, isLoading } = useTicketStore();

  const form = useForm<ReplyFormValues>({
    resolver: zodResolver(replySchema),
    defaultValues: {
      message: '',
    },
  });

  const onSubmit = async (values: ReplyFormValues) => {
    if (!currentUser) return;

    try {
      await addMessage({
          ticket_id: ticketId,
          message: values.message,
          sender_id: currentUser.id,
          is_internal: false,
          metadata: null
      });
      form.reset();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea
                  placeholder="Type your reply..."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send Reply'}
          </Button>
        </div>
      </form>
    </Form>
  );
}; 