import { useState, useEffect, useRef } from 'react';
import { Send, Loader2, AlertCircle, Bot, Sparkles } from 'lucide-react';
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
import { generateResponse, type Message } from '@/lib/openai';
import type { TicketMessage, MessageType, MessageMetadata } from '@/features/tickets/types';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import type { Database } from '@/types/supabase';

type Ticket = Database['public']['Tables']['tickets']['Row'];

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
  const [aiAgent, setAiAgent] = useState<any>(null);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const form = useForm<MessageFormValues>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      content: '',
      isInternal: false,
    },
  });

  // Load ticket data
  useEffect(() => {
    const loadTicket = async () => {
      try {
        const { data, error } = await supabase
          .from('tickets')
          .select('*')
          .eq('id', ticketId)
          .single();

        if (error) throw error;
        setTicket(data);
      } catch (error) {
        console.error('Error loading ticket:', error);
      }
    };

    loadTicket();
  }, [ticketId]);

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

  // Load AI agent
  useEffect(() => {
    const loadAiAgent = async () => {
      try {
        const { data: agent, error } = await supabase
          .from('ai_agents')
          .select()
          .eq('name', 'CLI Test Agent')
          .single();

        if (error) throw error;
        setAiAgent(agent);
      } catch (error) {
        console.error('Error loading AI agent:', error);
      }
    };

    loadAiAgent();
  }, []);

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

  const handleAiResponse = async () => {
    if (!aiAgent || !currentUser || messages.length === 0 || !ticket) return;

    try {
      setIsAiTyping(true);

      // Format messages for AI
      const aiMessages: ChatCompletionMessageParam[] = messages.map(msg => ({
        role: msg.message_type === 'ai_response' ? 'assistant' : 'user',
        content: msg.message
      }));

      // Add ticket context to system prompt
      const systemPrompt = `You are a helpful customer support AI assistant. You are helping with a support ticket.
Current ticket context:
- Status: ${ticket.status}
- Priority: ${ticket.priority}
${ticket.metadata && typeof ticket.metadata === 'object' && 'category' in ticket.metadata ? `- Category: ${ticket.metadata.category}` : ''}
- Created: ${ticket.created_at ? new Date(ticket.created_at).toLocaleString() : 'Unknown'}

Please provide helpful, accurate responses based on this context.`;

      // Get AI response
      const response = await generateResponse(
        { config: aiAgent.configuration },
        aiMessages,
        systemPrompt
      );

      if (response?.content) {
        // Save AI response as ticket message
        const metadata: MessageMetadata = {
          ai_generated: true,
          type: 'ai_response',
          model: aiAgent.configuration?.model,
          confidence: 1.0,
          context: {
            ticket_id: ticketId,
            prompt: systemPrompt
          }
        };

        const { error } = await supabase
          .from('ticket_messages')
          .insert({
            ticket_id: ticketId,
            sender_id: aiAgent.id,
            message: response.content,
            is_internal: false,
            message_type: 'ai_response',
            metadata
          });

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      toast({
        title: 'Error',
        description: 'Failed to get AI response',
        variant: 'destructive',
      });
    } finally {
      setIsAiTyping(false);
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
                  : message.message_type === 'ai_response'
                  ? 'bg-blue-50 dark:bg-blue-900/20'
                  : 'bg-muted'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium">
                  {message.message_type === 'ai_response' ? (
                    <div className="flex items-center gap-1">
                      <Bot className="h-4 w-4" />
                      <span>AI Assistant</span>
                    </div>
                  ) : (
                    message.sender?.email || 'Unknown User'
                  )}
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
        {isAiTyping && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Bot className="h-4 w-4 animate-pulse" />
            <span>AI is typing...</span>
          </div>
        )}
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
              <div className="flex items-center justify-between">
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
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAiResponse}
                  disabled={isAiTyping || !aiAgent}
                  className="gap-2"
                >
                  {isAiTyping ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  Get AI Response
                </Button>
              </div>
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
