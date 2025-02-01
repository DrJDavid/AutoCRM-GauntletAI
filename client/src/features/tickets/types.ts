import type { Database } from '@/types/supabase';

export type MessageType = 'user' | 'ai_response' | 'system';

export interface MessageMetadata {
  ai_generated?: boolean;
  type?: string;
  model?: string;
  confidence?: number;
  context?: Record<string, any>;
}

export interface MessageSender {
  id: string;
  email: string;
  role: string;
  first_name: string | null;
  last_name: string | null;
}

export type TicketMessage = Omit<Database['public']['Tables']['ticket_messages']['Row'], 'metadata'> & {
  sender?: MessageSender;
  message_type: MessageType;
  metadata?: MessageMetadata;
} 