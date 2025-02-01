import OpenAI from 'openai';
import { Database } from '@/types/supabase';

type AIAgent = Database['public']['Tables']['ai_agents']['Row'];
type AIConfig = {
  api_key?: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  organization_id?: string;
};

export type Message = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

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

export const createOpenAIClient = (agent: AIAgent) => {
  const config = agent.configuration as AIConfig;
  return new OpenAI({
    apiKey: config?.api_key || process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    organization: config?.organization_id,
  });
};

export const generateResponse = async (
  agent: AIAgent,
  messages: Message[],
  options?: {
    temperature?: number;
    maxTokens?: number;
  }
) => {
  const openai = createOpenAIClient(agent);
  const config = agent.configuration as AIConfig;
  
  try {
    const completion = await openai.chat.completions.create({
      model: config?.model || 'gpt-4',
      messages,
      temperature: options?.temperature ?? config?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? config?.max_tokens ?? 1000,
    });

    return completion.choices[0].message;
  } catch (error) {
    console.error('Error generating AI response:', error);
    throw error;
  }
}; 