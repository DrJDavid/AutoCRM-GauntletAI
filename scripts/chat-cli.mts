import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { createInterface } from 'readline';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import type { Database } from '../client/src/types/supabase';
import { generateResponse, type Message, defaultSystemPrompt } from '../client/src/lib/openai.mts';

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

type TicketWithRelations = Database['public']['Tables']['tickets']['Row'] & {
  customer: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  } | null;
  agent: {
    first_name: string | null;
    last_name: string | null;
  } | null;
  messages: Array<{
    message: string;
    created_at: string | null;
    sender: {
      first_name: string | null;
      last_name: string | null;
      role: string;
    };
  }>;
  internal_notes: Array<{
    content: string;
    created_at: string | null;
    author: {
      first_name: string | null;
      last_name: string | null;
      role: string;
    };
  }>;
};

async function signIn() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'david.johnson@gauntletai.com',
    password: 'Testpass123!'
  });

  if (error) {
    console.error('Error signing in:', error);
    process.exit(1);
  }

  return data;
}

async function loadTicketContext(ticketId?: string): Promise<TicketWithRelations[] | null> {
  if (!ticketId) {
    // Get the most recent tickets if no specific ticket is provided
    const { data: tickets, error } = await supabase
      .from('tickets')
      .select(`
        *,
        customer:profiles!tickets_customer_id_fkey (
          first_name,
          last_name,
          email
        ),
        agent:profiles!tickets_assigned_to_fkey (
          first_name,
          last_name
        ),
        messages:ticket_messages (
          message,
          created_at,
          sender:profiles!ticket_messages_sender_id_fkey (
            first_name,
            last_name,
            role
          )
        ),
        internal_notes:ticket_internal_notes (
          content,
          created_at,
          author:profiles!ticket_internal_notes_author_id_fkey (
            first_name,
            last_name,
            role
          )
        )
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error loading tickets:', error);
      return null;
    }

    return tickets as TicketWithRelations[];
  }

  // Get specific ticket details
  const { data: ticket, error } = await supabase
    .from('tickets')
    .select(`
      *,
      customer:profiles!tickets_customer_id_fkey (
        first_name,
        last_name,
        email
      ),
      agent:profiles!tickets_assigned_to_fkey (
        first_name,
        last_name
      ),
      messages:ticket_messages (
        message,
        created_at,
        sender:profiles!ticket_messages_sender_id_fkey (
          first_name,
          last_name,
          role
        )
      ),
      internal_notes:ticket_internal_notes (
        content,
        created_at,
        author:profiles!ticket_internal_notes_author_id_fkey (
          first_name,
          last_name,
          role
        )
      )
    `)
    .eq('id', ticketId)
    .single();

  if (error) {
    console.error('Error loading ticket:', error);
    return null;
  }

  return ticket ? [ticket as TicketWithRelations] : null;
}

function formatTicketContext(tickets: any[] | null) {
  if (!tickets || tickets.length === 0) return '';

  return tickets.map(ticket => `
Ticket #${ticket.id}
Status: ${ticket.status}
Priority: ${ticket.priority}
Title: ${ticket.title}
Customer: ${ticket.customer?.first_name} ${ticket.customer?.last_name} (${ticket.customer?.email})
${ticket.agent ? `Assigned to: ${ticket.agent.first_name} ${ticket.agent.last_name}` : 'Unassigned'}

Description:
${ticket.description || 'No description provided'}

Messages:
${ticket.messages?.map((msg: any) => 
  `[${new Date(msg.created_at).toLocaleString()}] ${msg.sender.first_name} ${msg.sender.last_name} (${msg.sender.role}):
  ${msg.message}`
).join('\n') || 'No messages'}

Internal Notes:
${ticket.internal_notes?.map((note: any) =>
  `[${new Date(note.created_at).toLocaleString()}] ${note.author.first_name} ${note.author.last_name}:
  ${note.content}`
).join('\n') || 'No internal notes'}
`).join('\n---\n');
}

async function main() {
  console.log('🔑 Signing in...');
  await signIn();
  console.log('✨ Signed in successfully');

  console.log('\n🔄 Initializing AI agent...');
  
  // First, get the organization
  const { data: org } = await supabase
    .from('organizations')
    .select()
    .limit(1)
    .single();

  if (!org) {
    console.error('No organization found. Please create one first.');
    process.exit(1);
  }
  
  // Get or create test AI agent
  const { data: agent, error: fetchError } = await supabase
    .from('ai_agents')
    .select()
    .eq('name', 'CLI Test Agent')
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error('Error fetching agent:', fetchError);
    process.exit(1);
  }

  const finalAgent = agent || await createAgent(org.id);
  if (!finalAgent) {
    console.error('Failed to initialize AI agent');
    process.exit(1);
  }

  console.log('📝 Loading ticket context...');
  const tickets = await loadTicketContext();
  const ticketContext = formatTicketContext(tickets);

  console.log('✨ AI agent ready!');
  console.log('\n🤖 AutoCRM AI Chat CLI');
  console.log('Commands:');
  console.log('  /ticket <id> - Load a specific ticket');
  console.log('  /latest - Load latest tickets');
  console.log('  /clear - Clear conversation history');
  console.log('  exit - Quit the chat\n');

  const messages: Message[] = [
    { role: 'system', content: `${defaultSystemPrompt}\n\nCurrent Ticket Context:\n${ticketContext}` }
  ];

  const askQuestion = () => {
    rl.question('You: ', async (input) => {
      if (input.toLowerCase() === 'exit') {
        console.log('\n👋 Goodbye!');
        rl.close();
        return;
      }

      // Handle commands
      if (input.startsWith('/')) {
        const [command, ...args] = input.slice(1).split(' ');
        
        switch (command) {
          case 'ticket':
            const ticketId = args[0];
            console.log('📝 Loading ticket context...');
            const ticket = await loadTicketContext(ticketId);
            const newTicketContext = formatTicketContext(ticket);
            messages[0].content = `${defaultSystemPrompt}\n\nCurrent Ticket Context:\n${newTicketContext}`;
            console.log('✨ Ticket context updated');
            break;
            
          case 'latest':
            console.log('📝 Loading latest tickets...');
            const latestTickets = await loadTicketContext();
            const latestContext = formatTicketContext(latestTickets);
            messages[0].content = `${defaultSystemPrompt}\n\nCurrent Ticket Context:\n${latestContext}`;
            console.log('✨ Ticket context updated');
            break;
            
          case 'clear':
            messages.splice(1); // Keep the system message
            console.log('🧹 Conversation history cleared');
            break;
            
          default:
            console.log('❌ Unknown command');
        }
        
        askQuestion();
        return;
      }

      messages.push({ role: 'user', content: input });

      try {
        const response = await generateResponse(finalAgent, messages);
        if (response?.content) {
          console.log('\n🤖:', response.content, '\n');
          messages.push({ role: 'assistant', content: response.content });
        }
      } catch (error) {
        console.error('❌ Error:', error);
      }

      askQuestion();
    });
  };

  askQuestion();
}

async function createAgent(organizationId: string) {
  console.log('Creating new AI agent...');
  
  const { data: newAgent, error } = await supabase
    .from('ai_agents')
    .insert({
      name: 'CLI Test Agent',
      organization_id: organizationId,
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
    return null;
  }

  return newAgent;
}

main().catch(console.error); 