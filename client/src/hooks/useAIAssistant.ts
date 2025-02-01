import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/stores/userStore';

interface AIMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
  source_message_id?: string;
  source_message_type?: 'chat' | 'internal';
}

interface AIConversation {
  id: string;
  ticket_id: string;
  type: 'chat' | 'internal';
  summary?: string;
  last_context_window?: string;
}

interface UseAIAssistantProps {
  ticketId: string;
  type: 'chat' | 'internal';
}

export function useAIAssistant({ ticketId, type }: UseAIAssistantProps) {
  const { currentUser } = useUserStore();
  const [conversation, setConversation] = useState<AIConversation | null>(null);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Get or create conversation
  const initializeConversation = useCallback(async () => {
    try {
      // First try to get existing conversation
      let { data: existingConversation, error: fetchError } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('ticket_id', ticketId)
        .eq('type', type)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw fetchError;
      }

      if (!existingConversation) {
        // Create new conversation if none exists
        const { data: newConversation, error: createError } = await supabase
          .from('ai_conversations')
          .insert({
            ticket_id: ticketId,
            type,
          })
          .select()
          .single();

        if (createError) throw createError;
        existingConversation = newConversation;
      }

      setConversation(existingConversation);

      // Load messages
      const { data: messageData, error: messageError } = await supabase
        .from('ai_messages')
        .select('*')
        .eq('conversation_id', existingConversation.id)
        .order('created_at', { ascending: true });

      if (messageError) throw messageError;
      setMessages(messageData || []);

    } catch (err) {
      setError(err as Error);
      console.error('Error initializing AI conversation:', err);
    }
  }, [ticketId, type]);

  // Set up realtime subscription for messages
  useEffect(() => {
    if (!conversation) return;

    const channel = supabase
      .channel(`ai-conversation-${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ai_messages',
          filter: `conversation_id=eq.${conversation.id}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            setMessages(prev => [...prev, payload.new as AIMessage]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversation]);

  // Initialize on mount
  useEffect(() => {
    initializeConversation();
  }, [initializeConversation]);

  // Function to ask the AI a question
  const askQuestion = async (
    question: string,
    sourceMessageId?: string,
    sourceMessageType?: 'chat' | 'internal'
  ) => {
    if (!conversation || !currentUser) return;

    setIsLoading(true);
    setError(null);

    try {
      // Add user's question to the conversation
      const { error: questionError } = await supabase
        .from('ai_messages')
        .insert({
          conversation_id: conversation.id,
          role: 'user',
          content: question,
          source_message_id: sourceMessageId,
          source_message_type: sourceMessageType,
        });

      if (questionError) throw questionError;

      // TODO: Call AI service to get response
      // For now, just simulate a response
      const { error: responseError } = await supabase
        .from('ai_messages')
        .insert({
          conversation_id: conversation.id,
          role: 'assistant',
          content: `[AI Response to: ${question}]`,
        });

      if (responseError) throw responseError;
    } catch (err) {
      setError(err as Error);
      console.error('Error asking AI question:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    messages,
    isLoading,
    error,
    askQuestion,
  };
} 