import { FC, useState, useEffect, useRef } from 'react';
import { useUserStore } from '@/stores/userStore';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Bot } from 'lucide-react';

interface TicketScratchpadProps {
  ticketId: string;
  className?: string;
}

interface InternalNote {
  id: string;
  ticket_id: string;
  author_id: string;
  content: string;
  created_at: string;
  author?: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
    role: 'admin' | 'agent' | 'head_admin';
  };
}

export const TicketScratchpad: FC<TicketScratchpadProps> = ({
  ticketId,
  className
}) => {
  const { currentUser } = useUserStore();
  const [notes, setNotes] = useState<InternalNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel>>();

  useEffect(() => {
    fetchNotes();
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
      .channel(`ticket-notes-${ticketId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ticket_internal_notes',
          filter: `ticket_id=eq.${ticketId}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const { data: noteWithAuthor } = await supabase
              .from('ticket_internal_notes')
              .select(`
                *,
                author:profiles!author_id (
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

            if (noteWithAuthor) {
              setNotes(prev => [...prev, noteWithAuthor as InternalNote]);
              scrollToBottom();
            }
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to internal notes updates');
        }
      });
  };

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('ticket_internal_notes')
        .select(`
          *,
          author:profiles!author_id (
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
      
      setNotes(data || []);
      scrollToBottom();
    } catch (error) {
      console.error('Error fetching internal notes:', error);
      toast({
        title: "Error",
        description: "Failed to load internal notes",
        variant: "destructive"
      });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendNote = async () => {
    if (!newNote.trim() || !currentUser) return;

    setIsSending(true);
    try {
      const noteData = {
        ticket_id: ticketId,
        author_id: currentUser.id,
        content: newNote.trim(),
      };

      const { error } = await supabase
        .from('ticket_internal_notes')
        .insert(noteData);

      if (error) throw error;
      setNewNote('');
    } catch (error) {
      console.error('Error sending internal note:', error);
      toast({
        title: "Error",
        description: "Failed to send note",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleAskAI = async () => {
    toast({
      title: "Coming Soon",
      description: "AI assistance will be available soon!"
    });
  };

  // If user is not a team member, don't render anything
  if (!currentUser?.role || !['admin', 'agent', 'head_admin'].includes(currentUser.role)) {
    return null;
  }

  return (
    <div className={cn("flex flex-col h-[400px] border rounded-lg", className)}>
      <div className="p-3 border-b bg-muted flex items-center justify-between">
        <h3 className="font-semibold">Internal Notes</h3>
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
        {notes.map((note) => {
          const isCurrentUser = note.author_id === currentUser?.id;
          const authorName = note.author?.first_name
            ? `${note.author.first_name} ${note.author.last_name || ''}`
            : note.author?.email;

          return (
            <div
              key={note.id}
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
                    {isCurrentUser ? "You" : authorName}
                  </span>
                  <span className="text-xs bg-primary-foreground/10 px-2 py-0.5 rounded">
                    {note.author?.role}
                  </span>
                </div>
                <p className="whitespace-pre-wrap">{note.content}</p>
                <span className="text-xs opacity-70 mt-1 block">
                  {formatDistanceToNow(new Date(note.created_at), {
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
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendNote();
              }
            }}
            placeholder="Type an internal note..."
            className="min-h-[100px]"
          />
          <div className="flex justify-end">
            <Button
              onClick={handleSendNote}
              disabled={!newNote.trim() || isSending}
            >
              {isSending ? "Sending..." : "Add Note"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}; 