import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import OpenAI from 'https://esm.sh/openai@4.17.4'

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface RequestBody {
  messages: ChatMessage[];
  agentId: string;
  ticketId?: string;
  systemPrompt?: string;
}

serve(async (req) => {
  try {
    // CORS headers
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      })
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('DB_URL') ?? '',
      Deno.env.get('SERVICE_ROLE_KEY') ?? ''
    )

    // Get auth user
    const authHeader = req.headers.get('Authorization')!
    const user = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''))
    if (user.error) throw new Error('Unauthorized')

    // Parse request body
    const { messages, agentId, ticketId, systemPrompt }: RequestBody = await req.json()
    if (!messages?.length || !agentId) {
      throw new Error('Missing required fields')
    }

    // Get AI agent configuration
    const { data: agent, error: agentError } = await supabaseClient
      .from('ai_agents')
      .select('*')
      .eq('id', agentId)
      .single()

    if (agentError || !agent) {
      throw new Error('AI agent not found')
    }

    // Verify organization access
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('organization_id')
      .eq('id', user.data.user?.id)
      .single()

    if (profileError || profile.organization_id !== agent.organization_id) {
      throw new Error('Unauthorized: Organization mismatch')
    }

    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: agent.api_key || Deno.env.get('OPENAI_API_KEY'),
      organization: agent.configuration?.organization_id,
    })

    // Prepare conversation
    const conversation: ChatMessage[] = [
      {
        role: 'system',
        content: systemPrompt || 'You are a helpful customer support AI assistant.',
      },
      ...messages,
    ]

    // Get AI response
    const completion = await openai.chat.completions.create({
      model: agent.model || 'gpt-3.5-turbo',
      messages: conversation,
      temperature: agent.temperature || 0.7,
      max_tokens: agent.max_tokens || 500,
    })

    const response = completion.choices[0].message

    // Save conversation if ticketId is provided
    if (ticketId && response) {
      // Get or create conversation
      const { data: existingConv, error: convError } = await supabaseClient
        .from('ai_conversations')
        .select('id')
        .eq('ticket_id', ticketId)
        .eq('type', 'chat')
        .single()

      let conversationId = existingConv?.id

      if (!conversationId) {
        const { data: newConv, error: createError } = await supabaseClient
          .from('ai_conversations')
          .insert({
            ticket_id: ticketId,
            type: 'chat',
            agent_id: agentId,
            organization_id: profile.organization_id,
          })
          .select('id')
          .single()

        if (createError) throw createError
        conversationId = newConv.id
      }

      // Save AI response
      await supabaseClient
        .from('ai_messages')
        .insert({
          conversation_id: conversationId,
          role: 'assistant',
          content: response.content,
          metadata: {
            model: agent.model,
            confidence: 1.0,
          },
        })
    }

    return new Response(JSON.stringify(response), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
}) 