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
import type { Message } from '@/db/types/database';

interface TicketChatProps {
  ticketId: string;
}

const messageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(2000, 'Message is too long'),
});

type MessageFormValues = z.infer<typeof messageSchema>;

export function TicketChat({ ticketId }: TicketChatProps) {
  const { currentUser } = useUserStore();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const form = useForm<MessageFormValues>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      content: '',
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
        // First fetch messages
        const { data: messageData, error: messageError } = await supabase
          .from('messages')
          .select('*')
          .eq('ticket_id', ticketId)
          .order('created_at', { ascending: true });

        if (messageError) throw messageError;

        // Then fetch user data for each message
        const messagesWithUsers = await Promise.all(
          (messageData || []).map(async (message) => {
            const { data: userData, error: userError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', message.user_id)
              .single();

            if (userError) {
              console.error('Error fetching user:', userError);
              return { ...message, user: null };
            }

            return { ...message, user: userData };
          })
        );

        setMessages(messagesWithUsers);
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
  }, [ticketId, toast]);

  // Subscribe to new messages
  useEffect(() => {
    const channel = supabase
      .channel(`messages:${ticketId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `ticket_id=eq.${ticketId}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT' && payload.new.user_id !== currentUser?.id) {
            // Only fetch user data for messages from other users
            const { data: userData, error: userError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', payload.new.user_id)
              .single();

            if (!userError && userData) {
              const newMessage = { ...payload.new, user: userData };
              setMessages((prev) => [...prev, newMessage]);
              scrollToBottom();
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId, currentUser?.id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const onSubmit = async (values: MessageFormValues) => {
    if (!currentUser || !userProfile) return;

    try {
      setSending(true);

      // Create optimistic message
      const optimisticMessage: Message = {
        id: crypto.randomUUID(),
        ticket_id: ticketId,
        user_id: currentUser.id,
        content: values.content,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user: userProfile,
      };

      // Add optimistic message to state
      setMessages((prev) => [...prev, optimisticMessage]);
      scrollToBottom();

      // Reset form early for better UX
      form.reset();

      // Actually send the message
      const { error } = await supabase.from('messages').insert({
        ticket_id: ticketId,
        user_id: currentUser.id,
        content: values.content,
      });

      if (error) {
        // Remove optimistic message on error
        setMessages((prev) => prev.filter((msg) => msg.id !== optimisticMessage.id));
        throw error;
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
      // Re-populate the form with the failed message
      form.setValue('content', values.content);
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
              message.user_id === currentUser?.id ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.user_id === currentUser?.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium">
                  {message.user?.email || 'Unknown User'}
                </span>
                <span className="text-xs opacity-70">
                  {new Date(message.created_at).toLocaleTimeString()}
                </span>
              </div>
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t p-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-2">
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem className="flex-1">
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
            <Button 
              type="submit" 
              className="self-end" 
              disabled={sending || !userProfile}
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span className="sr-only">Send message</span>
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
