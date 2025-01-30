import { supabase } from '../mocks/supabase';
import type { Database } from '@/types/supabase';
import type { CreateTicketForm, UpdateTicketForm } from '@/types';

type Tables = Database['public']['Tables'];
type Ticket = Tables['tickets']['Row'];
type TicketMessage = Tables['ticket_messages']['Row'];

// Mock user IDs for testing
const MOCK_USER_ID = 'mock-user-id';
const MOCK_ORG_ID = 'mock-org-id';

export async function createTestTicket(data: CreateTicketForm) {
  const { data: ticket, error } = await supabase
    .from('tickets')
    .insert({
      title: data.title,
      description: data.description,
      priority: data.priority,
      category: data.category,
      status: 'open',
      customer_id: MOCK_USER_ID,
      organization_id: MOCK_ORG_ID,
      assigned_to: null,
      metadata: null,
      closed_at: null,
      last_activity_at: new Date().toISOString()
    })
    .select('*')
    .single();

  if (error) throw error;
  return ticket;
}

export async function updateTestTicket(id: string, data: UpdateTicketForm) {
  const updateData = {
    ...data,
    last_activity_at: new Date().toISOString(),
    closed_at: data.status === 'closed' ? new Date().toISOString() : null
  };

  const { data: ticket, error } = await supabase
    .from('tickets')
    .update({
      ...updateData,
      last_activity_at: new Date().toISOString(),
      closed_at: updateData.status === 'closed' ? new Date().toISOString() : null
    })
    .eq('id', id)
    .select(`
      *,
      customer:profiles!tickets_customer_id_fkey(*),
      assigned_to:profiles!tickets_assigned_to_fkey(*),
      messages:ticket_messages(*)
    `)
    .single();

  if (error) throw error;
  return ticket;
}

export async function deleteTestTicket(id: string) {
  const { error } = await supabase
    .from('tickets')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function addTestMessage(ticketId: string, message: string, isInternal = false) {
  const { data, error } = await supabase
    .from('ticket_messages')
    .insert({
      ticket_id: ticketId,
      message,
      is_internal: isInternal,
      sender_id: MOCK_USER_ID,
      metadata: null
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function getTestTicket(id: string) {
  const { data, error } = await supabase
    .from('tickets')
    .select(`
      *,
      customer:profiles!tickets_customer_id_fkey(*),
      assigned_to:profiles!tickets_assigned_to_fkey(*),
      messages:ticket_messages(*)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function cleanupTestTickets(customerIds: string[]) {
  const { error } = await supabase
    .from('tickets')
    .delete()
    .in('customer_id', customerIds);

  if (error) throw error;
} 