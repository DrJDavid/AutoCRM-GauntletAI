import { FC, useState, useEffect, useRef } from 'react';
import { useUserStore } from '@/stores/userStore';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import type { DbTicketMessage, DbProfile } from '@/types/database';

interface TicketChatProps {
  ticketId: string;
  mode: 'admin' | 'agent' | 'customer';
  className?: string;
}

// Define a simpler profile type that matches what we get from the database
interface MessageSender {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  role: 'admin' | 'agent' | 'customer' | 'head_admin';
}

interface Message extends Omit<DbTicketMessage, 'sender'> {
  sender?: MessageSender;
  created_at: string; // Make this required
}

export const TicketChat: FC<TicketChatProps> = ({
  ticketId,
  mode,
  className
}) => {
  const { currentUser } = useUserStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const channelRef = useRef<ReturnType<typeof supabase.channel>>();

  useEffect(() => {
    fetchMessages();
    setupRealtimeSubscription();
    
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [ticketId]);

  const setupRealtimeSubscription = () => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    channelRef.current = supabase
      .channel(`ticket-${ticketId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all changes
          schema: 'public',
          table: 'ticket_messages',
          filter: `ticket_id=eq.${ticketId}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const { data: messageWithSender } = await supabase
              .from('ticket_messages')
              .select(`
                *,
                sender:profiles!sender_id (
                  id,
                  email,
                  first_name,
                  last_name,
                  avatar_url,
                  role
                )
              `)
              .eq('id', payload.new.id)
              .single();

            if (messageWithSender && messageWithSender.created_at) {
              setMessages(prev => [...prev, messageWithSender as Message]);
              scrollToBottom();
            }
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to chat updates');
        }
      });
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('ticket_messages')
        .select(`
          *,
          sender:profiles!sender_id (
            id,
            email,
            first_name,
            last_name,
            avatar_url,
            role
          )
        `)
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Ensure all required fields are present and cast to Message type
      const validMessages = (data || [])
        .filter(msg => msg && msg.id && msg.created_at && msg.message)
        .map(msg => ({
          ...msg,
          created_at: msg.created_at || new Date().toISOString(),
        })) as Message[];
      
      setMessages(validMessages);
      scrollToBottom();
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive"
      });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentUser) return;

    setIsSending(true);
    try {
      const messageData = {
        ticket_id: ticketId,
        sender_id: currentUser.id,
        message: newMessage.trim(),
        is_internal: isInternalNote && (mode === 'admin' || mode === 'agent'),
      };

      const { data: newMessageData, error } = await supabase
        .from('ticket_messages')
        .insert(messageData)
        .select(`
          *,
          sender:profiles!sender_id (
            id,
            email,
            first_name,
            last_name,
            avatar_url,
            role
          )
        `)
        .single();

      if (error) throw error;

      if (newMessageData && newMessageData.created_at) {
        setMessages(prev => [...prev, newMessageData as Message]);
        scrollToBottom();
      }

      setNewMessage('');
      setIsInternalNote(false);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      // TODO: Implement typing indicator through Supabase realtime
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      // TODO: Clear typing indicator
    }, 1000);
  };

  return (
    <div className={cn("flex flex-col h-[600px]", className)}>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const isCurrentUser = message.sender_id === currentUser?.id;
          const isInternal = message.is_internal;
          const senderName = message.sender?.first_name
            ? `${message.sender.first_name} ${message.sender.last_name || ''}`
            : message.sender?.email;

          return (
            <div
              key={message.id}
              className={cn(
                "flex",
                isCurrentUser ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-lg p-4",
                  isCurrentUser
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted",
                  isInternal && "border-l-4 border-yellow-500"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">
                    {isCurrentUser ? "You" : senderName}
                  </span>
                  {message.sender?.role !== 'customer' && (
                    <span className="text-xs bg-primary-foreground/10 px-2 py-0.5 rounded">
                      {message.sender?.role}
                    </span>
                  )}
                  {isInternal && (
                    <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded">
                      Internal Note
                    </span>
                  )}
                </div>
                <p className="whitespace-pre-wrap">{message.message}</p>
                <span className="text-xs opacity-70 mt-1 block">
                  {formatDistanceToNow(new Date(message.created_at), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t">
        <div className="flex flex-col space-y-4">
          <Textarea
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Type your message..."
            className="min-h-[100px]"
          />
          <div className="flex items-center justify-between">
            {(mode === 'admin' || mode === 'agent') && (
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={isInternalNote}
                  onChange={(e) => setIsInternalNote(e.target.checked)}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm">Internal Note</span>
              </label>
            )}
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || isSending}
            >
              {isSending ? "Sending..." : "Send Message"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}; 