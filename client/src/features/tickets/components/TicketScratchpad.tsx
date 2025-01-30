import { FC, useState, useEffect, useRef } from 'react';
import { useUserStore } from '@/stores/userStore';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Bot } from 'lucide-react';
import type { DbTicketMessage, DbProfile } from '@/types/database';

interface TicketScratchpadProps {
  ticketId: string;
  className?: string;
}

interface ScratchpadMessage extends Omit<DbTicketMessage, 'sender'> {
  sender?: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
    role: 'admin' | 'agent' | 'customer' | 'head_admin';
  };
  created_at: string;
}

export const TicketScratchpad: FC<TicketScratchpadProps> = ({
  ticketId,
  className
}) => {
  const { currentUser } = useUserStore();
  const [messages, setMessages] = useState<ScratchpadMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
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
      .channel(`ticket-scratchpad-${ticketId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ticket_messages',
          filter: `ticket_id=eq.${ticketId} AND is_internal=eq.true`,
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
              setMessages(prev => [...prev, messageWithSender as ScratchpadMessage]);
              scrollToBottom();
            }
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to scratchpad updates');
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
        .eq('is_internal', true)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      const validMessages = (data || [])
        .filter(msg => msg && msg.id && msg.created_at && msg.message)
        .map(msg => ({
          ...msg,
          created_at: msg.created_at || new Date().toISOString(),
        })) as ScratchpadMessage[];
      
      setMessages(validMessages);
      scrollToBottom();
    } catch (error) {
      console.error('Error fetching scratchpad messages:', error);
      toast({
        title: "Error",
        description: "Failed to load scratchpad messages",
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
        is_internal: true,
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
        setMessages(prev => [...prev, newMessageData as ScratchpadMessage]);
        scrollToBottom();
      }

      setNewMessage('');
    } catch (error) {
      console.error('Error sending scratchpad message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleAskAI = async () => {
    // TODO: Implement AI agent assistance
    toast({
      title: "Coming Soon",
      description: "AI assistance will be available soon!"
    });
  };

  return (
    <div className={cn("flex flex-col h-[400px] border rounded-lg", className)}>
      <div className="p-3 border-b bg-muted flex items-center justify-between">
        <h3 className="font-semibold">Internal Scratchpad</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={handleAskAI}
          className="gap-2"
        >
          <Bot className="w-4 h-4" />
          Ask AI for help
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const isCurrentUser = message.sender_id === currentUser?.id;
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
                    : "bg-muted"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">
                    {isCurrentUser ? "You" : senderName}
                  </span>
                  <span className="text-xs bg-primary-foreground/10 px-2 py-0.5 rounded">
                    {message.sender?.role}
                  </span>
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
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Type an internal note..."
            className="min-h-[100px]"
          />
          <div className="flex justify-end">
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || isSending}
            >
              {isSending ? "Sending..." : "Add Note"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}; 