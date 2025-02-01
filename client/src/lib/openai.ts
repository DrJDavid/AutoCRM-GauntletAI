import { supabase } from './supabaseClient';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import type { DbAiAgent } from '@/types/database';

export type Message = ChatCompletionMessageParam;

export interface AIConfig {
  api_key?: string;
  organization_id?: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

export const defaultSystemPrompt = `You are an AI customer service agent for AutoCRM, a modern customer relationship management system. Your core responsibilities are:

1. Customer Support:
   - Provide clear, concise, and professional responses
   - Focus on solving the customer's immediate problem
   - Maintain a friendly yet professional tone
   - Use simple language and avoid technical jargon unless necessary

2. Information Management:
   - Reference ticket history when available
   - Keep track of context within the conversation
   - Ask clarifying questions when needed
   - Summarize complex issues clearly

3. Problem Resolution:
   - Offer step-by-step solutions when applicable
   - Provide workarounds when direct solutions aren't available
   - Escalate to human agents when necessary
   - Follow up to ensure issues are resolved

4. Best Practices:
   - Prioritize customer satisfaction and experience
   - Maintain confidentiality and data privacy
   - Be transparent about being an AI assistant
   - Stay within your knowledge boundaries

5. Communication Style:
   - Be empathetic and understanding
   - Use positive language
   - Acknowledge customer frustrations
   - Keep responses focused and relevant

If you're unsure about something or need more information, always ask for clarification rather than making assumptions.`;

export async function generateResponse(
  agent: DbAiAgent,
  messages: Message[],
  systemPrompt?: string
) {
  try {
    // In development, use the local Edge Function
    if (process.env.NODE_ENV === 'development') {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('http://127.0.0.1:54321/functions/v1/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          messages,
          agentId: agent.id,
          systemPrompt: systemPrompt || defaultSystemPrompt,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to get AI response');
      }

      return await response.json();
    }

    // In production, use Supabase Edge Functions
    const { data, error } = await supabase.functions.invoke('ai-chat', {
      body: {
        messages,
        agentId: agent.id,
        systemPrompt: systemPrompt || defaultSystemPrompt,
      },
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error generating AI response:', error);
    throw error;
  }
} 