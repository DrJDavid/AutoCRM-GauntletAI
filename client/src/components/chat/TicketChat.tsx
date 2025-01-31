import { useState, useEffect, useRef } from 'react';
import { Send, Loader2, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabaseClient';
import { useUserStore } from '@/stores/userStore';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { TicketMessage } from '@/features/tickets/types';

interface TicketChatProps {
  ticketId: string;
}

const messageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(2000, 'Message is too long'),
  isInternal: z.boolean().default(false),
});

type MessageFormValues = z.infer<typeof messageSchema>;

export function TicketChat({ ticketId }: TicketChatProps) {
  const { currentUser } = useUserStore();
  const { toast } = useToast();
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const form = useForm<MessageFormValues>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      content: '',
      isInternal: false,
    },
  });

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load user profile
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!currentUser) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single();

        if (error) {
          throw error;
        }

        setUserProfile(data);
        setProfileError(null);
      } catch (error) {
        console.error('Error loading user profile:', error);
        setProfileError('Failed to load user profile. Please refresh the page.');
      }
    };

    loadUserProfile();
  }, [currentUser]);

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const { data: messageData, error: messageError } = await supabase
          .from('ticket_messages')
          .select(`
            *,
            sender:sender_id (
              id,
              email,
              role,
              first_name,
              last_name
            )
          `)
          .eq('ticket_id', ticketId)
          .order('created_at', { ascending: true });

        if (messageError) throw messageError;

        // Strict filtering of internal messages for customers
        const filteredMessages = messageData?.filter(msg => {
          if (currentUser?.role === 'customer') {
            return msg.is_internal !== true;
          }
          return true;
        }) as TicketMessage[];

        setMessages(filteredMessages || []);
      } catch (error) {
        console.error('Error fetching messages:', error);
        toast({
          title: 'Error',
          description: 'Failed to load messages',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Set up realtime subscription
    const channel = supabase
      .channel(`ticket_messages:${ticketId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ticket_messages',
          filter: `ticket_id=eq.${ticketId}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const { data: newMessage, error } = await supabase
              .from('ticket_messages')
              .select(`
                *,
                sender:sender_id (
                  id,
                  email,
                  role,
                  first_name,
                  last_name
                )
              `)
              .eq('id', payload.new.id)
              .single();

            if (!error && newMessage) {
              // Strict filtering for realtime updates
              if (currentUser?.role === 'customer' && newMessage.is_internal === true) {
                return;
              }
              setMessages(prev => [...prev, newMessage as TicketMessage]);
              scrollToBottom();
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId, currentUser?.role, toast]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const onSubmit = async (values: MessageFormValues) => {
    if (!currentUser || !userProfile) return;

    try {
      setSending(true);

      const { error } = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: ticketId,
          sender_id: currentUser.id,
          message: values.content,
          is_internal: values.isInternal,
        });

      if (error) throw error;

      form.reset();
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (profileError) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{profileError}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col h-[600px]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.sender_id === currentUser?.id ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.sender_id === currentUser?.id
                  ? 'bg-primary text-primary-foreground'
                  : message.is_internal
                  ? 'bg-yellow-50 dark:bg-yellow-900/20'
                  : 'bg-muted'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium">
                  {message.sender?.email || 'Unknown User'}
                </span>
                <span className="text-xs opacity-70">
                  {new Date(message.created_at || '').toLocaleTimeString()}
                </span>
                {message.is_internal && (
                  <span className="text-xs bg-yellow-200 dark:bg-yellow-800 px-1.5 py-0.5 rounded">
                    Internal Note
                  </span>
                )}
              </div>
              <p className="whitespace-pre-wrap">{message.message}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t p-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder={
                        userProfile
                          ? 'Type your message...'
                          : 'Loading user profile...'
                      }
                      className="min-h-[80px]"
                      disabled={!userProfile}
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            {currentUser?.role !== 'customer' && (
              <FormField
                control={form.control}
                name="isInternal"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                    </FormControl>
                    <span className="text-sm">Internal note</span>
                  </FormItem>
                )}
              />
            )}

            <div className="flex justify-end">
              <Button type="submit" disabled={sending || !userProfile}>
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                <span className="sr-only">Send message</span>
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
