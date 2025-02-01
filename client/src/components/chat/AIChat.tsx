import { useState, useEffect, useRef } from 'react';
import { Send, Loader2, Bot, Sparkles } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabaseClient';
import { useUserStore } from '@/stores/userStore';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { useToast } from '@/components/ui/use-toast';
import { generateResponse, type Message } from '@/lib/openai';
import type { DbAiAgent, DbAiConversation, DbAiMessage } from '@/types/database';

interface AIChatProps {
  ticketId?: string;
  className?: string;
  systemPrompt?: string;
}

const messageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(2000, 'Message is too long'),
});

type DisplayMessage = {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  created_at: string;
};

// Add type for AI agent configuration
interface AIAgentConfig {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  api_key?: string;
  organization_id?: string;
}

export function AIChat({ ticketId, className, systemPrompt }: AIChatProps) {
  const { currentUser } = useUserStore();
  const { toast } = useToast();
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [aiAgent, setAiAgent] = useState<DbAiAgent | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const form = useForm({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      content: '',
    },
  });

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load AI agent
  useEffect(() => {
    const loadAiAgent = async () => {
      try {
        console.log('Loading AI agent...');
        // First try to get the Support Assistant
        let { data: agent, error } = await supabase
          .from('ai_agents')
          .select()
          .eq('name', 'Support Assistant')
          .limit(1)
          .maybeSingle();

        console.log('Agent query result:', { agent, error });

        if (!agent) {
          console.log('Support Assistant not found, trying to get any active agent...');
          // If not found, get any available AI agent
          const { data: agents, error: agentsError } = await supabase
            .from('ai_agents')
            .select()
            .eq('is_active', true)
            .limit(1);

          console.log('Active agents query result:', { agents, agentsError });

          if (agentsError) throw agentsError;
          if (agents?.length) {
            agent = agents[0];
          }
        }

        if (!agent) {
          console.log('No AI agent found');
          toast({
            title: 'No AI Agent Available',
            description: 'Please contact your administrator to set up an AI agent.',
            variant: 'destructive',
          });
          return;
        }

        console.log('Setting AI agent:', agent);
        setAiAgent(agent);
      } catch (error) {
        console.error('Error loading AI agent:', error);
        toast({
          title: 'Error',
          description: 'Failed to load AI assistant. Please try again later.',
          variant: 'destructive',
        });
      }
    };

    loadAiAgent();
  }, [toast]);

  // Load conversation history if ticketId is provided
  useEffect(() => {
    const loadConversation = async () => {
      if (!ticketId) return;
      
      try {
        // First get or create the conversation
        const { data: conversation, error: convError } = await supabase
          .from('ai_conversations')
          .select('id')
          .eq('ticket_id', ticketId)
          .eq('type', 'chat')
          .single();

        if (convError && convError.code !== 'PGRST116') { // Not found error
          throw convError;
        }

        let conversationId = conversation?.id;

        if (!conversationId) {
          // Create new conversation
          const { data: newConv, error: createError } = await supabase
            .from('ai_conversations')
            .insert({
              ticket_id: ticketId,
              type: 'chat',
              agent_id: aiAgent?.id,
            } as DbAiConversation)
            .select('id')
            .single();

          if (createError) throw createError;
          conversationId = newConv.id;
        }

        // Now get the messages
        const { data: messages, error: msgError } = await supabase
          .from('ai_messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });

        if (msgError) throw msgError;

        // Convert to display format
        const displayMessages = messages?.map(msg => ({
          id: msg.id,
          content: msg.content,
          role: msg.role as 'user' | 'assistant',
          created_at: msg.created_at || new Date().toISOString(),
        })) || [];

        setMessages(displayMessages);
      } catch (error) {
        console.error('Error loading conversation:', error);
        toast({
          title: 'Error',
          description: 'Failed to load conversation history',
          variant: 'destructive',
        });
      }
    };

    if (aiAgent) {
      loadConversation();
    }
  }, [ticketId, toast, aiAgent]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const onSubmit = async (values: { content: string }) => {
    if (!currentUser || !aiAgent) return;

    try {
      // Get or create conversation
      const { data: conversation, error: convError } = await supabase
        .from('ai_conversations')
        .select('id')
        .eq('ticket_id', ticketId)
        .eq('type', 'chat')
        .single();

      if (convError && convError.code !== 'PGRST116') throw convError;

      let conversationId = conversation?.id;

      if (!conversationId) {
        const { data: newConv, error: createError } = await supabase
          .from('ai_conversations')
          .insert({
            ticket_id: ticketId,
            type: 'chat',
            agent_id: aiAgent.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as DbAiConversation)
          .select('id')
          .single();

        if (createError) throw createError;
        conversationId = newConv.id;
      }

      // Add user message
      const userMessage: DisplayMessage = {
        id: crypto.randomUUID(),
        content: values.content,
        role: 'user',
        created_at: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, userMessage]);
      form.reset();
      setIsTyping(true);
      scrollToBottom();

      // Save user message
      await supabase
        .from('ai_messages')
        .insert({
          id: crypto.randomUUID(),
          conversation_id: conversationId,
          role: 'user',
          content: values.content,
          created_at: new Date().toISOString(),
          source_message_type: null,
          source_message_id: null,
          agent_response_id: null,
          metadata: {},
        } as unknown as DbAiMessage);

      // Format conversation for AI
      const aiMessages: Message[] = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      // Add the new user message
      aiMessages.push({
        role: 'user',
        content: values.content,
      });

      // Get AI response
      const response = await generateResponse(
        aiAgent,
        aiMessages,
        systemPrompt
      );

      if (response?.content) {
        const aiMessage: DisplayMessage = {
          id: crypto.randomUUID(),
          content: response.content,
          role: 'assistant',
          created_at: new Date().toISOString(),
        };

        setMessages(prev => [...prev, aiMessage]);
        scrollToBottom();

        // Save AI response
        await supabase
          .from('ai_messages')
          .insert({
            id: crypto.randomUUID(),
            conversation_id: conversationId,
            role: 'assistant',
            content: response.content,
            created_at: new Date().toISOString(),
            source_message_type: null,
            source_message_id: null,
            agent_response_id: null,
            metadata: {
              model: aiAgent.model,
              confidence: 1.0,
            },
          } as unknown as DbAiMessage);
      }
    } catch (error) {
      console.error('Error in AI chat:', error);
      toast({
        title: 'Error',
        description: 'Failed to get AI response',
        variant: 'destructive',
      });
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className={`flex flex-col h-[600px] ${className}`}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-blue-50 dark:bg-blue-900/20'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium">
                  {message.role === 'assistant' ? (
                    <div className="flex items-center gap-1">
                      <Bot className="h-4 w-4" />
                      <span>AI Assistant</span>
                    </div>
                  ) : (
                    'You'
                  )}
                </span>
                <span className="text-xs opacity-70">
                  {new Date(message.created_at).toLocaleTimeString()}
                </span>
              </div>
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}
        {isTyping && (
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
                      placeholder="Ask me anything..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button 
                type="submit" 
                disabled={isTyping || !aiAgent}
                className="gap-2"
              >
                {isTyping ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Send</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
} 