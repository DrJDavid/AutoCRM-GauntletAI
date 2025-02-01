import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { createInterface } from 'readline';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { Database } from '../client/src/types/supabase';
import { generateResponse, Message, defaultSystemPrompt } from '../client/src/lib/openai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config();

const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

async function main() {
  // Get or create test AI agent
  const { data: agent } = await supabase
    .from('ai_agents')
    .select()
    .eq('name', 'CLI Test Agent')
    .single();

  if (!agent) {
    const { data: newAgent, error } = await supabase
      .from('ai_agents')
      .insert({
        name: 'CLI Test Agent',
        organization_id: process.env.ORGANIZATION_ID!,
        configuration: {
          api_key: process.env.OPENAI_API_KEY,
          model: 'gpt-4',
          temperature: 0.7,
          max_tokens: 1000
        }
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating agent:', error);
      process.exit(1);
    }
  }

  console.log('🤖 AutoCRM AI Chat CLI');
  console.log('Type your message and press Enter. Type "exit" to quit.\n');

  const messages: Message[] = [
    { role: 'system', content: defaultSystemPrompt }
  ];

  const askQuestion = () => {
    rl.question('You: ', async (input) => {
      if (input.toLowerCase() === 'exit') {
        rl.close();
        return;
      }

      messages.push({ role: 'user', content: input });

      try {
        const response = await generateResponse(agent!, messages);
        if (response?.content) {
          console.log('\nAI:', response.content, '\n');
          messages.push({ role: 'assistant', content: response.content });
        }
      } catch (error) {
        console.error('Error:', error);
      }

      askQuestion();
    });
  };

  askQuestion();
}

main().catch(console.error); 